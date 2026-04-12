"""Generate 5 Kling 2.5 Pro videos + 5 WAN 2.7 vid2vid showcases sequentially.

(Synchronous httpx — matches the pattern gen_showcase_v5.py uses successfully.
Async httpx on Python 3.14 hits TLS/pool issues so this stays sync.)

Seedance 2 was planned but fal.ai silently returns empty results — our account
doesn't have access to the new Seedance 2 model yet. Pivoted to Kling 2.5 Pro.
"""
import os
import random
import time
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from dotenv import load_dotenv

load_dotenv()

FAL_KEY = os.getenv("FAL_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
assert FAL_KEY and SUPABASE_URL and SUPABASE_KEY, "Missing env vars"

FAL_HEADERS = {"Authorization": f"Key {FAL_KEY}", "Content-Type": "application/json"}
FAL_AUTH = {"Authorization": f"Key {FAL_KEY}"}

DUMMY_USERS = [
    "73e59337-ea6f-458b-b5a2-2521035eda3f",
    "f375d6c5-3937-4362-9f9e-83a51bd8c523",
    "59e39fd9-4c6a-40bd-b3ac-180955aadcde",
    "83bda190-c43c-45cf-8aba-5b7090f41b8a",
    "4b19bed4-4aee-4706-a967-d8dbe604209a",
    "93773d5b-7a38-46e3-ad47-85fc6f1dc612",
    "eed21f09-4c46-40e6-981c-47d36a2e93f6",
    "c5ba54bf-5893-4bce-b7bc-f48096ae719d",
]

KLING_JOBS = [
    {
        "title": "Lion at Golden Hour",
        "prompt": (
            "A majestic lion walking slowly across African savanna at golden hour, "
            "slow cinematic camera tracking alongside, dust particles in warm sunlight, "
            "tall grass swaying, distant acacia trees, wildlife documentary quality"
        ),
        "tags": ["lion", "wildlife", "cinematic"],
    },
    {
        "title": "Tokyo Rain Night",
        "prompt": (
            "Tokyo Shibuya at night in heavy rain, neon signs reflecting in puddles, "
            "crowds with colorful umbrellas, dramatic crane shot pulling back to reveal "
            "the full city skyline with Tokyo Tower, cinematic"
        ),
        "tags": ["tokyo", "neon", "rain"],
    },
    {
        "title": "Ballet Studio",
        "prompt": (
            "A young ballerina practicing alone in a sunlit wooden studio, graceful "
            "pirouette in slow motion, golden hour light streaming through tall arched "
            "windows, dust particles in the air"
        ),
        "tags": ["ballet", "dance", "cinematic"],
    },
    {
        "title": "Coral Reef",
        "prompt": (
            "Underwater scene of a tropical coral reef, school of silver fish swimming "
            "through colorful coral, sun beams piercing through clear blue water, a sea "
            "turtle gliding gracefully past, natural history documentary"
        ),
        "tags": ["ocean", "coral", "underwater"],
    },
    {
        "title": "Steam Locomotive",
        "prompt": (
            "A vintage black steam locomotive crossing the Glenfinnan stone viaduct in "
            "Scottish highlands, huge steam billowing, autumn colors on rolling hills, "
            "dramatic wide aerial shot"
        ),
        "tags": ["train", "steam", "scotland"],
    },
]

INPUT_VIDEOS = [
    f"{SUPABASE_URL}/storage/v1/object/public/self-hosted/showcase/b8663fcf8459482d.mp4",
    f"{SUPABASE_URL}/storage/v1/object/public/self-hosted/showcase/1326a8c43bdd48cb.mp4",
]

VID2VID_JOBS = [
    {
        "title": "Watercolor Restyle",
        "video_url": INPUT_VIDEOS[0],
        "prompt": (
            "Transform the entire scene into a hand-painted watercolor painting style, "
            "soft pastel colors, flowing brush strokes, visible paper texture"
        ),
        "tags": ["watercolor", "vid2vid", "artistic"],
    },
    {
        "title": "Anime Restyle",
        "video_url": INPUT_VIDEOS[1],
        "prompt": (
            "Transform into vibrant anime style, bold clean outlines, cel shading, "
            "saturated colors, Japanese animation quality"
        ),
        "tags": ["anime", "vid2vid", "ghibli"],
    },
    {
        "title": "Cyberpunk Restyle",
        "video_url": INPUT_VIDEOS[0],
        "prompt": (
            "Restyle as cyberpunk dystopia, glowing neon lights, futuristic cityscape, "
            "rain reflections, pink and blue neon glow, Blade Runner aesthetic"
        ),
        "tags": ["cyberpunk", "vid2vid", "neon"],
    },
    {
        "title": "Oil Painting Restyle",
        "video_url": INPUT_VIDEOS[1],
        "prompt": (
            "Transform into a classical oil painting, thick impasto brushstrokes, "
            "rich Renaissance color palette, visible canvas texture"
        ),
        "tags": ["oil-painting", "vid2vid", "classical"],
    },
    {
        "title": "Film Noir Restyle",
        "video_url": INPUT_VIDEOS[0],
        "prompt": (
            "Transform into black and white film noir, high contrast dramatic shadows, "
            "1940s cinema aesthetic, moody lighting, grainy film texture"
        ),
        "tags": ["noir", "vid2vid", "blackandwhite"],
    },
]


def poll_until_done(status_url: str, response_url: str, label: str, max_minutes: int = 20) -> dict | None:
    """Poll a fal.ai queue job (sync httpx). Returns result dict or None."""
    max_polls = int(max_minutes * 60 / 5)
    for i in range(max_polls):
        time.sleep(5)
        try:
            sr = httpx.get(f"{status_url}?logs=1", headers=FAL_AUTH, timeout=15)
        except Exception as e:
            print(f"  [{label}] poll #{i} transport error: {type(e).__name__}: {e}")
            continue
        if sr.status_code not in (200, 202):
            print(f"  [{label}] poll #{i}: HTTP {sr.status_code}")
            continue
        try:
            sd = sr.json()
        except Exception:
            continue
        status = sd.get("status", "")
        if i % 6 == 0:
            print(f"  [{label}] poll #{i}: {status}")
        if status == "COMPLETED":
            try:
                rr = httpx.get(response_url, headers=FAL_AUTH, timeout=60)
                if rr.status_code == 200:
                    return rr.json()
                print(f"  [{label}] response fetch HTTP {rr.status_code}: {rr.text[:200]}")
            except Exception as e:
                print(f"  [{label}] response fetch error: {e}")
            return sd
        if status in ("FAILED", "CANCELLED"):
            print(f"  [{label}] FAILED: {sd.get('error', sd)}")
            return None
    print(f"  [{label}] TIMEOUT after {max_minutes} min")
    return None


def extract_video_url(result: dict) -> str | None:
    v = result.get("video")
    if isinstance(v, dict):
        return v.get("url")
    if isinstance(v, str):
        return v
    return None


def upload_to_supabase(video_url: str, fname: str) -> str:
    """Download + upload to Supabase Storage with retries. Returns public URL."""
    last_err = None
    data = None
    for attempt in range(3):
        try:
            resp = httpx.get(
                video_url,
                timeout=300,
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 egaku-showcase"},
            )
            resp.raise_for_status()
            data = resp.content
            break
        except Exception as e:
            last_err = e
            print(f"  download attempt {attempt + 1} failed: {type(e).__name__}: {e}")
            time.sleep(3 * (attempt + 1))
    if data is None:
        raise RuntimeError(f"download failed after 3 attempts: {last_err!r}")

    up = httpx.post(
        f"{SUPABASE_URL}/storage/v1/object/self-hosted/showcase/{fname}.mp4",
        content=data,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "video/mp4",
            "x-upsert": "true",
        },
        timeout=180,
    )
    up.raise_for_status()
    return f"{SUPABASE_URL}/storage/v1/object/public/self-hosted/showcase/{fname}.mp4"


