"""Promo code validation and redemption."""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.services.supabase import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/promo", tags=["promo"])


class CheckCodeRequest(BaseModel):
    code: str


class RedeemCodeRequest(BaseModel):
    code: str


@router.post("/check")
async def check_code(body: CheckCodeRequest, settings: Settings = Depends(get_settings)):
    """Public: check if a promo code is valid (no auth needed)."""
    code = body.code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Empty code")

    supabase = get_supabase(settings)
    try:
        result = supabase.table("promo_codes").select("*").eq(
            "code", code
        ).eq("active", True).maybe_single().execute()
        if not result or not result.data:
            raise HTTPException(status_code=404, detail="Invalid or expired code")

        promo = result.data
        if promo.get("expires_at"):
            exp = datetime.fromisoformat(promo["expires_at"].replace("Z", "+00:00"))
            if exp < datetime.now(timezone.utc):
                raise HTTPException(status_code=410, detail="Code expired")

        if promo.get("max_uses") and promo.get("used_count", 0) >= promo["max_uses"]:
            raise HTTPException(status_code=410, detail="Code usage limit reached")

        return {
            "valid": True,
            "code": promo["code"],
            "discount_percent": promo["discount_percent"],
            "description": promo.get("description", ""),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Promo check failed: {e}")
        raise HTTPException(status_code=500, detail="Could not verify code")


@router.post("/redeem")
async def redeem_code(
    body: RedeemCodeRequest,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Redeem a promo code for the current user.
    Stores in promo_redemptions table. Stripe Checkout uses this at upgrade time.
    """
    code = body.code.strip().upper()
    supabase = get_supabase(settings)

    promo = supabase.table("promo_codes").select("*").eq(
        "code", code
    ).eq("active", True).maybe_single().execute()
    if not promo or not promo.data:
        raise HTTPException(status_code=404, detail="Invalid code")

    p = promo.data
    if p.get("expires_at"):
        exp = datetime.fromisoformat(p["expires_at"].replace("Z", "+00:00"))
        if exp < datetime.now(timezone.utc):
            raise HTTPException(status_code=410, detail="Code expired")
    if p.get("max_uses") and p.get("used_count", 0) >= p["max_uses"]:
        raise HTTPException(status_code=410, detail="Code limit reached")

    # Check if already redeemed by this user
    existing = supabase.table("promo_redemptions").select("id").eq(
        "code", code
    ).eq("user_id", user.id).maybe_single().execute()
    if existing and existing.data:
        raise HTTPException(status_code=409, detail="Already redeemed")

    try:
        supabase.table("promo_redemptions").insert({
            "code": code,
            "user_id": user.id,
        }).execute()
        supabase.table("promo_codes").update({
            "used_count": p.get("used_count", 0) + 1,
        }).eq("code", code).execute()
    except Exception as e:
        logger.error(f"Redemption failed: {e}")
        raise HTTPException(status_code=500, detail="Redemption failed")

    return {
        "success": True,
        "code": code,
        "discount_percent": p["discount_percent"],
        "message": f"🎉 {p['discount_percent']}% off applied! Use at checkout.",
    }
