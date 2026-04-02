"""Text-to-Speech service — Chatterbox (primary) + Kokoro (fallback) + OpenAI TTS.

Architecture:
- Chatterbox Multilingual: Self-hosted on vast.ai (23 languages, voice cloning)
- Kokoro: Lightweight CPU fallback (EN + JP, 82M params)
- OpenAI TTS: Cloud fallback (already have API key)
"""

import io
import logging
from typing import Optional

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)

# Available voices per engine
KOKORO_VOICES = {
    "en": [
        {"id": "af_heart", "name": "Heart (Female)", "gender": "female"},
        {"id": "af_bella", "name": "Bella (Female)", "gender": "female"},
        {"id": "af_sarah", "name": "Sarah (Female)", "gender": "female"},
        {"id": "af_nova", "name": "Nova (Female)", "gender": "female"},
        {"id": "am_adam", "name": "Adam (Male)", "gender": "male"},
        {"id": "am_michael", "name": "Michael (Male)", "gender": "male"},
    ],
    "ja": [
        {"id": "jf_alpha", "name": "Alpha (Female)", "gender": "female"},
        {"id": "jf_gongitsune", "name": "Gongitsune (Female)", "gender": "female"},
        {"id": "jf_nezumi", "name": "Nezumi (Female)", "gender": "female"},
        {"id": "jm_kumo", "name": "Kumo (Male)", "gender": "male"},
    ],
}

OPENAI_VOICES = [
    {"id": "alloy", "name": "Alloy", "gender": "neutral"},
    {"id": "echo", "name": "Echo", "gender": "male"},
    {"id": "fable", "name": "Fable", "gender": "neutral"},
    {"id": "onyx", "name": "Onyx", "gender": "male"},
    {"id": "nova", "name": "Nova", "gender": "female"},
    {"id": "shimmer", "name": "Shimmer", "gender": "female"},
]

CHATTERBOX_LANGUAGES = [
    "ar", "da", "de", "el", "en", "es", "fi", "fr", "he", "hi",
    "it", "ja", "ko", "ms", "nl", "no", "pl", "pt", "ru", "sv",
    "sw", "tr", "zh",
]

# Credit costs per TTS engine
TTS_CREDIT_COSTS = {
    "chatterbox": 2,
    "kokoro": 1,
    "openai": 3,
    "openai_hd": 5,
}


