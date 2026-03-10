"""Public community gallery - browse published works."""

from fastapi import APIRouter, Depends, Query, Request

from app.core.config import Settings, get_settings
from app.models.schemas import ExploreItem, ExploreListResponse
from app.services.supabase import get_supabase

router = APIRouter(prefix="/explore", tags=["explore"])


@router.get("/", response_model=ExploreListResponse)
async def list_explore(
    page: int = 1,
    per_page: int = 24,
    sort: str = Query("newest", enum=["newest", "popular"]),
    nsfw: bool = False,
    request: Request = None,
    settings: Settings = Depends(get_settings),
):
    """Browse publicly shared generations.

    NSFW content requires ?nsfw=true and is hidden by default.
    Viewer age verification is checked client-side.
    """
    supabase = get_supabase(settings)

    query = (
        supabase.table("generations")
        .select("*, users!inner(display_name, email)", count="exact")
        .eq("is_public", True)
    )

    if not nsfw:
        query = query.eq("nsfw_flag", False)

    if sort == "popular":
        query = query.order("likes", desc=True)
    else:
        query = query.order("created_at", desc=True)

    offset = (page - 1) * per_page
    result = query.range(offset, offset + per_page - 1).execute()

    items = []
    for row in result.data or []:
        user_data = row.get("users", {})
        author = user_data.get("display_name") or ""
        if not author:
            email = user_data.get("email", "")
            author = email.split("@")[0] if email else "Anonymous"

        items.append(ExploreItem(
            id=row["id"],
            prompt=row["prompt"],
            model=row.get("model", ""),
            nsfw=row.get("nsfw_flag", False),
            image_url=row.get("image_url"),
            video_url=row.get("video_url"),
            author_name=author,
            likes=row.get("likes", 0),
            created_at=row["created_at"],
        ))

    return ExploreListResponse(
        items=items,
        total=result.count or 0,
        page=page,
        per_page=per_page,
    )


@router.get("/{generation_id}", response_model=ExploreItem)
async def get_explore_item(
    generation_id: str,
    settings: Settings = Depends(get_settings),
):
    """Get a single public generation by ID."""
    supabase = get_supabase(settings)

    result = (
        supabase.table("generations")
        .select("*, users!inner(display_name, email)")
        .eq("id", generation_id)
        .eq("is_public", True)
        .single()
        .execute()
    )

    if not result.data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found or not public")

    row = result.data
    user_data = row.get("users", {})
    author = user_data.get("display_name") or ""
    if not author:
        email = user_data.get("email", "")
        author = email.split("@")[0] if email else "Anonymous"

    return ExploreItem(
        id=row["id"],
        prompt=row["prompt"],
        model=row.get("model", ""),
        nsfw=row.get("nsfw_flag", False),
        image_url=row.get("image_url"),
        video_url=row.get("video_url"),
        author_name=author,
        likes=row.get("likes", 0),
        created_at=row["created_at"],
    )
