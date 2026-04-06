"""Generate high-quality showcase content via fal.ai and upload to Supabase gallery."""
import httpx, time, uuid, random, os, sys
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()

FAL_KEY = os.getenv('FAL_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

FAL_HEADERS = {'Authorization': f'Key {FAL_KEY}', 'Content-Type': 'application/json'}

DUMMY_USERS = [
    '73e59337-ea6f-458b-b5a2-2521035eda3f',
    'f375d6c5-3937-4362-9f9e-83a51bd8c523',
    '59e39fd9-4c6a-40bd-b3ac-180955aadcde',
    '83bda190-c43c-45cf-8aba-5b7090f41b8a',
    '4b19bed4-4aee-4706-a967-d8dbe604209a',
    '93773d5b-7a38-46e3-ad47-85fc6f1dc612',
    'eed21f09-4c46-40e6-981c-47d36a2e93f6',
    'c5ba54bf-5893-4bce-b7bc-f48096ae719d',
]

# High quality content plan
CONTENT = [
    # === SFW - Stunning visuals ===
    {'title': 'Neon Tokyo Rain', 'prompt': 'Hyper-realistic photograph of Tokyo Shibuya crossing at night in heavy rain, neon signs reflecting on wet asphalt, umbrellas, cinematic lighting, shot on Sony A7R IV, 85mm lens, f/1.4, 8K resolution', 'nsfw': False, 'tags': ['tokyo','cyberpunk','rain','cityscape'], 'size': 'landscape_16_9', 'model': 'flux-dev'},
    {'title': 'Samurai at Sunrise', 'prompt': 'Epic cinematic photograph of a lone samurai warrior standing on a cliff edge overlooking misty mountains at golden hour sunrise, cherry blossom petals floating in the wind, traditional full armor with katana, volumetric god rays, shot on ARRI Alexa 65, anamorphic lens', 'nsfw': False, 'tags': ['samurai','japan','cinematic','sunrise'], 'size': 'portrait_16_9', 'model': 'flux-dev'},
    {'title': 'Cyberpunk Megacity 2099', 'prompt': 'Breathtaking aerial view of a futuristic cyberpunk megacity at night, massive holographic advertisements, flying vehicles with light trails, towering chrome skyscrapers, rain, neon blue and magenta, Blade Runner atmosphere, photorealistic CGI, 8K', 'nsfw': False, 'tags': ['scifi','cyberpunk','city','futuristic'], 'size': 'landscape_16_9', 'model': 'flux-dev'},
    {'title': 'Aurora Over Iceland', 'prompt': 'Stunning astrophotography of vivid green and purple aurora borealis dancing over a glacial lagoon in Iceland, icebergs reflecting the lights, stars visible, long exposure, shot on Nikon Z9, 14mm f/2.8, 8K', 'nsfw': False, 'tags': ['aurora','iceland','landscape','astrophotography'], 'size': 'landscape_16_9', 'model': 'flux-dev'},
    {'title': 'High Fashion Editorial', 'prompt': 'Vogue magazine cover quality fashion photograph of a stunning model in avant-garde designer outfit, dramatic studio lighting with colored gels, confident pose, shot by Annie Leibovitz style, medium format Hasselblad, 8K', 'nsfw': False, 'tags': ['fashion','editorial','portrait','vogue'], 'size': 'portrait_16_9', 'model': 'flux-dev'},
    {'title': 'Ancient Temple in Jungle', 'prompt': 'Photorealistic image of an explorer discovering a massive ancient stone temple overgrown with jungle vines, dramatic god rays piercing through the canopy, moss-covered stone carvings, mist, cinematic adventure movie scene, 8K', 'nsfw': False, 'tags': ['adventure','temple','jungle','cinematic'], 'size': 'landscape_16_9', 'model': 'flux-dev'},
    {'title': 'Lighthouse in Storm', 'prompt': 'Dramatic photograph of a lighthouse being hit by massive ocean waves during a violent storm, lightning in dark sky, spray and foam, turquoise and dark blue water, power of nature, shot on Phase One IQ4, 8K', 'nsfw': False, 'tags': ['storm','ocean','lighthouse','dramatic'], 'size': 'landscape_16_9', 'model': 'flux-dev'},
    {'title': 'Korean Beauty Portrait', 'prompt': 'Stunning beauty portrait of a Korean woman in soft golden hour light, flawless skin, natural makeup, wearing elegant hanbok with modern twist, cherry blossom background, shot on Canon EOS R5, 85mm f/1.2, shallow depth of field, 8K', 'nsfw': False, 'tags': ['korean','beauty','portrait','hanbok'], 'size': 'portrait_16_9', 'model': 'flux-dev'},
    {'title': 'Influencer Product Review', 'prompt': 'Professional YouTube thumbnail style photo of a beautiful female influencer holding and presenting a luxury skincare product, ring light reflection in eyes, clean white studio background, engaging smile, social media content creator aesthetic, 8K', 'nsfw': False, 'tags': ['influencer','beauty','product','social-media'], 'size': 'landscape_16_9', 'model': 'flux-dev'},
    {'title': 'Makeup Tutorial Close-up', 'prompt': 'Ultra-detailed close-up beauty shot for makeup commercial, model with dramatic smokey eye makeup and glossy lips, professional beauty lighting, dewy skin, shot on Hasselblad H6D-100c, 120mm macro, cosmetics advertisement quality, 8K', 'nsfw': False, 'tags': ['makeup','beauty','commercial','closeup'], 'size': 'portrait_16_9', 'model': 'flux-dev'},

    # === NSFW - Fine Art / Artistic ===
    {'title': 'Rain Goddess', 'prompt': 'Fine art photograph of a beautiful woman standing in rain, artistic nude, water droplets glistening on skin, dramatic side lighting, wet hair flowing, elegant dance pose, museum quality black and white with subtle warm tones, shot on Leica S3, 8K', 'nsfw': True, 'tags': ['artistic-nude','rain','fine-art','dance'], 'size': 'portrait_16_9', 'model': 'flux-dev'},
    {'title': 'Moonlit Onsen', 'prompt': 'Cinematic photograph of a beautiful Japanese woman bathing in a traditional outdoor onsen hot spring at night, steam rising around her, full moon illuminating autumn maple trees, artistic nude seen from behind, serene peaceful atmosphere, shot on Sony A1, 8K', 'nsfw': True, 'tags': ['onsen','japanese','artistic-nude','moonlight'], 'size': 'portrait_16_9', 'model': 'flux-dev'},
    {'title': 'Renaissance Nude Study', 'prompt': 'Museum quality fine art nude photograph inspired by Botticelli, beautiful woman reclining on white marble in classical pose, Renaissance lighting, draped silk fabric, golden warm tones, timeless beauty, shot on Phase One, 8K', 'nsfw': True, 'tags': ['fine-art','renaissance','classical','nude'], 'size': 'landscape_16_9', 'model': 'flux-dev'},
    {'title': 'Golden Body Art', 'prompt': 'Stunning editorial photograph of a woman covered in metallic gold body paint, artistic nude, golden hour desert backlight creating rim lighting, sand dunes, sculptural pose like a living statue, fine art photography, 8K', 'nsfw': True, 'tags': ['body-art','gold','desert','artistic-nude'], 'size': 'portrait_16_9', 'model': 'flux-dev'},

    # === NSFW - Non-erotic edgy ===
    {'title': 'Mech Samurai Rampage', 'prompt': 'Epic action scene of a massive robot samurai mech destroying a neon-lit cyberpunk city, glowing red optical sensors, energy katana slicing through buildings, sparks and explosions, dynamic angle, rain, detailed mechanical armor, blockbuster movie CGI quality, 8K', 'nsfw': True, 'tags': ['mech','samurai','action','cyberpunk','destruction'], 'size': 'landscape_16_9', 'model': 'flux-dev'},
    {'title': 'Dark Angel Warrior', 'prompt': 'Dark fantasy cinematic shot of a fierce angel warrior woman with massive black feathered wings fully spread, battle-damaged revealing armor, wielding a glowing ethereal sword, gothic cathedral ruins, blood moon sky, dramatic lighting, 8K', 'nsfw': True, 'tags': ['dark-angel','warrior','fantasy','wings'], 'size': 'portrait_16_9', 'model': 'flux-dev'},
    {'title': 'Wasteland Survivor', 'prompt': 'Gritty cinematic photograph of a fierce woman survivor in post-apocalyptic wasteland, torn tactical clothing, battle scars, makeshift weapons, burning city ruins in background, dramatic orange sunset, Mad Max aesthetic, 8K', 'nsfw': True, 'tags': ['post-apocalyptic','survivor','wasteland','gritty'], 'size': 'landscape_16_9', 'model': 'flux-dev'},
    {'title': 'Yakuza Night', 'prompt': 'Noir cinematic photograph of a tattooed yakuza woman in a dimly lit Tokyo bar, full back tattoo visible through open kimono, smoke curling from cigarette, neon light through blinds, moody atmosphere, Takeshi Kitano film aesthetic, 8K', 'nsfw': True, 'tags': ['yakuza','tattoo','noir','tokyo'], 'size': 'portrait_16_9', 'model': 'flux-dev'},

    # === NSFW - Adult / Sensual ===
    {'title': 'Luxury Boudoir', 'prompt': 'High-end boudoir photograph of a gorgeous woman in black lace lingerie on a red velvet chaise longue, baroque gold interior, warm candlelight, sensual elegant pose, Playboy editorial quality, shot on medium format, 8K', 'nsfw': True, 'tags': ['boudoir','lingerie','luxury','sensual'], 'size': 'portrait_16_9', 'model': 'flux-dev'},
    {'title': 'Steamy Glass Shower', 'prompt': 'Artistic sensual photograph of a beautiful woman in a glass walk-in shower, steam and water droplets on glass, wet skin, warm overhead lighting, seductive look over shoulder, modern luxury bathroom, editorial quality, 8K', 'nsfw': True, 'tags': ['shower','sensual','wet','steam'], 'size': 'portrait_16_9', 'model': 'flux-dev'},
    {'title': 'Silk Moonlight', 'prompt': 'Intimate photograph of a beautiful Asian woman lying on silk sheets in moonlight streaming through floor-to-ceiling windows, topless, soft shadows on skin, city skyline visible outside, sensual atmosphere, 8K', 'nsfw': True, 'tags': ['asian','moonlight','intimate','silk'], 'size': 'portrait_16_9', 'model': 'flux-dev'},
    {'title': 'Passionate Couple', 'prompt': 'Artistic intimate photograph of a passionate couple in a luxury hotel bed, intertwined bodies, soft warm backlighting, white sheets, romantic atmosphere, tasteful explicit composition, skin texture detail, 8K', 'nsfw': True, 'tags': ['couple','passionate','intimate','romantic'], 'size': 'landscape_16_9', 'model': 'flux-dev'},
    {'title': 'Pool Party Goddess', 'prompt': 'Vibrant photograph of a stunning woman emerging from an infinity pool at sunset, water cascading off her body, bikini, golden hour rim lighting, tropical resort background, Sports Illustrated Swimsuit quality, 8K', 'nsfw': True, 'tags': ['pool','bikini','sunset','tropical'], 'size': 'portrait_16_9', 'model': 'flux-dev'},
    {'title': 'Velvet Red Room', 'prompt': 'Provocative editorial photograph of a confident woman in a red-lit room, fishnet stockings and heels, leather furniture, cinematic red and purple lighting, powerful pose, high fashion meets provocative art, 8K', 'nsfw': True, 'tags': ['provocative','red-light','editorial','confident'], 'size': 'portrait_16_9', 'model': 'flux-dev'},
]


def generate_fal(prompt, size, model):
    """Generate image synchronously via fal.ai."""
    endpoint = 'fal-ai/flux/dev' if model == 'flux-dev' else 'fal-ai/flux/schnell'
    r = httpx.post(
        f'https://fal.run/{endpoint}',
        headers=FAL_HEADERS,
        json={'prompt': prompt, 'image_size': size, 'num_images': 1, 'enable_safety_checker': False},
        timeout=180,
    )
    r.raise_for_status()
    return r.json()


def upload_to_supabase(image_url, filename):
    """Download image from fal.ai and upload to Supabase storage."""
    # Download
    r = httpx.get(image_url, timeout=30, follow_redirects=True)
    r.raise_for_status()
    img_data = r.content
    content_type = r.headers.get('content-type', 'image/jpeg')
    ext = 'jpg' if 'jpeg' in content_type else 'png'
    fname = f'{filename}.{ext}'

    # Upload to Supabase
    upload_h = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': content_type,
        'x-upsert': 'true',
    }
    r2 = httpx.post(
        f'{SUPABASE_URL}/storage/v1/object/self-hosted/showcase/{fname}',
        content=img_data, headers=upload_h, timeout=60,
    )
    if r2.status_code not in (200, 201):
        raise RuntimeError(f'Upload failed: {r2.status_code} {r2.text[:200]}')

    return f'{SUPABASE_URL}/storage/v1/object/public/self-hosted/showcase/{fname}', len(img_data)


