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
    "novita_dreamshaper_xl": {
        "model_name": "dreamshaperXL_v21Turbo_631290.safetensors",
        "name": "DreamShaper XL",
        "category": "artistic",
        "description": "Versatile SDXL model, great for all styles",
        "min_plan": "free",
        "credits": 2,
        "defaults": {"steps": 8, "guidance_scale": 2, "width": 1024, "height": 1024},
    },
    "novita_realistic_vision": {
        "model_name": "realisticVisionV60B1_v51VAE_127635.safetensors",
        "name": "Realistic Vision v5.1 (NSFW OK)",
        "category": "realistic",
        "description": "Photorealistic, NSFW-friendly checkpoint",
        "min_plan": "free",
        "credits": 2,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 512, "height": 768},
    },
    "novita_meinamix": {
        "model_name": "meinamix_meinaV11_97584.safetensors",
        "name": "MeinaMix v11 (Anime NSFW)",
        "category": "anime",
        "description": "High quality anime, NSFW-friendly",
        "min_plan": "free",
        "credits": 2,
        "defaults": {"steps": 25, "guidance_scale": 7, "width": 512, "height": 768},
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
            data = {
                "model_name": model_name,
                "prompt": prompt,
                "negative_prompt": negative_prompt or "(worst quality, low quality:1.3)",
                "width": width,
                "height": height,
                "steps": steps,
                "guidance_scale": guidance_scale if guidance_scale > 1 else 7.0,
                "image_num": 1,
                "enable_nsfw_detection": False,
            }
            if seed >= 0:
                data["seed"] = seed
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
