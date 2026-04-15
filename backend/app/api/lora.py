"""User-trained LoRA endpoints (Flux LoRA fast training via fal.ai).

Flow:
  POST /lora/train        → zip user photos, upload to storage, submit to fal.ai,
                            insert a row in user_trained_loras, return immediately.
  GET  /lora/list         → list user's LoRAs; lazily polls fal.ai for any rows
                            still in the "training" state and updates them.
  GET  /lora/{id}         → same as list but for a single row.
  DELETE /lora/{id}       → delete a row (RLS enforced).
  POST /lora/generate     → generate image(s) using a completed LoRA.
"""

from __future__ import annotations

import base64
import io
import logging
import secrets
import uuid
import zipfile
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.config import Settings, get_settings
from app.core.legal import check_prompt_compliance, is_admin
from app.models.schemas import (
    CREDIT_COSTS,
    LoRAGenerateRequest,
    LoRAListItem,
    LoRATrainRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/lora", tags=["lora-training"])

# Min plan rank required to train at all (admin always bypasses)
PLAN_RANK = {"free": 0, "lite": 1, "basic": 2, "pro": 3, "unlimited": 4, "studio": 5}

# One-time lifetime limits per plan (admin bypasses)
PLAN_LORA_LIMIT = {
    "free": 0,
    "lite": 1,
    "basic": 3,
    "pro": 10,
    "unlimited": 25,
    "studio": 100,
}


async def _auth_and_profile(request: Request, settings: Settings):
    """Decode Bearer token, return (user, profile, supabase)."""
    from app.services.supabase import get_supabase, get_user_profile

    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = auth_header.split(" ", 1)[1]

    supabase = get_supabase(settings)
    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    profile = await get_user_profile(supabase, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    return user, profile, supabase


def _decode_data_url(data_url: str) -> tuple[bytes, str]:
    """Decode a base64 data URL → (bytes, ext). Raises HTTPException on failure."""
    if data_url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=400,
            detail="Only base64 data URLs are accepted for training images "
                   "(data:image/jpeg;base64,...)",
        )
    if not data_url.startswith("data:"):
        raise HTTPException(status_code=400, detail="Invalid image data URL")
    try:
        header, b64 = data_url.split(",", 1)
        data = base64.b64decode(b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to decode training image")

    mime = ""
    if ":" in header and ";" in header:
        mime = header.split(":", 1)[1].split(";", 1)[0]

    if "jpeg" in mime or "jpg" in mime:
        ext = "jpg"
    elif "webp" in mime:
        ext = "webp"
    else:
        ext = "png"
    return data, ext


def _row_to_item(row: dict) -> LoRAListItem:
    """Convert a DB row into the wire-format response item."""
    return LoRAListItem(
        id=str(row["id"]),
        name=row.get("name") or "",
        trigger_word=row.get("trigger_word") or "",
        status=row.get("status") or "training",
        progress=int(row.get("progress") or 0),
        lora_url=row.get("lora_url"),
        nsfw=bool(row.get("nsfw")),
        created_at=str(row.get("created_at") or ""),
        completed_at=(str(row["completed_at"]) if row.get("completed_at") else None),
        error_message=row.get("error_message"),
    )


async def _refresh_training_row(supabase, settings: Settings, row: dict) -> dict:
    """If this row is still training, poll fal.ai once and update DB accordingly.

    Returns the (possibly updated) row. Refunds credits if training failed.
    """
    if row.get("status") != "training":
        return row
    request_id = row.get("fal_request_id")
    if not request_id:
        return row

    from app.services.fal_ai import FalClient
    fal = FalClient(settings)
    if not fal.is_available():
        return row

    fal_model = "fal-ai/flux-lora-fast-training"
    status_url = f"https://queue.fal.run/{fal_model}/requests/{request_id}/status"
    response_url = f"https://queue.fal.run/{fal_model}/requests/{request_id}"

    try:
        status_data = await fal.poll_lora_training(status_url)
    except Exception as e:
        logger.warning(f"LoRA poll failed for {request_id}: {e}")
        return row

    status = (status_data.get("status") or "").upper()

    # Map fal.ai status to our coarse progress estimate
    if status == "IN_QUEUE":
        new_progress = max(int(row.get("progress") or 0), 5)
    elif status == "IN_PROGRESS":
        new_progress = max(int(row.get("progress") or 0), 40)
    else:
        new_progress = int(row.get("progress") or 0)

    if status == "COMPLETED":
        try:
            result = await fal.fetch_lora_result(response_url)
        except Exception as e:
            logger.error(f"LoRA result fetch failed for {request_id}: {e}")
            return row
        lora_url = ""
        config_url = ""
        if isinstance(result.get("diffusers_lora_file"), dict):
            lora_url = result["diffusers_lora_file"].get("url") or ""
        if isinstance(result.get("config_file"), dict):
            config_url = result["config_file"].get("url") or ""

        updates = {
            "status": "completed",
            "progress": 100,
            "lora_url": lora_url or None,
            "config_url": config_url or None,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            supabase.table("user_trained_loras").update(updates).eq("id", row["id"]).execute()
        except Exception as e:
            logger.error(f"Failed to update completed LoRA {row['id']}: {e}")
        row = {**row, **updates}
        logger.info(f"LoRA {row['id']} completed: {lora_url}")
        return row

    if status in ("FAILED", "CANCELLED", "ERROR"):
        err_msg = str(status_data.get("error") or status_data.get("detail") or "Training failed")[:500]
        updates = {
            "status": "failed",
            "error_message": err_msg,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            supabase.table("user_trained_loras").update(updates).eq("id", row["id"]).execute()
        except Exception:
            pass
        # Refund credits
        try:
            from app.services.supabase import get_credit_balance, get_user_profile
            profile = await get_user_profile(supabase, row["user_id"])
            if profile and profile.get("plan") not in ("unlimited", "studio"):
                current = await get_credit_balance(supabase, row["user_id"])
                if current:
                    refund = CREDIT_COSTS["lora_training"]
                    supabase.table("credits").update({
                        "balance": current["balance"] + refund,
                        "lifetime_used": max(0, current["lifetime_used"] - refund),
                    }).eq("user_id", row["user_id"]).execute()
                    supabase.table("credit_transactions").insert({
                        "user_id": str(row["user_id"]),
                        "amount": refund,
                        "type": "refund",
                        "description": "LoRA training failed - refund",
                    }).execute()
        except Exception as e:
            logger.warning(f"LoRA refund failed for {row['id']}: {e}")
        row = {**row, **updates}
        return row

    # Still training — persist any progress bump
    if new_progress != (row.get("progress") or 0):
        try:
            supabase.table("user_trained_loras").update({"progress": new_progress}).eq("id", row["id"]).execute()
            row = {**row, "progress": new_progress}
        except Exception:
            pass
    return row


@router.post("/train")
async def train_lora(
    body: LoRATrainRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Start a Flux LoRA fast-training job for the current user.

    Returns immediately after submitting to fal.ai — polling happens lazily on
    subsequent GET /lora/list calls.
    """
    # ─── Auth ───
    user, profile, supabase = await _auth_and_profile(request, settings)
    user_id = str(user.id)
    user_email = profile.get("email", "") or ""
    plan = profile.get("plan") or "free"

    # ─── Plan gate ───
    admin = is_admin(user_email)
    if not admin and PLAN_RANK.get(plan, 0) < PLAN_RANK["basic"]:
        raise HTTPException(status_code=403, detail="LoRA training requires Basic plan or above")

    # ─── Per-user lifetime LoRA limit ───
    try:
        existing = supabase.table("user_trained_loras").select("id", count="exact").eq("user_id", user_id).execute()
        current_count = existing.count or 0
    except Exception:
        current_count = 0
    limit = PLAN_LORA_LIMIT.get(plan, 0)
    if not admin and current_count >= limit:
        raise HTTPException(
            status_code=403,
            detail=f"Your {plan} plan allows up to {limit} trained LoRAs "
                   f"({current_count} already used). Upgrade for more slots.",
        )

    # ─── Validate trigger_word (no whitespace, alnum-ish) ───
    trigger = body.trigger_word.strip()
    if any(c.isspace() for c in trigger):
        raise HTTPException(status_code=400, detail="Trigger word must not contain spaces")

    # ─── Backend availability ───
    from app.services.fal_ai import FalClient
    fal = FalClient(settings)
    if not fal.is_available():
        raise HTTPException(status_code=503, detail="LoRA training backend is unavailable")

    # ─── Zip training images ───
    buf = io.BytesIO()
    total_bytes = 0
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for idx, data_url in enumerate(body.images):
            img_bytes, ext = _decode_data_url(data_url)
            if len(img_bytes) > 10 * 1024 * 1024:
                raise HTTPException(status_code=413, detail=f"Image #{idx+1} exceeds 10 MB")
            total_bytes += len(img_bytes)
            if total_bytes > 80 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="Total training set exceeds 80 MB")
            zf.writestr(f"image_{idx:02d}.{ext}", img_bytes)
    zip_bytes = buf.getvalue()

    # ─── Upload zip to Supabase Storage ───
    zip_token = secrets.token_hex(8)
    storage_path = f"lora-training/{user_id}/{zip_token}.zip"
    try:
        supabase.storage.from_("self-hosted").upload(
            storage_path, zip_bytes,
            file_options={"content-type": "application/zip", "upsert": "true"},
        )
    except Exception as e:
        logger.error(f"LoRA zip upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to stage training images")

    images_zip_url = (
        f"{supabase.supabase_url}/storage/v1/object/public/self-hosted/{storage_path}"
    )

    # ─── Deduct credits ───
    from app.services.supabase import deduct_credits
    credits_needed = CREDIT_COSTS["lora_training"]
    ok = await deduct_credits(supabase, user_id, credits_needed, f"LoRA training: {body.name}")
    if not ok:
        raise HTTPException(status_code=402, detail="Insufficient credits for LoRA training")

    # ─── Submit to fal.ai ───
    try:
        queue_resp = await fal.submit_lora_training(
            images_zip_url=images_zip_url,
            trigger_word=trigger,
            steps=body.steps,
            is_style=body.is_style,
        )
    except Exception as e:
        logger.error(f"LoRA fal.ai submit failed: {e}")
        # Refund credits
        try:
            from app.services.supabase import get_credit_balance
            if profile.get("plan") not in ("unlimited", "studio"):
                current = await get_credit_balance(supabase, user_id)
                if current:
                    supabase.table("credits").update({
                        "balance": current["balance"] + credits_needed,
                        "lifetime_used": max(0, current["lifetime_used"] - credits_needed),
                    }).eq("user_id", user_id).execute()
                    supabase.table("credit_transactions").insert({
                        "user_id": user_id,
                        "amount": credits_needed,
                        "type": "refund",
                        "description": "LoRA training submit failed - refund",
                    }).execute()
        except Exception:
            pass
        raise HTTPException(status_code=502, detail=f"LoRA training submit failed: {e}")

    request_id = queue_resp.get("request_id") or ""

    # ─── Insert DB row ───
    new_id = str(uuid.uuid4())
    try:
        supabase.table("user_trained_loras").insert({
            "id": new_id,
            "user_id": user_id,
            "name": body.name,
            "trigger_word": trigger,
            "status": "training",
            "progress": 5,
            "images_zip_url": images_zip_url,
            "image_count": len(body.images),
            "steps": body.steps,
            "is_style": body.is_style,
            "nsfw": body.nsfw,
            "fal_request_id": request_id,
        }).execute()
    except Exception as e:
        logger.error(f"Failed to insert LoRA row: {e}")
        raise HTTPException(status_code=500, detail="Failed to record LoRA training job")

    return {
        "id": new_id,
        "status": "training",
        "fal_request_id": request_id,
        "credits_used": credits_needed,
        "message": "Training started. Check back in ~5-15 minutes.",
    }


@router.get("/list")
async def list_loras(
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """List the current user's LoRAs. Any rows still in `training` get a
    lazy poll against fal.ai to update their status/progress."""
    user, _profile, supabase = await _auth_and_profile(request, settings)
    user_id = str(user.id)

    try:
        res = supabase.table("user_trained_loras").select("*").eq("user_id", user_id).order(
            "created_at", desc=True,
        ).execute()
        rows = res.data or []
    except Exception as e:
        logger.error(f"Failed to fetch LoRAs: {e}")
        rows = []

    refreshed: list[dict] = []
    for row in rows:
        if row.get("status") == "training":
            try:
                row = await _refresh_training_row(supabase, settings, row)
            except Exception as e:
                logger.warning(f"LoRA refresh failed: {e}")
        refreshed.append(row)

    return [_row_to_item(r).model_dump() for r in refreshed]


@router.get("/{lora_id}")
async def get_lora(
    lora_id: str,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Fetch a single LoRA. Auto-polls fal.ai if still training."""
    user, _profile, supabase = await _auth_and_profile(request, settings)
    user_id = str(user.id)

    try:
        res = supabase.table("user_trained_loras").select("*").eq("id", lora_id).eq(
            "user_id", user_id,
        ).maybe_single().execute()
        row = (res and res.data) or None
    except Exception:
        row = None
    if not row:
        raise HTTPException(status_code=404, detail="LoRA not found")

    if row.get("status") == "training":
        try:
            row = await _refresh_training_row(supabase, settings, row)
        except Exception:
            pass

    return _row_to_item(row).model_dump()


@router.delete("/{lora_id}")
async def delete_lora(
    lora_id: str,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Delete a LoRA (only the owner can)."""
    user, _profile, supabase = await _auth_and_profile(request, settings)
    user_id = str(user.id)

    try:
        existing = supabase.table("user_trained_loras").select("id,user_id").eq(
            "id", lora_id,
        ).maybe_single().execute()
        row = (existing and existing.data) or None
    except Exception:
        row = None
    if not row:
        raise HTTPException(status_code=404, detail="LoRA not found")
    if str(row.get("user_id")) != user_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    try:
        supabase.table("user_trained_loras").delete().eq("id", lora_id).execute()
    except Exception as e:
        logger.error(f"Failed to delete LoRA {lora_id}: {e}")
        raise HTTPException(status_code=500, detail="Delete failed")

    return {"ok": True}


@router.post("/generate")
async def generate_with_lora(
    body: LoRAGenerateRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Generate image(s) using a user-trained LoRA via fal-ai/flux-lora."""
    is_safe, flagged = check_prompt_compliance(body.prompt)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Content policy violation: {', '.join(flagged)}")

    user, _profile, supabase = await _auth_and_profile(request, settings)
    user_id = str(user.id)

    # Fetch LoRA and check ownership + status
    try:
        res = supabase.table("user_trained_loras").select("*").eq("id", body.lora_id).eq(
            "user_id", user_id,
        ).maybe_single().execute()
        lora = (res and res.data) or None
    except Exception:
        lora = None
    if not lora:
        raise HTTPException(status_code=404, detail="LoRA not found")
    if lora.get("status") != "completed" or not lora.get("lora_url"):
        raise HTTPException(status_code=400, detail="LoRA is not ready yet")

    # Ensure backend available
    from app.services.fal_ai import FalClient
    fal = FalClient(settings)
    if not fal.is_available():
        raise HTTPException(status_code=503, detail="Image generation backend unavailable")

    # Deduct credits
    from app.services.supabase import deduct_credits
    credits_needed = CREDIT_COSTS["lora_generate"] * body.num_images
    ok = await deduct_credits(supabase, user_id, credits_needed, f"LoRA generate: {lora.get('name')}")
    if not ok:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Ensure trigger word is in the prompt (fal.ai convention for LoRA use)
    trigger = (lora.get("trigger_word") or "").strip()
    effective_prompt = body.prompt
    if trigger and trigger.lower() not in body.prompt.lower():
        effective_prompt = f"{trigger}, {body.prompt}"

    result_urls: list[str] = []
    try:
        # fal-ai/flux-lora supports `num_images` directly
        import httpx
        input_params: dict = {
            "prompt": effective_prompt,
            "loras": [{"path": lora["lora_url"], "scale": float(body.lora_strength)}],
            "image_size": {"width": body.width, "height": body.height},
            "num_inference_steps": 28,
            "guidance_scale": 3.5,
            "num_images": body.num_images,
            "enable_safety_checker": False,
            "safety_tolerance": 6,
        }
        if body.seed >= 0:
            input_params["seed"] = body.seed

        url = "https://fal.run/fal-ai/flux-lora"
        async with httpx.AsyncClient() as client:
            r = await client.post(
                url,
                json=input_params,
                headers={
                    "Authorization": f"Key {fal.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=180,
            )
            r.raise_for_status()
            data = r.json()

        images = data.get("images") or []
        for img in images:
            if isinstance(img, dict) and img.get("url"):
                result_urls.append(img["url"])
    except Exception as e:
        logger.exception(f"LoRA generate failed: {e}")
        # Refund credits
        try:
            from app.services.supabase import get_credit_balance, get_user_profile
            prof = await get_user_profile(supabase, user_id)
            if prof and prof.get("plan") not in ("unlimited", "studio"):
                current = await get_credit_balance(supabase, user_id)
                if current:
                    supabase.table("credits").update({
                        "balance": current["balance"] + credits_needed,
                        "lifetime_used": max(0, current["lifetime_used"] - credits_needed),
                    }).eq("user_id", user_id).execute()
                    supabase.table("credit_transactions").insert({
                        "user_id": user_id,
                        "amount": credits_needed,
                        "type": "refund",
                        "description": "LoRA generate failed - refund",
                    }).execute()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"LoRA generation failed: {e}")

    if not result_urls:
        raise HTTPException(status_code=502, detail="LoRA generation produced no images")

    # Persist each image to Supabase Storage + save to generations/gallery
    from app.api.generate import _persist_to_supabase_storage, _save_generation_to_db
    permanent_urls: list[str] = []
    for img_url in result_urls:
        job_id = str(uuid.uuid4())
        try:
            permanent = await _persist_to_supabase_storage(supabase, img_url, job_id, is_video=False)
        except Exception:
            permanent = img_url
        permanent_urls.append(permanent)
        try:
            await _save_generation_to_db(
                settings, user_id, job_id, "txt2img", effective_prompt,
                "", f"user_lora:{lora['id']}",
                {
                    "lora_id": lora["id"],
                    "lora_url": lora["lora_url"],
                    "lora_strength": body.lora_strength,
                    "width": body.width,
                    "height": body.height,
                    "seed": body.seed,
                },
                permanent, bool(lora.get("nsfw")),
            )
        except Exception as e:
            logger.warning(f"LoRA gen save failed: {e}")

    return {
        "result_urls": permanent_urls,
        "credits_used": credits_needed,
        "prompt_used": effective_prompt,
    }
