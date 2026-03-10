"""CivitAI API client - browse and search community models."""

import logging

import httpx

logger = logging.getLogger(__name__)

CIVITAI_API_BASE = "https://civitai.com/api/v1"


class CivitAIClient:
    """Client for the CivitAI public API."""

    def __init__(self, api_key: str = ""):
        self.api_key = api_key

    def get_download_url(self, version_id: int) -> str:
        """Build CivitAI download URL, appending token if available."""
        url = f"https://civitai.com/api/download/models/{version_id}"
        if self.api_key:
            url += f"?token={self.api_key}"
        return url

    async def search_models(
        self,
        query: str = "",
        model_type: str = "Checkpoint",
        sort: str = "Highest Rated",
        period: str = "AllTime",
        nsfw: bool = False,
        limit: int = 20,
        page: int = 1,
    ) -> dict:
        """Search CivitAI models.

        model_type: Checkpoint, LORA, TextualInversion, Hypernetwork, AestheticGradient, Controlnet, Poses
        sort: Highest Rated, Most Downloaded, Newest
        period: AllTime, Year, Month, Week, Day
        """
        params = {
            "limit": min(limit, 100),
            "page": page,
            "sort": sort,
            "period": period,
            "types": model_type,
            "nsfw": str(nsfw).lower(),
        }
        if query:
            params["query"] = query

        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CIVITAI_API_BASE}/models",
                params=params,
                headers=headers,
                timeout=20,
            )
            response.raise_for_status()
            data = response.json()

        # Simplify the response for frontend
        items = []
        for model in data.get("items", []):
            # Get the latest version
            versions = model.get("modelVersions", [])
            latest = versions[0] if versions else {}

            # Get preview image
            preview_images = latest.get("images", [])
            preview_url = preview_images[0].get("url") if preview_images else None

            # Get download info
            files = latest.get("files", [])
            primary_file = None
            for f in files:
                if f.get("primary", False) or f.get("type") == "Model":
                    primary_file = f
                    break
            if not primary_file and files:
                primary_file = files[0]

            items.append({
                "id": model.get("id"),
                "name": model.get("name", ""),
                "type": model.get("type", ""),
                "nsfw": model.get("nsfw", False),
                "tags": model.get("tags", []),
                "description": (model.get("description") or "")[:200],
                "stats": {
                    "downloads": model.get("stats", {}).get("downloadCount", 0),
                    "rating": model.get("stats", {}).get("rating", 0),
                    "favorites": model.get("stats", {}).get("favoriteCount", 0),
                },
                "creator": model.get("creator", {}).get("username", ""),
                "preview_url": preview_url,
                "latest_version": {
                    "id": latest.get("id"),
                    "name": latest.get("name", ""),
                    "base_model": latest.get("baseModel", ""),
                    "download_url": latest.get("downloadUrl", ""),
                    "file_size_mb": round(primary_file.get("sizeKB", 0) / 1024, 1) if primary_file else 0,
                    "file_name": primary_file.get("name", "") if primary_file else "",
                },
            })

        return {
            "items": items,
            "total": data.get("metadata", {}).get("totalItems", 0),
            "page": data.get("metadata", {}).get("currentPage", page),
            "total_pages": data.get("metadata", {}).get("totalPages", 0),
        }

    async def get_model(self, model_id: int) -> dict:
        """Get details for a specific CivitAI model."""
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CIVITAI_API_BASE}/models/{model_id}",
                headers=headers,
                timeout=20,
            )
            response.raise_for_status()
            return response.json()

    async def get_model_version(self, version_id: int) -> dict:
        """Get details for a specific model version."""
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CIVITAI_API_BASE}/model-versions/{version_id}",
                headers=headers,
                timeout=20,
            )
            response.raise_for_status()
            return response.json()
