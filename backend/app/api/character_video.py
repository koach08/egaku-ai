"""Character-consistent video generation via PixVerse C1.

Users upload 1-5 reference images (subjects and/or backgrounds), give each a
short `ref_name`, and write a prompt that mentions them as `@ref_name`. The
PixVerse C1 reference-to-video model keeps those characters consistent across
every frame.
"""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.config import Settings, get_settings
from app.core.legal import check_prompt_compliance, is_admin
from app.models.schemas import (
    CREDIT_COSTS,
    CharacterVideoRequest,
    GenerationResponse,
    JobStatus,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/generate", tags=["character-video"])

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


@router.post("/character-video", response_model=GenerationResponse)
async def generate_character_video(
    body: CharacterVideoRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Generate a character-consistent video with multiple reference images."""
    is_safe, flagged = check_prompt_compliance(body.prompt)
    if not is_safe:
        raise HTTPException(
            status_code=400,
            detail=f"Content policy violation: {', '.join(flagged)}",
        )

    user, profile, supabase = await _auth_and_profile(request, settings)

    user_email = profile.get("email", "")
    plan = profile["plan"]
    if PLAN_RANK.get(plan, 0) < PLAN_RANK["basic"] and not is_admin(user_email):
        raise HTTPException(
            status_code=403,
            detail="Character Video requires Basic plan or above",
        )

    if body.nsfw and not profile.get("age_verified") and not is_admin(user_email):
        raise HTTPException(
            status_code=403,
            detail="Age verification required for NSFW content",
        )

    from app.services.fal_ai import FalClient
    from app.services.supabase import deduct_credits

    fal_client = FalClient(settings)
    if not fal_client.is_available():
        raise HTTPException(status_code=503, detail="Character video service unavailable")

    credits_needed = CREDIT_COSTS["character_video"]
    success = await deduct_credits(
        supabase, user.id, credits_needed, "character video generation"
    )
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    job_id = str(uuid.uuid4())

    try:
        # Resolve references: convert base64 to Supabase URLs, keep HTTP URLs as-is
        resolved_refs: list[dict] = []
        for i, ref in enumerate(body.references):
            if ref.image.startswith(("http://", "https://")):
                image_url = ref.image
            elif ref.image.startswith("data:"):
                import base64 as _b64

                header, b64data = ref.image.split(",", 1)
                data = _b64.b64decode(b64data)
                content_type = "image/png"
                if ":" in header and ";" in header:
                    content_type = header.split(":", 1)[1].split(";", 1)[0] or "image/png"
                ext = (
                    "jpg"
                    if "jpeg" in content_type
                    else ("webp" if "webp" in content_type else "png")
                )
                storage_path = f"character-video-refs/{user.id}/{job_id}_{i}.{ext}"
                supabase.storage.from_("self-hosted").upload(
                    storage_path,
                    data,
                    file_options={"content-type": content_type, "upsert": "true"},
                )
                image_url = (
                    f"{supabase.supabase_url}/storage/v1/object/public/self-hosted/{storage_path}"
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid image URL for ref {ref.ref_name}",
                )

            resolved_refs.append(
                {
                    "image_url": image_url,
                    "ref_name": ref.ref_name,
                    "type": ref.type if ref.type in ("subject", "background") else "subject",
                }
            )

        # NSFW fallback: PixVerse C1 is a commercial model that filters NSFW.
        # Route NSFW requests to Wan 2.6 I2V (NSFW-friendly) using only the
        # FIRST subject reference image — multi-reference NSFW isn't available
        # on fal.ai yet. Frontend warns the user about this degradation.
        used_backend = "fal_pixverse_c1_ref"
        if body.nsfw:
            first_subject = next(
                (r for r in resolved_refs if r["type"] == "subject"),
                resolved_refs[0],
            )
            fal_result = await fal_client.submit_img2vid(
                image_url=first_subject["image_url"],
                prompt=body.prompt,
                seed=body.seed,
                model_id="fal_wan26_i2v",
                duration=max(5, min(15, body.duration)),
                resolution=body.resolution if body.resolution in ("720p", "1080p") else "720p",
            )
            used_backend = "fal_wan26_i2v_nsfw"
        else:
            fal_result = await fal_client.submit_character_video(
                prompt=body.prompt,
                image_references=resolved_refs,
                resolution=body.resolution,
                duration=body.duration,
                aspect_ratio=body.aspect_ratio,
                generate_audio=body.generate_audio,
                seed=body.seed,
            )

        result_url = fal_client.extract_video_url(fal_result)
        if not result_url:
            logger.error(f"character_video: no video URL: {fal_result}")
            raise HTTPException(status_code=502, detail="No video returned")

        # Persist to Supabase storage + DB
        from app.api.generate import (
            _persist_to_supabase_storage,
            _save_generation_to_db,
            _store_job_status,
        )

        permanent_url = await _persist_to_supabase_storage(
            supabase, result_url, job_id, is_video=True
        )

        await _store_job_status(
            settings, job_id, "completed", {"url": permanent_url, "backend": "fal"}
        )
        await _save_generation_to_db(
            settings,
            str(user.id),
            job_id,
            "character_video",
            body.prompt,
            "",
            used_backend,
            {
                "resolution": body.resolution,
                "duration": body.duration,
                "aspect_ratio": body.aspect_ratio,
                "nsfw_fallback": body.nsfw,
            },
            permanent_url,
            body.nsfw,
        )

        return GenerationResponse(
            job_id=job_id,
            status=JobStatus.completed,
            credits_used=credits_needed,
            result_url=permanent_url,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"character_video failed: {e}")
        # Refund on failure
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
                            "description": "character_video refund (failure)",
                        }
                    ).execute()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Character video failed: {e}")
