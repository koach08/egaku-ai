"use client";

import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, MusicIcon, UploadIcon, SparklesIcon } from "lucide-react";

const STYLES = [
  { id: "cinematic", name: "Cinematic", prompt: "cinematic music video, dramatic camera movements, film grain, anamorphic lens flare" },
  { id: "anime", name: "Anime", prompt: "anime music video style, vibrant colors, cel shading, dynamic action sequences" },
  { id: "retro", name: "Retro / Synthwave", prompt: "80s retro synthwave aesthetic, neon grids, sunset gradients, VHS glitch effects" },
  { id: "abstract", name: "Abstract / Trippy", prompt: "abstract psychedelic visuals, morphing shapes, kaleidoscope patterns, vibrant flowing colors" },
  { id: "nature", name: "Nature / Zen", prompt: "serene nature footage, flowing water, cherry blossoms, slow motion, peaceful landscape" },
  { id: "urban", name: "Urban / Street", prompt: "urban street music video, city nightlife, neon signs, crowds, handheld camera, gritty" },
  { id: "fantasy", name: "Fantasy / Epic", prompt: "epic fantasy music video, dragons, castles, magical particles, dramatic sky, orchestral feel" },
  { id: "minimal", name: "Minimalist", prompt: "minimalist music video, single subject on clean background, simple elegant movements, studio lighting" },
] as const;

const VIDEO_MODELS = [
  { id: "fal_wan26_t2v", name: "Wan 2.6 (Free)", credits: 10 },
  { id: "fal_kling_t2v", name: "Kling v2 (HD)", credits: 15 },
  { id: "fal_grok_t2v", name: "Grok + Audio", credits: 30 },
  { id: "fal_veo3_t2v", name: "Veo 3 + Audio", credits: 40 },
];

const AI_SUGGESTIONS = [
  "A lone dancer performing in a rain-soaked city street at night, neon reflections on the wet ground, cinematic slow motion",
  "Abstract liquid metal morphing in sync with the beat, chrome reflections, dark background, hypnotic visuals",
  "A journey through different landscapes: ocean, desert, forest, mountains — each transition on the beat",
  "Anime character running through a futuristic city, leaping between buildings, dynamic camera angles",
  "Close-up portraits of diverse faces showing raw emotion, dramatic studio lighting, black and white with color accents",
  "Timelapse of flowers blooming and wilting, seasons changing, life cycle, poetic and beautiful",
];

