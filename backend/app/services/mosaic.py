"""Mosaic/censoring service for NSFW content compliance.

For Japanese law compliance (Article 175):
- When NSFW content is published publicly from JP region, apply auto-mosaic.
- Original (uncensored) image is preserved for the creator's private use.
- Public gallery shows the censored version.

Uses NudeNet for detection + Gaussian blur for censoring.
Falls back to full-image bottom-half blur if NudeNet unavailable.
"""

import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def apply_mosaic_to_image(
    image_bytes: bytes,
    intensity: str = "strong",
) -> bytes:
    """Apply mosaic/censoring to an image.

    Args:
        image_bytes: Original image bytes
        intensity: "light", "medium", "strong" — mosaic block size

    Returns:
        Censored image bytes (PNG)
    """
    try:
        from PIL import Image, ImageFilter

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        w, h = img.size

        # Try NudeNet detection first (precise)
        try:
            return _apply_nudenet_mosaic(img, intensity)
        except ImportError:
            logger.warning("NudeNet not installed, using fallback bottom-half blur")
        except Exception as e:
            logger.warning(f"NudeNet detection failed: {e}, using fallback")

        # Fallback: heavy blur on bottom 60% (covers most explicit areas)
        # This is intentionally conservative for legal safety
        bottom_start = int(h * 0.35)
        top = img.crop((0, 0, w, bottom_start))
        bottom = img.crop((0, bottom_start, w, h))

        # Pixelate bottom by downsampling
        block_size = {"light": 16, "medium": 24, "strong": 32}.get(intensity, 24)
        small_w = max(1, (w) // block_size)
        small_h = max(1, (h - bottom_start) // block_size)
        bottom_small = bottom.resize((small_w, small_h), Image.NEAREST)
        bottom_pixelated = bottom_small.resize((w, h - bottom_start), Image.NEAREST)

        result = Image.new("RGB", (w, h))
        result.paste(top, (0, 0))
        result.paste(bottom_pixelated, (0, bottom_start))

        # Add a small "MOSAIC APPLIED" indicator
        try:
            from PIL import ImageDraw, ImageFont
            draw = ImageDraw.Draw(result)
            draw.rectangle([(w - 110, h - 25), (w - 5, h - 5)], fill=(0, 0, 0, 180))
            draw.text((w - 105, h - 22), "MOSAIC", fill=(255, 255, 255))
        except Exception:
            pass

        out = io.BytesIO()
        result.save(out, format="PNG", quality=90)
        return out.getvalue()

    except Exception as e:
        logger.error(f"Mosaic application failed completely: {e}")
        # Last resort: return heavily blurred entire image
        try:
            from PIL import Image, ImageFilter
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            blurred = img.filter(ImageFilter.GaussianBlur(radius=30))
            out = io.BytesIO()
            blurred.save(out, format="PNG")
            return out.getvalue()
        except Exception:
            return image_bytes  # Give up — return original


def _apply_nudenet_mosaic(img, intensity: str = "strong"):
    """Use NudeNet to detect explicit regions and pixelate them precisely."""
    from nudenet import NudeDetector
    from PIL import Image
    import numpy as np

    detector = NudeDetector()
    arr = np.array(img)
    detections = detector.detect(arr)

    EXPLICIT_LABELS = {
        "FEMALE_GENITALIA_EXPOSED",
        "MALE_GENITALIA_EXPOSED",
        "ANUS_EXPOSED",
        "FEMALE_BREAST_EXPOSED",  # Optional: include breasts in JP mosaic
        "BUTTOCKS_EXPOSED",
    }

    block_size = {"light": 12, "medium": 18, "strong": 24}.get(intensity, 18)

    result = img.copy()
    for det in detections:
        label = det.get("class", "")
        if label not in EXPLICIT_LABELS:
            continue
        box = det.get("box", [])
        if len(box) != 4:
            continue
        x, y, bw, bh = box
        # Pixelate this region
        region = result.crop((x, y, x + bw, y + bh))
        small = region.resize(
            (max(1, bw // block_size), max(1, bh // block_size)),
            Image.NEAREST,
        )
        pixelated = small.resize((bw, bh), Image.NEAREST)
        result.paste(pixelated, (x, y))

    out = io.BytesIO()
    result.save(out, format="PNG")
    return out.getvalue()
