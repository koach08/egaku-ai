"""Novita.ai API client - CivitAI checkpoint support + NSFW-friendly generation.

Novita.ai hosts thousands of CivitAI models natively. Users can generate with
any CivitAI checkpoint by passing the safetensors filename as `model_name`.

Pricing: ~$0.002/image (SD1.5/SDXL), ~$0.02/image (Flux)
NSFW: Fully uncensored (enable_nsfw_detection: false)
"""

import logging

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)

NOVITA_API_BASE = "https://api.novita.ai/v3"

# Pre-configured popular models (users can also use any CivitAI checkpoint)
BUILTIN_MODELS = {
    # ── SDXL (high quality, 1024x1024) ──
    "novita_sdxl_base": {
        "model_name": "sd_xl_base_1.0.safetensors",
        "name": "SDXL Base",
        "category": "realistic",
        "description": "SDXL base model, high quality",
        "min_plan": "free",
        "credits": 3,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 1024, "height": 1024, "sampler_name": "DPM++ 2M Karras"},
    },
    "novita_protovision_xl": {
        "model_name": "protovisionXLHighFidelity3D_release0630Bakedvae_154359.safetensors",
        "name": "ProtoVision XL (HD Realistic)",
        "category": "realistic",
        "description": "High fidelity SDXL, photorealistic",
        "min_plan": "free",
        "credits": 3,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 1024, "height": 1024, "sampler_name": "DPM++ 2M Karras"},
    },
    "novita_helloworld_xl": {
        "model_name": "leosamsHelloworldSDXL_helloworldSDXL50_268813.safetensors",
        "name": "HelloWorld SDXL (Versatile)",
        "category": "artistic",
        "description": "Versatile SDXL, great for all styles",
        "min_plan": "free",
        "credits": 3,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 1024, "height": 1024, "sampler_name": "DPM++ 2M Karras"},
    },
    # ── NSFW Specialized (SD1.5, proven quality for adult content) ──
    "novita_uber_realistic_porn": {
        "model_name": "uberRealisticPornMerge_urpmv13.safetensors",
        "name": "UberRealisticPorn v1.3",
        "category": "realistic",
        "description": "Top-tier photorealistic adult model",
        "min_plan": "free",
        "credits": 2,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 512, "height": 768, "sampler_name": "DPM++ 2M Karras"},
    },
    "novita_babes": {
        "model_name": "babes_20.safetensors",
        "name": "Babes 2.0",
        "category": "realistic",
        "description": "Realistic adult portraits, beautiful figures",
        "min_plan": "free",
        "credits": 2,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 512, "height": 768, "sampler_name": "DPM++ 2M Karras"},
    },
    "novita_chilloutmix": {
        "model_name": "chilloutmix_NiPrunedFp32Fix.safetensors",
        "name": "ChilloutMix (Asian Realistic)",
        "category": "realistic",
        "description": "Photorealistic Asian beauty, very popular",
        "min_plan": "free",
        "credits": 2,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 512, "height": 768, "sampler_name": "DPM++ 2M Karras"},
    },
    "novita_cyberrealistic": {
        "model_name": "cyberrealistic_v40_151857.safetensors",
        "name": "CyberRealistic v4",
        "category": "realistic",
        "description": "Highly detailed photorealistic, sharp details",
        "min_plan": "free",
        "credits": 2,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 512, "height": 768, "sampler_name": "DPM++ 2M Karras"},
    },
    "novita_majicmix": {
        "model_name": "majicmixRealistic_v7_134792.safetensors",
        "name": "MajicMix Realistic v7",
        "category": "realistic",
        "description": "Magical realism, beautiful skin textures",
        "min_plan": "free",
        "credits": 2,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 512, "height": 768, "sampler_name": "DPM++ 2M Karras"},
    },
    "novita_realistic_vision_v6": {
        "model_name": "realisticVisionV60B1_v60B1VAE_190174.safetensors",
        "name": "Realistic Vision v6",
        "category": "realistic",
        "description": "Latest Realistic Vision, excellent quality",
        "min_plan": "free",
        "credits": 2,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 512, "height": 768, "sampler_name": "DPM++ 2M Karras"},
    },
    "novita_epicphotogasm": {
        "model_name": "epicphotogasm_xPlusPlus_135412.safetensors",
        "name": "EpicPhotogasm x++",
        "category": "realistic",
        "description": "Photorealistic with dramatic lighting",
        "min_plan": "free",
        "credits": 2,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 512, "height": 768, "sampler_name": "DPM++ 2M Karras"},
    },
    # ── Anime / Hentai ──
    "novita_hassaku_hentai": {
        "model_name": "hassakuHentaiModel_v13_75289.safetensors",
        "name": "Hassaku Hentai v1.3",
        "category": "anime",
        "description": "High quality anime/hentai, uncensored",
        "min_plan": "free",
        "credits": 2,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 512, "height": 768, "sampler_name": "DPM++ 2M Karras"},
    },
    "novita_meinahentai": {
        "model_name": "meinahentai_v4_70340.safetensors",
        "name": "MeinaHentai v4",
        "category": "anime",
        "description": "Anime/hentai style, fully uncensored",
        "min_plan": "free",
        "credits": 2,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 512, "height": 768, "sampler_name": "DPM++ 2M Karras"},
    },
    "novita_anything_v5": {
        "model_name": "AnythingV5_v5PrtRE.safetensors",
        "name": "Anything v5 (Anime)",
        "category": "anime",
        "description": "Versatile anime model",
        "min_plan": "free",
        "credits": 2,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 512, "height": 768, "sampler_name": "DPM++ 2M Karras"},
    },
}


