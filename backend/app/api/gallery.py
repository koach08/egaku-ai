"""Community gallery endpoints: publish, browse, like, and remix generations.

Supabase tables required:

-- gallery: stores published gallery items
CREATE TABLE gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    prompt TEXT NOT NULL DEFAULT '',
    negative_prompt TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT '',
    steps INTEGER NOT NULL DEFAULT 0,
    cfg DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    seed BIGINT NOT NULL DEFAULT -1,
    width INTEGER NOT NULL DEFAULT 0,
    height INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    nsfw BOOLEAN NOT NULL DEFAULT FALSE,
    public BOOLEAN NOT NULL DEFAULT TRUE,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gallery_user_id ON gallery(user_id);
CREATE INDEX idx_gallery_public ON gallery(public, nsfw);
CREATE INDEX idx_gallery_created_at ON gallery(created_at DESC);
CREATE INDEX idx_gallery_likes_count ON gallery(likes_count DESC);
CREATE INDEX idx_gallery_tags ON gallery USING GIN(tags);

-- gallery_likes: tracks which users liked which gallery items
CREATE TABLE gallery_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gallery_id UUID NOT NULL REFERENCES gallery(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, gallery_id)
);

CREATE INDEX idx_gallery_likes_gallery_id ON gallery_likes(gallery_id);
CREATE INDEX idx_gallery_likes_user_id ON gallery_likes(user_id);

-- RLS policies (enable RLS on both tables):
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_likes ENABLE ROW LEVEL SECURITY;

-- Gallery: anyone can read public items, owners can insert/update/delete their own
CREATE POLICY "Public gallery items are viewable by everyone"
    ON gallery FOR SELECT USING (public = true);
CREATE POLICY "Users can view their own gallery items"
    ON gallery FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own gallery items"
    ON gallery FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own gallery items"
    ON gallery FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own gallery items"
    ON gallery FOR DELETE USING (auth.uid() = user_id);

-- Gallery likes: anyone can read, users manage their own
CREATE POLICY "Likes are viewable by everyone"
    ON gallery_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes"
    ON gallery_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes"
    ON gallery_likes FOR DELETE USING (auth.uid() = user_id);
"""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.core.config import Settings, get_settings
from app.core.legal import can_publish_nsfw
from app.models.schemas import (
    CommunityGalleryItem,
    CommunityGalleryListResponse,
    GalleryPublishRequest,
    RemixResponse,
)
from app.services.supabase import get_supabase, get_user_profile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/gallery", tags=["gallery"])


# ─── Auth helper (same pattern as generate_advanced.py) ───

async def _auth_and_profile(request: Request, settings: Settings):
    """Common auth check, returns (user, profile, supabase)."""
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


def _get_author_name(user_data: dict | None) -> str:
    """Extract display name from user profile, falling back to email prefix."""
    if not user_data:
        return "Anonymous"
    name = user_data.get("display_name") or ""
    if not name:
        email = user_data.get("email", "")
        name = email.split("@")[0] if email else "Anonymous"
    return name


def _row_to_item(row: dict, liked_by_me: bool = False, author_name: str = "Anonymous") -> CommunityGalleryItem:
    """Convert a Supabase row to a CommunityGalleryItem."""
    return CommunityGalleryItem(
        id=row["id"],
        user_id=row.get("user_id", ""),
        job_id=row.get("job_id", ""),
        prompt=row.get("prompt", ""),
        negative_prompt=row.get("negative_prompt", ""),
        model=row.get("model", ""),
        steps=row.get("steps", 0),
        cfg=row.get("cfg", 0.0),
        seed=row.get("seed", -1),
        width=row.get("width", 0),
        height=row.get("height", 0),
        image_url=row.get("image_url"),
        video_url=row.get("video_url"),
        title=row.get("title", ""),
        description=row.get("description", ""),
        tags=row.get("tags", []),
        nsfw=row.get("nsfw", False),
        public=row.get("public", True),
        likes_count=row.get("likes_count", 0),
        liked_by_me=liked_by_me,
        author_name=author_name,
        created_at=row["created_at"],
    )


# ─── POST /gallery/publish ───

