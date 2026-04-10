"""Site-wide announcements API."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.core.config import Settings, get_settings
from app.services.supabase import get_supabase

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("/")
async def list_announcements(
    location: str = "home",
    settings: Settings = Depends(get_settings),
):
    """Public endpoint: returns active announcements for a given page location."""
    try:
        supabase = get_supabase(settings)
        result = supabase.table("announcements").select("*").eq(
            "active", True
        ).order("created_at", desc=True).execute()

        items = result.data or []
        now = datetime.now(timezone.utc)

        # Filter: not expired + matches location
        active = []
        for item in items:
            if item.get("expires_at"):
                try:
                    exp = datetime.fromisoformat(item["expires_at"].replace("Z", "+00:00"))
                    if exp < now:
                        continue
                except Exception:
                    pass
            show_on = item.get("show_on", [])
            if not show_on or location in show_on:
                active.append(item)

        return {"announcements": active}
    except Exception:
        return {"announcements": []}
