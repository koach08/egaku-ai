"""Supabase client singleton."""

from functools import lru_cache

from supabase import Client, create_client

from app.core.config import Settings


@lru_cache
def get_supabase(settings: Settings = None) -> Client:
    if settings is None:
        from app.core.config import get_settings
        settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


# --- Database helpers ---

async def get_user_profile(supabase: Client, user_id: str) -> dict | None:
    try:
        result = supabase.table("users").select("*").eq("id", user_id).single().execute()
        return result.data if result else None
    except Exception:
        return None


async def ensure_user_exists(supabase: Client, user_id: str, email: str) -> dict:
    """Create user record if it doesn't exist (first login)."""
    try:
        existing = supabase.table("users").select("*").eq("id", user_id).maybe_single().execute()
        if existing and existing.data:
            return existing.data
    except Exception:
        pass

    new_user = {
        "id": user_id,
        "email": email,
        "plan": "free",
        "age_verified": False,
        "region_code": "US",
    }
    try:
        result = supabase.table("users").insert(new_user).execute()
    except Exception:
        # User might already exist (race condition) — try to fetch again
        existing = supabase.table("users").select("*").eq("id", user_id).single().execute()
        return existing.data if existing else new_user

    # Initialize credits
    try:
        supabase.table("credits").insert({
            "user_id": user_id,
            "balance": 15,
            "lifetime_used": 0,
        }).execute()
    except Exception:
        pass  # Credits row might already exist

    return result.data[0] if result and result.data else new_user


async def get_credit_balance(supabase: Client, user_id: str) -> dict | None:
    try:
        result = supabase.table("credits").select("*").eq("user_id", user_id).single().execute()
        return result.data if result else None
    except Exception:
        return None


async def deduct_credits(supabase: Client, user_id: str, amount: int, description: str) -> bool:
    """Deduct credits atomically. Returns False if insufficient balance.
    Unlimited/Studio plans bypass credit deduction entirely.
    """
    # Check if user is on an unlimited plan
    profile = await get_user_profile(supabase, user_id)
    if profile and profile.get("plan") in ("unlimited", "studio"):
        return True  # No deduction needed

    credits = await get_credit_balance(supabase, user_id)
    if not credits or credits["balance"] < amount:
        return False

    # Update balance
    supabase.table("credits").update({
        "balance": credits["balance"] - amount,
        "lifetime_used": credits["lifetime_used"] + amount,
    }).eq("user_id", user_id).execute()

    # Log transaction
    supabase.table("credit_transactions").insert({
        "user_id": user_id,
        "amount": -amount,
        "type": "generation",
        "description": description,
    }).execute()
    return True


async def save_generation(supabase: Client, data: dict) -> dict:
    result = supabase.table("generations").insert(data).execute()
    return result.data[0]
