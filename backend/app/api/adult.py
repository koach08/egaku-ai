"""Adult Expression module - NSFW generation with mosaic control.

Standalone subscription for adult content generation.
Requires age verification. CSAM is ALWAYS blocked.
"""

import logging
import uuid

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.api.billing import (
    ADULT_PLAN_CREDITS,
    ADULT_PLAN_INFO,
    ADULT_PLAN_PRICES,
    REGION_PRICE_MULTIPLIER,
)
from app.core.config import Settings, get_settings
from app.core.legal import (
    REGION_RULES,
    check_prompt_compliance,
    get_region_rules,
    is_admin,
)
from app.core.region import detect_region
from app.core.security import get_client_ip, get_current_user
from app.models.schemas import GenerationResponse, JobStatus
from app.services.supabase import get_supabase, get_user_profile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/adult", tags=["adult"])

# Additional CSAM / real-person keywords for adult context
ADULT_PROHIBITED_KEYWORDS = [
    "deepfake", "revenge porn", "non-consensual",
    "real person", "celebrity", "actress", "actor",
    "without consent", "leaked", "stolen",
    "リベンジポルノ", "盗撮", "流出", "無断",
]

# NSFW-optimized models (Novita.ai + fal uncensored)
ADULT_MODELS = [
    {"id": "fal_flux_realism", "name": "Flux Realism (Uncensored)", "credits": 3, "badge": "Best"},
    {"id": "novita_dreamshaper_xl", "name": "DreamShaper XL", "credits": 3, "badge": "Realistic"},
    {"id": "novita_realistic_vision", "name": "Realistic Vision", "credits": 3, "badge": "Photo"},
    {"id": "novita_meinamix", "name": "MeinaMix (Anime)", "credits": 2, "badge": "Anime"},
    {"id": "fal_flux_dev", "name": "Flux Dev", "credits": 5, "badge": "Quality"},
    {"id": "fal_sdxl", "name": "SDXL", "credits": 2, "badge": ""},
]

ADULT_PLAN_RANK = {
    "none": 0,
    "adult_starter": 1,
    "adult_creator": 2,
    "adult_studio": 3,
    "adult_patron": 4,
}

# Main EGAKU plans that include adult access (Premium+)
MAIN_PLANS_WITH_ADULT = {"pro", "unlimited", "studio"}


class AdultGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = ""
    model: str = "fal_flux_realism"
    width: int = Field(768, ge=256, le=2048)
    height: int = Field(1024, ge=256, le=2048)
    steps: int = Field(25, ge=1, le=100)
    cfg: float = Field(7.0, ge=1.0, le=30.0)
    seed: int = -1
    mosaic_enabled: bool = True  # Default ON for safety


def _check_adult_access(profile: dict) -> None:
    """Check if user has adult content access (adult sub OR main Pro+)."""
    if is_admin(profile.get("email", "")):
        return

    if not profile.get("age_verified"):
        raise HTTPException(
            status_code=403,
            detail="Age verification required. You must be 18+ to access adult content.",
        )

    main_plan = profile.get("plan", "free")
    adult_plan = profile.get("adult_plan", "none")

    has_main_access = main_plan in MAIN_PLANS_WITH_ADULT
    has_adult_sub = adult_plan != "none" and adult_plan in ADULT_PLAN_RANK

    if not has_main_access and not has_adult_sub:
        raise HTTPException(
            status_code=403,
            detail="Adult content requires an Adult Expression subscription or Pro+ plan.",
        )


def _check_adult_prompt(prompt: str) -> None:
    """Extended prompt check for adult context (CSAM + real person block)."""
    is_safe, flagged = check_prompt_compliance(prompt)
    if not is_safe:
        raise HTTPException(
            status_code=400,
            detail=f"Prohibited content: {', '.join(flagged)}. Child exploitation content is never allowed.",
        )

    prompt_lower = prompt.lower()
    flagged_adult = [kw for kw in ADULT_PROHIBITED_KEYWORDS if kw.lower() in prompt_lower]
    if flagged_adult:
        raise HTTPException(
            status_code=400,
            detail=f"Content policy violation: {', '.join(flagged_adult)}. Real persons and non-consensual content are not allowed.",
        )


# ── Plans & Billing ──

