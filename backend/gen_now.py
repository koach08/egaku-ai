"""Generate showcase images via ComfyUI and upload to Supabase gallery."""
import httpx, json, time, uuid, random, os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()

COMFYUI_URL = 'https://comfyui.egaku-ai.com'
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

DUMMY_USERS = [
    '73e59337-ea6f-458b-b5a2-2521035eda3f',
    'f375d6c5-3937-4362-9f9e-83a51bd8c523',
    '59e39fd9-4c6a-40bd-b3ac-180955aadcde',
    '83bda190-c43c-45cf-8aba-5b7090f41b8a',
    '4b19bed4-4aee-4706-a967-d8dbe604209a',
    '93773d5b-7a38-46e3-ad47-85fc6f1dc612',
]

NEG = '(worst quality:1.4), (low quality:1.4), blurry, deformed, mutated, text, watermark, extra fingers, bad anatomy, ugly, duplicate'
MODEL = 'v1-5-pruned-emaonly-fp16.safetensors'

CONTENT = [
    # === SFW - Impressive landscapes & scenes ===
    {'title': 'Neon Tokyo Nights', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, cyberpunk tokyo street at night, neon signs reflecting on wet pavement, heavy rain, cinematic lighting, depth of field, moody atmosphere, 8k uhd', 'nsfw': False, 'tags': ['cyberpunk','tokyo','neon','street'], 'w': 512, 'h': 768},
    {'title': 'Samurai at Dawn', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, samurai warrior standing on cliff edge, cherry blossom petals falling, sunrise behind mountains, traditional full armor, katana drawn, epic composition, volumetric lighting, 8k', 'nsfw': False, 'tags': ['samurai','japan','warrior','sunrise'], 'w': 512, 'h': 768},
    {'title': 'Sci-Fi Megacity', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, futuristic megacity at night, flying cars, holographic advertisements, massive skyscrapers, neon blue and pink, blade runner style, rain, reflections, cinematic, 8k', 'nsfw': False, 'tags': ['scifi','city','futuristic','neon'], 'w': 768, 'h': 512},
    {'title': 'Northern Lights', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, spectacular aurora borealis over frozen lake, reflection in water, snow covered mountains, astrophotography, green and purple lights, starry sky, 8k', 'nsfw': False, 'tags': ['landscape','aurora','nature','night'], 'w': 768, 'h': 512},
    {'title': 'Fashion Editorial', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, beautiful woman, high fashion editorial, dramatic studio lighting, elegant pose, designer outfit, professional photography, magazine cover, 8k', 'nsfw': False, 'tags': ['fashion','portrait','editorial','studio'], 'w': 512, 'h': 768},
    {'title': 'Ancient Temple Discovery', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, explorer discovering ancient temple in dense jungle, overgrown ruins, god rays through canopy, moss covered stone, adventure, cinematic composition, 8k', 'nsfw': False, 'tags': ['adventure','temple','jungle','exploration'], 'w': 768, 'h': 512},
    {'title': 'Ocean Storm', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, massive waves crashing against lighthouse during storm, dramatic sky, lightning, spray, turquoise and dark blue, power of nature, 8k', 'nsfw': False, 'tags': ['landscape','ocean','storm','dramatic'], 'w': 768, 'h': 512},
    # === NSFW - Artistic / Fine Art ===
    {'title': 'Rain Goddess', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, beautiful woman standing in rain, artistic nude, water droplets on skin, dramatic studio lighting, fine art photography, wet hair, elegant pose, 8k', 'nsfw': True, 'tags': ['artistic-nude','rain','fine-art'], 'w': 512, 'h': 768},
    {'title': 'Moonlit Onsen', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, beautiful japanese woman bathing in outdoor hot spring, steam rising, moonlight, autumn maple trees, artistic nude from behind, serene atmosphere, 8k', 'nsfw': True, 'tags': ['onsen','japanese','artistic-nude','moonlight'], 'w': 512, 'h': 768},
    {'title': 'Classical Nude Study', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, fine art nude study, beautiful woman reclining on marble, museum quality lighting, renaissance composition, elegant pose, classical beauty, 8k', 'nsfw': True, 'tags': ['fine-art','classical','nude','studio'], 'w': 768, 'h': 512},
    {'title': 'Golden Body Paint', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, woman covered in gold body paint, artistic nude, golden hour backlight, desert landscape, fine art, glowing skin, sculptural pose, 8k', 'nsfw': True, 'tags': ['body-art','gold','fine-art','artistic-nude'], 'w': 512, 'h': 768},
    # === NSFW - Non-erotic but edgy ===
    {'title': 'Cyber Samurai Rampage', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, robot samurai destroying city, glowing red eyes, sparks flying, neon cyberpunk city, explosions, dynamic action pose, mech armor, katana energy slash, cinematic, blood splatter, 8k', 'nsfw': True, 'tags': ['robot','samurai','action','cyberpunk','mech'], 'w': 768, 'h': 512},
    {'title': 'Dark Angel Warrior', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, dark angel warrior woman, massive black wings spread, battle damaged armor exposing skin, glowing sword, gothic cathedral, dramatic lighting, blood moon, fierce expression, 8k', 'nsfw': True, 'tags': ['angel','warrior','dark','fantasy','wings'], 'w': 512, 'h': 768},
    {'title': 'Post-Apocalyptic Survivor', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, fierce woman survivor in post-apocalyptic wasteland, torn clothes, scars, makeshift weapons, burning city background, dramatic sunset, cinematic, gritty, 8k', 'nsfw': True, 'tags': ['post-apocalyptic','survivor','action','gritty'], 'w': 768, 'h': 512},
    # === NSFW - Hardcore adult ===
    {'title': 'Passionate Embrace', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, passionate couple embrace, beautiful woman and man, intimate bedroom, soft warm lighting, sensual, naked, intertwined bodies, romantic atmosphere, 8k', 'nsfw': True, 'tags': ['couple','passionate','intimate','explicit'], 'w': 512, 'h': 768},
    {'title': 'Steamy Shower', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, beautiful woman in glass shower, wet skin, steam, water running down body, nude, seductive look over shoulder, modern bathroom, dramatic lighting, 8k', 'nsfw': True, 'tags': ['shower','wet','explicit','steamy'], 'w': 512, 'h': 768},
    {'title': 'Boudoir Luxury', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, gorgeous woman in black lace lingerie, red velvet chaise longue, baroque interior, warm candlelight, luxury boudoir, sensual pose, fashion editorial, 8k', 'nsfw': True, 'tags': ['lingerie','luxury','boudoir','editorial'], 'w': 512, 'h': 768},
    {'title': 'Silk & Moonlight', 'prompt': '(masterpiece:1.3), (best quality:1.3), ultra detailed, beautiful asian woman lying on silk sheets, moonlight through window, topless, sensual atmosphere, elegant, soft shadows, intimate bedroom, 8k', 'nsfw': True, 'tags': ['asian','sensual','moonlight','intimate'], 'w': 512, 'h': 768},
]

def build_workflow(prompt, model, w, h):
    seed = random.randint(0, 2**31)
    return {
        '3': {'class_type': 'KSampler', 'inputs': {'cfg': 7.5, 'denoise': 1.0, 'latent_image': ['5',0], 'model': ['4',0], 'negative': ['7',0], 'positive': ['6',0], 'sampler_name': 'dpmpp_2m', 'scheduler': 'karras', 'seed': seed, 'steps': 25}},
        '4': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': model}},
        '5': {'class_type': 'EmptyLatentImage', 'inputs': {'batch_size': 1, 'height': h, 'width': w}},
        '6': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['4',1], 'text': prompt}},
        '7': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['4',1], 'text': NEG}},
        '8': {'class_type': 'VAEDecode', 'inputs': {'samples': ['3',0], 'vae': ['4',2]}},
        '9': {'class_type': 'SaveImage', 'inputs': {'filename_prefix': 'EGAKU', 'images': ['8',0]}},
    }

success = 0
failed = 0

for i, item in enumerate(CONTENT):
    print(f'[{i+1}/{len(CONTENT)}] {item["title"]} nsfw={item["nsfw"]}')
    try:
        wf = build_workflow(item['prompt'], MODEL, item['w'], item['h'])
        r = httpx.post(f'{COMFYUI_URL}/prompt', json={'prompt': wf}, timeout=30)
        r.raise_for_status()
        pid = r.json()['prompt_id']

        for j in range(60):
            time.sleep(5)
            r2 = httpx.get(f'{COMFYUI_URL}/history/{pid}', timeout=15)
            data = r2.json()
            if pid in data:
                st = data[pid].get('status', {})
                if st.get('completed') or st.get('status_str') == 'success':
                    outputs = data[pid].get('outputs', {})
                    for nid, out in outputs.items():
                        imgs = out.get('images', [])
                        if imgs:
                            img = imgs[0]
                            params = {'filename': img['filename'], 'subfolder': img.get('subfolder',''), 'type': img.get('type','output')}
                            r3 = httpx.get(f'{COMFYUI_URL}/view', params=params, timeout=30)

                            fname = f'{uuid.uuid4().hex[:16]}.png'
                            upload_h = {'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}', 'Content-Type': 'image/png', 'x-upsert': 'true'}
                            httpx.post(f'{SUPABASE_URL}/storage/v1/object/self-hosted/showcase/{fname}', content=r3.content, headers=upload_h, timeout=60)
                            img_url = f'{SUPABASE_URL}/storage/v1/object/public/self-hosted/showcase/{fname}'

                            user_id = random.choice(DUMMY_USERS)
                            created = (datetime.now(timezone.utc) - timedelta(days=random.randint(1,14), hours=random.randint(0,23))).isoformat()
                            record = {
                                'id': str(uuid.uuid4()), 'user_id': user_id, 'job_id': str(uuid.uuid4()),
                                'title': item['title'], 'description': 'AI Generated Art',
                                'image_url': img_url, 'nsfw': item['nsfw'], 'public': True,
                                'tags': item['tags'], 'model': 'sd15_hq',
                                'prompt': item['prompt'], 'negative_prompt': NEG,
                                'steps': 25, 'cfg': 8, 'seed': random.randint(0,2**31),
                                'width': item['w'], 'height': item['h'], 'created_at': created,
                            }
                            httpx.post(
                                f'{SUPABASE_URL}/rest/v1/gallery', json=record,
                                headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}', 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
                                timeout=30
                            )
                            print(f'  OK {len(r3.content)//1024}KB -> gallery ({user_id[:8]})')
                            success += 1
                    break
                if 'error' in str(st).lower():
                    print(f'  ERROR: {st}')
                    failed += 1
                    break
            if j % 6 == 0 and j > 0:
                print(f'  waiting... ({j*5}s)')
    except Exception as e:
        print(f'  FAIL: {e}')
        failed += 1

print(f'\n=== Done: {success} success, {failed} failed ===')
