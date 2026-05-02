"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Loader2Icon, SparklesIcon, CopyIcon, XIcon, DownloadIcon } from "lucide-react";

// ── Tag categories ──
const TAG_CATEGORIES = [
  {
    id: "subject",
    label: "Subject",
    tags: [
      "1 girl", "1 boy", "1 woman", "1 man", "couple", "group",
      "cat", "dog", "dragon", "robot", "angel", "demon", "elf", "warrior",
      "landscape", "cityscape", "interior", "still life", "vehicle",
    ],
  },
  {
    id: "body",
    label: "Body Type",
    tags: [
      "slim", "athletic", "curvy", "muscular", "petite", "tall",
    ],
  },
  {
    id: "hair",
    label: "Hair",
    tags: [
      "long hair", "short hair", "ponytail", "twin tails", "braids", "bun",
      "black hair", "blonde hair", "brown hair", "red hair", "blue hair", "silver hair", "pink hair", "white hair",
      "wavy hair", "straight hair", "curly hair",
    ],
  },
  {
    id: "eyes",
    label: "Eyes",
    tags: [
      "blue eyes", "brown eyes", "green eyes", "red eyes", "golden eyes", "heterochromia",
    ],
  },
  {
    id: "clothing",
    label: "Clothing",
    tags: [
      "school uniform", "business suit", "casual wear", "dress", "kimono", "armor",
      "hoodie", "leather jacket", "swimsuit", "sportswear", "military uniform",
      "gothic dress", "maid outfit", "nurse outfit", "wedding dress",
      "tank top", "crop top", "jeans", "skirt",
    ],
  },
  {
    id: "pose",
    label: "Pose",
    tags: [
      "standing", "sitting", "walking", "running", "lying down", "kneeling",
      "arms crossed", "hands on hips", "peace sign", "waving", "jumping",
      "looking at viewer", "looking away", "profile view", "from behind", "from above", "from below",
      "dynamic pose", "action pose", "relaxed pose", "confident pose",
    ],
  },
  {
    id: "expression",
    label: "Expression",
    tags: [
      "smiling", "laughing", "serious", "shy", "blushing", "crying",
      "angry", "surprised", "confident", "seductive", "peaceful", "determined",
    ],
  },
  {
    id: "setting",
    label: "Setting / Background",
    tags: [
      "outdoor", "indoor", "city street", "forest", "beach", "mountain",
      "classroom", "bedroom", "cafe", "rooftop", "garden", "library",
      "night", "sunset", "sunrise", "rain", "snow", "cherry blossoms",
      "neon city", "futuristic", "medieval", "space", "underwater",
      "studio background", "simple background", "gradient background",
    ],
  },
  {
    id: "style",
    label: "Art Style",
    tags: [
      "photorealistic", "anime", "manga", "oil painting", "watercolor", "digital art",
      "3D render", "pixel art", "comic book", "sketch", "minimalist",
      "cyberpunk", "steampunk", "fantasy", "sci-fi", "noir",
      "ghibli style", "makoto shinkai", "retro", "pop art", "art nouveau",
      "cinematic lighting", "dramatic lighting", "soft lighting", "golden hour",
      "film grain", "bokeh", "shallow depth of field", "wide angle",
    ],
  },
  {
    id: "quality",
    label: "Quality Boost",
    tags: [
      "masterpiece", "best quality", "highly detailed", "ultra detailed",
      "sharp focus", "8K", "4K UHD", "professional", "award winning",
    ],
  },
];

// NSFW tags (only shown when NSFW toggle is on)
const NSFW_CATEGORIES = [
  {
    id: "nsfw_clothing",
    label: "Clothing (18+)",
    tags: [
      "lingerie", "underwear", "bikini", "see-through", "bare shoulders",
      "off-shoulder", "strapless", "backless", "side slit",
      "nude", "topless", "partially undressed",
    ],
  },
  {
    id: "nsfw_pose",
    label: "Pose (18+)",
    tags: [
      "seductive pose", "alluring", "sensual", "provocative",
      "lying on bed", "leaning forward", "stretching",
    ],
  },
  {
    id: "nsfw_setting",
    label: "Setting (18+)",
    tags: [
      "bedroom", "bathroom", "hot spring", "onsen", "pool", "shower",
      "luxury hotel", "candlelit room",
    ],
  },
];

export default function TagBuilderPage() {
  const { session } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [nsfw, setNsfw] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const buildPrompt = () => {
    const tags = Array.from(selected);
    return tags.join(", ");
  };

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || selected.size === 0) return;
    const prompt = buildPrompt();
    if (!prompt) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await api.generateImage(session.access_token, {
        prompt,
        negative_prompt: "worst quality, low quality, blurry, deformed, ugly, bad anatomy, bad hands, missing fingers",
        model: "fal_flux_dev",
        width: 768,
        height: 1024,
        steps: 25,
        cfg: 7,
        sampler: "euler_ancestral",
        seed: -1,
        nsfw,
      });

      const jobId = res.job_id;
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await api.getJobStatus(session.access_token, jobId);
        if (status.status === "completed" && status.result_url) {
          setResult(resolveResultUrl(status.result_url) || status.result_url);
          toast.success("Generated!");
          return;
        }
        if (status.status === "failed") {
          toast.error("Generation failed");
          return;
        }
      }
      toast.error("Timeout");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [session, selected, nsfw]);

  const categories = nsfw ? [...TAG_CATEGORIES, ...NSFW_CATEGORIES] : TAG_CATEGORIES;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Tag Builder</h1>
            <p className="text-sm text-muted-foreground">No prompt needed. Just pick tags and generate.</p>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={nsfw}
              onChange={(e) => setNsfw(e.target.checked)}
              className="rounded"
            />
            <span className="text-white/50">18+</span>
          </label>
        </div>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center mt-6">
            <p className="text-muted-foreground mb-4">Sign in to generate</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Selected tags summary */}
            {selected.size > 0 && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/50">{selected.size} tags selected</span>
                  <button onClick={() => setSelected(new Set())} className="text-xs text-white/30 hover:text-white/60">
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selected).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                    >
                      {tag}
                      <XIcon className="size-3" />
                    </button>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-black/30 rounded text-xs font-mono text-white/40 break-all">
                  {buildPrompt()}
                </div>
              </div>
            )}

            {/* Tag categories */}
            {categories.map((cat) => (
              <div key={cat.id}>
                <h3 className="text-sm font-semibold text-white/70 mb-2">{cat.label}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {cat.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                        selected.has(tag)
                          ? "bg-purple-500 text-white"
                          : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/80"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={loading || selected.size === 0}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full text-base"
            >
              {loading ? (
                <><Loader2Icon className="size-5 mr-2 animate-spin" />Generating...</>
              ) : (
                <><SparklesIcon className="size-5 mr-2" />Generate from Tags (3 credits)</>
              )}
            </Button>

            {/* Result */}
            {result && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 space-y-4">
                <img src={result} alt="Generated" className="w-full max-w-lg mx-auto rounded-lg" />
                <div className="flex gap-3 justify-center">
                  <a href={result} download={`egaku-${Date.now()}.png`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="rounded-full">
                      <DownloadIcon className="size-4 mr-2" />Download
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      navigator.clipboard.writeText(buildPrompt());
                      toast.success("Prompt copied!");
                    }}
                  >
                    <CopyIcon className="size-4 mr-2" />Copy Prompt
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
