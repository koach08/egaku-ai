"""vast.ai GPU backend - ComfyUI instance management for NSFW generation.

Flow:
1. On first request or when no instance running: find cheapest GPU, create instance with ComfyUI
2. Wait for instance to be ready (ComfyUI API accessible)
3. Submit generation workflow to ComfyUI API
4. Poll for result, download image
5. Instance auto-destroyed after idle timeout (cost control)

The instance runs ComfyUI with NSFW-friendly models pre-loaded.
"""

import asyncio
import json
import logging
import time
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)

VASTAI_API_BASE = "https://console.vast.ai/api/v0"

# ComfyUI Docker template for vast.ai
COMFYUI_IMAGE = "ai-dock/comfyui:latest"

# Minimum GPU spec for SDXL/Flux
MIN_GPU_RAM_MB = 12000  # 12GB VRAM minimum


@dataclass
class VastInstance:
    instance_id: int
    ip: str
    port: int  # ComfyUI API port (usually 8188)
    gpu_name: str
    cost_per_hour: float
    created_at: float


class VastAIClient:
    """Manages vast.ai GPU instances running ComfyUI."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {"Authorization": f"Bearer {api_key}"}
        self._instance: VastInstance | None = None
        self._last_used: float = 0

    def is_available(self) -> bool:
        return bool(self.api_key)

    async def _api_get(self, path: str, params: dict | None = None) -> dict:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(
                f"{VASTAI_API_BASE}{path}",
                headers=self.headers,
                params=params,
            )
            resp.raise_for_status()
            return resp.json()

    async def _api_put(self, path: str, data: dict) -> dict:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.put(
                f"{VASTAI_API_BASE}{path}",
                headers=self.headers,
                json=data,
            )
            resp.raise_for_status()
            return resp.json()

    async def _api_post(self, path: str, data: dict) -> dict:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.post(
                f"{VASTAI_API_BASE}{path}",
                headers=self.headers,
                json=data,
            )
            resp.raise_for_status()
            return resp.json()

    async def _api_delete(self, path: str) -> dict:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.delete(
                f"{VASTAI_API_BASE}{path}",
                headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json()

    async def find_cheapest_gpu(self) -> dict | None:
        """Find cheapest available GPU with enough VRAM for SDXL."""
        try:
            query = {
                "gpu_ram": {"gte": MIN_GPU_RAM_MB},
                "rentable": {"eq": True},
                "cuda_max_good": {"gte": 12.0},
                "order": [["dph_total", "asc"]],
                "limit": 10,
                "type": "bid",
            }
            data = await self._api_get("/bundles/", params={"q": json.dumps(query)})
            offers = data.get("offers", [])
            if not offers:
                return None
            # Prefer RTX 3090/4090 for speed, but take cheapest if available
            for offer in offers:
                gpu = offer.get("gpu_name", "")
                if any(g in gpu for g in ["4090", "3090", "A100", "A6000", "RTX 6000"]):
                    return offer
            return offers[0]
        except Exception as e:
            logger.error(f"vast.ai search failed: {e}")
            return None

    async def get_running_instances(self) -> list[dict]:
        """Get currently running instances."""
        try:
            data = await self._api_get("/instances/")
            return data.get("instances", [])
        except Exception as e:
            logger.error(f"Failed to get instances: {e}")
            return []

    async def create_instance(self, offer_id: int) -> int | None:
        """Create a ComfyUI instance on the given offer."""
        try:
            data = await self._api_put(f"/asks/{offer_id}/", {
                "image": COMFYUI_IMAGE,
                "disk": 20,  # 20GB disk for models
                "onstart": (
                    "#!/bin/bash\n"
                    "# Download NSFW-friendly models on start\n"
                    "cd /opt/ComfyUI/models/checkpoints/ 2>/dev/null || true\n"
                    "echo 'ComfyUI instance ready'\n"
                ),
                "env": {
                    "JUPYTER_PASSWORD": "",
                    "CF_TUNNEL_TOKEN": "",
                },
                "extra_env": {},
            })
            instance_id = data.get("new_contract")
            if instance_id:
                logger.info(f"vast.ai instance created: {instance_id}")
                return instance_id
        except Exception as e:
            logger.error(f"Failed to create instance: {e}")
        return None

    async def destroy_instance(self, instance_id: int) -> bool:
        """Destroy an instance to stop costs."""
        try:
            await self._api_delete(f"/instances/{instance_id}/")
            logger.info(f"vast.ai instance destroyed: {instance_id}")
            self._instance = None
            return True
        except Exception as e:
            logger.error(f"Failed to destroy instance: {e}")
            return False

    async def get_instance_info(self, instance_id: int) -> dict | None:
        """Get instance status and connection info."""
        try:
            instances = await self.get_running_instances()
            for inst in instances:
                if inst.get("id") == instance_id:
                    return inst
        except Exception:
            pass
        return None

    async def wait_for_ready(self, instance_id: int, timeout: int = 300) -> VastInstance | None:
        """Wait for instance to be running and ComfyUI to be accessible."""
        start = time.time()
        while time.time() - start < timeout:
            info = await self.get_instance_info(instance_id)
            if not info:
                await asyncio.sleep(5)
                continue

            status = info.get("actual_status", "")
            if status == "running":
                # Get connection details
                ip = info.get("public_ipaddr", "")
                ports = info.get("ports", {})
                # ComfyUI runs on 8188
                comfy_port_info = ports.get("8188/tcp", [{}])
                if isinstance(comfy_port_info, list) and comfy_port_info:
                    port = comfy_port_info[0].get("HostPort", 8188)
                else:
                    port = 8188

                instance = VastInstance(
                    instance_id=instance_id,
                    ip=ip,
                    port=int(port),
                    gpu_name=info.get("gpu_name", "unknown"),
                    cost_per_hour=info.get("dph_total", 0),
                    created_at=time.time(),
                )

                # Verify ComfyUI is responding
                try:
                    async with httpx.AsyncClient(timeout=5) as client:
                        resp = await client.get(f"http://{ip}:{port}/system_stats")
                        if resp.status_code == 200:
                            self._instance = instance
                            self._last_used = time.time()
                            logger.info(f"vast.ai ComfyUI ready: {ip}:{port} ({instance.gpu_name})")
                            return instance
                except Exception:
                    pass  # ComfyUI not ready yet

            await asyncio.sleep(10)

        logger.error(f"Instance {instance_id} did not become ready within {timeout}s")
        return None

    async def ensure_instance(self) -> VastInstance | None:
        """Get or create a running ComfyUI instance."""
        # Check if we have a cached running instance
        if self._instance:
            info = await self.get_instance_info(self._instance.instance_id)
            if info and info.get("actual_status") == "running":
                self._last_used = time.time()
                return self._instance
            self._instance = None

        # Check for any existing running instances
        instances = await self.get_running_instances()
        for inst in instances:
            if inst.get("actual_status") == "running":
                ip = inst.get("public_ipaddr", "")
                ports = inst.get("ports", {})
                comfy_port_info = ports.get("8188/tcp", [{}])
                port = 8188
                if isinstance(comfy_port_info, list) and comfy_port_info:
                    port = int(comfy_port_info[0].get("HostPort", 8188))

                try:
                    async with httpx.AsyncClient(timeout=5) as client:
                        resp = await client.get(f"http://{ip}:{port}/system_stats")
                        if resp.status_code == 200:
                            self._instance = VastInstance(
                                instance_id=inst["id"],
                                ip=ip,
                                port=port,
                                gpu_name=inst.get("gpu_name", ""),
                                cost_per_hour=inst.get("dph_total", 0),
                                created_at=time.time(),
                            )
                            self._last_used = time.time()
                            return self._instance
                except Exception:
                    continue

        # No running instance - create one
        offer = await self.find_cheapest_gpu()
        if not offer:
            logger.error("No GPU offers available on vast.ai")
            return None

        instance_id = await self.create_instance(offer["id"])
        if not instance_id:
            return None

        return await self.wait_for_ready(instance_id)

    async def submit_comfyui_workflow(
        self,
        prompt: str,
        negative_prompt: str = "",
        width: int = 768,
        height: int = 1024,
        steps: int = 25,
        cfg: float = 7.0,
        seed: int = -1,
        model: str = "flux1-dev.safetensors",
    ) -> str | None:
        """Submit a txt2img workflow to ComfyUI and return the image URL."""
        instance = await self.ensure_instance()
        if not instance:
            return None

        comfyui_url = f"http://{instance.ip}:{instance.port}"

        if seed == -1:
            import random
            seed = random.randint(0, 2**32 - 1)

        # ComfyUI API workflow for txt2img
        workflow = {
            "3": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": seed,
                    "steps": steps,
                    "cfg": cfg,
                    "sampler_name": "euler_ancestral",
                    "scheduler": "normal",
                    "denoise": 1.0,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0],
                },
            },
            "4": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {"ckpt_name": model},
            },
            "5": {
                "class_type": "EmptyLatentImage",
                "inputs": {"width": width, "height": height, "batch_size": 1},
            },
            "6": {
                "class_type": "CLIPTextEncode",
                "inputs": {"text": prompt, "clip": ["4", 1]},
            },
            "7": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": negative_prompt or "worst quality, low quality",
                    "clip": ["4", 1],
                },
            },
            "8": {
                "class_type": "VAEDecode",
                "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
            },
            "9": {
                "class_type": "SaveImage",
                "inputs": {"filename_prefix": "egaku", "images": ["8", 0]},
            },
        }

        try:
            async with httpx.AsyncClient(timeout=300, follow_redirects=True) as client:
                # Queue the prompt
                resp = await client.post(
                    f"{comfyui_url}/prompt",
                    json={"prompt": workflow},
                )
                if resp.status_code != 200:
                    logger.error(f"ComfyUI prompt failed: {resp.text}")
                    return None

                result = resp.json()
                prompt_id = result.get("prompt_id")
                if not prompt_id:
                    return None

                # Poll for completion
                for _ in range(120):  # 10 min max
                    await asyncio.sleep(5)
                    history_resp = await client.get(f"{comfyui_url}/history/{prompt_id}")
                    if history_resp.status_code != 200:
                        continue

                    history = history_resp.json()
                    if prompt_id in history:
                        outputs = history[prompt_id].get("outputs", {})
                        # Find the SaveImage node output
                        for node_id, node_output in outputs.items():
                            images = node_output.get("images", [])
                            if images:
                                img = images[0]
                                filename = img.get("filename", "")
                                subfolder = img.get("subfolder", "")
                                # Download the image
                                img_resp = await client.get(
                                    f"{comfyui_url}/view",
                                    params={
                                        "filename": filename,
                                        "subfolder": subfolder,
                                        "type": "output",
                                    },
                                )
                                if img_resp.status_code == 200:
                                    # Upload to temp storage and return URL
                                    # For now, return base64
                                    import base64
                                    b64 = base64.b64encode(img_resp.content).decode()
                                    self._last_used = time.time()
                                    return f"data:image/png;base64,{b64}"

                logger.error(f"ComfyUI generation timed out for prompt {prompt_id}")

        except Exception as e:
            logger.error(f"ComfyUI generation failed: {e}")

        return None

    async def submit_img2vid_workflow(
        self,
        image_b64: str,
        prompt: str,
        negative_prompt: str = "",
        model: str = "realvisxlV50.safetensors",
        width: int = 512,
        height: int = 512,
        steps: int = 20,
        cfg: float = 7.0,
        seed: int = -1,
        frame_count: int = 16,
        fps: int = 8,
        denoise: float = 0.65,
    ) -> str | None:
        """Submit AnimateDiff img2vid workflow to vast.ai ComfyUI.

        Uploads the image, then runs AnimateDiff with it as initial latent.
        Returns video URL/data or None.
        """
        instance = await self.ensure_instance()
        if not instance:
            return None

        comfyui_url = f"http://{instance.ip}:{instance.port}"

        if seed == -1:
            import random
            seed = random.randint(0, 2**32 - 1)

        try:
            async with httpx.AsyncClient(timeout=600, follow_redirects=True) as client:
                # Upload image
                import io
                import base64
                img_bytes = base64.b64decode(image_b64)
                files = {"image": ("input_img2vid.png", io.BytesIO(img_bytes), "image/png")}
                upload_resp = await client.post(
                    f"{comfyui_url}/upload/image",
                    files=files,
                    data={"overwrite": "true"},
                )
                if upload_resp.status_code != 200:
                    logger.error(f"Image upload failed: {upload_resp.text}")
                    return None
                uploaded_name = upload_resp.json().get("name", "input_img2vid.png")

                # AnimateDiff img2vid workflow
                workflow = {
                    "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": model}},
                    "20": {
                        "class_type": "ADE_AnimateDiffLoaderWithContext",
                        "inputs": {
                            "model": ["4", 0],
                            "model_name": "mm_sd_v15_v2.ckpt",
                            "beta_schedule": "sqrt_linear (AnimateDiff)",
                            "context_options": ["21", 0],
                        },
                    },
                    "21": {
                        "class_type": "ADE_StandardStaticContextOptions",
                        "inputs": {"context_length": 16, "context_overlap": 4},
                    },
                    "25": {"class_type": "LoadImage", "inputs": {"image": uploaded_name}},
                    "26": {
                        "class_type": "VAEEncode",
                        "inputs": {"pixels": ["25", 0], "vae": ["4", 2]},
                    },
                    "27": {
                        "class_type": "RepeatLatentBatch",
                        "inputs": {"samples": ["26", 0], "amount": frame_count},
                    },
                    "6": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["4", 1]}},
                    "7": {
                        "class_type": "CLIPTextEncode",
                        "inputs": {"text": negative_prompt or "worst quality, low quality", "clip": ["4", 1]},
                    },
                    "3": {
                        "class_type": "KSampler",
                        "inputs": {
                            "seed": seed, "steps": steps, "cfg": cfg,
                            "sampler_name": "euler_ancestral", "scheduler": "normal",
                            "denoise": denoise,
                            "model": ["20", 0],
                            "positive": ["6", 0], "negative": ["7", 0],
                            "latent_image": ["27", 0],
                        },
                    },
                    "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
                    "30": {
                        "class_type": "VHS_VideoCombine",
                        "inputs": {
                            "images": ["8", 0], "frame_rate": fps, "loop_count": 0,
                            "filename_prefix": "img2vid", "format": "video/h264-mp4",
                            "pingpong": False, "save_output": True,
                        },
                    },
                }

                # Submit
                resp = await client.post(f"{comfyui_url}/prompt", json={"prompt": workflow})
                if resp.status_code != 200:
                    logger.error(f"ComfyUI img2vid prompt failed: {resp.text}")
                    return None

                prompt_id = resp.json().get("prompt_id")
                if not prompt_id:
                    return None

                logger.info(f"ComfyUI img2vid submitted: {prompt_id}")

                # Poll for completion
                for i in range(120):
                    await asyncio.sleep(5)
                    history_resp = await client.get(f"{comfyui_url}/history/{prompt_id}")
                    if history_resp.status_code != 200:
                        continue
                    history = history_resp.json()
                    if prompt_id in history:
                        outputs = history[prompt_id].get("outputs", {})
                        for node_id, node_output in outputs.items():
                            # VHS_VideoCombine outputs gifs/videos
                            gifs = node_output.get("gifs", [])
                            if gifs:
                                vid = gifs[0]
                                filename = vid.get("filename", "")
                                subfolder = vid.get("subfolder", "")
                                vid_resp = await client.get(
                                    f"{comfyui_url}/view",
                                    params={"filename": filename, "subfolder": subfolder, "type": "output"},
                                )
                                if vid_resp.status_code == 200:
                                    b64 = base64.b64encode(vid_resp.content).decode()
                                    self._last_used = time.time()
                                    return f"data:video/mp4;base64,{b64}"
                        # Check image outputs as fallback
                        for node_id, node_output in outputs.items():
                            images = node_output.get("images", [])
                            if images:
                                logger.info(f"ComfyUI img2vid completed (frames): {prompt_id}")
                                self._last_used = time.time()
                                return "frames_generated"

                logger.error(f"ComfyUI img2vid timed out: {prompt_id}")

        except Exception as e:
            logger.error(f"ComfyUI img2vid failed: {e}")

        return None

    async def cleanup_idle(self, idle_minutes: int = 30):
        """Destroy instances idle for too long (cost control)."""
        if not self._instance:
            return
        if time.time() - self._last_used > idle_minutes * 60:
            logger.info(f"Destroying idle instance {self._instance.instance_id}")
            await self.destroy_instance(self._instance.instance_id)
