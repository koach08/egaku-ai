"""Local ComfyUI direct connection for self-hosted mode."""

import io
import json
import os
import time
import urllib.parse
import urllib.request
import urllib.error
import uuid
from datetime import datetime
from pathlib import Path


class LocalComfyUIClient:
    """Connects directly to a local ComfyUI instance (no RunPod)."""

    def __init__(self, server_url: str = "http://127.0.0.1:8188"):
        self.server_url = server_url.rstrip("/")
        self.client_id = str(uuid.uuid4())

    def is_running(self) -> bool:
        try:
            urllib.request.urlopen(f"{self.server_url}/system_stats", timeout=3)
            return True
        except (urllib.error.URLError, TimeoutError):
            return False

    def queue_prompt(self, workflow: dict) -> str:
        data = json.dumps({"prompt": workflow, "client_id": self.client_id}).encode()
        req = urllib.request.Request(
            f"{self.server_url}/prompt",
            data=data,
            headers={"Content-Type": "application/json"},
        )
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())["prompt_id"]

    def get_history(self, prompt_id: str) -> dict:
        resp = urllib.request.urlopen(f"{self.server_url}/history/{prompt_id}")
        return json.loads(resp.read())

    def get_image(self, filename: str, subfolder: str = "", folder_type: str = "output") -> bytes:
        params = urllib.parse.urlencode({"filename": filename, "subfolder": subfolder, "type": folder_type})
        resp = urllib.request.urlopen(f"{self.server_url}/view?{params}")
        return resp.read()

    def wait_for_result(self, prompt_id: str, timeout: int = 300) -> dict:
        start = time.time()
        while time.time() - start < timeout:
            history = self.get_history(prompt_id)
            if prompt_id in history:
                outputs = history[prompt_id].get("outputs", {})
                images = []
                videos = []
                for node_output in outputs.values():
                    if "images" in node_output:
                        for img in node_output["images"]:
                            images.append(self.get_image(
                                img["filename"], img.get("subfolder", ""), img.get("type", "output")
                            ))
                    if "gifs" in node_output:
                        for gif in node_output["gifs"]:
                            videos.append((
                                self.get_image(gif["filename"], gif.get("subfolder", ""), gif.get("type", "output")),
                                gif["filename"],
                            ))
                return {"images": images, "videos": videos}
            time.sleep(1)
        raise TimeoutError(f"ComfyUI did not complete within {timeout}s")

    def generate_and_save(self, workflow: dict, output_dir: str, timeout: int = 300) -> dict:
        """Queue workflow, wait for result, save to local disk. Returns file paths."""
        os.makedirs(output_dir, exist_ok=True)
        prompt_id = self.queue_prompt(workflow)
        result = self.wait_for_result(prompt_id, timeout)

        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        saved = {"images": [], "videos": []}

        for i, img_data in enumerate(result["images"]):
            path = os.path.join(output_dir, f"img_{ts}_{i}.png")
            with open(path, "wb") as f:
                f.write(img_data)
            saved["images"].append(path)

        for vid_data, orig_name in result["videos"]:
            ext = Path(orig_name).suffix or ".gif"
            path = os.path.join(output_dir, f"vid_{ts}{ext}")
            with open(path, "wb") as f:
                f.write(vid_data)
            saved["videos"].append(path)

        return saved
