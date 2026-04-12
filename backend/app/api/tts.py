"""Text-to-Speech API endpoints.

Provides narration generation for storyboard mode and standalone use.
Engines: Chatterbox (vast.ai) → OpenAI TTS → Kokoro (vast.ai).
"""

import base64
import io
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.services.supabase import get_supabase, get_user_profile
from app.services.tts import TTS_CREDIT_COSTS, TTSService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tts", tags=["text-to-speech"])

PLAN_RANK = {"free": 0, "lite": 1, "basic": 2, "pro": 3, "unlimited": 4, "studio": 5}


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    language: str = Field("en", pattern=r"^[a-z]{2}$")
    engine: str = Field("auto", pattern=r"^(auto|openai|openai_hd|chatterbox|kokoro)$")
    voice_id: Optional[str] = None
    reference_audio: Optional[str] = None  # base64 WAV for voice cloning


@router.get("/voices")
async def get_voices(settings: Settings = Depends(get_settings)):
    """List available TTS voices and engines."""
    svc = TTSService(settings)
    return svc.get_voices()


@router.post("/synthesize")
async def synthesize_speech(
    body: TTSRequest,
    request: Request,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Generate speech from text. Returns audio/wav or audio/mpeg.

    Plan requirements:
    - Basic+: OpenAI / Kokoro TTS
    - Pro+: Chatterbox (voice cloning, multilingual)
    """
    supabase = get_supabase(settings)
    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    plan = profile.get("plan", "free")

    # Plan gating
    if PLAN_RANK.get(plan, 0) < PLAN_RANK["basic"]:
        raise HTTPException(
            status_code=403,
            detail="TTS requires Basic plan or above. Upgrade to unlock narration.",
        )

    # Chatterbox / voice cloning requires Pro+
    if body.engine == "chatterbox" and PLAN_RANK.get(plan, 0) < PLAN_RANK["pro"]:
        raise HTTPException(
            status_code=403,
            detail="Voice cloning requires Pro plan or above.",
        )

    if body.reference_audio and PLAN_RANK.get(plan, 0) < PLAN_RANK["pro"]:
        raise HTTPException(
            status_code=403,
            detail="Voice cloning requires Pro plan or above.",
        )

    # Credit check
    engine_for_cost = body.engine if body.engine != "auto" else "openai"
    credits_needed = TTS_CREDIT_COSTS.get(engine_for_cost, 3)
    current_credits = profile.get("credits", 0)
    if current_credits < credits_needed:
        raise HTTPException(
            status_code=402,
            detail=f"Not enough credits. Need {credits_needed}, have {current_credits}.",
        )

    # Generate
    svc = TTSService(settings)
    try:
        audio_bytes, content_type, engine_used = await svc.synthesize(
            text=body.text,
            language=body.language,
            engine=body.engine,
            voice_id=body.voice_id,
            reference_audio_b64=body.reference_audio,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Deduct credits
    actual_cost = TTS_CREDIT_COSTS.get(engine_used, credits_needed)
    supabase.table("users").update(
        {"credits": current_credits - actual_cost}
    ).eq("id", user.id).execute()

    # Log transaction
    supabase.table("credit_transactions").insert({
        "user_id": user.id,
        "amount": -actual_cost,
        "type": "tts",
        "description": f"TTS ({engine_used}): {body.text[:80]}...",
    }).execute()

    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type=content_type,
        headers={
            "Content-Disposition": "attachment; filename=narration.wav" if "wav" in content_type else "attachment; filename=narration.mp3",
            "X-TTS-Engine": engine_used,
            "X-Credits-Used": str(actual_cost),
        },
    )
