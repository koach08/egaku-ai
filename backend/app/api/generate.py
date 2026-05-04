"""Image and video generation endpoints (Cloud + Local mode)."""

import base64
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response

from app.core.config import Settings, get_settings
from app.core.legal import check_prompt_compliance, get_region_rules
from app.core.region import detect_region
from app.core.security import get_client_ip, get_current_user
from app.models.schemas import (
    CREDIT_COSTS,
    GenerationResponse,
    ImageGenerateRequest,
    JobStatus,
    JobStatusResponse,
    VideoGenerateRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/generate", tags=["generation"])

# Plan-based priority (lower = higher priority)
PLAN_PRIORITY = {"studio": 0, "unlimited": 0, "pro": 1, "basic": 2, "lite": 3, "free": 3}

# Plan hierarchy for access checks
PLAN_RANK = {"free": 0, "lite": 1, "basic": 2, "pro": 3, "unlimited": 4, "studio": 5}

# Plan-based concurrency limits (cloud mode only)
PLAN_LIMITS = {
    "free": {"max_concurrent": 1, "video_allowed": True, "nsfw_allowed": True},
    "lite": {"max_concurrent": 1, "video_allowed": True, "nsfw_allowed": True},
    "basic": {"max_concurrent": 2, "video_allowed": True, "nsfw_allowed": True},
    "pro": {"max_concurrent": 4, "video_allowed": True, "nsfw_allowed": True},
    "unlimited": {"max_concurrent": 8, "video_allowed": True, "nsfw_allowed": True},
    "studio": {"max_concurrent": 12, "video_allowed": True, "nsfw_allowed": True},
}

# Model → minimum plan required (matches frontend MODELS array)
MODEL_MIN_PLAN = {
    "sd15": "free", "anime_sd15": "free",
    "sdxl": "free", "real_sdxl": "free",
    "sdxl_lightning": "free",
    "flux_schnell": "free",
    "flux_dev": "free",
    "sd35_turbo": "free",
    "sd35_large": "lite",
    "realvisxl": "free",
    "realistic_vision": "free",
    "playground": "free",
    "proteus": "free",
    "fal_flux_schnell": "free",
    "fal_flux_dev": "free",
    "fal_sdxl": "free",
    "fal_recraft": "free",
    "fal_aura_flow": "free",
    "fal_flux_realism": "free",
    "fal_nano_banana_2": "lite",
    "fal_grok_imagine": "lite",
    "novita_dreamshaper_xl": "free",
    "novita_realistic_vision": "free",
    "novita_meinamix": "free",
}

# Model ID → credit cost key
MODEL_CREDIT_KEY = {
    "sd15": "txt2img_sd15", "anime_sd15": "txt2img_sd15",
    "sdxl": "txt2img_sdxl", "real_sdxl": "txt2img_sdxl",
    "flux_schnell": "txt2img_flux_schnell",
    "flux_dev": "txt2img_flux_dev",
    "fal_nano_banana_2": "txt2img_nano_banana",
    "fal_grok_imagine": "txt2img_grok",
}


def _calculate_credits(gen_type: str, params: dict) -> int:
    model = params.get("model", "")
    if gen_type == "txt2img":
        # Check model-specific costs first
        if model in MODEL_CREDIT_KEY:
            return CREDIT_COSTS[MODEL_CREDIT_KEY[model]]
        # Fallback: detect by resolution
        is_xl = params.get("width", 512) > 768 or params.get("height", 512) > 768
        return CREDIT_COSTS["txt2img_sdxl"] if is_xl else CREDIT_COSTS["txt2img_sd15"]
    elif gen_type in ("txt2vid", "img2vid"):
        frames = params.get("frame_count", 16)
        key = f"{gen_type}_{32 if frames > 16 else 16}"
        return CREDIT_COSTS.get(key, 5)
    return 1


def _check_model_access(model: str, plan: str) -> None:
    """Raise 403 if user's plan doesn't have access to the requested model."""
    # CivitAI custom models require Basic+
    if model.startswith("civitai_"):
        if PLAN_RANK.get(plan, 0) < PLAN_RANK.get("basic", 2):
            raise HTTPException(
                status_code=403,
                detail="Custom CivitAI models require Basic plan or above. Upgrade to access.",
            )
        return

    min_plan = MODEL_MIN_PLAN.get(model)
    if min_plan and PLAN_RANK.get(plan, 0) < PLAN_RANK.get(min_plan, 0):
        plan_names = {"lite": "Lite", "basic": "Basic", "pro": "Pro"}
        required = plan_names.get(min_plan, min_plan.title())
        raise HTTPException(
            status_code=403,
            detail=f"Model '{model}' requires {required} plan or above. Upgrade to access.",
        )


# ─── Local mode dependencies ───

def _get_current_user_optional(settings: Settings = Depends(get_settings)):
    """In local mode, no auth required."""
    if settings.is_local:
        return None
    # In cloud mode, delegate to real auth
    raise HTTPException(status_code=401, detail="Use cloud auth")


# ─── Image Generation ───

@router.post("/image", response_model=GenerationResponse)
async def generate_image(
    body: ImageGenerateRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    # 1. Prompt compliance (both modes)
    is_safe, flagged = check_prompt_compliance(body.prompt)
    if not is_safe:
        raise HTTPException(
            status_code=400,
            detail=f"Content policy violation: prohibited keywords detected: {', '.join(flagged)}",
        )

    # ─── LOCAL MODE ───
    if settings.is_local:
        return await _generate_image_local(body, settings)

    # ─── CLOUD MODE ───
    return await _generate_image_cloud(body, request, settings)


async def _generate_image_local(body: ImageGenerateRequest, settings: Settings) -> GenerationResponse:
    """Local mode: send directly to local ComfyUI, no credits, no auth."""
    from app.services.local_comfyui import LocalComfyUIClient
    from app.services.local_db import save_generation

    # Import workflow builder from existing app code
    import sys
    sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[3] / "app"))
    from comfyui_api import build_txt2img_workflow

    client = LocalComfyUIClient(settings.local_comfyui_url)
    if not client.is_running():
        raise HTTPException(status_code=503, detail="ComfyUI is not running. Please start it first.")

    workflow = build_txt2img_workflow(
        prompt=body.prompt,
        negative_prompt=body.negative_prompt or settings.default_negative_prompt,
        model=body.model,
        width=body.width,
        height=body.height,
        steps=body.steps,
        cfg=body.cfg,
        sampler=body.sampler,
        scheduler=body.scheduler,
        seed=body.seed,
        batch_size=body.batch_size,
        lora_name=body.lora_name,
        lora_strength=body.lora_strength,
    )

    job_id = str(uuid.uuid4())
    try:
        result = client.generate_and_save(workflow, settings.local_output_dir, settings.generation_timeout)
        image_path = result["images"][0] if result["images"] else None
        save_generation(
            prompt=body.prompt, negative_prompt=body.negative_prompt,
            model=body.model, params=body.model_dump(),
            nsfw=body.nsfw, image_path=image_path,
        )
        return GenerationResponse(job_id=job_id, status=JobStatus.completed, credits_used=0)
    except TimeoutError:
        raise HTTPException(status_code=504, detail="Generation timed out")
    except Exception as e:
        logger.error(f"Local generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _generate_image_cloud(body: ImageGenerateRequest, request: Request, settings: Settings) -> GenerationResponse:
    """Cloud mode: auth + credits + RunPod."""
    from app.services.supabase import deduct_credits, get_supabase, get_user_profile

    # Check at least one GPU backend is configured
    has_replicate = bool(settings.replicate_api_token)
    has_fal = bool(settings.fal_api_key)
    has_runpod = bool(settings.runpod_api_key and settings.runpod_endpoint_id)
    if not has_replicate and not has_fal and not has_runpod:
        raise HTTPException(
            status_code=503,
            detail="GPU infrastructure is being set up. Image generation will be available soon.",
        )

    # Auth
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

    plan = profile["plan"]
    limits = PLAN_LIMITS[plan]

    # Auto-detect NSFW prompt and reroute to appropriate model
    from app.core.legal import is_admin, check_nsfw_prompt
    user_email = profile.get("email", "")
    if not body.nsfw and check_nsfw_prompt(body.prompt):
        # User wrote NSFW prompt but didn't toggle NSFW mode
        if profile.get("age_verified") or is_admin(user_email):
            # Auto-enable NSFW and switch to a capable model
            body.nsfw = True
            if body.model in ("flux_schnell", "fal_flux_dev", "fal_sdxl"):
                body.model = "fal_flux_realism"
            logger.info(f"Auto-NSFW: user={user.id} model→{body.model}")

    # Admin accounts bypass NSFW plan restrictions
    if body.nsfw and not limits["nsfw_allowed"] and not is_admin(user_email):
        raise HTTPException(status_code=403, detail="NSFW content requires age verification")
    if body.nsfw and not profile.get("age_verified") and not is_admin(user_email):
        raise HTTPException(status_code=403, detail="Age verification required for NSFW content")

    # Auto-translate non-English prompts
    from app.services.prompt_translate import auto_translate_prompt
    body.prompt = await auto_translate_prompt(body.prompt, settings.openai_api_key)

    # Check model access
    if body.model:
        _check_model_access(body.model, plan)

    # Daily generation limit (cost control) — image-specific
    from app.models.schemas import PLAN_LIMITS_CONFIG
    plan_config = PLAN_LIMITS_CONFIG.get(plan, PLAN_LIMITS_CONFIG["free"])
    daily_limit = plan_config["daily_generations"]
    try:
        from app.services.queue import JobQueue
        queue_check = JobQueue(settings)
        daily_key = f"daily_gen_image:{user.id}:{__import__('datetime').date.today().isoformat()}"
        daily_count = await queue_check.redis.get(daily_key)
        if daily_count and int(daily_count) >= daily_limit:
            raise HTTPException(
                status_code=429,
                detail=f"Daily image generation limit reached ({daily_limit}). Upgrade your plan for more.",
            )
    except HTTPException:
        raise
    except Exception:
        pass  # Non-fatal: if Redis fails, allow generation

    # Enforce resolution limits for free/lite users
    max_res = plan_config["max_resolution"]
    if body.width > max_res:
        body.width = max_res
    if body.height > max_res:
        body.height = max_res

    ip = get_client_ip(request)
    region = detect_region(request, ip, settings)
    region_rules = get_region_rules(region)

    credits_needed = _calculate_credits("txt2img", body.model_dump())
    relaxed = False
    success = await deduct_credits(supabase, user.id, credits_needed, f"Image generation ({body.width}x{body.height})")
    if not success:
        # Check relaxed mode: paid users can use free model when credits run out
        from app.services.supabase import check_relaxed_mode
        if await check_relaxed_mode(supabase, user.id):
            relaxed = True
            body.model = "flux_schnell"  # Force cheapest model
            body.width = min(body.width, 512)
            body.height = min(body.height, 512)
            body.steps = min(body.steps, 15)
        else:
            raise HTTPException(status_code=402, detail="Insufficient credits")

    # Increment daily image counter
    try:
        from app.services.queue import JobQueue
        queue_inc = JobQueue(settings)
        inc_key = f"daily_gen_image:{user.id}:{__import__('datetime').date.today().isoformat()}"
        await queue_inc.redis.incr(inc_key)
        await queue_inc.redis.expire(inc_key, 86400)
    except Exception:
        pass

    from app.services.fal_ai import MODELS as FAL_MODELS
    from app.services.fal_ai import FalClient
    from app.services.replicate import MODELS as REP_MODELS
    from app.services.replicate import ReplicateClient

    # Resolve model
    model_id = body.model or "flux_dev"
    all_models = {**REP_MODELS, **FAL_MODELS}
    is_fal_model = model_id in FAL_MODELS
    is_rep_model = model_id in REP_MODELS

    # Fallback if model not found (unless it's a CivitAI custom model)
    if model_id not in all_models and not model_id.startswith("civitai_"):
        model_id = "flux_dev"
        is_rep_model = True

    params = body.model_dump()
    params["steps"] = params.get("steps", 20)

    # ─── Smart Prompt Optimization ───
    try:
        from app.services.prompt_optimizer import optimize_prompt
        opt = optimize_prompt(
            prompt=body.prompt,
            model_id=model_id,
            nsfw=body.nsfw,
            auto_enhance=True,
        )
        # Use optimized prompt for generation (original stored for DB)
        original_prompt = body.prompt
        body.prompt = opt["prompt"]
        if not body.negative_prompt:
            body.negative_prompt = opt["negative_prompt"]
        params["prompt"] = body.prompt
        params["negative_prompt"] = body.negative_prompt
        logger.info(f"Prompt optimized: {opt['content_type']} / {opt['model_family']}")
    except Exception as opt_err:
        logger.debug(f"Prompt optimization skipped: {opt_err}")

    job_id = str(uuid.uuid4())

    # ─── CivitAI custom model (LoRA via fal.ai, Checkpoint via Novita.ai) ───
    fal_client = FalClient(settings)
    if model_id.startswith("civitai_"):
        try:
            custom_result = await _generate_with_civitai_model(
                fal_client, supabase, user.id, model_id, body, params, job_id, settings, credits_needed,
            )
            if custom_result:
                return custom_result
        except Exception as custom_err:
            logger.error(f"CivitAI model generation failed: {custom_err}")
            # Fall through to standard generation

    # ─── Novita.ai built-in models (NSFW-friendly checkpoints) ───
    if model_id.startswith("novita_"):
        try:
            novita_result = await _generate_with_novita_builtin(
                model_id, body, params, job_id, settings, user.id, credits_needed,
            )
            if novita_result:
                return novita_result
        except Exception as novita_err:
            logger.error(f"Novita.ai built-in generation failed: {novita_err}")
            # Fall through to standard generation

    # ─── NSFW: try ComfyUI first (zero content filter, highest quality) ───
    if body.nsfw and settings.vastai_comfyui_url:
        try:
            from app.api.adult import _generate_with_comfyui, COMFYUI_CHECKPOINT_MAP, COMFYUI_DEFAULT_CHECKPOINT
            comfyui_result = await _generate_with_comfyui(
                comfyui_url=settings.vastai_comfyui_url,
                prompt=body.prompt,
                negative_prompt=body.negative_prompt,
                width=params["width"],
                height=params["height"],
                steps=params["steps"],
                cfg=params["cfg"],
                seed=body.seed or -1,
                model_id=model_id,
            )
            if comfyui_result:
                await _store_job_status(settings, job_id, "completed", {"url": comfyui_result, "backend": "comfyui"})
                await _save_generation_to_db(
                    settings, user.id, job_id, "txt2img", body.prompt,
                    body.negative_prompt, model_id, params, comfyui_result, body.nsfw,
                )
                return GenerationResponse(
                    job_id=job_id, status=JobStatus.completed,
                    credits_used=credits_needed, result_url=comfyui_result,
                )
        except Exception as comfyui_err:
            logger.warning(f"ComfyUI generation failed, falling back: {comfyui_err}")

    # ─── Try fal.ai (synchronous, fastest for SFW) ───
    if fal_client.is_available():
        # Map any model to its fal.ai equivalent
        fal_model_id = model_id if is_fal_model else _get_fal_equivalent(model_id)
        if not fal_model_id:
            fal_model_id = "fal_flux_dev"  # Default fallback

        # NSFW override: many models return black images or refuse NSFW content.
        # Route to Flux Realism which is explicitly NSFW-friendly.
        NSFW_BLOCKED_MODELS = {
            "fal_sdxl", "fal_aura_flow", "fal_recraft",
            "fal_nano_banana_2", "fal_grok_imagine",  # Google/xAI may block NSFW
        }
        if body.nsfw and fal_model_id in NSFW_BLOCKED_MODELS:
            fal_model_id = "fal_flux_realism"
            logger.info(f"NSFW mode: overriding model to fal_flux_realism")
        try:
            logger.info(f"Trying fal.ai with model {fal_model_id} (original: {model_id}) batch={body.batch_size}")
            fal_result = await fal_client.submit_txt2img(
                prompt=body.prompt,
                model_id=fal_model_id,
                width=params["width"],
                height=params["height"],
                steps=params["steps"],
                cfg=params["cfg"],
                seed=body.seed,
                negative_prompt=body.negative_prompt,
                num_images=body.batch_size,
            )
            all_urls = fal_client.extract_all_image_urls(fal_result)
            result_url = all_urls[0] if all_urls else fal_client.extract_image_url(fal_result)
            if result_url:
                # Check for black image (safety checker blocked)
                if await fal_client.is_black_image(result_url):
                    logger.warning("Black image detected from %s, retrying with fal_flux_realism", fal_model_id)
                    if fal_model_id != "fal_flux_realism":
                        try:
                            retry_result = await fal_client.submit_txt2img(
                                prompt=body.prompt,
                                model_id="fal_flux_realism",
                                width=params["width"],
                                height=params["height"],
                                steps=params["steps"],
                                cfg=params["cfg"],
                                seed=body.seed,
                                negative_prompt=body.negative_prompt,
                            )
                            retry_url = fal_client.extract_image_url(retry_result)
                            if retry_url and not await fal_client.is_black_image(retry_url):
                                result_url = retry_url
                                logger.info("Retry with fal_flux_realism succeeded")
                            else:
                                logger.warning("Retry also produced black image")
                        except Exception as retry_err:
                            logger.error(f"Retry with fal_flux_realism failed: {retry_err}")

                await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "fal"})
                await _save_generation_to_db(
                    settings, user.id, job_id, "txt2img", body.prompt,
                    body.negative_prompt, model_id, params, result_url, body.nsfw,
                )
                # Save additional batch images to DB
                for extra_url in all_urls[1:]:
                    extra_job_id = str(uuid.uuid4())
                    await _save_generation_to_db(
                        settings, user.id, extra_job_id, "txt2img", body.prompt,
                        body.negative_prompt, model_id, params, extra_url, body.nsfw,
                    )
                return GenerationResponse(
                    job_id=job_id,
                    status=JobStatus.completed,
                    credits_used=credits_needed,
                    result_url=result_url,
                    result_urls=all_urls,
                )
            logger.warning("fal.ai returned no image URL")
        except Exception as fal_err:
            logger.error(f"fal.ai submit failed: {fal_err}")
            # Fall through to Replicate

    # ─── Try Replicate (async - returns job ID for polling) ───
    rep_client = ReplicateClient(settings)
    if rep_client.is_available():
        rep_model_id = model_id if is_rep_model else "flux_dev"
        try:
            logger.info(f"Trying Replicate with model {rep_model_id}")
            rep_result = await rep_client.submit_txt2img(
                prompt=body.prompt,
                model_id=rep_model_id,
                width=params["width"],
                height=params["height"],
                steps=params["steps"],
                cfg=params["cfg"],
                seed=body.seed,
                negative_prompt=body.negative_prompt,
            )
            await _store_job_status(settings, job_id, "processing", {
                "replicate_id": rep_result.get("id"),
                "backend": "replicate",
            })
            # Store job metadata for DB save on completion
            from app.services.queue import _MEMORY_STORE
            if job_id in _MEMORY_STORE:
                _MEMORY_STORE[job_id]["data"] = {
                    "type": "txt2img", "user_id": user.id,
                    "prompt": body.prompt, "negative_prompt": body.negative_prompt,
                    "model": rep_model_id, "params": params, "nsfw": body.nsfw,
                }
            return GenerationResponse(job_id=job_id, status=JobStatus.queued, credits_used=credits_needed)
        except Exception as rep_err:
            logger.error(f"Replicate submit failed: {rep_err}")

    # ─── Last resort: RunPod (with queue timeout tracking) ───
    if settings.runpod_api_key and settings.runpod_endpoint_id and settings.redis_url:
        try:
            from app.services.queue import JobQueue
            queue = JobQueue(settings)
            job_data = {
                "type": "txt2img", "user_id": user.id, "model": model_id,
                "params": params, "region": region,
                "mosaic_required": region_rules["mosaic_required"] and body.nsfw,
                "queued_at": __import__("time").time(),
            }
            await queue.enqueue(job_id, job_data, priority=PLAN_PRIORITY[plan])
            await _try_runpod_backup(settings, queue, job_id, model_id, params, body)
            return GenerationResponse(job_id=job_id, status=JobStatus.queued, credits_used=credits_needed)
        except Exception as rp_err:
            logger.error(f"RunPod backup failed: {rp_err}")

    raise HTTPException(status_code=503, detail="All generation backends are currently unavailable. Please try again.")


