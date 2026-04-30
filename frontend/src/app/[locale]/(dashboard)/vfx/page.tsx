"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, SparklesIcon, MessageSquareIcon } from "lucide-react";

const VFX_PRESETS = [
  {
    id: "fire",
    name: "Fire Burst",
    preview: "from-orange-600 to-red-700",
    prompt: "the subject dramatically bursts into bright orange flames, fire particles flying outward, intense heat distortion, sparks and embers, cinematic dramatic lighting, slow motion",
  },
  {
    id: "water",
    name: "Water Splash",
    preview: "from-cyan-600 to-blue-700",
    prompt: "massive water splash effect surrounding the subject, water droplets frozen in mid-air, crystal clear water, dramatic backlighting, slow motion water explosion, cinematic",
  },
  {
    id: "disintegrate",
    name: "Disintegrate",
    preview: "from-gray-500 to-gray-800",
    prompt: "the subject slowly disintegrates into thousands of tiny particles floating away in the wind, particle dispersion effect, ashes and dust, dramatic lighting, cinematic VFX",
  },
  {
    id: "lightning",
    name: "Lightning Strike",
    preview: "from-purple-600 to-blue-800",
    prompt: "dramatic lightning bolts striking around the subject, electrical arcs, bright blue-white energy, thunder storm atmosphere, rain, cinematic dramatic lighting",
  },
  {
    id: "freeze",
    name: "Ice Freeze",
    preview: "from-blue-300 to-cyan-600",
    prompt: "the subject freezing over with crystalline ice forming across the surface, frost particles, breath vapor, cold blue lighting, ice crystals spreading, cinematic winter effect",
  },
  {
    id: "bloom",
    name: "Flower Bloom",
    preview: "from-pink-400 to-rose-600",
    prompt: "beautiful flowers and cherry blossom petals blooming and swirling around the subject, soft pink and white petals floating, magical spring atmosphere, soft golden light, dreamy",
  },
  {
    id: "galaxy",
    name: "Galaxy Portal",
    preview: "from-indigo-600 to-violet-900",
    prompt: "a swirling galaxy portal opening behind the subject, stars and nebula colors, cosmic energy, purple and blue space vortex, dramatic sci-fi lighting, cinematic",
  },
  {
    id: "gold",
    name: "Gold Particles",
    preview: "from-yellow-500 to-amber-700",
    prompt: "golden glowing particles and sparkles swirling around the subject, luxury gold dust effect, warm golden light, magical atmosphere, cinematic bokeh, premium feel",
  },
  {
    id: "smoke",
    name: "Dramatic Smoke",
    preview: "from-gray-600 to-gray-900",
    prompt: "thick dramatic smoke and fog swirling around the subject, volumetric lighting, moody atmosphere, film noir style, backlit smoke tendrils, cinematic",
  },
  {
    id: "neon",
    name: "Neon Glow",
    preview: "from-pink-500 to-purple-600",
    prompt: "vibrant neon lights and glowing outlines appearing around the subject, cyberpunk neon effect, pink and blue neon, reflections on wet surface, night city atmosphere",
  },
  {
    id: "butterfly",
    name: "Butterflies",
    preview: "from-amber-400 to-orange-500",
    prompt: "dozens of colorful butterflies emerging and flying around the subject, magical transformation, soft natural lighting, enchanted forest atmosphere, dreamy and whimsical",
  },
  {
    id: "glitch",
    name: "Digital Glitch",
    preview: "from-green-500 to-teal-700",
    prompt: "digital glitch effect on the subject, RGB color split, scan lines, pixelation, matrix-style data corruption, cyberpunk digital distortion, VHS static noise",
  },
] as const;

const VIDEO_MODELS = [
  { id: "fal_wan26_i2v", name: "Wan 2.6 (Free)", credits: 12, badge: "Free" },
  { id: "fal_kling_i2v", name: "Kling v2", credits: 15, badge: "" },
  { id: "fal_kling25_i2v", name: "Kling 2.5 Pro", credits: 25, badge: "Best" },
];

