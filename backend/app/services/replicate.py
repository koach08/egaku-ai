"""Replicate API client - primary GPU backend for EGAKU AI."""

import logging

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)

REPLICATE_API_BASE = "https://api.replicate.com/v1"

# ─── Available Models ───
# Organized by category for the frontend model selector

MODELS = {
    # --- Flux (best quality) ---
    "flux_dev": {
        "replicate_id": "black-forest-labs/flux-dev",
        "name": "Flux Dev",
        "category": "flux",
        "description": "High quality, detailed images",
        "min_plan": "free",
        "credits": 3,
    },
    "flux_schnell": {
        "replicate_id": "black-forest-labs/flux-schnell",
        "name": "Flux Schnell",
        "category": "flux",
        "description": "Fast generation, good quality",
        "min_plan": "free",
        "credits": 1,
    },
    # --- SDXL ---
    "sdxl": {
        "replicate_id": "stability-ai/sdxl",
        "name": "Stable Diffusion XL",
        "category": "sdxl",
        "description": "Versatile, high resolution",
        "min_plan": "free",
        "credits": 2,
    },
    "sdxl_lightning": {
        "replicate_id": "bytedance/sdxl-lightning-4step",
        "name": "SDXL Lightning",
        "category": "sdxl",
        "description": "Ultra-fast SDXL in 4 steps",
        "min_plan": "free",
        "credits": 1,
    },
    "realvisxl": {
        "replicate_id": "adirik/realvisxl-v3.0-turbo",
        "name": "RealVisXL v3 Turbo",
        "category": "realistic",
        "description": "Photorealistic images",
        "min_plan": "free",
        "credits": 2,
    },
    # --- SD 3.5 ---
    "sd35_large": {
        "replicate_id": "stability-ai/stable-diffusion-3.5-large",
        "name": "SD 3.5 Large",
        "category": "sd3",
        "description": "Latest Stability AI model",
        "min_plan": "lite",
        "credits": 3,
    },
    "sd35_turbo": {
        "replicate_id": "stability-ai/stable-diffusion-3.5-large-turbo",
        "name": "SD 3.5 Turbo",
        "category": "sd3",
        "description": "Fast SD 3.5 variant",
        "min_plan": "free",
        "credits": 2,
    },
    # --- Realistic ---
    "realistic_vision": {
        "replicate_id": "lucataco/realistic-vision-v5.1",
        "name": "Realistic Vision v5.1",
        "category": "realistic",
        "description": "Photorealistic, portraits",
        "min_plan": "free",
        "credits": 2,
    },
    # --- Artistic ---
    "playground": {
        "replicate_id": "playgroundai/playground-v2.5-1024px-aesthetic",
        "name": "Playground v2.5",
        "category": "artistic",
        "description": "Aesthetic, creative images",
        "min_plan": "free",
        "credits": 2,
    },
    "proteus": {
        "replicate_id": "datacte/proteus-v0.3",
        "name": "Proteus v0.3",
        "category": "anime",
        "description": "Anime & illustration style",
        "min_plan": "free",
        "credits": 2,
    },
}

# Video models
VIDEO_MODELS = {
    "wan_t2v": {
        "replicate_id": "wan-video/wan-2.5-t2v",
        "name": "Wan 2.5 T2V",
        "description": "Text-to-video generation",
    },
    "wan_t2v_fast": {
        "replicate_id": "wan-video/wan-2.2-t2v-fast",
        "name": "Wan 2.2 T2V Fast",
        "description": "Fast text-to-video generation",
    },
    "wan_i2v": {
        "replicate_id": "wan-video/wan-2.5-i2v",
        "name": "Wan 2.5 I2V",
        "description": "Image-to-video animation",
    },
}

# Utility models
UTILITY_MODELS = {
    "upscale": "nightmareai/real-esrgan",
    "remove_bg": "cjwbw/rembg",
}


