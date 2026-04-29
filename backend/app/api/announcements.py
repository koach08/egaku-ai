"""Site-wide announcements + retention email API."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from app.core.config import Settings, get_settings
from app.services.supabase import get_supabase

router = APIRouter(prefix="/announcements", tags=["announcements"])

ADMIN_EMAILS = {"japanesebusinessman4@gmail.com", "kshgks59@gmail.com"}


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


@router.post("/send-retention")
async def send_retention(
    request: Request,
    days: int = Query(7, ge=1, le=30),
    dry_run: bool = Query(True),
    settings: Settings = Depends(get_settings),
):
    """Admin-only: send retention emails to inactive users.

    ?days=7 — users inactive for 7+ days
    ?dry_run=true — don't actually send (default: true for safety)
    """
    # Admin auth check
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Auth required")
    token = auth_header.split(" ", 1)[1]

    supabase = get_supabase(settings)
    try:
        user = supabase.auth.get_user(token).user
        from app.services.supabase import get_user_profile
        profile = await get_user_profile(supabase, user.id)
        if profile.get("email") not in ADMIN_EMAILS:
            raise HTTPException(status_code=403, detail="Admin only")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not settings.resend_api_key:
        raise HTTPException(status_code=503, detail="Resend API key not configured")

    from app.services.retention_email import send_retention_emails
    result = await send_retention_emails(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_service_role_key,
        resend_api_key=settings.resend_api_key,
        from_email="EGAKU AI <noreply@language-smartlearning.com>",
        days_inactive=days,
        dry_run=dry_run,
    )
    return result
