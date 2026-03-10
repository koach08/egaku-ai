"""Build ComfyUI workflow JSON for RunPod Serverless workers."""

import random


def build_flux_workflow(
    prompt: str,
    negative_prompt: str = "",
    width: int = 1024,
    height: int = 1024,
    steps: int = 20,
    cfg: float = 1.0,
    seed: int = -1,
) -> dict:
    """Build a Flux.1-dev txt2img workflow for ComfyUI.

    Uses CheckpointLoaderSimple since the RunPod ComfyUI template
    bundles Flux as a single checkpoint file.
    """
    if seed == -1:
        seed = random.randint(0, 2**63)

    return {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "flux1-dev-fp8.safetensors"},
        },
        "5": {
            "class_type": "EmptySD3LatentImage",
            "inputs": {"width": width, "height": height, "batch_size": 1},
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": prompt, "clip": ["4", 1]},
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": negative_prompt or "", "clip": ["4", 1]},
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["13", 0], "vae": ["4", 2]},
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "EGAKU", "images": ["8", 0]},
        },
        "13": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": steps,
                "cfg": cfg,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1.0,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0],
            },
        },
    }


def build_sd15_workflow(
    prompt: str,
    negative_prompt: str = "",
    model: str = "v1-5-pruned-emaonly.safetensors",
    width: int = 512,
    height: int = 768,
    steps: int = 25,
    cfg: float = 7.0,
    sampler: str = "euler_ancestral",
    scheduler: str = "normal",
    seed: int = -1,
) -> dict:
    """Build a SD1.5 txt2img workflow for ComfyUI."""
    if seed == -1:
        seed = random.randint(0, 2**63)

    return {
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "cfg": cfg,
                "denoise": 1.0,
                "latent_image": ["5", 0],
                "model": ["4", 0],
                "negative": ["7", 0],
                "positive": ["6", 0],
                "sampler_name": sampler,
                "scheduler": scheduler,
                "seed": seed,
                "steps": steps,
            },
        },
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": model},
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"batch_size": 1, "height": height, "width": width},
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": prompt},
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": negative_prompt},
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "EGAKU", "images": ["8", 0]},
        },
    }


def build_animatediff_workflow(
    prompt: str,
    negative_prompt: str = "",
    model: str = "v1-5-pruned-emaonly.safetensors",
    motion_model: str = "mm_sd_v15_v2.ckpt",
    width: int = 512,
    height: int = 512,
    steps: int = 20,
    cfg: float = 7.5,
    sampler: str = "euler_ancestral",
    scheduler: str = "normal",
    seed: int = -1,
    frame_count: int = 16,
    fps: int = 8,
    output_format: str = "gif",
) -> dict:
    """Build AnimateDiff txt2vid workflow for ComfyUI."""
    if seed == -1:
        seed = random.randint(0, 2**63)

    fmt_map = {"gif": "image/gif", "webp": "image/webp", "mp4": "video/h264-mp4"}

    return {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": model},
        },
        "20": {
            "class_type": "ADE_AnimateDiffLoaderWithContext",
            "inputs": {
                "model": ["4", 0],
                "model_name": motion_model,
                "beta_schedule": "sqrt_linear (AnimateDiff)",
                "context_options": ["21", 0],
            },
        },
        "21": {
            "class_type": "ADE_StandardStaticContextOptions",
            "inputs": {"context_length": 16, "context_overlap": 4},
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"batch_size": frame_count, "height": height, "width": width},
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": prompt},
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": negative_prompt},
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "cfg": cfg,
                "denoise": 1.0,
                "latent_image": ["5", 0],
                "model": ["20", 0],
                "negative": ["7", 0],
                "positive": ["6", 0],
                "sampler_name": sampler,
                "scheduler": scheduler,
                "seed": seed,
                "steps": steps,
            },
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
        },
        "30": {
            "class_type": "VHS_VideoCombine",
            "inputs": {
                "images": ["8", 0],
                "frame_rate": fps,
                "loop_count": 0,
                "filename_prefix": "EGAKU",
                "format": fmt_map.get(output_format, "image/gif"),
                "pingpong": False,
                "save_output": True,
            },
        },
    }


