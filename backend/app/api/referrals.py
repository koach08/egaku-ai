"""Referral program — users invite friends, both get credits."""

import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.services.supabase import get_supabase, get_credit_balance

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/referrals", tags=["referrals"])

SIGNUP_BONUS = 50  # both get this on signup
UPGRADE_BONUS = 500  # referrer gets this when referred user upgrades


class UseReferralCodeRequest(BaseModel):
    code: str


def _generate_code() -> str:
    """Generate a short, human-readable referral code."""
    return secrets.token_urlsafe(6).replace("_", "").replace("-", "")[:8].upper()


@router.get("/my-code")
async def get_my_referral_code(
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Get or create this user's referral code."""
    supabase = get_supabase(settings)

    existing = supabase.table("referral_codes").select("code").eq(
        "user_id", user.id
    ).maybe_single().execute()

    if existing and existing.data:
        code = existing.data["code"]
    else:
        # Create new code
        for _ in range(5):
            new_code = _generate_code()
            try:
                supabase.table("referral_codes").insert({
                    "user_id": user.id,
                    "code": new_code,
                }).execute()
                code = new_code
                break
            except Exception:
                continue
        else:
            raise HTTPException(status_code=500, detail="Could not generate referral code")

    # Count referrals
    refs = supabase.table("referrals").select("id", count="exact").eq(
        "referrer_id", user.id
    ).execute()
    total_referred = refs.count or 0

    # Sum bonus credits earned
    bonus_refs = supabase.table("referrals").select("signup_bonus_paid, upgrade_bonus_paid").eq(
        "referrer_id", user.id
    ).execute()
    total_bonus = 0
    for r in bonus_refs.data or []:
        if r.get("signup_bonus_paid"):
            total_bonus += SIGNUP_BONUS
        if r.get("upgrade_bonus_paid"):
            total_bonus += UPGRADE_BONUS

    share_url = f"https://egaku-ai.com/register?ref={code}"
    return {
        "code": code,
        "share_url": share_url,
        "total_referred": total_referred,
        "total_bonus_credits": total_bonus,
        "signup_bonus": SIGNUP_BONUS,
        "upgrade_bonus": UPGRADE_BONUS,
    }


@router.post("/use-code")
async def use_referral_code(
    body: UseReferralCodeRequest,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Apply a referral code. New users only. Both get SIGNUP_BONUS credits."""
    code = body.code.strip().upper()
    if not code or len(code) < 4:
        raise HTTPException(status_code=400, detail="Invalid referral code")

    supabase = get_supabase(settings)

    # Check if this user already used a code
    existing = supabase.table("referrals").select("id").eq(
        "referred_user_id", user.id
    ).maybe_single().execute()
    if existing and existing.data:
        raise HTTPException(status_code=400, detail="You've already used a referral code")

    # Look up the referrer
    code_row = supabase.table("referral_codes").select("user_id").eq(
        "code", code
    ).maybe_single().execute()
    if not code_row or not code_row.data:
        raise HTTPException(status_code=404, detail="Referral code not found")

    referrer_id = code_row.data["user_id"]
    if referrer_id == user.id:
        raise HTTPException(status_code=400, detail="You can't use your own code")

    # Record the referral
    supabase.table("referrals").insert({
        "referrer_id": referrer_id,
        "referred_user_id": user.id,
        "code_used": code,
        "signup_bonus_paid": True,
    }).execute()

    # Give bonus credits to both users
    for uid in (user.id, referrer_id):
        try:
            current = await get_credit_balance(supabase, uid)
            if current:
                supabase.table("credits").update({
                    "balance": current["balance"] + SIGNUP_BONUS,
                }).eq("user_id", uid).execute()
                supabase.table("credit_transactions").insert({
                    "user_id": uid,
                    "amount": SIGNUP_BONUS,
                    "type": "referral",
                    "description": f"Referral signup bonus ({code})",
                }).execute()
        except Exception as e:
            logger.warning(f"Failed to credit {uid} for referral: {e}")

    logger.info(f"Referral: {referrer_id} → {user.id} (code: {code})")
    return {
        "success": True,
        "bonus_credits": SIGNUP_BONUS,
        "message": f"+{SIGNUP_BONUS} credits applied! Your friend also got +{SIGNUP_BONUS} credits.",
    }


async def award_upgrade_bonus(supabase, referred_user_id: str) -> None:
    """Called from Stripe webhook when a referred user upgrades to a paid plan.
    Awards UPGRADE_BONUS credits to the original referrer (once per referral).
    """
    try:
        ref = supabase.table("referrals").select("*").eq(
            "referred_user_id", referred_user_id
        ).eq("upgrade_bonus_paid", False).maybe_single().execute()
        if not ref or not ref.data:
            return

        referrer_id = ref.data["referrer_id"]
        current = await get_credit_balance(supabase, referrer_id)
        if current:
            supabase.table("credits").update({
                "balance": current["balance"] + UPGRADE_BONUS,
            }).eq("user_id", referrer_id).execute()
            supabase.table("credit_transactions").insert({
                "user_id": referrer_id,
                "amount": UPGRADE_BONUS,
                "type": "referral_upgrade",
                "description": "Referred user upgraded to paid plan",
            }).execute()
            supabase.table("referrals").update({
                "upgrade_bonus_paid": True,
            }).eq("id", ref.data["id"]).execute()
            logger.info(f"Upgrade bonus awarded: {referrer_id} gets {UPGRADE_BONUS} credits")
    except Exception as e:
        logger.warning(f"Failed to award upgrade bonus: {e}")
