"""Adult Expression module - NSFW generation with mosaic control.

Standalone subscription for adult content generation.
Requires age verification. CSAM is ALWAYS blocked.
"""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.api.billing import (
    ADULT_PLAN_CREDITS,
    ADULT_PLAN_INFO,
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

# Plans that can use CivitAI custom models (expanded from Patron-only)
CIVITAI_CUSTOM_PLANS = {"adult_creator", "adult_studio", "adult_patron"}

ADULT_VIDEO_MODELS = [
    # ── Text to Video (t2v) ──
    {"id": "fal_kling_t2v", "name": "Kling v2 (Best Quality)", "credits": 15, "badge": "HD", "type": "t2v"},
    {"id": "fal_ltx_t2v", "name": "LTX 2.3 (Fast)", "credits": 5, "badge": "Fast", "type": "t2v"},
    {"id": "novita_uber_realistic_porn", "name": "AnimateDiff NSFW (Guaranteed)", "credits": 5, "badge": "NSFW", "type": "t2v"},
    {"id": "novita_babes", "name": "AnimateDiff Babes", "credits": 5, "badge": "NSFW", "type": "t2v"},
    {"id": "novita_hassaku_hentai", "name": "AnimateDiff Hentai", "credits": 5, "badge": "Anime", "type": "t2v"},
    # ── Image to Video (i2v) — Novita AnimateDiff (NSFW guaranteed, no content filter) ──
    # fal.ai I2V blocks NSFW images — removed.
    {"id": "novita_i2v_realistic", "name": "AnimateDiff NSFW (Upload Image)", "credits": 5, "badge": "NSFW", "type": "i2v"},
    {"id": "novita_i2v_babes", "name": "AnimateDiff Babes (Upload Image)", "credits": 5, "badge": "NSFW", "type": "i2v"},
    {"id": "novita_i2v_asian", "name": "AnimateDiff Asian (Upload Image)", "credits": 5, "badge": "Asian", "type": "i2v"},
    {"id": "novita_i2v_hentai", "name": "AnimateDiff Hentai (Upload Image)", "credits": 5, "badge": "Anime", "type": "i2v"},
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
    # Free model selection: specify any Novita.ai safetensors model name
    custom_model_name: str = ""
    # LoRA support: combine with any checkpoint
    lora_model: str = ""
    lora_strength: float = Field(0.8, ge=0.0, le=2.0)


class AdultVideoRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = ""
    model: str = "fal_ltx_t2v"
    image_url: str = ""  # For img2vid
    seed: int = -1
    mosaic_enabled: bool = True
    duration: int = Field(5, ge=3, le=15)  # seconds (3-15)
    resolution: str = "720p"  # "720p" or "1080p"


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


# ── ComfyUI Direct Generation (vast.ai / self-hosted) ──

# Map model_id to ComfyUI checkpoint filename
COMFYUI_CHECKPOINT_MAP = {
    "novita_uber_realistic_porn": "uberRealisticPorn.safetensors",
    "novita_epicphotogasm": "epicphotogasm.safetensors",
    "novita_chilloutmix": "chilloutmix.safetensors",
    "novita_hassaku_hentai": "hassakuHentai.safetensors",
    "civitai_custom": "epicphotogasm.safetensors",  # default
}
COMFYUI_DEFAULT_CHECKPOINT = "epicphotogasm.safetensors"


async def _generate_with_comfyui(
    comfyui_url: str,
    prompt: str,
    negative_prompt: str,
    width: int = 768,
    height: int = 1024,
    steps: int = 30,
    cfg: float = 7.0,
    seed: int = -1,
    model_id: str = "",
) -> str | None:
    """Generate image via ComfyUI API (vast.ai or self-hosted).

    Returns base64 data URL or None on failure.
    """
    import asyncio
    import base64
    import random

    import httpx

    if seed == -1:
        seed = random.randint(0, 2**32 - 1)

    checkpoint = COMFYUI_CHECKPOINT_MAP.get(model_id, COMFYUI_DEFAULT_CHECKPOINT)

    workflow = {
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed, "steps": steps, "cfg": cfg,
                "sampler_name": "dpmpp_2m", "scheduler": "karras",
                "denoise": 1.0,
                "model": ["4", 0], "positive": ["6", 0],
                "negative": ["7", 0], "latent_image": ["5", 0],
            },
        },
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": checkpoint}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": width, "height": height, "batch_size": 1}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": negative_prompt or "worst quality, low quality, deformed, ugly, bad anatomy, text, watermark, blurry", "clip": ["4", 1]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "egaku", "images": ["8", 0]}},
    }

    async with httpx.AsyncClient(timeout=120) as client:
        # Submit workflow
        resp = await client.post(f"{comfyui_url}/prompt", json={"prompt": workflow})
        resp.raise_for_status()
        prompt_id = resp.json().get("prompt_id")
        if not prompt_id:
            return None

        logger.info(f"ComfyUI job submitted: {prompt_id} (checkpoint={checkpoint})")

        # Poll for completion (max 2 minutes)
        for i in range(24):
            await asyncio.sleep(5)
            history_resp = await client.get(f"{comfyui_url}/history/{prompt_id}")
            if history_resp.status_code != 200:
                continue
            history = history_resp.json()
            if prompt_id not in history:
                continue
            if not history[prompt_id].get("status", {}).get("completed"):
                continue

            # Get output image
            outputs = history[prompt_id].get("outputs", {})
            for node_id, node_out in outputs.items():
                for img in node_out.get("images", []):
                    filename = img.get("filename", "")
                    subfolder = img.get("subfolder", "")
                    img_resp = await client.get(
                        f"{comfyui_url}/view",
                        params={"filename": filename, "subfolder": subfolder, "type": "output"},
                    )
                    if img_resp.status_code == 200:
                        b64 = base64.b64encode(img_resp.content).decode()
                        return f"data:image/png;base64,{b64}"

        logger.warning(f"ComfyUI job timed out: {prompt_id}")
        return None


