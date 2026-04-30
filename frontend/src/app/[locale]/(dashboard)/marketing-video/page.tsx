"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, MegaphoneIcon } from "lucide-react";

const TEMPLATES = [
  {
    id: "product_showcase",
    name: "Product Showcase",
    description: "30-second product reveal with cinematic camera movement",
    scenes: [
      { prompt: "dramatic slow reveal of [PRODUCT] on a minimalist surface, dark background, volumetric lighting, close-up product photography, cinematic", duration: 5 },
      { prompt: "[PRODUCT] rotating slowly on a pedestal, studio lighting, commercial quality, detailed texture visible, cinematic", duration: 5 },
      { prompt: "lifestyle shot of [PRODUCT] being used in a modern setting, natural lighting, commercial photography style, cinematic", duration: 5 },
    ],
  },
  {
    id: "social_ad",
    name: "Social Media Ad",
    description: "Attention-grabbing 15-second vertical video for TikTok/Reels",
    scenes: [
      { prompt: "eye-catching visual of [PRODUCT], vibrant colors, dynamic camera zoom-in, social media style, vertical format, energetic", duration: 5 },
      { prompt: "[PRODUCT] in action, close-up detail shots, fast-paced, trendy, social media aesthetic, vertical", duration: 5 },
      { prompt: "[PRODUCT] with text overlay space, clean composition, call-to-action ready, social media ad style, vertical", duration: 5 },
    ],
  },
  {
    id: "brand_intro",
    name: "Brand Introduction",
    description: "Cinematic brand story opener",
    scenes: [
      { prompt: "sweeping cinematic establishing shot of a beautiful location related to [BRAND], golden hour, drone aerial view, 4K cinematic", duration: 5 },
      { prompt: "close-up of hands crafting or working on [PRODUCT], artisan quality, warm natural lighting, documentary style, cinematic", duration: 5 },
      { prompt: "final hero shot of [PRODUCT] or [BRAND] logo reveal, dramatic lighting, premium feel, cinematic", duration: 5 },
    ],
  },
  {
    id: "before_after",
    name: "Before & After",
    description: "Transformation reveal for services and products",
    scenes: [
      { prompt: "the 'before' state: [BEFORE_DESC], slightly desaturated, plain lighting, documentary style", duration: 5 },
      { prompt: "transition moment: visual transformation happening, particles, light effects, magical change, cinematic", duration: 5 },
      { prompt: "the 'after' state: [AFTER_DESC], vibrant colors, beautiful lighting, impressive result, cinematic", duration: 5 },
    ],
  },
  {
    id: "testimonial",
    name: "Testimonial/UGC Style",
    description: "Authentic user-generated content style for trust",
    scenes: [
      { prompt: "person looking directly at camera with genuine smile, casual setting, natural lighting, iPhone quality, authentic UGC style", duration: 5 },
      { prompt: "close-up of hands using [PRODUCT], real-life setting, casual, authentic, not staged, UGC style", duration: 5 },
      { prompt: "person showing the result or product to camera, excited expression, natural reaction, UGC selfie style", duration: 5 },
    ],
  },
];

export default function MarketingVideoPage() {
  const { session } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [customDetails, setCustomDetails] = useState("");
  const [videoModel, setVideoModel] = useState("fal_wan26_t2v");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const template = TEMPLATES.find((t) => t.id === selectedTemplate);

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !template || !productName.trim()) return;
    setLoading(true); setError(""); setResults([]);

    try {
      for (const scene of template.scenes) {
        const prompt = scene.prompt
          .replace(/\[PRODUCT\]/g, productName)
          .replace(/\[BRAND\]/g, productName)
          .replace(/\[BEFORE_DESC\]/g, customDetails || "plain, unimpressive state")
          .replace(/\[AFTER_DESC\]/g, customDetails || "stunning, transformed result");

        const res = await api.generateVideo(session.access_token, {
          prompt, model: videoModel, duration: scene.duration, seed: -1, nsfw: false,
        });

        if (res.result_url) {
          setResults((prev) => [...prev, resolveResultUrl(res.result_url) || res.result_url]);
        } else if (res.job_id) {
          for (let i = 0; i < 60; i++) {
            await new Promise((r) => setTimeout(r, 5000));
            const status = await api.getJobStatus(session.access_token, res.job_id);
            if (status.status === "completed" && status.result_url) {
              setResults((prev) => [...prev, resolveResultUrl(status.result_url) || status.result_url]);
              break;
            }
            if (status.status === "failed") break;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }, [session, template, productName, customDetails, videoModel]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Marketing Video Studio</h1>
          <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Pick a template, enter your product name, get a multi-scene marketing video.</p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to create marketing videos</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Choose Template</label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                    className={`text-left rounded-xl p-4 transition-all ${
                      selectedTemplate === t.id ? "ring-2 ring-white bg-white/10" : "border border-white/[0.06] hover:border-white/20"
                    }`}>
                    <h3 className="text-sm font-semibold mb-1">{t.name}</h3>
                    <p className="text-xs text-white/40">{t.description}</p>
                    <p className="text-[10px] text-white/20 mt-2">{t.scenes.length} scenes</p>
                  </button>
                ))}
              </div>
            </div>

            {template && (
              <>
                <Input placeholder="Product or brand name (e.g. EGAKU AI, Nike Air Max, my coffee brand)"
                  value={productName} onChange={(e) => setProductName(e.target.value)} />
                <Textarea placeholder="Additional details (optional): what your product does, key features, target audience..."
                  value={customDetails} onChange={(e) => setCustomDetails(e.target.value)} rows={2} />
                <div>
                  <label className="block text-xs text-white/50 mb-2">Video Model</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "fal_wan26_t2v", name: "Wan 2.6 (Free)", credits: 10 },
                      { id: "fal_kling_t2v", name: "Kling v2 (HD)", credits: 15 },
                      { id: "fal_grok_t2v", name: "Grok + Audio", credits: 30 },
                    ].map((m) => (
                      <button key={m.id} onClick={() => setVideoModel(m.id)}
                        className={`px-4 py-2 rounded-full text-xs transition-colors ${
                          videoModel === m.id ? "bg-white text-black" : "border border-white/[0.06] text-white/50 hover:text-white/80"
                        }`}>{m.name}</button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleGenerate} disabled={loading || !productName.trim()}
                  className="w-full bg-white text-black hover:bg-white/90 rounded-full">
                  {loading ? <><Loader2Icon className="size-4 mr-2 animate-spin" />Generating {template.scenes.length} scenes...</> :
                    <><MegaphoneIcon className="size-4 mr-2" />Create Marketing Video ({template.scenes.length} clips)</>}
                </Button>
              </>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            {results.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium">Generated Clips ({results.length}/{template?.scenes.length || 3})</h2>
                <div className="grid gap-3">
                  {results.map((url, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-white/[0.06]">
                      <video src={url} controls className="w-full" />
                      <div className="p-2 flex items-center justify-between">
                        <span className="text-xs text-white/50">Scene {i + 1}</span>
                        <a href={url} download={`scene-${i + 1}.mp4`} target="_blank" rel="noopener noreferrer">
                          <DownloadIcon className="size-3 text-white/30 hover:text-white/70" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
