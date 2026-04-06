"""Generate showcase gallery images via ComfyUI and upload to Supabase."""
import os, json, time, uuid, random, httpx, base64
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

NEG_PROMPT = (
    "(worst quality:1.4), (low quality:1.4), bad quality, blurry, deformed, mutated, "
    "disfigured, text, watermark, signature, extra fingers, extra limbs, bad anatomy, "
    "bad hands, missing fingers, cropped, jpeg artifacts, ugly, duplicate, morbid, "
    "out of frame, poorly drawn face, poorly drawn hands, nsfw" # base neg for SFW
)

NEG_NSFW = (
    "(worst quality:1.4), (low quality:1.4), bad quality, blurry, deformed, mutated, "
    "disfigured, text, watermark, signature, extra fingers, extra limbs, bad anatomy, "
    "bad hands, missing fingers, cropped, jpeg artifacts, ugly, duplicate, morbid, "
    "out of frame, poorly drawn face, poorly drawn hands"
)

# Content plan: (title, prompt, negative, model, nsfw, tags, width, height)
CONTENT = [
    # === SFW Images (epicphotogasm) ===
    {
        "title": "Neon Tokyo Nights",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, cyberpunk tokyo street at night, neon signs reflecting on wet pavement, rain, cinematic lighting, depth of field, 8k, professional photography",
        "neg": NEG_PROMPT,
        "model": "epicphotogasm.safetensors",
        "nsfw": False,
        "tags": ["cyberpunk", "tokyo", "neon", "street"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Zen Garden Serenity",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, beautiful japanese zen garden, raked sand patterns, moss covered rocks, maple trees with red autumn leaves, morning mist, golden hour light, 8k",
        "neg": NEG_PROMPT,
        "model": "epicphotogasm.safetensors",
        "nsfw": False,
        "tags": ["landscape", "japan", "zen", "nature"],
        "w": 1024, "h": 768,
    },
    {
        "title": "Dark Fantasy Queen",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, beautiful dark fantasy queen, ornate black armor with gold filigree, flowing dark cape, dramatic throne room, volumetric lighting, cinematic, 8k",
        "neg": NEG_PROMPT,
        "model": "epicphotogasm.safetensors",
        "nsfw": False,
        "tags": ["fantasy", "portrait", "dark", "queen"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Rainy Day Cinema",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, cinematic portrait of a young woman holding umbrella in rain, city street background, moody blue and orange lighting, film grain, shallow depth of field, 35mm film look, 8k",
        "neg": NEG_PROMPT,
        "model": "epicphotogasm.safetensors",
        "nsfw": False,
        "tags": ["portrait", "cinematic", "rain", "moody"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Samurai at Dawn",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, samurai warrior standing on cliff edge, cherry blossom petals falling, sunrise behind mountains, traditional full armor, katana drawn, epic composition, cinematic lighting, 8k",
        "neg": NEG_PROMPT,
        "model": "epicphotogasm.safetensors",
        "nsfw": False,
        "tags": ["samurai", "japan", "warrior", "sunrise"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Seoul Street Style",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, beautiful korean woman, street fashion, oversized jacket, round sunglasses, seoul gangnam district background, natural lighting, fashion photography, 8k",
        "neg": NEG_PROMPT,
        "model": "chilloutmix.safetensors",
        "nsfw": False,
        "tags": ["fashion", "korean", "street", "portrait"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Ocean Cliff Sunset",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, dramatic ocean cliff sunset, crashing waves, orange and purple sky, god rays through clouds, long exposure water, landscape photography, 8k",
        "neg": NEG_PROMPT,
        "model": "epicphotogasm.safetensors",
        "nsfw": False,
        "tags": ["landscape", "ocean", "sunset", "dramatic"],
        "w": 1024, "h": 768,
    },
    {
        "title": "Vintage Film Noir",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, film noir style portrait, mysterious woman in fedora hat, cigarette smoke, venetian blinds shadow pattern on face, black and white, high contrast, 1940s aesthetic, 8k",
        "neg": NEG_PROMPT,
        "model": "epicphotogasm.safetensors",
        "nsfw": False,
        "tags": ["noir", "vintage", "portrait", "monochrome"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Underwater Dream",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, beautiful woman floating underwater, flowing white dress, sunlight rays penetrating blue water, bubbles, ethereal atmosphere, underwater photography, 8k",
        "neg": NEG_PROMPT,
        "model": "epicphotogasm.safetensors",
        "nsfw": False,
        "tags": ["underwater", "ethereal", "portrait", "artistic"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Gothic Cathedral Light",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, interior of grand gothic cathedral, stained glass windows with colorful light beams, stone pillars, dramatic atmosphere, architecture photography, 8k",
        "neg": NEG_PROMPT,
        "model": "epicphotogasm.safetensors",
        "nsfw": False,
        "tags": ["architecture", "gothic", "cathedral", "light"],
        "w": 768, "h": 1024,
    },

    # === NSFW Soft (epicphotogasm & chilloutmix) ===
    {
        "title": "Rain Goddess",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, beautiful woman standing in rain, artistic nude, water droplets on skin, dramatic studio lighting, fine art photography, wet hair, elegant pose, high fashion, 8k",
        "neg": NEG_NSFW,
        "model": "epicphotogasm.safetensors",
        "nsfw": True,
        "tags": ["artistic-nude", "rain", "fine-art", "editorial"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Silk & Shadow",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, beautiful asian woman, boudoir photography, white silk sheets, soft morning light through sheer curtains, intimate atmosphere, lingerie, elegant, sensual, 8k",
        "neg": NEG_NSFW,
        "model": "chilloutmix.safetensors",
        "nsfw": True,
        "tags": ["boudoir", "asian", "lingerie", "intimate"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Moonlit Onsen",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, beautiful japanese woman bathing in outdoor hot spring onsen at night, steam rising, moonlight, autumn maple trees, natural beauty, artistic nude from behind, serene atmosphere, 8k",
        "neg": NEG_NSFW,
        "model": "chilloutmix.safetensors",
        "nsfw": True,
        "tags": ["onsen", "japanese", "artistic-nude", "moonlight"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Velvet Luxe",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, stunning woman in black lace lingerie, red velvet chaise longue, baroque interior, warm candlelight, luxury boudoir, fashion editorial, 8k",
        "neg": NEG_NSFW,
        "model": "epicphotogasm.safetensors",
        "nsfw": True,
        "tags": ["lingerie", "luxury", "boudoir", "editorial"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Golden Hour Body Art",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, beautiful woman with gold body paint, artistic nude, golden hour backlight, desert landscape, fine art photography, glowing skin, sculptural pose, 8k",
        "neg": NEG_NSFW,
        "model": "epicphotogasm.safetensors",
        "nsfw": True,
        "tags": ["body-art", "gold", "fine-art", "artistic-nude"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Balcony Sunrise",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, beautiful woman wrapped in sheer fabric on hotel balcony, city skyline sunrise, wind blowing hair and fabric, nude silhouette, golden light, romantic atmosphere, 8k",
        "neg": NEG_NSFW,
        "model": "epicphotogasm.safetensors",
        "nsfw": True,
        "tags": ["silhouette", "sunrise", "romantic", "artistic-nude"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Mirror Reflection",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, beautiful korean woman, sensual portrait reflected in ornate mirror, black lingerie, dimly lit bedroom, candles, intimate mood, shallow depth of field, 8k",
        "neg": NEG_NSFW,
        "model": "chilloutmix.safetensors",
        "nsfw": True,
        "tags": ["mirror", "lingerie", "korean", "sensual"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Classical Nude Study",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, fine art nude study, beautiful woman reclining on white marble, museum-quality lighting, renaissance composition, elegant pose, classical beauty, studio photography, 8k",
        "neg": NEG_NSFW,
        "model": "epicphotogasm.safetensors",
        "nsfw": True,
        "tags": ["fine-art", "classical", "nude", "studio"],
        "w": 1024, "h": 768,
    },

    # === NSFW Hardcore (uberRealisticPorn) ===
    {
        "title": "Passionate Embrace",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, passionate couple embrace, beautiful woman and handsome man, intimate bedroom scene, soft warm lighting, skin detail, sensual, naked, kissing, intertwined bodies, romantic, 8k",
        "neg": NEG_NSFW,
        "model": "uberRealisticPorn.safetensors",
        "nsfw": True,
        "tags": ["couple", "passionate", "intimate", "explicit"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Solo Glamour",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, gorgeous woman lying on bed, spread legs, explicit nude, stockings and heels, seductive expression, bedroom with luxury sheets, professional lighting, alluring pose, 8k",
        "neg": NEG_NSFW,
        "model": "uberRealisticPorn.safetensors",
        "nsfw": True,
        "tags": ["solo", "glamour", "explicit", "stockings"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Steamy Shower",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, beautiful woman in glass shower, wet skin, steam, water running down body, explicit nude, seductive look over shoulder, modern bathroom, dramatic lighting, 8k",
        "neg": NEG_NSFW,
        "model": "uberRealisticPorn.safetensors",
        "nsfw": True,
        "tags": ["shower", "wet", "explicit", "steamy"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Intimate Connection",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, intimate couple scene from above, beautiful woman on white sheets, passionate lovemaking, interracial couple, bedroom, soft lighting, skin texture, explicit, 8k",
        "neg": NEG_NSFW,
        "model": "uberRealisticPorn.safetensors",
        "nsfw": True,
        "tags": ["couple", "intimate", "explicit", "passionate"],
        "w": 1024, "h": 768,
    },
    {
        "title": "Red Light District",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, sexy woman in red neon lit room, fishnet stockings, high heels, explicit pose on leather couch, seductive atmosphere, cinematic red and purple lighting, provocative, 8k",
        "neg": NEG_NSFW,
        "model": "uberRealisticPorn.safetensors",
        "nsfw": True,
        "tags": ["neon", "provocative", "explicit", "fishnet"],
        "w": 768, "h": 1024,
    },
    {
        "title": "Asian Beauty Explicit",
        "prompt": "masterpiece, best quality, ultra detailed, photorealistic, gorgeous asian woman, explicit nude on silk sheets, perfect body, seductive expression, traditional japanese room with tatami, warm lighting, sensual atmosphere, 8k",
        "neg": NEG_NSFW,
        "model": "uberRealisticPorn.safetensors",
        "nsfw": True,
        "tags": ["asian", "explicit", "traditional", "sensual"],
        "w": 768, "h": 1024,
    },
]

# Real user IDs to distribute content across (simulates multiple users)
DUMMY_USERS = [
    "73e59337-ea6f-458b-b5a2-2521035eda3f",  # kshgks59
    "f375d6c5-3937-4362-9f9e-83a51bd8c523",  # japanesebusinessman4
    "59e39fd9-4c6a-40bd-b3ac-180955aadcde",  # animeplexi33
    "83bda190-c43c-45cf-8aba-5b7090f41b8a",  # keitjordan2007
    "4b19bed4-4aee-4706-a967-d8dbe604209a",  # zidihammad3026
    "93773d5b-7a38-46e3-ad47-85fc6f1dc612",  # congedison30
    "eed21f09-4c46-40e6-981c-47d36a2e93f6",  # majhona
    "c5ba54bf-5893-4bce-b7bc-f48096ae719d",  # ikbal
]


def submit_workflow(workflow: dict) -> str:
    """Submit workflow to ComfyUI, return prompt_id."""
    payload = {"prompt": workflow}
    r = httpx.post(f"{COMFYUI_URL}/prompt", json=payload, timeout=30)
    r.raise_for_status()
    return r.json()["prompt_id"]


def wait_for_result(prompt_id: str, timeout: int = 300) -> dict:
    """Poll until generation completes. Returns history entry."""
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
        time.sleep(3)
    raise TimeoutError(f"Generation timed out after {timeout}s")


def download_image(history: dict) -> bytes:
    """Download generated image from ComfyUI output."""
    outputs = history.get("outputs", {})
    for node_id, output in outputs.items():
        images = output.get("images", [])
        if images:
            img = images[0]
            filename = img["filename"]
            subfolder = img.get("subfolder", "")
            img_type = img.get("type", "output")
            params = {"filename": filename, "subfolder": subfolder, "type": img_type}
            r = httpx.get(f"{COMFYUI_URL}/view", params=params, timeout=30)
            r.raise_for_status()
            return r.content
    raise RuntimeError("No image found in output")


def upload_to_supabase(image_data: bytes, filename: str) -> str:
    """Upload image to Supabase storage, return public URL."""
    bucket = "self-hosted"
    path = f"showcase/{filename}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "image/png",
    }
    # Try upsert
    r = httpx.post(
        f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}",
        content=image_data,
        headers={**headers, "x-upsert": "true"},
        timeout=60,
    )
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Upload failed ({r.status_code}): {r.text[:200]}")
    return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"


def insert_gallery(item: dict, image_url: str, user_id: str) -> str:
    """Insert gallery record, return gallery ID."""
    gallery_id = str(uuid.uuid4())
    record = {
        "id": gallery_id,
        "user_id": user_id,
        "job_id": str(uuid.uuid4()),
        "title": item["title"],
        "description": f"Generated with {item['model'].replace('.safetensors', '')}",
        "image_url": image_url,
        "nsfw": item["nsfw"],
        "public": True,
        "tags": item["tags"],
        "model": item["model"].replace(".safetensors", ""),
        "prompt": item["prompt"],
        "negative_prompt": item["neg"],
        "steps": 35,
        "cfg": 8,
        "seed": random.randint(0, 2**31),
        "width": item["w"],
        "height": item["h"],
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


def build_sd15_workflow(prompt, neg, model, w, h, steps=35, cfg=7.5, seed=-1):
    if seed == -1:
        seed = random.randint(0, 2**63)
    return {
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "cfg": cfg, "denoise": 1.0, "latent_image": ["5", 0],
                "model": ["4", 0], "negative": ["7", 0], "positive": ["6", 0],
                "sampler_name": "euler_ancestral", "scheduler": "karras",
                "seed": seed, "steps": steps,
            },
        },
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": model}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"batch_size": 1, "height": h, "width": w}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["4", 1], "text": prompt}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["4", 1], "text": neg}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "EGAKU", "images": ["8", 0]}},
    }


def main():
    print(f"=== EGAKU Showcase Generator ===")
    print(f"ComfyUI: {COMFYUI_URL}")
    print(f"Content items: {len(CONTENT)}")
    print()

    success = 0
    failed = 0

    for i, item in enumerate(CONTENT):
        print(f"[{i+1}/{len(CONTENT)}] {item['title']} ({item['model']}) nsfw={item['nsfw']}")

        try:
            # Build workflow
            workflow = build_sd15_workflow(
                item["prompt"], item["neg"], item["model"],
                item["w"], item["h"],
            )

            # Submit to ComfyUI
            prompt_id = submit_workflow(workflow)
            print(f"  Submitted: {prompt_id[:12]}...")

            # Wait for completion
            history = wait_for_result(prompt_id, timeout=180)
            print(f"  Generated OK")

            # Download image
            image_data = download_image(history)
            print(f"  Downloaded: {len(image_data)//1024}KB")

            # Upload to Supabase
            filename = f"{uuid.uuid4().hex[:16]}.png"
            image_url = upload_to_supabase(image_data, filename)
            print(f"  Uploaded: {image_url[-30:]}")

            # Assign to random user
            user_id = random.choice(DUMMY_USERS)

            # Insert gallery record
            gid = insert_gallery(item, image_url, user_id)
            print(f"  Gallery: {gid[:12]}... (user={user_id[:8]}...)")
            print(f"  SUCCESS")
            success += 1

        except Exception as e:
            print(f"  FAILED: {e}")
            failed += 1

        print()

    print(f"=== Done ===")
    print(f"Success: {success}, Failed: {failed}")


if __name__ == "__main__":
    main()
