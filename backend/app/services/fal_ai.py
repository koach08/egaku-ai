"""fal.ai API client - additional GPU backend for EGAKU AI."""

import logging

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)

FAL_API_BASE = "https://fal.run"

# fal.ai models
MODELS = {
    "fal_flux_dev": {
        "fal_id": "fal-ai/flux/dev",
        "name": "Flux Dev (fal)",
        "category": "flux",
        "description": "High quality Flux via fal.ai",
        "min_plan": "free",
        "credits": 3,
    },
    "fal_flux_schnell": {
        "fal_id": "fal-ai/flux/schnell",
        "name": "Flux Schnell (fal)",
        "category": "flux",
        "description": "Fast Flux via fal.ai",
        "min_plan": "free",
        "credits": 1,
    },
    "fal_sdxl": {
        "fal_id": "fal-ai/fast-sdxl",
        "name": "SDXL (fal)",
        "category": "sdxl",
        "description": "Fast SDXL via fal.ai",
        "min_plan": "free",
        "credits": 2,
    },
    "fal_recraft": {
        "fal_id": "fal-ai/recraft/v3/text-to-image",
        "name": "Recraft V3",
        "category": "artistic",
        "description": "High quality artistic images",
        "min_plan": "free",
        "credits": 2,
    },
    "fal_aura_flow": {
        "fal_id": "fal-ai/aura-flow",
        "name": "AuraFlow v0.3",
        "category": "artistic",
        "description": "Open-source flow-based generation",
        "min_plan": "free",
        "credits": 2,
    },
    "fal_flux_realism": {
        "fal_id": "fal-ai/flux-realism",
        "name": "Flux Realism (NSFW OK)",
        "category": "realistic",
        "description": "Photorealistic images, NSFW-friendly",
        "min_plan": "free",
        "credits": 3,
    },
    "fal_nano_banana_2": {
        "fal_id": "fal-ai/nano-banana-2",
        "name": "Nano Banana 2",
        "category": "premium",
        "description": "Google's latest — perfect text rendering, character consistency, up to 4K",
        "min_plan": "lite",
        "credits": 8,
    },
    "fal_grok_imagine": {
        "fal_id": "xai/grok-imagine-image",
        "name": "Grok Imagine (xAI)",
        "category": "premium",
        "description": "xAI Aurora — photorealistic, precise text & logos",
        "min_plan": "lite",
        "credits": 8,
    },
    "fal_flux_pro": {
        "fal_id": "fal-ai/flux-pro/v1.1",
        "name": "Flux Pro v1.1",
        "category": "premium",
        "description": "Highest quality Flux — superior detail, composition, and prompt adherence",
        "min_plan": "basic",
        "credits": 5,
    },
    "fal_ideogram": {
        "fal_id": "fal-ai/ideogram/v3",
        "name": "Ideogram v3",
        "category": "premium",
        "description": "Best-in-class text rendering in images — logos, typography, posters",
        "min_plan": "lite",
        "credits": 5,
    },
    "fal_luma_photon": {
        "fal_id": "fal-ai/luma-photon",
        "name": "Luma Photon",
        "category": "premium",
        "description": "Luma AI's fast image model — cinematic lighting, natural composition",
        "min_plan": "lite",
        "credits": 5,
    },
}

