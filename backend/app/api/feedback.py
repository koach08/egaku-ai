"""User feedback collection endpoints.

Simple feedback capture: users report issues, leave comments, or rate features
from anywhere in the app. Admins review via GET /feedback/list.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.services.supabase import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/feedback", tags=["feedback"])

ADMIN_EMAILS = {"kshgks59@gmail.com", "japanesebusinessman4@gmail.com"}


class FeedbackCreate(BaseModel):
    feature: str = Field(..., min_length=1, max_length=64)  # e.g. "photo_booth", "vid2vid", "home"
    category: str = Field("general", max_length=32)  # "bug", "feature_request", "praise", "general"
    message: str = Field(..., min_length=1, max_length=4000)
    rating: Optional[int] = Field(None, ge=1, le=5)  # optional 1-5 stars
    page_url: Optional[str] = Field(None, max_length=512)
    user_agent: Optional[str] = Field(None, max_length=512)


def _optional_user_id(request: Request, settings: Settings) -> Optional[str]:
    """Best-effort user lookup. Feedback may come from anonymous users too."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        supabase = get_supabase(settings)
        user_resp = supabase.auth.get_user(token)
        return user_resp.user.id if user_resp and user_resp.user else None
    except Exception:
        return None


@router.post("")
async def create_feedback(
    body: FeedbackCreate,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Create a feedback entry. Works for authenticated AND anonymous users."""
    supabase = get_supabase(settings)
    user_id = _optional_user_id(request, settings)

    row = {
        "user_id": user_id,
        "feature": body.feature,
        "category": body.category,
        "message": body.message.strip(),
        "rating": body.rating,
        "page_url": body.page_url,
        "user_agent": body.user_agent or request.headers.get("user-agent", "")[:512],
    }

    try:
        result = supabase.table("feedback").insert(row).execute()
    except Exception as e:
        logger.error(f"Feedback insert failed: {e}")
        raise HTTPException(status_code=500, detail="Could not save feedback")

    # Fire-and-forget email notification to admin
    try:
        await _send_feedback_email(body, user_id, settings)
    except Exception as e:
        logger.warning(f"Feedback email notification failed: {e}")

    return {"ok": True, "id": result.data[0].get("id") if result.data else None}


async def _send_feedback_email(body: FeedbackCreate, user_id: Optional[str], settings: Settings):
    """Send admin notification via Resend when feedback arrives."""
    if not settings.resend_api_key:
        return

    import httpx

    # Try to get user email
    user_email = "anonymous"
    if user_id:
        try:
            supabase = get_supabase(settings)
            user_data = supabase.auth.admin.get_user_by_id(user_id)
            if user_data and user_data.user:
                user_email = user_data.user.email or "anonymous"
        except Exception:
            pass

    emoji = {
        "bug": "🐛",
        "feature_request": "💡",
        "praise": "❤️",
        "general": "💬",
    }.get(body.category, "💬")

    rating_text = f" ({body.rating}/5 ⭐)" if body.rating else ""
    subject = f"{emoji} EGAKU AI Feedback [{body.category}]{rating_text}: {body.feature}"

    html_body = f"""
<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #8b5cf6;">{emoji} New Feedback</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding: 6px; color: #666;">Category</td><td style="padding: 6px;"><strong>{body.category}</strong></td></tr>
    <tr><td style="padding: 6px; color: #666;">Feature</td><td style="padding: 6px;">{body.feature}</td></tr>
    <tr><td style="padding: 6px; color: #666;">Rating</td><td style="padding: 6px;">{body.rating or "—"}</td></tr>
    <tr><td style="padding: 6px; color: #666;">User</td><td style="padding: 6px;">{user_email}</td></tr>
    <tr><td style="padding: 6px; color: #666;">Page</td><td style="padding: 6px;">{body.page_url or "—"}</td></tr>
  </table>
  <div style="margin-top: 16px; padding: 16px; background: #f5f3ff; border-left: 4px solid #8b5cf6; border-radius: 4px;">
    <p style="margin: 0; white-space: pre-wrap;">{body.message}</p>
  </div>
  <p style="margin-top: 20px; color: #999; font-size: 12px;">
    — EGAKU AI feedback system
  </p>
</div>
"""

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": f"EGAKU AI Feedback <{settings.feedback_from_email}>",
                "to": [settings.feedback_notify_email],
                "reply_to": user_email if user_email != "anonymous" else None,
                "subject": subject,
                "html": html_body,
            },
        )
        r.raise_for_status()
        logger.info(f"Feedback email sent to {settings.feedback_notify_email}")


@router.get("/list")
async def list_feedback(
    request: Request,
    limit: int = Query(100, ge=1, le=500),
    feature: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    resolved: Optional[bool] = Query(None),
    settings: Settings = Depends(get_settings),
):
    """Admin-only: list recent feedback entries."""
    # Auth check — admin only
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = auth_header.split(" ", 1)[1]

    supabase = get_supabase(settings)
    try:
        user_resp = supabase.auth.get_user(token)
        email = (user_resp.user.email or "").lower() if user_resp and user_resp.user else ""
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    if email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")

    query = supabase.table("feedback").select("*").order("created_at", desc=True).limit(limit)
    if feature:
        query = query.eq("feature", feature)
    if category:
        query = query.eq("category", category)
    if resolved is not None:
        query = query.eq("resolved", resolved)

    try:
        result = query.execute()
    except Exception as e:
        logger.error(f"Feedback list failed: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch feedback")

    return {"items": result.data or []}


@router.post("/{feedback_id}/resolve")
async def resolve_feedback(
    feedback_id: str,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Admin-only: mark a feedback item as resolved."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = auth_header.split(" ", 1)[1]

    supabase = get_supabase(settings)
    try:
        user_resp = supabase.auth.get_user(token)
        email = (user_resp.user.email or "").lower() if user_resp and user_resp.user else ""
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    if email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        supabase.table("feedback").update({"resolved": True}).eq("id", feedback_id).execute()
    except Exception as e:
        logger.error(f"Feedback resolve failed: {e}")
        raise HTTPException(status_code=500, detail="Could not update feedback")

    return {"ok": True}