def _get_fal_equivalent(replicate_model_id: str) -> str | None:
    """Map a Replicate model ID to its fal.ai equivalent."""
    mapping = {
        "flux_dev": "fal_flux_dev",
        "flux_schnell": "fal_flux_schnell",
        "sdxl": "fal_sdxl",
        "sdxl_lightning": "fal_sdxl",
        "sd15": "fal_sdxl",
        "anime_sd15": "fal_sdxl",
        "real_sdxl": "fal_flux_realism",
        "realvisxl": "fal_flux_realism",
        "realistic_vision": "fal_flux_realism",
        "playground": "fal_flux_dev",
        "proteus": "fal_flux_dev",
        "sd35_turbo": "fal_flux_schnell",
        "sd35_large": "fal_flux_dev",
    }
    return mapping.get(replicate_model_id)


async def _generate_with_civitai_model(
    fal_client,
    supabase,
    user_id: str,
    model_id: str,
    body,
    params: dict,
    job_id: str,
    settings,
    credits_needed: int,
) -> GenerationResponse | None:
    """Generate image with a CivitAI model.

    - LoRA models → fal.ai (flux-lora / sdxl-lora)
    - Checkpoint models → Novita.ai (supports any CivitAI safetensors)
    """
    # Extract CivitAI model ID from model_id (format: "civitai_12345")
    try:
        civitai_id = int(model_id.replace("civitai_", ""))
    except ValueError:
        return None

    # Look up user's saved model
    try:
        result = (
            supabase.table("user_models")
            .select("*")
            .eq("user_id", user_id)
            .eq("civitai_model_id", civitai_id)
            .maybe_single()
            .execute()
        )
        if not result or not result.data:
            raise HTTPException(status_code=404, detail="Custom model not found. Add it from the CivitAI browser first.")
        user_model = result.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to look up user model: {e}")
        return None

    model_type = user_model.get("model_type", "LORA")  # "LORA" or "Checkpoint"
    base_model = (user_model.get("base_model") or "flux").lower()

    # ─── Checkpoint → Novita.ai ───
    if model_type == "Checkpoint":
        from app.services.novita import NovitaClient
        novita = NovitaClient(settings)
        if not novita.is_available():
            logger.warning("Novita.ai not available for checkpoint generation")
            return None

        # Use the safetensors filename stored in user_models
        safetensors_name = user_model.get("safetensors_name", "")
        if not safetensors_name:
            # Try to build from CivitAI version ID
            logger.warning("No safetensors_name stored for checkpoint model")
            return None

        try:
            urls = await novita.generate_with_checkpoint(
                prompt=body.prompt,
                model_name=safetensors_name,
                width=params.get("width", 512),
                height=params.get("height", 768),
                steps=params.get("steps", 25),
                guidance_scale=params.get("cfg", 7.0),
                seed=body.seed,
                negative_prompt=body.negative_prompt,
            )
            if urls:
                result_url = urls[0]
                await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "novita"})
                await _save_generation_to_db(
                    settings, user_id, job_id, "txt2img", body.prompt,
                    body.negative_prompt, f"civitai_{civitai_id}", params, result_url, body.nsfw,
                )
                return GenerationResponse(
                    job_id=job_id, status=JobStatus.completed,
                    credits_used=credits_needed, result_url=result_url,
                )
        except Exception as e:
            logger.error(f"Novita.ai checkpoint generation failed: {e}")
            return None

    # ─── LoRA → fal.ai ───
    if not fal_client.is_available():
        return None

    version_id = user_model["civitai_version_id"]
    lora_url = f"https://civitai.com/api/download/models/{version_id}"
    if settings.civitai_api_key:
        lora_url += f"?token={settings.civitai_api_key}"

    fal_base = "flux" if "flux" in base_model or "illustrious" in base_model else "sdxl"

    fal_result = await fal_client.submit_txt2img_with_lora(
        prompt=body.prompt,
        lora_url=lora_url,
        lora_scale=1.0,
        base_model=fal_base,
        width=params.get("width", 1024),
        height=params.get("height", 1024),
        steps=params.get("steps", 28),
        cfg=params.get("cfg", 3.5) if fal_base == "flux" else params.get("cfg", 7.5),
        seed=body.seed,
        negative_prompt=body.negative_prompt,
    )

    result_url = fal_client.extract_image_url(fal_result)
    if not result_url:
        return None

    await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "fal"})
    await _save_generation_to_db(
        settings, user_id, job_id, "txt2img", body.prompt,
        body.negative_prompt, f"civitai_{civitai_id}", params, result_url, body.nsfw,
    )

    return GenerationResponse(
        job_id=job_id, status=JobStatus.completed,
        credits_used=credits_needed, result_url=result_url,
    )