@router.post("/publish", response_model=CommunityGalleryItem)
async def publish_to_gallery(
    body: GalleryPublishRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Publish a completed generation to the community gallery.

    Looks up the generation by job_id in the `generations` table,
    copies relevant data into the `gallery` table with user-provided
    title, description, and tags.
    """
    user, profile, supabase = await _auth_and_profile(request, settings)

    # Look up the generation to publish
    try:
        gen_result = (
            supabase.table("generations")
            .select("*")
            .eq("id", body.generation_id)
            .eq("user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Generation not found")

    if not gen_result.data:
        raise HTTPException(status_code=404, detail="Generation not found")

    gen = gen_result.data

    # Check if already published
    try:
        existing = (
            supabase.table("gallery")
            .select("id")
            .eq("job_id", body.generation_id)
            .eq("user_id", user.id)
            .maybe_single()
            .execute()
        )
        if existing and existing.data:
            raise HTTPException(
                status_code=409,
                detail="This generation has already been published to the gallery",
            )
    except HTTPException:
        raise
    except Exception:
        pass  # Table might not exist yet; continue

    # NSFW region check (admins bypass)
    if body.nsfw:
        region = profile.get("region_code", "US")
        user_email = profile.get("email", "")
        if not can_publish_nsfw(region, user_email):
            raise HTTPException(
                status_code=403,
                detail="NSFW content cannot be published publicly in your region.",
            )

    # Extract generation parameters
    params = gen.get("params_json", {})
    gallery_row = {
        "user_id": user.id,
        "job_id": body.generation_id,
        "prompt": gen.get("prompt", ""),
        "negative_prompt": gen.get("negative_prompt", ""),
        "model": gen.get("model", ""),
        "steps": params.get("steps", 0),
        "cfg": params.get("cfg", 0.0),
        "seed": params.get("seed", -1),
        "width": params.get("width", 0),
        "height": params.get("height", 0),
        "image_url": gen.get("image_url"),
        "title": body.title,
        "description": body.description,
        "tags": body.tags[:10],  # limit to 10 tags
        "nsfw": body.nsfw,
        "public": body.public,
        "likes_count": 0,
    }

    try:
        result = supabase.table("gallery").insert(gallery_row).execute()
    except Exception as e:
        logger.error(f"Failed to publish to gallery: {e}")
        raise HTTPException(status_code=500, detail="Failed to publish to gallery")

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to publish to gallery")

    row = result.data[0]
    author_name = _get_author_name(profile)
    return _row_to_item(row, liked_by_me=False, author_name=author_name)


# ─── GET /gallery ───

@router.get("/", response_model=CommunityGalleryListResponse)
async def list_gallery(
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    sort: str = Query("latest", pattern="^(latest|trending|popular)$"),
    nsfw: bool = Query(False),
    tag: str = Query(None),
    request: Request = None,
    settings: Settings = Depends(get_settings),
):
    """List public gallery items with pagination.

    - sort=latest: ordered by created_at descending
    - sort=trending: ordered by likes received in the last 7 days
    - nsfw=true: include NSFW items (hidden by default)
    - tag: filter by a specific tag
    """
    supabase = get_supabase(settings)

    # Try to get current user for liked_by_me (optional auth)
    current_user_id = None
    auth_header = request.headers.get("authorization", "") if request else ""
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            user_response = supabase.auth.get_user(token)
            current_user_id = user_response.user.id
        except Exception:
            pass  # Not logged in or invalid token; continue without user context

    query = (
        supabase.table("gallery")
        .select("*, users!gallery_user_id_fkey(display_name, email)", count="exact")
        .eq("public", True)
    )

    # NSFW filter
    if not nsfw:
        query = query.eq("nsfw", False)

    # Tag filter
    if tag:
        query = query.contains("tags", [tag])

    # Sorting
    if sort == "trending":
        # For trending, filter to items with recent activity and sort by likes_count
        seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        query = query.gte("created_at", seven_days_ago)
        query = query.order("likes_count", desc=True)
    elif sort == "popular":
        # All-time most liked
        query = query.order("likes_count", desc=True)
    else:
        query = query.order("created_at", desc=True)

    # Pagination
    offset = (page - 1) * limit
    result = query.range(offset, offset + limit - 1).execute()

    # Get user's likes for these items
    liked_ids: set[str] = set()
    if current_user_id and result.data:
        gallery_ids = [row["id"] for row in result.data]
        try:
            likes_result = (
                supabase.table("gallery_likes")
                .select("gallery_id")
                .eq("user_id", current_user_id)
                .in_("gallery_id", gallery_ids)
                .execute()
            )
            liked_ids = {like["gallery_id"] for like in (likes_result.data or [])}
        except Exception:
            pass

    # Fetch video_url from generations for items missing image_url
    rows = result.data or []
    job_ids_needing_video = [row["job_id"] for row in rows if not row.get("image_url") and row.get("job_id")]
    video_map: dict[str, str] = {}
    if job_ids_needing_video:
        try:
            gen_result = (
                supabase.table("generations")
                .select("id, video_url")
                .in_("id", job_ids_needing_video)
                .execute()
            )
            for gen in (gen_result.data or []):
                if gen.get("video_url"):
                    video_map[gen["id"]] = gen["video_url"]
        except Exception:
            pass

    items = []
    for row in rows:
        # Inject video_url from generations if gallery row doesn't have image
        if not row.get("image_url") and row.get("job_id") in video_map:
            row["video_url"] = video_map[row["job_id"]]
        user_data = row.get("users", {})
        author_name = _get_author_name(user_data)
        liked = row["id"] in liked_ids
        items.append(_row_to_item(row, liked_by_me=liked, author_name=author_name))

    return CommunityGalleryListResponse(
        items=items,
        total=result.count or 0,
        page=page,
        limit=limit,
    )


# ─── GET /gallery/user/{user_id} ───
# NOTE: This route MUST be defined before /{gallery_id} to avoid
# FastAPI matching "user" as a gallery_id path parameter.

@router.get("/user/{user_id}", response_model=CommunityGalleryListResponse)
async def get_user_gallery(
    user_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    nsfw: bool = Query(False),
    request: Request = None,
    settings: Settings = Depends(get_settings),
):
    """Get a specific user's public gallery items.

    If the requester is the owner, private items are also returned.
    """
    supabase = get_supabase(settings)

    # Check if requester is the owner (optional auth)
    is_owner = False
    current_user_id = None
    auth_header = request.headers.get("authorization", "") if request else ""
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            user_response = supabase.auth.get_user(token)
            current_user_id = str(user_response.user.id)
            is_owner = current_user_id == user_id
        except Exception:
            pass

    query = (
        supabase.table("gallery")
        .select("*, users!gallery_user_id_fkey(display_name, email)", count="exact")
        .eq("user_id", user_id)
    )

    # Non-owners only see public items
    if not is_owner:
        query = query.eq("public", True)

    # NSFW filter: owners always see their NSFW items
    if not nsfw and not is_owner:
        query = query.eq("nsfw", False)

    query = query.order("created_at", desc=True)

    offset = (page - 1) * limit
    result = query.range(offset, offset + limit - 1).execute()

    # Get liked status for current user
    liked_ids: set[str] = set()
    if current_user_id and result.data:
        gallery_ids = [row["id"] for row in result.data]
        try:
            likes_result = (
                supabase.table("gallery_likes")
                .select("gallery_id")
                .eq("user_id", current_user_id)
                .in_("gallery_id", gallery_ids)
                .execute()
            )
            liked_ids = {like["gallery_id"] for like in (likes_result.data or [])}
        except Exception:
            pass

    items = []
    for row in result.data or []:
        user_data = row.get("users", {})
        author_name = _get_author_name(user_data)
        liked = row["id"] in liked_ids
        items.append(_row_to_item(row, liked_by_me=liked, author_name=author_name))

    return CommunityGalleryListResponse(
        items=items,
        total=result.count or 0,
        page=page,
        limit=limit,
    )


# ─── GET /gallery/{id} ───

@router.get("/{gallery_id}", response_model=CommunityGalleryItem)
async def get_gallery_item(
    gallery_id: str,
    request: Request = None,
    settings: Settings = Depends(get_settings),
):
    """Get a single gallery item with full prompt and generation info."""
    supabase = get_supabase(settings)

    try:
        result = (
            supabase.table("gallery")
            .select("*, users!gallery_user_id_fkey(display_name, email)")
            .eq("id", gallery_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Gallery item not found")

    if not result.data:
        raise HTTPException(status_code=404, detail="Gallery item not found")

    row = result.data

    # Only public items are visible (unless owner)
    if not row.get("public", True):
        # Check if requester is the owner
        current_user_id = None
        auth_header = request.headers.get("authorization", "") if request else ""
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            try:
                user_response = supabase.auth.get_user(token)
                current_user_id = user_response.user.id
            except Exception:
                pass
        if current_user_id != row.get("user_id"):
            raise HTTPException(status_code=404, detail="Gallery item not found")

    # Check if current user has liked this item
    liked_by_me = False
    auth_header = request.headers.get("authorization", "") if request else ""
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            user_response = supabase.auth.get_user(token)
            like_check = (
                supabase.table("gallery_likes")
                .select("id")
                .eq("user_id", user_response.user.id)
                .eq("gallery_id", gallery_id)
                .maybe_single()
                .execute()
            )
            liked_by_me = bool(like_check and like_check.data)
        except Exception:
            pass

    user_data = row.get("users", {})
    author_name = _get_author_name(user_data)
    return _row_to_item(row, liked_by_me=liked_by_me, author_name=author_name)


# ─── POST /gallery/{id}/publish ───

@router.post("/{gallery_id}/publish")
async def publish_gallery_item(
    gallery_id: str,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Set a gallery item to public (visible in Explore)."""
    user, profile, supabase = await _auth_and_profile(request, settings)

    # Verify ownership
    try:
        item = (
            supabase.table("gallery")
            .select("id, user_id, nsfw")
            .eq("id", gallery_id)
            .eq("user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Gallery item not found")

    if not item.data:
        raise HTTPException(status_code=404, detail="Gallery item not found")

    # NSFW region check (admins bypass via can_publish_nsfw)
    if item.data.get("nsfw"):
        region = profile.get("region_code", "US")
        user_email = profile.get("email", "")
        if not can_publish_nsfw(region, user_email):
            raise HTTPException(
                status_code=403,
                detail="NSFW content cannot be published publicly in your region.",
            )

    try:
        supabase.table("gallery").update({"public": True}).eq("id", gallery_id).execute()
    except Exception as e:
        logger.error(f"Failed to publish gallery item: {e}")
        raise HTTPException(status_code=500, detail="Failed to publish")

    return {"id": gallery_id, "public": True}


# ─── POST /gallery/{id}/unpublish ───

@router.post("/{gallery_id}/unpublish")
async def unpublish_gallery_item(
    gallery_id: str,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Set a gallery item to private (hidden from Explore)."""
    user, profile, supabase = await _auth_and_profile(request, settings)

    # Verify ownership
    try:
        item = (
            supabase.table("gallery")
            .select("id, user_id")
            .eq("id", gallery_id)
            .eq("user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Gallery item not found")

    if not item.data:
        raise HTTPException(status_code=404, detail="Gallery item not found")

    try:
        supabase.table("gallery").update({"public": False}).eq("id", gallery_id).execute()
    except Exception as e:
        logger.error(f"Failed to unpublish gallery item: {e}")
        raise HTTPException(status_code=500, detail="Failed to unpublish")

    return {"id": gallery_id, "public": False}


# ─── DELETE /gallery/{id} ───

@router.delete("/{gallery_id}")
async def delete_gallery_item(
    gallery_id: str,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Delete a gallery item. Only the owner can delete. Checks both gallery and generations tables."""
    user, profile, supabase = await _auth_and_profile(request, settings)

    # Verify ownership — check gallery table first, then generations as fallback
    found_in = None
    try:
        item = (
            supabase.table("gallery")
            .select("id, user_id")
            .eq("id", gallery_id)
            .eq("user_id", user.id)
            .single()
            .execute()
        )
        if item.data:
            found_in = "gallery"
    except Exception:
        pass

    if not found_in:
        try:
            gen_item = (
                supabase.table("generations")
                .select("id, user_id")
                .eq("id", gallery_id)
                .eq("user_id", user.id)
                .single()
                .execute()
            )
            if gen_item.data:
                found_in = "generations"
        except Exception:
            pass

    if not found_in:
        raise HTTPException(status_code=404, detail="Item not found")

    try:
        # Delete likes first
        supabase.table("gallery_likes").delete().eq("gallery_id", gallery_id).execute()
    except Exception:
        pass  # Non-fatal

    try:
        supabase.table("gallery").delete().eq("id", gallery_id).execute()
    except Exception as e:
        logger.error(f"Failed to delete gallery item: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete")

    # Also delete from generations table
    try:
        supabase.table("generations").delete().eq("id", gallery_id).execute()
    except Exception:
        pass  # Non-fatal, might not exist there

    return {"id": gallery_id, "deleted": True}


# ─── POST /gallery/{id}/like ───

@router.post("/{gallery_id}/like")
async def toggle_like(
    gallery_id: str,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Toggle like on a gallery item. Requires authentication.

    If the user has already liked the item, the like is removed.
    Returns the updated like count and whether the user now likes it.
    """
    user, profile, supabase = await _auth_and_profile(request, settings)

    # Verify gallery item exists
    try:
        gallery_result = (
            supabase.table("gallery")
            .select("id, likes_count")
            .eq("id", gallery_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Gallery item not found")

    if not gallery_result.data:
        raise HTTPException(status_code=404, detail="Gallery item not found")

    current_count = gallery_result.data.get("likes_count", 0)

    # Check if already liked
    try:
        existing_like = (
            supabase.table("gallery_likes")
            .select("id")
            .eq("user_id", user.id)
            .eq("gallery_id", gallery_id)
            .maybe_single()
            .execute()
        )
    except Exception:
        existing_like = None

    if existing_like and existing_like.data:
        # Unlike: remove the like
        try:
            supabase.table("gallery_likes").delete().eq(
                "id", existing_like.data["id"]
            ).execute()
        except Exception as e:
            logger.error(f"Failed to remove like: {e}")
            raise HTTPException(status_code=500, detail="Failed to remove like")

        new_count = max(0, current_count - 1)
        try:
            supabase.table("gallery").update(
                {"likes_count": new_count}
            ).eq("id", gallery_id).execute()
        except Exception as e:
            logger.error(f"Failed to update likes_count: {e}")

        return {"liked": False, "likes_count": new_count}
    else:
        # Like: add a new like
        try:
            supabase.table("gallery_likes").insert({
                "user_id": user.id,
                "gallery_id": gallery_id,
            }).execute()
        except Exception as e:
            logger.error(f"Failed to add like: {e}")
            raise HTTPException(status_code=500, detail="Failed to add like")

        new_count = current_count + 1
        try:
            supabase.table("gallery").update(
                {"likes_count": new_count}
            ).eq("id", gallery_id).execute()
        except Exception as e:
            logger.error(f"Failed to update likes_count: {e}")

        return {"liked": True, "likes_count": new_count}


# ─── POST /gallery/{id}/remix ───

@router.post("/{gallery_id}/remix", response_model=RemixResponse)
async def get_remix_data(
    gallery_id: str,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Get generation parameters for remixing. Requires authentication.

    Returns the prompt, model, and all settings so the frontend
    can auto-fill the generation form.
    """
    user, profile, supabase = await _auth_and_profile(request, settings)

    try:
        result = (
            supabase.table("gallery")
            .select("prompt, negative_prompt, model, steps, cfg, seed, width, height")
            .eq("id", gallery_id)
            .eq("public", True)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Gallery item not found")

    if not result.data:
        raise HTTPException(status_code=404, detail="Gallery item not found or not public")

    row = result.data
    return RemixResponse(
        prompt=row.get("prompt", ""),
        negative_prompt=row.get("negative_prompt", ""),
        model=row.get("model", ""),
        steps=row.get("steps", 0),
        cfg=row.get("cfg", 0.0),
        seed=row.get("seed", -1),
        width=row.get("width", 0),
        height=row.get("height", 0),
    )


# ─── GET /gallery/user/{user_id}/profile ───

@router.get("/user/{user_id}/profile")
async def get_user_profile_public(
    user_id: str,
    request: Request = None,
    settings: Settings = Depends(get_settings),
):
    """Get a user's public profile with stats (gallery count, followers, following)."""
    supabase = get_supabase(settings)

    # Get user info
    profile = await get_user_profile(supabase, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    # Count public gallery items
    try:
        gallery_count_result = (
            supabase.table("gallery")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("public", True)
            .execute()
        )
        gallery_count = gallery_count_result.count or 0
    except Exception:
        gallery_count = 0

    # Count followers
    try:
        followers_result = (
            supabase.table("follows")
            .select("id", count="exact")
            .eq("following_id", user_id)
            .execute()
        )
        followers_count = followers_result.count or 0
    except Exception:
        followers_count = 0

    # Count following
    try:
        following_result = (
            supabase.table("follows")
            .select("id", count="exact")
            .eq("follower_id", user_id)
            .execute()
        )
        following_count = following_result.count or 0
    except Exception:
        following_count = 0

    # Check if current user follows this user
    is_following = False
    auth_header = request.headers.get("authorization", "") if request else ""
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            user_response = supabase.auth.get_user(token)
            current_user_id = user_response.user.id
            if current_user_id != user_id:
                follow_check = (
                    supabase.table("follows")
                    .select("id")
                    .eq("follower_id", current_user_id)
                    .eq("following_id", user_id)
                    .maybe_single()
                    .execute()
                )
                is_following = bool(follow_check and follow_check.data)
        except Exception:
            pass

    author_name = _get_author_name(profile)

    return {
        "id": user_id,
        "display_name": author_name,
        "bio": profile.get("bio", ""),
        "avatar_url": profile.get("avatar_url"),
        "plan": profile.get("plan", "free"),
        "gallery_count": gallery_count,
        "followers_count": followers_count,
        "following_count": following_count,
        "is_following": is_following,
        "created_at": profile.get("created_at"),
    }


# ─── POST /gallery/user/{user_id}/follow ───

@router.post("/user/{user_id}/follow")
async def follow_user(
    user_id: str,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Follow a user. Requires authentication."""
    user, profile, supabase = await _auth_and_profile(request, settings)

    if str(user.id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    # Check if already following
    try:
        existing = (
            supabase.table("follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", user_id)
            .maybe_single()
            .execute()
        )
        if existing and existing.data:
            return {"following": True, "message": "Already following"}
    except Exception:
        pass

    try:
        supabase.table("follows").insert({
            "follower_id": user.id,
            "following_id": user_id,
        }).execute()
    except Exception as e:
        logger.error(f"Failed to follow user: {e}")
        raise HTTPException(status_code=500, detail="Failed to follow user")

    return {"following": True}


# ─── DELETE /gallery/user/{user_id}/follow ───

@router.delete("/user/{user_id}/follow")
async def unfollow_user(
    user_id: str,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Unfollow a user. Requires authentication."""
    user, profile, supabase = await _auth_and_profile(request, settings)

    try:
        supabase.table("follows").delete().eq(
            "follower_id", user.id
        ).eq("following_id", user_id).execute()
    except Exception as e:
        logger.error(f"Failed to unfollow user: {e}")
        raise HTTPException(status_code=500, detail="Failed to unfollow user")

    return {"following": False}


# ─── GET /gallery/user/{user_id}/followers ───

@router.get("/user/{user_id}/followers")
async def get_followers(
    user_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    settings: Settings = Depends(get_settings),
):
    """Get a user's followers list."""
    supabase = get_supabase(settings)

    offset = (page - 1) * limit
    try:
        result = (
            supabase.table("follows")
            .select("follower_id, created_at, users!follows_follower_id_fkey(display_name, email, avatar_url)", count="exact")
            .eq("following_id", user_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
    except Exception:
        return {"items": [], "total": 0, "page": page, "limit": limit}

    items = []
    for row in result.data or []:
        user_data = row.get("users", {})
        items.append({
            "id": row["follower_id"],
            "display_name": _get_author_name(user_data),
            "avatar_url": user_data.get("avatar_url") if user_data else None,
            "followed_at": row["created_at"],
        })

    return {"items": items, "total": result.count or 0, "page": page, "limit": limit}


# ─── GET /gallery/user/{user_id}/following ───

@router.get("/user/{user_id}/following")
async def get_following(
    user_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    settings: Settings = Depends(get_settings),
):
    """Get list of users that this user follows."""
    supabase = get_supabase(settings)

    offset = (page - 1) * limit
    try:
        result = (
            supabase.table("follows")
            .select("following_id, created_at, users!follows_following_id_fkey(display_name, email, avatar_url)", count="exact")
            .eq("follower_id", user_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
    except Exception:
        return {"items": [], "total": 0, "page": page, "limit": limit}

    items = []
    for row in result.data or []:
        user_data = row.get("users", {})
        items.append({
            "id": row["following_id"],
            "display_name": _get_author_name(user_data),
            "avatar_url": user_data.get("avatar_url") if user_data else None,
            "followed_at": row["created_at"],
        })

    return {"items": items, "total": result.count or 0, "page": page, "limit": limit}
