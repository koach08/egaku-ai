"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, Volume2Icon } from "lucide-react";

const PRESETS = [
  { label: "Thunder Storm", prompt: "dramatic thunder crack with heavy rain and distant rumbling" },
  { label: "Sword Clash", prompt: "metal sword clash with sparks, epic battle sound effect" },
  { label: "Sci-Fi Laser", prompt: "futuristic sci-fi laser beam firing, electronic zap" },
  { label: "Ocean Waves", prompt: "calm ocean waves gently breaking on sandy beach, ambient" },
  { label: "Explosion", prompt: "massive cinematic explosion with debris and shockwave" },
  { label: "Footsteps", prompt: "footsteps walking on wooden floor, slow pace, indoor" },
  { label: "Horror Ambience", prompt: "creepy horror ambient sound, eerie whispers, distant screams" },
  { label: "Car Engine", prompt: "sports car engine revving, powerful V8, accelerating" },
  { label: "Fire Crackling", prompt: "campfire crackling and popping, warm cozy atmosphere" },
  { label: "Rain on Window", prompt: "gentle rain tapping on window glass, indoor ambient" },
  { label: "Bird Song", prompt: "morning forest birds singing, chirping, peaceful nature" },
  { label: "Crowd Cheering", prompt: "large crowd cheering and applauding in a stadium" },
];

export default function SoundEffectsPage() {
  const { session } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(5);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !prompt.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await api.soundEffect(session.access_token, { prompt, duration });
      if (res.result_url) setResult(resolveResultUrl(res.result_url) || res.result_url);
      else setError("Generation failed. Try a different description.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }, [session, prompt, duration]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">AI Sound Effects</h1>
          <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Describe a sound and AI generates it. For videos, games, podcasts, and more.</p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to generate sound effects</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-xs text-white/50 mb-3">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button key={p.label} onClick={() => setPrompt(p.prompt)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                      prompt === p.prompt ? "bg-white text-black" : "border border-white/[0.06] text-white/50 hover:text-white/80"
                    }`}>{p.label}</button>
                ))}
              </div>
            </div>
            <Input placeholder="Describe the sound you want..." value={prompt}
              onChange={(e) => setPrompt(e.target.value)} />
            <div>
              <label className="block text-xs text-white/50 mb-2">Duration: {duration}s</label>
              <Input type="range" min={1} max={15} step={1} value={duration}
                onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
            <Button onClick={handleGenerate} disabled={loading || !prompt.trim()}
              className="w-full bg-white text-black hover:bg-white/90 rounded-full">
              {loading ? <><Loader2Icon className="size-4 mr-2 animate-spin" />Generating...</> :
                <><Volume2Icon className="size-4 mr-2" />Generate Sound (3 credits)</>}
            </Button>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {result && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium">Result</h2>
                <audio src={result} controls className="w-full" />
                <a href={result} download="sound-effect.wav" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-full"><DownloadIcon className="size-4 mr-2" />Download</Button>
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
