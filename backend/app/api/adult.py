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
    # SDXL (high quality, 1024x1024)
    {"id": "novita_protovision_xl", "name": "ProtoVision XL (HD)", "credits": 3, "badge": "SDXL"},
    {"id": "novita_helloworld_xl", "name": "HelloWorld SDXL", "credits": 3, "badge": "SDXL"},
    {"id": "novita_sdxl_base", "name": "SDXL Base", "credits": 3, "badge": "SDXL"},
    # Photorealistic NSFW
    {"id": "novita_uber_realistic_porn", "name": "UberRealisticPorn v1.3", "credits": 2, "badge": "Best"},
    {"id": "novita_babes", "name": "Babes 2.0", "credits": 2, "badge": "Popular"},
    {"id": "novita_chilloutmix", "name": "ChilloutMix (Asian)", "credits": 2, "badge": "Popular"},
    {"id": "novita_cyberrealistic", "name": "CyberRealistic v4", "credits": 2, "badge": "Sharp"},
    {"id": "novita_majicmix", "name": "MajicMix v7", "credits": 2, "badge": "Skin"},
    {"id": "novita_realistic_vision_v6", "name": "Realistic Vision v6", "credits": 2, "badge": ""},
    {"id": "novita_epicphotogasm", "name": "EpicPhotogasm x++", "credits": 2, "badge": ""},
    # Anime / Hentai
    {"id": "novita_hassaku_hentai", "name": "Hassaku Hentai v1.3", "credits": 2, "badge": "Anime"},
    {"id": "novita_meinahentai", "name": "MeinaHentai v4", "credits": 2, "badge": "Anime"},
    {"id": "novita_anything_v5", "name": "Anything v5 (Anime)", "credits": 2, "badge": "Anime"},
    # Flux (may get filtered on explicit content)
    {"id": "fal_flux_realism", "name": "Flux Realism", "credits": 3, "badge": "Flux"},
    # CivitAI custom (Patron only) — user picks any model from CivitAI browser
    {"id": "civitai_custom", "name": "CivitAI Custom Model (Patron)", "credits": 3, "badge": "Custom"},
]

# Plans that can use CivitAI custom models
CIVITAI_CUSTOM_PLANS = {"adult_patron"}

