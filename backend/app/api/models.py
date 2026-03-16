"""Model management API - search CivitAI, list available models, manage custom model slots."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/models", tags=["models"])

PLAN_RANK = {"free": 0, "lite": 1, "basic": 2, "pro": 3, "unlimited": 4, "studio": 5}

# Custom model slots per plan
CUSTOM_MODEL_LIMITS = {
    "free": 0,
    "lite": 0,
    "basic": 2,     # LoRA only
    "pro": 5,       # LoRA + Checkpoint
    "unlimited": 10, # LoRA + Checkpoint
    "studio": 999,   # Unlimited
}

# Which plans can use Checkpoint models (not just LoRA)
CHECKPOINT_ALLOWED_PLANS = {"pro", "unlimited", "studio"}


# ─── List Built-in Models ───

@router.get("/available")
async def get_available_models(
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """List all available built-in models (Replicate, fal.ai, Novita.ai) + user's custom CivitAI models."""
    from app.services.replicate import MODELS

    # Built-in models from Replicate
    builtin = []
    for model_id, info in MODELS.items():
        builtin.append({
            "id": model_id,
            "name": info["name"],
            "category": info["category"],
            "description": info["description"],
            "min_plan": info["min_plan"],
            "credits": info["credits"],
            "source": "replicate",
        })

    # Novita.ai built-in models (NSFW-friendly checkpoints)
    if settings.novita_api_key:
        from app.services.novita import BUILTIN_MODELS as NOVITA_MODELS
        for model_id, info in NOVITA_MODELS.items():
            builtin.append({
                "id": model_id,
                "name": info["name"],
                "category": info["category"],
                "description": info["description"],
                "min_plan": info["min_plan"],
                "credits": info["credits"],
                "source": "novita",
            })

    # Check if user is authenticated to show custom models
    custom_models = []
    custom_slots_max = 0

    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            from app.services.supabase import get_supabase, get_user_profile
            supabase = get_supabase(settings)
            user = supabase.auth.get_user(token).user
            profile = await get_user_profile(supabase, user.id)
            plan = profile["plan"] if profile else "free"
            custom_slots_max = CUSTOM_MODEL_LIMITS.get(plan, 0)

            if custom_slots_max > 0:
                try:
                    result = (
                        supabase.table("user_models")
                        .select("*")
                        .eq("user_id", user.id)
                        .execute()
                    )
                    custom_models = [
                        {
                            "id": f"civitai_{row['civitai_model_id']}",
                            "name": row["name"],
                            "category": "custom",
                            "description": f"CivitAI - {row.get('base_model', '')}",
                            "min_plan": "basic",
                            "credits": 3,
                            "source": "civitai",
                            "civitai_model_id": row["civitai_model_id"],
                            "civitai_version_id": row["civitai_version_id"],
                            "preview_url": row.get("preview_url"),
                        }
                        for row in (result.data or [])
                    ]
                except Exception:
                    pass  # Table might not exist yet
        except Exception:
            pass

    return {
        "models": builtin + custom_models,
        "custom_slots_used": len(custom_models),
        "custom_slots_max": custom_slots_max,
    }


# ─── CivitAI Search ───

@router.get("/civitai/search")
async def search_civitai(
    query: str = "",
    model_type: str = Query("LORA", pattern="^(Checkpoint|LORA|TextualInversion|VAE|Controlnet)$"),
    sort: str = Query("Highest Rated", pattern="^(Highest Rated|Most Downloaded|Newest)$"),
    nsfw: bool = False,
    limit: int = Query(20, ge=1, le=50),
    page: int = Query(1, ge=1),
    settings: Settings = Depends(get_settings),
):
    """Search CivitAI models. No auth required."""
    from app.services.civitai import CivitAIClient

    client = CivitAIClient(api_key=settings.civitai_api_key)
    try:
        data = await client.search_models(
            query=query,
            model_type=model_type,
            sort=sort,
            nsfw=nsfw,
            limit=limit,
            page=page,
        )
        return data
    except Exception as e:
        logger.error(f"CivitAI search failed: {e}")
        raise HTTPException(status_code=502, detail=f"CivitAI API error: {str(e)}")


# ─── CivitAI Model Detail ───