# fal.ai video models
VIDEO_MODELS = {
    "fal_ltx_t2v": {
        "fal_id": "fal-ai/ltx-2.3/text-to-video",
        "name": "LTX 2.3",
        "description": "Fast text-to-video, NSFW-friendly",
        "credits": 5,
        "min_plan": "free",
    },
    "fal_kling_t2v": {
        "fal_id": "fal-ai/kling-video/v2/master/text-to-video",
        "name": "Kling v2",
        "description": "High quality cinematic video",
        "credits": 15,
        "min_plan": "basic",
    },
    "fal_minimax_t2v": {
        "fal_id": "fal-ai/minimax-video/video-01-live/text-to-video",
        "name": "Minimax Hailuo",
        "description": "Realistic motion, expressive characters",
        "credits": 15,
        "min_plan": "basic",
    },
    "fal_wan_t2v": {
        "fal_id": "fal-ai/wan/v2.1/text-to-video",
        "name": "Wan 2.1",
        "description": "Versatile video generation",
        "credits": 10,
        "min_plan": "free",
    },
    "fal_ltx_i2v": {
        "fal_id": "fal-ai/ltx-2-19b/image-to-video",
        "name": "LTX 2 I2V",
        "description": "Animate images to video",
        "credits": 5,
        "min_plan": "free",
    },
    "fal_kling_i2v": {
        "fal_id": "fal-ai/kling-video/v2/master/image-to-video",
        "name": "Kling v2 I2V",
        "description": "High quality image animation",
        "credits": 15,
        "min_plan": "basic",
    },
    "fal_wan_i2v": {
        "fal_id": "fal-ai/wan-i2v",
        "name": "Wan 2.1 I2V",
        "description": "Animate images with Wan",
        "credits": 10,
        "min_plan": "free",
    },
    "fal_wan26_i2v": {
        "fal_id": "wan/v2.6/image-to-video",
        "name": "Wan 2.6 I2V (Best NSFW)",
        "description": "Latest Wan model - real subject motion, NSFW OK",
        "credits": 10,
        "min_plan": "free",
    },
    # --- Premium video models (paid plans only) ---
    "fal_kling25_t2v": {
        "fal_id": "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
        "name": "Kling 2.5 Pro",
        "description": "Cinematic quality, smooth motion",
        "credits": 25,
        "min_plan": "basic",
    },
    "fal_kling25_i2v": {
        "fal_id": "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
        "name": "Kling 2.5 Pro I2V",
        "description": "Animate images with Kling 2.5",
        "credits": 25,
        "min_plan": "basic",
    },
    "fal_veo3_t2v": {
        "fal_id": "fal-ai/veo3",
        "name": "Veo 3 (Google)",
        "description": "Google's video model with audio generation",
        "credits": 40,
        "min_plan": "pro",
    },
    "fal_sora2_t2v": {
        "fal_id": "fal-ai/sora-2",
        "name": "Sora 2 (OpenAI)",
        "description": "OpenAI's cinematic video generation",
        "credits": 50,
        "min_plan": "pro",
    },
    "fal_sora2_i2v": {
        "fal_id": "fal-ai/sora-2/image-to-video",
        "name": "Sora 2 I2V",
        "description": "Animate images with Sora 2",
        "credits": 50,
        "min_plan": "pro",
    },
    "fal_grok_t2v": {
        "fal_id": "xai/grok-imagine-video",
        "name": "Grok Imagine Video",
        "description": "xAI video with native audio, 720p",
        "credits": 30,
        "min_plan": "basic",
    },
    "fal_luma_t2v": {
        "fal_id": "fal-ai/luma-dream-machine",
        "name": "Luma Dream Machine",
        "description": "Luma AI's cinematic video generation, smooth motion",
        "credits": 20,
        "min_plan": "basic",
    },
    "fal_hunyuan_t2v": {
        "fal_id": "fal-ai/hunyuan-video",
        "name": "Hunyuan Video (Tencent)",
        "description": "Tencent's open-source video model, high quality motion",
        "credits": 15,
        "min_plan": "basic",
    },
    "fal_mochi_t2v": {
        "fal_id": "fal-ai/mochi-v1",
        "name": "Mochi v1 (Genmo)",
        "description": "Genmo's video model, natural motion and physics",
        "credits": 10,
        "min_plan": "free",
    },
    "fal_seedance_t2v": {
        "fal_id": "fal-ai/bytedance/seedance",
        "name": "Seedance 1 (ByteDance)",
        "description": "ByteDance's Seedance v1 — cinematic motion, TikTok quality",
        "credits": 20,
        "min_plan": "basic",
    },
    "fal_seedance2_t2v": {
        "fal_id": "fal-ai/bytedance/seedance-2.0/text-to-video",
        "name": "Seedance 2 (ByteDance)",
        "description": "ByteDance's flagship — cinematic quality with native audio, multi-shot, physics-aware camera control",
        "credits": 60,  # ~$1.52 raw at 720p 5s
        "min_plan": "pro",
    },
    "fal_seedance2_fast_t2v": {
        "fal_id": "fal-ai/bytedance/seedance-2.0/fast/text-to-video",
        "name": "Seedance 2 Fast (ByteDance)",
        "description": "Seedance 2 fast tier — lower latency and cost, great quality",
        "credits": 50,  # ~$1.21 raw at 720p 5s
        "min_plan": "basic",
    },
    "fal_seedance2_i2v": {
        "fal_id": "fal-ai/bytedance/seedance-2.0/image-to-video",
        "name": "Seedance 2 I2V (ByteDance)",
        "description": "Animate stills into cinematic video with synced audio, start/end frame control",
        "credits": 60,
        "min_plan": "pro",
    },
    "fal_seedance2_fast_i2v": {
        "fal_id": "fal-ai/bytedance/seedance-2.0/fast/image-to-video",
        "name": "Seedance 2 Fast I2V (ByteDance)",
        "description": "Seedance 2 fast image-to-video, lower cost variant",
        "credits": 50,
        "min_plan": "basic",
    },
    "fal_pika_t2v": {
        "fal_id": "fal-ai/pika/v2",
        "name": "Pika v2",
        "description": "Pika's cinematic video with motion control",
        "credits": 20,
        "min_plan": "basic",
    },
    "fal_vidu_t2v": {
        "fal_id": "fal-ai/vidu/q1",
        "name": "Vidu Q1 (Kuaishou)",
        "description": "Kuaishou's video model — fast, high quality motion",
        "credits": 15,
        "min_plan": "basic",
    },
    "fal_luma15_t2v": {
        "fal_id": "fal-ai/luma-dream-machine/v1.5",
        "name": "Luma v1.5",
        "description": "Latest Luma Dream Machine — improved motion and consistency",
        "credits": 20,
        "min_plan": "basic",
    },
    # --- Video-to-video (style transfer / restyle) ---
    "fal_wan27_v2v": {
        "fal_id": "fal-ai/wan/v2.7/edit-video",
        "name": "WAN 2.7 Edit Video",
        "description": "Video-to-video style transfer and instruction-based editing",
        "credits": 40,  # ~5s output (fal.ai $0.10/s × 5s = $0.50 raw)
        "min_plan": "pro",
    },
}


