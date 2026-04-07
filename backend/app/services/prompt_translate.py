"""Auto-translate non-English prompts to English for image generation models.

Detects if a prompt contains non-ASCII characters and translates via GPT-4.1-mini.
This enables users to write prompts in Japanese, Chinese, Korean, Spanish, etc.
"""

import logging
import re

import httpx

logger = logging.getLogger(__name__)

# Quick heuristic: if >30% of characters are non-ASCII, it's likely non-English
def _is_non_english(text: str) -> bool:
    if not text:
        return False
    non_ascii = sum(1 for c in text if ord(c) > 127)
    return non_ascii / len(text) > 0.3


TRANSLATE_SYSTEM = (
    "You are a translator for AI image generation. "
    "Translate the user's prompt to English. "
    "Keep all artistic/technical terms. "
    "Output ONLY the translated prompt, nothing else. "
    "If already in English, return it unchanged."
)


async def auto_translate_prompt(prompt: str, openai_api_key: str | None) -> str:
    """Translate non-English prompt to English. Returns original if already English."""
    if not prompt or not openai_api_key:
        return prompt

    if not _is_non_english(prompt):
        return prompt

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4.1-mini",
                    "messages": [
                        {"role": "system", "content": TRANSLATE_SYSTEM},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 500,
                    "temperature": 0.3,
                },
            )
            resp.raise_for_status()
            translated = resp.json()["choices"][0]["message"]["content"].strip()
            logger.info(f"Prompt translated: '{prompt[:40]}' → '{translated[:40]}'")
            return translated
    except Exception as e:
        logger.warning(f"Translation failed, using original: {e}")
        return prompt
