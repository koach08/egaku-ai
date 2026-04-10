"""Smart Prompt Optimizer — learns and improves generation quality over time.

This module:
1. Enhances user prompts with quality keywords and model-specific optimizations
2. Auto-selects the best model based on prompt content
3. Tracks which optimizations produce the best results (via user feedback)
4. Gets smarter over time as more data accumulates
"""

import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Quality Enhancement Templates ───
# These are appended to user prompts based on the target model type

QUALITY_SUFFIXES = {
    "flux": ", highly detailed, professional photography, 8k resolution",
    "sdxl": ", (masterpiece:1.2), (best quality:1.2), highly detailed, sharp focus, 8k",
    "sd15": ", (masterpiece:1.4), (best quality:1.4), ultra detailed, photorealistic, sharp focus",
    "pony": ", score_9, score_8_up, score_7_up, masterpiece, detailed",
    "video": ", cinematic, smooth motion, high quality, 4K",
}

NEGATIVE_DEFAULTS = {
    "flux": "",  # Flux doesn't use negative prompts
    "sdxl": "(worst quality:1.4), (low quality:1.4), ugly, deformed, blurry, bad anatomy, bad hands, text, watermark, signature",
    "sd15": "ugly, deformed, noisy, blurry, low quality, worst quality, bad anatomy, bad hands, text, watermark, signature, jpeg artifacts",
    "pony": "score_4, score_3, score_2, score_1, ugly, deformed, bad anatomy, text, watermark",
    "video": "blurry, low quality, distorted, text, watermark",
}

# ─── Model Auto-Selection ───

# Keywords that suggest which model family works best
MODEL_HINTS = {
    "anime": ["anime", "manga", "waifu", "hentai", "2d", "illustration", "cel shading", "アニメ", "漫画"],
    "realistic": ["photorealistic", "photograph", "portrait", "photo", "realistic", "natural", "cinematic", "写真", "リアル"],
    "asian": ["japanese", "korean", "asian", "idol", "gravure", "日本", "韓国", "アジア"],
    "landscape": ["landscape", "cityscape", "scenery", "nature", "mountain", "ocean", "sky", "風景"],
    "nsfw": ["nude", "naked", "lingerie", "sensual", "erotic", "intimate", "bikini", "sexy"],
    "video": ["video", "animation", "motion", "动画", "動画"],
}

# Model family → best fal.ai/ComfyUI model
BEST_MODELS = {
    "anime": {"fal": "fal_flux_dev", "comfyui": "cyberrealisticPony.safetensors"},
    "realistic": {"fal": "fal_flux_dev", "comfyui": "realvisxlV50.safetensors"},
    "asian": {"fal": "fal_flux_dev", "comfyui": "chilloutmix.safetensors"},
    "landscape": {"fal": "fal_flux_dev", "comfyui": "realvisxlV50.safetensors"},
    "nsfw_realistic": {"fal": "fal_flux_realism", "comfyui": "epicphotogasm.safetensors"},
    "nsfw_anime": {"fal": "fal_flux_dev", "comfyui": "cyberrealisticPony.safetensors"},
    "nsfw_asian": {"fal": "fal_flux_realism", "comfyui": "chilloutmix.safetensors"},
    "default": {"fal": "fal_flux_dev", "comfyui": "realvisxlV50.safetensors"},
}

# ─── Cinema Preset Suffixes (from frontend) ───

CINEMA_PRESETS = {
    "arri_alexa": "shot on ARRI Alexa Mini LF, natural film grain, organic color science",
    "red_v_raptor": "shot on RED V-Raptor 8K, ultra sharp, vivid colors, digital cinema",
    "sony_venice": "shot on Sony VENICE 2, soft cinematic look, beautiful skin tones",
    "blackmagic": "shot on Blackmagic URSA Mini Pro, rich color, filmic texture",
    "panavision": "shot on Panavision Millennium DXL2, classic Hollywood look, warm tones",
    "canon_c70": "shot on Canon EOS C70, natural colors, documentary style",
    "hasselblad": "shot on Hasselblad X2D 100C, medium format, extraordinary detail",
    "leica": "shot on Leica SL3, German optics, precise rendering, subtle contrast",
    "fujifilm": "shot on Fujifilm GFX100 II, film simulation, organic colors",
    "nikon_z9": "shot on Nikon Z9, fast action, precise AF, professional sports quality",
}


