"""Credit balance and transaction endpoints."""

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