async def _generate_with_novita_builtin(
    model_id: str,
    body,
    params: dict,
    job_id: str,
    settings,
    user_id: str,
    credits_needed: int,
) -> GenerationResponse | None:
    """Generate with a Novita.ai built-in model (Realistic Vision, MeinaMix, etc.)."""
    from app.services.novita import BUILTIN_MODELS, NovitaClient

    model_info = BUILTIN_MODELS.get(model_id)
    if not model_info:
        return None

    novita = NovitaClient(settings)
    if not novita.is_available():
        return None

    defaults = model_info.get("defaults", {})

    try:
        urls = await novita.generate_with_checkpoint(
            prompt=body.prompt,
            model_name=model_info["model_name"],
            width=params.get("width", defaults.get("width", 512)),
            height=params.get("height", defaults.get("height", 768)),
            steps=params.get("steps", defaults.get("steps", 25)),
            guidance_scale=params.get("cfg", defaults.get("guidance_scale", 7.0)),
            seed=body.seed,
            negative_prompt=body.negative_prompt,
        )
        if urls:
            result_url = urls[0]
            await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "novita"})
            await _save_generation_to_db(
                settings, user_id, job_id, "txt2img", body.prompt,
                body.negative_prompt, model_id, params, result_url, body.nsfw,
            )
            return GenerationResponse(
                job_id=job_id, status=JobStatus.completed,
                credits_used=credits_needed, result_url=result_url,
            )
    except Exception as e:
        logger.error(f"Novita.ai built-in generation failed: {e}")
    return None