class TTSService:
    """Unified TTS service with multiple engine fallback."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.openai_api_key = settings.openai_api_key
        self.vastai_comfyui_url = settings.vastai_comfyui_url

    async def synthesize(
        self,
        text: str,
        language: str = "en",
        engine: str = "auto",
        voice_id: Optional[str] = None,
        reference_audio_b64: Optional[str] = None,
    ) -> tuple[bytes, str, str]:
        """Generate speech from text.

        Returns: (audio_bytes, content_type, engine_used)
        """
        if not text.strip():
            raise ValueError("Text cannot be empty")

        if len(text) > 5000:
            raise ValueError("Text exceeds 5000 character limit")

        # Engine selection
        if engine == "auto":
            if reference_audio_b64:
                engine = "chatterbox"  # Only Chatterbox supports voice cloning
            elif self.openai_api_key:
                engine = "openai"
            else:
                engine = "kokoro"

        if engine == "chatterbox":
            result = await self._chatterbox_tts(text, language, voice_id, reference_audio_b64)
            if result:
                return result
            # Fallback
            engine = "openai" if self.openai_api_key else "kokoro"

        if engine in ("openai", "openai_hd"):
            result = await self._openai_tts(text, voice_id or "nova", engine == "openai_hd")
            if result:
                return result
            engine = "kokoro"

        if engine == "kokoro":
            result = await self._kokoro_tts(text, language, voice_id)
            if result:
                return result

        raise RuntimeError("All TTS engines failed")

    async def _openai_tts(
        self, text: str, voice: str = "nova", hd: bool = False,
    ) -> Optional[tuple[bytes, str, str]]:
        """OpenAI TTS via API (cloud, paid)."""
        if not self.openai_api_key:
            return None
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/audio/speech",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "tts-1-hd" if hd else "tts-1",
                        "input": text,
                        "voice": voice,
                        "response_format": "mp3",
                    },
                )
                if resp.status_code == 200:
                    engine_name = "openai_hd" if hd else "openai"
                    return (resp.content, "audio/mpeg", engine_name)
                logger.warning("OpenAI TTS failed: %s %s", resp.status_code, resp.text[:200])
        except Exception as e:
            logger.warning("OpenAI TTS error: %s", e)
        return None

    async def _chatterbox_tts(
        self,
        text: str,
        language: str = "en",
        voice_id: Optional[str] = None,
        reference_audio_b64: Optional[str] = None,
    ) -> Optional[tuple[bytes, str, str]]:
        """Chatterbox TTS via vast.ai ComfyUI server (self-hosted).

        Expects a Chatterbox TTS API running alongside ComfyUI on vast.ai,
        accessible at VASTAI_COMFYUI_URL (port 8880).
        """
        if not self.vastai_comfyui_url:
            return None

        # Derive TTS server URL from ComfyUI URL (same host, port 8880)
        base = self.vastai_comfyui_url.rstrip("/")
        # Replace port if present, otherwise append
        if ":8188" in base:
            tts_url = base.replace(":8188", ":8880")
        else:
            tts_url = base + ":8880"

        try:
            payload = {
                "text": text,
                "language_id": language if language in CHATTERBOX_LANGUAGES else "en",
            }
            if reference_audio_b64:
                payload["reference_audio"] = reference_audio_b64
            if voice_id:
                payload["voice_id"] = voice_id

            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(f"{tts_url}/api/tts", json=payload)
                if resp.status_code == 200:
                    return (resp.content, "audio/wav", "chatterbox")
                logger.warning("Chatterbox TTS failed: %s", resp.status_code)
        except Exception as e:
            logger.warning("Chatterbox TTS error: %s", e)
        return None

    async def _kokoro_tts(
        self,
        text: str,
        language: str = "en",
        voice_id: Optional[str] = None,
    ) -> Optional[tuple[bytes, str, str]]:
        """Kokoro TTS — lightweight, can run on CPU.

        If a Kokoro-FastAPI server is running on vast.ai (port 8881),
        use it. Otherwise fall back to OpenAI.
        """
        if not self.vastai_comfyui_url:
            return None

        base = self.vastai_comfyui_url.rstrip("/")
        if ":8188" in base:
            kokoro_url = base.replace(":8188", ":8881")
        else:
            kokoro_url = base + ":8881"

        lang_code_map = {"en": "a", "ja": "j", "zh": "z", "es": "e", "fr": "f"}
        default_voices = {"en": "af_heart", "ja": "jf_alpha"}

        try:
            payload = {
                "text": text,
                "voice": voice_id or default_voices.get(language, "af_heart"),
                "lang_code": lang_code_map.get(language, "a"),
            }
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(f"{kokoro_url}/api/tts", json=payload)
                if resp.status_code == 200:
                    return (resp.content, "audio/wav", "kokoro")
                logger.warning("Kokoro TTS failed: %s", resp.status_code)
        except Exception as e:
            logger.warning("Kokoro TTS error: %s", e)
        return None

    def get_voices(self) -> dict:
        """Return available voices grouped by engine."""
        voices: dict = {}

        voices["openai"] = {
            "available": bool(self.openai_api_key),
            "voices": OPENAI_VOICES,
            "languages": ["auto"],
            "credits": TTS_CREDIT_COSTS["openai"],
        }

        voices["chatterbox"] = {
            "available": bool(self.vastai_comfyui_url),
            "voices": [{"id": "default", "name": "Default", "gender": "neutral"}],
            "languages": CHATTERBOX_LANGUAGES,
            "features": ["voice_cloning", "emotion_control"],
            "credits": TTS_CREDIT_COSTS["chatterbox"],
        }

        voices["kokoro"] = {
            "available": bool(self.vastai_comfyui_url),
            "voices": KOKORO_VOICES,
            "languages": list(KOKORO_VOICES.keys()),
            "credits": TTS_CREDIT_COSTS["kokoro"],
        }

        return voices
