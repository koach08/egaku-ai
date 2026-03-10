"""Stripe billing endpoints - Checkout sessions & customer portal."""

import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException

from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.services.supabase import get_supabase, get_user_profile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["billing"])

# Stripe Price IDs
PLAN_PRICES: dict[str, str] = {
    "lite": "price_1T8GeJPShJirStHRQdvJwaHz",
    "basic": "price_1T8GXZPShJirStHRlGlGLhfw",
    "pro": "price_1T8GYUPShJirStHRXOuwIl6J",
    "unlimited": "price_1T8GYvPShJirStHRaqFVg0Xb",
    "studio": "price_1T8GZOPShJirStHRYRRnJ9GS",
}

PLAN_INFO = {
    "free": {"name": "Free", "price": 0, "credits": 50},
    "lite": {"name": "Lite", "price": 480, "credits": 150},
    "basic": {"name": "Basic", "price": 980, "credits": 500},
    "pro": {"name": "Pro", "price": 2980, "credits": 2000},
    "unlimited": {"name": "Unlimited", "price": 5980, "credits": 999999},
    "studio": {"name": "Studio", "price": 9980, "credits": 999999},
}

LOCAL_LICENSE_PRICE_ID = "price_1T8GZxPShJirStHRCA15wd6k"


def _get_stripe(settings: Settings):
    stripe.api_key = settings.stripe_secret_key
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Stripe not configured")


@router.get("/plans")
async def get_plans():
    """Return available plans and pricing."""
    return PLAN_INFO


@router.post("/checkout")
async def create_checkout(
    plan: str,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Create a Stripe Checkout session for subscription."""
    _get_stripe(settings)

    if plan not in PLAN_PRICES and plan != "local":
        raise HTTPException(status_code=400, detail=f"Invalid plan: {plan}")

    supabase = get_supabase(settings)
    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    # Get or create Stripe customer
    customer_id = profile.get("stripe_customer_id")
    if not customer_id:
        customer = stripe.Customer.create(
            email=profile["email"],
            metadata={"user_id": user.id},
        )
        customer_id = customer.id
        supabase.table("users").update(
            {"stripe_customer_id": customer_id}
        ).eq("id", user.id).execute()

    # Determine frontend URL for redirects
    origin = settings.cors_origins[0] if settings.cors_origins else "http://localhost:4000"

    if plan == "local":
        # One-time purchase for self-hosted license
        if not LOCAL_LICENSE_PRICE_ID:
            raise HTTPException(status_code=503, detail="Local license not configured")
        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="payment",
            line_items=[{"price": LOCAL_LICENSE_PRICE_ID, "quantity": 1}],
            metadata={"user_id": user.id, "plan": "local"},
            success_url=f"{origin}/settings?checkout=success",
            cancel_url=f"{origin}/settings?checkout=cancel",
        )
    else:
        # Subscription
        price_id = PLAN_PRICES[plan]
        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            metadata={"user_id": user.id, "plan": plan},
            success_url=f"{origin}/settings?checkout=success",
            cancel_url=f"{origin}/settings?checkout=cancel",
            allow_promotion_codes=True,
        )

    return {"checkout_url": session.url}


@router.post("/portal")
async def create_portal_session(
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Create a Stripe Customer Portal session for managing subscription."""
    _get_stripe(settings)

    supabase = get_supabase(settings)
    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    customer_id = profile.get("stripe_customer_id")
    if not customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")

    origin = settings.cors_origins[0] if settings.cors_origins else "http://localhost:4000"

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{origin}/settings",
    )

    return {"portal_url": session.url}


@router.get("/subscription")
async def get_subscription_status(
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Get current subscription status."""
    supabase = get_supabase(settings)
    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    result = {
        "plan": profile.get("plan", "free"),
        "has_stripe": bool(profile.get("stripe_customer_id")),
    }

    # If user has Stripe customer, get subscription details
    customer_id = profile.get("stripe_customer_id")
    if customer_id and settings.stripe_secret_key:
        _get_stripe(settings)
        try:
            subscriptions = stripe.Subscription.list(
                customer=customer_id, status="active", limit=1
            )
            if subscriptions.data:
                sub = subscriptions.data[0]
                result["subscription"] = {
                    "status": sub.status,
                    "current_period_end": sub.current_period_end,
                    "cancel_at_period_end": sub.cancel_at_period_end,
                }
        except stripe.error.StripeError:
            pass

    return result
