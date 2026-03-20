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
        "fal_id": "fal-ai/wan/v2.1/image-to-video",
        "name": "Wan 2.1 I2V",
        "description": "Animate images with Wan",
        "credits": 10,
        "min_plan": "free",
    },
}


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

        if "flux" in fal_model:
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

        # Model-specific params
        if "kling" in fal_model:
            input_params["duration"] = "5"
            input_params["aspect_ratio"] = "16:9"
        elif "minimax" in fal_model:
            input_params["prompt_optimizer"] = True

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
        model_id: str = "fal_ltx_i2v",
    ) -> dict:
        """Submit an image-to-video job via fal.ai. Supports multiple models."""
        model_info = VIDEO_MODELS.get(model_id, VIDEO_MODELS["fal_ltx_i2v"])
        fal_model = model_info["fal_id"]

        input_params: dict = {
            "image_url": image_url,
            "enable_safety_checker": False,
        }
        if prompt:
            input_params["prompt"] = prompt
        if seed >= 0:
            input_params["seed"] = seed

        # Model-specific params
        if "kling" in fal_model:
            input_params["duration"] = "5"

        url = f"{FAL_API_BASE}/{fal_model}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=input_params, headers=self.headers, timeout=300,
            )
            response.raise_for_status()
            data = response.json()
            logger.info("fal.ai img2vid job completed: %s", model_id)
            return data

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
