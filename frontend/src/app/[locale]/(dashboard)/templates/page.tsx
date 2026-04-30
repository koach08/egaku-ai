"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, SparklesIcon, ImageIcon, FilmIcon, MessageSquareIcon } from "lucide-react";

type TemplateCategory = "trending" | "portrait" | "landscape" | "product" | "video";

interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  type: "image" | "video";
  preview: string; // gradient for placeholder
  prompt: string;
  negative_prompt?: string;
  model?: string;
  params?: Record<string, unknown>;
}

const TEMPLATES: Template[] = [
  // ── Trending ──
  {
    id: "ghibli_landscape",
    name: "Ghibli Landscape",
    category: "trending",
    type: "image",
    preview: "from-green-400 to-sky-500",
    prompt: "studio ghibli style landscape, rolling green hills with wildflowers, fluffy white clouds in bright blue sky, distant castle on hilltop, hand-painted animation style, warm sunlight, whimsical and peaceful, masterpiece quality",
    negative_prompt: "photorealistic, dark, gritty, 3d render",
    model: "fal_flux_dev",
  },
  {
    id: "cyberpunk_city",
    name: "Cyberpunk City",
    category: "trending",
    type: "image",
    preview: "from-purple-600 to-pink-500",
    prompt: "cyberpunk city street at night, neon holographic billboards in Japanese and English, rain-soaked reflective streets, flying cars overhead, dense urban atmosphere, blade runner aesthetic, volumetric fog, 8K, cinematic",
    model: "fal_flux_dev",
  },
  {
    id: "anime_waifu",
    name: "Anime Character",
    category: "trending",
    type: "image",
    preview: "from-pink-400 to-violet-500",
    prompt: "beautiful anime girl with long silver hair and crystal blue eyes, wearing a school uniform, cherry blossom petals falling, soft golden hour lighting, detailed illustration, masterpiece, best quality, vibrant colors",
    negative_prompt: "low quality, worst quality, blurry, deformed",
    model: "fal_flux_dev",
  },
  {
    id: "pixel_game",
    name: "Pixel Art Scene",
    category: "trending",
    type: "image",
    preview: "from-emerald-500 to-blue-600",
    prompt: "16-bit pixel art scene, fantasy RPG village at sunset, stone buildings with warm glowing windows, market stalls, adventurers walking on cobblestone road, detailed sprite work, retro game aesthetic, nostalgic",
    model: "fal_flux_schnell",
  },

  // ── Portrait ──
  {
    id: "linkedin_headshot",
    name: "LinkedIn Headshot",
    category: "portrait",
    type: "image",
    preview: "from-blue-500 to-slate-600",
    prompt: "professional corporate headshot photograph, confident person in navy blue business suit, clean neutral gray background, soft studio lighting, shallow depth of field, shot on Canon EOS R5, 85mm f/1.4, warm skin tones, approachable smile",
    model: "fal_flux_dev",
  },
  {
    id: "dating_photo",
    name: "Dating Profile",
    category: "portrait",
    type: "image",
    preview: "from-rose-400 to-amber-400",
    prompt: "attractive candid portrait at golden hour, person in casual stylish outfit at outdoor cafe, warm natural sunlight, bokeh background with city lights, genuine smile, lifestyle photography, shot on Sony A7III, 50mm f/1.8",
    model: "fal_flux_dev",
  },
  {
    id: "fantasy_portrait",
    name: "Fantasy Character",
    category: "portrait",
    type: "image",
    preview: "from-amber-500 to-red-700",
    prompt: "epic fantasy character portrait, warrior with intricate silver armor and glowing runes, dramatic rim lighting, dark atmospheric background with floating embers, digital painting, concept art quality, artstation trending",
    model: "fal_flux_dev",
  },
  {
    id: "vintage_film",
    name: "Vintage Film Photo",
    category: "portrait",
    type: "image",
    preview: "from-amber-300 to-orange-600",
    prompt: "vintage 35mm film photograph portrait, person in 1970s fashion, warm faded color palette, film grain texture, slight light leak, Kodak Portra 400 aesthetic, nostalgic mood, natural window light",
    model: "fal_flux_dev",
  },

  // ── Landscape / Art ──
  {
    id: "aurora_night",
    name: "Aurora Night Sky",
    category: "landscape",
    type: "image",
    preview: "from-green-500 to-purple-700",
    prompt: "breathtaking aurora borealis over a frozen lake in Iceland, vibrant green and purple northern lights reflected in still water, snow-covered mountains, stars, long exposure photography, 4K, National Geographic quality",
    model: "fal_flux_dev",
  },
  {
    id: "underwater_reef",
    name: "Coral Reef",
    category: "landscape",
    type: "image",
    preview: "from-cyan-400 to-blue-700",
    prompt: "vibrant tropical coral reef underwater photograph, colorful fish school swimming through coral formations, sunbeams piercing through crystal clear turquoise water, sea turtle in background, BBC Earth documentary quality, 8K",
    model: "fal_flux_dev",
  },
  {
    id: "japanese_temple",
    name: "Japanese Temple",
    category: "landscape",
    type: "image",
    preview: "from-red-500 to-amber-500",
    prompt: "ancient Japanese temple in autumn, brilliant red and orange maple trees surrounding wooden temple, morning mist, koi pond with stone bridge, fallen leaves on moss-covered ground, serene atmosphere, golden hour light",
    model: "fal_flux_dev",
  },
  {
    id: "space_nebula",
    name: "Space Nebula",
    category: "landscape",
    type: "image",
    preview: "from-violet-600 to-indigo-900",
    prompt: "massive colorful nebula in deep space, swirling clouds of gas in purple pink blue and gold, bright stars scattered throughout, distant galaxies visible, Hubble telescope quality, ultra detailed, 8K wallpaper",
    model: "fal_flux_dev",
  },

  // ── Product ──
  {
    id: "perfume_bottle",
    name: "Luxury Perfume",
    category: "product",
    type: "image",
    preview: "from-amber-400 to-rose-500",
    prompt: "luxury perfume bottle product photography, elegant glass bottle with gold cap on black marble surface, soft studio lighting with warm highlights, water droplets on surface, premium commercial quality, 8K, Phase One IQ4",
    model: "fal_flux_dev",
  },
  {
    id: "sneaker_ad",
    name: "Sneaker Ad",
    category: "product",
    type: "image",
    preview: "from-gray-600 to-gray-900",
    prompt: "professional sneaker product photography, modern athletic shoe floating with dynamic splash of color powder, dramatic studio lighting, dark background, commercial advertising quality, Nike/Adidas campaign style",
    model: "fal_flux_dev",
  },
  {
    id: "food_photo",
    name: "Food Photography",
    category: "product",
    type: "image",
    preview: "from-orange-400 to-red-500",
    prompt: "professional food photography, gourmet ramen bowl with rich golden broth, perfect soft-boiled egg, green onions, nori, chashu pork, steam rising, dark wooden table, overhead shot, natural window light, editorial quality",
    model: "fal_flux_dev",
  },
  {
    id: "coffee_brand",
    name: "Coffee Brand",
    category: "product",
    type: "image",
    preview: "from-amber-700 to-stone-800",
    prompt: "artisan coffee brand product photography, matte black coffee bag with minimalist label on raw wood surface, fresh roasted beans scattered around, morning sunlight, steam from cup in background, warm tones, commercial quality",
    model: "fal_flux_dev",
  },

  // ── Video ──
  {
    id: "ocean_sunset_vid",
    name: "Ocean Sunset",
    category: "video",
    type: "video",
    preview: "from-orange-500 to-pink-600",
    prompt: "cinematic aerial drone shot slowly flying over a calm tropical ocean at sunset, golden sunlight reflecting on gentle waves, vibrant orange and pink sky, birds flying in distance, peaceful and serene, 4K cinematic",
    model: "fal_wan26_t2v",
  },
  {
    id: "city_timelapse_vid",
    name: "City Timelapse",
    category: "video",
    type: "video",
    preview: "from-blue-600 to-indigo-800",
    prompt: "cinematic timelapse of a major city transitioning from day to night, skyscrapers lighting up, car light trails on highways, clouds moving fast overhead, dramatic wide angle shot, 4K cinematic quality",
    model: "fal_wan26_t2v",
  },
  {
    id: "campfire_vid",
    name: "Cozy Campfire",
    category: "video",
    type: "video",
    preview: "from-orange-600 to-red-800",
    prompt: "close-up of a campfire crackling at night in a forest, warm orange flames dancing, sparks floating up into the dark sky, stars visible through tree canopy, cozy atmosphere, ASMR quality, cinematic",
    model: "fal_wan26_t2v",
  },
  {
    id: "sakura_vid",
    name: "Sakura Walk",
    category: "video",
    type: "video",
    preview: "from-pink-300 to-rose-500",
    prompt: "slow cinematic tracking shot through a Japanese cherry blossom tunnel, pink petals gently falling and floating in the breeze, dappled sunlight, a person walking in the distance, dreamy and peaceful, 4K",
    model: "fal_wan26_t2v",
  },
];

