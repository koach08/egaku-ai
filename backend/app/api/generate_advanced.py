"""Advanced generation endpoints: img2img, img2vid, vid2vid, upscale, inpaint, controlnet, remove-bg, style-transfer."""

import base64
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.config import Settings, get_settings
from app.core.legal import check_prompt_compliance
from app.models.schemas import (
    CREDIT_COSTS,
    ControlNetRequest,
    FaceSwapRequest,
    GenerationResponse,
    Img2ImgRequest,
    Img2VidRequest,
    InpaintRequest,
    JobStatus,
    RemoveBgRequest,
    StyleTransferRequest,
    UpscaleRequest,
    Vid2VidRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/generate", tags=["generation-advanced"])

# Plan-based priority
PLAN_PRIORITY = {"studio": 0, "unlimited": 0, "pro": 1, "basic": 2, "lite": 3, "free": 3}
PLAN_RANK = {"free": 0, "lite": 1, "basic": 2, "pro": 3, "unlimited": 4, "studio": 5}


# Style presets for style transfer
STYLE_PRESETS = {
    "ghibli": {
        "prompt": "studio ghibli style, anime, hand-painted, soft colors, whimsical, miyazaki",
        "negative": "photorealistic, 3d render, dark, gritty",
        "denoise": 0.65,
    },
    "anime": {
        "prompt": "anime style, cel shading, vibrant colors, clean lines, illustration",
        "negative": "photorealistic, 3d render, blurry",
        "denoise": 0.7,
    },
    "oil_painting": {
        "prompt": "oil painting, thick brushstrokes, canvas texture, classical art, rich colors",
        "negative": "digital art, anime, photorealistic, flat",
        "denoise": 0.7,
    },
    "watercolor": {
        "prompt": "watercolor painting, soft washes, paper texture, flowing colors, artistic",
        "negative": "digital art, sharp lines, photorealistic",
        "denoise": 0.65,
    },
    "cyberpunk": {
        "prompt": "cyberpunk style, neon lights, futuristic, dark atmosphere, high tech, sci-fi",
        "negative": "natural, pastoral, bright, cheerful",
        "denoise": 0.7,
    },
    "pixel_art": {
        "prompt": "pixel art style, 16-bit, retro game, limited palette, blocky",
        "negative": "smooth, photorealistic, high resolution",
        "denoise": 0.75,
    },
    "comic": {
        "prompt": "comic book style, bold outlines, halftone dots, dynamic, pop art colors",
        "negative": "photorealistic, soft, watercolor",
        "denoise": 0.7,
    },
    "ukiyoe": {
        "prompt": "ukiyo-e style, japanese woodblock print, flat colors, bold outlines, edo period",
        "negative": "photorealistic, 3d, modern",
        "denoise": 0.7,
    },
}


async def _auth_and_profile(request: Request, settings: Settings):
    """Common auth check, returns (user, profile, supabase)."""
    from app.services.supabase import get_supabase, get_user_profile

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

    return user, profile, supabase


async def _submit_to_runpod(
    settings: Settings,
    workflow: dict,
    job_id: str,
    job_data: dict,
    priority: int,
    images: list[dict] | None = None,
    endpoint_id: str | None = None,
):
    """Submit job to RunPod with optional image uploads. Falls back to Replicate if unavailable."""
    import httpx

    from app.services.queue import JobQueue

    queue = JobQueue(settings)
    await queue.enqueue(job_id, job_data, priority=priority)

    ep = endpoint_id or settings.runpod_endpoint_id
    url = f"https://api.runpod.ai/v2/{ep}/run"
    headers = {"Authorization": f"Bearer {settings.runpod_api_key}"}

    payload = {"input": {"workflow": workflow}}
    if images:
        payload["input"]["images"] = images

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            rp_result = response.json()
        await queue.set_status(job_id, "processing", {
            "runpod_id": rp_result.get("id"),
            "endpoint_id": ep,
            "backend": "runpod",
        })
    except Exception as e:
        logger.error(f"RunPod submit failed: {e}")
        await queue.set_status(job_id, "queued")


async def _submit_to_replicate(
    settings: Settings,
    job_id: str,
    job_data: dict,
    priority: int,
    replicate_fn,
    **kwargs,
):
    """Submit job directly to Replicate. Works with or without Redis."""
    from app.services.queue import JobQueue

    queue = JobQueue(settings)
    await queue.enqueue(job_id, job_data, priority=priority)

    try:
        rep_result = await replicate_fn(**kwargs)
        await queue.set_status(job_id, "processing", {
            "replicate_id": rep_result.get("id"),
            "backend": "replicate",
        })
    except Exception as e:
        logger.error(f"Replicate submit failed: {e}")
        await queue.set_status(job_id, "failed", {"error": str(e)})


def _b64_to_data_url(b64_data: str, mime: str = "image/png") -> str:
    """Convert base64 image to data URL for Replicate."""
    if b64_data.startswith("data:"):
        return b64_data
    return f"data:{mime};base64,{b64_data}"


def _check_infra(settings: Settings):
    """Check at least one GPU backend is available."""
    has_replicate = bool(settings.replicate_api_token)
    has_fal = bool(settings.fal_api_key)
    has_runpod = bool(settings.runpod_api_key and settings.runpod_endpoint_id)
    if not has_replicate and not has_fal and not has_runpod:
        raise HTTPException(status_code=503, detail="GPU infrastructure is being set up. Please check back later.")


# ─── img2img ───

@router.post("/img2img", response_model=GenerationResponse)
async def generate_img2img(
    body: Img2ImgRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Image-to-image generation with prompt guidance."""
    is_safe, flagged = check_prompt_compliance(body.prompt)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Content policy violation: {', '.join(flagged)}")

    _check_infra(settings)
    user, profile, supabase = await _auth_and_profile(request, settings)

    if not body.image:
        raise HTTPException(status_code=400, detail="Input image is required")

    from app.services.supabase import deduct_credits

    credits_needed = CREDIT_COSTS["img2img"]
    success = await deduct_credits(supabase, user.id, credits_needed, "img2img generation")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    job_id = str(uuid.uuid4())
    plan = profile["plan"]
    image_url = _b64_to_data_url(body.image)

    # Use Replicate for img2img
    from app.services.replicate import ReplicateClient
    rep_client = ReplicateClient(settings)
    if rep_client.is_available():
        await _submit_to_replicate(
            settings, job_id,
            job_data={"type": "img2img", "user_id": user.id},
            priority=PLAN_PRIORITY[plan],
            replicate_fn=rep_client.submit_img2img,
            image_url=image_url,
            prompt=body.prompt,
            strength=body.denoise,
            steps=body.steps,
            cfg=body.cfg,
            seed=body.seed,
            negative_prompt=body.negative_prompt,
        )
        return GenerationResponse(job_id=job_id, status=JobStatus.queued, credits_used=credits_needed)

    raise HTTPException(status_code=503, detail="Image-to-image service is temporarily unavailable.")


# ─── img2vid ───

@router.post("/img2vid", response_model=GenerationResponse)
async def generate_img2vid(
    body: Img2VidRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Animate a still image into video."""
    if body.prompt:
        is_safe, flagged = check_prompt_compliance(body.prompt)
        if not is_safe:
            raise HTTPException(status_code=400, detail=f"Content policy violation: {', '.join(flagged)}")

    user, profile, supabase = await _auth_and_profile(request, settings)

    if not body.image:
        raise HTTPException(status_code=400, detail="Input image is required")

    plan = profile["plan"]

    from app.services.supabase import deduct_credits

    credits_needed = CREDIT_COSTS.get("img2vid_16", 5)
    success = await deduct_credits(supabase, user.id, credits_needed, "img2vid generation")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    job_id = str(uuid.uuid4())
    image_url = _b64_to_data_url(body.image)

    # ─── Try fal.ai first (synchronous, accepts data URLs, NSFW-friendly) ───
    from app.services.fal_ai import VIDEO_MODELS, FalClient
    fal_client = FalClient(settings)

    # Resolve i2v model (use body.model if valid, otherwise default)
    video_model_id = body.model if body.model in VIDEO_MODELS else "fal_ltx_i2v"

    if fal_client.is_available():
        try:
            fal_result = await fal_client.submit_img2vid(
                image_url=image_url,
                prompt=body.prompt or "",
                seed=body.seed,
                model_id=video_model_id,
            )
            result_url = fal_client.extract_video_url(fal_result)
            if result_url:
                # Save to DB for gallery
                from app.api.generate import _save_generation_to_db, _store_job_status
                await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "fal"})
                await _save_generation_to_db(
                    settings, str(user.id), job_id, "img2vid", body.prompt or "",
                    "", video_model_id, {"seed": body.seed, "frame_count": body.frame_count, "fps": body.fps},
                    result_url, body.nsfw,
                )
                return GenerationResponse(
                    job_id=job_id, status=JobStatus.completed,
                    credits_used=credits_needed, result_url=result_url,
                )
        except Exception as fal_err:
            logger.error(f"fal.ai img2vid failed ({video_model_id}): {fal_err}")

    # ─── Fallback: Replicate (Wan 2.5 I2V) ───
    from app.services.replicate import ReplicateClient
    rep_client = ReplicateClient(settings)
    if rep_client.is_available():
        await _submit_to_replicate(
            settings, job_id,
            job_data={"type": "img2vid", "user_id": str(user.id)},
            priority=PLAN_PRIORITY[plan],
            replicate_fn=rep_client.submit_img2vid,
            image_url=image_url,
            prompt=body.prompt or "",
            num_frames=body.frame_count,
            fps=body.fps,
            seed=body.seed,
        )
        return GenerationResponse(job_id=job_id, status=JobStatus.queued, credits_used=credits_needed)

    raise HTTPException(status_code=503, detail="Video generation service is temporarily unavailable.")


