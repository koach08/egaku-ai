"""Admin-only endpoints: user stats, content reports, system health."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.config import Settings, get_settings
from app.services.supabase import get_supabase, get_user_profile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAILS = {"japanesebusinessman4@gmail.com", "kshgks59@gmail.com"}


async def _require_admin(request: Request, settings: Settings):
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Auth required")
    token = auth_header.split(" ", 1)[1]
    supabase = get_supabase(settings)
    try:
        user_resp = supabase.auth.get_user(token)
        email = (user_resp.user.email or "").lower()
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    if email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin only")
    return supabase, user_resp.user


@router.get("/stats")
async def get_stats(
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Admin dashboard stats: user count, generation count, reports, etc."""
    supabase, user = await _require_admin(request, settings)

    stats = {}

    # Total users
    try:
        result = supabase.table("users").select("id", count="exact").execute()
        stats["total_users"] = result.count or 0
    except Exception as e:
        logger.warning(f"User count failed: {e}")
        stats["total_users"] = "error"

    # Users by plan
    try:
        result = supabase.table("users").select("plan").execute()
        plans = {}
        for row in (result.data or []):
            p = row.get("plan", "free")
            plans[p] = plans.get(p, 0) + 1
        stats["users_by_plan"] = plans
    except Exception:
        stats["users_by_plan"] = {}

    # Recent signups (last 7 days)
    try:
        from datetime import datetime, timedelta, timezone
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        result = supabase.table("users").select("id", count="exact").gte("created_at", week_ago).execute()
        stats["signups_last_7d"] = result.count or 0
    except Exception:
        stats["signups_last_7d"] = "error"

    # Total generations
    try:
        result = supabase.table("generations").select("id", count="exact").execute()
        stats["total_generations"] = result.count or 0
    except Exception:
        stats["total_generations"] = "error"

    # Gallery items
    try:
        result = supabase.table("gallery").select("id", count="exact").eq("public", True).execute()
        stats["public_gallery_items"] = result.count or 0
    except Exception:
        stats["public_gallery_items"] = "error"

    # Pending reports
    try:
        result = supabase.table("content_reports").select("id", count="exact").eq("status", "pending").execute()
        stats["pending_reports"] = result.count or 0
    except Exception:
        stats["pending_reports"] = 0

    return stats


@router.get("/users")
async def list_users(
    request: Request,
    settings: Settings = Depends(get_settings),
    limit: int = 50,
    offset: int = 0,
):
    """Admin: list users with basic info (no passwords/tokens)."""
    supabase, user = await _require_admin(request, settings)

    try:
        result = (
            supabase.table("users")
            .select("id, email, display_name, plan, adult_plan, created_at")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return {"users": result.data or [], "count": len(result.data or [])}
    except Exception as e:
        logger.error(f"User list failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports")
async def list_reports(
    request: Request,
    settings: Settings = Depends(get_settings),
    status_filter: str = "pending",
):
    """Admin: list content reports."""
    supabase, user = await _require_admin(request, settings)

    try:
        query = supabase.table("content_reports").select("*").order("created_at", desc=True).limit(50)
        if status_filter != "all":
            query = query.eq("status", status_filter)
        result = query.execute()
        return {"reports": result.data or []}
    except Exception as e:
        logger.error(f"Reports list failed: {e}")
        return {"reports": []}
