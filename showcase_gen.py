#!/usr/bin/env python3
"""Generate high-quality showcase images via ComfyUI and upload to EGAKU AI gallery."""

import json
import time
import uuid
import random
import urllib.request
import urllib.parse
import ssl
import os

COMFYUI_URL = "https://comfyui.egaku-ai.com"
SUPABASE_URL = "https://ukmuxwdxruilgtacchzj.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbXV4d2R4cnVpbGd0YWNjaHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg2MTQ4NywiZXhwIjoyMDg4NDM3NDg3fQ.zkOGxn6oO3IJttF3BtCIHN6Vbz0W63IH0DaoTrg9c18")
OWNER_USER_ID = "f375d6c5-3937-4362-9f9e-83a51bd8c523"

# SSL context for HTTPS
ctx = ssl.create_default_context()

NEGATIVE_SDXL = "(worst quality:1.4), (low quality:1.4), ugly, deformed, noisy, blurry, distorted, disfigured, bad anatomy, bad hands, missing fingers, extra fingers, text, watermark, signature, jpeg artifacts, cropped"
NEGATIVE_SD15 = "ugly, deformed, noisy, blurry, distorted, out of focus, bad anatomy, bad hands, missing fingers, extra fingers, extra limbs, text, watermark, signature, low quality, worst quality, jpeg artifacts, cropped, mutated"
NEGATIVE_PONY = "score_4, score_3, score_2, score_1, ugly, deformed, bad anatomy, bad hands, text, watermark, worst quality, low quality"