def insert_gallery(item, image_url):
    """Insert into gallery table."""
    user_id = random.choice(DUMMY_USERS)
    created = (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 21), hours=random.randint(0, 23))).isoformat()
    record = {
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'job_id': str(uuid.uuid4()),
        'title': item['title'],
        'description': 'AI Generated Art',
        'image_url': image_url,
        'nsfw': item['nsfw'],
        'public': True,
        'tags': item['tags'],
        'model': f'flux_{item["model"]}',
        'prompt': item['prompt'],
        'negative_prompt': '',
        'steps': 28,
        'cfg': 3.5,
        'seed': random.randint(0, 2**31),
        'width': 1024 if '16_9' in item['size'] and 'landscape' in item['size'] else 768,
        'height': 768 if '16_9' in item['size'] and 'landscape' in item['size'] else 1024,
        'created_at': created,
    }
    r = httpx.post(
        f'{SUPABASE_URL}/rest/v1/gallery', json=record,
        headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}',
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
        timeout=30,
    )
    if r.status_code not in (200, 201):
        raise RuntimeError(f'Gallery insert failed: {r.status_code} {r.text[:200]}')
    return user_id


def main():
    print(f'=== EGAKU AI High-Quality Showcase Generator ===')
    print(f'Model: Flux Dev via fal.ai')
    print(f'Items: {len(CONTENT)} ({sum(1 for c in CONTENT if not c["nsfw"])} SFW, {sum(1 for c in CONTENT if c["nsfw"])} NSFW)')
    print()

    success = 0
    failed = 0

    for i, item in enumerate(CONTENT):
        label = 'NSFW' if item['nsfw'] else 'SFW'
        print(f'[{i+1}/{len(CONTENT)}] [{label}] {item["title"]}')
        sys.stdout.flush()

        try:
            result = generate_fal(item['prompt'], item['size'], item['model'])
            images = result.get('images', [])
            if not images:
                raise RuntimeError('No images in result')

            fal_url = images[0]['url']
            fname = uuid.uuid4().hex[:16]
            sb_url, size_bytes = upload_to_supabase(fal_url, fname)
            user_id = insert_gallery(item, sb_url)

            print(f'  OK {size_bytes//1024}KB -> gallery ({user_id[:8]})')
            success += 1

        except Exception as e:
            print(f'  FAIL: {e}')
            failed += 1

        sys.stdout.flush()

    print(f'\n=== Done: {success} success, {failed} failed ===')


if __name__ == '__main__':
    main()