def insert_gallery(title: str, prompt: str, video_url: str, tags: list, model: str):
    rec = {
        "id": str(uuid.uuid4()),
        "user_id": random.choice(DUMMY_USERS),
        "job_id": str(uuid.uuid4()),
        "title": title,
        "description": "AI Generated Video",
        "image_url": None,
        "video_url": video_url,
        "nsfw": False,
        "public": True,
        "tags": tags,
        "model": model,
        "prompt": prompt,
        "negative_prompt": "",
        "steps": 0,
        "cfg": 0.0,
        "seed": random.randint(0, 2**31),
        "width": 1280,
        "height": 720,
        "likes_count": random.choice([0, 1, 2, 3, 5, 8, 12]),
        "created_at": (datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 72))).isoformat(),
    }
    r = httpx.post(
        f"{SUPABASE_URL}/rest/v1/gallery",
        json=rec,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        timeout=30,
    )
    r.raise_for_status()


def run_kling(job: dict, idx: int) -> bool:
    label = f"Kling-{idx + 1} {job['title']}"
    print(f"\n[{label}] submitting...")
    try:
        r = httpx.post(
            "https://queue.fal.run/fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
            headers=FAL_HEADERS,
            json={"prompt": job["prompt"], "duration": "5", "aspect_ratio": "16:9"},
            timeout=30,
        )
        r.raise_for_status()
        sub = r.json()
        print(f"  queued: {sub['request_id'][:16]}")

        result = poll_until_done(sub["status_url"], sub["response_url"], label, max_minutes=10)
        if not result:
            return False

        fal_url = extract_video_url(result)
        if not fal_url:
            print(f"  no video url in result: {result}")
            return False
        print(f"  downloading: {fal_url[:80]}")

        fname = uuid.uuid4().hex[:16]
        sb_url = upload_to_supabase(fal_url, fname)
        print(f"  uploaded: {sb_url}")

        insert_gallery(
            title=job["title"],
            prompt=job["prompt"],
            video_url=sb_url,
            tags=job["tags"],
            model="fal_kling25_t2v",
        )
        print(f"  OK inserted to gallery")
        return True
    except Exception as e:
        import traceback
        print(f"  ERROR {type(e).__name__}: {e}")
        traceback.print_exc()
        return False


