"""Generate showcase video clips via AnimateDiff on ComfyUI."""
import os, json, time, uuid, random, httpx
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

COMFYUI_URL = os.getenv("VASTAI_COMFYUI_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

SB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

NEG = (
    "(worst quality:1.4), (low quality:1.4), bad quality, blurry, deformed, mutated, "
    "disfigured, text, watermark, extra fingers, bad anatomy, bad hands, "
    "missing fingers, ugly, static image, freeze"
)

VIDEOS = [
    # SFW videos
    {
        "title": "Cherry Blossom Wind",
        "prompt": "masterpiece, best quality, beautiful cherry blossom trees, petals falling in wind, spring sunlight, japanese garden path, gentle breeze, smooth motion, cinematic",
        "model": "epicphotogasm.safetensors",
        "nsfw": False,
        "tags": ["sakura", "nature", "japanese", "animation"],
    },
    {
        "title": "Cyberpunk Rain Walk",
        "prompt": "masterpiece, best quality, woman walking in cyberpunk city rain, neon reflections, puddles, umbrella, cinematic lighting, smooth motion, night city",
        "model": "epicphotogasm.safetensors",
        "nsfw": False,
        "tags": ["cyberpunk", "rain", "neon", "animation"],
    },
    {
        "title": "Ocean Waves Sunset",
        "prompt": "masterpiece, best quality, ocean waves crashing on shore, golden sunset, foam, dramatic sky, smooth wave motion, nature photography, cinematic",
        "model": "epicphotogasm.safetensors",
        "nsfw": False,
        "tags": ["ocean", "sunset", "waves", "nature"],
    },
    {
        "title": "Fashion Runway",
        "prompt": "masterpiece, best quality, beautiful model walking on fashion runway, elegant dress, spotlights, audience blur background, confident walk, smooth motion",
        "model": "chilloutmix.safetensors",
        "nsfw": False,
        "tags": ["fashion", "runway", "model", "animation"],
    },
    # NSFW soft videos
    {
        "title": "Moonlit Dance",
        "prompt": "masterpiece, best quality, beautiful woman dancing sensually in moonlight, sheer flowing dress, wind blowing, artistic nude silhouette, elegant movement, smooth motion",
        "model": "epicphotogasm.safetensors",
        "nsfw": True,
        "tags": ["dance", "moonlight", "artistic", "sensual"],
    },
    {
        "title": "Bath Candles",
        "prompt": "masterpiece, best quality, beautiful woman in bath, candlelight, rose petals floating, steam rising, sensual atmosphere, warm lighting, relaxing, smooth water motion",
        "model": "chilloutmix.safetensors",
        "nsfw": True,
        "tags": ["bath", "candles", "sensual", "relaxing"],
    },
    # NSFW explicit videos
    {
        "title": "Bedroom Motion",
        "prompt": "masterpiece, best quality, beautiful woman on bed, seductive movement, lingerie slowly removing, bedroom, warm lighting, sensual, explicit, smooth motion",
        "model": "uberRealisticPorn.safetensors",
        "nsfw": True,
        "tags": ["bedroom", "sensual", "explicit", "animation"],
    },
    {
        "title": "Shower Steam",
        "prompt": "masterpiece, best quality, gorgeous woman in shower, water running down body, steam, glass door, explicit nude, turning motion, wet skin, seductive",
        "model": "uberRealisticPorn.safetensors",
        "nsfw": True,
        "tags": ["shower", "steam", "explicit", "animation"],
    },
]

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


def build_animatediff_workflow(prompt, neg, model, w=512, h=768, frames=16, fps=8, seed=-1):
    if seed == -1:
        seed = random.randint(0, 2**63)
    return {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": model}},
        "20": {
            "class_type": "ADE_AnimateDiffLoaderWithContext",
            "inputs": {
                "model": ["4", 0],
                "model_name": "mm_sd_v15_v2.ckpt",
                "beta_schedule": "sqrt_linear (AnimateDiff)",
                "context_options": ["21", 0],
            },
        },
        "21": {
            "class_type": "ADE_StandardStaticContextOptions",
            "inputs": {"context_length": 16, "context_overlap": 4},
        },
        "5": {"class_type": "EmptyLatentImage", "inputs": {"batch_size": frames, "height": h, "width": w}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["4", 1], "text": prompt}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["4", 1], "text": neg}},
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "cfg": 7.5, "denoise": 1.0, "latent_image": ["5", 0],
                "model": ["20", 0], "negative": ["7", 0], "positive": ["6", 0],
                "sampler_name": "euler_ancestral", "scheduler": "karras",
                "seed": seed, "steps": 25,
            },
        },
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "30": {
            "class_type": "SaveAnimatedWEBP",
            "inputs": {
                "images": ["8", 0],
                "fps": float(fps),
                "filename_prefix": "EGAKU_vid",
                "lossless": False,
                "quality": 90,
                "method": "default",
            },
        },
    }