ADULT_VIDEO_MODELS = [
    # fal.ai HIGH QUALITY (verified NSFW-passing)
    {"id": "fal_kling_t2v", "name": "Kling v2 (Best Quality)", "credits": 15, "badge": "HD", "type": "t2v"},
    {"id": "fal_ltx_t2v", "name": "LTX 2.3 (Fast)", "credits": 5, "badge": "Fast", "type": "t2v"},
    # fal.ai I2V (upload image → animate)
    {"id": "fal_kling_i2v", "name": "Kling v2 I2V (Upload → Video)", "credits": 15, "badge": "HD", "type": "i2v"},
    {"id": "fal_ltx_i2v", "name": "LTX 2 I2V (Upload → Video)", "credits": 5, "badge": "Fast", "type": "i2v"},
    # Novita.ai AnimateDiff (NSFW guaranteed, lower quality)
    {"id": "novita_uber_realistic_porn", "name": "AnimateDiff NSFW (Guaranteed)", "credits": 5, "badge": "NSFW", "type": "t2v"},
    {"id": "novita_babes", "name": "AnimateDiff Babes", "credits": 5, "badge": "NSFW", "type": "t2v"},
    {"id": "novita_hassaku_hentai", "name": "AnimateDiff Hentai", "credits": 5, "badge": "Anime", "type": "t2v"},
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
    sampler: str = "euler_ancestral"
    scheduler: str = "normal"
    seed: int = -1
    mosaic_enabled: bool = True  # Default ON for safety


class AdultVideoRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = ""
    model: str = "fal_ltx_t2v"
    image_url: str = ""  # For img2vid
    seed: int = -1
    mosaic_enabled: bool = True


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


@router.post("/checkout-crypto")
async def create_crypto_checkout(
    plan: str,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Create crypto payment invoice via NOWPayments."""
    if not settings.nowpayments_api_key:
        raise HTTPException(status_code=503, detail="Crypto payments not configured yet")

    from app.services.crypto_pay import ADULT_PLAN_USD, CryptoPayClient

    if plan not in ADULT_PLAN_USD:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {plan}")

    supabase = get_supabase(settings)
    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    if not profile.get("age_verified"):
        raise HTTPException(status_code=403, detail="Age verification required")

    origin = settings.cors_origins[0] if settings.cors_origins else "https://egaku-ai.com"

    crypto = CryptoPayClient(settings.nowpayments_api_key, settings.nowpayments_ipn_secret)
    result = await crypto.create_invoice(
        plan=plan,
        user_id=user.id,
        success_url=f"{origin}/adult?crypto=success&plan={plan}",
        cancel_url=f"{origin}/adult?crypto=cancel",
    )

    return result


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
    """Return available adult-optimized models (image + video)."""
    return {"models": ADULT_MODELS, "video_models": ADULT_VIDEO_MODELS}


# ── Showcase Gallery ──

@router.get("/showcase")
async def get_adult_showcase(
    page: int = 1,
    limit: int = 20,
    settings: Settings = Depends(get_settings),
):
    """Return NSFW showcase items (public NSFW generations marked as featured).

    Returns image_url/video_url for all items. Client handles blur for non-subscribers.
    """
    supabase = get_supabase(settings)
    offset = (page - 1) * limit

    # Fetch public NSFW generations, newest first
    result = (
        supabase.table("generations")
        .select("id, prompt, model, image_url, video_url, nsfw_flag, created_at", count="exact")
        .eq("is_public", True)
        .eq("nsfw_flag", True)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    items = []
    for row in result.data or []:
        items.append({
            "id": row["id"],
            "prompt": row.get("prompt", ""),
            "model": row.get("model", ""),
            "image_url": row.get("image_url"),
            "video_url": row.get("video_url"),
            "created_at": row["created_at"],
        })

    return {"items": items, "total": result.count or 0, "page": page}


@router.post("/showcase/publish/{generation_id}")
async def publish_to_showcase(
    generation_id: str,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Mark a generation as public NSFW showcase item (admin or owner)."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Auth required")
    token = auth_header.split(" ", 1)[1]

    supabase = get_supabase(settings)
    try:
        user = supabase.auth.get_user(token).user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    # Check ownership or admin
    gen = supabase.table("generations").select("*").eq("id", generation_id).maybe_single().execute()
    if not gen.data:
        raise HTTPException(status_code=404, detail="Generation not found")

    if gen.data["user_id"] != user.id and not is_admin(profile.get("email", "")):
        raise HTTPException(status_code=403, detail="Not authorized")

    supabase.table("generations").update({
        "is_public": True,
        "nsfw_flag": True,
    }).eq("id", generation_id).execute()

    return {"published": True}


@router.post("/generate", response_model=GenerationResponse)
async def generate_adult(
    body: AdultGenerateRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Generate adult content with mosaic control."""
    from app.services.supabase import deduct_credits

    # 0. Ensure negative prompt has quality defaults
    DEFAULT_NEGATIVE = (
        "worst quality, low quality, blurry, deformed, ugly, bad anatomy, bad hands, "
        "extra fingers, missing fingers, extra limbs, disfigured, poorly drawn face, "
        "mutated, bad proportions, gross proportions, extra eyes, missing arms, "
        "missing legs, fused fingers, too many fingers, long neck, malformed limbs"
    )
    if not body.negative_prompt or len(body.negative_prompt.strip()) < 10:
        body.negative_prompt = DEFAULT_NEGATIVE

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

    # 6. Generate via GPU backends (priority: vast.ai → fal.ai → novita)
    from app.services.fal_ai import FalClient

    fal_client = FalClient(settings)
    job_id = str(uuid.uuid4())

    # Try vast.ai first (cheapest, no content filter)
    if settings.vastai_api_key:
        try:
            from app.services.vastai import VastAIClient
            vast_client = VastAIClient(settings.vastai_api_key)
            vast_result = await vast_client.submit_comfyui_workflow(
                prompt=body.prompt,
                negative_prompt=body.negative_prompt,
                width=body.width,
                height=body.height,
                steps=body.steps,
                cfg=body.cfg,
                seed=body.seed,
            )
            if vast_result:
                from app.api.generate import _save_generation_to_db, _store_job_status
                await _store_job_status(settings, job_id, "completed", {"url": vast_result, "backend": "vastai"})
                await _save_generation_to_db(
                    settings, user.id, job_id, "txt2img", body.prompt,
                    body.negative_prompt, model_id, body.model_dump(), vast_result, True,
                )
                return GenerationResponse(
                    job_id=job_id,
                    status=JobStatus.completed,
                    credits_used=base_cost,
                    result_url=vast_result,
                )
        except Exception as e:
            logger.warning(f"vast.ai generation failed, falling back to fal.ai: {e}")

    # ── ADULT GENERATION STRATEGY ──
    # Priority: Novita.ai (zero filters) → fal.ai (with black image check) → error
    # Novita.ai has NO safety filters at all — this is the whole point for adult content.

    from app.api.generate import _save_generation_to_db, _store_job_status

    async def _save_and_return(url: str, backend: str) -> GenerationResponse:
        await _store_job_status(settings, job_id, "completed", {"url": url, "backend": backend})
        await _save_generation_to_db(
            settings, user.id, job_id, "txt2img", body.prompt,
            body.negative_prompt, model_id, body.model_dump(), url, True,
        )
        return GenerationResponse(
            job_id=job_id, status=JobStatus.completed,
            credits_used=base_cost, result_url=url,
        )

    # ─── 1. ALWAYS try Novita.ai first for adult (NO safety filter) ───
    novita_model = model_id if model_id.startswith("novita_") else "novita_dreamshaper_xl"
    if settings.novita_api_key:
        try:
            from app.api.generate import _generate_with_novita_builtin
            from app.models.schemas import ImageGenerateRequest

            img_body = ImageGenerateRequest(
                prompt=body.prompt,
                negative_prompt=body.negative_prompt,
                model=novita_model,
                width=body.width,
                height=body.height,
                steps=body.steps,
                cfg=body.cfg,
                seed=body.seed,
                nsfw=True,
            )
            result = await _generate_with_novita_builtin(
                novita_model, img_body, img_body.model_dump(), job_id, settings, user.id, base_cost,
            )
            if result:
                logger.info(f"Adult generation via Novita.ai succeeded ({novita_model})")
                return result
        except Exception as e:
            logger.warning(f"Novita.ai adult generation failed, trying fal.ai: {e}")

    # ─── 2. Fallback: fal.ai with NSFW-friendly model ───
    if fal_client.is_available():
        nsfw_model = model_id if model_id.startswith("fal_") else "fal_flux_realism"
        NSFW_SAFE = {"fal_flux_realism", "fal_flux_dev", "fal_sdxl"}
        if nsfw_model not in NSFW_SAFE:
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

            if result_url and not await fal_client.is_black_image(result_url):
                return await _save_and_return(result_url, "fal")

            # Black image from fal → try flux_realism as last resort
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
                    return await _save_and_return(retry_url, "fal")

            # Still black → if we got a URL, DON'T return it (it's black)
            logger.warning("fal.ai returned black image even after retry — all backends failed")

        except Exception as e:
            logger.error(f"fal.ai adult generation failed: {e}")

    raise HTTPException(
        status_code=503,
        detail="Generation was blocked by safety filters on all backends. "
               "Try adjusting your prompt or using a different model.",
    )


# ── Video Generation ──

@router.post("/generate-video", response_model=GenerationResponse)
async def generate_adult_video(
    body: AdultVideoRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Generate adult video content."""
    from app.services.supabase import deduct_credits

    # 1. Prompt compliance
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

    # 3. Access check
    _check_adult_access(profile)

    # 4. Credits
    model_id = body.model or "fal_ltx_t2v"
    base_cost = 5
    for m in ADULT_VIDEO_MODELS:
        if m["id"] == model_id:
            base_cost = m["credits"]
            break

    success = await deduct_credits(supabase, user.id, base_cost, f"Adult video ({model_id})")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    from app.api.generate import _save_generation_to_db, _store_job_status

    job_id = str(uuid.uuid4())
    is_novita_model = model_id.startswith("novita_")

    # 5a. Novita.ai video (NSFW, no filters) — for novita_ models or as primary
    if settings.novita_api_key and (is_novita_model or not body.image_url):
        try:
            from app.services.novita import BUILTIN_MODELS, NovitaClient

            novita = NovitaClient(settings)
            # Pick the video model checkpoint
            video_checkpoint = "uberRealisticPornMerge_urpmv13.safetensors"
            if is_novita_model and model_id in BUILTIN_MODELS:
                video_checkpoint = BUILTIN_MODELS[model_id]["model_name"]

            video_url = await novita.generate_video(
                prompt=body.prompt,
                model_name=video_checkpoint,
                width=512,
                height=512,
                steps=25,
                guidance_scale=7,
                frames=16,
                seed=body.seed,
                negative_prompt=body.negative_prompt,
            )
            if video_url:
                await _store_job_status(settings, job_id, "completed", {"url": video_url, "backend": "novita"})
                await _save_generation_to_db(
                    settings, user.id, job_id, "txt2vid", body.prompt,
                    body.negative_prompt, model_id, body.model_dump(), video_url, True,
                )
                return GenerationResponse(
                    job_id=job_id,
                    status=JobStatus.completed,
                    credits_used=base_cost,
                    result_url=video_url,
                )
        except Exception as e:
            logger.warning(f"Novita.ai video failed, trying fal.ai: {e}")

    # 5b. Fallback: fal.ai video
    from app.services.fal_ai import VIDEO_MODELS, FalClient

    fal_client = FalClient(settings)
    if not fal_client.is_available():
        raise HTTPException(status_code=503, detail="Video GPU backend unavailable")

    fal_model = model_id if model_id in VIDEO_MODELS else "fal_ltx_t2v"
    is_img2vid = bool(body.image_url)

    try:
        if is_img2vid:
            fal_result = await fal_client.submit_img2vid(
                image_url=body.image_url,
                prompt=body.prompt,
                seed=body.seed,
                model_id=fal_model,
            )
        else:
            fal_result = await fal_client.submit_txt2vid(
                prompt=body.prompt,
                seed=body.seed,
                model_id=fal_model,
            )

        result_url = fal_client.extract_video_url(fal_result)
        if result_url:
            gen_type = "img2vid" if is_img2vid else "txt2vid"
            await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "fal"})
            await _save_generation_to_db(
                settings, user.id, job_id, gen_type, body.prompt,
                body.negative_prompt, fal_model, body.model_dump(), result_url, True,
            )
            return GenerationResponse(
                job_id=job_id,
                status=JobStatus.completed,
                credits_used=base_cost,
                result_url=result_url,
            )

    except Exception as e:
        logger.error(f"Adult video generation failed: {e}")
        raise HTTPException(status_code=500, detail="Video generation failed. Please try again.")

    raise HTTPException(status_code=500, detail="Video generation produced no result")


# ── CivitAI Custom Model Generation (Patron only) ──

class CivitAICustomRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = ""
    civitai_model_name: str = Field(..., description="safetensors filename from CivitAI")
    width: int = Field(512, ge=256, le=2048)
    height: int = Field(768, ge=256, le=2048)
    steps: int = Field(25, ge=1, le=100)
    cfg: float = Field(7.0, ge=1.0, le=30.0)
    sampler: str = "DPM++ 2M Karras"
    seed: int = -1


@router.post("/generate-civitai", response_model=GenerationResponse)
async def generate_with_civitai(
    body: CivitAICustomRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Generate with any CivitAI model (Patron plan only)."""
    from app.services.supabase import deduct_credits

    _check_adult_prompt(body.prompt)

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

    _check_adult_access(profile)

    # Patron-only check for custom CivitAI models
    adult_plan = profile.get("adult_plan", "none")
    if adult_plan not in CIVITAI_CUSTOM_PLANS and not is_admin(profile.get("email", "")):
        raise HTTPException(
            status_code=403,
            detail="Custom CivitAI models require Patron plan (¥9,800/mo).",
        )

    base_cost = 3
    success = await deduct_credits(supabase, user.id, base_cost, f"Adult CivitAI ({body.civitai_model_name[:30]})")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    from app.api.generate import _save_generation_to_db, _store_job_status
    from app.services.novita import NovitaClient

    novita = NovitaClient(settings)
    job_id = str(uuid.uuid4())

    try:
        urls = await novita.generate_with_checkpoint(
            prompt=body.prompt,
            model_name=body.civitai_model_name,
            width=body.width,
            height=body.height,
            steps=body.steps,
            guidance_scale=body.cfg,
            seed=body.seed,
            negative_prompt=body.negative_prompt,
            sampler_name=body.sampler,
        )
        if urls:
            result_url = urls[0]
            await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "novita_civitai"})
            await _save_generation_to_db(
                settings, user.id, job_id, "txt2img", body.prompt,
                body.negative_prompt, body.civitai_model_name, body.model_dump(), result_url, True,
            )
            return GenerationResponse(
                job_id=job_id,
                status=JobStatus.completed,
                credits_used=base_cost,
                result_url=result_url,
            )
    except Exception as e:
        logger.error(f"CivitAI custom generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")

    raise HTTPException(status_code=500, detail="Generation produced no result")


# ── Advanced: img2img, ControlNet, Inpaint, LoRA, vid2vid ──

class AdultImg2ImgRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = ""
    image: str = ""  # base64 encoded
    model: str = "novita_uber_realistic_porn"
    width: int = Field(512, ge=256, le=2048)
    height: int = Field(768, ge=256, le=2048)
    steps: int = Field(25, ge=1, le=100)
    cfg: float = Field(7.0, ge=1.0, le=30.0)
    denoise: float = Field(0.7, ge=0.0, le=1.0)
    sampler: str = "DPM++ 2M Karras"
    seed: int = -1


class AdultControlNetRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = ""
    image: str = ""  # base64 encoded control image
    control_type: str = "openpose"  # canny, depth, openpose, scribble
    control_strength: float = Field(1.0, ge=0.0, le=2.0)
    model: str = "novita_uber_realistic_porn"
    width: int = Field(512, ge=256, le=2048)
    height: int = Field(768, ge=256, le=2048)
    steps: int = Field(25, ge=1, le=100)
    cfg: float = Field(7.0, ge=1.0, le=30.0)
    sampler: str = "DPM++ 2M Karras"
    seed: int = -1


class AdultInpaintRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = ""
    image: str = ""  # base64
    mask: str = ""  # base64 mask
    model: str = "novita_uber_realistic_porn"
    width: int = Field(512, ge=256, le=2048)
    height: int = Field(768, ge=256, le=2048)
    steps: int = Field(25, ge=1, le=100)
    cfg: float = Field(7.0, ge=1.0, le=30.0)
    denoise: float = Field(0.8, ge=0.0, le=1.0)
    sampler: str = "DPM++ 2M Karras"
    seed: int = -1


class AdultLoRARequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = ""
    checkpoint_model: str = "uberRealisticPornMerge_urpmv13.safetensors"
    lora_model: str = Field(..., description="LoRA safetensors filename")
    lora_strength: float = Field(0.8, ge=0.0, le=2.0)
    width: int = Field(512, ge=256, le=2048)
    height: int = Field(768, ge=256, le=2048)
    steps: int = Field(25, ge=1, le=100)
    cfg: float = Field(7.0, ge=1.0, le=30.0)
    sampler: str = "DPM++ 2M Karras"
    seed: int = -1


async def _adult_auth(request: Request, settings: Settings):
    """Common auth + access check for adult advanced endpoints."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = auth_header.split(" ", 1)[1]
    supabase = get_supabase(settings)
    try:
        user = supabase.auth.get_user(token).user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    _check_adult_access(profile)
    return user, profile, supabase


@router.post("/img2img", response_model=GenerationResponse)
async def adult_img2img(
    body: AdultImg2ImgRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Image-to-image with NSFW models (Novita.ai, no filters)."""
    _check_adult_prompt(body.prompt)
    user, profile, supabase = await _adult_auth(request, settings)

    if not body.image:
        raise HTTPException(status_code=400, detail="Input image required")

    from app.services.supabase import deduct_credits
    success = await deduct_credits(supabase, user.id, 3, "Adult img2img")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Use fal.ai img2img (supports data URLs)
    from app.api.generate import _save_generation_to_db, _store_job_status
    from app.services.fal_ai import FalClient

    fal_client = FalClient(settings)
    job_id = str(uuid.uuid4())

    if fal_client.is_available():
        import base64 as b64mod
        image_url = f"data:image/png;base64,{body.image}" if not body.image.startswith("data:") else body.image
        try:
            fal_result = await fal_client.submit_img2img(
                prompt=body.prompt,
                image_url=image_url,
                strength=body.denoise,
                width=body.width,
                height=body.height,
                steps=body.steps,
                cfg=body.cfg,
                seed=body.seed,
                negative_prompt=body.negative_prompt,
            )
            result_url = fal_client.extract_image_url(fal_result)
            if result_url:
                await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "fal"})
                await _save_generation_to_db(
                    settings, user.id, job_id, "img2img", body.prompt,
                    body.negative_prompt, body.model, body.model_dump(), result_url, True,
                )
                return GenerationResponse(job_id=job_id, status=JobStatus.completed, credits_used=3, result_url=result_url)
        except Exception as e:
            logger.error(f"Adult img2img failed: {e}")

    raise HTTPException(status_code=503, detail="img2img service unavailable")


