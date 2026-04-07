"""Credit balance and transaction endpoints."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.models.schemas import CREDIT_COSTS, CreditBalance, CreditTransaction
from app.services.supabase import get_credit_balance, get_supabase, get_user_profile

router = APIRouter(prefix="/credits", tags=["credits"])


@router.get("/balance", response_model=CreditBalance)
async def get_balance(
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    supabase = get_supabase(settings)
    profile = await get_user_profile(supabase, user.id)
    credits = await get_credit_balance(supabase, user.id)
    if not credits or not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return CreditBalance(
        balance=credits["balance"],
        lifetime_used=credits["lifetime_used"],
        plan=profile["plan"],
    )


@router.get("/history", response_model=list[CreditTransaction])
async def get_history(
    limit: int = 20,
    offset: int = 0,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    supabase = get_supabase(settings)
    result = (
        supabase.table("credit_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return [CreditTransaction(**row) for row in result.data]


@router.get("/costs")
async def get_costs():
    """Return credit cost table for the frontend to display."""
    return CREDIT_COSTS


DAILY_BONUS = 1  # 1 credit per day (enough for 1 Flux Schnell image)


@router.post("/daily")
async def claim_daily_credits(
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Claim daily free credit. One claim per calendar day (UTC)."""
    supabase = get_supabase(settings)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Check if already claimed today
    result = supabase.table("credit_transactions").select("id").eq(
        "user_id", user.id
    ).eq("type", "daily_bonus").gte(
        "created_at", f"{today}T00:00:00Z"
    ).execute()

    if result.data and len(result.data) > 0:
        return {"claimed": False, "message": "Already claimed today. Come back tomorrow!", "next_claim": f"{today}T24:00:00Z"}

    # Add daily bonus
    credits = await get_credit_balance(supabase, user.id)
    if not credits:
        raise HTTPException(status_code=404, detail="User not found")

    supabase.table("credits").update({
        "balance": credits["balance"] + DAILY_BONUS,
    }).eq("user_id", user.id).execute()

    supabase.table("credit_transactions").insert({
        "user_id": user.id,
        "amount": DAILY_BONUS,
        "type": "daily_bonus",
        "description": "Daily login bonus",
    }).execute()

    return {
        "claimed": True,
        "amount": DAILY_BONUS,
        "new_balance": credits["balance"] + DAILY_BONUS,
        "message": f"+{DAILY_BONUS} credit! Come back tomorrow for more.",
    }
