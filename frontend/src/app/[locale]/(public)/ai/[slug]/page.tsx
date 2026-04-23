import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { GENERATED_PAGES } from "./generated-pages";

// ─── SEO Landing Page Data ───
// Each entry targets specific long-tail Google search keywords
// Handcrafted pages (below) + auto-generated pages (from generated-pages.ts)

const HANDCRAFTED_PAGES: Record<
  string,
  {
    title: string;
    h1: string;
    description: string;
    keywords: string[];
    features: string[];
    prompts: string[];
    faq: { q: string; a: string }[];
    category: "model" | "style" | "feature";
    minPlan: string;
    credits: string;
  }
> = {
  "flux-ai-image-generator": {
    title: "Free Flux AI Image Generator Online",
    h1: "Flux AI Image Generator",
    description:
      "Generate stunning AI images with Flux Dev and Flux Schnell for free. High-quality text-to-image generation with the latest Black Forest Labs models. No download required.",
    keywords: [
      "flux ai", "flux image generator", "flux ai free", "flux dev",
      "flux schnell", "black forest labs", "flux text to image",
      "flux ai generator online", "free flux generator",
    ],
    features: [
      "Flux Dev - High quality, detailed images (up to 50 steps)",
      "Flux Schnell - Ultra-fast generation in 4 steps",
      "Flux Realism - Photorealistic images, unrestricted",
      "Custom LoRA support via CivitAI integration",
      "Up to 1024x1024 resolution",
      "No software download required - runs in browser",
    ],
    prompts: [
      "a cyberpunk cityscape at night with neon lights reflecting on wet streets, cinematic lighting, 8k",
      "portrait of a woman with flowing hair, soft studio lighting, photorealistic, detailed skin texture",
      "fantasy castle on a floating island in the sky, magical atmosphere, volumetric clouds",
      "cute anime girl in a flower garden, cherry blossoms, pastel colors, detailed illustration",
    ],
    faq: [
      {
        q: "Is Flux AI free to use?",
        a: "Yes! EGAKU AI offers Flux Dev and Flux Schnell for free with 50 credits/month. Paid plans provide more credits and features.",
      },
      {
        q: "What is the difference between Flux Dev and Flux Schnell?",
        a: "Flux Dev produces higher quality images with up to 50 inference steps. Flux Schnell is optimized for speed, generating images in just 4 steps with good quality.",
      },
      {
        q: "Does Flux support unrestricted creative content?",
        a: "Yes, Flux Realism supports full creative freedom for age-verified users (18+). Safety tolerance is set to maximum permissiveness.",
      },
    ],
    category: "model",
    minPlan: "Free",
    credits: "1-3",
  },
  "sdxl-image-generator": {
    title: "Free SDXL Image Generator Online - Stable Diffusion XL",
    h1: "SDXL Image Generator",
    description:
      "Create AI art with Stable Diffusion XL (SDXL) for free online. High-resolution 1024x1024 images with negative prompts, custom seeds, and CivitAI LoRA models.",
    keywords: [
      "sdxl", "stable diffusion xl", "sdxl online", "sdxl free",
      "sdxl image generator", "stable diffusion xl online free",
      "sdxl ai art", "sdxl lightning", "sdxl turbo",
    ],
    features: [
      "SDXL base model - versatile, high resolution",
      "SDXL Lightning - ultra-fast 4-step generation",
      "Negative prompt support for fine control",
      "Custom seed for reproducible results",
      "CivitAI LoRA model compatibility",
      "Free to use - no download required",
    ],
    prompts: [
      "masterpiece, best quality, 1girl, long white hair, blue eyes, elegant dress, standing in a moonlit garden",
      "epic landscape, mountain range at sunset, dramatic sky, golden hour, professional photography, 8k uhd",
      "steampunk mechanical dragon, brass and copper, gears, steam, intricate details, dark background",
      "delicious sushi platter, professional food photography, shallow depth of field, restaurant ambiance",
    ],
    faq: [
      {
        q: "What is SDXL?",
        a: "SDXL (Stable Diffusion XL) is an advanced AI image generation model by Stability AI. It produces high-resolution 1024x1024 images with excellent prompt understanding and detail.",
      },
      {
        q: "Is SDXL better than Flux?",
        a: "Both have strengths. Flux excels at prompt following and photorealism. SDXL has broader LoRA ecosystem and is great for anime/illustration styles. EGAKU AI offers both for free.",
      },
      {
        q: "Can I use custom LoRA models with SDXL?",
        a: "Yes! Browse thousands of SDXL-compatible LoRA models from CivitAI directly in EGAKU AI. Add them to your account and use them for generation.",
      },
    ],
    category: "model",
    minPlan: "Free",
    credits: "1-2",
  },
  "stable-diffusion-3-generator": {
    title: "Free Stable Diffusion 3.5 Generator Online",
    h1: "Stable Diffusion 3.5 Generator",
    description:
      "Generate images with the latest Stable Diffusion 3.5 Large and Turbo models for free. State-of-the-art AI art generation by Stability AI. No installation needed.",
    keywords: [
      "stable diffusion 3", "sd3", "stable diffusion 3.5", "sd 3.5",
      "stable diffusion 3 online", "stable diffusion 3 free",
      "sd3 generator", "stability ai latest model",
    ],
    features: [
      "SD 3.5 Large - highest quality from Stability AI",
      "SD 3.5 Turbo - fast variant for quick iterations",
      "Superior text rendering in images",
      "Improved composition and anatomy",
      "Enhanced prompt understanding",
      "Browser-based - no GPU required",
    ],
    prompts: [
      "a sign that reads 'EGAKU AI' in neon letters, cyberpunk city background, night scene",
      "hyperrealistic portrait, dramatic lighting, cinematic color grading, 85mm lens",
      "isometric 3d render of a cozy coffee shop interior, warm lighting, detailed miniature",
      "abstract art, fluid dynamics, vibrant colors, high contrast, 4k wallpaper",
    ],
    faq: [
      {
        q: "What is new in Stable Diffusion 3.5?",
        a: "SD 3.5 features improved text rendering, better anatomy, enhanced composition, and stronger prompt adherence compared to SDXL. Available in Large (highest quality) and Turbo (fast) variants.",
      },
      {
        q: "Is Stable Diffusion 3.5 free?",
        a: "SD 3.5 Turbo is free on EGAKU AI. SD 3.5 Large requires Lite plan or above. Both use 2-3 credits per generation.",
      },
    ],
    category: "model",
    minPlan: "Free / Lite",
    credits: "2-3",
  },
  "anime-ai-art-generator": {
    title: "Free Anime AI Art Generator - Create Anime Characters & Illustrations",
    h1: "Anime AI Art Generator",
    description:
      "Create stunning anime characters and illustrations with AI. Use specialized anime models, CivitAI LoRAs, and style transfer. Generate waifu, manga, and anime-style art for free.",
    keywords: [
      "anime ai generator", "anime ai art", "ai anime generator free",
      "waifu generator", "anime character generator", "ai manga generator",
      "anime illustration ai", "anime style ai", "free anime ai",
      "ai waifu generator", "anime art generator online",
    ],
    features: [
      "Specialized anime models (Proteus, MeinaMix)",
      "Anime style transfer - convert any photo to anime",
      "Thousands of anime LoRA models from CivitAI",
      "Flux + SDXL base models optimized for anime",
      "Negative prompts for quality control",
      "Up to 1024x1024 high-resolution output",
    ],
    prompts: [
      "1girl, long flowing silver hair, crystal blue eyes, school uniform, cherry blossom background, masterpiece, best quality",
      "1boy, spiky black hair, determined expression, battle pose, energy aura, shonen anime style",
      "fantasy scene, magical girl transformation, sparkles, ribbons, dynamic pose, vivid colors",
      "group of adventurers in a fantasy tavern, warm lighting, detailed anime illustration, cozy atmosphere",
    ],
    faq: [
      {
        q: "What is the best AI model for anime art?",
        a: "For anime, we recommend Proteus v0.3 or SDXL with anime LoRAs from CivitAI. MeinaMix (via Novita.ai) is also excellent for unrestricted anime content.",
      },
      {
        q: "Can I create unrestricted anime art?",
        a: "Yes, EGAKU AI supports unrestricted anime generation for age-verified adults (18+). Use specialized anime models with full creative freedom.",
      },
      {
        q: "Can I use my favorite CivitAI anime models?",
        a: "Yes! Browse CivitAI directly in EGAKU AI. Add anime LoRAs like Moxin, Mix4, or custom character LoRAs to your account for personalized anime generation.",
      },
    ],
    category: "style",
    minPlan: "Free",
    credits: "2-3",
  },
  "ghibli-style-ai-art": {
    title: "Free Ghibli Style AI Art Generator - Studio Ghibli / Miyazaki Style",
    h1: "Ghibli Style AI Art Generator",
    description:
      "Transform your photos and ideas into Studio Ghibli / Miyazaki-inspired art with AI. One-click style transfer creates hand-painted anime landscapes, characters, and scenes.",
    keywords: [
      "ghibli style ai", "studio ghibli ai", "ghibli ai art",
      "miyazaki style ai", "ghibli filter ai", "ghibli art generator",
      "ai ghibli style free", "ghibli photo filter",
      "studio ghibli ai art generator", "ghibli style ai generator",
    ],
    features: [
      "One-click Ghibli style transfer",
      "Upload any photo and convert to Ghibli art",
      "Soft watercolor-like hand-painted aesthetic",
      "Works on landscapes, portraits, and scenes",
      "Adjustable strength for subtle to full transformation",
      "High-resolution output for wallpapers and prints",
    ],
    prompts: [
      "studio ghibli style, a girl walking through a lush green meadow, fluffy clouds, hand-painted, soft colors, miyazaki",
      "ghibli landscape, ancient forest with giant trees, magical atmosphere, moss-covered ruins, studio ghibli",
      "spirited away style, a magical bathhouse on a hill, warm lantern light, night sky with stars, ghibli",
      "howl's moving castle style, a cozy cottage in the countryside, smoke from chimney, golden wheat fields",
    ],
    faq: [
      {
        q: "How does Ghibli style transfer work?",
        a: "Upload any photo or generate from text, then apply the Ghibli style preset. The AI transforms the image into a Studio Ghibli-inspired hand-painted aesthetic with soft colors and whimsical detail.",
      },
      {
        q: "Is this official Studio Ghibli?",
        a: "No, this is AI-generated art inspired by the visual style of Studio Ghibli. It uses AI style transfer to create similar aesthetics, not official Ghibli content.",
      },
      {
        q: "Can I use Ghibli-style AI art commercially?",
        a: "AI-generated images in a Ghibli-inspired style are your own creations. However, avoid creating content that could infringe on specific copyrighted Ghibli characters or scenes.",
      },
    ],
    category: "style",
    minPlan: "Lite",
    credits: "3",
  },
  "unrestricted-ai-art-generator": {
    title: "Unrestricted AI Art Generator - Full Creative Freedom",
    h1: "Unrestricted AI Art Generator",
    description:
      "Generate AI art with full creative freedom using multiple AI models. Realistic, anime, and artistic styles. Age verification required for adult content. Private downloads at your own responsibility.",
    keywords: [
      "unrestricted ai generator", "uncensored ai art", "ai art generator free",
      "ai image generator no restrictions", "creative freedom ai art",
      "adult ai art generator", "ai art no filter",
      "unrestricted ai art generator", "ai art generator online",
    ],
    features: [
      "Flux Realism - photorealistic images with maximum creative freedom",
      "Novita.ai models - unrestricted checkpoints (Realistic Vision, DreamShaper XL, MeinaMix)",
      "CivitAI custom LoRA and Checkpoint models",
      "Private generation and download - your sole responsibility",
      "Regional compliance for public gallery",
      "Zero tolerance for CSAM and non-consensual content",
    ],
    prompts: [
      "beautiful woman, elegant pose, soft studio lighting, professional photography, detailed skin texture",
      "fantasy character, warrior woman, dramatic lighting, detailed armor and clothing, epic fantasy scene",
      "artistic nude study, classical painting style, dramatic chiaroscuro lighting, oil painting texture",
      "anime character, detailed illustration, vibrant colors, dynamic pose, professional quality",
    ],
    faq: [
      {
        q: "Is unrestricted AI art generation legal?",
        a: "Yes, generating AI art with full creative freedom is legal in most jurisdictions for personal use. CSAM (child sexual abuse material) is absolutely prohibited. Regional laws apply for public sharing.",
      },
      {
        q: "Which models offer unrestricted generation?",
        a: "Flux Realism, all Novita.ai models (Realistic Vision, DreamShaper XL, MeinaMix), and CivitAI custom models support unrestricted generation.",
      },
      {
        q: "What do I need for unrestricted content?",
        a: "Unrestricted content generation is available on all plans with age verification (18+). Content must comply with our content policy.",
      },
    ],
    category: "feature",
    minPlan: "Free",
    credits: "2-3",
  },
  "ai-video-generator": {
    title: "Free AI Video Generator - Text to Video & Image to Video",
    h1: "AI Video Generator",
    description:
      "Generate AI videos from text prompts or animate still images. Text-to-video with LTX 2.3, image-to-video with LTX 2. Create stunning AI animations for free.",
    keywords: [
      "ai video generator", "text to video ai", "ai video generator free",
      "image to video ai", "ai animation generator", "ai video maker",
      "text to video free", "ai animate image", "ai video creator online",
    ],
    features: [
      "Text-to-Video with LTX 2.3 (unrestricted)",
      "Image-to-Video with LTX 2 (animate any still image)",
      "Wan 2.5 video models via Replicate",
      "Multiple output formats",
      "Unrestricted video generation supported",
      "No software installation required",
    ],
    prompts: [
      "a cat playing with a ball of yarn, slow motion, cute, detailed fur",
      "ocean waves crashing on rocks at sunset, golden hour, cinematic, 4k",
      "a flower blooming in timelapse, macro photography, vibrant colors",
      "a spaceship flying through an asteroid field, cinematic sci-fi, dramatic lighting",
    ],
    faq: [
      {
        q: "How long are AI-generated videos?",
        a: "Generated videos are typically 2-5 seconds long. Frame count and FPS can be configured. This is standard for current AI video generation technology.",
      },
      {
        q: "What plan do I need for video generation?",
        a: "Text-to-video and image-to-video require Basic plan (¥980/mo) or above. Each video generation costs 5 credits.",
      },
      {
        q: "Can I animate my own images?",
        a: "Yes! Upload any image and the AI will create a short animated video from it. Works with photos, illustrations, and AI-generated images.",
      },
    ],
    category: "feature",
    minPlan: "Basic",
    credits: "5",
  },
  "ai-image-upscaler": {
    title: "Free AI Image Upscaler - Enhance Resolution up to 4x",
    h1: "AI Image Upscaler",
    description:
      "Upscale images up to 4x resolution with Real-ESRGAN AI. Enhance low-resolution photos, AI art, and illustrations. Free online, no download required.",
    keywords: [
      "ai upscaler", "ai image upscaler", "upscale image ai free",
      "ai image enhancer", "increase resolution ai", "ai upscale free",
      "photo enhancer ai", "4x upscale ai", "real esrgan online",
    ],
    features: [
      "Real-ESRGAN AI upscaling technology",
      "2x and 4x resolution enhancement",
      "Works on photos, AI art, anime, and illustrations",
      "Preserves details and sharpness",
      "Free to use on all plans",
      "No download required - process in browser",
    ],
    prompts: [],
    faq: [
      {
        q: "How much does AI upscaling cost?",
        a: "AI upscaling uses 1 credit on EGAKU AI. Free plan users get 50 credits/month. No credit card required to start.",
      },
      {
        q: "What is the maximum upscale resolution?",
        a: "You can upscale images up to 4x their original resolution. A 512x512 image becomes 2048x2048 at 4x upscale.",
      },
      {
        q: "Does it work on anime images?",
        a: "Yes! Real-ESRGAN handles anime and illustration upscaling excellently, preserving clean lines and colors.",
      },
    ],
    category: "feature",
    minPlan: "Free",
    credits: "1",
  },
  "ai-background-remover": {
    title: "Free AI Background Remover - Remove Background from Photos Instantly",
    h1: "AI Background Remover",
    description:
      "Remove backgrounds from photos instantly with AI. Perfect for product photos, portraits, and social media. Free online tool powered by rembg. No signup required for preview.",
    keywords: [
      "ai background remover", "remove background ai", "background remover free",
      "remove bg ai", "ai background eraser", "photo background remover",
      "transparent background ai", "remove background online free",
    ],
    features: [
      "Instant AI-powered background removal",
      "Works on any photo - people, products, animals",
      "Transparent PNG output",
      "Perfect for e-commerce product photos",
      "Social media ready results",
      "Free to use - 1 credit per image",
    ],
    prompts: [],
    faq: [
      {
        q: "Is background removal free?",
        a: "Yes! Background removal uses 1 credit. Free plan includes 50 credits/month. No credit card required to start.",
      },
      {
        q: "What image formats are supported?",
        a: "Upload PNG, JPG, or WebP images. Output is PNG with transparent background.",
      },
    ],
    category: "feature",
    minPlan: "Free",
    credits: "1",
  },
  "civitai-models-online": {
    title: "Use CivitAI Models Online - No Download Required | EGAKU AI",
    h1: "CivitAI Models Online",
    description:
      "Use CivitAI LoRA and Checkpoint models online without downloading. Browse thousands of custom AI models, add them to your account, and generate images directly in your browser.",
    keywords: [
      "civitai online", "civitai models online", "use civitai without download",
      "civitai lora online", "civitai checkpoint online", "civitai browser",
      "civitai models free", "run civitai models online",
      "civitai without gpu", "civitai cloud",
    ],
    features: [
      "Built-in CivitAI model browser with search and filters",
      "Preview models before adding",
      "LoRA models via Flux and SDXL (Basic+ plan)",
      "Checkpoint models via Novita.ai (Pro+ plan)",
      "No GPU or local setup required",
      "Thousands of anime, realistic, and artistic models",
    ],
    prompts: [
      "Use any CivitAI model with just a click - no ComfyUI or A1111 setup needed",
      "Browse by popularity, downloads, or newest",
      "Filter by model type: LoRA, Checkpoint, TextualInversion",
      "See preview images before adding to your account",
    ],
    faq: [
      {
        q: "Do I need a GPU to use CivitAI models?",
        a: "No! EGAKU AI runs CivitAI models in the cloud. Just browse, add, and generate - no local GPU needed.",
      },
      {
        q: "How many CivitAI models can I use?",
        a: "Basic plan: 2 LoRA models. Pro: 5 models (LoRA + Checkpoint). Unlimited: 10. Studio: unlimited.",
      },
      {
        q: "What is the difference between LoRA and Checkpoint?",
        a: "LoRA models are small style/character add-ons that work on top of base models. Checkpoint models are full AI models (like Realistic Vision or MeinaMix) that define the entire generation style.",
      },
    ],
    category: "feature",
    minPlan: "Basic",
    credits: "3",
  },
  "ai-nsfw-generator": {
    title: "AI NSFW Image Generator - Uncensored AI Art Creator | EGAKU AI",
    h1: "AI NSFW Image Generator",
    description:
      "Create uncensored NSFW AI images with 14+ specialized models. Photorealistic, anime, hentai styles. No content filter. Mosaic control. Age-verified adults only (18+). From $6.50/month.",
    keywords: [
      "ai nsfw generator", "nsfw ai art", "uncensored ai generator",
      "ai image generator nsfw", "nsfw ai image generator free",
      "ai art generator no filter", "unrestricted ai image generator",
      "ai adult image generator", "nsfw ai art generator online",
    ],
    features: [
      "14+ NSFW-optimized models (UberRealisticPorn, ChilloutMix, EpicPhotogasm)",
      "Anime/Hentai models (Hassaku Hentai, MeinaHentai, Anything v5)",
      "SDXL models for higher quality (ProtoVision XL, HelloWorld SDXL)",
      "No safety filters - full creative freedom",
      "Mosaic on/off toggle with regional legal warnings",
      "Image-to-image transformation for custom editing",
      "ControlNet (OpenPose, Canny, Depth) for precise control",
      "CivitAI model browser - use any model (Patron plan)",
    ],
    prompts: [
      "beautiful woman, elegant lingerie, soft studio lighting, photorealistic, detailed skin, professional boudoir photography",
      "1girl, anime style, seductive pose, detailed eyes, masterpiece, best quality, vibrant colors",
      "fantasy goddess, ethereal beauty, flowing sheer fabric, dramatic lighting, ornate jewelry",
      "artistic nude, renaissance painting inspired, chiaroscuro lighting, oil painting texture, museum quality",
    ],
    faq: [
      {
        q: "Is this legal?",
        a: "Yes. EGAKU AI Adult Expression is available to age-verified users (18+). We comply with regional laws - Japan requires mosaic on public content, which is handled automatically. Child exploitation material (CSAM) is strictly prohibited.",
      },
      {
        q: "Which models work best for NSFW?",
        a: "UberRealisticPorn v1.3 and ChilloutMix produce the best photorealistic results. For anime/hentai, Hassaku Hentai v1.3 is recommended. All models run on Novita.ai with zero content filtering.",
      },
      {
        q: "Can I control censoring/mosaic?",
        a: "Yes. A mosaic toggle is available. In Japan, mosaic is on by default for legal compliance. In other regions, you can generate fully uncensored content.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept credit cards (via Stripe) and 240+ cryptocurrencies (via NOWPayments) including Bitcoin, Ethereum, USDT, and more. Crypto payments are anonymous.",
      },
    ],
    category: "feature",
    minPlan: "Adult Starter ($6.50/mo)",
    credits: "2-3",
  },
  "ai-hentai-generator": {
    title: "AI Hentai Generator - Anime NSFW Art Creator | EGAKU AI",
    h1: "AI Hentai Generator",
    description:
      "Generate high-quality hentai and anime NSFW art with AI. Specialized anime models, uncensored output, LoRA support. Create custom characters and scenes. Adults only (18+).",
    keywords: [
      "ai hentai generator", "hentai ai", "ai hentai art generator",
      "anime nsfw generator", "ai anime nsfw", "hentai image generator",
      "uncensored hentai ai", "ai hentai maker",
      "hentai generator online", "free hentai ai generator",
    ],
    features: [
      "Hassaku Hentai v1.3 - top-rated anime NSFW model",
      "MeinaHentai v4 - classic hentai style",
      "Anything v5 - versatile anime model",
      "CivitAI anime LoRAs for custom characters",
      "ControlNet with OpenPose for exact body positioning",
      "Uncensored output with optional mosaic",
      "High resolution up to 1024x1024",
    ],
    prompts: [
      "1girl, long flowing hair, detailed anime eyes, seductive expression, masterpiece, best quality, vibrant colors",
      "anime couple, romantic scene, soft lighting, detailed illustration, high quality",
      "fantasy elf girl, pointy ears, magical forest background, ethereal lighting, anime style, masterpiece",
      "1girl, school uniform, dynamic pose, cherry blossom background, detailed, best quality",
    ],
    faq: [
      {
        q: "What is the best model for hentai?",
        a: "Hassaku Hentai v1.3 produces the best results for classic hentai style. MeinaHentai v4 is great for softer anime aesthetics. Both run uncensored on EGAKU AI.",
      },
      {
        q: "Can I create custom anime characters?",
        a: "Yes. Use LoRA models from CivitAI to create specific character styles. Combine with ControlNet OpenPose for precise body positioning.",
      },
      {
        q: "Is there a free trial?",
        a: "NSFW generation requires an Adult Expression subscription starting at $6.50/month (¥980). This covers GPU costs for uncensored generation.",
      },
    ],
    category: "model",
    minPlan: "Adult Starter ($6.50/mo)",
    credits: "2",
  },
  "ai-nsfw-video-generator": {
    title: "AI NSFW Video Generator - Create Adult Videos with AI | EGAKU AI",
    h1: "AI NSFW Video Generator",
    description:
      "Generate NSFW videos with AI. Text-to-video and image-to-video with Kling v2 and AnimateDiff. Uncensored adult video generation. Animate your AI images into video. 18+ only.",
    keywords: [
      "ai nsfw video generator", "ai adult video", "nsfw video ai",
      "ai video generator uncensored", "ai porn video generator",
      "text to video nsfw", "image to video nsfw",
      "ai video generator no filter", "adult ai video maker",
    ],
    features: [
      "Text-to-video with Kling v2 (highest quality, NSFW verified)",
      "LTX 2.3 for fast video generation",
      "Image-to-video: animate any NSFW image via Novita SVD",
      "AnimateDiff with NSFW models (UberRealisticPorn, Babes, Hentai)",
      "No content filter on video output",
      "Crypto payment accepted (anonymous)",
    ],
    prompts: [
      "beautiful woman slowly turning around, elegant dress flowing in wind, soft golden lighting, cinematic",
      "woman in steamy shower, water droplets on glass, artistic backlit cinematography, slow motion",
      "couple dancing closely, romantic atmosphere, warm lighting, slow motion, cinematic video",
      "artistic nude, slow motion hair flip, soft lighting, upper body, simple background",
    ],
    faq: [
      {
        q: "Which video model is best for NSFW?",
        a: "Kling v2 produces the highest quality NSFW videos from text prompts. For image-to-video (animating a still NSFW image), Novita SVD works without any content filter.",
      },
      {
        q: "How long are the generated videos?",
        a: "Videos are typically 3-5 seconds. Kling v2 produces 5-second clips. AnimateDiff generates 2-3 second animations. Multiple clips can be combined externally.",
      },
      {
        q: "Can I animate my own NSFW images?",
        a: "Yes. Generate an NSFW image, then use Image-to-Video mode with Kling v2 I2V or Novita SVD to animate it. This produces the highest quality NSFW videos.",
      },
    ],
    category: "feature",
    minPlan: "Adult Starter ($6.50/mo)",
    credits: "5-15",
  },
  "ai-portrait-generator": {
    title: "Free AI Portrait Generator - Professional Headshots & Portraits",
    h1: "AI Portrait Generator",
    description:
      "Generate professional AI portraits and headshots in seconds. Perfect for LinkedIn, resumes, and social media profiles. Studio-quality results from text prompts or photo uploads. No photographer needed.",
    keywords: [
      "ai portrait generator", "ai headshot generator", "professional photo ai",
      "ai portrait maker", "ai profile picture generator", "ai headshot free",
      "linkedin photo ai", "ai professional portrait", "ai selfie generator",
      "portrait ai online",
    ],
    features: [
      "Studio-quality AI headshots for LinkedIn and resumes",
      "Photo Booth mode with 20+ curated portrait styles",
      "Upload a reference photo for consistent likeness",
      "Multiple lighting presets: studio, natural, dramatic, Rembrandt",
      "Background options: solid, gradient, office, outdoor",
      "High-resolution output up to 1024x1024 for print",
    ],
    prompts: [
      "professional headshot, man in navy suit, soft studio lighting, neutral gray background, sharp focus, 85mm portrait lens",
      "corporate portrait, woman with confident smile, modern office background, warm natural lighting, professional photography",
      "creative portrait, artist with paint-stained hands, dramatic side lighting, dark moody background, cinematic",
      "linkedin profile photo, young professional, friendly expression, clean white background, soft diffused lighting",
    ],
    faq: [
      {
        q: "Can I use AI portraits for LinkedIn?",
        a: "Yes. EGAKU AI generates studio-quality headshots that look natural and professional. Many users create LinkedIn profile photos, resume headshots, and business card portraits with our AI.",
      },
      {
        q: "How realistic are AI-generated portraits?",
        a: "Our Flux Realism and SDXL models produce photorealistic portraits with accurate skin texture, natural lighting, and professional composition. Results are comparable to professional studio photography.",
      },
      {
        q: "Can I upload my own photo as a reference?",
        a: "Yes. Use the Photo Booth feature to upload a selfie or existing photo. The AI generates new professional portraits while maintaining your likeness across different styles and backgrounds.",
      },
      {
        q: "How much does AI portrait generation cost?",
        a: "Portrait generation uses 2-3 credits. Free plan includes 50 credits/month. Photo Booth batch generation is available on Lite plan and above.",
      },
    ],
    category: "feature",
    minPlan: "Free",
    credits: "2-3",
  },
  "ai-logo-maker": {
    title: "Free AI Logo Generator - Create Brand Logos with AI | EGAKU AI",
    h1: "AI Logo Maker",
    description:
      "Design professional logos with AI in seconds. Generate unique brand logos, wordmarks, and icons for your business. Multiple styles from minimalist to 3D. Free to try, no design skills needed.",
    keywords: [
      "ai logo generator", "ai logo maker free", "brand logo ai",
      "ai logo design", "logo creator ai", "free logo maker ai",
      "ai logo generator free", "business logo ai", "ai brand logo",
      "logo design ai online",
    ],
    features: [
      "Dedicated Logo Generator tool with style presets",
      "Minimalist, 3D, vintage, hand-drawn, and gradient styles",
      "Wordmark and icon-based logo generation",
      "Transparent PNG output for immediate use",
      "Background removal built-in for clean logos",
      "Upscale logos to print-ready resolution with AI upscaler",
    ],
    prompts: [
      "minimalist logo for a tech startup called 'Nexus', clean geometric shapes, flat design, navy blue and white, vector style",
      "vintage hand-drawn logo for a coffee shop called 'Roast & Bloom', warm earthy tones, rustic typography, badge style",
      "modern 3d logo icon for a fitness app, abstract flame shape, gradient orange to red, glossy finish, white background",
      "elegant wordmark logo for a fashion brand called 'Atelier', serif typography, gold and black, luxury feel",
    ],
    faq: [
      {
        q: "Can I use AI-generated logos commercially?",
        a: "Yes. All images generated on EGAKU AI are yours to use, including for commercial purposes like business logos, websites, and marketing materials. Paid plans include full commercial rights.",
      },
      {
        q: "What logo styles are available?",
        a: "EGAKU AI supports minimalist, 3D, vintage, hand-drawn, gradient, geometric, and many more styles. The dedicated Logo tool includes curated presets optimized for brand identity design.",
      },
      {
        q: "Can I get a transparent background logo?",
        a: "Yes. Use the built-in AI Background Remover to get a transparent PNG instantly. This works on any generated logo with just one click.",
      },
      {
        q: "How is this different from Canva or other logo makers?",
        a: "EGAKU AI generates completely unique logos from scratch using AI, rather than rearranging templates. Every logo is one-of-a-kind. You can also iterate with different prompts until you find the perfect design.",
      },
    ],
    category: "feature",
    minPlan: "Free",
    credits: "2-3",
  },
  "ai-meme-generator": {
    title: "Free AI Meme Generator - Create Viral Memes with AI | EGAKU AI",
    h1: "AI Meme Generator",
    description:
      "Create hilarious memes with AI in seconds. Generate custom meme images from text prompts, add captions, and share. Trending formats, original characters, and viral-ready output. Free to use.",
    keywords: [
      "ai meme generator", "meme maker ai", "ai meme creator",
      "ai meme generator free", "create memes with ai",
      "meme generator online", "ai meme maker free", "funny meme ai",
      "custom meme generator ai",
    ],
    features: [
      "Dedicated Meme Generator with caption overlay",
      "AI-generated original meme images from any prompt",
      "Classic meme format templates built-in",
      "Custom text placement: top, bottom, or both",
      "One-click social media sharing",
      "No watermark on generated memes",
    ],
    prompts: [
      "a confused cat sitting at a business meeting, surrounded by paperwork, office environment, photorealistic, meme style",
      "a dog wearing a tiny top hat and monocle, judging the viewer, studio lighting, humorous portrait",
      "two astronauts on the moon, one pointing at Earth, dramatic space scene, wait its all meme format",
      "a medieval knight trying to use a laptop, frustrated expression, castle interior, clash of eras, funny",
    ],
    faq: [
      {
        q: "Is the AI Meme Generator free?",
        a: "Yes. Meme generation uses 1-2 credits per image. Free plan includes 50 credits/month and a daily bonus credit. No credit card required.",
      },
      {
        q: "Can I add custom text to AI memes?",
        a: "Yes. The Meme Generator tool lets you add top and bottom captions with customizable font size and style. You can also regenerate just the image while keeping your caption.",
      },
      {
        q: "Can I share memes directly to social media?",
        a: "Yes. Generated memes include one-click sharing to Twitter/X, Reddit, and other platforms. You can also download the image to share anywhere.",
      },
    ],
    category: "feature",
    minPlan: "Free",
    credits: "1-2",
  },
  "video-style-transfer": {
    title: "AI Video Style Transfer - Restyle Videos with AI | EGAKU AI",
    h1: "AI Video Style Transfer",
    description:
      "Transform videos into any artistic style with AI. Video-to-video style transfer turns ordinary footage into anime, oil painting, cyberpunk, or cinematic looks. Upload a video and restyle it in seconds.",
    keywords: [
      "video style transfer ai", "ai video restyle", "video to video ai",
      "ai video style transfer", "video ai filter", "ai video transformation",
      "restyle video ai", "video to video style transfer",
      "ai video effect generator",
    ],
    features: [
      "Video-to-Video AI style transfer",
      "20+ style presets: anime, oil painting, watercolor, cyberpunk, noir",
      "Adjustable style strength for subtle to dramatic effects",
      "Frame-by-frame AI processing for smooth results",
      "Supports uploaded video clips up to 10 seconds",
      "Combine with text prompts for precise style direction",
    ],
    prompts: [
      "convert to studio ghibli anime style, hand-painted, soft watercolor colors, whimsical atmosphere",
      "transform into cyberpunk neon aesthetic, glowing edges, dark background, futuristic city overlay",
      "restyle as oil painting, impressionist brushstrokes, rich warm colors, museum-quality texture",
      "apply cinematic film noir look, high contrast black and white, dramatic shadows, vintage grain",
    ],
    faq: [
      {
        q: "How does AI video style transfer work?",
        a: "Upload a video clip, choose a style preset or describe the style in a text prompt. The AI processes each frame, applying consistent stylistic transformation while preserving motion and structure.",
      },
      {
        q: "What video lengths are supported?",
        a: "Currently supports clips up to 10 seconds. Each video uses 5-10 credits depending on length and resolution. Longer videos can be processed in segments.",
      },
      {
        q: "Can I use my own style reference?",
        a: "Yes. Upload a reference image as a style guide, and the AI will apply that visual style to your video. This works great for matching a specific artistic look or brand aesthetic.",
      },
      {
        q: "What is the difference between video style transfer and text-to-video?",
        a: "Video style transfer takes an existing video and changes its visual style. Text-to-video creates entirely new video from a text description. EGAKU AI offers both features.",
      },
    ],
    category: "feature",
    minPlan: "Basic",
    credits: "5-10",
  },
  "ai-face-swap-online": {
    title: "Free AI Face Swap Online - Swap Faces in Photos Instantly | EGAKU AI",
    h1: "AI Face Swap Online",
    description:
      "Swap faces in photos instantly with AI. Upload two images and the AI seamlessly blends faces with natural skin tone, lighting, and expression matching. Free online tool, no download required.",
    keywords: [
      "ai face swap", "face swap online free", "face swap ai",
      "ai face swap online", "face swap generator", "face swap photo ai",
      "ai face changer", "swap face online", "face swap app online",
      "free face swap ai",
    ],
    features: [
      "One-click AI face swap between two photos",
      "Natural skin tone and lighting matching",
      "Preserves facial expressions and head angles",
      "Works with any face: selfies, group photos, portraits",
      "High-resolution output with seamless blending",
      "Combine with AI portrait styles for creative results",
    ],
    prompts: [
      "Upload a source face photo and a target photo - the AI handles alignment, skin matching, and blending automatically",
      "Swap faces in group photos - select which face to replace for precise control",
      "Combine face swap with style transfer for creative portraits in any artistic style",
      "Use with AI-generated images to place your face into fantasy, sci-fi, or historical scenes",
    ],
    faq: [
      {
        q: "Is AI face swap free?",
        a: "Yes. Face swap uses 2 credits per swap. Free plan includes 50 credits/month plus daily bonus credits. No credit card required to start.",
      },
      {
        q: "How accurate is the face swap?",
        a: "EGAKU AI uses advanced face detection and blending algorithms. The result matches skin tone, lighting direction, and facial proportions for a natural, seamless swap.",
      },
      {
        q: "Can I swap faces in group photos?",
        a: "Yes. The AI detects multiple faces in a photo. You can select which face to swap, making it easy to work with group shots and complex scenes.",
      },
      {
        q: "Is face swap ethical to use?",
        a: "Face swap is a creative tool. EGAKU AI prohibits using it for deception, harassment, or non-consensual impersonation. Always use face swap responsibly and with respect for others.",
      },
    ],
    category: "feature",
    minPlan: "Free",
    credits: "2",
  },
};