# ── Adult Opt-in (for Stripe Pro+ users) ──

# Main plans that qualify for free adult access opt-in
ADULT_OPTIN_PLANS = {"pro", "unlimited", "studio"}

# Credit grant when opting in (same as adult_creator tier)
ADULT_OPTIN_CREDITS = 500


@router.post("/opt-in")
async def adult_opt_in(
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Enable adult features for Pro/Unlimited/Studio plan users.

    No extra payment needed — adult access is a perk of paid plans.
    Requires age verification. Stripe never sees 'adult' anywhere.
    """
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Auth required")
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

    # Check main plan qualifies
    main_plan = profile.get("plan", "free")
    if main_plan not in ADULT_OPTIN_PLANS:
        raise HTTPException(
            status_code=403,
            detail=f"Adult Expression requires Pro, Unlimited, or Studio plan. Current plan: {main_plan}",
        )

    # Check age verification
    if not profile.get("age_verified"):
        raise HTTPException(status_code=403, detail="Age verification required first")

    # Already opted in?
    current_adult = profile.get("adult_plan", "none")
    if current_adult != "none":
        return {"status": "already_active", "adult_plan": current_adult}

    # Activate adult access (maps to adult_creator tier)
    adult_plan = "adult_creator"
    supabase.table("users").update({
        "adult_plan": adult_plan,
    }).eq("id", user.id).execute()

    # Grant adult credits
    current_credits = supabase.table("credits").select("balance").eq("user_id", user.id).maybe_single().execute()
    new_balance = (current_credits.data["balance"] if current_credits.data else 0) + ADULT_OPTIN_CREDITS
    supabase.table("credits").upsert({"user_id": user.id, "balance": new_balance}).execute()
    supabase.table("credit_transactions").insert({
        "user_id": user.id,
        "amount": ADULT_OPTIN_CREDITS,
        "type": "adult_optin",
        "description": f"Adult Expression activated (included with {main_plan} plan)",
    }).execute()

    logger.info(f"Adult opt-in activated: user={user.id} main_plan={main_plan} adult_plan={adult_plan}")
    return {"status": "activated", "adult_plan": adult_plan, "credits_added": ADULT_OPTIN_CREDITS}


@router.post("/opt-out")
async def adult_opt_out(
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Disable adult features."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Auth required")
    token = auth_header.split(" ", 1)[1]

    supabase = get_supabase(settings)
    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    supabase.table("users").update({"adult_plan": "none"}).eq("id", user.id).execute()
    logger.info(f"Adult opt-out: user={user.id}")
    return {"status": "deactivated"}


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
    """Create checkout for adult subscription.

    Adult payments use cryptocurrency (NOWPayments) only.
    Stripe is banned for adult content, CCBill rejected (Japan business).
    This endpoint redirects to crypto checkout.
    """
    valid_plans = {"adult_starter", "adult_creator", "adult_studio", "adult_patron"}
    if plan not in valid_plans:
        raise HTTPException(status_code=400, detail=f"Invalid adult plan: {plan}")

    supabase = get_supabase(settings)
    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    if not profile.get("email_verified", True):
        raise HTTPException(status_code=403, detail="Please verify your email before purchasing")

    if not profile.get("age_verified"):
        raise HTTPException(status_code=403, detail="Age verification required before purchasing adult plan")

    # Redirect to crypto checkout (only payment method for adult plans)
    return {"redirect": "crypto", "detail": "Adult plans use cryptocurrency payment only."}


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

    if not profile.get("email_verified", True):
        raise HTTPException(status_code=403, detail="Please verify your email before purchasing")

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
    """Return content rules for user's region (mosaic requirements, legal warnings).

    Admins bypass mosaic requirements for site management.
    """
    ip = get_client_ip(request)
    region = detect_region(request, ip, settings)
    rules = get_region_rules(region)

    # Check if requester is admin (optional auth - no 401 if missing)
    admin_bypass = False
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ", 1)[1]
            supabase = get_supabase(settings)
            user_resp = supabase.auth.get_user(token)
            user_email = user_resp.user.email or ""
            if is_admin(user_email):
                admin_bypass = True
        except Exception:
            pass

    mosaic_required = rules.get("mosaic_required", False) and not admin_bypass

    legal_warnings = []
    if region == "JP" and not admin_bypass:
        legal_warnings.append(
            "Japanese law (Article 175 of the Penal Code) prohibits distribution of "
            "uncensored depictions of genitalia. Mosaic/censoring is required for any "
            "public distribution. Private use is at your own discretion."
        )
    elif region == "KR" and not admin_bypass:
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
        "mosaic_required": mosaic_required,
        "mosaic_default": mosaic_required,
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
    request: Request = None,
    settings: Settings = Depends(get_settings),
):
    """Return NSFW showcase items (public NSFW generations marked as featured).

    For JP region: mosaic_required=true is included in response.
    Client must apply mosaic/pixelation on public NSFW images when mosaic_required.
    """
    # Detect region for mosaic requirement
    region = "US"
    if request:
        ip = get_client_ip(request)
        region = detect_region(request, ip, settings)

    # Admin bypass for mosaic (optional auth)
    admin_bypass = False
    if request:
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ", 1)[1]
                supabase_auth = get_supabase(settings)
                user_resp = supabase_auth.auth.get_user(token)
                if is_admin(user_resp.user.email or ""):
                    admin_bypass = True
            except Exception:
                pass
    mosaic_required = region in ("JP", "KR") and not admin_bypass

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

    return {"items": items, "total": result.count or 0, "page": page, "mosaic_required": mosaic_required, "region": region}


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

    # ── ADULT GENERATION STRATEGY ──
    # Priority: ComfyUI (highest quality, no filter) → Novita.ai (no filter) → fal.ai (filtered) → error

    # ─── 0. ComfyUI via vast.ai (highest quality, zero content filter) ───
    if settings.vastai_comfyui_url:
        try:
            comfyui_result = await _generate_with_comfyui(
                comfyui_url=settings.vastai_comfyui_url,
                prompt=body.prompt,
                negative_prompt=body.negative_prompt,
                width=body.width,
                height=body.height,
                steps=body.steps,
                cfg=body.cfg,
                seed=body.seed,
                model_id=model_id,
            )
            if comfyui_result:
                from app.api.generate import _save_generation_to_db, _store_job_status
                await _store_job_status(settings, job_id, "completed", {"url": comfyui_result, "backend": "comfyui"})
                await _save_generation_to_db(
                    settings, user.id, job_id, "txt2img", body.prompt,
                    body.negative_prompt, model_id, body.model_dump(), comfyui_result, True,
                )
                logger.info(f"Adult generation via ComfyUI succeeded")
                return GenerationResponse(
                    job_id=job_id, status=JobStatus.completed,
                    credits_used=base_cost, result_url=comfyui_result,
                )
        except Exception as e:
            logger.warning(f"ComfyUI generation failed, falling back to Novita: {e}")

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

    # Handle custom model name (free model selection)
    custom_model = body.custom_model_name.strip() if body.custom_model_name else ""
    lora_model = body.lora_model.strip() if body.lora_model else ""

    if settings.novita_api_key:
        try:
            # If LoRA is specified, use generate_with_lora
            if lora_model:
                from app.services.novita import NovitaClient
                novita = NovitaClient(settings)
                # Determine checkpoint for LoRA
                checkpoint = custom_model if custom_model else None
                if not checkpoint:
                    # Map model_id to safetensors name
                    from app.services.novita import BUILTIN_MODELS
                    checkpoint = BUILTIN_MODELS.get(novita_model, {}).get("model_name")
                    if not checkpoint:
                        checkpoint = "uberRealisticPornMerge_urpmv13.safetensors"

                result_urls = await novita.generate_with_lora(
                    prompt=body.prompt,
                    negative_prompt=body.negative_prompt,
                    checkpoint_model=checkpoint,
                    lora_model=lora_model,
                    lora_strength=body.lora_strength,
                    width=body.width,
                    height=body.height,
                    steps=body.steps,
                    guidance_scale=body.cfg,
                    seed=body.seed,
                )
                if result_urls:
                    logger.info(f"Adult generation via Novita.ai LoRA succeeded ({checkpoint} + {lora_model})")
                    return await _save_and_return(result_urls[0], "novita_lora")

            # If custom model name is specified, use it directly via Novita
            elif custom_model:
                from app.services.novita import NovitaClient
                novita = NovitaClient(settings)
                result_urls = await novita.generate_with_checkpoint(
                    prompt=body.prompt,
                    negative_prompt=body.negative_prompt,
                    model_name=custom_model,
                    width=body.width,
                    height=body.height,
                    steps=body.steps,
                    guidance_scale=body.cfg,
                    seed=body.seed,
                )
                if result_urls:
                    logger.info(f"Adult generation via Novita.ai custom model succeeded ({custom_model})")
                    return await _save_and_return(result_urls[0], "novita_custom")

            # Standard flow: use builtin model mapping
            else:
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

    is_i2v = bool(body.image_url)

    # ━━━━━━━ IMAGE-TO-VIDEO ━━━━━━━
    # Priority: vast.ai ComfyUI AnimateDiff (real i2v, no filter) → Novita AnimateDiff (prompt-based fallback)
    if is_i2v:
        logger.info(f"img2vid: duration={body.duration}s")

        # ── Try vast.ai ComfyUI AnimateDiff first (actual image animation) ──
        if settings.vastai_comfyui_url:
            try:
                from app.services.vastai import VastAIClient
                vast_client = VastAIClient(settings.vastai_api_key)
                vast_client._instance = type('obj', (object,), {
                    'ip': settings.vastai_comfyui_url.split('//')[1].split(':')[0],
                    'port': int(settings.vastai_comfyui_url.split(':')[-1]),
                })()

                import base64 as _b64
                if body.image_url.startswith("data:"):
                    img_b64 = body.image_url.split(",", 1)[1]
                else:
                    import httpx as _hx
                    _resp = await _hx.AsyncClient().get(body.image_url, timeout=30)
                    img_b64 = _b64.b64encode(_resp.content).decode()

                video_result = await vast_client.submit_img2vid_workflow(
                    image_b64=img_b64,
                    prompt=body.prompt or "smooth natural motion, cinematic",
                    negative_prompt=body.negative_prompt or "worst quality, low quality",
                    width=512, height=512, steps=20, cfg=7.0,
                    seed=body.seed, frame_count=max(16, body.duration * 8),
                    fps=8, denoise=0.65,
                )
                if video_result:
                    await _store_job_status(settings, job_id, "completed", {"url": video_result, "backend": "vastai_animatediff"})
                    await _save_generation_to_db(
                        settings, user.id, job_id, "img2vid", body.prompt,
                        body.negative_prompt, "vastai_animatediff", body.model_dump(), video_result, True,
                    )
                    return GenerationResponse(
                        job_id=job_id, status=JobStatus.completed,
                        credits_used=base_cost, result_url=video_result,
                    )
            except Exception as e:
                logger.warning(f"vast.ai img2vid failed, falling back to Novita: {e}")

        # ── Fallback: Novita AnimateDiff (prompt-based, AI Vision describes image) ──
        if not settings.novita_api_key:
            raise HTTPException(status_code=503, detail="No video backend available")

        try:
            from app.services.novita import NovitaClient, BUILTIN_MODELS
            novita = NovitaClient(settings)

            # ── Step 1: AI Vision → describe the image in detail ──
            video_prompt = body.prompt  # User's prompt as base
            if settings.openai_api_key and body.image_url:
                try:
                    import httpx as _httpx
                    vision_resp = await _httpx.AsyncClient().post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                        json={
                            "model": "gpt-4o-mini",
                            "max_tokens": 300,
                            "messages": [{
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": (
                                        "Describe this image in detail for AI video generation. "
                                        "Include: subject appearance (hair, body, clothing/nudity, pose), "
                                        "setting, lighting, camera angle. Be explicit and detailed. "
                                        "Output ONLY the description as comma-separated tags, no commentary. "
                                        "Add motion description: what movement would look natural."
                                    )},
                                    {"type": "image_url", "image_url": {"url": body.image_url, "detail": "low"}},
                                ],
                            }],
                        },
                        timeout=30,
                    )
                    if vision_resp.status_code == 200:
                        ai_desc = vision_resp.json()["choices"][0]["message"]["content"]
                        # Combine user prompt + AI description
                        if video_prompt:
                            video_prompt = f"{video_prompt}, {ai_desc}"
                        else:
                            video_prompt = ai_desc
                        logger.info(f"AI Vision described image: {video_prompt[:150]}...")
                except Exception as ve:
                    logger.warning(f"AI Vision failed (using user prompt only): {ve}")

            if not video_prompt:
                video_prompt = "beautiful woman, smooth cinematic motion, high quality"

            neg = body.negative_prompt or "worst quality, low quality, deformed, ugly, bad anatomy"

            # ── Step 2: Pick checkpoint ──
            I2V_CHECKPOINTS = {
                "novita_i2v_realistic": "uberRealisticPornMerge_urpmv13.safetensors",
                "novita_i2v_babes": "babes_20.safetensors",
                "novita_i2v_asian": "chilloutmix_NiPrunedFp32Fix.safetensors",
                "novita_i2v_hentai": "hassakuHentaiModel_v13.safetensors",
            }
            checkpoint = I2V_CHECKPOINTS.get(model_id, "uberRealisticPornMerge_urpmv13.safetensors")
            if model_id in BUILTIN_MODELS:
                checkpoint = BUILTIN_MODELS[model_id]["model_name"]

            # ── Step 3: Generate video with AnimateDiff ──
            fps = 8
            frames = max(16, min(body.duration * fps, 64))

            video_url = await novita.generate_video(
                prompt=video_prompt,
                model_name=checkpoint,
                width=512,
                height=512,
                steps=20,
                guidance_scale=7.0,
                frames=frames,
                seed=body.seed,
                negative_prompt=neg,
            )
            if video_url:
                await _store_job_status(settings, job_id, "completed", {"url": video_url, "backend": "novita_animatediff"})
                await _save_generation_to_db(
                    settings, user.id, job_id, "img2vid", body.prompt,
                    body.negative_prompt, checkpoint, body.model_dump(), video_url, True,
                )
                return GenerationResponse(
                    job_id=job_id,
                    status=JobStatus.completed,
                    credits_used=base_cost,
                    result_url=video_url,
                )
            raise RuntimeError("Novita AnimateDiff returned no video URL")
        except Exception as e:
            logger.error(f"Novita AnimateDiff img2vid failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Video generation failed: {e}",
            )

    # ━━━━━━━ TEXT-TO-VIDEO ━━━━━━━
    # 5a-t2v. Novita.ai AnimateDiff for txt2vid (NSFW, no filters)
    if settings.novita_api_key and is_novita_model:
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

    # 5b. Fallback: fal.ai txt2vid (i2v is already handled above)
    from app.services.fal_ai import VIDEO_MODELS, FalClient

    fal_client = FalClient(settings)
    if not fal_client.is_available():
        raise HTTPException(status_code=503, detail="Video GPU backend unavailable")

    fal_model = model_id if model_id in VIDEO_MODELS else "fal_ltx_t2v"

    try:
        fal_result = await fal_client.submit_txt2vid(
            prompt=body.prompt,
            seed=body.seed,
            model_id=fal_model,
            duration=body.duration,
        )

        result_url = fal_client.extract_video_url(fal_result)
        if result_url:
            await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "fal"})
            await _save_generation_to_db(
                settings, user.id, job_id, "txt2vid", body.prompt,
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