def _apply_watermark(data: bytes) -> tuple[bytes, str, str]:
    """Apply 'Made with EGAKU AI' watermark to an image (bottom-right).
    Returns (new_bytes, content_type, ext). Falls through to originals on failure.
    """
    try:
        import io
        from PIL import Image, ImageDraw, ImageFont

        img = Image.open(io.BytesIO(data)).convert("RGBA")
        overlay = Image.new("RGBA", img.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(overlay)
        w, h = img.size
        text = "Made with EGAKU AI"
        font_size = max(16, w // 40)
        font = None
        for font_path in (
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
        ):
            try:
                font = ImageFont.truetype(font_path, font_size)
                break
            except Exception:
                continue
        if font is None:
            try:
                font = ImageFont.load_default()
            except Exception:
                font = None

        if font is not None and hasattr(font, "getlength"):
            try:
                tw = font.getlength(text)
            except Exception:
                tw = font_size * 10
        else:
            tw = font_size * 10

        padding = font_size
        x = max(0, w - int(tw) - padding)
        y = max(0, h - font_size - padding)
        # Shadow + white text (semi-transparent, visible but not obnoxious)
        if font is not None:
            draw.text((x + 2, y + 2), text, fill=(0, 0, 0, 140), font=font)
            draw.text((x, y), text, fill=(255, 255, 255, 180), font=font)
        else:
            draw.text((x + 2, y + 2), text, fill=(0, 0, 0, 140))
            draw.text((x, y), text, fill=(255, 255, 255, 180))

        img = Image.alpha_composite(img, overlay).convert("RGB")
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=92)
        return out.getvalue(), "image/jpeg", "jpg"
    except Exception as e:
        logger.warning(f"Watermark failed: {e}")
        return data, "", ""


# Plans that get NO watermark (paid plans)
_NO_WATERMARK_PLANS = {"pro", "unlimited", "studio"}


async def _persist_to_supabase_storage(
    supabase,
    result_url: str,
    job_id: str,
    is_video: bool = False,
    user_plan: str | None = None,
) -> str:
    """Download image/video from temporary URL and upload to Supabase Storage.
    Handles both HTTP URLs and base64 data URLs.
    If user_plan == "free" and not a video, apply a bottom-right watermark.
    Returns permanent Supabase Storage URL, or original URL on failure."""
    import httpx
    try:
        # Handle base64 data URLs (from ComfyUI)
        if result_url.startswith("data:"):
            import base64 as b64mod
            # Parse data:image/png;base64,XXXXX
            header, b64data = result_url.split(",", 1)
            data = b64mod.b64decode(b64data)
            content_type = header.split(":")[1].split(";")[0] if ":" in header else "image/png"
        else:
            async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
                resp = await client.get(result_url, headers={"User-Agent": "Mozilla/5.0"})
                resp.raise_for_status()
                data = resp.content
                content_type = resp.headers.get("content-type", "image/png")

        # Determine extension
        if is_video:
            ext = "mp4"
            folder = "videos"
        elif "jpeg" in content_type or "jpg" in content_type:
            ext = "jpg"
            folder = "images"
        elif "webp" in content_type:
            ext = "webp"
            folder = "images"
        else:
            ext = "png"
            folder = "images"

        # Apply watermark for non-paid users on images (paid plans: pro/unlimited/studio skip)
        if not is_video and user_plan not in _NO_WATERMARK_PLANS:
            new_data, new_ct, new_ext = _apply_watermark(data)
            if new_ct and new_ext:
                data = new_data
                content_type = new_ct
                ext = new_ext

        storage_path = f"{folder}/{job_id}.{ext}"
        supabase.storage.from_("self-hosted").upload(
            storage_path, data,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        permanent_url = f"{supabase.supabase_url}/storage/v1/object/public/self-hosted/{storage_path}"
        logger.info("Persisted to Supabase Storage: %s", permanent_url)
        return permanent_url
    except Exception as e:
        logger.warning("Failed to persist to Supabase Storage (using original URL): %s", e)
        return result_url


async def _save_generation_to_db(
    settings, user_id: str, job_id: str, gen_type: str, prompt: str,
    negative_prompt: str, model: str, params: dict, result_url: str, nsfw: bool = False,
    user_plan: str | None = None,
):
    """Save a completed generation to the database for gallery."""
    if not user_id or not result_url:
        return
    try:
        from app.services.supabase import get_supabase, save_generation
        supabase = get_supabase(settings)
        is_video = gen_type in ("txt2vid", "img2vid", "vid2vid")

        # If plan not provided, look it up so watermarking still applies on free tier.
        if user_plan is None:
            try:
                prof = supabase.table("users").select("plan").eq("id", user_id).single().execute()
                if prof and prof.data:
                    user_plan = prof.data.get("plan")
            except Exception:
                user_plan = None

        # Persist to Supabase Storage (permanent URL)
        permanent_url = await _persist_to_supabase_storage(
            supabase, result_url, job_id, is_video, user_plan=user_plan
        )

        await save_generation(supabase, {
            "id": job_id,
            "user_id": user_id,
            "prompt": prompt or "",
            "negative_prompt": negative_prompt or "",
            "model": model or "",
            "params_json": params or {},
            "nsfw_flag": nsfw,
            "image_url": permanent_url if not is_video else None,
            "video_url": permanent_url if is_video else None,
            "credits_used": 1,
            "is_public": True,
        })
        logger.info("Generation saved to DB: %s", job_id)

        # Also save to gallery table so it appears in My Gallery
        try:
            gallery_row = {
                "id": job_id,
                "user_id": user_id,
                "job_id": job_id,
                "prompt": prompt or "",
                "negative_prompt": negative_prompt or "",
                "model": model or "",
                "steps": (params or {}).get("steps", 0),
                "cfg": (params or {}).get("cfg", 0.0),
                "seed": (params or {}).get("seed", -1),
                "width": (params or {}).get("width", 0),
                "height": (params or {}).get("height", 0),
                "nsfw": nsfw,
                "public": True,
            }
            if is_video:
                gallery_row["video_url"] = permanent_url
            else:
                gallery_row["image_url"] = permanent_url
            supabase.table("gallery").insert(gallery_row).execute()
            logger.info("Gallery item created: %s", job_id)
        except Exception as gallery_err:
            logger.warning("Failed to save to gallery (non-fatal): %s", gallery_err)

        # Post to Discord showcase (SFW only, non-blocking)
        if not nsfw and settings.discord_showcase_webhook_url:
            try:
                from app.services.discord import post_to_showcase
                await post_to_showcase(
                    webhook_url=settings.discord_showcase_webhook_url,
                    image_url=permanent_url if not is_video else None,
                    video_url=permanent_url if is_video else None,
                    prompt=prompt,
                    model=model,
                )
            except Exception as discord_err:
                logger.debug("Discord post failed (non-fatal): %s", discord_err)
    except Exception as e:
        logger.warning("Failed to save generation to DB (non-fatal): %s", e)


async def _store_job_status(settings, job_id: str, status: str, data: dict | None = None):
    """Store job status in Redis if available, otherwise skip."""
    if not settings.redis_url:
        return
    try:
        import json
        from app.services.queue import JobQueue
        queue = JobQueue(settings)
        await queue.set_status(job_id, status, data)
    except Exception as e:
        logger.warning(f"Failed to store job status (non-fatal): {e}")


async def _try_runpod_backup(settings, queue, job_id, model_id, params, body):
    """Try RunPod as backup when Replicate fails."""
    try:
        from app.services.runpod import RunPodClient
        from app.services.workflows import build_workflow_for_model

        runpod = RunPodClient(settings)
        workflow = build_workflow_for_model(model_id, params)
        rp_result = await runpod.submit_job(workflow)
        await queue.set_status(job_id, "processing", {
            "runpod_id": rp_result.get("id"),
            "backend": "runpod",
        })
    except Exception as e:
        logger.error(f"RunPod backup also failed: {e}")
        await queue.set_status(job_id, "queued")


# ─── Available Models API ───

@router.get("/models")
async def list_available_models(settings: Settings = Depends(get_settings)):
    """List all available models for generation."""
    from app.services.fal_ai import MODELS as FAL_MODELS
    from app.services.replicate import MODELS as REP_MODELS

    models_list = []
    # Replicate models
    if settings.replicate_api_token:
        for model_id, info in REP_MODELS.items():
            models_list.append({
                "id": model_id,
                "name": info["name"],
                "category": info["category"],
                "description": info["description"],
                "min_plan": info["min_plan"],
                "credits": info["credits"],
            })
    # fal.ai models
    if settings.fal_api_key:
        for model_id, info in FAL_MODELS.items():
            models_list.append({
                "id": model_id,
                "name": info["name"],
                "category": info["category"],
                "description": info["description"],
                "min_plan": info["min_plan"],
                "credits": info["credits"],
            })
    return {"models": models_list}


@router.get("/video-models")
async def list_video_models():
    """List available video models."""
    from app.services.fal_ai import VIDEO_MODELS
    t2v = []
    i2v = []
    for mid, info in VIDEO_MODELS.items():
        entry = {
            "id": mid,
            "name": info["name"],
            "description": info["description"],
            "credits": info["credits"],
            "min_plan": info.get("min_plan", "free"),
        }
        if "i2v" in mid:
            i2v.append(entry)
        else:
            t2v.append(entry)
    return {"text_to_video": t2v, "image_to_video": i2v}


# ─── Video Generation ───

@router.post("/video", response_model=GenerationResponse)
async def generate_video(
    body: VideoGenerateRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    is_safe, flagged = check_prompt_compliance(body.prompt)
    if not is_safe:
        raise HTTPException(
            status_code=400,
            detail=f"Content policy violation: prohibited keywords detected: {', '.join(flagged)}",
        )

    if settings.is_local:
        return await _generate_video_local(body, settings)
    return await _generate_video_cloud(body, request, settings)


async def _generate_video_local(body: VideoGenerateRequest, settings: Settings) -> GenerationResponse:
    from app.services.local_comfyui import LocalComfyUIClient
    from app.services.local_db import save_generation

    import sys
    sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[3] / "app"))
    from comfyui_api import build_animatediff_workflow

    client = LocalComfyUIClient(settings.local_comfyui_url)
    if not client.is_running():
        raise HTTPException(status_code=503, detail="ComfyUI is not running. Please start it first.")

    workflow = build_animatediff_workflow(
        prompt=body.prompt,
        negative_prompt=body.negative_prompt or settings.default_negative_prompt,
        model=body.model,
        motion_model=body.motion_model,
        width=body.width, height=body.height,
        steps=body.steps, cfg=body.cfg,
        sampler=body.sampler, scheduler=body.scheduler,
        seed=body.seed, frame_count=body.frame_count,
        fps=body.fps, output_format=body.output_format,
    )

    job_id = str(uuid.uuid4())
    try:
        result = client.generate_and_save(workflow, settings.local_output_dir, settings.generation_timeout)
        video_path = result["videos"][0] if result["videos"] else None
        save_generation(
            prompt=body.prompt, negative_prompt=body.negative_prompt,
            model=body.model, params=body.model_dump(),
            nsfw=body.nsfw, video_path=video_path,
        )
        return GenerationResponse(job_id=job_id, status=JobStatus.completed, credits_used=0)
    except TimeoutError:
        raise HTTPException(status_code=504, detail="Generation timed out")
    except Exception as e:
        logger.error(f"Local video generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _generate_video_cloud(body: VideoGenerateRequest, request: Request, settings: Settings) -> GenerationResponse:
    """Cloud mode: auth + credits + Replicate for video generation."""
    from app.services.replicate import ReplicateClient
    from app.services.supabase import deduct_credits, get_supabase, get_user_profile

    # Auth
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

    plan = profile["plan"]
    limits = PLAN_LIMITS[plan]
    if not limits["video_allowed"]:
        raise HTTPException(status_code=403, detail="Video generation requires age verification")

    # Daily video generation limit (separate from image limit)
    from app.models.schemas import PLAN_LIMITS_CONFIG
    plan_config = PLAN_LIMITS_CONFIG.get(plan, PLAN_LIMITS_CONFIG["free"])
    daily_video_limit = plan_config.get("daily_video_generations", 99999)
    try:
        from app.services.queue import JobQueue
        queue_check = JobQueue(settings)
        daily_key = f"daily_gen_video:{user.id}:{__import__('datetime').date.today().isoformat()}"
        daily_count = await queue_check.redis.get(daily_key)
        if daily_count and int(daily_count) >= daily_video_limit:
            raise HTTPException(
                status_code=429,
                detail=f"Daily video generation limit reached ({daily_video_limit}). Upgrade your plan for more.",
            )
    except HTTPException:
        raise
    except Exception:
        pass  # Non-fatal

    frames = body.frame_count
    credit_type = "img2vid" if body.image_url else "txt2vid"
    credits_needed = _calculate_credits(credit_type, body.model_dump())
    success = await deduct_credits(supabase, user.id, credits_needed, f"Video generation ({credit_type}, {frames} frames)")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Increment daily video counter
    try:
        from app.services.queue import JobQueue
        queue_inc = JobQueue(settings)
        inc_key = f"daily_gen_video:{user.id}:{__import__('datetime').date.today().isoformat()}"
        await queue_inc.redis.incr(inc_key)
        await queue_inc.redis.expire(inc_key, 86400)
    except Exception:
        pass

    job_id = str(uuid.uuid4())

    # ─── Try fal.ai first (NSFW-friendly, synchronous) ───
    from app.services.fal_ai import VIDEO_MODELS, FalClient
    fal_client = FalClient(settings)

    # Determine if this is image-to-video or text-to-video
    is_img2vid = bool(body.image_url)

    # Resolve video model (default depends on t2v vs i2v)
    default_model = "fal_ltx_i2v" if is_img2vid else "fal_ltx_t2v"
    video_model_id = body.model or default_model
    if video_model_id not in VIDEO_MODELS:
        video_model_id = default_model

    # Check plan access for premium video models
    video_model_info = VIDEO_MODELS[video_model_id]
    video_min_plan = video_model_info.get("min_plan", "free")
    if PLAN_RANK.get(plan, 0) < PLAN_RANK.get(video_min_plan, 0):
        raise HTTPException(
            status_code=403,
            detail=f"Video model '{video_model_info['name']}' requires {video_min_plan.title()} plan or above",
        )

    if fal_client.is_available():
        try:
            if is_img2vid:
                fal_result = await fal_client.submit_img2vid(
                    image_url=body.image_url,
                    prompt=body.prompt,
                    seed=body.seed,
                    model_id=video_model_id,
                    duration=body.duration,
                    resolution=body.resolution,
                )
            else:
                fal_result = await fal_client.submit_txt2vid(
                    prompt=body.prompt,
                    seed=body.seed,
                    model_id=video_model_id,
                    duration=body.duration,
                )
            result_url = fal_client.extract_video_url(fal_result)
            gen_type_label = "img2vid" if is_img2vid else "txt2vid"
            if result_url:
                await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "fal"})
                await _save_generation_to_db(
                    settings, user.id, job_id, gen_type_label, body.prompt,
                    body.negative_prompt, video_model_id, body.model_dump(), result_url, body.nsfw,
                )
                return GenerationResponse(
                    job_id=job_id, status=JobStatus.completed,
                    credits_used=credits_needed, result_url=result_url,
                )
        except Exception as fal_err:
            logger.error(f"fal.ai video failed ({video_model_id}): {fal_err}")

    # ─── Fallback: Replicate (Wan 2.5, may reject NSFW) ───
    rep_client = ReplicateClient(settings)
    if rep_client.is_available():
        from app.services.queue import JobQueue
        queue = JobQueue(settings)
        await queue.enqueue(job_id, {"type": "txt2vid", "user_id": user.id}, priority=PLAN_PRIORITY[plan])

        try:
            rep_result = await rep_client.submit_txt2vid(
                prompt=body.prompt,
                width=body.width,
                height=body.height,
                num_frames=frames,
                fps=body.fps,
                seed=body.seed,
            )
            await queue.set_status(job_id, "processing", {
                "replicate_id": rep_result.get("id"),
                "backend": "replicate",
            })
            from app.services.queue import _MEMORY_STORE
            if job_id in _MEMORY_STORE:
                _MEMORY_STORE[job_id]["data"]["prompt"] = body.prompt
                _MEMORY_STORE[job_id]["data"]["negative_prompt"] = body.negative_prompt
            return GenerationResponse(job_id=job_id, status=JobStatus.queued, credits_used=credits_needed)
        except Exception as e:
            logger.error(f"Replicate video submit failed: {e}")
            await queue.set_status(job_id, "failed", {"error": f"Video generation failed: {e}"})

    raise HTTPException(status_code=503, detail="Video generation service is temporarily unavailable.")


