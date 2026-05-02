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
    "fal_gpt_image_2": {
        "fal_id": "openai/gpt-image-2",
        "name": "GPT Image 2 (OpenAI)",
        "category": "premium",
        "description": "OpenAI's latest — extremely detailed images with fine typography",
        "min_plan": "pro",
        "credits": 10,
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
    "fal_kling3_t2v": {
        "fal_id": "fal-ai/kling-video/v3/4k/text-to-video",
        "name": "Kling 3.0 4K (Latest)",
        "description": "Latest Kling — native 4K, cinematic visuals, fluid motion",
        "credits": 40,
        "min_plan": "pro",
    },
    "fal_kling3_i2v": {
        "fal_id": "fal-ai/kling-video/v3/pro/image-to-video",
        "name": "Kling 3.0 I2V (Latest)",
        "description": "Kling 3.0 image-to-video with native audio support",
        "credits": 40,
        "min_plan": "pro",
    },
    "fal_kling_o3_t2v": {
        "fal_id": "fal-ai/kling-video/o3/4k/text-to-video",
        "name": "Kling O3 4K",
        "description": "Kling O3 — enhanced reasoning, native 4K output",
        "credits": 50,
        "min_plan": "pro",
    },
    "fal_kling_o3_i2v": {
        "fal_id": "fal-ai/kling-video/o3/4k/image-to-video",
        "name": "Kling O3 4K I2V",
        "description": "Kling O3 image-to-video, native 4K",
        "credits": 50,
        "min_plan": "pro",
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
        num_images: int = 1,
    ) -> dict:
        """Submit a txt2img job to fal.ai. Returns synchronously with result."""
        model_info = MODELS.get(model_id, MODELS["fal_flux_dev"])
        fal_model = model_info["fal_id"]

        input_params: dict = {"prompt": prompt}
        if num_images > 1:
            input_params["num_images"] = min(num_images, 4)

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

        # Slow models — route via queue to avoid HTTP timeouts
        if "seedance-2.0" in fal_model or "v3/" in fal_model or "/o3/" in fal_model:
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
            # Wan 2.1 I2V — do NOT pass num_frames or duration.
            # The model works best at its native default (~5 seconds).
            # Passing large num_frames causes degraded/wrong output.
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

        # I2V models need queue-based API (processing time 30-120s)
        if is_wan or is_wan26 or "seedance-2.0" in fal_model or "sora-2" in fal_model or "v3/" in fal_model or "/o3/" in fal_model:
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
                            result_data = result_resp.json()
                            # Detect empty/access-denied responses (e.g. Seedance 2 early access)
                            if not result_data or (isinstance(result_data, dict) and not any(
                                k in result_data for k in ("video", "videos", "output", "data", "images")
                            )):
                                logger.warning(
                                    "fal.ai returned empty/unexpected result for %s: keys=%s",
                                    fal_model, list(result_data.keys()) if isinstance(result_data, dict) else type(result_data),
                                )
                            return result_data

                        # 422 = fal.ai validation error in result — parse the error body
                        error_body = ""
                        try:
                            error_body = result_resp.text[:1000]
                            error_json = result_resp.json()
                            detail = error_json.get("detail", error_json.get("error", error_body))
                            logger.error(f"fal.ai result error ({result_resp.status_code}): {detail}")
                        except Exception:
                            logger.error(f"fal.ai result fetch failed: {result_resp.status_code} {error_body}")

                        # Maybe result is embedded in status response
                        if "video" in status_data:
                            return status_data

                        raise RuntimeError(
                            f"fal.ai generation failed ({result_resp.status_code}): {error_body[:200]}"
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

    async def submit_object_removal(
        self,
        image_url: str,
        mask_url: str,
    ) -> dict:
        """Remove objects from an image using LaMa inpainting.

        LaMa (Large Mask Inpainting) excels at removing objects and filling
        the area with plausible background content.

        Args:
            image_url: HTTP(S) or data URL of the input image.
            mask_url: HTTP(S) or data URL of the mask (white = remove).

        Returns:
            fal.ai response dict with `image` field.
        """
        fal_model = "fal-ai/lama"
        input_params = {
            "image_url": image_url,
            "mask_url": mask_url,
        }

        url = f"{FAL_API_BASE}/{fal_model}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=input_params, headers=self.headers, timeout=120,
            )
            response.raise_for_status()
            data = response.json()
            logger.info("fal.ai LaMa object removal completed")
            return data

    async def submit_virtual_tryon(
        self,
        human_image_url: str,
        garment_image_url: str,
        description: str = "a person wearing the garment",
    ) -> dict:
        """Virtual try-on using IDM-VTON. Puts garment on person."""
        fal_model = "fal-ai/idm-vton"
        input_params = {
            "human_image_url": human_image_url,
            "garment_image_url": garment_image_url,
            "description": description,
        }
        url = f"{FAL_API_BASE}/{fal_model}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=input_params, headers=self.headers, timeout=120,
            )
            response.raise_for_status()
            data = response.json()
            logger.info("fal.ai IDM-VTON virtual try-on completed")
            return data

    async def submit_sound_effect(
        self,
        prompt: str,
        duration: float = 5.0,
    ) -> dict:
        """Generate sound effect using Beatoven."""
        fal_model = "beatoven/sound-effect-generation"
        input_params = {
            "prompt": prompt,
            "duration": duration,
        }
        url = f"{FAL_API_BASE}/{fal_model}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=input_params, headers=self.headers, timeout=120,
            )
            response.raise_for_status()
            data = response.json()
            logger.info("fal.ai sound effect generation completed")
            return data

    async def submit_kontext_edit(
        self,
        image_url: str,
        prompt: str,
        guidance_scale: float = 2.5,
        steps: int = 30,
        seed: int = -1,
    ) -> dict:
        """Edit an image with text instructions using Flux Kontext."""
        fal_model = "fal-ai/flux-pro/kontext"
        input_params: dict = {
            "image_url": image_url,
            "prompt": prompt,
            "guidance_scale": guidance_scale,
            "num_inference_steps": steps,
        }
        if seed >= 0:
            input_params["seed"] = seed
        url = f"{FAL_API_BASE}/{fal_model}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=input_params, headers=self.headers, timeout=120,
            )
            response.raise_for_status()
            data = response.json()
            logger.info("fal.ai Flux Kontext edit completed")
            return data

    async def submit_face_fix(self, image_url: str) -> dict:
        """Fix/enhance faces using GFPGAN via fal.ai."""
        fal_model = "fal-ai/gfpgan"
        input_params = {"image_url": image_url}
        url = f"{FAL_API_BASE}/{fal_model}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=input_params, headers=self.headers, timeout=60,
            )
            response.raise_for_status()
            data = response.json()
            logger.info("fal.ai face fix completed")
            return data

    async def submit_music_generation(
        self,
        prompt: str,
        duration: float = 30.0,
        model: str = "ace_step",
        lyrics: str = "",
    ) -> dict:
        """Generate music using fal.ai music models."""
        MUSIC_MODELS = {
            "ace_step": "fal-ai/ace-step",
            "cassetteai": "cassetteai/music-generator",
            "minimax_music": "fal-ai/minimax-music/v2",
        }
        fal_model = MUSIC_MODELS.get(model, MUSIC_MODELS["ace_step"])

        if model == "ace_step":
            input_params = {"prompt": prompt, "duration": duration}
            if lyrics:
                input_params["lyrics"] = lyrics
        elif model == "cassetteai":
            input_params = {"prompt": prompt, "duration": duration}
        elif model == "minimax_music":
            input_params = {"prompt": prompt}
            if lyrics:
                input_params["lyrics"] = lyrics
        else:
            input_params = {"prompt": prompt, "duration": duration}

        url = f"{FAL_API_BASE}/{fal_model}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=input_params, headers=self.headers, timeout=180,
            )
            response.raise_for_status()
            data = response.json()
            logger.info("fal.ai music generation completed (model=%s)", model)
            return data

    def extract_music_url(self, result: dict) -> str | None:
        """Extract music/audio URL from a fal.ai music generation response."""
        audio_file = result.get("audio_file")
        if isinstance(audio_file, dict):
            return audio_file.get("url")
        audio = result.get("audio")
        if isinstance(audio, dict):
            return audio.get("url")
        if isinstance(audio, str) and audio.startswith("http"):
            return audio
        output = result.get("output")
        if isinstance(output, dict):
            return output.get("url")
        return self.extract_audio_url(result)

    def extract_audio_url(self, result: dict) -> str | None:
        """Extract audio URL from a fal.ai audio response."""
        audio = result.get("audio")
        if isinstance(audio, dict):
            return audio.get("url")
        if isinstance(audio, str) and audio.startswith("http"):
            return audio
        audio_file = result.get("audio_file")
        if isinstance(audio_file, dict):
            return audio_file.get("url")
        output = result.get("output")
        if isinstance(output, dict):
            return output.get("url")
        return None

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
        """Extract the video URL from a fal.ai video response.

        Handles multiple response formats across different models:
          - { video: { url: "..." } }         — Veo 3, Kling, Seedance 2, most models
          - { video: "https://..." }           — some older models
          - { output: { url: "..." } }         — fallback format
          - { data: { video: { url } } }       — nested wrapper (some queue results)
          - { videos: [{ url: "..." }] }       — batch video results
        """
        # Standard: { video: { url } }
        video = result.get("video")
        if isinstance(video, dict):
            url = video.get("url")
            if url:
                return url
        if isinstance(video, str) and video.startswith("http"):
            return video

        # Batch: { videos: [{ url }] }
        videos = result.get("videos")
        if isinstance(videos, list) and videos:
            first = videos[0]
            if isinstance(first, dict):
                url = first.get("url")
                if url:
                    return url
            if isinstance(first, str) and first.startswith("http"):
                return first

        # Nested wrapper: { data: { video: { url } } }
        data = result.get("data")
        if isinstance(data, dict):
            nested_video = data.get("video")
            if isinstance(nested_video, dict):
                url = nested_video.get("url")
                if url:
                    return url

        # Output fallback: { output: { url } }
        output = result.get("output")
        if isinstance(output, dict):
            url = output.get("url")
            if url:
                return url

        # Log the full response keys for debugging unknown formats
        if result:
            logger.warning(
                "extract_video_url: no video URL found in response keys=%s (truncated values: %s)",
                list(result.keys()),
                {k: str(v)[:100] for k, v in result.items() if k != "logs"},
            )
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

    def extract_all_image_urls(self, result: dict) -> list[str]:
        """Extract all image URLs from a fal.ai response (for batch generation)."""
        urls = []
        images = result.get("images", [])
        for img in images:
            url = img.get("url") if isinstance(img, dict) else None
            if url:
                urls.append(url)
        if not urls:
            single = self.extract_image_url(result)
            if single:
                urls.append(single)
        return urls

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

    async def submit_lipsync(
        self,
        video_url: str,
        audio_url: str,
        sync_mode: str = "cut_off",
    ) -> dict:
        """Lip-sync a face video to an audio track via fal-ai/sync-lipsync/v3.

        Both inputs must be public HTTP(S) URLs (data URLs also accepted by
        fal.ai for small payloads, but callers should upload to storage first).

        Args:
            video_url: URL of the source video (contains a face)
            audio_url: URL of the audio to sync to
            sync_mode: cut_off (default) / loop / bounce / silence / remap

        Returns:
            fal.ai response dict with `video` field.
        """
        fal_model = "fal-ai/sync-lipsync/v3"
        allowed_modes = ("cut_off", "loop", "bounce", "silence", "remap")
        mode = sync_mode if sync_mode in allowed_modes else "cut_off"
        input_params: dict = {
            "video_url": video_url,
            "audio_url": audio_url,
            "sync_mode": mode,
        }
        logger.info(f"fal.ai lipsync submit: mode={mode}")
        # Always queue: lipsync is slow (typical 2-6min)
        return await self._submit_queue_job(fal_model, input_params)

    async def submit_lora_training(
        self,
        images_zip_url: str,
        trigger_word: str = "",
        steps: int = 1000,
        is_style: bool = False,
    ) -> dict:
        """Start a Flux LoRA training job via fal-ai/flux-lora-fast-training.

        Returns the fal.ai queue submit response (NOT a completed job). The
        caller is responsible for persisting the `request_id`/`status_url`/
        `response_url` and polling later — training takes 5-15 minutes.
        """
        fal_model = "fal-ai/flux-lora-fast-training"
        input_params: dict = {
            "images_data_url": images_zip_url,
            "steps": max(100, min(10000, int(steps))),
        }
        if trigger_word:
            input_params["trigger_word"] = trigger_word
        if is_style:
            input_params["is_style"] = True

        queue_url = f"https://queue.fal.run/{fal_model}"
        logger.info(f"fal.ai LoRA training submit: trigger={trigger_word!r} steps={steps} is_style={is_style}")
        async with httpx.AsyncClient() as client:
            r = await client.post(
                queue_url,
                json=input_params,
                headers={
                    "Authorization": f"Key {self.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
            r.raise_for_status()
            data = r.json()
            logger.info(f"fal.ai LoRA training queued: request_id={data.get('request_id')}")
            return data

    async def poll_lora_training(self, status_url: str) -> dict:
        """Poll a LoRA training job once.

        Returns the raw status payload. `status` will be one of
        IN_QUEUE / IN_PROGRESS / COMPLETED / FAILED / CANCELLED.
        """
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{status_url}?logs=1",
                headers={"Authorization": f"Key {self.api_key}"},
                timeout=15,
            )
            if r.status_code not in (200, 202):
                raise RuntimeError(f"poll failed: HTTP {r.status_code} {r.text[:200]}")
            try:
                return r.json()
            except Exception:
                return {"status": "UNKNOWN", "raw": r.text[:500]}

    async def fetch_lora_result(self, response_url: str) -> dict:
        """Fetch the final result for a completed LoRA training job.

        Returns fal.ai's response payload which typically includes
        `diffusers_lora_file: {url, content_type, file_name, file_size}` and
        `config_file: {...}`.
        """
        async with httpx.AsyncClient() as client:
            r = await client.get(
                response_url,
                headers={"Authorization": f"Key {self.api_key}"},
                timeout=60,
            )
            r.raise_for_status()
            return r.json()

    async def submit_omnihuman(
        self,
        image_url: str,
        audio_url: str,
    ) -> dict:
        """Generate a talking-avatar video from a still image + audio via
        fal-ai/bytedance/omnihuman/v1.5.

        Args:
            image_url: URL (or data URL) of a still character image
            audio_url: URL (or data URL) of the speech audio

        Returns:
            fal.ai response dict with `video` field.
        """
        fal_model = "fal-ai/bytedance/omnihuman/v1.5"
        input_params: dict = {
            "image_url": image_url,
            "audio_url": audio_url,
        }
        logger.info("fal.ai omnihuman submit")
        # Always queue: omnihuman is slow (typical 2-5min)
        return await self._submit_queue_job(fal_model, input_params)

    async def submit_character_video(
        self,
        prompt: str,
        image_references: list[dict],  # [{image_url, ref_name, type}, ...]
        resolution: str = "720p",
        duration: int = 5,
        aspect_ratio: str = "16:9",
        seed: int = -1,
        generate_audio: bool = False,
    ) -> dict:
        """Character-consistent video generation via PixVerse C1 reference-to-video."""
        fal_model = "fal-ai/pixverse/c1/reference-to-video"
        input_params: dict = {
            "prompt": prompt,
            "image_references": image_references,
            "resolution": resolution,
            "aspect_ratio": aspect_ratio,
            "duration": duration,
            "generate_audio_switch": generate_audio,
        }
        if seed >= 0:
            input_params["seed"] = seed
        logger.info(
            "fal.ai character_video submit: refs=%d res=%s dur=%ss ar=%s",
            len(image_references), resolution, duration, aspect_ratio,
        )
        return await self._submit_queue_job(fal_model, input_params)

    async def submit_voice_clone(
        self,
        text: str,
        reference_audio_url: str = "",
        exaggeration: float = 0.5,
        temperature: float = 0.8,
        cfg: float = 0.5,
        seed: int = -1,
    ) -> dict:
        """Text-to-speech with optional voice cloning via fal-ai/chatterbox."""
        fal_model = "fal-ai/chatterbox/text-to-speech"
        input_params: dict = {
            "text": text,
            "exaggeration": max(0.0, min(1.0, exaggeration)),
            "temperature": max(0.05, min(2.0, temperature)),
            "cfg": max(0.1, min(1.0, cfg)),
        }
        if reference_audio_url:
            input_params["audio_url"] = reference_audio_url
        if seed >= 0:
            input_params["seed"] = seed
        logger.info(
            "fal.ai voice_clone submit: text_len=%d ref=%s",
            len(text), bool(reference_audio_url),
        )
        return await self._submit_queue_job(fal_model, input_params)

    def extract_audio_url(self, result: dict) -> str | None:
        """Extract the audio URL from a fal.ai TTS response."""
        audio = result.get("audio")
        if isinstance(audio, dict):
            return audio.get("url")
        if isinstance(audio, str):
            return audio
        output = result.get("output")
        if isinstance(output, dict):
            return output.get("url")
        return None