def build_img2img_workflow(
    prompt: str,
    negative_prompt: str = "",
    model: str = "flux1-dev-fp8.safetensors",
    width: int = 1024,
    height: int = 1024,
    steps: int = 20,
    cfg: float = 1.0,
    denoise: float = 0.7,
    sampler: str = "euler",
    scheduler: str = "simple",
    seed: int = -1,
) -> dict:
    """Build img2img workflow for ComfyUI using Flux model."""
    if seed == -1:
        seed = random.randint(0, 2**63)

    return {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": model},
        },
        "40": {
            "class_type": "LoadImage",
            "inputs": {"image": "input.png"},
        },
        "41": {
            "class_type": "ImageScale",
            "inputs": {
                "image": ["40", 0],
                "width": width,
                "height": height,
                "upscale_method": "lanczos",
                "crop": "center",
            },
        },
        "42": {
            "class_type": "VAEEncode",
            "inputs": {"pixels": ["41", 0], "vae": ["4", 2]},
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": prompt},
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": negative_prompt},
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "cfg": cfg,
                "denoise": denoise,
                "latent_image": ["42", 0],
                "model": ["4", 0],
                "negative": ["7", 0],
                "positive": ["6", 0],
                "sampler_name": sampler,
                "scheduler": scheduler,
                "seed": seed,
                "steps": steps,
            },
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "EGAKU_img2img", "images": ["8", 0]},
        },
    }


def build_img2vid_workflow(
    prompt: str = "",
    negative_prompt: str = "",
    model: str = "v1-5-pruned-emaonly.safetensors",
    motion_model: str = "mm_sd_v15_v2.ckpt",
    width: int = 512,
    height: int = 512,
    steps: int = 20,
    cfg: float = 7.5,
    denoise: float = 0.7,
    sampler: str = "euler_ancestral",
    scheduler: str = "normal",
    seed: int = -1,
    frame_count: int = 16,
    fps: int = 8,
    output_format: str = "gif",
) -> dict:
    """Build img2vid workflow: animate a still image using AnimateDiff."""
    if seed == -1:
        seed = random.randint(0, 2**63)

    fmt_map = {"gif": "image/gif", "webp": "image/webp", "mp4": "video/h264-mp4"}

    return {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": model},
        },
        "40": {
            "class_type": "LoadImage",
            "inputs": {"image": "input.png"},
        },
        "41": {
            "class_type": "ImageScale",
            "inputs": {
                "image": ["40", 0],
                "width": width,
                "height": height,
                "upscale_method": "lanczos",
                "crop": "center",
            },
        },
        "42": {
            "class_type": "VAEEncode",
            "inputs": {"pixels": ["41", 0], "vae": ["4", 2]},
        },
        "43": {
            "class_type": "RepeatLatentBatch",
            "inputs": {"samples": ["42", 0], "amount": frame_count},
        },
        "20": {
            "class_type": "ADE_AnimateDiffLoaderWithContext",
            "inputs": {
                "model": ["4", 0],
                "model_name": motion_model,
                "beta_schedule": "sqrt_linear (AnimateDiff)",
                "context_options": ["21", 0],
            },
        },
        "21": {
            "class_type": "ADE_StandardStaticContextOptions",
            "inputs": {"context_length": 16, "context_overlap": 4},
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": prompt or "high quality, smooth motion"},
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": negative_prompt or "worst quality, static, blurry"},
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "cfg": cfg,
                "denoise": denoise,
                "latent_image": ["43", 0],
                "model": ["20", 0],
                "negative": ["7", 0],
                "positive": ["6", 0],
                "sampler_name": sampler,
                "scheduler": scheduler,
                "seed": seed,
                "steps": steps,
            },
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
        },
        "30": {
            "class_type": "VHS_VideoCombine",
            "inputs": {
                "images": ["8", 0],
                "frame_rate": fps,
                "loop_count": 0,
                "filename_prefix": "EGAKU_img2vid",
                "format": fmt_map.get(output_format, "image/gif"),
                "pingpong": False,
                "save_output": True,
            },
        },
    }