@router.get("/civitai/{model_id}")
async def get_civitai_model(
    model_id: int,
    settings: Settings = Depends(get_settings),
):
    """Get details for a CivitAI model."""
    from app.services.civitai import CivitAIClient

    client = CivitAIClient(api_key=settings.civitai_api_key)
    try:
        data = await client.get_model(model_id)

        # Simplify response
        versions = data.get("modelVersions", [])
        simplified_versions = []
        for v in versions[:5]:
            images = v.get("images", [])
            files = v.get("files", [])
            primary_file = next((f for f in files if f.get("primary")), files[0] if files else {})

            simplified_versions.append({
                "id": v.get("id"),
                "name": v.get("name", ""),
                "base_model": v.get("baseModel", ""),
                "download_count": v.get("stats", {}).get("downloadCount", 0),
                "preview_url": images[0].get("url") if images else None,
                "file_name": primary_file.get("name", ""),
                "file_size_mb": round(primary_file.get("sizeKB", 0) / 1024, 1),
            })

        return {
            "id": data.get("id"),
            "name": data.get("name"),
            "type": data.get("type"),
            "nsfw": data.get("nsfw", False),
            "description": (data.get("description") or "")[:500],
            "tags": data.get("tags", []),
            "creator": data.get("creator", {}).get("username", ""),
            "stats": {
                "downloads": data.get("stats", {}).get("downloadCount", 0),
                "rating": data.get("stats", {}).get("rating", 0),
                "favorites": data.get("stats", {}).get("favoriteCount", 0),
            },
            "versions": simplified_versions,
        }
    except Exception as e:
        logger.error(f"CivitAI model fetch failed: {e}")
        raise HTTPException(status_code=502, detail=f"CivitAI API error: {str(e)}")


# ─── Add Custom Model (save CivitAI model to user's account) ───

@router.post("/civitai/add")
async def add_civitai_model(
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Save a CivitAI model to user's custom model slot. Requires Basic+ plan."""
    from app.services.supabase import get_supabase, get_user_profile

    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = auth_header.split(" ", 1)[1]

    supabase = get_supabase(settings)
    try:
        user = supabase.auth.get_user(token).user
        profile = await get_user_profile(supabase, user.id)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    plan = profile["plan"] if profile else "free"
    max_slots = CUSTOM_MODEL_LIMITS.get(plan, 0)

    if max_slots == 0:
        raise HTTPException(status_code=403, detail="Custom CivitAI models require Basic plan or above. Upgrade to unlock.")

    # Parse request body
    import json
    body = await request.json()
    civitai_model_id = body.get("civitai_model_id")
    civitai_version_id = body.get("civitai_version_id")
    name = body.get("name", "")
    base_model = body.get("base_model", "")
    preview_url = body.get("preview_url")
    model_type = body.get("model_type", "LORA")  # "LORA" or "Checkpoint"
    safetensors_name = body.get("safetensors_name", "")  # e.g. "realisticVision_v51.safetensors"

    # Checkpoint models require Pro plan or above
    if model_type == "Checkpoint" and plan not in CHECKPOINT_ALLOWED_PLANS:
        raise HTTPException(
            status_code=403,
            detail="Checkpoint models require Pro plan or above. Basic plan supports LoRA models only.",
        )

    if not civitai_model_id or not civitai_version_id:
        raise HTTPException(status_code=400, detail="civitai_model_id and civitai_version_id are required")

    # Check slots
    try:
        existing = supabase.table("user_models").select("id").eq("user_id", user.id).execute()
        if len(existing.data or []) >= max_slots:
            raise HTTPException(
                status_code=403,
                detail=f"Custom model limit reached ({max_slots} for {plan} plan). Remove a model first.",
            )

        # Check if already added
        dup = (
            supabase.table("user_models")
            .select("id")
            .eq("user_id", user.id)
            .eq("civitai_model_id", civitai_model_id)
            .maybe_single()
            .execute()
        )
        if dup and dup.data:
            return {"added": False, "message": "Model already added"}
    except HTTPException:
        raise
    except Exception:
        pass

    # Save
    try:
        supabase.table("user_models").insert({
            "user_id": user.id,
            "civitai_model_id": civitai_model_id,
            "civitai_version_id": civitai_version_id,
            "name": name,
            "base_model": base_model,
            "preview_url": preview_url,
            "model_type": model_type,
            "safetensors_name": safetensors_name,
        }).execute()
    except Exception as e:
        logger.error(f"Failed to save custom model: {e}")
        raise HTTPException(status_code=500, detail="Failed to save model")

    return {"added": True, "slots_remaining": max_slots - len(existing.data or []) - 1}


# ─── Remove Custom Model ───

@router.delete("/civitai/{model_id}")
async def remove_civitai_model(
    model_id: int,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Remove a CivitAI model from user's custom models."""
    from app.services.supabase import get_supabase

    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = auth_header.split(" ", 1)[1]

    supabase = get_supabase(settings)
    try:
        user = supabase.auth.get_user(token).user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        supabase.table("user_models").delete().eq(
            "user_id", user.id
        ).eq("civitai_model_id", model_id).execute()
    except Exception as e:
        logger.error(f"Failed to remove model: {e}")

    return {"removed": True}