# Showcase prompts: (model, width, height, prompt, negative, is_nsfw, title, sampler, steps, cfg)
SHOWCASE = [
    # --- SFW Cinematic (realvisxlV50 - SDXL) ---
    {
        "model": "realvisxlV50.safetensors",
        "w": 832, "h": 1216,
        "prompt": "cinematic portrait of a woman with auburn hair, golden hour sunlight streaming through window, volumetric light rays, dust particles, shallow depth of field, shot on ARRI Alexa, anamorphic lens flare, film grain, color graded, 8k, masterpiece",
        "negative": NEGATIVE_SDXL,
        "nsfw": False, "title": "Golden Hour Portrait",
        "sampler": "dpmpp_2m", "scheduler": "karras", "steps": 28, "cfg": 7,
    },
    {
        "model": "realvisxlV50.safetensors",
        "w": 1216, "h": 832,
        "prompt": "breathtaking cyberpunk cityscape at night, massive neon signs in Japanese and Chinese, rain-slicked streets reflecting lights, flying vehicles, towering skyscrapers with holographic advertisements, blade runner aesthetic, cinematic composition, volumetric fog, 8k, ultra detailed",
        "negative": NEGATIVE_SDXL,
        "nsfw": False, "title": "Neon City Nights",
        "sampler": "dpmpp_2m", "scheduler": "karras", "steps": 30, "cfg": 7,
    },
    {
        "model": "realvisxlV50.safetensors",
        "w": 832, "h": 1216,
        "prompt": "editorial fashion photograph, stunning model in avant-garde haute couture dress, dramatic studio lighting with colored gels, purple and teal rim light, smoke effects, Vogue magazine quality, shot on Hasselblad, ultra sharp, 8k",
        "negative": NEGATIVE_SDXL,
        "nsfw": False, "title": "Haute Couture Editorial",
        "sampler": "dpmpp_2m", "scheduler": "karras", "steps": 28, "cfg": 7,
    },
    {
        "model": "realvisxlV50.safetensors",
        "w": 1216, "h": 832,
        "prompt": "epic fantasy landscape, massive ancient ruins overgrown with bioluminescent plants, twin moons in the sky, a lone warrior silhouette standing on cliff edge, dramatic clouds, god rays breaking through, matte painting style, concept art, 8k ultra detailed",
        "negative": NEGATIVE_SDXL,
        "nsfw": False, "title": "Ancient Ruins at Twilight",
        "sampler": "dpmpp_2m", "scheduler": "karras", "steps": 30, "cfg": 7,
    },

    # --- Artistic NSFW (realvisxlV50 - SDXL) ---
    {
        "model": "realvisxlV50.safetensors",
        "w": 832, "h": 1216,
        "prompt": "fine art photography, beautiful woman in sheer fabric draped elegantly, soft natural window light, renaissance painting inspired composition, marble interior, classical sculpture in background, artistic nude, tasteful, museum quality, shot on medium format, 8k",
        "negative": NEGATIVE_SDXL,
        "nsfw": True, "title": "Renaissance Light Study",
        "sampler": "dpmpp_2m", "scheduler": "karras", "steps": 30, "cfg": 7,
    },
    {
        "model": "realvisxlV50.safetensors",
        "w": 832, "h": 1216,
        "prompt": "professional boudoir photography, gorgeous woman in black lace lingerie, luxury bedroom with silk sheets, warm candlelight ambiance, soft bokeh, intimate mood, glamour photography, shot on Canon R5, 85mm f1.4, 8k ultra detailed",
        "negative": NEGATIVE_SDXL,
        "nsfw": True, "title": "Candlelit Boudoir",
        "sampler": "dpmpp_2m", "scheduler": "karras", "steps": 28, "cfg": 7,
    },

    # --- Realistic NSFW (epicphotogasm - SD1.5) ---
    {
        "model": "epicphotogasm.safetensors",
        "w": 512, "h": 768,
        "prompt": "(masterpiece:1.4), (best quality:1.4), ultra detailed, photorealistic, beautiful young woman, beach sunset, bikini, wet skin glistening, golden hour, ocean waves, wind in hair, stunning eyes, natural beauty, professional photography",
        "negative": NEGATIVE_SD15,
        "nsfw": True, "title": "Sunset Beach",
        "sampler": "dpmpp_2m", "scheduler": "karras", "steps": 30, "cfg": 7,
    },
    {
        "model": "epicphotogasm.safetensors",
        "w": 512, "h": 768,
        "prompt": "(masterpiece:1.4), (best quality:1.4), ultra detailed, photorealistic, beautiful woman, elegant pose, red evening gown with thigh slit, luxury penthouse rooftop, city skyline at night, dramatic lighting, fashion editorial, stunning",
        "negative": NEGATIVE_SD15,
        "nsfw": False, "title": "Penthouse Glamour",
        "sampler": "dpmpp_2m", "scheduler": "karras", "steps": 30, "cfg": 7,
    },

    # --- Asian Beauty (chilloutmix - SD1.5) ---
    {
        "model": "chilloutmix.safetensors",
        "w": 512, "h": 768,
        "prompt": "(masterpiece:1.4), (best quality:1.4), 1girl, beautiful korean woman, natural makeup, soft smile, cherry blossom background, spring, white dress, gentle wind, hair flowing, soft natural light, depth of field, professional portrait photography, 8k",
        "negative": NEGATIVE_SD15,
        "nsfw": False, "title": "Cherry Blossom Portrait",
        "sampler": "dpmpp_2m", "scheduler": "karras", "steps": 30, "cfg": 7,
    },
    {
        "model": "chilloutmix.safetensors",
        "w": 512, "h": 768,
        "prompt": "(masterpiece:1.4), (best quality:1.4), 1girl, beautiful japanese woman, onsen hot spring, towel, steam, relaxed expression, natural beauty, wet hair, traditional ryokan interior, warm ambient light, intimate atmosphere, photorealistic",
        "negative": NEGATIVE_SD15,
        "nsfw": True, "title": "Hot Spring Serenity",
        "sampler": "dpmpp_2m", "scheduler": "karras", "steps": 30, "cfg": 7,
    },

    # --- Anime/Stylized (cyberrealisticPony) ---
    {
        "model": "cyberrealisticPony.safetensors",
        "w": 768, "h": 1024,
        "prompt": "score_9, score_8_up, score_7_up, 1girl, cyberpunk anime girl, neon-lit alley, short silver hair, glowing cybernetic eye, leather jacket, rain, reflections, dramatic angle, detailed background, masterpiece",
        "negative": NEGATIVE_PONY,
        "nsfw": False, "title": "Cyberpunk Anime",
        "sampler": "euler", "scheduler": "normal", "steps": 25, "cfg": 7,
    },
    {
        "model": "cyberrealisticPony.safetensors",
        "w": 768, "h": 1024,
        "prompt": "score_9, score_8_up, score_7_up, 1girl, fantasy elf warrior, long silver hair, ornate golden armor, enchanted forest, magical particles, ethereal glow, detailed face, beautiful eyes, epic composition, masterpiece",
        "negative": NEGATIVE_PONY,
        "nsfw": False, "title": "Elf Warrior",
        "sampler": "euler", "scheduler": "normal", "steps": 25, "cfg": 7,
    },
]


def comfyui_request(path, data=None, method="GET"):
    """Make a request to ComfyUI API."""
    url = f"{COMFYUI_URL}{path}"
    headers = {"User-Agent": "Mozilla/5.0", "Content-Type": "application/json"}
    if data:
        req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers, method="POST")
    else:
        req = urllib.request.Request(url, headers=headers)
    resp = urllib.request.urlopen(req, context=ctx, timeout=120)
    return json.loads(resp.read())


