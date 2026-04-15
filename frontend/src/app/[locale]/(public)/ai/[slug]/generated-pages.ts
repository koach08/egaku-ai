/**
 * Programmatic SEO — auto-generated long-tail landing pages.
 *
 * Pattern: <style>-<subject>-generator
 * Example: /ai/anime-girl-generator, /ai/cyberpunk-city-generator
 *
 * Each page targets a specific long-tail search keyword.
 * Templated content keeps maintenance low while providing unique SEO value.
 */

export type GeneratedPage = {
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  features: string[];
  prompts: string[];
  faq: { q: string; a: string }[];
  category: "model" | "style" | "feature" | "subject";
  minPlan: string;
  credits: string;
};

// Style × Subject matrix — generates ~100+ landing pages
const STYLES = [
  { id: "anime", label: "Anime", promptSuffix: "anime style, detailed, vibrant colors, masterpiece" },
  { id: "realistic", label: "Realistic", promptSuffix: "photorealistic, 8k, detailed skin, professional photography" },
  { id: "ghibli", label: "Ghibli", promptSuffix: "studio ghibli style, hand-painted, whimsical, miyazaki" },
  { id: "cyberpunk", label: "Cyberpunk", promptSuffix: "cyberpunk style, neon lights, futuristic, blade runner aesthetic" },
  { id: "fantasy", label: "Fantasy", promptSuffix: "fantasy art, epic, magical, detailed illustration" },
  { id: "watercolor", label: "Watercolor", promptSuffix: "watercolor painting, soft colors, artistic, paper texture" },
  { id: "oil-painting", label: "Oil Painting", promptSuffix: "oil painting, classical, textured brushstrokes, renaissance" },
  { id: "pixel-art", label: "Pixel Art", promptSuffix: "pixel art style, 16-bit, retro gaming aesthetic" },
  { id: "3d-render", label: "3D Render", promptSuffix: "3d render, octane render, ray tracing, photorealistic" },
  { id: "comic-book", label: "Comic Book", promptSuffix: "comic book style, bold outlines, halftone dots, marvel" },
];

const SUBJECTS = [
  { id: "girl", label: "Girl", basePrompt: "beautiful girl, expressive eyes" },
  { id: "boy", label: "Boy", basePrompt: "handsome young man, stylish outfit" },
  { id: "portrait", label: "Portrait", basePrompt: "stunning portrait, dramatic lighting" },
  { id: "landscape", label: "Landscape", basePrompt: "breathtaking landscape, epic scale" },
  { id: "city", label: "City", basePrompt: "stunning cityscape, urban architecture" },
  { id: "character", label: "Character", basePrompt: "unique character design, detailed outfit" },
  { id: "dragon", label: "Dragon", basePrompt: "majestic dragon, detailed scales, powerful pose" },
  { id: "robot", label: "Robot", basePrompt: "advanced robot, mechanical details, futuristic" },
  { id: "warrior", label: "Warrior", basePrompt: "fierce warrior, detailed armor, dynamic pose" },
  { id: "wizard", label: "Wizard", basePrompt: "wise wizard, magical aura, ornate robes" },
  { id: "cat", label: "Cat", basePrompt: "adorable cat, expressive eyes, fluffy fur" },
  { id: "animal", label: "Animal", basePrompt: "majestic animal, detailed fur, natural environment" },
];

function generatePage(style: (typeof STYLES)[0], subject: (typeof SUBJECTS)[0]): GeneratedPage {
  const combo = `${style.label} ${subject.label}`;
  return {
    title: `Free AI ${combo} Generator - Create ${combo} Art Online | EGAKU AI`,
    h1: `AI ${combo} Generator`,
    description: `Generate stunning ${style.label.toLowerCase()} ${subject.label.toLowerCase()} images with AI for free. High-quality ${combo} art using Flux, SDXL, and 25+ AI models. No signup required for preview.`,
    keywords: [
      `ai ${style.id} ${subject.id}`,
      `${style.id} ${subject.id} generator`,
      `${style.id} ${subject.id} ai`,
      `ai ${subject.id} ${style.id}`,
      `free ${style.id} ${subject.id} generator`,
      `${combo.toLowerCase()} generator`,
      `${combo.toLowerCase()} ai art`,
      `create ${style.id} ${subject.id} online`,
    ],
    features: [
      `Specialized ${style.label} style generation with 25+ AI models`,
      `Optimized prompts for ${subject.label.toLowerCase()} composition`,
      `Flux Pro and Nano Banana 2 for highest quality`,
      `Custom LoRA support via CivitAI integration`,
      `Resolution up to 2048x2048 on premium models`,
      `No software download required - runs in browser`,
    ],
    prompts: [
      `${subject.basePrompt}, ${style.promptSuffix}, 8k`,
      `${subject.basePrompt}, wearing elegant outfit, ${style.promptSuffix}`,
      `close-up of ${subject.label.toLowerCase()}, cinematic composition, ${style.promptSuffix}`,
      `${subject.basePrompt}, dramatic pose, ${style.promptSuffix}, masterpiece`,
    ],
    faq: [
      {
        q: `Is the AI ${combo} Generator free?`,
        a: `Yes. EGAKU AI offers 50 free credits per month plus daily login bonuses. Generate ${combo.toLowerCase()} images for free with Flux Schnell (1 credit) or Flux Dev (3 credits).`,
      },
      {
        q: `Which model is best for ${combo.toLowerCase()} generation?`,
        a: `For ${style.label.toLowerCase()} style, we recommend Flux Dev for balance, Flux Pro for highest quality, or specialized CivitAI checkpoints available on Basic+ plans.`,
      },
      {
        q: `Can I use these images commercially?`,
        a: `Yes. All generated images are yours to use, including for commercial projects. Paid plans include full commercial rights with no attribution required.`,
      },
    ],
    category: "subject",
    minPlan: "Free",
    credits: "1-5",
  };
}