def _sanitize_prompt_for_video(prompt: str) -> str:
    """Remove NSFW keywords from prompt for video models with content filters.

    The NSFW image itself carries the content — the prompt only needs to describe MOTION.
    """
    if not prompt:
        return "animate this image with smooth natural motion, cinematic"

    # Words that trigger fal.ai content filter
    nsfw_words = [
        "sex", "sexual", "nude", "naked", "breast", "breasts", "boob", "boobs",
        "nipple", "nipples", "penis", "vagina", "pussy", "dick", "cock",
        "fuck", "fucking", "orgasm", "cum", "cumming", "ejaculate",
        "blowjob", "fellatio", "cunnilingus", "anal", "penetration",
        "hentai", "porn", "pornographic", "erotic", "nsfw", "xxx",
        "masturbat", "genital", "intercourse", "missionary", "doggy",
        "cowgirl", "riding", "thrust", "moan", "groan", "climax",
        "undress", "strip", "topless", "bottomless", "bondage", "bdsm",
        "セックス", "ヌード", "裸", "おっぱい", "巨乳", "フェラ", "中出し",
        "潮吹き", "オナニー", "エロ", "アダルト", "挿入",
    ]

    words = prompt.split()
    cleaned = []
    for word in words:
        word_lower = word.lower().strip(".,!?;:")
        if not any(nw in word_lower for nw in nsfw_words):
            cleaned.append(word)

    result = " ".join(cleaned).strip()
    if len(result) < 5:
        return "animate this image with smooth natural motion, cinematic"
    return result


