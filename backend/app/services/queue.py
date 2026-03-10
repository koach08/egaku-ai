"""Job queue for generation task management.

Uses Redis (Upstash) when available, falls back to in-memory store.
"""

import json
import logging
import time

from app.core.config import Settings

logger = logging.getLogger(__name__)

# ─── In-memory fallback store ───
# {job_id: {"data": {...}, "status": {...}, "created_at": float}}
_MEMORY_STORE: dict[str, dict] = {}
_MEMORY_QUEUE: list[tuple[str, int]] = []  # [(job_id, priority)]
_STORE_TTL = 3600  # 1 hour


def _cleanup_memory():
    """Remove expired entries from memory store."""
    now = time.time()
    expired = [k for k, v in _MEMORY_STORE.items() if now - v.get("created_at", 0) > _STORE_TTL]
    for k in expired:
        del _MEMORY_STORE[k]


class JobQueue:
    def __init__(self, settings: Settings):
        self.use_redis = bool(settings.redis_url)
        self.redis = None
        if self.use_redis:
            try:
                import redis.asyncio as redis_lib
                self.redis = redis_lib.from_url(settings.redis_url, decode_responses=True)
            except Exception as e:
                logger.warning("Failed to connect to Redis, using memory fallback: %s", e)
                self.use_redis = False

    async def enqueue(self, job_id: str, job_data: dict, priority: int = 0) -> None:
        """Add a job to the queue."""
        if self.use_redis and self.redis:
            try:
                await self.redis.zadd("jobs:pending", {job_id: priority})
                await self.redis.set(f"job:{job_id}", json.dumps(job_data), ex=3600)
                return
            except Exception as e:
                logger.warning("Redis enqueue failed, using memory: %s", e)

        # Memory fallback
        _cleanup_memory()
        _MEMORY_STORE[job_id] = {
            "data": job_data,
            "status": {"status": "queued"},
            "created_at": time.time(),
        }
        _MEMORY_QUEUE.append((job_id, priority))

    async def dequeue(self) -> tuple[str, dict] | None:
        """Get the highest-priority job from the queue."""
        if self.use_redis and self.redis:
            try:
                results = await self.redis.zpopmin("jobs:pending", count=1)
                if not results:
                    return None
                job_id = results[0][0]
                job_data = await self.redis.get(f"job:{job_id}")
                if not job_data:
                    return None
                return job_id, json.loads(job_data)
            except Exception:
                pass

        # Memory fallback
        if not _MEMORY_QUEUE:
            return None
        _MEMORY_QUEUE.sort(key=lambda x: x[1])
        job_id, _ = _MEMORY_QUEUE.pop(0)
        entry = _MEMORY_STORE.get(job_id)
        if not entry:
            return None
        return job_id, entry["data"]

    async def set_status(self, job_id: str, status: str, result: dict | None = None) -> None:
        data = {"status": status}
        if result:
            data["result"] = result

        if self.use_redis and self.redis:
            try:
                await self.redis.set(f"job:{job_id}:status", json.dumps(data), ex=3600)
                return
            except Exception as e:
                logger.warning("Redis set_status failed, using memory: %s", e)

        # Memory fallback
        if job_id in _MEMORY_STORE:
            _MEMORY_STORE[job_id]["status"] = data
        else:
            _MEMORY_STORE[job_id] = {
                "data": {},
                "status": data,
                "created_at": time.time(),
            }

    async def get_status(self, job_id: str) -> dict | None:
        if self.use_redis and self.redis:
            try:
                data = await self.redis.get(f"job:{job_id}:status")
                if data:
                    return json.loads(data)
                score = await self.redis.zscore("jobs:pending", job_id)
                if score is not None:
                    return {"status": "queued"}
                return None
            except Exception as e:
                logger.warning("Redis get_status failed, using memory: %s", e)

        # Memory fallback
        _cleanup_memory()
        entry = _MEMORY_STORE.get(job_id)
        if entry:
            return entry.get("status", {"status": "queued"})
        return None

    async def get_queue_length(self) -> int:
        if self.use_redis and self.redis:
            try:
                return await self.redis.zcard("jobs:pending")
            except Exception:
                pass
        return len(_MEMORY_QUEUE)

    async def close(self):
        if self.redis:
            try:
                await self.redis.close()
            except Exception:
                pass