// Generate all style × subject combinations
export const GENERATED_PAGES: Record<string, GeneratedPage> = {};
for (const style of STYLES) {
  for (const subject of SUBJECTS) {
    const slug = `${style.id}-${subject.id}-generator`;
    GENERATED_PAGES[slug] = generatePage(style, subject);
  }
}

// Use-case specific pages (handcrafted long-tail targets)
const USE_CASE_PAGES: Record<string, GeneratedPage> = {
  "ai-linkedin-photo-generator": {
    title: "AI LinkedIn Photo Generator - Professional Headshots from Selfie",
    h1: "AI LinkedIn Photo Generator",
    description: "Generate professional LinkedIn headshots from a single selfie. Business, casual, and creative styles. Perfect for profile photos, resumes, and job applications. Free to try.",
    keywords: [
      "ai linkedin photo", "ai linkedin headshot", "linkedin photo ai free",
      "ai professional headshot", "ai business photo", "professional portrait ai",
      "linkedin profile photo ai generator", "ai headshot free",
    ],
    features: [
      "Upload one selfie, get 8 professional portrait styles",
      "LinkedIn, resume, business card, and dating app presets",
      "Maintains your likeness with PuLID identity preservation",
      "4K output quality, transparent background option",
      "Faster and cheaper than a photo studio",
      "Commercial use rights included",
    ],
    prompts: [
      "professional linkedin headshot, navy blue suit, clean white background, confident smile, studio lighting",
      "business portrait, modern office background, warm natural light, approachable expression",
      "creative professional, black turtleneck, minimalist gray background, artistic lighting",
      "corporate headshot, tailored blazer, bokeh office background, professional composition",
    ],
    faq: [
      {
        q: "How does the AI preserve my face?",
        a: "EGAKU AI's Photo Booth uses PuLID (identity-preserving AI) to maintain your facial features while generating new professional portraits in different styles and settings.",
      },
      {
        q: "Can I use these for my LinkedIn profile?",
        a: "Yes. Generated photos are studio-quality and look natural. Many professionals use AI-generated headshots for LinkedIn, resumes, and business contexts successfully.",
      },
      {
        q: "How many photos do I get?",
        a: "Each generation creates one high-quality portrait. You can generate multiple variations — 8 preset styles available. Batch generation on Lite+ plans.",
      },
    ],
    category: "feature",
    minPlan: "Free",
    credits: "3-5",
  },
  "ai-anime-avatar-maker": {
    title: "AI Anime Avatar Maker - Create Anime Character from Photo",
    h1: "AI Anime Avatar Maker",
    description: "Transform yourself into an anime character with AI. Upload a selfie and get anime-style avatars for Discord, Twitter, gaming. Multiple anime styles, free to try.",
    keywords: [
      "ai anime avatar", "anime avatar maker ai", "anime avatar from photo",
      "ai anime character generator", "selfie to anime ai",
      "anime avatar free", "ai anime art generator", "waifu generator ai",
    ],
    features: [
      "Turn your selfie into anime in seconds",
      "Multiple anime styles: classic, modern, chibi, ghibli",
      "Custom character with your features preserved",
      "High-resolution output for avatars and wallpapers",
      "Works on photos of any quality",
      "Perfect for Discord, Twitter, gaming profiles",
    ],
    prompts: [
      "anime character, expressive large eyes, vibrant hair, detailed outfit, cel shading, masterpiece",
      "chibi anime character, cute pose, pastel colors, clean background, adorable",
      "studio ghibli inspired character, soft pastel colors, whimsical expression, hand-painted feel",
      "modern anime protagonist, dynamic pose, school uniform, detailed background, anime movie quality",
    ],
    faq: [
      {
        q: "How accurate is the anime transformation?",
        a: "Our Style Transfer and Photo Booth tools preserve your key features (hair color, face shape) while converting to anime style. Results vary by photo quality and chosen style.",
      },
      {
        q: "Can I use this for my profile picture?",
        a: "Yes. Output is high-resolution PNG suitable for Discord, Twitter, and social media profiles. Commercial use rights included with paid plans.",
      },
      {
        q: "What's the best style for waifu/husbando generation?",
        a: "Try our anime models: Flux Dev with anime prompts, or CivitAI anime checkpoints like MeinaMix or Anything v5 for classic anime style.",
      },
    ],
    category: "feature",
    minPlan: "Free",
    credits: "2-3",
  },
  "ai-tattoo-design-generator": {
    title: "AI Tattoo Design Generator - Free Tattoo Ideas Online",
    h1: "AI Tattoo Design Generator",
    description: "Generate unique tattoo designs with AI. Traditional, minimalist, Japanese, tribal, realistic styles. Get custom tattoo ideas before your appointment. Free AI tattoo generator.",
    keywords: [
      "ai tattoo generator", "ai tattoo design", "tattoo generator ai free",
      "ai tattoo ideas", "custom tattoo ai", "tattoo design generator",
      "ai tattoo maker", "free tattoo design ai",
    ],
    features: [
      "10+ tattoo styles: traditional, minimalist, Japanese, tribal, realistic",
      "Black and white or full color designs",
      "Transparent background for mockups",
      "Multiple variations per prompt",
      "High-resolution output for tattoo artist reference",
      "Unique designs - never recycled templates",
    ],
    prompts: [
      "minimalist tattoo design, small mountain range with moon, single line art, black ink, clean composition",
      "traditional japanese tattoo, koi fish with cherry blossoms, bold lines, vibrant colors, irezumi style",
      "geometric animal tattoo, wolf with sacred geometry patterns, black ink, intricate detail",
      "realistic tattoo design, rose with thorns, black and grey shading, detailed petals, classic style",
    ],
    faq: [
      {
        q: "Can I show these to my tattoo artist?",
        a: "Yes. AI-generated designs work as excellent reference material. Most tattoo artists appreciate custom designs they can refine and personalize for your tattoo.",
      },
      {
        q: "Can I get a transparent background?",
        a: "Yes. Use our Background Removal tool after generation to get a clean PNG suitable for mockups and printing.",
      },
      {
        q: "Are these designs unique?",
        a: "Yes. Every AI generation creates a unique design. Combined with your specific prompt, the result is one-of-a-kind.",
      },
    ],
    category: "feature",
    minPlan: "Free",
    credits: "1-3",
  },
  "ai-coloring-page-generator": {
    title: "AI Coloring Page Generator - Free Printable Coloring Pages",
    h1: "AI Coloring Page Generator",
    description: "Generate custom coloring pages with AI. Any theme - animals, mandalas, characters, scenes. Printable line art for kids and adults. Free to use, commercial rights included.",
    keywords: [
      "ai coloring page generator", "ai coloring book", "coloring page ai",
      "free printable coloring pages ai", "custom coloring pages",
      "ai line art generator", "kids coloring pages ai",
      "adult coloring pages ai",
    ],
    features: [
      "Any theme - just describe what you want colored",
      "Clean line art output, perfect for printing",
      "Suitable for all ages - kids, teens, adults",
      "Unlimited unique pages - no templates",
      "Print-ready resolution (300 DPI equivalent)",
      "Commercial use rights for sellers on Etsy, etc.",
    ],
    prompts: [
      "coloring page, cute cat playing with yarn, line art, no shading, bold outlines, white background",
      "mandala coloring page, intricate geometric pattern, symmetrical, detailed line work, meditation style",
      "coloring page, dragon in forest, adventure scene, bold outlines, detailed but not too complex",
      "kids coloring page, underwater scene with fish and coral, simple lines, cute style, large areas to color",
    ],
    faq: [
      {
        q: "Can I sell these coloring pages?",
        a: "Yes. With a paid plan, you get full commercial rights. Many users sell AI-generated coloring books on Etsy, Amazon KDP, and other platforms.",
      },
      {
        q: "What's the best model for coloring pages?",
        a: "Flux Dev and SDXL produce clean line art. Use prompts like 'line art, no shading, bold outlines' and avoid adding color references.",
      },
      {
        q: "Can I generate whole coloring books?",
        a: "Yes. Generate individual pages with different themes, then combine into a coloring book PDF. Pro plan users can batch generate efficiently.",
      },
    ],
    category: "feature",
    minPlan: "Free",
    credits: "1-3",
  },
  "ai-book-cover-generator": {
    title: "AI Book Cover Generator - Design Book Covers Online Free",
    h1: "AI Book Cover Generator",
    description: "Create stunning book covers with AI. Fantasy, sci-fi, romance, thriller genres. Self-publishing quality covers for Amazon KDP, Kindle, and print. Free book cover design.",
    keywords: [
      "ai book cover generator", "book cover ai", "kindle cover ai",
      "ai book cover design", "self publishing cover ai",
      "ebook cover generator", "free book cover maker ai",
      "amazon kdp cover ai",
    ],
    features: [
      "All genres: fantasy, sci-fi, romance, thriller, literary",
      "Kindle and print-ready dimensions",
      "Ideogram v3 for text rendering (title/author name)",
      "Full commercial rights on paid plans",
      "Multiple cover variations per concept",
      "Professional quality matching traditional publishers",
    ],
    prompts: [
      "fantasy book cover, ancient dragon flying over misty mountains, epic atmosphere, dramatic lighting, title space at top",
      "sci-fi book cover, astronaut standing on alien planet, two moons in sky, cinematic composition, space for title",
      "romance novel cover, silhouette of couple embracing at sunset, warm colors, soft focus, literary style",
      "thriller book cover, dark city street at night, mysterious figure, noir atmosphere, high contrast",
    ],
    faq: [
      {
        q: "Can I use this for Amazon KDP?",
        a: "Yes. With a paid plan, you get full commercial rights to sell books using AI-generated covers on Amazon KDP, Ingram Spark, Draft2Digital, and other platforms.",
      },
      {
        q: "How do I add title text to my cover?",
        a: "Use Ideogram v3 (Lite+ plan) which excels at text rendering. Alternatively, generate a cover without text and add title/author name in Canva or Photoshop.",
      },
      {
        q: "What dimensions should I use?",
        a: "For Kindle ebooks: 1600x2560 (1.6:1 ratio). For paperback: adjust to your book size. We recommend generating at 1024x1664 and upscaling to final dimensions.",
      },
    ],
    category: "feature",
    minPlan: "Free",
    credits: "3-8",
  },
  "ai-dnd-character-generator": {
    title: "AI D&D Character Generator - Create Fantasy RPG Characters",
    h1: "AI D&D Character Generator",
    description: "Generate stunning D&D character portraits with AI. Elf rangers, dwarf paladins, tiefling warlocks - all fantasy races and classes. Perfect for TTRPG, Dungeons & Dragons campaigns.",
    keywords: [
      "ai dnd character generator", "d&d character portrait ai",
      "dungeons dragons ai art", "ai ttrpg character generator",
      "fantasy character ai", "ai character portrait",
      "pathfinder character ai", "ai rpg character",
    ],
    features: [
      "All D&D races: elf, dwarf, tiefling, dragonborn, orc, human",
      "All classes: fighter, wizard, rogue, cleric, warlock",
      "Detailed equipment and outfits matching class",
      "Fantasy portrait style optimized for TTRPG",
      "Custom prompts for unique character designs",
      "Print-ready quality for character sheets",
    ],
    prompts: [
      "elf ranger, long silver hair, leather armor, bow and quiver, forest background, fantasy portrait art",
      "dwarf paladin, braided red beard, plate armor, glowing hammer, stern expression, heroic composition",
      "tiefling warlock, purple skin, horns, dark robes with arcane symbols, magical aura, dramatic lighting",
      "human bard, flowing cape, lute in hand, charismatic smile, tavern background, adventure style",
    ],
    faq: [
      {
        q: "Can I use these for my D&D campaign?",
        a: "Yes. AI-generated character portraits are perfect for player character sheets, DM NPCs, and online campaigns on Roll20/Foundry. Commercial rights included with paid plans.",
      },
      {
        q: "What style works best for D&D characters?",
        a: "Try fantasy art style with 'detailed portrait' and 'fantasy lighting' prompts. Flux Dev and Leonardo-style models produce excellent TTRPG portraits.",
      },
      {
        q: "Can I generate multiple characters for one party?",
        a: "Yes. Generate each party member separately with consistent art style for a cohesive look. Use Character Lock feature to maintain style across multiple characters.",
      },
    ],
    category: "feature",
    minPlan: "Free",
    credits: "2-5",
  },
};

// Merge use-case pages into generated pages
Object.assign(GENERATED_PAGES, USE_CASE_PAGES);
