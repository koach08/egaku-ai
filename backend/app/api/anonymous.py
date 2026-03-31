"""Anonymous generation endpoint — allows 2 free generations without login.

Uses IP-based rate limiting and auto-enhances prompts with GPT-4.1-mini
to ensure high-quality output that converts visitors to registered users.
"""

import logging
import uuid
from collections import defaultdict

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.core.legal import check_prompt_compliance
from app.core.security import get_client_ip
from app.models.schemas import GenerationResponse, JobStatus

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/generate", tags=["anonymous"])

# In-memory tracking: IP → generation count
# In production, use Redis for persistence across restarts
_anon_usage: dict[str, int] = defaultdict(int)
ANON_LIMIT = 2  # Free trial: 2 images only

ENHANCE_SYSTEM_PROMPT = """You are an expert AI image generation prompt engineer. Your ONLY job is to take the user's idea and rewrite it as a high-quality image generation prompt.

Rules:
- Output ONLY the enhanced prompt, nothing else. No explanations, no labels, no quotes.
- Keep the user's core idea intact.
- Add: detailed subject description, environment/setting, lighting, mood, composition, camera angle.
- Add quality tags at the end: masterpiece, best quality, highly detailed, 8k, sharp focus.
- Add style cues that make the image visually stunning (cinematic lighting, golden hour, bokeh, etc.)
- Keep it under 200 words.
- If the prompt is already detailed, just polish it and add quality tags.
- NEVER add NSFW or explicit content.
- Write in English regardless of input language."""


class AnonGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)


class AnonGenerateResponse(BaseModel):
    job_id: str
    status: str
    result_url: str | None = None
    enhanced_prompt: str | None = None
    remaining: int = 0


async def _enhance_prompt(prompt: str, settings: Settings) -> str:
    """Enhance user prompt using GPT-4.1-mini for higher quality output."""
    if not settings.openai_api_key:
        return prompt

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4.1-mini",
                    "messages": [
                        {"role": "system", "content": ENHANCE_SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 500,
                    "temperature": 0.8,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            enhanced = data["choices"][0]["message"]["content"].strip()
            logger.info(f"Prompt enhanced: '{prompt[:50]}...' → '{enhanced[:50]}...'")
            return enhanced
    except Exception as e:
        logger.warning(f"Prompt enhancement failed, using original: {e}")
        return prompt


@router.post("/anonymous", response_model=AnonGenerateResponse)
async def generate_anonymous(
    body: AnonGenerateRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Generate an image without authentication. Limited to 2 per IP."""

    # 1. Check prompt compliance
    is_safe, flagged = check_prompt_compliance(body.prompt)
    if not is_safe:
        raise HTTPException(
            status_code=400,
            detail=f"Content policy violation: {', '.join(flagged)}",
        )

    # 2. Rate limit by IP
    ip = get_client_ip(request)
    if _anon_usage[ip] >= ANON_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="FREE_LIMIT_REACHED",
        )

    # 3. Check GPU backend availability (fal.ai or Novita.ai)
    has_fal = bool(settings.fal_api_key)
    has_novita = bool(settings.novita_api_key)
    if not has_fal and not has_novita:
        raise HTTPException(
            status_code=503,
            detail="Generation service temporarily unavailable.",
        )

    # 4. Enhance the prompt
    enhanced_prompt = await _enhance_prompt(body.prompt, settings)

    job_id = str(uuid.uuid4())

    # 5a. Try fal.ai first (fastest, best quality for SFW)
    if has_fal:
        from app.services.fal_ai import FalClient
        fal_client = FalClient(settings)
        try:
            fal_result = await fal_client.submit_txt2img(
                prompt=enhanced_prompt,
                model_id="fal_flux_dev",
                width=1024, height=1024, steps=25, cfg=7.0, seed=-1,
                negative_prompt="worst quality, low quality, blurry, distorted, deformed, ugly, bad anatomy",
            )
            result_url = fal_client.extract_image_url(fal_result)
            if result_url:
                if await fal_client.is_black_image(result_url):
                    retry_result = await fal_client.submit_txt2img(
                        prompt=enhanced_prompt, model_id="fal_flux_realism",
                        width=1024, height=1024, steps=25, cfg=7.0, seed=-1,
                        negative_prompt="worst quality, low quality, blurry, distorted",
                    )
                    retry_url = fal_client.extract_image_url(retry_result)
                    if retry_url and not await fal_client.is_black_image(retry_url):
                        result_url = retry_url

                _anon_usage[ip] += 1
                return AnonGenerateResponse(
                    job_id=job_id, status="completed",
                    result_url=result_url, enhanced_prompt=enhanced_prompt,
                    remaining=ANON_LIMIT - _anon_usage[ip],
                )
        except Exception as e:
            logger.warning(f"fal.ai anonymous generation failed: {e}")

    # 5b. Fallback: Novita.ai (works without fal.ai key)
    if has_novita:
        from app.services.novita import NovitaClient
        novita = NovitaClient(settings)
        try:
            urls = await novita.generate_with_checkpoint(
                prompt=enhanced_prompt,
                negative_prompt="worst quality, low quality, blurry, distorted, deformed, ugly, bad anatomy, text, watermark",
                model_name="cyberrealistic_v40_151857.safetensors",
                width=768, height=1024, steps=30, guidance_scale=7.0,
            )
            if urls:
                _anon_usage[ip] += 1
                return AnonGenerateResponse(
                    job_id=job_id, status="completed",
                    result_url=urls[0], enhanced_prompt=enhanced_prompt,
                    remaining=ANON_LIMIT - _anon_usage[ip],
                )
        except Exception as e:
            logger.error(f"Novita anonymous generation failed: {e}")

    raise HTTPException(status_code=500, detail="Generation failed. Please try again.")
