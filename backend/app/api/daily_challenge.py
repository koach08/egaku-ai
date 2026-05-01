"""Daily Challenge endpoints — one theme per day, community votes."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.services.supabase import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/daily-challenge", tags=["daily-challenge"])


class SubmitRequest(BaseModel):
    date: str       # "2026-05-01"
    theme: str
    prompt: str
    image_url: str


class VoteRequest(BaseModel):
    submission_id: str
    date: str


@router.get("/submissions")
async def list_submissions(
    date: str,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Public: list all submissions for a given day."""
    supabase = get_supabase(settings)

    # Get current user id for has_voted check (optional)
    voter_id = None
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ", 1)[1]
            user = supabase.auth.get_user(token).user
            voter_id = str(user.id)
        except Exception:
            pass

    try:
        result = supabase.table("daily_challenge_submissions").select(
            "id, user_id, display_name, image_url, prompt, votes, created_at"
        ).eq("challenge_date", date).order("votes", desc=True).execute()

        submissions = result.data or []

        # Check which ones the current user has voted on
        if voter_id and submissions:
            sub_ids = [s["id"] for s in submissions]
            votes_result = supabase.table("daily_challenge_votes").select("submission_id").eq(
                "voter_id", voter_id
            ).in_("submission_id", sub_ids).execute()
            voted_ids = {v["submission_id"] for v in (votes_result.data or [])}
            for s in submissions:
                s["has_voted"] = s["id"] in voted_ids
        else:
            for s in submissions:
                s["has_voted"] = False

        return {"submissions": submissions}
    except Exception as e:
        logger.error(f"Failed to list daily challenge submissions: {e}")
        return {"submissions": []}


@router.post("/submit")
async def submit_entry(
    body: SubmitRequest,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Submit an image to today's daily challenge."""
    supabase = get_supabase(settings)

    # Check if already submitted today
    existing = supabase.table("daily_challenge_submissions").select("id").eq(
        "user_id", user.id
    ).eq("challenge_date", body.date).maybe_single().execute()

    if existing and existing.data:
        raise HTTPException(status_code=409, detail="Already submitted today")

    # Get display name
    from app.services.supabase import get_user_profile
    profile = await get_user_profile(supabase, user.id)
    display_name = profile.get("display_name") or profile.get("email", "").split("@")[0] if profile else "Anonymous"

    try:
        supabase.table("daily_challenge_submissions").insert({
            "user_id": user.id,
            "challenge_date": body.date,
            "theme": body.theme,
            "prompt": body.prompt,
            "image_url": body.image_url,
            "display_name": display_name,
            "votes": 0,
        }).execute()
        return {"success": True}
    except Exception as e:
        logger.error(f"Daily challenge submit failed: {e}")
        raise HTTPException(status_code=500, detail="Submit failed")


@router.post("/vote")
async def vote_submission(
    body: VoteRequest,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Vote for a submission in today's daily challenge."""
    supabase = get_supabase(settings)

    # Prevent self-voting
    sub = supabase.table("daily_challenge_submissions").select("user_id").eq(
        "id", body.submission_id
    ).maybe_single().execute()
    if sub and sub.data and sub.data["user_id"] == str(user.id):
        raise HTTPException(status_code=400, detail="Cannot vote for your own submission")

    # Check if already voted on this submission
    existing = supabase.table("daily_challenge_votes").select("id").eq(
        "voter_id", user.id
    ).eq("submission_id", body.submission_id).maybe_single().execute()
    if existing and existing.data:
        raise HTTPException(status_code=409, detail="Already voted")

    try:
        # Record vote
        supabase.table("daily_challenge_votes").insert({
            "voter_id": user.id,
            "submission_id": body.submission_id,
            "challenge_date": body.date,
        }).execute()

        # Increment vote count
        supabase.rpc("increment_daily_challenge_votes", {
            "sub_id": body.submission_id,
        }).execute()

        return {"success": True}
    except Exception as e:
        logger.error(f"Daily challenge vote failed: {e}")
        raise HTTPException(status_code=500, detail="Vote failed")
