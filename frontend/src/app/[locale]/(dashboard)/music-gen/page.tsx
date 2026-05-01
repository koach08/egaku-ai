"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, Music2Icon, SparklesIcon } from "lucide-react";

const MODELS = [
  {
    id: "ace_step",
    name: "ACE-Step",
    desc: "Instrumental + vocal. Cheapest & versatile",
    maxDuration: 60,
    supportsLyrics: true,
  },
  {
    id: "cassetteai",
    name: "CassetteAI",
    desc: "Instrumental only. Ultra-fast (2 sec)",
    maxDuration: 180,
    supportsLyrics: false,
  },
  {
    id: "minimax_music",
    name: "MiniMax Music 2.0",
    desc: "Full songs with vocals & lyrics",
    maxDuration: 60,
    supportsLyrics: true,
  },
];

const GENRE_PRESETS = [
  { label: "Cinematic Epic", prompt: "epic cinematic orchestral soundtrack, dramatic strings, brass fanfare, building tension, film score" },
  { label: "Lo-Fi Chill", prompt: "lo-fi hip hop beat, mellow piano, vinyl crackle, relaxed jazzy chords, study music" },
  { label: "Electronic / EDM", prompt: "electronic dance music, pulsing synth bass, four-on-the-floor beat, euphoric buildup and drop" },
  { label: "Acoustic Folk", prompt: "warm acoustic guitar, gentle fingerpicking, folk melody, campfire atmosphere, heartfelt" },
  { label: "J-Pop / Anime", prompt: "upbeat Japanese pop song, catchy melody, bright synths, energetic drums, anime opening style" },
  { label: "Dark Ambient", prompt: "dark ambient drone, eerie atmosphere, deep reverb, tension, horror soundtrack" },
  { label: "Hip Hop Beat", prompt: "hip hop instrumental, trap hi-hats, 808 bass, crisp snare, modern rap beat" },
  { label: "Jazz Smooth", prompt: "smooth jazz, saxophone solo, walking bass, brush drums, warm piano chords, late night vibe" },
  { label: "Rock / Indie", prompt: "indie rock, distorted electric guitar, driving drums, bass groove, raw energy" },
  { label: "Classical Piano", prompt: "solo piano classical piece, expressive dynamics, romantic era style, Chopin-inspired" },
  { label: "R&B / Soul", prompt: "modern R&B, silky vocals, smooth synth pads, laid-back groove, neo-soul" },
  { label: "Synthwave / Retro", prompt: "synthwave, retro 80s synthesizers, pulsing arpeggios, neon-lit, Blade Runner atmosphere" },
];

export default function MusicGenPage() {
  const { session } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [duration, setDuration] = useState(30);
  const [model, setModel] = useState("ace_step");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedModel = MODELS.find((m) => m.id === model) || MODELS[0];

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !prompt.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const params: Record<string, unknown> = { prompt, duration, model };
      if (lyrics.trim() && selectedModel.supportsLyrics) {
        params.lyrics = lyrics;
      }
      const res = await api.generateMusic(session.access_token, params);
      if (res.result_url) {
        setResult(resolveResultUrl(res.result_url) || res.result_url);
      } else {
        setError("Generation failed. Try a different description or model.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [session, prompt, lyrics, duration, model, selectedModel]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">AI Music Generator</h1>
          <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
            NEW
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Describe the mood, genre, or vibe you want. AI creates original music in seconds. For videos, games, podcasts, social media, and more.
        </p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to generate music</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Model selection */}
            <div>
              <label className="block text-xs text-white/50 mb-3">AI Model</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setModel(m.id);
                      if (duration > m.maxDuration) setDuration(m.maxDuration);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      model === m.id
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/[0.06] hover:border-white/20"
                    }`}
                  >
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="text-[11px] text-white/40 mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Genre presets */}
            <div>
              <label className="block text-xs text-white/50 mb-3">Genre Presets</label>
              <div className="flex flex-wrap gap-2">
                {GENRE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setPrompt(p.prompt)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                      prompt === p.prompt
                        ? "bg-purple-500 text-white"
                        : "border border-white/[0.06] text-white/50 hover:text-white/80"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-xs text-white/50 mb-2">
                Describe the music you want
              </label>
              <Textarea
                placeholder="e.g., Upbeat electronic track with a catchy melody, building energy, perfect for a product launch video..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
            </div>

            {/* Lyrics (conditional) */}
            {selectedModel.supportsLyrics && (
              <div>
                <label className="block text-xs text-white/50 mb-2">
                  Lyrics (optional){" "}
                  <span className="text-white/30">
                    &mdash; add lyrics for vocal tracks
                  </span>
                </label>
                <Textarea
                  placeholder={"[Verse 1]\nWalking through the neon lights\nEverything feels so alive tonight\n\n[Chorus]\nWe are the dreamers..."}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
            )}

            {/* Duration */}
            <div>
              <label className="block text-xs text-white/50 mb-2">
                Duration: {duration}s
              </label>
              <Input
                type="range"
                min={5}
                max={selectedModel.maxDuration}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
              <div className="flex justify-between text-[10px] text-white/30 mt-1">
                <span>5s</span>
                <span>{selectedModel.maxDuration}s</span>
              </div>
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full h-12 text-base"
            >
              {loading ? (
                <>
                  <Loader2Icon className="size-5 mr-2 animate-spin" />
                  Generating music...
                </>
              ) : (
                <>
                  <SparklesIcon className="size-5 mr-2" />
                  Generate Music (5 credits)
                </>
              )}
            </Button>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {/* Result */}
            {result && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Music2Icon className="size-5 text-purple-400" />
                  <h2 className="text-sm font-medium">Your Music</h2>
                </div>
                <audio src={result} controls className="w-full" />
                <div className="flex gap-3">
                  <a
                    href={result}
                    download={`egaku-music-${Date.now()}.wav`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="rounded-full">
                      <DownloadIcon className="size-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </div>
                <p className="text-[11px] text-white/30">
                  Generated music is royalty-free for personal and commercial use.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
