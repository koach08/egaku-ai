"""EGAKU AI マーケティングエージェント

2つのモード:
1. ギャラリーから既存SFW画像を投稿
2. 新しい画像を自動生成して投稿（匿名API使用）

cron (1日3回) or 手動で実行。
"""

import os
import json
import random
import time
import tempfile
from pathlib import Path

import httpx
import tweepy

# ── X API認証（EGAKU AIアカウント）──
API_KEY = "XUEZMSAH1o07irVPwHQss0aZ6"
API_SECRET = "ruoFRWtK7jFPQDIh90IDnMh2AITBzupPDScYiMuqHL8Vrmbvp2"
ACCESS_TOKEN = "2042617154969731072-LLzfLDggWVP1FtuW3MybUt09nWPBR1"
ACCESS_SECRET = "5dXIeIgKbUpA8XxWC6A5xpnkgq1fRynM9LCCOQKzy9Tfy"

# ── EGAKU AI API ──
API_BASE = "https://api.egaku-ai.com/api"

# ── 投稿テンプレート ──
TEMPLATES_GALLERY = [
    "Made this in 30 seconds with AI.\n\nFree to try → egaku-ai.com\n\n#AIart #AIgenerated #digitalart",
    "No camera. No Photoshop. Just a text prompt.\n\negaku-ai.com — 40+ AI tools, free to start.\n\n#AIart #AIgenerated #TextToImage",
    "AI-generated art. One prompt, one click.\n\negaku-ai.com\n\n#AIart #AIgenerated #aiartcommunity",
    "Created with AI in seconds.\n\n40+ tools for image, video & music.\negaku-ai.com\n\n#AIart #AIgenerated #digitalart",
]

TEMPLATES_FRESH = [
    "Just generated this with EGAKU AI.\n\n40+ AI tools. Free to start.\negaku-ai.com\n\n#AIart #AIgenerated #{style}",
    "AI art of the day.\n\nMade with {model} on EGAKU AI.\negaku-ai.com\n\n#AIart #AIgenerated #{style}",
    "Fresh AI generation. No editing.\n\nTry it free → egaku-ai.com\n\n#AIart #{style} #AIgenerated",
    "Today's AI creation.\n\negaku-ai.com — image, video & music generation.\n\n#AIart #AIgenerated #{style}",
]

# ── 自動生成用プロンプト（ジャンル別）──
AUTO_PROMPTS = [
    {"prompt": "cinematic portrait of a young woman in golden hour light, 85mm f/1.4, shallow depth of field, warm tones, film grain", "style": "portrait", "model": "Flux Dev"},
    {"prompt": "epic fantasy landscape, massive ancient tree city with glowing windows, bioluminescent mushrooms, floating islands, mist, volumetric lighting", "style": "fantasy", "model": "Flux Dev"},
    {"prompt": "cyberpunk street at night, neon signs in Japanese, rain-soaked pavement, reflections, lone figure with umbrella, Blade Runner atmosphere", "style": "cyberpunk", "model": "Flux Dev"},
    {"prompt": "anime girl, long silver hair, blue eyes, cherry blossom background, wind blowing petals, soft lighting, vibrant colors, masterpiece", "style": "anime", "model": "Flux Dev"},
    {"prompt": "professional product photography, luxury watch on marble surface, dramatic studio lighting, dark background, golden reflections, 8K", "style": "product", "model": "Flux Dev"},
    {"prompt": "steampunk airship flying above clouds at sunset, brass and copper details, gears, Victorian architecture, dramatic sky, cinematic", "style": "steampunk", "model": "Flux Dev"},
    {"prompt": "underwater scene, bioluminescent jellyfish, coral reef, deep blue ocean, volumetric light rays from surface, magical atmosphere", "style": "underwater", "model": "Flux Dev"},
    {"prompt": "cozy cabin interior during snowstorm, warm fireplace, bookshelves, cat sleeping on armchair, soft lighting, hygge atmosphere", "style": "cozy", "model": "Flux Dev"},
    {"prompt": "samurai standing in field of cherry blossoms at dawn, mist, katana drawn, traditional armor, cinematic composition, 4K", "style": "samurai", "model": "Flux Dev"},
    {"prompt": "futuristic city at sunset, flying cars, holographic billboards, glass towers reflecting orange sky, sci-fi, detailed, 8K", "style": "scifi", "model": "Flux Dev"},
    {"prompt": "oil painting of a Venice canal at twilight, gondolas, warm lights reflecting on water, classical brushstrokes, museum quality", "style": "oilpainting", "model": "Flux Dev"},
    {"prompt": "macro photography of a dewdrop on a flower petal, rainbow refraction inside the drop, early morning light, shallow DOF", "style": "macro", "model": "Flux Dev"},
    {"prompt": "dragon perched on a mountain peak at sunset, massive wings spread, fire breath, epic scale, fantasy illustration, detailed", "style": "dragon", "model": "Flux Dev"},
    {"prompt": "retro 80s synthwave landscape, neon grid, palm trees, sunset gradient purple orange, chrome car, nostalgic, retrowave", "style": "synthwave", "model": "Flux Dev"},
    {"prompt": "photorealistic cat wearing a tiny business suit, sitting at a desk with a laptop, office background, funny, detailed fur", "style": "funny", "model": "Flux Dev"},
    {"prompt": "aurora borealis over a frozen lake in Iceland, reflection in still water, starry sky, long exposure photography, breathtaking", "style": "nature", "model": "Flux Dev"},
    {"prompt": "gothic cathedral interior, dramatic light rays through stained glass windows, dust particles, dark atmosphere, architectural photography", "style": "architecture", "model": "Flux Dev"},
    {"prompt": "astronaut floating in space with Earth in background, realistic spacesuit, stars, nebula colors, cinematic, NASA quality", "style": "space", "model": "Flux Dev"},
]

