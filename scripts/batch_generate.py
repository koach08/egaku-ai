"""
Batch generate images and videos for EGAKU AI gallery.
Uses the production API with your studio account token.

Usage:
  1. Get your access token: login at egaku-ai.com, open DevTools > Application > Local Storage > sb-xxx-auth-token > access_token
  2. Run: python3 batch_generate.py --token YOUR_TOKEN
  3. Or set env: export EGAKU_TOKEN=YOUR_TOKEN && python3 batch_generate.py
"""

import argparse
import json
import os
import sys
import time

import httpx

API_BASE = "https://api.egaku-ai.com/api"

# ─── Gallery Prompts ───
# Each item: (type, model, prompt, extra_params)
# type: "image" or "video"

GALLERY_PROMPTS = [
    # ── Images: Nano Banana 2 ──
    ("image", "fal_nano_banana_2", "A lone samurai standing on a cliff edge overlooking a vast ocean at golden hour, dramatic clouds painted in crimson and amber, wind blowing through his tattered cloak, cinematic composition with depth of field, photorealistic 8K detail", {"width": 1920, "height": 1080}),
    ("image", "fal_nano_banana_2", "Neon-drenched Tokyo alleyway in 2087, holographic advertisements floating above ramen shops, rain-slicked streets reflecting pink and cyan lights, a woman with cybernetic arms walking under a transparent umbrella, Blade Runner atmosphere, hyper-detailed, volumetric fog", {"width": 1080, "height": 1920}),
    ("image", "fal_nano_banana_2", "Close-up portrait of an elderly Japanese fisherman, deep weathered wrinkles telling stories of decades at sea, morning light casting warm golden shadows across his face, ocean mist in background, shot on Hasselblad, 85mm f/1.4, extraordinary detail in eyes and skin texture", {"width": 1024, "height": 1024}),
    ("image", "fal_nano_banana_2", "Vintage Japanese movie poster for a film called NEON GHOST, featuring a spectral woman in a white kimono floating above a rain-soaked Shinjuku intersection, bold typography with the title in both English and Japanese, retro 1970s color grading, grainy film texture", {"width": 1080, "height": 1920}),
    ("image", "fal_nano_banana_2", "A colossal derelict spaceship half-buried in red desert sand on an alien planet, two suns setting in the background casting long purple shadows, tiny human explorers in spacesuits walking toward an open hatch glowing with blue light, epic scale, Moebius meets Ridley Scott", {"width": 1920, "height": 1080}),

    # ── Images: Grok Imagine ──
    ("image", "fal_grok_imagine", "An ancient dragon coiled around a floating crystal palace above the clouds, iridescent scales reflecting starlight, aurora borealis swirling in the background, epic fantasy illustration with impossible architectural detail, concept art quality", {"width": 1024, "height": 1024}),
    ("image", "fal_grok_imagine", "Ethereal watercolor illustration of a hidden forest shrine in autumn, torii gate covered in moss, kitsune fox spirit sitting beneath glowing lanterns, fallen maple leaves floating in a still pond, delicate brushwork, traditional Japanese watercolor aesthetic, Yoshitaka Amano inspired", {"width": 1024, "height": 1024}),

    # ── Images: Flux Dev ──
    ("image", "fal_flux_dev", "Beautiful anime girl with flowing silver hair and heterochromia eyes (one blue, one gold), wearing a black military uniform with gold epaulettes, cherry blossoms falling around her, dramatic wind effect, studio lighting, sharp anime illustration style, masterpiece quality", {"width": 768, "height": 1024, "negative_prompt": "low quality, blurry, deformed, bad anatomy"}),
    ("image", "fal_flux_dev", "A massive gothic cathedral submerged halfway in a dark crystalline ocean, bioluminescent jellyfish floating through broken stained glass windows, moonlight piercing through gaps in storm clouds above, dark fantasy atmosphere, incredibly detailed architecture, concept art", {"width": 1024, "height": 768}),

    # ── Images: Flux Realism ──
    ("image", "fal_flux_realism", "A perfectly crafted Japanese ceramic tea bowl (chawan) with wabi-sabi glaze in deep indigo and cream, sitting on weathered oak surface, soft diffused studio lighting with gentle shadows, macro photography, product photography, 4K detail", {"width": 1024, "height": 1024}),

    # ── NSFW Images ──
    ("image", "fal_flux_realism", "Fine art nude photography inspired by classical painting, a woman reclining on draped silk fabric in the style of Bouguereau, soft Rembrandt lighting from a single window, warm skin tones against deep burgundy background, tasteful artistic composition, museum gallery quality, shot on medium format film", {"width": 1024, "height": 768, "nsfw": True}),
    ("image", "fal_flux_realism", "Contemporary fine art nude, female figure standing in a beam of sunlight in an abandoned concrete industrial space, dust particles floating in the light, strong geometric shadows across her body, black and white photography with dramatic contrast, inspired by Helmut Newton", {"width": 768, "height": 1024, "nsfw": True}),
    ("image", "fal_flux_realism", "Stunning Japanese woman in sheer lingerie lounging on a luxury hotel bed, warm ambient lighting from bedside lamp, floor-to-ceiling window showing city skyline at twilight, shallow depth of field, intimate boudoir photography, skin detail, 85mm portrait lens", {"width": 768, "height": 1024, "nsfw": True}),
    ("image", "fal_flux_realism", "Beautiful woman emerging from a steamy outdoor onsen hot spring, shoulders and collarbone visible above milky water, autumn maple leaves floating on the surface, mountain scenery in soft focus background, steam rising, golden hour light, sensual Japanese aesthetic", {"width": 1024, "height": 1024, "nsfw": True}),
    ("image", "fal_flux_dev", "Gorgeous anime illustration of a succubus queen on a dark throne, long flowing crimson hair, revealing black leather outfit with intricate gold detailing, glowing red eyes, bat wings spread wide, dark castle interior with candles and rose petals, masterpiece anime art, highly detailed", {"width": 768, "height": 1024, "nsfw": True, "negative_prompt": "low quality, bad anatomy, deformed"}),
    ("image", "fal_flux_realism", "Professional adult glamour photography, attractive couple in passionate embrace on white satin sheets, soft warm studio lighting, tasteful intimate pose, both looking at camera, high-end production value, clean crisp detail", {"width": 1024, "height": 768, "nsfw": True}),
    ("image", "fal_flux_realism", "Gorgeous woman in a luxurious marble bathroom, wet hair slicked back, water droplets on skin, wrapped loosely in a white towel that is slipping off one shoulder, steam on the mirror behind her, warm overhead lighting, high-end fashion editorial feel, photorealistic", {"width": 768, "height": 1024, "nsfw": True}),
    ("image", "fal_flux_dev", "Dark fantasy elf queen with long pointed ears and luminous violet eyes, barely covered by ornate golden armor and flowing sheer fabric, sitting on a throne of twisted roots in an enchanted moonlit forest, fireflies surrounding her, detailed fantasy art, Boris Vallejo style", {"width": 768, "height": 1024, "nsfw": True, "negative_prompt": "low quality, deformed, bad hands"}),
    ("image", "fal_flux_realism", "Photorealistic full body shot of a gorgeous woman lying on her back on a messy bed, completely nude, one hand running through her tousled hair, legs slightly parted, looking directly at camera with seductive expression, soft warm bedroom lighting, professional adult photography, sharp focus on face and body, realistic skin texture", {"width": 768, "height": 1024, "nsfw": True}),
    ("image", "fal_flux_realism", "Intimate scene of a nude couple in bed, woman straddling man, bodies intertwined, her back arched with pleasure, dramatic side lighting creating sculpted shadows on their bodies, luxury bedroom with silk sheets, cinematic adult photography, tasteful but explicit, warm color tones, photorealistic detail", {"width": 1024, "height": 768, "nsfw": True}),

    # ── Videos ──
    ("video", "fal_ltx_t2v", "Cinematic timelapse of Mount Fuji at sunrise, clouds flowing rapidly below the peak, sky transitioning from deep purple to golden orange, cherry blossom trees in foreground swaying gently, 4K nature documentary quality", {}),
    ("video", "fal_kling25_t2v", "Slow motion shot of a Japanese katana being drawn from its sheath, sparks of light reflecting off the polished blade, traditional dojo setting with wooden floors and paper walls, dramatic cinematic lighting, shallow depth of field, samurai film aesthetic", {}),
    ("video", "fal_kling25_t2v", "A magical girl transforming in a burst of starlight, her school uniform dissolving into an ornate battle dress, hair changing from black to luminous silver, spinning in mid-air surrounded by geometric light patterns, anime transformation sequence, vibrant colors", {}),
    ("video", "fal_kling25_t2v", "A hooded figure sprinting across neon-lit rooftops in a cyberpunk megacity, leaping between buildings as police drones chase with searchlights, rain pouring down, holographic billboards flickering in the background, parkour action sequence, cinematic camera following the action", {}),
    ("video", "fal_wan_t2v", "Underwater camera slowly gliding through a vibrant coral reef teeming with tropical fish, a sea turtle gracefully swimming past the lens, sunbeams piercing through crystal clear turquoise water from above, schools of silver fish parting as the camera moves through, BBC Planet Earth quality", {}),
]


