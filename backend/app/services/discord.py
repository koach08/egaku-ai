"""Discord webhook integration — auto-post showcase creations."""

import logging

import httpx

logger = logging.getLogger(__name__)

# Model display names
MODEL_NAMES = {
    "fal_flux_dev": "Flux Dev",
    "fal_flux_pro": "Flux Pro",
    "fal_flux_realism": "Flux Realism",
    "fal_grok_imagine": "Grok Imagine",
    "fal_gpt_image_2": "GPT Image 2",
    "fal_nano_banana_2": "Nano Banana 2",
    "fal_ideogram": "Ideogram v3",
    "fal_luma_photon": "Luma Photon",
    "fal_recraft": "Recraft V3",
    "fal_sdxl": "SDXL",
    "fal_kling_t2v": "Kling v2",
    "fal_kling3_t2v": "Kling 3.0",
    "fal_veo3_t2v": "Veo 3",
    "fal_grok_t2v": "Grok Video",
    "fal_sora2_t2v": "Sora 2",
    "fal_wan_t2v": "Wan 2.1",
    "fal_ltx_t2v": "LTX 2.3",
    "realismIllustrious_v55": "Realism Illustrious",
}


async def post_to_showcase(
    webhook_url: str,
    image_url: str | None = None,
    video_url: str | None = None,
    prompt: str = "",
    model: str = "",
    title: str = "",
) -> bool:
    """Post a new creation to Discord #showcase channel.

    Only posts SFW content. Returns True on success.
    """
    if not webhook_url:
        return False

    model_name = MODEL_NAMES.get(model, model.replace("_", " ").title())
    short_prompt = (prompt[:150] + "...") if len(prompt) > 150 else prompt

    embed = {
        "title": title or "New Creation",
        "description": f"```{short_prompt}```",
        "color": 9442302,  # purple
        "footer": {
            "text": f"Model: {model_name} | Try free → egaku-ai.com",
        },
    }

    if image_url:
        embed["image"] = {"url": image_url}
    elif video_url:
        # Discord embeds can't play video inline, so link it
        embed["description"] += f"\n\n[Watch Video]({video_url})"

    payload = {"embeds": [embed]}

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(webhook_url, json=payload, timeout=10)
            if r.status_code in (200, 204):
                logger.info(f"Discord showcase posted: {model_name}")
                return True
            logger.warning(f"Discord webhook returned {r.status_code}")
    except Exception as e:
        logger.warning(f"Discord webhook failed: {e}")

    return False