class ReplicateClient:
    def __init__(self, settings: Settings):
        self.api_token = settings.replicate_api_token
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
            "Prefer": "respond-async",
        }

    def is_available(self) -> bool:
        return bool(self.api_token)

    async def _submit(self, model: str, input_params: dict) -> dict:
        """Generic submission to any Replicate model."""
        payload = {"input": input_params}

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{REPLICATE_API_BASE}/models/{model}/predictions",
                json=payload,
                headers=self.headers,
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
            logger.info("Replicate job submitted: %s (model: %s)", data.get("id"), model)
            return data

    # ─── txt2img ───

    async def submit_txt2img(
        self,
        prompt: str,
        model_id: str = "flux_dev",
        width: int = 1024,
        height: int = 1024,
        steps: int = 20,
        cfg: float = 1.0,
        seed: int = -1,
        negative_prompt: str = "",
    ) -> dict:
        """Submit a txt2img generation job."""
        model_info = MODELS.get(model_id, MODELS["flux_dev"])
        replicate_model = model_info["replicate_id"]

        # Different models accept different parameters
        input_params: dict = {"prompt": prompt}

        # Disable Replicate's safety checker to prevent false-positive blurring
        input_params["disable_safety_checker"] = True

        if "flux" in replicate_model:
            input_params["width"] = width
            input_params["height"] = height
            input_params["num_inference_steps"] = steps
            input_params["guidance"] = cfg
            input_params["output_format"] = "png"
            if seed >= 0:
                input_params["seed"] = seed
        elif "sdxl" in replicate_model or "stable-diffusion-3" in replicate_model:
            input_params["width"] = width
            input_params["height"] = height
            input_params["num_inference_steps"] = steps
            input_params["guidance_scale"] = cfg if cfg > 1 else 7.5
            if negative_prompt:
                input_params["negative_prompt"] = negative_prompt
            if seed >= 0:
                input_params["seed"] = seed
        elif "playground" in replicate_model:
            input_params["width"] = width
            input_params["height"] = height
            input_params["num_inference_steps"] = steps
            input_params["guidance_scale"] = cfg if cfg > 1 else 7.5
            if negative_prompt:
                input_params["negative_prompt"] = negative_prompt
            if seed >= 0:
                input_params["seed"] = seed
        else:
            # Generic SD-like model
            input_params["width"] = width
            input_params["height"] = height
            input_params["num_inference_steps"] = steps
            input_params["guidance_scale"] = cfg if cfg > 1 else 7.5
            if negative_prompt:
                input_params["negative_prompt"] = negative_prompt
            if seed >= 0:
                input_params["seed"] = seed

        return await self._submit(replicate_model, input_params)

    # Keep old method name for backward compatibility
    async def submit_job(self, prompt: str, **kwargs) -> dict:
        return await self.submit_txt2img(prompt=prompt, **kwargs)

    # ─── txt2vid ───

    async def submit_txt2vid(
        self,
        prompt: str,
        width: int = 512,
        height: int = 512,
        num_frames: int = 16,
        fps: int = 8,
        seed: int = -1,
    ) -> dict:
        """Submit a text-to-video generation job using Wan 2.5."""
        input_params = {
            "prompt": prompt,
        }

        if seed >= 0:
            input_params["seed"] = seed

        return await self._submit("wan-video/wan-2.5-t2v", input_params)

    # ─── img2vid ───

    async def submit_img2vid(
        self,
        image_url: str,
        prompt: str = "",
        num_frames: int = 25,
        fps: int = 8,
        seed: int = -1,
    ) -> dict:
        """Submit an image-to-video job using Wan 2.5 I2V."""
        input_params = {
            "image": image_url,
        }

        if prompt:
            input_params["prompt"] = prompt
        if seed >= 0:
            input_params["seed"] = seed

        return await self._submit("wan-video/wan-2.5-i2v", input_params)

    # ─── img2img (via Flux or SDXL) ───

    async def submit_img2img(
        self,
        image_url: str,
        prompt: str,
        model_id: str = "flux_dev",
        strength: float = 0.7,
        steps: int = 20,
        cfg: float = 1.0,
        seed: int = -1,
        negative_prompt: str = "",
    ) -> dict:
        """Submit an img2img job."""
        # Use SDXL for img2img as it has better support
        input_params = {
            "image": image_url,
            "prompt": prompt,
            "prompt_strength": strength,
            "num_inference_steps": steps,
            "guidance_scale": cfg if cfg > 1 else 7.5,
            "disable_safety_checker": True,
        }
        if negative_prompt:
            input_params["negative_prompt"] = negative_prompt
        if seed >= 0:
            input_params["seed"] = seed

        return await self._submit("stability-ai/sdxl", input_params)

    # ─── Inpaint ───

    async def submit_inpaint(
        self,
        image_url: str,
        mask_url: str,
        prompt: str,
        negative_prompt: str = "",
        strength: float = 0.7,
        steps: int = 20,
        cfg: float = 7.5,
        seed: int = -1,
    ) -> dict:
        """Submit an inpaint job using SDXL inpainting."""
        input_params = {
            "image": image_url,
            "mask": mask_url,
            "prompt": prompt,
            "prompt_strength": strength,
            "num_inference_steps": steps,
            "guidance_scale": cfg if cfg > 1 else 7.5,
            "disable_safety_checker": True,
        }
        if negative_prompt:
            input_params["negative_prompt"] = negative_prompt
        if seed >= 0:
            input_params["seed"] = seed

        return await self._submit("stability-ai/sdxl", input_params)

    # ─── Upscale ───

    async def submit_upscale(
        self,
        image_url: str,
        scale: int = 4,
    ) -> dict:
        """Submit an upscale job using Real-ESRGAN."""
        input_params = {
            "image": image_url,
            "scale": scale,
            "face_enhance": False,
        }

        return await self._submit(UTILITY_MODELS["upscale"], input_params)

    # ─── Remove Background ───

    async def submit_remove_bg(
        self,
        image_url: str,
    ) -> dict:
        """Submit a background removal job using rembg."""
        input_params = {
            "image": image_url,
        }

        return await self._submit(UTILITY_MODELS["remove_bg"], input_params)

    # ─── Status check ───

    async def check_status(self, prediction_id: str) -> dict:
        """Check prediction status."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{REPLICATE_API_BASE}/predictions/{prediction_id}",
                headers=self.headers,
                timeout=15,
            )
            response.raise_for_status()
            return response.json()

    async def cancel_job(self, prediction_id: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{REPLICATE_API_BASE}/predictions/{prediction_id}/cancel",
                headers=self.headers,
                timeout=15,
            )
            response.raise_for_status()
            return response.json()