// Merge handcrafted + auto-generated long-tail SEO pages
const PAGES = { ...GENERATED_PAGES, ...HANDCRAFTED_PAGES };

// Force dynamic rendering — next-intl needs request context for locale resolution.
// These are SEO landing pages; SSR is fine (Vercel edge cache handles repeat visits).
export const dynamic = "force-dynamic";

// generateStaticParams kept for reference but overridden by force-dynamic
export async function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

// ─── Dynamic Metadata ───

type Props = { params: Promise<{ slug: string; locale: string }> };

const NSFW_SLUGS = new Set([
  "ai-nsfw-generator", "ai-hentai-generator", "ai-nsfw-video-generator",
  "nsfw-ai-art-generator", "unrestricted-ai-art-generator",
]);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) return { title: "Not Found" };

  const isNsfw = NSFW_SLUGS.has(slug);

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    ...(isNsfw && {
      robots: { index: false, follow: false },
    }),
    alternates: {
      canonical: `/ai/${slug}`,
      languages: {
        en: `/ai/${slug}`,
        ja: `/ja/ai/${slug}`,
      },
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `https://egaku-ai.com/ai/${slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page.h1,
      description: page.description,
    },
  };
}

// ─── Page Component ───

export default async function AILandingPage({ params }: Props) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `EGAKU AI - ${page.h1}`,
    url: `https://egaku-ai.com/ai/${slug}`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: page.minPlan === "Free" ? "0" : "980",
      priceCurrency: "JPY",
    },
    description: page.description,
  };

  const categoryLabel =
    page.category === "model"
      ? "AI Model"
      : page.category === "style"
        ? "Style"
        : "Feature";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="outline">{categoryLabel}</Badge>
            <Badge variant="secondary">{page.minPlan} plan</Badge>
            <Badge variant="secondary">{page.credits} credits</Badge>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {page.h1}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {page.description}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" render={<Link href="/generate" />}>
              Try Now - Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/register" />}
            >
              Create Account
            </Button>
          </div>
        </div>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Features</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {page.features.map((f) => (
              <Card key={f}>
                <CardContent className="p-4 flex items-start gap-3">
                  <span className="text-green-500 mt-0.5 shrink-0">&#10003;</span>
                  <span className="text-sm">{f}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Example Prompts */}
        {page.prompts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Example Prompts</h2>
            <div className="space-y-3">
              {page.prompts.map((p) => (
                <Card key={p}>
                  <CardContent className="p-4">
                    <p className="text-sm font-mono text-muted-foreground">
                      {p}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" render={<Link href="/generate" />}>
                Try These Prompts
              </Button>
            </div>
          </section>
        )}

        {/* FAQ */}
        {page.faq.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {page.faq.map((f) => (
                <Card key={f.q}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{f.q}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {f.a}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="text-center py-12 border-t">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Create?
          </h2>
          <p className="text-muted-foreground mb-6">
            Start generating AI art for free. No credit card required. 50
            credits/month on the free plan.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" render={<Link href="/register" />}>
              Sign Up Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/explore" />}
            >
              Browse Gallery
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-sm text-muted-foreground">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} EGAKU AI. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link
              href="/explore"
              className="hover:text-foreground transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