def generate_image(client: httpx.Client, token: str, model: str, prompt: str, params: dict) -> dict | None:
    """Generate an image via the API."""
    body = {
        "prompt": prompt,
        "model": model,
        "width": params.get("width", 1024),
        "height": params.get("height", 1024),
        "steps": 25,
        "cfg": 7,
        "seed": -1,
        "nsfw": params.get("nsfw", False),
    }
    if params.get("negative_prompt"):
        body["negative_prompt"] = params["negative_prompt"]

    resp = client.post(
        f"{API_BASE}/generate/image",
        json=body,
        headers={"Authorization": f"Bearer {token}"},
        timeout=180,
    )
    if resp.status_code == 200:
        return resp.json()
    print(f"  ERROR {resp.status_code}: {resp.text[:200]}")
    return None


def generate_video(client: httpx.Client, token: str, model: str, prompt: str, params: dict) -> dict | None:
    """Generate a video via the API."""
    body = {
        "prompt": prompt,
        "model": model,
        "width": 512,
        "height": 512,
        "steps": 20,
        "cfg": 7,
        "seed": -1,
        "frame_count": 16,
        "fps": 8,
        "nsfw": params.get("nsfw", False),
    }

    resp = client.post(
        f"{API_BASE}/generate/video",
        json=body,
        headers={"Authorization": f"Bearer {token}"},
        timeout=300,
    )
    if resp.status_code == 200:
        return resp.json()
    print(f"  ERROR {resp.status_code}: {resp.text[:200]}")
    return None