class FalClient:
    def __init__(self, settings: Settings):
        self.api_key = settings.fal_api_key
        self.headers = {
            "Authorization": f"Key {self.api_key}",
            "Content-Type": "application/json",
        }

    def is_available(self) -> bool:
        return bool(self.api_key)

    async def submit_txt2img(
        self,
        prompt: str,
        model_id: str = "fal_flux_dev",
        width: int = 1024,
        height: int = 1024,
        steps: int = 20,
        cfg: float = 7.5,
        seed: int = -1,
        negative_prompt: str = "",
    ) -> dict:
        """Submit a txt2img job to fal.ai. Returns synchronously with result."""
        model_info = MODELS.get(model_id, MODELS["fal_flux_dev"])
        fal_model = model_info["fal_id"]

        input_params: dict = {"prompt": prompt}

        if "nano-banana" in fal_model:
            # Nano Banana 2 uses resolution/aspect_ratio instead of width/height
            if width >= 2048 or height >= 2048:
                input_params["resolution"] = "4K"
            elif width >= 1536 or height >= 1536:
                input_params["resolution"] = "2K"
            else:
                input_params["resolution"] = "1K"
            # Map width/height ratio to aspect_ratio
            ratio = width / height if height > 0 else 1.0
            if ratio > 1.3:
                input_params["aspect_ratio"] = "16:9"
            elif ratio < 0.77:
                input_params["aspect_ratio"] = "9:16"
            else:
                input_params["aspect_ratio"] = "1:1"
            if seed >= 0:
                input_params["seed"] = seed
            input_params["safety_tolerance"] = 6
        elif "flux" in fal_model:
            input_params["image_size"] = {"width": width, "height": height}
            # Flux Schnell max 12 steps, Flux Dev max 50
            max_steps = 12 if "schnell" in fal_model else 50
            input_params["num_inference_steps"] = min(steps, max_steps)
            if seed >= 0:
                input_params["seed"] = seed
            input_params["enable_safety_checker"] = False
            input_params["safety_tolerance"] = 6  # 1=strict, 6=most permissive (NSFW OK)
        elif "sdxl" in fal_model:
            input_params["image_size"] = {"width": width, "height": height}
            input_params["num_inference_steps"] = steps
            input_params["guidance_scale"] = cfg if cfg > 1 else 7.5
            if negative_prompt:
                input_params["negative_prompt"] = negative_prompt
            if seed >= 0:
                input_params["seed"] = seed
            input_params["enable_safety_checker"] = False
            input_params["safety_tolerance"] = 6
        else:
            input_params["image_size"] = {"width": width, "height": height}
            if negative_prompt:
                input_params["negative_prompt"] = negative_prompt
            if seed >= 0:
                input_params["seed"] = seed
            input_params["enable_safety_checker"] = False
            input_params["safety_tolerance"] = 6

        url = f"{FAL_API_BASE}/{fal_model}"

        # Retry up to 2 times for transient errors
        last_error = None
        for attempt in range(3):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        url,
                        json=input_params,
                        headers=self.headers,
                        timeout=120,
                    )
                    response.raise_for_status()
                    data = response.json()
                    logger.info("fal.ai job completed: model=%s", fal_model)
                    return data
            except (httpx.TimeoutException, httpx.ConnectError) as e:
                last_error = e
                logger.warning("fal.ai attempt %d failed: %s", attempt + 1, e)
                if attempt < 2:
                    import asyncio
                    await asyncio.sleep(2 * (attempt + 1))
        raise RuntimeError(f"fal.ai failed after 3 attempts: {last_error}")

    async def submit_txt2img_with_lora(
        self,
        prompt: str,
        lora_url: str,
        lora_scale: float = 1.0,
        base_model: str = "flux",
        width: int = 1024,
        height: int = 1024,
        steps: int = 28,
        cfg: float = 7.5,
        seed: int = -1,
        negative_prompt: str = "",
    ) -> dict:
        """Generate image with a CivitAI LoRA model via fal.ai."""

        input_params: dict = {
            "prompt": prompt,
            "loras": [{"path": lora_url, "scale": lora_scale}],
            "image_size": {"width": width, "height": height},
            "enable_safety_checker": False,
        }

        if "flux" in base_model.lower():
            # Flux + LoRA
            fal_model = "fal-ai/flux-lora"
            input_params["num_inference_steps"] = steps
            input_params["guidance_scale"] = cfg if cfg > 1 else 3.5
            input_params["safety_tolerance"] = 6
            if seed >= 0:
                input_params["seed"] = seed
        else:
            # SDXL + LoRA
            fal_model = "fal-ai/lora"
            input_params["model_name"] = "stabilityai/stable-diffusion-xl-base-1.0"
            input_params["num_inference_steps"] = steps
            input_params["guidance_scale"] = cfg if cfg > 1 else 7.5
            if negative_prompt:
                input_params["negative_prompt"] = negative_prompt
            if seed >= 0:
                input_params["seed"] = seed

        url = f"{FAL_API_BASE}/{fal_model}"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=input_params,
                headers=self.headers,
                timeout=180,
            )
            response.raise_for_status()
            data = response.json()
            logger.info("fal.ai LoRA job completed: model=%s, lora=%s", fal_model, lora_url)
            return data

    async def submit_txt2vid(
        self,
        prompt: str,
        seed: int = -1,
        model_id: str = "fal_ltx_t2v",
        duration: int = 5,
    ) -> dict:
        """Submit a text-to-video job via fal.ai. Supports multiple models."""
        model_info = VIDEO_MODELS.get(model_id, VIDEO_MODELS["fal_ltx_t2v"])
        fal_model = model_info["fal_id"]

        input_params: dict = {
            "prompt": prompt,
            "enable_safety_checker": False,
        }
        if seed >= 0:
            input_params["seed"] = seed

        dur = max(3, min(15, duration))

        # Model-specific params with duration
        if "seedance-2.0" in fal_model:
            # Seedance 2.0: resolution 480p/720p, duration "4"-"15" or "auto", aspect_ratio, generate_audio
            valid_dur = max(4, min(15, dur))
            input_params["duration"] = str(valid_dur)
            input_params["resolution"] = "720p"
            input_params["aspect_ratio"] = "16:9"
            input_params["generate_audio"] = True
        elif "sora-2" in fal_model:
            # Sora 2: duration as string, supports up to 20s
            input_params["duration"] = str(min(max(4, dur), 20))
            input_params["aspect_ratio"] = "16:9"
        elif "veo3" in fal_model or "veo-3" in fal_model:
            # Veo 3: duration as string
            input_params["duration"] = str(min(max(4, dur), 8))
        elif "kling" in fal_model:
            input_params["duration"] = str(min(dur, 10))
            input_params["aspect_ratio"] = "16:9"
        elif "minimax" in fal_model:
            input_params["prompt_optimizer"] = True
        elif "wan" in fal_model and "v2.6" in fal_model:
            valid_dur = 5 if dur <= 7 else (10 if dur <= 12 else 15)
            input_params["duration"] = str(valid_dur)
            input_params["resolution"] = "720p"
        elif "wan" in fal_model:
            # Wan 2.1 t2v supports duration in seconds
            input_params["num_frames"] = min(dur * 16, 240)
        elif "ltx" in fal_model:
            input_params["num_frames"] = min(dur * 24, 360)

        # Seedance 2 is slow (typically 1-3 min) — route via queue to avoid HTTP timeouts
        if "seedance-2.0" in fal_model:
            return await self._submit_queue_job(fal_model, input_params)

        url = f"{FAL_API_BASE}/{fal_model}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=input_params, headers=self.headers, timeout=300,
            )
            response.raise_for_status()
            data = response.json()
            logger.info("fal.ai video job completed: %s", model_id)
            return data

    async def submit_img2vid(
        self,
        image_url: str,
        prompt: str = "",
        seed: int = -1,
        model_id: str = "fal_wan26_i2v",
        duration: int = 5,
        resolution: str = "720p",
    ) -> dict:
        """Submit an image-to-video job via fal.ai. Supports multiple models.

        Wan 2.6 uses queue-based API (submit → poll) for longer processing.
        Other models use synchronous fal.run endpoint.
        """
        model_info = VIDEO_MODELS.get(model_id, VIDEO_MODELS.get("fal_wan26_i2v", VIDEO_MODELS["fal_ltx_i2v"]))
        fal_model = model_info["fal_id"]

        input_params: dict = {
            "image_url": image_url,
            "enable_safety_checker": False,
        }
        if seed >= 0:
            input_params["seed"] = seed

        # Model-specific params
        is_wan26 = "wan" in fal_model and "v2.6" in fal_model
        is_wan = "wan" in fal_model

        # Clamp duration to valid values per model
        dur = max(3, min(15, duration))

        if "seedance-2.0" in fal_model:
            # Seedance 2.0 i2v: resolution 480p/720p, duration "4"-"15" or "auto", aspect_ratio, generate_audio
            valid_dur = max(4, min(15, dur))
            input_params["duration"] = str(valid_dur)
            input_params["resolution"] = resolution if resolution in ("480p", "720p") else "720p"
            input_params["aspect_ratio"] = "16:9"
            input_params["generate_audio"] = True
            if prompt:
                input_params["prompt"] = prompt
        elif "sora-2" in fal_model:
            # Sora 2 I2V: duration is a string enum, supports up to 20s
            valid_dur = str(min(max(4, dur), 20))
            input_params["duration"] = valid_dur
            if prompt:
                input_params["prompt"] = prompt
        elif "kling" in fal_model:
            # Kling: duration in seconds as string, "5" or "10"
            input_params["duration"] = str(min(dur, 10))
            if prompt:
                input_params["prompt"] = prompt
        elif is_wan26:
            # Wan 2.6 I2V: prompt is REQUIRED, resolution "720p"/"1080p", duration "5"/"10"/"15"
            # Sanitize explicit words but keep the motion/scene description intact
            safe_prompt = _sanitize_prompt_for_video(prompt) if prompt else ""
            if not safe_prompt or len(safe_prompt) < 5:
                safe_prompt = "smooth cinematic motion, gentle movement, natural animation, high quality video"
            input_params["prompt"] = safe_prompt
            logger.info(f"Wan 2.6 I2V: sanitized prompt='{safe_prompt[:60]}' (original len={len(prompt)})")
            valid_res = resolution if resolution in ("720p", "1080p") else "720p"
            input_params["resolution"] = valid_res
            valid_dur = 5 if dur <= 7 else (10 if dur <= 12 else 15)
            input_params["duration"] = str(valid_dur)
            input_params["enable_prompt_expansion"] = False
        elif is_wan:
            # Wan 2.1 I2V — accepts num_frames (~16 fps)
            input_params["num_frames"] = min(max(dur * 16, 16), 240)
            if prompt:
                input_params["prompt"] = prompt
        elif "ltx" in fal_model:
            # LTX 2 I2V — accepts num_frames (~24 fps)
            input_params["num_frames"] = min(max(dur * 24, 24), 360)
            if prompt:
                input_params["prompt"] = prompt
        else:
            if prompt:
                input_params["prompt"] = prompt

        # Wan 2.6 and Seedance 2 need queue-based API (longer processing time)
        if is_wan26 or "seedance-2.0" in fal_model:
            return await self._submit_queue_job(fal_model, input_params)

        # Other models: synchronous
        url = f"{FAL_API_BASE}/{fal_model}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=input_params, headers=self.headers, timeout=300,
            )
            response.raise_for_status()
            data = response.json()
            logger.info("fal.ai img2vid job completed: %s", model_id)
            return data

    async def submit_vid2vid(
        self,
        video_url: str,
        prompt: str,
        resolution: str = "720p",
        duration: int = 0,
        reference_image_url: str = "",
        seed: int = -1,
        model_id: str = "fal_wan27_v2v",
    ) -> dict:
        """Submit a video-to-video edit job via fal.ai WAN 2.7 edit-video.

        Input video must be 2-10s MP4/MOV, max 100 MB. Uses queue API because
        video editing is slow (30s-3min typical).

        Args:
            video_url: HTTP(S) URL or data URL of input video
            prompt: Editing instruction / style transfer description
            resolution: "720p" or "1080p"
            duration: Output seconds (0-10). 0 = match input.
            reference_image_url: Optional style reference image
            seed: Random seed, -1 = random
            model_id: Internal model key (only fal_wan27_v2v for now)

        Returns:
            fal.ai response dict with `video` field.
        """
        model_info = VIDEO_MODELS.get(model_id, VIDEO_MODELS["fal_wan27_v2v"])
        fal_model = model_info["fal_id"]

        input_params: dict = {
            "video_url": video_url,
            "prompt": prompt,
            "resolution": resolution if resolution in ("720p", "1080p") else "720p",
            "enable_safety_checker": False,
        }
        if duration and 0 < duration <= 10:
            input_params["duration"] = str(duration)
        if reference_image_url:
            input_params["reference_image_url"] = reference_image_url
        if seed >= 0:
            input_params["seed"] = seed

        logger.info(f"fal.ai vid2vid submit: model={fal_model} prompt={prompt[:60]!r} res={resolution}")
        # Always queue: video editing is slow (typical 30s-3min)
        return await self._submit_queue_job(fal_model, input_params)

    async def _submit_queue_job(self, fal_model: str, input_params: dict) -> dict:
        """Submit a job to fal.ai queue API and poll until complete.

        fal.ai queue API:
          POST https://queue.fal.run/{model} → {request_id, response_url, status_url}
          GET  {status_url} with ?logs=1 → {status, response_url (when done)}
          GET  {response_url} → result data
        """
        import asyncio

        queue_url = f"https://queue.fal.run/{fal_model}"
        auth_header = {"Authorization": f"Key {self.api_key}"}

        async with httpx.AsyncClient() as client:
            # Submit to queue
            response = await client.post(
                queue_url,
                json=input_params,
                headers={**auth_header, "Content-Type": "application/json"},
                timeout=30,
            )
            response.raise_for_status()
            queue_data = response.json()

            request_id = queue_data.get("request_id")
            if not request_id:
                raise RuntimeError(f"No request_id in queue response: {queue_data}")

            status_url = queue_data.get("status_url")
            response_url = queue_data.get("response_url")
            logger.info(f"fal.ai queue submitted: {request_id}")

            # Poll for completion (up to 10 minutes — video editing is slow)
            for i in range(120):
                await asyncio.sleep(5)
                try:
                    # Check status (GET with auth only, no Content-Type)
                    status_resp = await client.get(
                        f"{status_url}?logs=1",
                        headers=auth_header,
                        timeout=15,
                    )
                    # fal.ai returns 200 when job is done, 202 while IN_QUEUE / IN_PROGRESS.
                    # Both carry a JSON body with a `status` field. Only skip on real errors.
                    if status_resp.status_code not in (200, 202):
                        logger.warning(f"fal.ai poll #{i}: HTTP {status_resp.status_code}")
                        continue
                    try:
                        status_data = status_resp.json()
                    except Exception:
                        logger.warning(f"fal.ai poll #{i}: non-JSON body on HTTP {status_resp.status_code}")
                        continue
                    status = status_data.get("status", "")
                    logger.info(f"fal.ai poll #{i}: status={status}")

                    if status == "COMPLETED":
                        # Fetch result (GET with auth only, no Content-Type)
                        result_resp = await client.get(
                            response_url,
                            headers=auth_header,
                            timeout=60,
                        )
                        logger.info(f"fal.ai result fetch: HTTP {result_resp.status_code}")
                        if result_resp.status_code == 200:
                            return result_resp.json()

                        # Log error body for debugging
                        logger.error(f"fal.ai result fetch failed: {result_resp.status_code} {result_resp.text[:500]}")

                        # Maybe result is embedded in status with logs
                        if "video" in status_data:
                            return status_data

                        raise RuntimeError(
                            f"Result fetch failed (HTTP {result_resp.status_code}). "
                            f"response_url={response_url}"
                        )

                    elif status in ("FAILED", "CANCELLED"):
                        error = status_data.get("error", str(status_data))
                        raise RuntimeError(f"fal.ai job failed: {error}")

                except httpx.TimeoutException:
                    logger.warning(f"fal.ai poll #{i} timed out")
                    continue

            raise TimeoutError(f"fal.ai job timed out after 10 minutes: {request_id}")

    async def submit_controlnet(
        self,
        prompt: str,
        image_url: str,
        control_type: str = "canny",
        control_strength: float = 1.0,
        width: int = 1024,
        height: int = 1024,
        steps: int = 25,
        cfg: float = 7.5,
        seed: int = -1,
        negative_prompt: str = "",
    ) -> dict:
        """Generate image with ControlNet guidance via fal.ai."""
        # Map control types to fal.ai ControlNet models
        controlnet_models = {
            "canny": "fal-ai/fast-sdxl-controlnet-canny",
            "depth": "fal-ai/fast-sdxl-controlnet-canny",  # depth uses same endpoint
            "openpose": "fal-ai/fast-sdxl-controlnet-canny",
            "scribble": "fal-ai/fast-sdxl-controlnet-canny",
        }
        fal_model = controlnet_models.get(control_type, controlnet_models["canny"])

        input_params: dict = {
            "prompt": prompt,
            "control_image_url": image_url,
            "controlnet_conditioning_scale": control_strength,
            "image_size": {"width": width, "height": height},
            "num_inference_steps": steps,
            "guidance_scale": cfg,
            "enable_safety_checker": False,
            "safety_tolerance": 6,
        }
        if negative_prompt:
            input_params["negative_prompt"] = negative_prompt
        if seed >= 0:
            input_params["seed"] = seed

        url = f"{FAL_API_BASE}/{fal_model}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=input_params, headers=self.headers, timeout=120,
            )
            response.raise_for_status()
            data = response.json()
            logger.info("fal.ai ControlNet job completed: type=%s", control_type)
            return data

    @staticmethod
    async def is_black_image(image_url: str, threshold: int = 15) -> bool:
        """Check if a generated image is mostly black (safety checker blocked it)."""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(image_url, timeout=15)
                if resp.status_code != 200:
                    return False
                data = resp.content
                # Quick check: sample pixels from the raw image bytes
                # For JPEG/PNG, pixel data is compressed, so check file size as heuristic
                # A truly black image compresses extremely well (very small file)
                if len(data) < 5000 and len(data) > 100:
                    # Very small file for an image = likely solid black
                    logger.warning("Possible black image detected (file size: %d bytes)", len(data))
                    return True
                # For larger files, try to decode and sample pixels
                try:
                    from io import BytesIO
                    from PIL import Image
                    img = Image.open(BytesIO(data)).convert("RGB")
                    # Sample 100 random pixels
                    import random
                    w, h = img.size
                    total_brightness = 0
                    samples = 100
                    for _ in range(samples):
                        x, y = random.randint(0, w - 1), random.randint(0, h - 1)
                        r, g, b = img.getpixel((x, y))
                        total_brightness += (r + g + b) / 3
                    avg_brightness = total_brightness / samples
                    if avg_brightness < threshold:
                        logger.warning("Black image detected (avg brightness: %.1f)", avg_brightness)
                        return True
                except ImportError:
                    # PIL not available, fall back to file size heuristic only
                    pass
        except Exception as e:
            logger.debug("Black image check failed: %s", e)
        return False

    def extract_video_url(self, result: dict) -> str | None:
        """Extract the video URL from a fal.ai video response."""
        video = result.get("video")
        if isinstance(video, dict):
            return video.get("url")
        if isinstance(video, str):
            return video
        # Some models return in different format
        output = result.get("output")
        if isinstance(output, dict):
            return output.get("url")
        return None

    def extract_image_url(self, result: dict) -> str | None:
        """Extract the image URL from a fal.ai response."""
        images = result.get("images", [])
        if images:
            return images[0].get("url")
        # Some models return different structures
        image = result.get("image")
        if isinstance(image, dict):
            return image.get("url")
        if isinstance(image, str):
            return image
        return None

    async def consistent_character(
        self,
        prompt: str,
        reference_image_url: str,
        width: int = 1024,
        height: int = 1024,
        seed: int = -1,
        id_weight: float = 1.0,
    ) -> dict:
        """Generate image with consistent character identity via PuLID.

        PuLID preserves the face/identity from the reference image while
        generating a new scene based on the prompt.
        """
        fal_model = "fal-ai/pulid"
        input_params: dict = {
            "prompt": prompt,
            "reference_images": [{"url": reference_image_url}],
            "image_size": {"width": width, "height": height},
            "num_inference_steps": 20,
            "id_weight": id_weight,
            "enable_safety_checker": False,
        }
        if seed >= 0:
            input_params["seed"] = seed

        return await self._submit_queue_job(fal_model, input_params)

    async def submit_img2img(
        self,
        image_url: str,
        prompt: str,
        strength: float = 0.75,
        seed: int = -1,
        negative_prompt: str = "",
    ) -> dict:
        """Image-to-image generation via fal.ai Flux Dev img2img."""
        fal_model = "fal-ai/flux/dev/image-to-image"
        input_params: dict = {
            "image_url": image_url,
            "prompt": prompt,
            "strength": max(0.0, min(1.0, strength)),
            "num_inference_steps": 28,
            "enable_safety_checker": False,
            "safety_tolerance": 6,
        }
        if seed >= 0:
            input_params["seed"] = seed
        if negative_prompt:
            input_params["negative_prompt"] = negative_prompt

        return await self._submit_queue_job(fal_model, input_params)

    async def submit_upscale(
        self,
        image_url: str,
        scale: int = 2,
    ) -> dict:
        """Upscale an image via fal.ai Clarity Upscaler."""
        fal_model = "fal-ai/clarity-upscaler"
        input_params: dict = {
            "image_url": image_url,
            "scale_factor": max(1, min(4, scale)),
            "enable_safety_checker": False,
        }

        return await self._submit_queue_job(fal_model, input_params)

    async def submit_inpaint(
        self,
        image_url: str,
        mask_url: str,
        prompt: str,
        negative_prompt: str = "",
        strength: float = 0.85,
        seed: int = -1,
    ) -> dict:
        """Inpaint masked regions via fal.ai flux-fill (Flux inpainting)."""
        fal_model = "fal-ai/flux-fill"
        input_params: dict = {
            "image_url": image_url,
            "mask_url": mask_url,
            "prompt": prompt,
            "enable_safety_checker": False,
            "safety_tolerance": 6,
        }
        if negative_prompt:
            input_params["negative_prompt"] = negative_prompt
        if seed >= 0:
            input_params["seed"] = seed

        return await self._submit_queue_job(fal_model, input_params)

    async def submit_remove_bg(
        self,
        image_url: str,
    ) -> dict:
        """Remove background from an image via fal.ai BiRefNet."""
        fal_model = "fal-ai/birefnet"
        input_params: dict = {
            "image_url": image_url,
        }

        return await self._submit_queue_job(fal_model, input_params)

    async def face_swap(
        self,
        source_image_url: str,
        target_image_url: str,
    ) -> dict:
        """Swap face from source image onto target image via fal.ai."""
        fal_model = "fal-ai/face-swap"
        input_params = {
            "base_image_url": target_image_url,
            "swap_image_url": source_image_url,
        }

        # Face swap can take longer — use queue API
        return await self._submit_queue_job(fal_model, input_params)
