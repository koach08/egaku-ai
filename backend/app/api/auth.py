"""Auth endpoints - Supabase handles actual auth, we manage user profile."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.core.region import detect_region
from app.core.security import get_client_ip, get_current_user
from app.models.schemas import AgeVerifyRequest, UserProfile
from app.services.supabase import ensure_user_exists, get_supabase, get_user_profile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


async def _send_welcome_email(email: str, settings: Settings):
    """Send a welcome email to new users via Resend."""
    if not settings.resend_api_key or not email:
        return

    import httpx
    html = """
<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #8b5cf6;">Welcome to EGAKU AI! 🎨</h1>
  <p>Your account is set up with <strong>50 free credits</strong> + 1 bonus credit every day you log in.</p>

  <h3>Quick Start</h3>
  <ul style="line-height: 2;">
    <li><a href="https://egaku-ai.com/generate" style="color: #8b5cf6;">Generate your first image</a> — 25+ AI models</li>
    <li><a href="https://egaku-ai.com/photo-booth" style="color: #8b5cf6;">Photo Booth</a> — selfie → pro portrait</li>
    <li><a href="https://egaku-ai.com/meme" style="color: #8b5cf6;">Meme Generator</a> — AI + text overlay</li>
    <li><a href="https://egaku-ai.com/battle" style="color: #8b5cf6;">Prompt Battle</a> — challenge friends</li>
    <li><a href="https://egaku-ai.com/tools" style="color: #8b5cf6;">All 20+ tools</a></li>
  </ul>

  <div style="margin: 24px 0; padding: 16px; background: #f5f3ff; border-radius: 8px;">
    <p style="margin: 0 0 8px 0; font-weight: bold;">🎁 First month 50% off</p>
    <p style="margin: 0; font-size: 14px;">Use code <strong style="color: #8b5cf6;">LAUNCH50</strong> at checkout for any paid plan.</p>
  </div>

  <div style="margin: 24px 0; padding: 16px; background: #fef3f2; border-radius: 8px;">
    <p style="margin: 0 0 8px 0; font-weight: bold;">🤝 Refer friends, earn credits</p>
    <p style="margin: 0; font-size: 14px;">Share your <a href="https://egaku-ai.com/referrals" style="color: #8b5cf6;">referral link</a> — both of you get +50 credits.</p>
  </div>

  <p style="color: #999; font-size: 12px; margin-top: 32px;">
    — EGAKU AI team<br>
    <a href="https://egaku-ai.com" style="color: #999;">egaku-ai.com</a>
  </p>
</div>
"""
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": f"EGAKU AI <{settings.feedback_from_email}>",
                "to": [email],
                "subject": "Welcome to EGAKU AI — 50 free credits inside 🎨",
                "html": html,
            },
        )
        logger.info(f"Welcome email sent to {email}")


@router.post("/init", response_model=UserProfile)
async def init_user(
    request: Request,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Called after Supabase login to initialize/sync user profile in our DB."""
    supabase = get_supabase(settings)
    ip = get_client_ip(request)
    region = detect_region(request, ip, settings)

    # Detect auth provider (google, discord, github, email, etc.)
    provider = "email"
    if user.app_metadata:
        provider = user.app_metadata.get("provider", "email")

    # Check if this is a brand-new user (not yet in our DB)
    existing = supabase.table("users").select("id").eq("id", user.id).maybe_single().execute()
    is_new_user = not (existing and existing.data)

    profile = await ensure_user_exists(supabase, user.id, user.email, provider=provider)

    # Update region on each login
    supabase.table("users").update({"region_code": region}).eq("id", user.id).execute()
    profile["region_code"] = region

    # Send welcome email to new users (fire-and-forget)
    if is_new_user:
        try:
            await _send_welcome_email(user.email, settings)
        except Exception as e:
            logger.warning(f"Welcome email failed: {e}")

    return UserProfile(**profile)


@router.get("/me", response_model=UserProfile)
async def get_me(
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    supabase = get_supabase(settings)
    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return UserProfile(**profile)


@router.post("/verify-age")
async def verify_age(
    body: AgeVerifyRequest,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """User confirms they are 18+. Required for NSFW features."""
    if not body.confirmed:
        return {"age_verified": False}

    supabase = get_supabase(settings)
    supabase.table("users").update({"age_verified": True}).eq("id", user.id).execute()
    return {"age_verified": True}


@router.post("/mark-email-verified")
async def mark_email_verified(
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Mark the user's email as verified (called after magic link confirmation)."""
    supabase = get_supabase(settings)
    supabase.table("users").update({"email_verified": True}).eq("id", user.id).execute()
    return {"email_verified": True}


class ProfileUpdateRequest(BaseModel):
    display_name: str = Field(None, max_length=50)
    bio: str = Field(None, max_length=500)


@router.patch("/profile")
async def update_profile(
    body: ProfileUpdateRequest,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Update the user's display name and/or bio."""
    supabase = get_supabase(settings)
    updates = {}
    if body.display_name is not None:
        updates["display_name"] = body.display_name.strip()
    if body.bio is not None:
        updates["bio"] = body.bio.strip()

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    supabase.table("users").update(updates).eq("id", user.id).execute()
    profile = await get_user_profile(supabase, user.id)
    return UserProfile(**profile)
