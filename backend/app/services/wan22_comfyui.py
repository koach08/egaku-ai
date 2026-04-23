"""Wan 2.2 NSFW Lightning — dedicated ComfyUI backend for high-quality NSFW video.

Uses a separate ComfyUI instance on vast.ai (RTX 3090 24GB) with:
- ComfyUI-GGUF custom node
- Wan 2.2 NSFW FM v2 Lightning GGUF models (Q4KM HIGH+LOW pair)
- UMT5-XXL text encoder
- Wan 2.1 VAE
- CLIP Vision H

This is routed from /adult/generate-video when model_id is wan22_nsfw_*.
"""
import io
import json
import logging
import os
import time
import urllib.parse
import urllib.request
import urllib.error
import uuid
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


WAN22_DEFAULTS = {
    "high_model_t2v": "wan22_nsfw_fm_v2_high_Q4_K_M.gguf",
    "low_model_t2v":  "wan22_nsfw_fm_v2_low_Q4_K_M.gguf",
    "high_model_i2v": "wan22_nsfw_fm_v2_i2v_high_Q4_K_M.gguf",
    "low_model_i2v":  "wan22_nsfw_fm_v2_i2v_low_Q4_K_M.gguf",
    "text_encoder": "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
    "vae": "wan_2.1_vae.safetensors",
    "clip_vision": "clip_vision_h.safetensors",
    "steps": 4,
    "cfg": 1.0,
    "sampler": "euler",
    "scheduler": "simple",
    "shift": 5.0,
    "fps": 16,
    "default_width": 832,
    "default_height": 480,
    "default_frames": 81,  # ~5s @ 16fps
}


class Wan22ComfyUIClient:
    """Direct client for Wan 2.2 ComfyUI on dedicated vast.ai instance."""

    def __init__(self, server_url: str):
        self.server_url = server_url.rstrip("/") if server_url else ""
        self.client_id = str(uuid.uuid4())
        self._headers = {"User-Agent": "EGAKU-AI/1.0"}

    def _request(self, path: str, data: bytes = None, extra_headers: dict = None, timeout: int = 30):
        url = f"{self.server_url}{path}"
        headers = dict(self._headers)
        if extra_headers:
            headers.update(extra_headers)
        req = urllib.request.Request(url, data=data, headers=headers)
        return urllib.request.urlopen(req, timeout=timeout)

    def is_running(self) -> bool:
        if not self.server_url:
            return False
        try:
            self._request("/system_stats", timeout=10)
            return True
        except Exception:
            return False

    def upload_image(self, image_path: str) -> str:
        """Upload image to ComfyUI. Returns the filename to reference in workflow."""
        import mimetypes
        filename = os.path.basename(image_path)
        mime, _ = mimetypes.guess_type(filename)
        mime = mime or "image/png"

        with open(image_path, "rb") as f:
            file_bytes = f.read()

        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
        body = io.BytesIO()
        body.write(f'--{boundary}\r\n'.encode())
        body.write(f'Content-Disposition: form-data; name="image"; filename="{filename}"\r\n'.encode())
        body.write(f'Content-Type: {mime}\r\n\r\n'.encode())
        body.write(file_bytes)
        body.write(f'\r\n--{boundary}--\r\n'.encode())

        resp = self._request(
            "/upload/image",
            data=body.getvalue(),
            extra_headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            timeout=60,
        )
        result = json.loads(resp.read())
        return result.get("name", filename)

    def queue_prompt(self, workflow: dict) -> str:
        data = json.dumps({"prompt": workflow, "client_id": self.client_id}).encode()
        resp = self._request(
            "/prompt",
            data=data,
            extra_headers={"Content-Type": "application/json"},
        )
        return json.loads(resp.read())["prompt_id"]

    def get_history(self, prompt_id: str) -> dict:
        resp = self._request(f"/history/{prompt_id}")
        return json.loads(resp.read())

    def get_file(self, filename: str, subfolder: str = "", folder_type: str = "output") -> bytes:
        params = urllib.parse.urlencode({"filename": filename, "subfolder": subfolder, "type": folder_type})
        resp = self._request(f"/view?{params}", timeout=120)
        return resp.read()

    def wait_for_video(self, prompt_id: str, timeout: int = 1800) -> Optional[bytes]:
        """Wait for workflow to complete and return video bytes (MP4)."""
        start = time.time()
        while time.time() - start < timeout:
            history = self.get_history(prompt_id)
            if prompt_id in history:
                outputs = history[prompt_id].get("outputs", {})
                for node_output in outputs.values():
                    # VHS_VideoCombine outputs "gifs" even for mp4
                    if "gifs" in node_output:
                        for vid in node_output["gifs"]:
                            return self.get_file(
                                vid["filename"],
                                vid.get("subfolder", ""),
                                vid.get("type", "output"),
                            )
                    if "videos" in node_output:
                        for vid in node_output["videos"]:
                            return self.get_file(
                                vid["filename"],
                                vid.get("subfolder", ""),
                                vid.get("type", "output"),
                            )
                # Completed but no video found
                logger.error(f"Wan22: workflow completed but no video output. outputs={list(outputs.keys())}")
                return None
            time.sleep(2)
        raise TimeoutError(f"Wan 2.2 generation did not complete within {timeout}s")


