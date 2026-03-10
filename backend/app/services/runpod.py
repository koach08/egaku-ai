"""RunPod Serverless GPU worker dispatch."""

import logging

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)

RUNPOD_API_BASE = "https://api.runpod.ai/v2"


class RunPodClient:
    def __init__(self, settings: Settings, endpoint_id: str | None = None):
        self.api_key = settings.runpod_api_key
        self.endpoint_id = endpoint_id or settings.runpod_endpoint_id
        self.base_url = f"{RUNPOD_API_BASE}/{self.endpoint_id}"
        self.headers = {"Authorization": f"Bearer {self.api_key}"}

    async def submit_job(self, workflow: dict, webhook_url: str | None = None) -> dict:
        """Submit a generation job to RunPod Serverless.
        Returns {"id": "job-id", "status": "IN_QUEUE"}.
        """
        payload = {"input": {"workflow": workflow}}
        if webhook_url:
            payload["webhook"] = webhook_url

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/run",
                json=payload,
                headers=self.headers,
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

    async def check_status(self, job_id: str) -> dict:
        """Check job status. Returns {"id", "status", "output"}."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/status/{job_id}",
                headers=self.headers,
                timeout=15,
            )
            response.raise_for_status()
            return response.json()

    async def cancel_job(self, job_id: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/cancel/{job_id}",
                headers=self.headers,
                timeout=15,
            )
            response.raise_for_status()
            return response.json()

    async def health(self) -> dict:
        """Check endpoint health (workers, queue)."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/health",
                headers=self.headers,
                timeout=10,
            )
            response.raise_for_status()
            return response.json()
