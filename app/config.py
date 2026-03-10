"""AI-diffusion Studio Configuration"""
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_FILE = os.path.join(BASE_DIR, "app", "settings.json")

DEFAULT_CONFIG = {
    "comfyui_url": "http://127.0.0.1:8188",
    "backend": "local",
    "runpod_api_key": "",
    "runpod_pod_id": "",
    "runpod_comfyui_url": "",
    "civitai_api_key": "",
    "anthropic_api_key": "",
    "openai_api_key": "",
    "xai_api_key": "",
    "models_dir": os.path.join(BASE_DIR, "models"),
    "output_dir_normal": os.path.join(BASE_DIR, "outputs", "normal"),
    "output_dir_adult": os.path.join(BASE_DIR, "outputs", "adult"),
    "google_drive_models_dir": "",
    "default_model_normal": "",
    "default_model_adult": "",
    "default_negative_prompt": "worst quality, low quality, blurry, deformed, ugly, bad anatomy, bad hands, extra fingers, missing fingers",
    "default_steps": 25,
    "default_cfg": 7.0,
    "default_width": 512,
    "default_height": 768,
    "default_sampler": "euler_ancestral",
    "default_scheduler": "normal",
}

SAMPLERS = [
    "euler", "euler_ancestral", "heun", "heunpp2", "dpm_2", "dpm_2_ancestral",
    "lms", "dpm_fast", "dpm_adaptive", "dpmpp_2s_ancestral", "dpmpp_sde",
    "dpmpp_sde_gpu", "dpmpp_2m", "dpmpp_2m_sde", "dpmpp_2m_sde_gpu",
    "dpmpp_3m_sde", "dpmpp_3m_sde_gpu", "ddpm", "lcm", "ddim", "uni_pc",
    "uni_pc_bh2",
]

SCHEDULERS = ["normal", "karras", "exponential", "sgm_uniform", "simple", "ddim_uniform", "beta"]


def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            saved = json.load(f)
        config = {**DEFAULT_CONFIG, **saved}
    else:
        config = DEFAULT_CONFIG.copy()
    os.makedirs(config["output_dir_normal"], exist_ok=True)
    os.makedirs(config["output_dir_adult"], exist_ok=True)
    return config


def save_config(config):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


def get_available_models(models_dir):
    """Scan checkpoints directory for available models."""
    ckpt_dir = os.path.join(models_dir, "checkpoints")
    if not os.path.exists(ckpt_dir):
        return []
    exts = (".safetensors", ".ckpt", ".pt")
    return sorted([f for f in os.listdir(ckpt_dir) if f.lower().endswith(exts)])


def get_available_loras(models_dir):
    """Scan loras directory."""
    lora_dir = os.path.join(models_dir, "loras")
    if not os.path.exists(lora_dir):
        return []
    exts = (".safetensors", ".ckpt", ".pt")
    return sorted([f for f in os.listdir(lora_dir) if f.lower().endswith(exts)])


def get_available_vaes(models_dir):
    """Scan VAE directory."""
    vae_dir = os.path.join(models_dir, "vae")
    if not os.path.exists(vae_dir):
        return []
    exts = (".safetensors", ".ckpt", ".pt")
    return sorted([f for f in os.listdir(vae_dir) if f.lower().endswith(exts)])


def get_available_motion_models():
    """Scan AnimateDiff motion models from the custom node's models directory."""
    paths = [
        os.path.join(BASE_DIR, "comfyui", "custom_nodes", "ComfyUI-AnimateDiff-Evolved", "models"),
        os.path.join(BASE_DIR, "models", "animatediff_models"),
    ]
    exts = (".ckpt", ".safetensors", ".pt", ".pth")
    models = []
    for p in paths:
        if os.path.isdir(p):
            models.extend([f for f in os.listdir(p) if f.lower().endswith(exts)])
    return sorted(set(models))
