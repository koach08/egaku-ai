"""Project folders API — organize generations into projects."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.services.supabase import get_supabase

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = ""


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class ProjectAddItem(BaseModel):
    generation_id: str


@router.get("/")
async def list_projects(
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    supabase = get_supabase(settings)
    result = supabase.table("projects").select("*").eq(
        "user_id", user.id
    ).order("updated_at", desc=True).execute()
    projects = result.data or []

    # Count items per project
    for proj in projects:
        items_result = supabase.table("project_items").select(
            "id", count="exact"
        ).eq("project_id", proj["id"]).execute()
        proj["item_count"] = items_result.count or 0

    return {"projects": projects}


@router.post("/")
async def create_project(
    body: ProjectCreate,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    supabase = get_supabase(settings)
    result = supabase.table("projects").insert({
        "id": str(uuid.uuid4()),
        "user_id": user.id,
        "name": body.name,
        "description": body.description,
    }).execute()
    return result.data[0]


@router.get("/{project_id}")
async def get_project(
    project_id: str,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    supabase = get_supabase(settings)
    result = supabase.table("projects").select("*").eq(
        "id", project_id
    ).eq("user_id", user.id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get items
    items = supabase.table("project_items").select(
        "*, generations(*)"
    ).eq("project_id", project_id).order("added_at", desc=True).execute()

    return {**result.data, "items": items.data or []}


@router.patch("/{project_id}")
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    supabase = get_supabase(settings)
    updates = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.description is not None:
        updates["description"] = body.description
    updates["updated_at"] = datetime.utcnow().isoformat()

    result = supabase.table("projects").update(updates).eq(
        "id", project_id
    ).eq("user_id", user.id).execute()
    return result.data[0] if result.data else {}


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    supabase = get_supabase(settings)
    supabase.table("projects").delete().eq(
        "id", project_id
    ).eq("user_id", user.id).execute()
    return {"deleted": True}


@router.post("/{project_id}/items")
async def add_item_to_project(
    project_id: str,
    body: ProjectAddItem,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    supabase = get_supabase(settings)
    # Verify project ownership
    proj = supabase.table("projects").select("id").eq(
        "id", project_id
    ).eq("user_id", user.id).single().execute()
    if not proj.data:
        raise HTTPException(status_code=404, detail="Project not found")

    result = supabase.table("project_items").insert({
        "project_id": project_id,
        "generation_id": body.generation_id,
    }).execute()

    # Update project timestamp
    supabase.table("projects").update({
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", project_id).execute()

    return result.data[0] if result.data else {}


@router.delete("/{project_id}/items/{item_id}")
async def remove_item_from_project(
    project_id: str,
    item_id: str,
    user=Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    supabase = get_supabase(settings)
    supabase.table("project_items").delete().eq(
        "id", item_id
    ).eq("project_id", project_id).execute()
    return {"deleted": True}