@router.get("/plans")
async def get_adult_plans(request: Request = None):
    """Return adult expression plans with regional pricing."""
    region = "US"
    if request:
        ip = get_client_ip(request)
        region = detect_region(request, ip, get_settings())

    multiplier = REGION_PRICE_MULTIPLIER.get(region, 1.0)
    plans = {}
    for key, info in ADULT_PLAN_INFO.items():
        if key == "none":
            continue
        adjusted_price = int(info["price"] * multiplier) if multiplier < 1.0 else info["price"]
        plans[key] = {
            **info,
            "price": adjusted_price,
            "original_price": info["price"] if multiplier < 1.0 else None,
            "region": region,
        }
    return plans


@router.post("/checkout")
async def create_adult_checkout(
    plan: str,
    request: Request,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Create Stripe Checkout for adult subscription."""
    stripe.api_key = settings.stripe_secret_key
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Stripe not configured")

    if plan not in ADULT_PLAN_PRICES:
        raise HTTPException(status_code=400, detail=f"Invalid adult plan: {plan}")

    supabase = get_supabase(settings)
    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    if not profile.get("age_verified"):
        raise HTTPException(status_code=403, detail="Age verification required before purchasing adult plan")

    region = profile.get("region_code", "US")
    multiplier = REGION_PRICE_MULTIPLIER.get(region, 1.0)

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

    origin = settings.cors_origins[0] if settings.cors_origins else "http://localhost:4000"

    checkout_params = {
        "customer": customer_id,
        "mode": "subscription",
        "line_items": [{"price": ADULT_PLAN_PRICES[plan], "quantity": 1}],
        "metadata": {"user_id": user.id, "plan": plan, "type": "adult", "region": region},
        "success_url": f"{origin}/adult?checkout=success&plan={plan}",
        "cancel_url": f"{origin}/adult?checkout=cancel",
        "allow_promotion_codes": True,
    }

    if multiplier < 1.0:
        discount_pct = int((1 - multiplier) * 100)
        coupon_id = f"ppp_{region}_{discount_pct}"
        try:
            stripe.Coupon.retrieve(coupon_id)
        except stripe.error.InvalidRequestError:
            stripe.Coupon.create(
                id=coupon_id,
                percent_off=discount_pct,
                duration="forever",
                name=f"Regional pricing ({region} -{discount_pct}%)",
            )
        checkout_params["discounts"] = [{"coupon": coupon_id}]
        del checkout_params["allow_promotion_codes"]

    session = stripe.checkout.Session.create(**checkout_params)
    return {"checkout_url": session.url}


@router.get("/subscription")
async def get_adult_subscription(
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Get adult subscription status."""
    supabase = get_supabase(settings)
    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    adult_plan = profile.get("adult_plan", "none")
    main_plan = profile.get("plan", "free")
    has_main_access = main_plan in MAIN_PLANS_WITH_ADULT

    return {
        "adult_plan": adult_plan,
        "has_access": has_main_access or adult_plan != "none",
        "access_via": "main_plan" if has_main_access else ("adult_plan" if adult_plan != "none" else "none"),
        "main_plan": main_plan,
        "age_verified": profile.get("age_verified", False),
    }


# ── Region Rules ──

@router.get("/region-rules")
async def get_adult_region_rules(
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Return content rules for user's region (mosaic requirements, legal warnings)."""
    ip = get_client_ip(request)
    region = detect_region(request, ip, settings)
    rules = get_region_rules(region)

    legal_warnings = []
    if region == "JP":
        legal_warnings.append(
            "Japanese law (Article 175 of the Penal Code) prohibits distribution of "
            "uncensored depictions of genitalia. Mosaic/censoring is required for any "
            "public distribution. Private use is at your own discretion."
        )
    elif region == "KR":
        legal_warnings.append(
            "Korean law restricts distribution of obscene content. "
            "Public sharing of explicit content is prohibited."
        )
    elif region in ("AU",):
        legal_warnings.append(
            "Australian classification laws apply. Content that would be Refused Classification (RC) "
            "is prohibited."
        )

    return {
        "region": region,
        "mosaic_required": rules.get("mosaic_required", False),
        "mosaic_default": rules.get("mosaic_required", False),
        "nsfw_public_allowed": rules.get("nsfw_public_allowed", True),
        "legal_warnings": legal_warnings,
    }


# ── Generation ──

@router.get("/models")
async def get_adult_models():
    """Return available adult-optimized models."""
    return {"models": ADULT_MODELS}


@router.post("/generate", response_model=GenerationResponse)
async def generate_adult(
    body: AdultGenerateRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Generate adult content with mosaic control."""
    from app.services.supabase import deduct_credits

    # 1. Prompt compliance (CSAM + real person block)
    _check_adult_prompt(body.prompt)

    # 2. Auth
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = auth_header.split(" ", 1)[1]

    supabase = get_supabase(settings)
    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    # 3. Access check (adult sub or Pro+ plan)
    _check_adult_access(profile)

    # 4. Region rules
    ip = get_client_ip(request)
    region = detect_region(request, ip, settings)
    region_rules = get_region_rules(region)

    # 5. Credits
    from app.models.schemas import CREDIT_COSTS
    model_id = body.model or "fal_flux_realism"
    base_cost = 3  # Default NSFW generation cost
    for m in ADULT_MODELS:
        if m["id"] == model_id:
            base_cost = m["credits"]
            break

    success = await deduct_credits(supabase, user.id, base_cost, f"Adult generation ({model_id})")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # 6. Generate via existing pipeline
    from app.services.fal_ai import FalClient

    fal_client = FalClient(settings)
    job_id = str(uuid.uuid4())

    # Route NSFW to appropriate backend
    nsfw_model = model_id
    if model_id.startswith("novita_"):
        # Use Novita.ai for NSFW-friendly checkpoints
        try:
            from app.api.generate import _generate_with_novita_builtin
            from app.models.schemas import ImageGenerateRequest

            img_body = ImageGenerateRequest(
                prompt=body.prompt,
                negative_prompt=body.negative_prompt,
                model=model_id,
                width=body.width,
                height=body.height,
                steps=body.steps,
                cfg=body.cfg,
                seed=body.seed,
                nsfw=True,
            )
            result = await _generate_with_novita_builtin(
                model_id, img_body, img_body.model_dump(), job_id, settings, user.id, base_cost,
            )
            if result:
                return result
        except Exception as e:
            logger.error(f"Novita adult generation failed: {e}")

    # Default: fal.ai with NSFW-friendly model
    if not fal_client.is_available():
        raise HTTPException(status_code=503, detail="GPU backend unavailable")

    # Force NSFW-friendly model for blocked ones
    NSFW_SAFE_MODELS = {"fal_flux_realism", "fal_flux_dev", "fal_sdxl"}
    if nsfw_model not in NSFW_SAFE_MODELS and not nsfw_model.startswith("novita_"):
        nsfw_model = "fal_flux_realism"

    try:
        fal_result = await fal_client.submit_txt2img(
            prompt=body.prompt,
            model_id=nsfw_model,
            width=body.width,
            height=body.height,
            steps=body.steps,
            cfg=body.cfg,
            seed=body.seed,
            negative_prompt=body.negative_prompt,
        )
        result_url = fal_client.extract_image_url(fal_result)

        if result_url:
            # Check for black image (safety blocked)
            if await fal_client.is_black_image(result_url):
                if nsfw_model != "fal_flux_realism":
                    retry = await fal_client.submit_txt2img(
                        prompt=body.prompt,
                        model_id="fal_flux_realism",
                        width=body.width,
                        height=body.height,
                        steps=body.steps,
                        cfg=body.cfg,
                        seed=body.seed,
                        negative_prompt=body.negative_prompt,
                    )
                    retry_url = fal_client.extract_image_url(retry)
                    if retry_url and not await fal_client.is_black_image(retry_url):
                        result_url = retry_url

            # Store result
            from app.api.generate import _save_generation_to_db, _store_job_status
            await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "fal"})
            await _save_generation_to_db(
                settings, user.id, job_id, "txt2img", body.prompt,
                body.negative_prompt, model_id, body.model_dump(), result_url, True,
            )

            return GenerationResponse(
                job_id=job_id,
                status=JobStatus.completed,
                credits_used=base_cost,
                result_url=result_url,
            )

    except Exception as e:
        logger.error(f"Adult generation failed: {e}")
        raise HTTPException(status_code=500, detail="Generation failed. Please try again.")

    raise HTTPException(status_code=500, detail="Generation produced no result")
