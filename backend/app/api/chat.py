"""Prompt Assistant Chat - helps users craft better AI image generation prompts."""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.services.supabase import get_supabase
from app.core.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT = """You are EGAKU AI's Prompt Assistant — an expert at crafting prompts for AI image generation (Stable Diffusion, Flux, SDXL).

Your role:
- Help users write effective prompts for AI image generation
- Suggest improvements to their prompts
- Recommend models, styles, and settings
- Explain what makes a good prompt

When suggesting prompts, always include:
1. The main subject and scene
2. Style descriptors (photorealistic, anime, oil painting, etc.)
3. Quality tags (masterpiece, best quality, highly detailed, etc.)
4. Lighting and mood
5. A suggested negative prompt

Available models: Flux Schnell (fast), Flux Dev (best quality), SDXL, SDXL Lightning (fast), SD 3.5 Turbo, SD 3.5 Large, RealVisXL (realistic), Realistic Vision, Playground v2.5, Proteus (anime), Recraft V3, AuraFlow.

Available styles: Ghibli, Anime, Oil Painting, Watercolor, Cyberpunk, Pixel Art, Comic Book, Ukiyo-e.

Keep responses concise and actionable. Output prompts in a clear format the user can copy-paste."""


class ChatRequest(BaseModel):
    message: str = Field(..., max_length=2000)
    history: list[dict[str, str]] = Field(default_factory=list, max_length=20)


class ChatResponse(BaseModel):
    reply: str
    tokens_used: int = 0


@router.post("/prompt-assist", response_model=ChatResponse)
async def prompt_assist(
    body: ChatRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """AI chat to help users craft better image generation prompts."""
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="Chat service not configured")

    # Auth (optional - allow free users too)
    user = None
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            supabase = get_supabase(settings)
            user_response = supabase.auth.get_user(token)
            user = user_response.user
        except Exception:
            pass

    if not user:
        raise HTTPException(status_code=401, detail="Sign in to use the prompt assistant")

    # Build messages
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in body.history[-10:]:  # Last 10 messages only
        if msg.get("role") in ("user", "assistant"):
            messages.append({"role": msg["role"], "content": msg["content"][:2000]})
    messages.append({"role": "user", "content": body.message})

    try:
        import httpx

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4.1-mini",
                    "messages": messages,
                    "max_tokens": 1000,
                    "temperature": 0.7,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        reply = data["choices"][0]["message"]["content"]
        tokens = data.get("usage", {}).get("total_tokens", 0)

        return ChatResponse(reply=reply, tokens_used=tokens)

    except httpx.HTTPStatusError as e:
        logger.error(f"OpenAI API error: {e.response.status_code} {e.response.text}")
        raise HTTPException(status_code=502, detail="AI service temporarily unavailable")
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate response")
