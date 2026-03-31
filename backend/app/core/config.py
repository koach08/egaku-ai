"""EGAKU AI - Backend configuration from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str = "EGAKU AI"
    debug: bool = False
    api_prefix: str = "/api"
    cors_origins: list[str] = ["http://localhost:3000"]

    # Deployment mode: "cloud" (SaaS) or "local" (self-hosted)
    mode: str = "cloud"

    # Supabase (cloud mode)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # Local mode settings
    local_comfyui_url: str = "http://127.0.0.1:8188"
    local_output_dir: str = "./outputs"
    local_models_dir: str = "./models"
    license_key: str = ""

    # RunPod (cloud mode)
    runpod_api_key: str = ""
    runpod_endpoint_id: str = ""  # Image generation (Flux)
    runpod_video_endpoint_id: str = ""  # Video generation (AnimateDiff)

    # Replicate (fallback when RunPod unavailable)
    replicate_api_token: str = ""

    # fal.ai
    fal_api_key: str = ""

    # Novita.ai (CivitAI checkpoint support, NSFW-friendly)
    novita_api_key: str = ""

    # CivitAI (optional - for gated model downloads)
    civitai_api_key: str = ""

    # vast.ai (GPU backend for adult/NSFW generation — AnimateDiff, no content filter)
    vastai_api_key: str = ""
    vastai_comfyui_url: str = ""  # e.g. "http://38.64.28.7:8188"

    # NOWPayments (crypto payments for adult subscriptions)
    nowpayments_api_key: str = ""
    nowpayments_ipn_secret: str = ""

    # CCBill — rejected (Japan business). Adult payments use crypto only.

    # Cloudflare R2 (cloud mode)
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "ai-studio"
    r2_public_url: str = ""

    # Redis (cloud mode)
    redis_url: str = ""

    # Stripe (cloud mode)
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # OpenAI (prompt assistant chat)
    openai_api_key: str = ""

    # GeoIP
    geoip_db_path: str = "GeoLite2-Country.mmdb"

    # Generation defaults
    default_negative_prompt: str = (
        "worst quality, low quality, blurry, deformed, ugly, "
        "bad anatomy, bad hands, extra fingers, missing fingers"
    )
    max_queue_size: int = 100
    generation_timeout: int = 300

    @property
    def is_local(self) -> bool:
        return self.mode == "local"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    def __hash__(self):
        return hash(id(self))


@lru_cache
def get_settings() -> Settings:
    return Settings()