export default function VfxEffectsPage() {
  const { session } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("fal_wan26_i2v");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
      setError("");
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !file || !selectedEffect) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // Upload image first to get a URL
      const reader = new FileReader();
      const imageB64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const effect = VFX_PRESETS.find((e) => e.id === selectedEffect);
      if (!effect) return;

      // Use the main video endpoint with image_url for fal.ai img2vid
      const res = await api.generateVideo(session.access_token, {
        image_url: imageB64,
        prompt: effect.prompt,
        model: selectedModel,
        duration: 5,
        resolution: "720p",
        seed: -1,
        nsfw: false,
      });

      if (res.result_url) {
        setResult(resolveResultUrl(res.result_url) || res.result_url);
      } else if (res.job_id) {
        // Poll for result (video generation takes time)
        for (let i = 0; i < 60; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          const status = await api.getJobStatus(session.access_token, res.job_id);
          if (status.status === "completed" && status.result_url) {
            setResult(resolveResultUrl(status.result_url) || status.result_url);
            break;
          }
          if (status.status === "failed") {
            setError("Effect generation failed. Try a different model or image.");
            break;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [session, file, selectedEffect, selectedModel]);

  const selectedCredits = VIDEO_MODELS.find((m) => m.id === selectedModel)?.credits || 12;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">VFX Effects</h1>
          <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Upload a photo, pick an effect, and watch it come to life as a video.
          <a href="/contact" className="text-white/50 hover:text-white/80 ml-2 inline-flex items-center gap-1">
            <MessageSquareIcon className="size-3" />
            Send feedback for bonus credits
          </a>
        </p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to use VFX Effects</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Upload Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-white/10 file:text-white/70 hover:file:bg-white/20"
              />
            </div>

            {preview && (
              <div className="rounded-xl overflow-hidden border border-white/[0.06] max-w-sm">
                <img src={preview} alt="Preview" className="w-full" />
              </div>
            )}

            {/* Effect Grid */}
            <div>
              <label className="block text-sm font-medium mb-3">Choose Effect</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {VFX_PRESETS.map((effect) => (
                  <button
                    key={effect.id}
                    onClick={() => setSelectedEffect(effect.id)}
                    className={`rounded-xl p-3 text-center transition-all ${
                      selectedEffect === effect.id
                        ? "ring-2 ring-white bg-white/10"
                        : "border border-white/[0.06] hover:border-white/20"
                    }`}
                  >
                    <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${effect.preview} mb-2`} />
                    <p className="text-[11px] font-medium">{effect.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-xs text-white/50 mb-2">Video Model</label>
              <div className="flex flex-wrap gap-2">
                {VIDEO_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`px-4 py-2 rounded-full text-xs transition-colors ${
                      selectedModel === m.id
                        ? "bg-white text-black"
                        : "border border-white/[0.06] text-white/50 hover:text-white/80"
                    }`}
                  >
                    {m.name} {m.badge && `(${m.badge})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate */}
            <Button
              onClick={handleGenerate}
              disabled={loading || !file || !selectedEffect}
              className="w-full bg-white text-black hover:bg-white/90 rounded-full"
            >
              {loading ? (
                <>
                  <Loader2Icon className="size-4 mr-2 animate-spin" />
                  Generating effect...
                </>
              ) : (
                <>
                  <SparklesIcon className="size-4 mr-2" />
                  Apply Effect ({selectedCredits} credits)
                </>
              )}
            </Button>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {/* Result */}
            {result && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium">Result</h2>
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <video src={result} controls autoPlay loop className="w-full" />
                </div>
                <a href={result} download="vfx-effect.mp4" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-full">
                    <DownloadIcon className="size-4 mr-2" />
                    Download
                  </Button>
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