@router.post("/controlnet", response_model=GenerationResponse)
async def adult_controlnet(
    body: AdultControlNetRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """ControlNet generation with NSFW models (openpose, canny, depth, scribble)."""
    _check_adult_prompt(body.prompt)
    user, profile, supabase = await _adult_auth(request, settings)

    if not body.image:
        raise HTTPException(status_code=400, detail="Control image required")

    from app.services.supabase import deduct_credits
    success = await deduct_credits(supabase, user.id, 3, f"Adult ControlNet ({body.control_type})")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    from app.api.generate import _save_generation_to_db, _store_job_status
    from app.services.fal_ai import FalClient

    fal_client = FalClient(settings)
    job_id = str(uuid.uuid4())

    if fal_client.is_available():
        image_url = f"data:image/png;base64,{body.image}" if not body.image.startswith("data:") else body.image
        try:
            fal_result = await fal_client.submit_controlnet(
                prompt=body.prompt,
                image_url=image_url,
                control_type=body.control_type,
                control_strength=body.control_strength,
                width=body.width,
                height=body.height,
                steps=body.steps,
                cfg=body.cfg,
                seed=body.seed,
                negative_prompt=body.negative_prompt,
            )
            result_url = fal_client.extract_image_url(fal_result)
            if result_url:
                await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "fal"})
                await _save_generation_to_db(
                    settings, user.id, job_id, "controlnet", body.prompt,
                    body.negative_prompt, body.control_type, body.model_dump(), result_url, True,
                )
                return GenerationResponse(job_id=job_id, status=JobStatus.completed, credits_used=3, result_url=result_url)
        except Exception as e:
            logger.error(f"Adult ControlNet failed: {e}")

    raise HTTPException(status_code=503, detail="ControlNet service unavailable")


