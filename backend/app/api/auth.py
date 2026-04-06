"""Auth endpoints - Supabase handles actual auth, we manage user profile."""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.core.region import detect_region
from app.core.security import get_client_ip, get_current_user
from app.models.schemas import AgeVerifyRequest, UserProfile
from app.services.supabase import ensure_user_exists, get_supabase, get_user_profile

router = APIRouter(prefix="/auth", tags=["auth"])


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

    profile = await ensure_user_exists(supabase, user.id, user.email, provider=provider)

    # Update region on each login
    supabase.table("users").update({"region_code": region}).eq("id", user.id).execute()
    profile["region_code"] = region

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
