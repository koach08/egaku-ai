"""Community Prompt Battle endpoints.

Real 1v1 prompt battles: Player A creates with a theme + prompt and an
image, Player B accepts the challenge with a counter-prompt, then the
community votes for up to 7 days (or 50 votes). ELO-like stats are
updated at close time.
"""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.config import Settings, get_settings
from app.core.legal import check_prompt_compliance, is_admin
from app.core.region import detect_region
from app.core.security import get_client_ip
from app.models.schemas import (
    CREDIT_COSTS,
    BattleAcceptRequest,
    BattleCreateRequest,
    BattleVoteRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/battle", tags=["battle"])


VOTING_DURATION_DAYS = 7
MAX_VOTES_AUTOCLOSE = 50
MAX_PENDING_BATTLES_PER_USER = 3
MAX_BATTLES_PER_DAY_PER_USER = 10


# ────────────────────────── helpers ──────────────────────────

async def _auth(request: Request, settings: Settings):
    """Require auth. Returns (user, profile, supabase)."""
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


async def _auth_optional(request: Request, settings: Settings):
    """Optional auth. Returns (user_id|None, supabase)."""
    from app.services.supabase import get_supabase

    supabase = get_supabase(settings)
    auth_header = request.headers.get("authorization", "")
    user_id = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            resp = supabase.auth.get_user(token)
            user_id = resp.user.id
        except Exception:
            user_id = None
    return user_id, supabase


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_dt(value) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    try:
        # Supabase returns ISO-8601 strings; tolerate trailing 'Z'
        s = value.replace("Z", "+00:00") if isinstance(value, str) else value
        dt = datetime.fromisoformat(s)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


async def _generate_battle_image(settings: Settings, prompt: str, nsfw: bool) -> str | None:
    """Generate an image via fal.ai Flux Dev. Returns temporary URL or None."""
    from app.services.fal_ai import FalClient

    fal_client = FalClient(settings)
    if not fal_client.is_available():
        return None

    model_id = "fal_flux_realism" if nsfw else "fal_flux_dev"
    try:
        result = await fal_client.submit_txt2img(
            prompt=prompt,
            model_id=model_id,
            width=1024,
            height=1024,
            steps=20,
            cfg=7.0,
            seed=-1,
        )
        url = fal_client.extract_image_url(result)
        return url
    except Exception as e:
        logger.error("Battle image generation failed: %s", e)
        return None


async def _persist_battle_image(supabase, image_url: str, battle_id: str, side: str) -> str:
    """Download a temporary image URL and stash it in Supabase Storage
    at self-hosted/battles/{battle_id}_{side}.{ext}. Returns the permanent URL,
    or the original URL if persisting fails."""
    import httpx

    try:
        if image_url.startswith("data:"):
            import base64 as b64mod
            header, b64data = image_url.split(",", 1)
            data = b64mod.b64decode(b64data)
            content_type = header.split(":")[1].split(";")[0] if ":" in header else "image/png"
        else:
            async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
                resp = await client.get(image_url, headers={"User-Agent": "Mozilla/5.0"})
                resp.raise_for_status()
                data = resp.content
                content_type = resp.headers.get("content-type", "image/png")

        if "jpeg" in content_type or "jpg" in content_type:
            ext = "jpg"
        elif "webp" in content_type:
            ext = "webp"
        else:
            ext = "png"

        storage_path = f"battles/{battle_id}_{side}.{ext}"
        supabase.storage.from_("self-hosted").upload(
            storage_path, data,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        return f"{supabase.supabase_url}/storage/v1/object/public/self-hosted/{storage_path}"
    except Exception as e:
        logger.warning("Failed to persist battle image: %s", e)
        return image_url


def _user_display_name(supabase, user_id: str | None) -> str:
    if not user_id:
        return "Anonymous"
    try:
        res = supabase.table("users").select("display_name,email").eq("id", user_id).single().execute()
        data = (res.data if res else None) or {}
        name = (data.get("display_name") or "").strip()
        if name:
            return name
        email = (data.get("email") or "").strip()
        if "@" in email:
            return email.split("@", 1)[0]
    except Exception:
        pass
    return "Player"


def _update_elo(winner_rating: int, loser_rating: int, tie: bool = False) -> tuple[int, int]:
    """Returns (new_winner_rating, new_loser_rating). For tie, 'winner' is side A."""
    K = 32
    # expected score for A
    e_a = 1.0 / (1 + 10 ** ((loser_rating - winner_rating) / 400))
    e_b = 1.0 - e_a
    if tie:
        actual_a, actual_b = 0.5, 0.5
    else:
        actual_a, actual_b = 1.0, 0.0
    new_a = round(winner_rating + K * (actual_a - e_a))
    new_b = round(loser_rating + K * (actual_b - e_b))
    # clamp
    return max(800, min(2400, new_a)), max(800, min(2400, new_b))


async def _upsert_stats_row(supabase, user_id: str) -> dict:
    """Fetch or create a battle_stats row; returns the current row."""
    try:
        res = supabase.table("battle_stats").select("*").eq("user_id", user_id).maybe_single().execute()
        if res and res.data:
            return res.data
    except Exception:
        pass
    row = {
        "user_id": user_id, "wins": 0, "losses": 0, "ties": 0,
        "battles_total": 0, "total_votes_received": 0, "elo": 1200,
    }
    try:
        supabase.table("battle_stats").insert(row).execute()
    except Exception:
        # Race: refetch
        try:
            res = supabase.table("battle_stats").select("*").eq("user_id", user_id).maybe_single().execute()
            if res and res.data:
                return res.data
        except Exception:
            pass
    return row


async def _close_battle(supabase, battle: dict) -> dict:
    """Close a battle (compute winner, update stats). Returns updated row.
    Safe to call multiple times — no-op if already completed."""
    if battle.get("status") == "completed":
        return battle

    votes_a = int(battle.get("votes_a") or 0)
    votes_b = int(battle.get("votes_b") or 0)
    if votes_a > votes_b:
        winner = "A"
    elif votes_b > votes_a:
        winner = "B"
    else:
        winner = "T"

    updates = {
        "status": "completed",
        "winner": winner,
        "closed_at": _now_iso(),
    }
    try:
        result = supabase.table("battles").update(updates).eq("id", battle["id"]).eq("status", "voting").execute()
    except Exception as e:
        logger.error("Failed to close battle %s: %s", battle.get("id"), e)
        return battle

    # If the conditional update matched 0 rows, another request closed it first.
    updated_rows = result.data if result else None
    if not updated_rows:
        try:
            res = supabase.table("battles").select("*").eq("id", battle["id"]).single().execute()
            return res.data if res else battle
        except Exception:
            return battle

    closed = updated_rows[0]

    # Update stats for both players (if opponent accepted)
    creator_id = closed.get("creator_id")
    opponent_id = closed.get("opponent_id")

    if creator_id and opponent_id:
        creator_stats = await _upsert_stats_row(supabase, creator_id)
        opponent_stats = await _upsert_stats_row(supabase, opponent_id)

        creator_update = {
            "total_votes_received": int(creator_stats.get("total_votes_received", 0)) + votes_a,
            "updated_at": _now_iso(),
        }
        opponent_update = {
            "total_votes_received": int(opponent_stats.get("total_votes_received", 0)) + votes_b,
            "updated_at": _now_iso(),
        }

        if winner == "A":
            creator_update["wins"] = int(creator_stats.get("wins", 0)) + 1
            opponent_update["losses"] = int(opponent_stats.get("losses", 0)) + 1
            new_a, new_b = _update_elo(int(creator_stats.get("elo", 1200)), int(opponent_stats.get("elo", 1200)))
            creator_update["elo"] = new_a
            opponent_update["elo"] = new_b
        elif winner == "B":
            opponent_update["wins"] = int(opponent_stats.get("wins", 0)) + 1
            creator_update["losses"] = int(creator_stats.get("losses", 0)) + 1
            new_b, new_a = _update_elo(int(opponent_stats.get("elo", 1200)), int(creator_stats.get("elo", 1200)))
            creator_update["elo"] = new_a
            opponent_update["elo"] = new_b
        else:  # tie
            creator_update["ties"] = int(creator_stats.get("ties", 0)) + 1
            opponent_update["ties"] = int(opponent_stats.get("ties", 0)) + 1
            new_a, new_b = _update_elo(
                int(creator_stats.get("elo", 1200)),
                int(opponent_stats.get("elo", 1200)),
                tie=True,
            )
            creator_update["elo"] = new_a
            opponent_update["elo"] = new_b

        try:
            supabase.table("battle_stats").update(creator_update).eq("user_id", creator_id).execute()
        except Exception as e:
            logger.error("Failed to update creator stats: %s", e)
        try:
            supabase.table("battle_stats").update(opponent_update).eq("user_id", opponent_id).execute()
        except Exception as e:
            logger.error("Failed to update opponent stats: %s", e)

    return closed


async def _maybe_autoclose(supabase, battle: dict) -> dict:
    """If battle is voting and past deadline, close it. Returns updated battle."""
    if battle.get("status") != "voting":
        return battle
    ends = _parse_dt(battle.get("voting_ends_at"))
    if ends and datetime.now(timezone.utc) >= ends:
        return await _close_battle(supabase, battle)
    votes_a = int(battle.get("votes_a") or 0)
    votes_b = int(battle.get("votes_b") or 0)
    if (votes_a + votes_b) >= MAX_VOTES_AUTOCLOSE:
        return await _close_battle(supabase, battle)
    return battle


def _serialize_battle(
    row: dict,
    *,
    creator_name: str | None = None,
    opponent_name: str | None = None,
    has_voted: str | None = None,
) -> dict:
    votes_a = int(row.get("votes_a") or 0)
    votes_b = int(row.get("votes_b") or 0)
    total_votes = votes_a + votes_b
    return {
        "id": row.get("id"),
        "creator_id": row.get("creator_id"),
        "opponent_id": row.get("opponent_id"),
        "creator_name": creator_name or "Player",
        "opponent_name": opponent_name,
        "theme": row.get("theme"),
        "prompt_a": row.get("prompt_a"),
        "image_a_url": row.get("image_a_url"),
        "prompt_b": row.get("prompt_b"),
        "image_b_url": row.get("image_b_url"),
        "model_a": row.get("model_a"),
        "model_b": row.get("model_b"),
        "status": row.get("status"),
        "votes_a": votes_a,
        "votes_b": votes_b,
        "total_votes": total_votes,
        "winner": row.get("winner"),
        "nsfw": bool(row.get("nsfw")),
        "created_at": row.get("created_at"),
        "voting_ends_at": row.get("voting_ends_at"),
        "closed_at": row.get("closed_at"),
        "has_voted": has_voted,  # 'A'|'B'|None
    }


# ────────────────────────── endpoints ──────────────────────────

@router.post("/create")
async def create_battle(
    body: BattleCreateRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Create a new battle as Player A."""
    is_safe, flagged = check_prompt_compliance(body.prompt)
    if not is_safe:
        raise HTTPException(
            status_code=400,
            detail=f"Content policy violation: {', '.join(flagged)}",
        )

    user, profile, supabase = await _auth(request, settings)
    user_email = profile.get("email", "")

    # NSFW gate: age verification + KR region block
    if body.nsfw:
        region = profile.get("region_code", "")
        if region == "KR" and not is_admin(user_email):
            raise HTTPException(
                status_code=451,
                detail="NSFW content is not available in your region due to local laws.",
            )
        if not profile.get("age_verified") and not is_admin(user_email):
            raise HTTPException(
                status_code=403,
                detail="Age verification required for NSFW content",
            )

    # Limit: max 3 pending battles per user (waiting_opponent status)
    try:
        pending = (
            supabase.table("battles")
            .select("id", count="exact")
            .eq("creator_id", user.id)
            .eq("status", "waiting_opponent")
            .execute()
        )
        pending_count = pending.count or 0
    except Exception:
        pending_count = 0
    if pending_count >= MAX_PENDING_BATTLES_PER_USER:
        raise HTTPException(
            status_code=429,
            detail=f"You already have {pending_count} pending battles. Wait for them to be accepted first.",
        )

    # Rate limit: max 10 battles created per day
    try:
        day_ago = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        today_count_res = (
            supabase.table("battles")
            .select("id", count="exact")
            .eq("creator_id", user.id)
            .gte("created_at", day_ago)
            .execute()
        )
        today_count = today_count_res.count or 0
    except Exception:
        today_count = 0
    if today_count >= MAX_BATTLES_PER_DAY_PER_USER:
        raise HTTPException(
            status_code=429,
            detail=f"Daily battle limit reached ({MAX_BATTLES_PER_DAY_PER_USER}). Try again tomorrow.",
        )

    # Deduct credits
    from app.services.supabase import deduct_credits
    credits_needed = CREDIT_COSTS["battle_create"]
    ok = await deduct_credits(supabase, user.id, credits_needed, "Battle create (Player A)")
    if not ok:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Generate image A
    img_url = await _generate_battle_image(settings, body.prompt, body.nsfw)
    if not img_url:
        raise HTTPException(status_code=503, detail="Image generation failed. Please try again.")

    # Insert battle to get ID, then persist image and update
    insert_payload = {
        "creator_id": user.id,
        "theme": body.theme.strip(),
        "prompt_a": body.prompt.strip(),
        "image_a_url": img_url,
        "model_a": "fal_flux_realism" if body.nsfw else "fal_flux_dev",
        "status": "waiting_opponent",
        "nsfw": body.nsfw,
    }
    try:
        inserted = supabase.table("battles").insert(insert_payload).execute()
        battle = inserted.data[0]
    except Exception as e:
        logger.error("Failed to insert battle: %s", e)
        raise HTTPException(status_code=500, detail="Failed to save battle")

    battle_id = battle["id"]

    # Persist image to permanent storage
    permanent_url = await _persist_battle_image(supabase, img_url, battle_id, "a")
    if permanent_url != img_url:
        try:
            upd = supabase.table("battles").update({"image_a_url": permanent_url}).eq("id", battle_id).execute()
            if upd and upd.data:
                battle = upd.data[0]
        except Exception as e:
            logger.warning("Failed to update persisted image URL: %s", e)

    # Bump creator battles_total stat (upsert)
    stats = await _upsert_stats_row(supabase, user.id)
    try:
        supabase.table("battle_stats").update({
            "battles_total": int(stats.get("battles_total", 0)) + 1,
            "updated_at": _now_iso(),
        }).eq("user_id", user.id).execute()
    except Exception:
        pass

    creator_name = _user_display_name(supabase, user.id)
    return _serialize_battle(battle, creator_name=creator_name)


@router.post("/{battle_id}/accept")
async def accept_battle(
    battle_id: str,
    body: BattleAcceptRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Accept a challenge as Player B."""
    is_safe, flagged = check_prompt_compliance(body.prompt)
    if not is_safe:
        raise HTTPException(
            status_code=400,
            detail=f"Content policy violation: {', '.join(flagged)}",
        )

    user, profile, supabase = await _auth(request, settings)
    user_email = profile.get("email", "")

    # Fetch the battle
    try:
        res = supabase.table("battles").select("*").eq("id", battle_id).single().execute()
        battle = res.data if res else None
    except Exception:
        battle = None
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    if battle.get("status") != "waiting_opponent":
        raise HTTPException(status_code=400, detail="This battle is not accepting challengers.")
    if str(battle.get("creator_id")) == str(user.id):
        raise HTTPException(status_code=400, detail="You can't accept your own battle.")

    nsfw = bool(battle.get("nsfw"))
    if nsfw:
        region = profile.get("region_code", "")
        if region == "KR" and not is_admin(user_email):
            raise HTTPException(
                status_code=451,
                detail="NSFW battles are not available in your region due to local laws.",
            )
        if not profile.get("age_verified") and not is_admin(user_email):
            raise HTTPException(status_code=403, detail="Age verification required for NSFW content")

    # Rate limit (accept also counts toward daily battle limit)
    try:
        day_ago = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        today_count_res = (
            supabase.table("battles")
            .select("id", count="exact")
            .eq("opponent_id", user.id)
            .gte("created_at", day_ago)
            .execute()
        )
        today_count = today_count_res.count or 0
    except Exception:
        today_count = 0
    if today_count >= MAX_BATTLES_PER_DAY_PER_USER:
        raise HTTPException(
            status_code=429,
            detail=f"Daily battle limit reached ({MAX_BATTLES_PER_DAY_PER_USER}). Try again tomorrow.",
        )

    # Deduct credits
    from app.services.supabase import deduct_credits
    credits_needed = CREDIT_COSTS["battle_create"]
    ok = await deduct_credits(supabase, user.id, credits_needed, "Battle accept (Player B)")
    if not ok:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Generate image B
    img_url = await _generate_battle_image(settings, body.prompt, nsfw)
    if not img_url:
        raise HTTPException(status_code=503, detail="Image generation failed. Please try again.")

    # Persist image B to storage
    permanent_url = await _persist_battle_image(supabase, img_url, battle_id, "b")

    # Atomically transition to voting (only if still waiting)
    voting_ends = (datetime.now(timezone.utc) + timedelta(days=VOTING_DURATION_DAYS)).isoformat()
    updates = {
        "opponent_id": user.id,
        "prompt_b": body.prompt.strip(),
        "image_b_url": permanent_url,
        "model_b": "fal_flux_realism" if nsfw else "fal_flux_dev",
        "status": "voting",
        "voting_ends_at": voting_ends,
    }
    try:
        result = (
            supabase.table("battles")
            .update(updates)
            .eq("id", battle_id)
            .eq("status", "waiting_opponent")
            .execute()
        )
    except Exception as e:
        logger.error("Failed to accept battle: %s", e)
        raise HTTPException(status_code=500, detail="Failed to accept battle")

    if not (result and result.data):
        raise HTTPException(status_code=409, detail="Battle was already accepted by someone else.")

    updated = result.data[0]

    # Bump opponent battles_total
    stats = await _upsert_stats_row(supabase, user.id)
    try:
        supabase.table("battle_stats").update({
            "battles_total": int(stats.get("battles_total", 0)) + 1,
            "updated_at": _now_iso(),
        }).eq("user_id", user.id).execute()
    except Exception:
        pass

    creator_name = _user_display_name(supabase, updated.get("creator_id"))
    opponent_name = _user_display_name(supabase, updated.get("opponent_id"))
    return _serialize_battle(updated, creator_name=creator_name, opponent_name=opponent_name)


@router.get("/leaderboard")
async def battle_leaderboard(
    limit: int = 20,
    settings: Settings = Depends(get_settings),
):
    """Top users by elo."""
    from app.services.supabase import get_supabase

    supabase = get_supabase(settings)
    limit = max(1, min(100, limit))
    try:
        res = (
            supabase.table("battle_stats")
            .select("*")
            .order("elo", desc=True)
            .order("wins", desc=True)
            .limit(limit)
            .execute()
        )
        rows = res.data or []
    except Exception as e:
        logger.error("Leaderboard query failed: %s", e)
        rows = []

    # Enrich with display_name
    items = []
    for row in rows:
        name = _user_display_name(supabase, row.get("user_id"))
        items.append({
            "user_id": row.get("user_id"),
            "display_name": name,
            "wins": int(row.get("wins") or 0),
            "losses": int(row.get("losses") or 0),
            "ties": int(row.get("ties") or 0),
            "battles_total": int(row.get("battles_total") or 0),
            "total_votes_received": int(row.get("total_votes_received") or 0),
            "elo": int(row.get("elo") or 1200),
        })
    return {"items": items}


@router.get("/me")
async def my_battles(
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Current user's recent battles + stats."""
    user, _profile, supabase = await _auth(request, settings)

    try:
        creator_res = (
            supabase.table("battles").select("*")
            .eq("creator_id", user.id)
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        opponent_res = (
            supabase.table("battles").select("*")
            .eq("opponent_id", user.id)
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        rows = list((creator_res.data or []) + (opponent_res.data or []))
    except Exception as e:
        logger.error("my_battles query failed: %s", e)
        rows = []

    # Dedupe by id, keep most recent first
    seen = set()
    unique: list[dict] = []
    for r in rows:
        rid = r.get("id")
        if rid and rid not in seen:
            seen.add(rid)
            unique.append(r)
    unique.sort(key=lambda r: r.get("created_at") or "", reverse=True)
    unique = unique[:50]

    # Lazy autoclose any expired voting battles we're about to return
    processed: list[dict] = []
    for r in unique:
        r = await _maybe_autoclose(supabase, r)
        processed.append(r)

    # Serialize with names
    name_cache: dict[str, str] = {}

    def name_of(uid):
        if not uid:
            return None
        if uid in name_cache:
            return name_cache[uid]
        n = _user_display_name(supabase, uid)
        name_cache[uid] = n
        return n

    items = [
        _serialize_battle(
            r,
            creator_name=name_of(r.get("creator_id")),
            opponent_name=name_of(r.get("opponent_id")),
        )
        for r in processed
    ]

    # Stats
    stats = await _upsert_stats_row(supabase, user.id)
    stats_out = {
        "user_id": user.id,
        "wins": int(stats.get("wins") or 0),
        "losses": int(stats.get("losses") or 0),
        "ties": int(stats.get("ties") or 0),
        "battles_total": int(stats.get("battles_total") or 0),
        "total_votes_received": int(stats.get("total_votes_received") or 0),
        "elo": int(stats.get("elo") or 1200),
    }
    return {"items": items, "stats": stats_out}


@router.get("/list")
async def list_battles(
    request: Request,
    status: str = "voting",
    page: int = 1,
    limit: int = 20,
    nsfw: bool = False,
    settings: Settings = Depends(get_settings),
):
    """List battles by status."""
    from app.services.supabase import get_supabase

    supabase = get_supabase(settings)

    if status not in ("waiting_opponent", "voting", "completed"):
        raise HTTPException(status_code=400, detail="Invalid status filter")

    page = max(1, page)
    limit = max(1, min(50, limit))
    offset = (page - 1) * limit

    # Region-based NSFW filter (matches gallery pattern)
    ip = get_client_ip(request)
    viewer_region = detect_region(request, ip, settings)
    if viewer_region == "KR":
        nsfw = False  # Korean law — always hide NSFW

    try:
        q = (
            supabase.table("battles")
            .select("*", count="exact")
            .eq("status", status)
            .eq("nsfw", nsfw)
        )
        if status == "voting":
            q = q.order("voting_ends_at", desc=False)
        elif status == "waiting_opponent":
            q = q.order("created_at", desc=True)
        else:
            q = q.order("closed_at", desc=True)

        res = q.range(offset, offset + limit - 1).execute()
        rows = res.data or []
        total = res.count or 0
    except Exception as e:
        logger.error("list_battles failed: %s", e)
        rows, total = [], 0

    # Lazy autoclose any expired voting battles in the result set
    processed: list[dict] = []
    for r in rows:
        if status == "voting":
            r = await _maybe_autoclose(supabase, r)
            if r.get("status") != "voting":
                # If it closed during this request and we're listing voting,
                # drop it from the voting list.
                continue
        processed.append(r)

    # Resolve viewer identity once for has_voted
    viewer_id, _sb = await _auth_optional(request, settings)
    has_voted_map: dict[str, str] = {}
    if viewer_id and processed:
        try:
            ids = [r["id"] for r in processed]
            vres = (
                supabase.table("battle_votes")
                .select("battle_id,voted_for")
                .eq("voter_id", viewer_id)
                .in_("battle_id", ids)
                .execute()
            )
            for v in (vres.data or []):
                has_voted_map[v["battle_id"]] = v["voted_for"]
        except Exception:
            pass

    # Enrich with names
    name_cache: dict[str, str] = {}

    def name_of(uid):
        if not uid:
            return None
        if uid in name_cache:
            return name_cache[uid]
        n = _user_display_name(supabase, uid)
        name_cache[uid] = n
        return n

    items = [
        _serialize_battle(
            r,
            creator_name=name_of(r.get("creator_id")),
            opponent_name=name_of(r.get("opponent_id")),
            has_voted=has_voted_map.get(r.get("id")),
        )
        for r in processed
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/{battle_id}")
async def get_battle(
    battle_id: str,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Get a single battle."""
    from app.services.supabase import get_supabase

    supabase = get_supabase(settings)
    try:
        res = supabase.table("battles").select("*").eq("id", battle_id).single().execute()
        battle = res.data if res else None
    except Exception:
        battle = None
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    # Lazy autoclose
    battle = await _maybe_autoclose(supabase, battle)

    # Current-user's vote
    viewer_id, _sb = await _auth_optional(request, settings)
    has_voted = None
    if viewer_id:
        try:
            vres = (
                supabase.table("battle_votes")
                .select("voted_for")
                .eq("battle_id", battle_id)
                .eq("voter_id", viewer_id)
                .maybe_single()
                .execute()
            )
            if vres and vres.data:
                has_voted = vres.data.get("voted_for")
        except Exception:
            pass

    creator_name = _user_display_name(supabase, battle.get("creator_id"))
    opponent_name = _user_display_name(supabase, battle.get("opponent_id")) if battle.get("opponent_id") else None
    return _serialize_battle(battle, creator_name=creator_name, opponent_name=opponent_name, has_voted=has_voted)


@router.post("/{battle_id}/vote")
async def vote_battle(
    battle_id: str,
    body: BattleVoteRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    """Cast a vote on a battle."""
    user, _profile, supabase = await _auth(request, settings)

    # Fetch battle
    try:
        res = supabase.table("battles").select("*").eq("id", battle_id).single().execute()
        battle = res.data if res else None
    except Exception:
        battle = None
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    # Maybe autoclose first (no voting past deadline)
    battle = await _maybe_autoclose(supabase, battle)

    if battle.get("status") != "voting":
        raise HTTPException(status_code=400, detail="This battle is not accepting votes.")

    if str(battle.get("creator_id")) == str(user.id) or str(battle.get("opponent_id")) == str(user.id):
        raise HTTPException(status_code=400, detail="You can't vote on your own battle.")

    # Insert vote with unique constraint; on conflict do nothing
    try:
        ins = supabase.table("battle_votes").insert({
            "battle_id": battle_id,
            "voter_id": user.id,
            "voted_for": body.voted_for,
        }).execute()
        inserted_rows = ins.data or []
    except Exception as e:
        # Unique violation → user already voted
        msg = str(e).lower()
        if "duplicate" in msg or "unique" in msg or "23505" in msg:
            raise HTTPException(status_code=409, detail="You've already voted on this battle.")
        logger.error("Vote insert failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to record vote")

    if not inserted_rows:
        raise HTTPException(status_code=409, detail="You've already voted on this battle.")

    # Atomic increment: re-read and update. Race is acceptable here because
    # we source-of-truth from battle_votes if counts drift; but for best-effort
    # just bump the column.
    column = "votes_a" if body.voted_for == "A" else "votes_b"
    new_count = int(battle.get(column) or 0) + 1
    try:
        upd = (
            supabase.table("battles")
            .update({column: new_count})
            .eq("id", battle_id)
            .execute()
        )
        if upd and upd.data:
            battle = upd.data[0]
    except Exception as e:
        logger.error("Vote count update failed: %s", e)

    # Autoclose if we hit the 50-vote cap
    battle = await _maybe_autoclose(supabase, battle)

    creator_name = _user_display_name(supabase, battle.get("creator_id"))
    opponent_name = _user_display_name(supabase, battle.get("opponent_id")) if battle.get("opponent_id") else None
    return _serialize_battle(
        battle,
        creator_name=creator_name,
        opponent_name=opponent_name,
        has_voted=body.voted_for,
    )