def main():
    parser = argparse.ArgumentParser(description="Batch generate gallery content for EGAKU AI")
    parser.add_argument("--token", type=str, default=os.environ.get("EGAKU_TOKEN", ""), help="Supabase access token")
    parser.add_argument("--start", type=int, default=0, help="Start from prompt index (0-based)")
    parser.add_argument("--end", type=int, default=None, help="End at prompt index (exclusive)")
    parser.add_argument("--images-only", action="store_true", help="Only generate images")
    parser.add_argument("--videos-only", action="store_true", help="Only generate videos")
    parser.add_argument("--dry-run", action="store_true", help="Show prompts without generating")
    args = parser.parse_args()

    if not args.token and not args.dry_run:
        print("ERROR: Token required. Use --token or set EGAKU_TOKEN env var.")
        print("Get your token: login at egaku-ai.com > DevTools > Application > Local Storage > sb-xxx-auth-token > access_token")
        sys.exit(1)

    prompts = GALLERY_PROMPTS[args.start:args.end]

    if args.images_only:
        prompts = [p for p in prompts if p[0] == "image"]
    elif args.videos_only:
        prompts = [p for p in prompts if p[0] == "video"]

    print(f"Will generate {len(prompts)} items")
    print()

    if args.dry_run:
        for i, (gen_type, model, prompt, params) in enumerate(prompts):
            nsfw_tag = " [NSFW]" if params.get("nsfw") else ""
            print(f"  [{i}] {gen_type.upper()}{nsfw_tag} ({model})")
            print(f"      {prompt[:80]}...")
            print()
        return

    client = httpx.Client()
    results = {"success": 0, "failed": 0, "skipped": 0}

    for i, (gen_type, model, prompt, params) in enumerate(prompts):
        idx = args.start + i
        nsfw_tag = " [NSFW]" if params.get("nsfw") else ""
        print(f"[{idx}/{len(GALLERY_PROMPTS)}] {gen_type.upper()}{nsfw_tag} ({model})")
        print(f"  Prompt: {prompt[:80]}...")

        try:
            if gen_type == "image":
                result = generate_image(client, args.token, model, prompt, params)
            else:
                result = generate_video(client, args.token, model, prompt, params)

            if result and result.get("result_url"):
                print(f"  OK: {result['result_url'][:80]}...")
                results["success"] += 1
            elif result and result.get("job_id"):
                print(f"  QUEUED: job_id={result['job_id']} (check status later)")
                results["success"] += 1
            else:
                print(f"  FAILED: no result")
                results["failed"] += 1
        except Exception as e:
            print(f"  EXCEPTION: {e}")
            results["failed"] += 1

        # Rate limiting: wait between generations
        if i < len(prompts) - 1:
            wait = 5 if gen_type == "image" else 10
            print(f"  Waiting {wait}s...")
            time.sleep(wait)

        print()

    print("=" * 50)
    print(f"Done! Success: {results['success']}, Failed: {results['failed']}")


if __name__ == "__main__":
    main()