export default function MusicVideoPage() {
  const { session } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(15);
  const [style, setStyle] = useState("cinematic");
  const [description, setDescription] = useState("");
  const [character, setCharacter] = useState("");
  const [videoModel, setVideoModel] = useState("fal_wan26_t2v");
  const [clips, setClips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const handleAudioUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && (f.type.includes("audio") || f.name.endsWith(".mp3") || f.name.endsWith(".wav"))) {
      setAudioFile(f);
      const url = URL.createObjectURL(f);
      setAudioUrl(url);
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setAudioDuration(Math.floor(audio.duration));
        setTrimEnd(Math.min(15, Math.floor(audio.duration)));
      };
    }
  }, []);

  const handleAiSuggest = useCallback(() => {
    const suggestion = AI_SUGGESTIONS[Math.floor(Math.random() * AI_SUGGESTIONS.length)];
    setDescription(suggestion);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true); setError(""); setClips([]);

    try {
      const selectedStyle = STYLES.find((s) => s.id === style);
      const clipDuration = 5;
      const totalDuration = trimEnd - trimStart;
      const numClips = Math.max(1, Math.ceil(totalDuration / clipDuration));

      const sceneVariations = [
        "wide establishing shot",
        "close-up detail shot",
        "dynamic tracking shot",
        "slow motion sequence",
        "aerial overhead view",
        "silhouette backlit shot",
      ];

      for (let i = 0; i < numClips; i++) {
        setProgress(`Generating clip ${i + 1} of ${numClips}...`);
        const variation = sceneVariations[i % sceneVariations.length];
        const charPart = character ? `${character}, ` : "";
        const prompt = `${charPart}${description || "dynamic music video visuals"}, ${variation}, ${selectedStyle?.prompt || ""}, beat-synced energy, music video quality`;

        const res = await api.generateVideo(session.access_token, {
          prompt, model: videoModel, duration: clipDuration, seed: -1, nsfw: false,
        });

        if (res.result_url) {
          setClips((prev) => [...prev, resolveResultUrl(res.result_url) || res.result_url]);
        } else if (res.job_id) {
          for (let j = 0; j < 60; j++) {
            await new Promise((r) => setTimeout(r, 5000));
            const status = await api.getJobStatus(session.access_token, res.job_id);
            if (status.status === "completed" && status.result_url) {
              setClips((prev) => [...prev, resolveResultUrl(status.result_url) || status.result_url]);
              break;
            }
            if (status.status === "failed") {
              setError(`Clip ${i + 1} failed. Continuing...`);
              break;
            }
          }
        }
      }
      setProgress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); setProgress(""); }
  }, [session, style, description, character, videoModel, trimStart, trimEnd]);

  const selectedModelCredits = VIDEO_MODELS.find((m) => m.id === videoModel)?.credits || 10;
  const totalDuration = trimEnd - trimStart;
  const numClips = Math.max(1, Math.ceil(totalDuration / 5));
  const totalCredits = numClips * selectedModelCredits;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Music Video</h1>
          <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Upload a song, describe your vision, get a beat-synced music video in minutes.</p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to create music videos</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 1: Upload Song */}
            <div className="rounded-xl border border-white/[0.06] p-5 space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span className="size-6 rounded-full bg-white/10 flex items-center justify-center text-xs">1</span>
                Upload Song
              </h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm cursor-pointer hover:bg-white/20 transition-colors">
                  <UploadIcon className="size-4" />
                  {audioFile ? audioFile.name : "Choose MP3 or WAV"}
                  <input type="file" accept="audio/*,.mp3,.wav" onChange={handleAudioUpload} className="hidden" />
                </label>
              </div>
              {audioUrl && (
                <>
                  <audio ref={audioRef} src={audioUrl} controls className="w-full" />
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-white/40">Start: {trimStart}s</label>
                      <Input type="range" min={0} max={Math.max(0, audioDuration - 5)} value={trimStart}
                        onChange={(e) => { const v = Number(e.target.value); setTrimStart(v); setTrimEnd(Math.max(v + 5, trimEnd)); }} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-white/40">End: {trimEnd}s</label>
                      <Input type="range" min={trimStart + 5} max={Math.min(audioDuration, trimStart + 30)} value={trimEnd}
                        onChange={(e) => setTrimEnd(Number(e.target.value))} />
                    </div>
                    <span className="text-xs text-white/30">{totalDuration}s selected</span>
                  </div>
                </>
              )}
            </div>

            {/* Step 2: Describe Vision */}
            <div className="rounded-xl border border-white/[0.06] p-5 space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span className="size-6 rounded-full bg-white/10 flex items-center justify-center text-xs">2</span>
                Describe Your Vision
              </h2>
              <Input placeholder="Character (optional): e.g. a young woman with red hair, a robot, anime boy"
                value={character} onChange={(e) => setCharacter(e.target.value)} />
              <div className="flex gap-2">
                <Textarea placeholder="Creative brief: describe the mood, scenes, and visuals you want..."
                  value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="flex-1" />
                <Button variant="outline" size="sm" onClick={handleAiSuggest} className="self-start rounded-full whitespace-nowrap">
                  <SparklesIcon className="size-3 mr-1" />AI Suggest
                </Button>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-2">Style</label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button key={s.id} onClick={() => setStyle(s.id)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                        style === s.id ? "bg-white text-black" : "border border-white/[0.06] text-white/50 hover:text-white/80"
                      }`}>{s.name}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3: Generate */}
            <div className="rounded-xl border border-white/[0.06] p-5 space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span className="size-6 rounded-full bg-white/10 flex items-center justify-center text-xs">3</span>
                Generate
              </h2>
              <div>
                <label className="block text-xs text-white/40 mb-2">Video Model</label>
                <div className="flex flex-wrap gap-2">
                  {VIDEO_MODELS.map((m) => (
                    <button key={m.id} onClick={() => setVideoModel(m.id)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                        videoModel === m.id ? "bg-white text-black" : "border border-white/[0.06] text-white/50 hover:text-white/80"
                      }`}>{m.name}</button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-white/30">{numClips} clips x {selectedModelCredits} credits = {totalCredits} credits total</p>
              <Button onClick={handleGenerate} disabled={loading}
                className="w-full bg-white text-black hover:bg-white/90 rounded-full">
                {loading ? <><Loader2Icon className="size-4 mr-2 animate-spin" />{progress || "Generating..."}</> :
                  <><MusicIcon className="size-4 mr-2" />Create Music Video ({totalCredits} credits)</>}
              </Button>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {/* Results */}
            {clips.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium">Generated Clips ({clips.length}/{numClips})</h2>
                <p className="text-xs text-white/40">Download clips and combine with your audio in CapCut, DaVinci Resolve, or any video editor. Full in-browser merging coming soon.</p>
                <div className="grid gap-3">
                  {clips.map((url, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-white/[0.06]">
                      <video src={url} controls className="w-full" />
                      <div className="p-2 flex items-center justify-between">
                        <span className="text-xs text-white/50">Clip {i + 1}</span>
                        <a href={url} download={`music-video-clip-${i + 1}.mp4`} target="_blank" rel="noopener noreferrer">
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
