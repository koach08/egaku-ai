"""Stripe billing endpoints - Checkout sessions & customer portal."""

import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request

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

# Region-based pricing multipliers (PPP adjustment)
# Prices are shown in JPY equivalent but Stripe handles currency conversion
# "体感物価" based pricing - what feels affordable in each country
# Base: Japan (1.0) - Lite ¥480 is affordable on ¥180k/month salary
# Target: price of ~2 coffees in local currency
REGION_PRICE_MULTIPLIER: dict[str, float] = {
    # South America
    "BR": 0.30,   # Brazil - R$7~8 for Lite (coffee ~R$5)
    "AR": 0.20,   # Argentina - high inflation, keep very low
    "CO": 0.25,   # Colombia
    "CL": 0.40,   # Chile - higher income in LatAm
    "PE": 0.25,   # Peru
    "MX": 0.35,   # Mexico
    # South/Southeast Asia
    "IN": 0.20,   # India - ₹50~60 for Lite (chai ~₹20)
    "ID": 0.25,   # Indonesia
    "PH": 0.25,   # Philippines
    "TH": 0.35,   # Thailand
    "VN": 0.20,   # Vietnam
    "MY": 0.40,   # Malaysia
    "BD": 0.15,   # Bangladesh
    "PK": 0.15,   # Pakistan
    # Eastern Europe / Middle East
    "TR": 0.25,   # Turkey - lira instability
    "PL": 0.50,   # Poland
    "RU": 0.25,   # Russia
    "UA": 0.20,   # Ukraine
    "EG": 0.20,   # Egypt
    # Africa
    "ZA": 0.35,   # South Africa
    "NG": 0.20,   # Nigeria
    "KE": 0.20,   # Kenya
}

# Region-specific Stripe Price IDs (create these in Stripe Dashboard)
# Format: {region_code: {plan: price_id}}
# If a region doesn't have specific prices, falls back to default with coupon
REGION_PRICES: dict[str, dict[str, str]] = {
    # Example: Create these in Stripe for each region
    # "BR": {
    #     "lite": "price_BR_lite_xxx",
    #     "basic": "price_BR_basic_xxx",
    #     ...
    # },
}

LOCAL_LICENSE_PRICE_ID = "price_1T8GZxPShJirStHRCA15wd6k"

# ── Adult Expression Plans (standalone subscription) ──
# IMPORTANT: Adult plans are NO LONGER on Stripe (BAN risk).
# Payment via CCBill / NOWPayments (crypto) only.
# These Stripe Price IDs are DEPRECATED and should be deleted from Stripe Dashboard.
ADULT_PLAN_PRICES: dict[str, str] = {
    # DEPRECATED — DO NOT USE WITH STRIPE
    # "adult_starter": "price_1TEJeOPShJirStHR5mdU96ev",
    # "adult_creator": "price_1TEJeOPShJirStHRvCIqGObq",
    # "adult_studio": "price_1TEJePPShJirStHR9mbOrHhc",
    # "adult_patron": "price_1TEJeQPShJirStHR7hHv0R93",
}

ADULT_PLAN_INFO = {
    "none": {"name": "None", "price": 0, "credits": 0, "generations_per_month": 0},
    "adult_starter": {"name": "Starter", "price": 980, "credits": 100, "generations_per_month": 100},
    "adult_creator": {"name": "Creator", "price": 2480, "credits": 500, "generations_per_month": 500},
    "adult_studio": {"name": "Studio", "price": 4980, "credits": 2000, "generations_per_month": 2000},
    "adult_patron": {"name": "Patron", "price": 9800, "credits": 999999, "generations_per_month": 999999},
}

ADULT_PLAN_CREDITS = {
    "adult_starter": 100,
    "adult_creator": 500,
    "adult_studio": 2000,
    "adult_patron": 999999,
}


def _get_stripe(settings: Settings):
    stripe.api_key = settings.stripe_secret_key
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Stripe not configured")