# ─── vid2vid ───

@router.post("/vid2vid", response_model=GenerationResponse)
async def generate_vid2vid(
    body: Vid2VidRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Video-to-video style transfer."""
    is_safe, flagged = check_prompt_compliance(body.prompt)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Content policy violation: {', '.join(flagged)}")

    _check_infra(settings)
    user, profile, supabase = await _auth_and_profile(request, settings)

    plan = profile["plan"]
    if PLAN_RANK.get(plan, 0) < PLAN_RANK["pro"]:
        raise HTTPException(status_code=403, detail="Vid2vid requires Pro plan or above")

    # vid2vid requires AnimateDiff + SD1.5 models (coming soon with Network Volume)
    raise HTTPException(status_code=503, detail="Video-to-video is coming soon. Additional models are being set up.")


# ─── Upscale ───

@router.post("/upscale", response_model=GenerationResponse)
async def generate_upscale(
    body: UpscaleRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Upscale an image to higher resolution."""
    user, profile, supabase = await _auth_and_profile(request, settings)

    if not body.image:
        raise HTTPException(status_code=400, detail="Input image is required")

    from app.services.replicate import ReplicateClient
    from app.services.supabase import deduct_credits

    rep_client = ReplicateClient(settings)
    if not rep_client.is_available():
        raise HTTPException(status_code=503, detail="Upscale service is temporarily unavailable.")

    credits_needed = CREDIT_COSTS["upscale"]
    success = await deduct_credits(supabase, user.id, credits_needed, f"Upscale x{body.scale}")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    job_id = str(uuid.uuid4())
    plan = profile["plan"]
    image_url = _b64_to_data_url(body.image)

    await _submit_to_replicate(
        settings, job_id,
        job_data={"type": "upscale", "user_id": user.id},
        priority=PLAN_PRIORITY[plan],
        replicate_fn=rep_client.submit_upscale,
        image_url=image_url,
        scale=body.scale,
    )

    return GenerationResponse(job_id=job_id, status=JobStatus.queued, credits_used=credits_needed)


# ─── Inpaint ───

@router.post("/inpaint", response_model=GenerationResponse)
async def generate_inpaint(
    body: InpaintRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Inpaint part of an image based on a mask."""
    is_safe, flagged = check_prompt_compliance(body.prompt)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Content policy violation: {', '.join(flagged)}")

    _check_infra(settings)
    user, profile, supabase = await _auth_and_profile(request, settings)

    if not body.image or not body.mask:
        raise HTTPException(status_code=400, detail="Both image and mask are required")

    from app.services.replicate import ReplicateClient
    from app.services.supabase import deduct_credits

    rep_client = ReplicateClient(settings)
    if not rep_client.is_available():
        raise HTTPException(status_code=503, detail="Inpaint service is temporarily unavailable.")

    credits_needed = CREDIT_COSTS["inpaint"]
    success = await deduct_credits(supabase, user.id, credits_needed, "Inpaint generation")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    job_id = str(uuid.uuid4())
    plan = profile["plan"]
    image_url = _b64_to_data_url(body.image)
    mask_url = _b64_to_data_url(body.mask)

    await _submit_to_replicate(
        settings, job_id,
        job_data={"type": "inpaint", "user_id": user.id},
        priority=PLAN_PRIORITY[plan],
        replicate_fn=rep_client.submit_inpaint,
        image_url=image_url,
        mask_url=mask_url,
        prompt=body.prompt,
        negative_prompt=body.negative_prompt,
        strength=body.denoise,
        steps=body.steps,
        cfg=body.cfg,
        seed=body.seed,
    )

    return GenerationResponse(job_id=job_id, status=JobStatus.queued, credits_used=credits_needed)


# ─── ControlNet ───

@router.post("/controlnet", response_model=GenerationResponse)
async def generate_controlnet(
    body: ControlNetRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Generate image guided by ControlNet (canny, depth, openpose, scribble)."""
    is_safe, flagged = check_prompt_compliance(body.prompt)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Content policy violation: {', '.join(flagged)}")

    _check_infra(settings)
    user, profile, supabase = await _auth_and_profile(request, settings)

    if not body.image:
        raise HTTPException(status_code=400, detail="Control image is required")

    from app.services.supabase import deduct_credits

    credits_needed = CREDIT_COSTS["controlnet"]
    success = await deduct_credits(supabase, user.id, credits_needed, f"ControlNet ({body.control_type})")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    job_id = str(uuid.uuid4())
    plan = profile["plan"]
    image_url = _b64_to_data_url(body.image)

    # Try fal.ai ControlNet first
    from app.services.fal_ai import FalClient
    fal_client = FalClient(settings)
    if fal_client.is_available():
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
                from app.api.generate import _save_generation_to_db, _store_job_status
                await _store_job_status(settings, job_id, "completed", {"url": result_url, "backend": "fal"})
                await _save_generation_to_db(
                    settings, str(user.id), job_id, "controlnet", body.prompt,
                    body.negative_prompt, "controlnet_sdxl", body.model_dump(),
                    result_url, body.nsfw,
                )
                return GenerationResponse(
                    job_id=job_id, status=JobStatus.completed,
                    credits_used=credits_needed, result_url=result_url,
                )
        except Exception as fal_err:
            logger.error(f"fal.ai ControlNet failed: {fal_err}")

    # Fallback: Replicate
    from app.services.replicate import ReplicateClient
    rep_client = ReplicateClient(settings)
    if rep_client.is_available():
        await _submit_to_replicate(
            settings, job_id,
            job_data={"type": "controlnet", "user_id": str(user.id)},
            priority=PLAN_PRIORITY[plan],
            replicate_fn=rep_client.submit_img2img,
            image_url=image_url,
            prompt=body.prompt,
            strength=body.control_strength,
            steps=body.steps,
            cfg=body.cfg,
            seed=body.seed,
            negative_prompt=body.negative_prompt,
        )
        return GenerationResponse(job_id=job_id, status=JobStatus.queued, credits_used=credits_needed)

    raise HTTPException(status_code=503, detail="ControlNet service is temporarily unavailable.")


# ─── Remove Background ───

@router.post("/remove-bg", response_model=GenerationResponse)
async def remove_background(
    body: RemoveBgRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Remove background from an image."""
    user, profile, supabase = await _auth_and_profile(request, settings)

    if not body.image:
        raise HTTPException(status_code=400, detail="Input image is required")

    from app.services.replicate import ReplicateClient
    from app.services.supabase import deduct_credits

    rep_client = ReplicateClient(settings)
    if not rep_client.is_available():
        raise HTTPException(status_code=503, detail="Background removal service is temporarily unavailable.")

    credits_needed = CREDIT_COSTS["remove_bg"]
    success = await deduct_credits(supabase, user.id, credits_needed, "Background removal")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    job_id = str(uuid.uuid4())
    plan = profile["plan"]
    image_url = _b64_to_data_url(body.image)

    await _submit_to_replicate(
        settings, job_id,
        job_data={"type": "remove_bg", "user_id": user.id},
        priority=PLAN_PRIORITY[plan],
        replicate_fn=rep_client.submit_remove_bg,
        image_url=image_url,
    )

    return GenerationResponse(job_id=job_id, status=JobStatus.queued, credits_used=credits_needed)


# ─── Style Transfer ───

@router.post("/style-transfer", response_model=GenerationResponse)
async def style_transfer(
    body: StyleTransferRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Apply artistic style to an image (Ghibli, anime, oil painting, etc.)."""
    _check_infra(settings)
    user, profile, supabase = await _auth_and_profile(request, settings)

    if not body.image:
        raise HTTPException(status_code=400, detail="Input image is required")

    from app.services.replicate import ReplicateClient
    from app.services.supabase import deduct_credits

    credits_needed = CREDIT_COSTS["style_transfer"]
    success = await deduct_credits(supabase, user.id, credits_needed, f"Style transfer ({body.style})")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    style = STYLE_PRESETS.get(body.style, STYLE_PRESETS["ghibli"])
    prompt = body.prompt_override or style["prompt"]
    negative = style["negative"]
    denoise = body.strength if body.strength else style["denoise"]

    job_id = str(uuid.uuid4())
    plan = profile["plan"]
    image_url = _b64_to_data_url(body.image)

    rep_client = ReplicateClient(settings)
    if rep_client.is_available():
        await _submit_to_replicate(
            settings, job_id,
            job_data={"type": "style_transfer", "user_id": user.id, "style": body.style},
            priority=PLAN_PRIORITY[plan],
            replicate_fn=rep_client.submit_img2img,
            image_url=image_url,
            prompt=prompt,
            strength=denoise,
            steps=20,
            cfg=7.5,
            seed=body.seed,
            negative_prompt=negative,
        )
        return GenerationResponse(job_id=job_id, status=JobStatus.queued, credits_used=credits_needed)

    raise HTTPException(status_code=503, detail="Style transfer service is temporarily unavailable.")


# ─── Face Swap ───

@router.post("/face-swap", response_model=GenerationResponse)
async def face_swap(
    body: FaceSwapRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Swap a face from source image onto a target image. Pro+ only."""
    user, profile, supabase = await _auth_and_profile(request, settings)

    plan = profile["plan"]
    if PLAN_RANK.get(plan, 0) < PLAN_RANK["basic"]:
        raise HTTPException(status_code=403, detail="Face Swap requires Basic plan or higher")

    if not body.source_image or not body.target_image:
        raise HTTPException(status_code=400, detail="Both source and target images are required")

    from app.services.fal_ai import FalClient
    from app.services.supabase import deduct_credits

    fal_client = FalClient(settings)
    if not fal_client.is_available():
        raise HTTPException(status_code=503, detail="Face swap service is temporarily unavailable")

    credits_needed = CREDIT_COSTS["face_swap"]
    success = await deduct_credits(supabase, user.id, credits_needed, "Face swap")
    if not success:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    source_url = _b64_to_data_url(body.source_image)
    target_url = _b64_to_data_url(body.target_image)

    job_id = str(uuid.uuid4())

    try:
        result = await fal_client.face_swap(
            source_image_url=source_url,
            target_image_url=target_url,
        )

        image_url = fal_client.extract_image_url(result)
        if not image_url:
            raise RuntimeError("No image returned from face swap")

        # Store result
        from app.services.supabase import save_generation
        await save_generation(supabase, {
            "id": job_id,
            "user_id": user.id,
            "type": "face_swap",
            "prompt": "Face swap",
            "model": "fal_face_swap",
            "image_url": image_url,
            "nsfw": body.nsfw,
            "status": "completed",
        })

        return GenerationResponse(
            job_id=job_id, status=JobStatus.completed,
            credits_used=credits_needed, result_url=image_url,
        )

    except Exception as e:
        logger.error("Face swap failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Face swap failed: {str(e)}")


# ─── Available styles list ───

@router.get("/styles")
async def list_styles():
    """List available style presets for style transfer."""
    return {
        "styles": [
            {"id": "ghibli", "name": "Studio Ghibli", "description": "Miyazaki-inspired hand-painted anime"},
            {"id": "anime", "name": "Anime", "description": "Clean anime cel-shading style"},
            {"id": "oil_painting", "name": "Oil Painting", "description": "Classical oil painting with thick brushstrokes"},
            {"id": "watercolor", "name": "Watercolor", "description": "Soft watercolor washes on paper"},
            {"id": "cyberpunk", "name": "Cyberpunk", "description": "Neon-lit futuristic sci-fi style"},
            {"id": "pixel_art", "name": "Pixel Art", "description": "Retro 16-bit game style"},
            {"id": "comic", "name": "Comic Book", "description": "Bold comic style with halftone dots"},
            {"id": "ukiyoe", "name": "Ukiyo-e", "description": "Japanese woodblock print style"},
        ]
    }