# ─── Job Status ───

@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    settings: Settings = Depends(get_settings),
):
    if settings.is_local:
        return JobStatusResponse(job_id=job_id, status=JobStatus.completed, progress=1.0)

    from app.services.queue import JobQueue

    queue = JobQueue(settings)
    status = await queue.get_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")

    # If processing, check backend for actual status
    if status.get("status") == "processing":
        result_data = status.get("result", {})
        backend = result_data.get("backend", "runpod")

        # ─── Replicate status check ───
        replicate_id = result_data.get("replicate_id")
        if replicate_id or backend == "replicate":
            try:
                from app.services.replicate import ReplicateClient
                rep_client = ReplicateClient(settings)
                rep_status = await rep_client.check_status(replicate_id)
                rep_state = rep_status.get("status", "")

                if rep_state == "succeeded":
                    output = rep_status.get("output")
                    result_url = None

                    # Replicate Flux returns a list of URLs or a single URL
                    if isinstance(output, list) and output:
                        result_url = output[0]
                    elif isinstance(output, str):
                        result_url = output

                    await queue.set_status(job_id, "completed", {"url": result_url})

                    # Save to DB for gallery (non-critical)
                    if result_url:
                        try:
                            from app.services.queue import _MEMORY_STORE
                            job_entry = _MEMORY_STORE.get(job_id, {})
                            job_data = job_entry.get("data", {})
                            await _save_generation_to_db(
                                settings,
                                user_id=job_data.get("user_id", ""),
                                job_id=job_id,
                                gen_type=job_data.get("type", "txt2img"),
                                prompt=job_data.get("prompt", ""),
                                negative_prompt=job_data.get("negative_prompt", ""),
                                model=job_data.get("model", ""),
                                params=job_data.get("params", {}),
                                result_url=result_url,
                                nsfw=job_data.get("nsfw", False),
                            )
                        except Exception as save_err:
                            logger.warning("Failed to save generation to DB: %s", save_err)

                    return JobStatusResponse(
                        job_id=job_id, status=JobStatus.completed,
                        result_url=result_url, progress=1.0,
                    )

                elif rep_state in ("failed", "canceled"):
                    error_msg = rep_status.get("error") or "Generation failed"
                    await queue.set_status(job_id, "failed", {"error": error_msg})
                    return JobStatusResponse(
                        job_id=job_id, status=JobStatus.failed,
                        error=error_msg, progress=0.0,
                    )

                else:
                    # starting or processing
                    progress = 0.3 if rep_state == "starting" else 0.6
                    return JobStatusResponse(
                        job_id=job_id, status=JobStatus.processing, progress=progress,
                    )
            except Exception as e:
                logger.error(f"Replicate status check failed: {e}")

        # ─── RunPod status check ───
        runpod_id = result_data.get("runpod_id")
        if runpod_id:
            try:
                from app.services.runpod import RunPodClient
                # Use the correct endpoint for video jobs
                endpoint_id = result_data.get("endpoint_id")
                runpod = RunPodClient(settings, endpoint_id=endpoint_id)
                rp_status = await runpod.check_status(runpod_id)
                rp_state = rp_status.get("status", "")

                if rp_state == "COMPLETED":
                    output = rp_status.get("output", {})
                    result_url = None

                    # Check for image output
                    images = output.get("images", [])
                    if images:
                        first_img = images[0]
                        b64_data = None
                        if isinstance(first_img, dict) and first_img.get("data"):
                            b64_data = first_img["data"]
                        elif isinstance(first_img, str) and not first_img.startswith("http"):
                            b64_data = first_img
                        elif isinstance(first_img, str):
                            result_url = first_img

                        if b64_data:
                            await queue.redis.set(
                                f"job:{job_id}:image", b64_data, ex=3600
                            )
                            result_url = f"/api/generate/result/{job_id}"

                    # Check for video/GIF output
                    gifs = output.get("gifs", [])
                    if not result_url and gifs:
                        first_gif = gifs[0]
                        b64_data = None
                        if isinstance(first_gif, dict) and first_gif.get("data"):
                            b64_data = first_gif["data"]
                        elif isinstance(first_gif, str) and not first_gif.startswith("http"):
                            b64_data = first_gif
                        elif isinstance(first_gif, str):
                            result_url = first_gif

                        if b64_data:
                            await queue.redis.set(
                                f"job:{job_id}:video", b64_data, ex=3600
                            )
                            result_url = f"/api/generate/result/{job_id}?type=video"

                    await queue.set_status(job_id, "completed", {"url": result_url})

                    # ─── Prompt Cache: store the result for future lookups ───
                    if result_url:
                        try:
                            job_raw = await queue.redis.get(f"job:{job_id}")
                            if job_raw:
                                import json
                                job_info = json.loads(job_raw)
                                prompt_hash = job_info.get("prompt_hash")
                                if prompt_hash:
                                    from app.services.cache import PromptCache
                                    cache = PromptCache(settings)
                                    await cache.store(prompt_hash, result_url)
                        except Exception as cache_err:
                            logger.warning("Failed to cache result (non-fatal): %s", cache_err)

                    return JobStatusResponse(
                        job_id=job_id, status=JobStatus.completed,
                        result_url=result_url, progress=1.0,
                    )

                elif rp_state == "FAILED":
                    error_msg = rp_status.get("error", "Generation failed")
                    await queue.set_status(job_id, "failed", {"error": error_msg})
                    return JobStatusResponse(
                        job_id=job_id, status=JobStatus.failed,
                        error=error_msg, progress=0.0,
                    )

                elif rp_state == "IN_QUEUE":
                    # Check if job has been queued too long (2 min timeout)
                    import time
                    try:
                        job_raw = await queue.redis.get(f"job:{job_id}")
                        if job_raw:
                            import json
                            job_info = json.loads(job_raw)
                            queued_at = job_info.get("queued_at", 0)
                            if queued_at and (time.time() - queued_at) > 120:
                                # Cancel the RunPod job
                                try:
                                    from app.services.runpod import RunPodClient
                                    runpod_cancel = RunPodClient(settings)
                                    await runpod_cancel.cancel_job(runpod_id)
                                except Exception:
                                    pass
                                await queue.set_status(job_id, "failed", {
                                    "error": "Generation timed out - no GPU workers available. Please try again.",
                                })
                                return JobStatusResponse(
                                    job_id=job_id, status=JobStatus.failed,
                                    error="Generation timed out - no GPU workers available. Please try again.",
                                    progress=0.0,
                                )
                    except Exception:
                        pass
                    return JobStatusResponse(
                        job_id=job_id, status=JobStatus.processing, progress=0.2,
                    )
                else:
                    # Still in progress
                    return JobStatusResponse(
                        job_id=job_id, status=JobStatus.processing, progress=0.5,
                    )
            except Exception as e:
                logger.error(f"RunPod status check failed: {e}")

    result = status.get("result", {})
    return JobStatusResponse(
        job_id=job_id,
        status=status["status"],
        result_url=result.get("url"),
        error=result.get("error"),
        progress=result.get("progress", 0.0),
    )


