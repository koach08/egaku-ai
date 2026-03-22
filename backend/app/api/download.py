"""Self-hosted license download endpoint."""

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.services.supabase import get_supabase, get_user_profile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/download", tags=["download"])

# Supabase Storage bucket and file path for the self-hosted zip
STORAGE_BUCKET = "self-hosted"
STORAGE_FILE = "egaku-ai-self-hosted.zip"


@router.get("/self-hosted")
async def get_download_link(
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Return a signed download URL for the self-hosted package. Requires local_license."""
    supabase = get_supabase(settings)
    profile = await get_user_profile(supabase, user.id)

    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    if not profile.get("local_license"):
        raise HTTPException(
            status_code=403,
            detail="Self-hosted license required. Purchase from the pricing page.",
        )

    # Generate a signed URL (valid for 1 hour)
    try:
        result = supabase.storage.from_(STORAGE_BUCKET).create_signed_url(
            STORAGE_FILE, 3600
        )
        if result and result.get("signedURL"):
            return {"download_url": result["signedURL"]}
        raise HTTPException(status_code=500, detail="Failed to generate download link")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download link generation failed: {e}")
        raise HTTPException(status_code=500, detail="Download temporarily unavailable")