def build_wan22_t2v_workflow(
    prompt: str,
    negative_prompt: str = "",
    width: int = None,
    height: int = None,
    frame_count: int = None,
    seed: int = -1,
) -> dict:
    """Build Wan 2.2 T2V workflow JSON for ComfyUI."""
    import random
    if seed == -1 or seed is None:
        seed = random.randint(0, 2**31 - 1)

    d = WAN22_DEFAULTS
    width = int(width or d["default_width"])
    height = int(height or d["default_height"])
    frame_count = int(frame_count or d["default_frames"])
    # Wan requires 4N+1 frame count
    frame_count = ((frame_count - 1) // 4) * 4 + 1
    frame_count = max(17, min(frame_count, 161))
    half = max(1, d["steps"] // 2)

    return {
        "1": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": d["high_model_t2v"]}},
        "2": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": d["low_model_t2v"]}},
        "3": {"class_type": "CLIPLoader", "inputs": {"clip_name": d["text_encoder"], "type": "wan", "device": "default"}},
        "4": {"class_type": "VAELoader", "inputs": {"vae_name": d["vae"]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["3", 0], "text": prompt}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["3", 0], "text": negative_prompt or ""}},
        "7": {"class_type": "EmptyHunyuanLatentVideo", "inputs": {"width": width, "height": height, "length": frame_count, "batch_size": 1}},
        "8": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["1", 0], "shift": d["shift"]}},
        "9": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["2", 0], "shift": d["shift"]}},
        "10": {
            "class_type": "KSamplerAdvanced",
            "inputs": {
                "model": ["8", 0], "add_noise": "enable", "noise_seed": seed,
                "steps": d["steps"], "cfg": d["cfg"],
                "sampler_name": d["sampler"], "scheduler": d["scheduler"],
                "positive": ["5", 0], "negative": ["6", 0], "latent_image": ["7", 0],
                "start_at_step": 0, "end_at_step": half,
                "return_with_leftover_noise": "enable",
            },
        },
        "11": {
            "class_type": "KSamplerAdvanced",
            "inputs": {
                "model": ["9", 0], "add_noise": "disable", "noise_seed": seed,
                "steps": d["steps"], "cfg": d["cfg"],
                "sampler_name": d["sampler"], "scheduler": d["scheduler"],
                "positive": ["5", 0], "negative": ["6", 0], "latent_image": ["10", 0],
                "start_at_step": half, "end_at_step": d["steps"],
                "return_with_leftover_noise": "disable",
            },
        },
        "12": {"class_type": "VAEDecode", "inputs": {"samples": ["11", 0], "vae": ["4", 0]}},
        "13": {
            "class_type": "VHS_VideoCombine",
            "inputs": {
                "images": ["12", 0], "frame_rate": d["fps"], "loop_count": 0,
                "filename_prefix": "wan22_t2v", "format": "video/h264-mp4",
                "pix_fmt": "yuv420p", "crf": 19, "save_metadata": True,
                "pingpong": False, "save_output": True,
            },
        },
    }


