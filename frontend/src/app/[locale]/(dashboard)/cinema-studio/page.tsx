"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, ClapperboardIcon } from "lucide-react";

const GENRES = [
  { id: "general", name: "General" },
  { id: "action", name: "Action" },
  { id: "drama", name: "Drama" },
  { id: "horror", name: "Horror" },
  { id: "scifi", name: "Sci-Fi" },
  { id: "romance", name: "Romance" },
  { id: "documentary", name: "Documentary" },
  { id: "fantasy", name: "Fantasy" },
];

const CAMERA_STYLES = [
  { id: "auto", name: "Auto" },
  { id: "dolly", name: "Dolly (smooth track)" },
  { id: "crane", name: "Crane (sweeping)" },
  { id: "handheld", name: "Handheld (raw)" },
  { id: "drone", name: "Drone (aerial)" },
  { id: "steadicam", name: "Steadicam (fluid)" },
  { id: "static", name: "Static (tripod)" },
];

const VIDEO_MODELS = [
  { id: "fal_wan26_t2v", name: "Wan 2.6 (Free)", credits: 10 },
  { id: "fal_kling25_t2v", name: "Kling 2.5 Pro (Cinema)", credits: 25 },
  { id: "fal_veo3_t2v", name: "Veo 3 + Audio", credits: 40 },
  { id: "fal_sora2_t2v", name: "Sora 2 (20s)", credits: 50 },
];

export default function CinemaStudioPage() {
  const { session } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("general");
  const [camera, setCamera] = useState("auto");
  const [videoModel, setVideoModel] = useState("fal_kling25_t2v");
  const [duration, setDuration] = useState(8);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxDuration = VIDEO_MODELS.find((m) => m.id === videoModel)?.id.includes("sora2") ? 20 : 10;

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !prompt.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const genreMap: Record<string, string> = {
        general: "cinematic film quality",
        action: "action movie, fast-paced, explosions, dynamic camera",
        drama: "dramatic, emotional, intimate, soft lighting",
        horror: "horror film, dark atmosphere, tension, unsettling",
        scifi: "science fiction, futuristic, neon, advanced technology",
        romance: "romantic, warm tones, golden hour, soft focus",
        documentary: "documentary style, natural lighting, authentic",
        fantasy: "epic fantasy, magical, dramatic landscapes, ethereal",
      };
      const cameraMap: Record<string, string> = {
        auto: "",
        dolly: "smooth dolly tracking shot",
        crane: "sweeping crane shot",
        handheld: "handheld camera, raw, visceral",
        drone: "aerial drone shot",
        steadicam: "fluid steadicam movement",
        static: "static tripod shot, no camera movement",
      };

      const fullPrompt = `${prompt}, ${genreMap[genre] || ""}, ${cameraMap[camera] || ""}, cinematic aspect ratio, film grain, professional cinematography, 4K`.trim();

      const res = await api.generateVideo(session.access_token, {
        prompt: fullPrompt, model: videoModel, duration: Math.min(duration, maxDuration), seed: -1, nsfw: false,
      });

      if (res.result_url) {
        setResult(resolveResultUrl(res.result_url) || res.result_url);
      } else if (res.job_id) {
        for (let i = 0; i < 60; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          const status = await api.getJobStatus(session.access_token, res.job_id);
          if (status.status === "completed" && status.result_url) {
            setResult(resolveResultUrl(status.result_url) || status.result_url);
            break;
          }
          if (status.status === "failed") { setError("Generation failed."); break; }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }, [session, prompt, genre, camera, videoModel, duration, maxDuration]);

  const selectedCredits = VIDEO_MODELS.find((m) => m.id === videoModel)?.credits || 25;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Cinema Studio</h1>
          <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">What would you shoot with infinite budget? Describe your scene and get cinematic AI video.</p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to use Cinema Studio</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Input placeholder="Describe your scene (e.g. A samurai standing on a cliff at sunset, wind blowing through his hair)"
              value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/40 mb-2">Genre</label>
                <div className="flex flex-wrap gap-1.5">
                  {GENRES.map((g) => (
                    <button key={g.id} onClick={() => setGenre(g.id)}
                      className={`px-3 py-1 rounded-full text-[11px] transition-colors ${genre === g.id ? "bg-white text-black" : "border border-white/[0.06] text-white/50 hover:text-white/80"}`}>{g.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-2">Camera</label>
                <div className="flex flex-wrap gap-1.5">
                  {CAMERA_STYLES.map((c) => (
                    <button key={c.id} onClick={() => setCamera(c.id)}
                      className={`px-3 py-1 rounded-full text-[11px] transition-colors ${camera === c.id ? "bg-white text-black" : "border border-white/[0.06] text-white/50 hover:text-white/80"}`}>{c.name}</button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-2">Model</label>
              <div className="flex flex-wrap gap-2">
                {VIDEO_MODELS.map((m) => (
                  <button key={m.id} onClick={() => setVideoModel(m.id)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${videoModel === m.id ? "bg-white text-black" : "border border-white/[0.06] text-white/50 hover:text-white/80"}`}>{m.name}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-2">Duration: {Math.min(duration, maxDuration)}s</label>
              <Input type="range" min={4} max={maxDuration} step={1} value={Math.min(duration, maxDuration)}
                onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
            <Button onClick={handleGenerate} disabled={loading || !prompt.trim()}
              className="w-full bg-white text-black hover:bg-white/90 rounded-full">
              {loading ? <><Loader2Icon className="size-4 mr-2 animate-spin" />Directing...</> :
                <><ClapperboardIcon className="size-4 mr-2" />Generate ({selectedCredits} credits)</>}
            </Button>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {result && (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <video src={result} controls autoPlay className="w-full" />
                </div>
                <a href={result} download="cinema-studio.mp4" target="_blank" rel="noopener noreferrer">
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