def build_upscale_workflow(
    scale: int = 2,
    upscale_model: str = "RealESRGAN_x4plus.pth",
) -> dict:
    """Build upscale workflow using model-based upscaling."""
    return {
        "40": {
            "class_type": "LoadImage",
            "inputs": {"image": "input.png"},
        },
        "50": {
            "class_type": "UpscaleModelLoader",
            "inputs": {"model_name": upscale_model},
        },
        "51": {
            "class_type": "ImageUpscaleWithModel",
            "inputs": {
                "upscale_model": ["50", 0],
                "image": ["40", 0],
            },
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "EGAKU_upscale", "images": ["51", 0]},
        },
    }


def build_inpaint_workflow(
    prompt: str,
    negative_prompt: str = "",
    model: str = "flux1-dev-fp8.safetensors",
    width: int = 1024,
    height: int = 1024,
    steps: int = 20,
    cfg: float = 1.0,
    denoise: float = 0.8,
    sampler: str = "euler",
    scheduler: str = "simple",
    seed: int = -1,
) -> dict:
    """Build inpainting workflow. Uses image + mask."""
    if seed == -1:
        seed = random.randint(0, 2**63)

    return {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": model},
        },
        "40": {
            "class_type": "LoadImage",
            "inputs": {"image": "input.png"},
        },
        "44": {
            "class_type": "LoadImage",
            "inputs": {"image": "mask.png"},
        },
        "41": {
            "class_type": "ImageScale",
            "inputs": {
                "image": ["40", 0],
                "width": width,
                "height": height,
                "upscale_method": "lanczos",
                "crop": "center",
            },
        },
        "45": {
            "class_type": "ImageToMask",
            "inputs": {"image": ["44", 0], "channel": "red"},
        },
        "42": {
            "class_type": "VAEEncodeForInpaint",
            "inputs": {
                "pixels": ["41", 0],
                "vae": ["4", 2],
                "mask": ["45", 0],
                "grow_mask_by": 6,
            },
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": prompt},
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": negative_prompt},
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "cfg": cfg,
                "denoise": denoise,
                "latent_image": ["42", 0],
                "model": ["4", 0],
                "negative": ["7", 0],
                "positive": ["6", 0],
                "sampler_name": sampler,
                "scheduler": scheduler,
                "seed": seed,
                "steps": steps,
            },
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "EGAKU_inpaint", "images": ["8", 0]},
        },
    }


def build_controlnet_workflow(
    prompt: str,
    negative_prompt: str = "",
    model: str = "v1-5-pruned-emaonly.safetensors",
    control_type: str = "canny",
    control_strength: float = 1.0,
    width: int = 512,
    height: int = 768,
    steps: int = 25,
    cfg: float = 7.0,
    sampler: str = "euler_ancestral",
    scheduler: str = "normal",
    seed: int = -1,
) -> dict:
    """Build ControlNet workflow. Control image loaded via LoadImage."""
    if seed == -1:
        seed = random.randint(0, 2**63)

    # Map control type to model filename
    controlnet_models = {
        "canny": "control_v11p_sd15_canny.pth",
        "depth": "control_v11f1p_sd15_depth.pth",
        "openpose": "control_v11p_sd15_openpose.pth",
        "scribble": "control_v11p_sd15_scribble.pth",
    }
    cn_model = controlnet_models.get(control_type, controlnet_models["canny"])

    # Preprocessor map
    preprocessors = {
        "canny": "CannyEdgePreprocessor",
        "depth": "DepthAnythingPreprocessor",
        "openpose": "OpenposePreprocessor",
        "scribble": "ScribblePreprocessor",
    }
    preprocessor = preprocessors.get(control_type, "CannyEdgePreprocessor")

    return {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": model},
        },
        "40": {
            "class_type": "LoadImage",
            "inputs": {"image": "input.png"},
        },
        "41": {
            "class_type": "ImageScale",
            "inputs": {
                "image": ["40", 0],
                "width": width,
                "height": height,
                "upscale_method": "lanczos",
                "crop": "center",
            },
        },
        "60": {
            "class_type": preprocessor,
            "inputs": {"image": ["41", 0]},
        },
        "61": {
            "class_type": "ControlNetLoader",
            "inputs": {"control_net_name": cn_model},
        },
        "62": {
            "class_type": "ControlNetApply",
            "inputs": {
                "conditioning": ["6", 0],
                "control_net": ["61", 0],
                "image": ["60", 0],
                "strength": control_strength,
            },
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"batch_size": 1, "height": height, "width": width},
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": prompt},
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": negative_prompt},
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "cfg": cfg,
                "denoise": 1.0,
                "latent_image": ["5", 0],
                "model": ["4", 0],
                "negative": ["7", 0],
                "positive": ["62", 0],
                "sampler_name": sampler,
                "scheduler": scheduler,
                "seed": seed,
                "steps": steps,
            },
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "EGAKU_controlnet", "images": ["8", 0]},
        },
    }