class NovitaClient:
    def __init__(self, settings: Settings):
        self.api_key = settings.novita_api_key
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def is_available(self) -> bool:
        return bool(self.api_key)

    async def generate_with_checkpoint(
        self,
        prompt: str,
        model_name: str,
        width: int = 512,
        height: int = 768,
        steps: int = 25,
        guidance_scale: float = 7.0,
        seed: int = -1,
        negative_prompt: str = "",
        sampler_name: str = "DPM++ 2M Karras",
    ) -> list[str]:
        """Generate image with a CivitAI checkpoint model via Novita.ai.

        Args:
            model_name: The safetensors filename (e.g. "realisticVisionV60B1_v51VAE_127635.safetensors")

        Returns:
            List of image URLs
        """
        is_flux = "flux" in model_name.lower()

        if is_flux:
            data: dict = {
                "model_name": model_name,
                "prompt": prompt,
                "width": width,
                "height": height,
                "steps": steps,
                "image_num": 1,
            }
            if guidance_scale > 1:
                data["guidance_scale"] = guidance_scale
            if seed >= 0:
                data["seed"] = seed
            if negative_prompt:
                data["negative_prompt"] = negative_prompt
            endpoint = "/async/flux"
        else:
            request_body: dict = {
                "model_name": model_name,
                "prompt": prompt,
                "negative_prompt": negative_prompt or "(worst quality, low quality:1.3)",
                "width": width,
                "height": height,
                "steps": steps,
                "guidance_scale": guidance_scale if guidance_scale > 1 else 7.0,
                "sampler_name": sampler_name or "DPM++ 2M Karras",
                "image_num": 1,
                "enable_nsfw_detection": False,
            }
            if seed >= 0:
                request_body["seed"] = seed
            data = {
                "extra": {"response_image_type": "jpeg"},
                "request": request_body,
            }
            endpoint = "/async/txt2img"

        async with httpx.AsyncClient() as client:
            # Submit task
            response = await client.post(
                f"{NOVITA_API_BASE}{endpoint}",
                json=data,
                headers=self.headers,
                timeout=30,
            )
            response.raise_for_status()
            result = response.json()

            task_id = result.get("task_id", "")
            if not task_id:
                raise RuntimeError("No task_id returned from Novita.ai")

            logger.info("Novita.ai task submitted: %s (model: %s)", task_id, model_name)

            # Poll for result (max 5 minutes)
            import asyncio
            for _ in range(150):  # 150 * 2s = 300s
                await asyncio.sleep(2)

                poll_response = await client.get(
                    f"{NOVITA_API_BASE}/async/task-result?task_id={task_id}",
                    headers=self.headers,
                    timeout=15,
                )
                poll_response.raise_for_status()
                poll_result = poll_response.json()

                status = poll_result.get("task", {}).get("status", "")

                if status == "TASK_STATUS_SUCCEED":
                    images = poll_result.get("images", [])
                    urls = [img.get("image_url", "") for img in images if img.get("image_url")]
                    logger.info("Novita.ai task completed: %s (%d images)", task_id, len(urls))
                    return urls

                elif status in ("TASK_STATUS_FAILED", "TASK_STATUS_CANCELED"):
                    reason = poll_result.get("task", {}).get("reason", "Unknown error")
                    raise RuntimeError(f"Novita.ai generation failed: {reason}")

                # Still processing, continue polling

            raise TimeoutError("Novita.ai generation timed out after 5 minutes")

    async def generate_with_lora(
        self,
        prompt: str,
        checkpoint_model: str,
        lora_model: str,
        lora_strength: float = 0.8,
        width: int = 512,
        height: int = 768,
        steps: int = 25,
        guidance_scale: float = 7.0,
        seed: int = -1,
        negative_prompt: str = "",
    ) -> list[str]:
        """Generate with a checkpoint + LoRA combination."""
        data: dict = {
            "model_name": checkpoint_model,
            "prompt": prompt,
            "negative_prompt": negative_prompt or "(worst quality, low quality:1.3)",
            "width": width,
            "height": height,
            "steps": steps,
            "guidance_scale": guidance_scale if guidance_scale > 1 else 7.0,
            "image_num": 1,
            "enable_nsfw_detection": False,
            "loras": [{"model_name": lora_model, "strength": lora_strength}],
        }
        if seed >= 0:
            data["seed"] = seed

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{NOVITA_API_BASE}/async/txt2img",
                json=data,
                headers=self.headers,
                timeout=30,
            )
            response.raise_for_status()
            result = response.json()

            task_id = result.get("task_id", "")
            if not task_id:
                raise RuntimeError("No task_id returned from Novita.ai")

            logger.info("Novita.ai LoRA task submitted: %s", task_id)

            import asyncio
            for _ in range(150):
                await asyncio.sleep(2)

                poll_response = await client.get(
                    f"{NOVITA_API_BASE}/async/task-result?task_id={task_id}",
                    headers=self.headers,
                    timeout=15,
                )
                poll_response.raise_for_status()
                poll_result = poll_response.json()

                status = poll_result.get("task", {}).get("status", "")

                if status == "TASK_STATUS_SUCCEED":
                    images = poll_result.get("images", [])
                    urls = [img.get("image_url", "") for img in images if img.get("image_url")]
                    return urls

                elif status in ("TASK_STATUS_FAILED", "TASK_STATUS_CANCELED"):
                    reason = poll_result.get("task", {}).get("reason", "Unknown error")
                    raise RuntimeError(f"Novita.ai LoRA generation failed: {reason}")

            raise TimeoutError("Novita.ai LoRA generation timed out")

    async def generate_video(
        self,
        prompt: str,
        model_name: str = "uberRealisticPornMerge_urpmv13.safetensors",
        width: int = 512,
        height: int = 512,
        steps: int = 25,
        guidance_scale: float = 7.0,
        frames: int = 16,
        seed: int = -1,
        negative_prompt: str = "",
    ) -> str | None:
        """Generate video with AnimateDiff via Novita.ai (NSFW, no filters).

        Returns:
            Video URL or None
        """
        data: dict = {
            "model_name": model_name,
            "prompts": [{"prompt": prompt, "frames": frames}],
            "negative_prompt": negative_prompt or "worst quality, low quality, deformed, ugly, bad anatomy",
            "width": width,
            "height": height,
            "steps": steps,
            "guidance_scale": guidance_scale if guidance_scale > 1 else 7.0,
            "seed": seed if seed >= 0 else -1,
            "enable_nsfw_detection": False,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{NOVITA_API_BASE}/async/txt2video",
                json=data,
                headers=self.headers,
                timeout=30,
            )
            response.raise_for_status()
            result = response.json()

            task_id = result.get("task_id", "")
            if not task_id:
                raise RuntimeError("No task_id returned from Novita.ai video")

            logger.info("Novita.ai video task submitted: %s (model: %s)", task_id, model_name)

            import asyncio
            for i in range(120):  # 120 * 5s = 10 min max
                await asyncio.sleep(5)

                poll_response = await client.get(
                    f"{NOVITA_API_BASE}/async/task-result?task_id={task_id}",
                    headers=self.headers,
                    timeout=15,
                )
                poll_response.raise_for_status()
                poll_result = poll_response.json()

                status = poll_result.get("task", {}).get("status", "")

                if status == "TASK_STATUS_SUCCEED":
                    videos = poll_result.get("videos", [])
                    if videos:
                        url = videos[0].get("video_url", "")
                        logger.info("Novita.ai video completed: %s", task_id)
                        return url
                    return None

                elif status in ("TASK_STATUS_FAILED", "TASK_STATUS_CANCELED"):
                    reason = poll_result.get("task", {}).get("reason", "Unknown error")
                    raise RuntimeError(f"Novita.ai video failed: {reason}")

            raise TimeoutError("Novita.ai video generation timed out")

    async def img2video(
        self,
        image_url: str,
        steps: int = 25,
        frames: int = 14,
        fps: int = 6,
        model: str = "SVD",
    ) -> str | None:
        """Convert image to video via Novita.ai SVD (no NSFW filter).

        Args:
            image_url: URL or data:base64 of the source image
        Returns:
            Video URL or None
        """
        import base64 as b64mod
        import io

        # Download/decode image and ensure PNG format (SVD requires PNG)
        async with httpx.AsyncClient(timeout=60) as client:
            if image_url.startswith("data:"):
                raw_b64 = image_url.split(",", 1)[1] if "," in image_url else image_url
                img_bytes = b64mod.b64decode(raw_b64)
            else:
                img_resp = await client.get(image_url)
                img_resp.raise_for_status()
                img_bytes = img_resp.content

            # Convert to PNG and resize to 1024x576 (SVD optimal)
            try:
                from PIL import Image
                img = Image.open(io.BytesIO(img_bytes))
                img = img.convert("RGB")
                # SVD works best with 1024x576
                img = img.resize((1024, 576), Image.LANCZOS)
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                image_b64 = b64mod.b64encode(buf.getvalue()).decode()
            except Exception as conv_err:
                logger.warning(f"Image conversion failed, using raw: {conv_err}")
                image_b64 = b64mod.b64encode(img_bytes).decode()

            if model == "SVD-XT":
                frames = 25  # SVD-XT requires exactly 25 frames

            data = {
                "model_name": model,
                "image_file": image_b64,
                "steps": steps,
                "frames_num": frames,
                "frames_per_second": fps,
            }

            response = await client.post(
                f"{NOVITA_API_BASE}/async/img2video",
                json=data,
                headers=self.headers,
                timeout=30,
            )
            response.raise_for_status()
            result = response.json()

            task_id = result.get("task_id", "")
            if not task_id:
                raise RuntimeError("No task_id from Novita.ai img2video")

            logger.info("Novita.ai img2video task: %s", task_id)

            import asyncio
            for i in range(120):
                await asyncio.sleep(5)

                poll = await client.get(
                    f"{NOVITA_API_BASE}/async/task-result?task_id={task_id}",
                    headers=self.headers,
                    timeout=15,
                )
                poll.raise_for_status()
                poll_data = poll.json()
                status = poll_data.get("task", {}).get("status", "")

                if status == "TASK_STATUS_SUCCEED":
                    videos = poll_data.get("videos", [])
                    if videos:
                        return videos[0].get("video_url", "")
                    return None
                elif status in ("TASK_STATUS_FAILED", "TASK_STATUS_CANCELED"):
                    reason = poll_data.get("task", {}).get("reason", "")
                    raise RuntimeError(f"Novita.ai img2video failed: {reason}")

            raise TimeoutError("Novita.ai img2video timed out")