def build_wan22_i2v_workflow(
    prompt: str,
    image_name: str,
    negative_prompt: str = "",
    width: int = None,
    height: int = None,
    frame_count: int = None,
    seed: int = -1,
) -> dict:
    """Build Wan 2.2 I2V workflow JSON for ComfyUI."""
    import random
    if seed == -1 or seed is None:
        seed = random.randint(0, 2**31 - 1)

    d = WAN22_DEFAULTS
    width = int(width or d["default_width"])
    height = int(height or d["default_height"])
    frame_count = int(frame_count or d["default_frames"])
    frame_count = ((frame_count - 1) // 4) * 4 + 1
    frame_count = max(17, min(frame_count, 161))
    half = max(1, d["steps"] // 2)

    return {
        "1": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": d["high_model_i2v"]}},
        "2": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": d["low_model_i2v"]}},
        "3": {"class_type": "CLIPLoader", "inputs": {"clip_name": d["text_encoder"], "type": "wan", "device": "default"}},
        "4": {"class_type": "VAELoader", "inputs": {"vae_name": d["vae"]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["3", 0], "text": prompt}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["3", 0], "text": negative_prompt or ""}},
        "7": {"class_type": "LoadImage", "inputs": {"image": image_name}},
        "8": {"class_type": "CLIPVisionLoader", "inputs": {"clip_name": d["clip_vision"]}},
        "9": {"class_type": "CLIPVisionEncode", "inputs": {"clip_vision": ["8", 0], "image": ["7", 0], "crop": "none"}},
        "10": {
            "class_type": "WanImageToVideo",
            "inputs": {
                "positive": ["5", 0], "negative": ["6", 0], "vae": ["4", 0],
                "clip_vision_output": ["9", 0], "start_image": ["7", 0],
                "width": width, "height": height, "length": frame_count, "batch_size": 1,
            },
        },
        "11": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["1", 0], "shift": d["shift"]}},
        "12": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["2", 0], "shift": d["shift"]}},
        "13": {
            "class_type": "KSamplerAdvanced",
            "inputs": {
                "model": ["11", 0], "add_noise": "enable", "noise_seed": seed,
                "steps": d["steps"], "cfg": d["cfg"],
                "sampler_name": d["sampler"], "scheduler": d["scheduler"],
                "positive": ["10", 0], "negative": ["10", 1], "latent_image": ["10", 2],
                "start_at_step": 0, "end_at_step": half,
                "return_with_leftover_noise": "enable",
            },
        },
        "14": {
            "class_type": "KSamplerAdvanced",
            "inputs": {
                "model": ["12", 0], "add_noise": "disable", "noise_seed": seed,
                "steps": d["steps"], "cfg": d["cfg"],
                "sampler_name": d["sampler"], "scheduler": d["scheduler"],
                "positive": ["10", 0], "negative": ["10", 1], "latent_image": ["13", 0],
                "start_at_step": half, "end_at_step": d["steps"],
                "return_with_leftover_noise": "disable",
            },
        },
        "15": {"class_type": "VAEDecode", "inputs": {"samples": ["14", 0], "vae": ["4", 0]}},
        "16": {
            "class_type": "VHS_VideoCombine",
            "inputs": {
                "images": ["15", 0], "frame_rate": d["fps"], "loop_count": 0,
                "filename_prefix": "wan22_i2v", "format": "video/h264-mp4",
                "pix_fmt": "yuv420p", "crf": 19, "save_metadata": True,
                "pingpong": False, "save_output": True,
            },
        },
    }


def generate_wan22_t2v(
    comfyui_url: str,
    prompt: str,
    negative_prompt: str = "",
    duration: int = 5,
    width: int = None,
    height: int = None,
    seed: int = -1,
) -> bytes:
    """Generate Wan 2.2 T2V video. Returns raw MP4 bytes.

    Raises if the Wan 2.2 backend is unreachable or generation fails.
    """
    client = Wan22ComfyUIClient(comfyui_url)
    if not client.is_running():
        raise RuntimeError(f"Wan 2.2 backend unreachable: {comfyui_url}")

    frame_count = int(duration * WAN22_DEFAULTS["fps"])
    workflow = build_wan22_t2v_workflow(
        prompt=prompt,
        negative_prompt=negative_prompt,
        width=width,
        height=height,
        frame_count=frame_count,
        seed=seed,
    )

    prompt_id = client.queue_prompt(workflow)
    logger.info(f"Wan22 T2V queued: {prompt_id} (duration={duration}s, {frame_count}f)")
    video_bytes = client.wait_for_video(prompt_id, timeout=1800)
    if not video_bytes:
        raise RuntimeError("Wan 2.2 T2V did not return a video output")
    return video_bytes


def generate_wan22_i2v(
    comfyui_url: str,
    image_path: str,
    prompt: str = "",
    negative_prompt: str = "",
    duration: int = 5,
    width: int = None,
    height: int = None,
    seed: int = -1,
) -> bytes:
    """Generate Wan 2.2 I2V video from local image path. Returns MP4 bytes."""
    client = Wan22ComfyUIClient(comfyui_url)
    if not client.is_running():
        raise RuntimeError(f"Wan 2.2 backend unreachable: {comfyui_url}")

    image_name = client.upload_image(image_path)
    frame_count = int(duration * WAN22_DEFAULTS["fps"])
    workflow = build_wan22_i2v_workflow(
        prompt=prompt or "natural movement",
        image_name=image_name,
        negative_prompt=negative_prompt,
        width=width,
        height=height,
        frame_count=frame_count,
        seed=seed,
    )

    prompt_id = client.queue_prompt(workflow)
    logger.info(f"Wan22 I2V queued: {prompt_id} (duration={duration}s, {frame_count}f)")
    video_bytes = client.wait_for_video(prompt_id, timeout=1800)
    if not video_bytes:
        raise RuntimeError("Wan 2.2 I2V did not return a video output")
    return video_bytes