# ─── Image Result Serving ───

@router.get("/result/{job_id}")
async def get_result_image(
    job_id: str,
    type: str = "image",
    settings: Settings = Depends(get_settings),
):
    """Serve generated image or video as a proper HTTP response."""
    from app.services.queue import JobQueue

    queue = JobQueue(settings)

    if type == "video":
        b64_data = await queue.redis.get(f"job:{job_id}:video")
        if not b64_data:
            raise HTTPException(status_code=404, detail="Video not found or expired")
        video_bytes = base64.b64decode(b64_data)
        return Response(
            content=video_bytes,
            media_type="image/gif",
            headers={
                "Content-Disposition": f'inline; filename="egaku-{job_id[:8]}.gif"',
                "Cache-Control": "public, max-age=3600",
            },
        )

    b64_data = await queue.redis.get(f"job:{job_id}:image")
    if not b64_data:
        raise HTTPException(status_code=404, detail="Image not found or expired")

    image_bytes = base64.b64decode(b64_data)
    return Response(
        content=image_bytes,
        media_type="image/png",
        headers={
            "Content-Disposition": f'inline; filename="egaku-{job_id[:8]}.png"',
            "Cache-Control": "public, max-age=3600",
        },
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Image-to-Video Prompt Suggestions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

from pydantic import BaseModel, Field


class I2VPromptRequest(BaseModel):
    image_url: str = Field(..., description="Base64 data URL or HTTP URL of the image")
    nsfw: bool = False


class I2VPromptSuggestion(BaseModel):
    label: str
    prompt: str
    icon: str = ""


@router.post("/img2vid/suggest-prompts")
async def suggest_img2vid_prompts(
    body: I2VPromptRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Analyze an uploaded image and suggest motion prompts for img2vid.

    Uses GPT-4o-mini Vision to understand the image content and suggest
    4-6 motion-focused prompts that preserve the image's look/feel.
    """
    if not settings.openai_api_key:
        # Return generic templates if no OpenAI key
        return {"suggestions": _generic_motion_templates(body.nsfw)}

    import httpx

    system_prompt = (
        "You are an AI video generation prompt expert. "
        "Analyze this image and suggest 6 different motion prompts that would animate it naturally. "
        "Each prompt should describe MOTION and CAMERA movement, NOT the image content itself. "
        "The video model will use the image as the starting frame, so focus only on what MOVES.\n\n"
        "Return EXACTLY 6 suggestions in this JSON format:\n"
        '[{"label": "short 2-3 word label in Japanese", "prompt": "English motion prompt", "icon": "emoji"}]\n\n'
        "Examples of good motion prompts:\n"
        '- "gentle hair blowing in wind, subtle body sway, cinematic camera slowly zooming in"\n'
        '- "slow camera orbit around subject, dramatic lighting shift, fabric flowing"\n'
        '- "subject turns head slowly, eyes blink, lips part slightly, shallow breathing motion"\n\n'
        "Make prompts specific to what you see in the image. Include camera movements, "
        "body motions, environmental effects (wind, water, light). Keep each under 80 words."
    )

    if body.nsfw:
        system_prompt += (
            "\nThis is for adult content. You may include sensual/erotic motion descriptions "
            "like body movements, breathing, intimate gestures. Be tasteful but explicit."
        )

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={
                    "model": "gpt-4.1-mini",
                    "max_tokens": 800,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": [
                            {"type": "text", "text": "Analyze this image and suggest 6 motion prompts for video generation. Return JSON array."},
                            {"type": "image_url", "image_url": {"url": body.image_url, "detail": "low"}},
                        ]},
                    ],
                },
                timeout=30,
            )

        if resp.status_code == 200:
            import json
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            suggestions = parsed if isinstance(parsed, list) else parsed.get("suggestions", parsed.get("prompts", []))
            if suggestions:
                return {"suggestions": suggestions[:6]}

    except Exception as e:
        logger.warning(f"AI prompt suggestion failed: {e}")

    return {"suggestions": _generic_motion_templates(body.nsfw)}


def _generic_motion_templates(nsfw: bool = False) -> list[dict]:
    """Fallback generic motion templates when AI Vision is unavailable."""
    templates = [
        {"label": "風になびく", "prompt": "gentle wind blowing through hair, subtle fabric movement, soft ambient motion, cinematic", "icon": "🌊"},
        {"label": "カメラズーム", "prompt": "slow cinematic camera zoom in, depth of field shift, dramatic focus pull", "icon": "🎥"},
        {"label": "カメラ回転", "prompt": "slow camera orbit around subject, 360 degree rotation, dramatic lighting shift", "icon": "🔄"},
        {"label": "瞬き・微動", "prompt": "subtle eye blink, gentle breathing motion, slight head tilt, lifelike micro-movements", "icon": "👁"},
        {"label": "光の変化", "prompt": "dynamic lighting shift, sun rays moving across scene, golden hour transition, lens flare", "icon": "✨"},
        {"label": "自然な動き", "prompt": "natural body sway, hair flowing, fabric rippling, atmospheric particles floating", "icon": "🍃"},
    ]

    if nsfw:
        templates.extend([
            {"label": "セクシーポーズ", "prompt": "sensual slow movement, body gently swaying, seductive eye contact, intimate atmosphere", "icon": "💋"},
            {"label": "ベッドシーン", "prompt": "gentle rolling motion on bed, sheets flowing, soft breathing, intimate close-up", "icon": "🛏"},
        ])

    return templates