@router.get("/plans")
async def get_plans(request: Request = None):
    """Return available plans and pricing, adjusted for user's region."""
    region = "US"
    if request:
        from app.core.region import detect_region
        from app.core.security import get_client_ip
        ip = get_client_ip(request)
        region = detect_region(request, ip, get_settings())

    multiplier = REGION_PRICE_MULTIPLIER.get(region, 1.0)
    if multiplier >= 1.0:
        return PLAN_INFO

    # Return PPP-adjusted prices
    adjusted = {}
    for plan_key, info in PLAN_INFO.items():
        adjusted[plan_key] = {
            **info,
            "price": int(info["price"] * multiplier) if info["price"] > 0 else 0,
            "original_price": info["price"],
            "region": region,
            "discount_pct": int((1 - multiplier) * 100),
        }
    return adjusted


@router.post("/checkout")
async def create_checkout(
    plan: str,
    request: Request,
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

    # Detect user region for PPP pricing
    region = profile.get("region_code", "US")
    multiplier = REGION_PRICE_MULTIPLIER.get(region, 1.0)

    # Get or create Stripe customer
    customer_id = profile.get("stripe_customer_id")
    if not customer_id:
        customer = stripe.Customer.create(
            email=profile["email"],
            metadata={"user_id": user.id, "region": region},
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
            success_url=f"{origin}/settings?checkout=success&plan=local",
            cancel_url=f"{origin}/settings?checkout=cancel",
        )
    else:
        # Check for region-specific Stripe price
        region_prices = REGION_PRICES.get(region, {})
        price_id = region_prices.get(plan, PLAN_PRICES[plan])

        checkout_params = {
            "customer": customer_id,
            "mode": "subscription",
            "line_items": [{"price": price_id, "quantity": 1}],
            "metadata": {"user_id": user.id, "plan": plan, "region": region},
            "success_url": f"{origin}/settings?checkout=success&plan={plan}",
            "cancel_url": f"{origin}/settings?checkout=cancel",
            "allow_promotion_codes": True,
        }

        # Apply PPP discount via Stripe coupon if no region-specific price
        if multiplier < 1.0 and plan not in region_prices:
            discount_pct = int((1 - multiplier) * 100)
            coupon_id = f"ppp_{region}_{discount_pct}"
            try:
                stripe.Coupon.retrieve(coupon_id)
            except stripe.error.InvalidRequestError:
                # Create the PPP coupon if it doesn't exist
                stripe.Coupon.create(
                    id=coupon_id,
                    percent_off=discount_pct,
                    duration="forever",
                    name=f"Regional pricing ({region} -{discount_pct}%)",
                )
            checkout_params["discounts"] = [{"coupon": coupon_id}]
            # discounts and allow_promotion_codes are mutually exclusive
            del checkout_params["allow_promotion_codes"]

        session = stripe.checkout.Session.create(**checkout_params)

    return {"checkout_url": session.url}


@router.post("/checkout-crypto")
async def create_crypto_checkout(
    plan: str,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Create crypto payment for a regular plan via NOWPayments."""
    if not settings.nowpayments_api_key:
        raise HTTPException(status_code=503, detail="Crypto payments coming soon")

    plan_usd = {
        "lite": 3.20, "basic": 6.50, "pro": 19.80,
        "unlimited": 39.80, "studio": 66.50,
    }
    if plan not in plan_usd:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {plan}")

    from app.services.crypto_pay import CryptoPayClient
    crypto = CryptoPayClient(settings.nowpayments_api_key, settings.nowpayments_ipn_secret)

    supabase = get_supabase(settings)
    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    origin = settings.cors_origins[0] if settings.cors_origins else "https://egaku-ai.com"

    import httpx
    data = {
        "price_amount": plan_usd[plan],
        "price_currency": "usd",
        "order_id": f"main_{plan}_{user.id}",
        "order_description": f"EGAKU AI {plan.title()} Plan (30 days)",
        "success_url": f"{origin}/settings?checkout=success&plan={plan}",
        "cancel_url": f"{origin}/settings?checkout=cancel",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            "https://api.nowpayments.io/v1/invoice",
            json=data,
            headers={"x-api-key": settings.nowpayments_api_key, "Content-Type": "application/json"},
        )
        r.raise_for_status()
        result = r.json()

    return {
        "invoice_url": result.get("invoice_url"),
        "invoice_id": result.get("id"),
        "price_usd": plan_usd[plan],
    }


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
        "local_license": bool(profile.get("local_license")),
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
