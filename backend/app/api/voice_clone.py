"""Voice cloning / TTS endpoint (fal-ai/chatterbox).

Users provide text (plus optional 5-10 sec reference audio) and receive a WAV
audio file of that voice reading the text. Supports emotive tags like
`<laugh>`, `<sigh>`, `<whisper>` inside the text.
"""

import base64
import logging
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.config import Settings, get_settings
from app.core.legal import is_admin
from app.models.schemas import (
    GenerationResponse,
    JobStatus,
    VoiceCloneRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/generate", tags=["voice-clone"])

PLAN_RANK = {"free": 0, "lite": 1, "basic": 2, "pro": 3, "unlimited": 4, "studio": 5}


async def _auth_and_profile(request: Request, settings: Settings):
    from app.services.supabase import get_supabase, get_user_profile

    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = auth_header.split(" ", 1)[1]
    supabase = get_supabase(settings)
    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return user, profile, supabase


def _calc_voice_clone_credits(text_len: int) -> int:
    """Flat 20 credits for first 500 chars, +10 per additional 500."""
    if text_len <= 500:
        return 20
    extra_blocks = (text_len - 1) // 500  # 501->1, 1000->1, 1001->2, ...
    return 20 + extra_blocks * 10


@router.post("/voice-clone", response_model=GenerationResponse)
async def generate_voice_clone(
    body: VoiceCloneRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Generate speech audio from text (with optional voice cloning)."""
    user, profile, supabase = await _auth_and_profile(request, settings)

    user_email = profile.get("email", "")
    plan = profile["plan"]
    if PLAN_RANK.get(plan, 0) < PLAN_RANK["basic"] and not is_admin(user_email):
        raise HTTPException(
            status_code=403,
            detail="Voice Cloning requires Basic plan or above",
        )

    from app.services.fal_ai import FalClient
    from app.services.supabase import deduct_credits

    fal_client = FalClient(settings)
    if not fal_client.is_available():
        raise HTTPException(status_code=503, detail="Voice cloning service unavailable")

    text_len = len(body.text)
    credits_needed = _calc_voice_clone_credits(text_len)
    success = await deduct_credits(
        supabase, user.id, credits_needed, "voice cloning"
    )
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    job_id = str(uuid.uuid4())

    try:
        # Resolve reference audio: pass HTTP URL through, upload base64, or skip if empty
        reference_audio_url = ""
        if body.reference_audio:
            ref = body.reference_audio.strip()
            if ref.startswith(("http://", "https://")):
                reference_audio_url = ref
            elif ref.startswith("data:"):
                header, b64data = ref.split(",", 1)
                data = base64.b64decode(b64data)
                content_type = "audio/mpeg"
                if ":" in header and ";" in header:
                    content_type = header.split(":", 1)[1].split(";", 1)[0] or "audio/mpeg"
                # Map content type to extension
                if "wav" in content_type:
                    ext = "wav"
                elif "mp4" in content_type or "m4a" in content_type or "aac" in content_type:
                    ext = "m4a"
                elif "ogg" in content_type:
                    ext = "ogg"
                elif "webm" in content_type:
                    ext = "webm"
                else:
                    ext = "mp3"
                storage_path = f"voice-clone-refs/{user.id}/{job_id}.{ext}"
                supabase.storage.from_("self-hosted").upload(
                    storage_path,
                    data,
                    file_options={"content-type": content_type, "upsert": "true"},
                )
                reference_audio_url = (
                    f"{supabase.supabase_url}/storage/v1/object/public/self-hosted/{storage_path}"
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid reference_audio: must be an HTTPS URL, data URL, or empty",
                )

        fal_result = await fal_client.submit_voice_clone(
            text=body.text,
            reference_audio_url=reference_audio_url,
            exaggeration=body.exaggeration,
            temperature=body.temperature,
            cfg=body.cfg,
            seed=body.seed,
        )

        audio_url = fal_client.extract_audio_url(fal_result)
        if not audio_url:
            logger.error(f"voice_clone: no audio URL in result: {fal_result}")
            raise HTTPException(status_code=502, detail="No audio returned")

        # Download the generated audio and persist to Supabase Storage
        async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
            resp = await client.get(audio_url)
            resp.raise_for_status()
            audio_data = resp.content

        storage_path = f"voices/{job_id}.wav"
        supabase.storage.from_("self-hosted").upload(
            storage_path,
            audio_data,
            file_options={"content-type": "audio/wav", "upsert": "true"},
        )
        permanent_url = (
            f"{supabase.supabase_url}/storage/v1/object/public/self-hosted/{storage_path}"
        )

        # Persist job + gallery metadata (non-fatal if it fails)
        from app.api.generate import _store_job_status

        await _store_job_status(
            settings, job_id, "completed", {"url": permanent_url, "backend": "fal"}
        )

        try:
            from app.services.supabase import save_generation

            await save_generation(supabase, {
                "id": job_id,
                "user_id": str(user.id),
                "prompt": body.text[:500],
                "negative_prompt": "",
                "model": "fal_chatterbox",
                "params_json": {
                    "exaggeration": body.exaggeration,
                    "temperature": body.temperature,
                    "cfg": body.cfg,
                    "seed": body.seed,
                    "has_reference": bool(reference_audio_url),
                    "text_len": text_len,
                },
                "nsfw_flag": False,
                "image_url": None,
                "video_url": permanent_url,  # stored in video_url slot (closest existing field)
                "credits_used": credits_needed,
                "is_public": False,
            })
        except Exception as save_err:
            logger.warning(f"voice_clone: failed to save generation (non-fatal): {save_err}")

        return GenerationResponse(
            job_id=job_id,
            status=JobStatus.completed,
            credits_used=credits_needed,
            result_url=permanent_url,
        )
    except HTTPException:
        # Refund on explicit HTTP failures too (except payment/auth which were before deduction)
        try:
            from app.services.supabase import get_credit_balance

            if profile.get("plan") not in ("unlimited", "studio"):
                current = await get_credit_balance(supabase, user.id)
                if current:
                    supabase.table("credits").update(
                        {"balance": current["balance"] + credits_needed}
                    ).eq("user_id", user.id).execute()
                    supabase.table("credit_transactions").insert(
                        {
                            "user_id": str(user.id),
                            "amount": credits_needed,
                            "type": "refund",
                            "description": "voice_clone refund (failure)",
                        }
                    ).execute()
        except Exception:
            pass
        raise
    except Exception as e:
        logger.exception(f"voice_clone failed: {e}")
        try:
            from app.services.supabase import get_credit_balance

            if profile.get("plan") not in ("unlimited", "studio"):
                current = await get_credit_balance(supabase, user.id)
                if current:
                    supabase.table("credits").update(
                        {"balance": current["balance"] + credits_needed}
                    ).eq("user_id", user.id).execute()
                    supabase.table("credit_transactions").insert(
                        {
                            "user_id": str(user.id),
                            "amount": credits_needed,
                            "type": "refund",
                            "description": "voice_clone refund (failure)",
                        }
                    ).execute()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Voice cloning failed: {e}")