@router.post("/inpaint", response_model=GenerationResponse)
async def adult_inpaint(
    body: AdultInpaintRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Inpaint with NSFW models — edit parts of an image."""
    _check_adult_prompt(body.prompt)
    user, profile, supabase = await _adult_auth(request, settings)

    if not body.image or not body.mask:
        raise HTTPException(status_code=400, detail="Image and mask required")

    from app.services.supabase import deduct_credits
    success = await deduct_credits(supabase, user.id, 3, "Adult inpaint")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    from app.api.generate import _save_generation_to_db, _store_job_status
    from app.services.fal_ai import FalClient

    fal_client = FalClient(settings)
    job_id = str(uuid.uuid4())

    if fal_client.is_available():
        image_url = f"data:image/png;base64,{body.image}" if not body.image.startswith("data:") else body.image
        mask_url = f"data:image/png;base64,{body.mask}" if not body.mask.startswith("data:") else body.mask
        try:
            fal_result = await fal_client.submit_inpaint(
                prompt=body.prompt,
                image_url=image_url,
                mask_url=mask_url,
                width=body.width,
                height=body.height,
                steps=body.steps,
                cfg=body.cfg,
                denoise=body.denoise,
                seed=body.seed,
                negative_prompt=body.negative_prompt,
            )
            result_url = fal_client.extract_image_url(fal_result)
            if result_url:
                await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "fal"})
                await _save_generation_to_db(
                    settings, user.id, job_id, "inpaint", body.prompt,
                    body.negative_prompt, "inpaint", body.model_dump(), result_url, True,
                )
                return GenerationResponse(job_id=job_id, status=JobStatus.completed, credits_used=3, result_url=result_url)
        except Exception as e:
            logger.error(f"Adult inpaint failed: {e}")

    raise HTTPException(status_code=503, detail="Inpaint service unavailable")


@router.post("/generate-lora", response_model=GenerationResponse)
async def adult_generate_lora(
    body: AdultLoRARequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Generate with checkpoint + LoRA via Novita.ai (fully uncensored)."""
    _check_adult_prompt(body.prompt)
    user, profile, supabase = await _adult_auth(request, settings)

    from app.services.supabase import deduct_credits
    success = await deduct_credits(supabase, user.id, 3, f"Adult LoRA ({body.lora_model[:30]})")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    from app.api.generate import _save_generation_to_db, _store_job_status
    from app.services.novita import NovitaClient

    novita = NovitaClient(settings)
    job_id = str(uuid.uuid4())

    try:
        urls = await novita.generate_with_lora(
            prompt=body.prompt,
            checkpoint_model=body.checkpoint_model,
            lora_model=body.lora_model,
            lora_strength=body.lora_strength,
            width=body.width,
            height=body.height,
            steps=body.steps,
            guidance_scale=body.cfg,
            seed=body.seed,
            negative_prompt=body.negative_prompt,
        )
        if urls:
            result_url = urls[0]
            await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "novita_lora"})
            await _save_generation_to_db(
                settings, user.id, job_id, "txt2img", body.prompt,
                body.negative_prompt, f"{body.checkpoint_model}+{body.lora_model}", body.model_dump(), result_url, True,
            )
            return GenerationResponse(job_id=job_id, status=JobStatus.completed, credits_used=3, result_url=result_url)
    except Exception as e:
        logger.error(f"Adult LoRA generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"LoRA generation failed: {e}")

    raise HTTPException(status_code=500, detail="LoRA generation produced no result")