def run_vid2vid(job: dict, idx: int) -> bool:
    label = f"Vid2Vid-{idx + 1} {job['title']}"
    print(f"\n[{label}] submitting...")
    try:
        r = httpx.post(
            "https://queue.fal.run/fal-ai/wan/v2.7/edit-video",
            headers=FAL_HEADERS,
            json={
                "video_url": job["video_url"],
                "prompt": job["prompt"],
                "resolution": "720p",
                "enable_safety_checker": False,
            },
            timeout=30,
        )
        r.raise_for_status()
        sub = r.json()
        print(f"  queued: {sub['request_id'][:16]}")

        result = poll_until_done(sub["status_url"], sub["response_url"], label, max_minutes=15)
        if not result:
            return False

        fal_url = extract_video_url(result)
        if not fal_url:
            print(f"  no video url in result: {result}")
            return False
        print(f"  downloading: {fal_url[:80]}")

        fname = uuid.uuid4().hex[:16]
        sb_url = upload_to_supabase(fal_url, fname)
        print(f"  uploaded: {sb_url}")

        insert_gallery(
            title=job["title"],
            prompt=job["prompt"],
            video_url=sb_url,
            tags=job["tags"],
            model="fal_wan27_v2v",
        )
        print(f"  OK inserted to gallery")
        return True
    except Exception as e:
        import traceback
        print(f"  ERROR {type(e).__name__}: {e}")
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print(f"=== {len(KLING_JOBS)} Kling 2.5 Pro + {len(VID2VID_JOBS)} vid2vid (sequential) ===\n")
    ok = fail = 0

    for i, job in enumerate(KLING_JOBS):
        if run_kling(job, i):
            ok += 1
        else:
            fail += 1

    for i, job in enumerate(VID2VID_JOBS):
        if run_vid2vid(job, i):
            ok += 1
        else:
            fail += 1

    print(f"\n=== DONE: {ok} OK, {fail} FAIL ===")