# ── ファイル管理 ──
POSTED_FILE = Path(__file__).parent / ".posted_ids.json"
GENERATED_FILE = Path(__file__).parent / ".generated_prompts.json"

NSFW_KEYWORDS = {"nude", "naked", "nsfw", "sex", "porn", "hentai", "erotic", "topless", "lingerie", "undress", "ペニス", "全裸", "ヌード", "セックス"}


def load_json(path):
    if path.exists():
        return set(json.loads(path.read_text()))
    return set()

def save_json(path, data):
    path.write_text(json.dumps(list(data)))


def get_gallery_items():
    """ギャラリーからSFW画像のみ取得"""
    res = httpx.get(f"{API_BASE}/explore/?page=1&sort=popular&nsfw=false", timeout=15)
    data = res.json()
    items = data.get("items", [])
    safe = []
    for i in items:
        if not i.get("image_url"):
            continue
        if i.get("nsfw_flag") or i.get("nsfw"):
            continue
        prompt = (i.get("prompt") or "").lower()
        if any(kw in prompt for kw in NSFW_KEYWORDS):
            continue
        safe.append(i)
    return safe


def generate_fresh_image():
    """匿名APIで新しい画像を生成"""
    used = load_json(GENERATED_FILE)
    available = [p for i, p in enumerate(AUTO_PROMPTS) if str(i) not in used]
    if not available:
        # 全部使ったらリセット
        used = set()
        available = AUTO_PROMPTS

    chosen = random.choice(available)
    idx = str(AUTO_PROMPTS.index(chosen))

    print(f"Generating: {chosen['prompt'][:60]}...")

    try:
        res = httpx.post(
            f"{API_BASE}/generate/anonymous",
            json={"prompt": chosen["prompt"], "model": "flux_schnell", "width": 768, "height": 768},
            timeout=120,
        )
        data = res.json()
        image_url = data.get("image_url") or data.get("result_url")
        if image_url:
            used.add(idx)
            save_json(GENERATED_FILE, used)
            return image_url, chosen
    except Exception as e:
        print(f"Generation failed: {e}")

    return None, None


def download_image(url):
    res = httpx.get(url, timeout=30, follow_redirects=True)
    res.raise_for_status()
    data = res.content
    # Skip tiny images (likely black/blocked by safety filter)
    if len(data) < 5000:
        return None
    ext = ".jpg" if "jpeg" in res.headers.get("content-type", "") or "jpg" in url else ".png"
    tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    tmp.write(data)
    tmp.close()
    return tmp.name


def post_to_x(image_path, text):
    auth = tweepy.OAuth1UserHandler(API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_SECRET)
    api_v1 = tweepy.API(auth)
    client = tweepy.Client(
        consumer_key=API_KEY, consumer_secret=API_SECRET,
        access_token=ACCESS_TOKEN, access_token_secret=ACCESS_SECRET,
    )
    media = api_v1.media_upload(image_path)
    response = client.create_tweet(text=text, media_ids=[media.media_id])
    return response


def post_from_gallery():
    """ギャラリーから既存画像を投稿"""
    posted = load_json(POSTED_FILE)
    items = get_gallery_items()
    candidates = [i for i in items if i["id"] not in posted]

    if not candidates:
        return False

    # Try candidates until we find a valid image
    image_path = None
    item = None
    for candidate in candidates:
        image_path = download_image(candidate["image_url"])
        if image_path:
            item = candidate
            break
        print(f"Skipped black/tiny image: {candidate['id']}")
        posted.add(candidate["id"])

    if not item or not image_path:
        save_json(POSTED_FILE, posted)
        return False

    print(f"Gallery post: {item['id']} — {item.get('prompt', '')[:50]}...")
    template = random.choice(TEMPLATES_GALLERY)
    model = item.get("model", "")
    if model:
        model_display = model.replace("fal_", "").replace("_", " ").title()
        text = f"{template}\n\nModel: {model_display}"
    else:
        text = template

    try:
        result = post_to_x(image_path, text)
        print(f"Posted! {result}")
        posted.add(item["id"])
        save_json(POSTED_FILE, posted)
        return True
    except Exception as e:
        print(f"Failed: {e}")
        return False
    finally:
        os.unlink(image_path)


def post_fresh_generated():
    """新しい画像を生成して投稿"""
    image_url, prompt_info = generate_fresh_image()
    if not image_url:
        return False

    image_path = download_image(image_url)
    template = random.choice(TEMPLATES_FRESH)
    text = template.format(
        style=prompt_info["style"],
        model=prompt_info["model"],
    )

    try:
        result = post_to_x(image_path, text)
        print(f"Posted fresh! {result}")
        return True
    except Exception as e:
        print(f"Failed: {e}")
        return False
    finally:
        os.unlink(image_path)


def main():
    # 50%の確率でギャラリーから、50%で新規生成
    if random.random() < 0.5:
        print("Mode: Gallery")
        success = post_from_gallery()
        if not success:
            print("No gallery items, generating fresh...")
            post_fresh_generated()
    else:
        print("Mode: Fresh generation")
        success = post_fresh_generated()
        if not success:
            print("Generation failed, trying gallery...")
            post_from_gallery()


if __name__ == "__main__":
    main()