def submit_workflow(workflow):
    r = httpx.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow}, timeout=30)
    r.raise_for_status()
    return r.json()["prompt_id"]


def wait_for_result(prompt_id, timeout=600):
    start = time.time()
    while time.time() - start < timeout:
        r = httpx.get(f"{COMFYUI_URL}/history/{prompt_id}", timeout=15)
        data = r.json()
        if prompt_id in data:
            status = data[prompt_id].get("status", {})
            if status.get("completed", False) or status.get("status_str") == "success":
                return data[prompt_id]
            if "error" in str(status).lower():
                raise RuntimeError(f"Generation failed: {status}")
        time.sleep(5)
    raise TimeoutError(f"Timed out after {timeout}s")


def download_video(history):
    outputs = history.get("outputs", {})
    for node_id, output in outputs.items():
        # SaveAnimatedWEBP outputs under 'images' key
        for key in ["images", "gifs", "videos"]:
            items = output.get(key, [])
            if items:
                f = items[0]
                params = {"filename": f["filename"], "subfolder": f.get("subfolder", ""), "type": f.get("type", "output")}
                r = httpx.get(f"{COMFYUI_URL}/view", params=params, timeout=60)
                r.raise_for_status()
                return r.content, f["filename"]
    raise RuntimeError(f"No video found in outputs: {json.dumps({k: list(v.keys()) for k, v in outputs.items()})}")


def upload_to_supabase(data, filename, content_type="video/mp4"):
    bucket = "self-hosted"
    path = f"showcase/{filename}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }
    r = httpx.post(
        f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}",
        content=data, headers=headers, timeout=60,
    )
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Upload failed ({r.status_code}): {r.text[:200]}")
    return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"


def insert_gallery(item, video_url, user_id):
    gallery_id = str(uuid.uuid4())
    record = {
        "id": gallery_id,
        "user_id": user_id,
        "job_id": str(uuid.uuid4()),
        "title": item["title"],
        "description": f"Video generated with {item['model'].replace('.safetensors', '')}",
        "video_url": video_url,
        "image_url": "",
        "nsfw": item["nsfw"],
        "public": True,
        "tags": item["tags"],
        "model": item["model"].replace(".safetensors", ""),
        "prompt": item["prompt"],
        "negative_prompt": NEG,
        "steps": 25,
        "cfg": 8,
        "seed": random.randint(0, 2**31),
        "width": 512,
        "height": 768,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    r = httpx.post(
        f"{SUPABASE_URL}/rest/v1/gallery",
        json=record,
        headers={**SB_HEADERS, "Prefer": "return=minimal"},
        timeout=30,
    )
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Insert failed ({r.status_code}): {r.text[:300]}")
    return gallery_id


def main():
    print(f"=== EGAKU Video Generator ===")
    print(f"Videos to generate: {len(VIDEOS)}")
    print()

    success = 0
    failed = 0

    for i, item in enumerate(VIDEOS):
        print(f"[{i+1}/{len(VIDEOS)}] {item['title']} ({item['model']}) nsfw={item['nsfw']}")
        try:
            workflow = build_animatediff_workflow(item["prompt"], NEG, item["model"])
            prompt_id = submit_workflow(workflow)
            print(f"  Submitted: {prompt_id[:12]}...")

            history = wait_for_result(prompt_id, timeout=600)
            print(f"  Generated OK")

            video_data, orig_name = download_video(history)
            print(f"  Downloaded: {len(video_data)//1024}KB ({orig_name})")

            ext = "mp4" if ".mp4" in orig_name else "webp" if ".webp" in orig_name else "gif"
            ct = "video/mp4" if ext == "mp4" else "image/webp" if ext == "webp" else "image/gif"
            filename = f"{uuid.uuid4().hex[:16]}.{ext}"
            video_url = upload_to_supabase(video_data, filename, ct)
            print(f"  Uploaded: {video_url[-30:]}")

            user_id = random.choice(DUMMY_USERS)
            gid = insert_gallery(item, video_url, user_id)
            print(f"  Gallery: {gid[:12]}... (user={user_id[:8]}...)")
            print(f"  SUCCESS")
            success += 1

        except Exception as e:
            print(f"  FAILED: {e}")
            failed += 1
        print()

    print(f"=== Done === Success: {success}, Failed: {failed}")


if __name__ == "__main__":
    main()
