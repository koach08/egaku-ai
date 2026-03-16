"""API key management for external API access (Studio plan)."""

import hashlib
import logging
import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.services.supabase import get_supabase, get_user_profile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api-keys", tags=["api-keys"])

PLAN_RANK = {"free": 0, "lite": 1, "basic": 2, "pro": 3, "unlimited": 4, "studio": 5}


def _hash_key(key: str) -> str:
    """Hash an API key for storage (only prefix shown to user)."""
    return hashlib.sha256(key.encode()).hexdigest()


@router.post("/create")
async def create_api_key(
    name: str = "Default",
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Create a new API key. Requires Studio plan."""
    supabase = get_supabase(settings)
    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    plan = profile.get("plan", "free")
    if PLAN_RANK.get(plan, 0) < PLAN_RANK["studio"]:
        raise HTTPException(status_code=403, detail="API access requires Studio plan")

    # Check existing key count (max 3)
    existing = supabase.table("api_keys").select("id").eq("user_id", user.id).eq("revoked", False).execute()
    if existing.data and len(existing.data) >= 3:
        raise HTTPException(status_code=400, detail="Maximum 3 active API keys allowed")

    # Generate key
    raw_key = f"egaku_{secrets.token_urlsafe(32)}"
    key_hash = _hash_key(raw_key)
    prefix = raw_key[:12] + "..."

    supabase.table("api_keys").insert({
        "user_id": user.id,
        "name": name,
        "key_hash": key_hash,
        "key_prefix": prefix,
        "revoked": False,
    }).execute()

    # Return the full key only once
    return {
        "api_key": raw_key,
        "prefix": prefix,
        "name": name,
        "message": "Save this key now. It will not be shown again.",
    }


@router.get("/list")
async def list_api_keys(
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """List user's API keys (prefix only)."""
    supabase = get_supabase(settings)
    result = (
        supabase.table("api_keys")
        .select("id, name, key_prefix, created_at, last_used_at, revoked")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"keys": result.data or []}


@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: str,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Revoke an API key."""
    supabase = get_supabase(settings)
    result = (
        supabase.table("api_keys")
        .update({"revoked": True})
        .eq("id", key_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"status": "revoked"}


async def validate_api_key(request: Request, settings: Settings) -> dict | None:
    """Validate an API key from Authorization header. Returns user profile or None."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer egaku_"):
        return None

    api_key = auth.split(" ", 1)[1]
    key_hash = _hash_key(api_key)

    supabase = get_supabase(settings)
    result = (
        supabase.table("api_keys")
        .select("user_id")
        .eq("key_hash", key_hash)
        .eq("revoked", False)
        .maybe_single()
        .execute()
    )

    if not result or not result.data:
        return None

    user_id = result.data["user_id"]

    # Update last_used_at
    try:
        supabase.table("api_keys").update(
            {"last_used_at": datetime.utcnow().isoformat()}
        ).eq("key_hash", key_hash).execute()
    except Exception:
        pass

    profile = await get_user_profile(supabase, user_id)
    return profile