def build_remove_bg_workflow() -> dict:
    """Build background removal workflow using REMBG."""
    return {
        "40": {
            "class_type": "LoadImage",
            "inputs": {"image": "input.png"},
        },
        "50": {
            "class_type": "Image Remove Background (rembg)",
            "inputs": {"image": ["40", 0]},
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "EGAKU_nobg", "images": ["50", 0]},
        },
    }


# Model ID → workflow builder mapping
MODEL_FILENAMES = {
    "sd15": "v1-5-pruned-emaonly.safetensors",
    "anime_sd15": "anything-v5.safetensors",
    "sdxl": "sd_xl_base_1.0.safetensors",
    "real_sdxl": "realvisxl_v4.safetensors",
    "flux_schnell": "flux1-schnell-fp8.safetensors",
    "flux_dev": "flux1-dev-fp8.safetensors",
}


def build_workflow_for_model(model_id: str, params: dict) -> dict:
    """Build the appropriate ComfyUI workflow based on model selection."""
    if model_id in ("flux_schnell", "flux_dev"):
        return build_flux_workflow(
            prompt=params.get("prompt", ""),
            negative_prompt=params.get("negative_prompt", ""),
            width=params.get("width", 1024),
            height=params.get("height", 1024),
            steps=params.get("steps", 20),
            cfg=params.get("cfg", 1.0),
            seed=params.get("seed", -1),
        )
    else:
        return build_sd15_workflow(
            prompt=params.get("prompt", ""),
            negative_prompt=params.get("negative_prompt", ""),
            model=MODEL_FILENAMES.get(model_id, "v1-5-pruned-emaonly.safetensors"),
            width=params.get("width", 512),
            height=params.get("height", 768),
            steps=params.get("steps", 25),
            cfg=params.get("cfg", 7.0),
            sampler=params.get("sampler", "euler_ancestral"),
            scheduler=params.get("scheduler", "normal"),
            seed=params.get("seed", -1),
        )


# Motion model filenames
MOTION_MODELS = {
    "sd15": "mm_sd_v15_v2.ckpt",
}


def build_workflow_for_video(model_id: str, params: dict) -> dict:
    """Build AnimateDiff video workflow based on model + params."""
    base_model = MODEL_FILENAMES.get(model_id, "v1-5-pruned-emaonly.safetensors")
    motion_model = MOTION_MODELS.get("sd15", "mm_sd_v15_v2.ckpt")

    return build_animatediff_workflow(
        prompt=params.get("prompt", ""),
        negative_prompt=params.get("negative_prompt", ""),
        model=base_model,
        motion_model=motion_model,
        width=params.get("width", 512),
        height=params.get("height", 512),
        steps=params.get("steps", 20),
        cfg=params.get("cfg", 7.5),
        sampler=params.get("sampler", "euler_ancestral"),
        scheduler=params.get("scheduler", "normal"),
        seed=params.get("seed", -1),
        frame_count=params.get("frame_count", 16),
        fps=params.get("fps", 8),
        output_format=params.get("output_format", "gif"),
    )
