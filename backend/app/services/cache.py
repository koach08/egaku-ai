"""Prompt caching system for EGAKU AI generation results.

Caches generation results in Redis keyed by a hash of the normalized prompt
and generation parameters. This avoids redundant GPU usage when users submit
identical (or semantically equivalent) prompts.
"""

import hashlib
import logging
import re

import redis.asyncio as redis

from app.core.config import Settings

logger = logging.getLogger(__name__)

# Common quality tags that don't meaningfully change the output
# and should be stripped before hashing for better cache hit rates.
QUALITY_TAGS = {
    "masterpiece",
    "best quality",
    "high quality",
    "highest quality",
    "ultra quality",
    "very high quality",
    "extremely detailed",
    "highly detailed",
    "ultra detailed",
    "absurdres",
    "highres",
    "high resolution",
    "ultra high resolution",
    "4k",
    "8k",
    "hdr",
    "uhd",
    "high detail",
    "sharp focus",
    "intricate detail",
    "intricate details",
    "detailed",
}

CACHE_KEY_PREFIX = "prompt_cache:"


class PromptCache:
    def __init__(self, settings: Settings):
        if not settings.redis_url:
            raise RuntimeError("Redis is not configured (REDIS_URL is empty)")
        self.redis = redis.from_url(settings.redis_url, decode_responses=True)

    # ── helpers ──────────────────────────────────────────────────────

    @staticmethod
    def normalize_prompt(prompt: str) -> str:
        """Normalize a prompt for better cache hit rates.

        Steps:
        1. Lowercase the entire string.
        2. Split on commas into individual tags.
        3. Strip whitespace from each tag.
        4. Remove common quality / boilerplate tags.
        5. Drop empty tags.
        6. Sort remaining tags alphabetically.
        7. Rejoin with ", ".
        """
        lowered = prompt.lower()
        tags = [t.strip() for t in lowered.split(",")]
        tags = [t for t in tags if t and t not in QUALITY_TAGS]
        # Collapse any runs of whitespace within each tag
        tags = [re.sub(r"\s+", " ", t) for t in tags]
        tags.sort()
        return ", ".join(tags)

    @staticmethod
    def make_hash(
        prompt: str,
        model: str,
        width: int,
        height: int,
        steps: int,
        cfg: float,
        seed: int,
    ) -> str | None:
        """Create a deterministic hash from generation parameters.

        Returns ``None`` when the seed is -1 (random), because the same
        prompt with a random seed is expected to produce a different image
        every time and therefore should not be cached.
        """
        if seed == -1:
            return None

        raw = f"{prompt}|{model}|{width}x{height}|s{steps}|cfg{cfg}|seed{seed}"
        return hashlib.sha256(raw.encode()).hexdigest()

    # ── async Redis operations ───────────────────────────────────────

    async def get_cached(self, prompt_hash: str) -> str | None:
        """Look up a cached image URL by prompt hash.

        Returns the URL string if found, otherwise ``None``.
        """
        try:
            value = await self.redis.get(f"{CACHE_KEY_PREFIX}{prompt_hash}")
            if value:
                logger.info("Cache HIT for hash %s", prompt_hash[:12])
            return value
        except Exception as e:
            logger.warning("Cache lookup failed (non-fatal): %s", e)
            return None

    async def store(
        self, prompt_hash: str, image_url: str, ttl: int = 86400
    ) -> None:
        """Store an image URL in the cache with a TTL (default 24 hours)."""
        try:
            await self.redis.set(
                f"{CACHE_KEY_PREFIX}{prompt_hash}", image_url, ex=ttl
            )
            logger.info(
                "Cached result for hash %s (ttl=%ds)", prompt_hash[:12], ttl
            )
        except Exception as e:
            logger.warning("Cache store failed (non-fatal): %s", e)

    async def close(self):
        await self.redis.close()