def detect_content_type(prompt: str, nsfw: bool = False) -> str:
    """Detect the content type from the prompt text."""
    prompt_lower = prompt.lower()

    is_anime = any(kw in prompt_lower for kw in MODEL_HINTS["anime"])
    is_asian = any(kw in prompt_lower for kw in MODEL_HINTS["asian"])
    is_nsfw = nsfw or any(kw in prompt_lower for kw in MODEL_HINTS["nsfw"])

    if is_nsfw and is_anime:
        return "nsfw_anime"
    elif is_nsfw and is_asian:
        return "nsfw_asian"
    elif is_nsfw:
        return "nsfw_realistic"
    elif is_anime:
        return "anime"
    elif is_asian:
        return "asian"
    elif any(kw in prompt_lower for kw in MODEL_HINTS["landscape"]):
        return "landscape"
    elif any(kw in prompt_lower for kw in MODEL_HINTS["realistic"]):
        return "realistic"
    else:
        return "default"


def get_model_family(model_id: str) -> str:
    """Map model ID to its family for quality suffix selection."""
    if "flux" in model_id.lower():
        return "flux"
    elif "sdxl" in model_id.lower() or "realvis" in model_id.lower() or "xl" in model_id.lower():
        return "sdxl"
    elif "pony" in model_id.lower() or "cyber" in model_id.lower():
        return "pony"
    else:
        return "sd15"


def optimize_prompt(
    prompt: str,
    model_id: str = "",
    nsfw: bool = False,
    cinema_preset: Optional[str] = None,
    auto_enhance: bool = True,
) -> dict:
    """Optimize a user prompt for maximum generation quality.

    Returns:
        dict with keys:
        - prompt: optimized prompt string
        - negative_prompt: recommended negative prompt
        - recommended_model: suggested model if none specified
        - content_type: detected content category
        - model_family: the model family being used
    """
    content_type = detect_content_type(prompt, nsfw)

    # Determine model family
    if model_id:
        model_family = get_model_family(model_id)
    else:
        model_family = "flux"  # Default to highest quality

    # Build optimized prompt
    optimized = prompt.strip()

    if auto_enhance:
        # Don't add quality suffixes if user already included them
        has_quality = any(kw in prompt.lower() for kw in ["masterpiece", "best quality", "8k", "ultra detailed", "highly detailed"])
        if not has_quality:
            suffix = QUALITY_SUFFIXES.get(model_family, QUALITY_SUFFIXES["sdxl"])
            optimized += suffix

    # Add cinema preset if specified
    if cinema_preset and cinema_preset in CINEMA_PRESETS:
        optimized += f", {CINEMA_PRESETS[cinema_preset]}"

    # Get negative prompt
    negative = NEGATIVE_DEFAULTS.get(model_family, NEGATIVE_DEFAULTS["sdxl"])

    # Recommend best model if none specified
    recommended = BEST_MODELS.get(content_type, BEST_MODELS["default"])

    return {
        "prompt": optimized,
        "negative_prompt": negative,
        "recommended_model_fal": recommended["fal"],
        "recommended_model_comfyui": recommended["comfyui"],
        "content_type": content_type,
        "model_family": model_family,
    }


def recommend_resolution(model_family: str, content_type: str) -> tuple[int, int]:
    """Recommend optimal resolution based on model and content."""
    if model_family == "flux":
        if content_type in ("landscape",):
            return 1344, 768
        else:
            return 768, 1024  # Portrait default for Flux
    elif model_family in ("sdxl", "pony"):
        if content_type in ("landscape",):
            return 1216, 832
        else:
            return 832, 1216
    else:  # sd15
        if content_type in ("landscape",):
            return 768, 512
        else:
            return 512, 768


# ─── Feedback Learning (future: store in DB) ───

async def record_feedback(
    supabase,
    generation_id: str,
    feedback_type: str,  # "like", "save", "share", "report"
    user_id: str,
    prompt_original: str,
    prompt_optimized: str,
    model_used: str,
    content_type: str,
):
    """Record user feedback on a generation for future learning.

    This data will be used to:
    - Track which optimizations produce liked/saved results
    - Improve model selection over time
    - Build prompt templates from successful generations
    """
    try:
        supabase.table("prompt_feedback").insert({
            "generation_id": generation_id,
            "user_id": user_id,
            "feedback_type": feedback_type,
            "prompt_original": prompt_original,
            "prompt_optimized": prompt_optimized,
            "model_used": model_used,
            "content_type": content_type,
        }).execute()
        logger.info(f"Feedback recorded: {feedback_type} for {generation_id}")
    except Exception as e:
        # Non-fatal - table might not exist yet
        logger.debug(f"Feedback recording skipped: {e}")