const CATEGORIES: { value: TemplateCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "trending", label: "Trending" },
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape & Art" },
  { value: "product", label: "Product" },
  { value: "video", label: "Video" },
];

export default function TemplatesPage() {
  const { session } = useAuth();
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [generating, setGenerating] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const filtered = category === "all"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === category);

  const handleGenerate = useCallback(async (template: Template) => {
    if (!session?.access_token) return;
    setGenerating(template.id);
    setError("");

    try {
      if (template.type === "image") {
        const res = await api.generateImage(session.access_token, {
          prompt: template.prompt,
          negative_prompt: template.negative_prompt || "",
          model: template.model || "fal_flux_schnell",
          width: 1024,
          height: 1024,
          steps: 25,
          cfg: 7.0,
          seed: -1,
          nsfw: false,
        });

        if (res.result_url) {
          setResults((prev) => ({ ...prev, [template.id]: resolveResultUrl(res.result_url) || res.result_url }));
        } else if (res.job_id) {
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            const status = await api.getJobStatus(session.access_token, res.job_id);
            if (status.status === "completed" && status.result_url) {
              setResults((prev) => ({ ...prev, [template.id]: resolveResultUrl(status.result_url) || status.result_url }));
              break;
            }
            if (status.status === "failed") { setError("Generation failed."); break; }
          }
        }
      } else {
        // Video
        const res = await api.generateVideo(session.access_token, {
          prompt: template.prompt,
          model: template.model || "fal_wan26_t2v",
          duration: 5,
          seed: -1,
          nsfw: false,
        });

        if (res.result_url) {
          setResults((prev) => ({ ...prev, [template.id]: resolveResultUrl(res.result_url) || res.result_url }));
        } else if (res.job_id) {
          for (let i = 0; i < 60; i++) {
            await new Promise((r) => setTimeout(r, 5000));
            const status = await api.getJobStatus(session.access_token, res.job_id);
            if (status.status === "completed" && status.result_url) {
              setResults((prev) => ({ ...prev, [template.id]: resolveResultUrl(status.result_url) || status.result_url }));
              break;
            }
            if (status.status === "failed") { setError("Generation failed."); break; }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(null);
    }
  }, [session]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">AI Templates</h1>
          <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          One tap to create. No prompt needed.
          <a href="/contact" className="text-white/50 hover:text-white/80 ml-2 inline-flex items-center gap-1">
            <MessageSquareIcon className="size-3" />
            Feedback = bonus credits
          </a>
        </p>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-4 py-2 rounded-full text-xs transition-colors ${
                category === c.value
                  ? "bg-white text-black"
                  : "border border-white/[0.06] text-white/50 hover:text-white/80"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to use AI Templates</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <>
            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((template) => {
                const result = results[template.id];
                const isGenerating = generating === template.id;

                return (
                  <div
                    key={template.id}
                    className="rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.02] group"
                  >
                    {/* Preview / Result */}
                    <div className="aspect-square relative overflow-hidden">
                      {result ? (
                        template.type === "video" ? (
                          <video src={result} className="w-full h-full object-cover" controls autoPlay loop muted playsInline />
                        ) : (
                          <img src={result} alt={template.name} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${template.preview} flex items-center justify-center`}>
                          {template.type === "video" ? (
                            <FilmIcon className="size-8 text-white/30" />
                          ) : (
                            <ImageIcon className="size-8 text-white/30" />
                          )}
                        </div>
                      )}

                      {/* Type badge */}
                      <span className={`absolute top-2 right-2 text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                        template.type === "video" ? "bg-blue-500/80 text-white" : "bg-white/10 text-white backdrop-blur-sm"
                      }`}>
                        {template.type === "video" ? "Video" : "Image"}
                      </span>
                    </div>

                    {/* Info + Button */}
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-medium">{template.name}</p>

                      {result ? (
                        <a href={result} download={`${template.id}.${template.type === "video" ? "mp4" : "png"}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="w-full rounded-full">
                            <DownloadIcon className="size-3 mr-1" />
                            Download
                          </Button>
                        </a>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full bg-white text-black hover:bg-white/90 rounded-full"
                          disabled={isGenerating || generating !== null}
                          onClick={() => handleGenerate(template)}
                        >
                          {isGenerating ? (
                            <Loader2Icon className="size-3 mr-1 animate-spin" />
                          ) : (
                            <SparklesIcon className="size-3 mr-1" />
                          )}
                          {isGenerating ? "Creating..." : "Create"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </>
  );
}