def generate_image(item):
    """Submit a generation job to ComfyUI and wait for result."""
    seed = random.randint(1, 2**32)
    workflow = {
        "prompt": {
            "1": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {"ckpt_name": item["model"]}
            },
            "2": {
                "class_type": "CLIPTextEncode",
                "inputs": {"clip": ["1", 1], "text": item["prompt"]}
            },
            "3": {
                "class_type": "CLIPTextEncode",
                "inputs": {"clip": ["1", 1], "text": item["negative"]}
            },
            "4": {
                "class_type": "EmptyLatentImage",
                "inputs": {"batch_size": 1, "height": item["h"], "width": item["w"]}
            },
            "5": {
                "class_type": "KSampler",
                "inputs": {
                    "cfg": item["cfg"],
                    "denoise": 1.0,
                    "latent_image": ["4", 0],
                    "model": ["1", 0],
                    "negative": ["3", 0],
                    "positive": ["2", 0],
                    "sampler_name": item["sampler"],
                    "scheduler": item["scheduler"],
                    "seed": seed,
                    "steps": item["steps"],
                }
            },
            "6": {
                "class_type": "VAEDecode",
                "inputs": {"samples": ["5", 0], "vae": ["1", 2]}
            },
            "7": {
                "class_type": "SaveImage",
                "inputs": {"filename_prefix": "showcase", "images": ["6", 0]}
            },
        }
    }

    print(f"  Submitting to ComfyUI ({item['model']}, {item['w']}x{item['h']})...")
    result = comfyui_request("/prompt", workflow)
    prompt_id = result["prompt_id"]
    print(f"  prompt_id: {prompt_id}")

    # Poll for completion
    for attempt in range(120):
        time.sleep(3)
        history = comfyui_request(f"/history/{prompt_id}")
        if prompt_id in history:
            outputs = history[prompt_id].get("outputs", {})
            for node_id, node_out in outputs.items():
                if "images" in node_out:
                    img = node_out["images"][0]
                    print(f"  Generated: {img['filename']}")
                    return img["filename"], img.get("subfolder", ""), img.get("type", "output"), seed
            # Check for errors
            status = history[prompt_id].get("status", {})
            if status.get("status_str") == "error":
                print(f"  ERROR: {status.get('messages', '')}")
                return None, None, None, seed
        if attempt % 10 == 9:
            print(f"  Still waiting... ({(attempt+1)*3}s)")

    print("  TIMEOUT")
    return None, None, None, seed


def download_image(filename, subfolder, img_type):
    """Download generated image from ComfyUI."""
    params = urllib.parse.urlencode({"filename": filename, "subfolder": subfolder, "type": img_type})
    url = f"{COMFYUI_URL}/view?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    resp = urllib.request.urlopen(req, context=ctx, timeout=60)
    return resp.read()


def upload_to_supabase(image_data, filename):
    """Upload image to Supabase Storage."""
    storage_path = f"self-hosted/showcase/{filename}"
    url = f"{SUPABASE_URL}/storage/v1/object/{storage_path}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "image/png",
        "x-upsert": "true",
    }
    req = urllib.request.Request(url, data=image_data, headers=headers, method="POST")
    resp = urllib.request.urlopen(req, context=ctx, timeout=60)
    result = json.loads(resp.read())
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{storage_path}"
    return public_url


def insert_gallery(item, image_url, seed):
    """Insert into gallery table."""
    record = {
        "id": str(uuid.uuid4()),
        "user_id": OWNER_USER_ID,
        "job_id": f"showcase_{uuid.uuid4().hex[:16]}",
        "prompt": item["prompt"],
        "negative_prompt": item["negative"],
        "model": item["model"].replace(".safetensors", ""),
        "steps": item["steps"],
        "cfg": item["cfg"],
        "seed": seed,
        "width": item["w"],
        "height": item["h"],
        "image_url": image_url,
        "title": item["title"],
        "description": f"Generated with {item['model'].replace('.safetensors', '')} on EGAKU AI",
        "tags": ["showcase", "ai-generated"],
        "nsfw": item["nsfw"],
        "public": True,
        "likes_count": 0,
    }
    url = f"{SUPABASE_URL}/rest/v1/gallery"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    data = json.dumps(record).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    resp = urllib.request.urlopen(req, context=ctx, timeout=30)
    return record["id"]


def main():
    print(f"=== EGAKU AI Showcase Generator ===")
    print(f"Generating {len(SHOWCASE)} images...\n")

    results = []
    for i, item in enumerate(SHOWCASE):
        print(f"[{i+1}/{len(SHOWCASE)}] {item['title']}")
        try:
            filename, subfolder, img_type, seed = generate_image(item)
            if not filename:
                print(f"  SKIPPED (generation failed)\n")
                continue

            print(f"  Downloading...")
            image_data = download_image(filename, subfolder, img_type)
            print(f"  Downloaded {len(image_data)} bytes")

            storage_name = f"{uuid.uuid4().hex[:16]}.png"
            print(f"  Uploading to Supabase...")
            image_url = upload_to_supabase(image_data, storage_name)
            print(f"  URL: {image_url}")

            print(f"  Inserting into gallery...")
            gallery_id = insert_gallery(item, image_url, seed)
            print(f"  Gallery ID: {gallery_id}")

            results.append({"title": item["title"], "url": image_url, "nsfw": item["nsfw"]})
            print(f"  DONE\n")

        except Exception as e:
            print(f"  ERROR: {e}\n")
            continue

    print(f"\n=== Summary ===")
    print(f"Generated: {len(results)}/{len(SHOWCASE)}")
    for r in results:
        nsfw_tag = " [NSFW]" if r["nsfw"] else ""
        print(f"  {r['title']}{nsfw_tag}: {r['url']}")


if __name__ == "__main__":
    main()
