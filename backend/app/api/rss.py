"""RSS/Atom feeds for user gallery automation.

These feeds let users hook their gallery into free automation tools
(Zapier, IFTTT, Make.com) so new public creations auto-post to X, etc.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response

from app.core.config import Settings, get_settings
from app.services.supabase import get_supabase

router = APIRouter(prefix="/rss", tags=["rss"])


def _escape(s: str) -> str:
    return (
        (s or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def _build_items(rows: list[dict]) -> str:
    """Build the <item>...</item> XML string for a list of gallery rows."""
    items_xml: list[str] = []
    for row in rows or []:
        gid = row["id"]
        title = row.get("title") or (row.get("prompt") or "")[:80]
        prompt = (row.get("prompt") or "")[:500]
        img = row.get("image_url") or ""
        vid = row.get("video_url") or ""
        media = vid or img
        mime = "video/mp4" if vid else "image/jpeg"
        created = row.get("created_at") or datetime.now(timezone.utc).isoformat()
        try:
            pub_date = datetime.fromisoformat(
                created.replace("Z", "+00:00")
            ).strftime("%a, %d %b %Y %H:%M:%S +0000")
        except Exception:
            pub_date = datetime.now(timezone.utc).strftime(
                "%a, %d %b %Y %H:%M:%S +0000"
            )
        link = f"https://egaku-ai.com/gallery/{gid}"
        tags = row.get("tags") or []
        hashtags = " ".join(
            f"#{str(t).replace(' ', '')}" for t in tags[:3] if t
        )
        desc = f"{prompt} {hashtags} #AIart #AIgenerated #StableDiffusion #FluxAI #egakuai".strip()
        items_xml.append(
            f'''
  <item>
    <title>{_escape(title)}</title>
    <description>{_escape(desc)}</description>
    <link>{link}</link>
    <guid isPermaLink="true">{link}</guid>
    <pubDate>{pub_date}</pubDate>
    <enclosure url="{_escape(media)}" type="{mime}" />
  </item>'''
        )
    return "".join(items_xml)


def _wrap_channel(title: str, link: str, description: str, items_xml: str) -> str:
    last_build = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>{_escape(title)}</title>
  <link>{link}</link>
  <description>{_escape(description)}</description>
  <language>en</language>
  <lastBuildDate>{last_build}</lastBuildDate>
  {items_xml}
</channel>
</rss>'''


@router.get("/user/{user_id}.xml")
async def user_rss(user_id: str, settings: Settings = Depends(get_settings)):
    """RSS 2.0 feed of a user's recent public SFW gallery items."""
    supabase = get_supabase(settings)
    try:
        result = (
            supabase.table("gallery")
            .select(
                "id, title, prompt, image_url, video_url, nsfw, created_at, tags, model"
            )
            .eq("user_id", user_id)
            .eq("public", True)
            .eq("nsfw", False)
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Feed unavailable")

    items_xml = _build_items(result.data or [])
    xml = _wrap_channel(
        title=f"EGAKU AI — User {user_id[:8]}",
        link=f"https://egaku-ai.com/user/{user_id}",
        description="AI-generated art from EGAKU AI",
        items_xml=items_xml,
    )
    return Response(content=xml, media_type="application/rss+xml; charset=utf-8")


@router.get("/public/latest.xml")
async def public_rss(settings: Settings = Depends(get_settings)):
    """RSS 2.0 feed of latest public SFW gallery items across the site."""
    supabase = get_supabase(settings)
    try:
        result = (
            supabase.table("gallery")
            .select(
                "id, title, prompt, image_url, video_url, nsfw, created_at, tags, model"
            )
            .eq("public", True)
            .eq("nsfw", False)
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Feed unavailable")

    items_xml = _build_items(result.data or [])
    xml = _wrap_channel(
        title="EGAKU AI — Latest Creations",
        link="https://egaku-ai.com/explore",
        description="Latest public AI-generated art from EGAKU AI",
        items_xml=items_xml,
    )
    return Response(content=xml, media_type="application/rss+xml; charset=utf-8")
