"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
  Loader2Icon,
  SparklesIcon,
  FilmIcon,
  Music2Icon,
  DownloadIcon,
  PlayIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ChevronRightIcon,
} from "lucide-react";

// ── Video models ──
const VIDEO_MODELS = [
  { id: "fal_ltx_t2v", name: "LTX 2.3 (Fast)", credits: 5 },
  { id: "fal_wan_t2v", name: "Wan 2.1", credits: 10 },
  { id: "fal_kling_t2v", name: "Kling v2", credits: 15 },
  { id: "fal_minimax_t2v", name: "Minimax Hailuo", credits: 15 },
  { id: "fal_kling25_t2v", name: "Kling 2.5 Pro (4K)", credits: 25 },
  { id: "fal_seedance2_t2v", name: "Seedance 2.0 (Audio)", credits: 30 },
  { id: "fal_veo3_t2v", name: "Veo 3 (Audio)", credits: 40 },
];

// ── Cinema styles ──
const STYLES = [
  { id: "cinematic", name: "Cinematic", suffix: ", shot on ARRI Alexa 35, cinematic lighting, shallow depth of field, 2.39:1 framing" },
  { id: "anime", name: "Anime", suffix: ", anime feature film quality, Makoto Shinkai style, detailed backgrounds, volumetric light" },
  { id: "documentary", name: "Documentary", suffix: ", documentary style, natural lighting, handheld camera, authentic feel" },
  { id: "music_video", name: "Music Video", suffix: ", music video style, high contrast, dynamic camera angles, stylish color grading" },
  { id: "horror", name: "Horror", suffix: ", horror film, dark atmosphere, underexposed, eerie shadows, tension" },
  { id: "scifi", name: "Sci-Fi", suffix: ", sci-fi film, futuristic, neon lighting, advanced technology, volumetric fog" },
  { id: "retro", name: "Retro / 70s", suffix: ", vintage 1970s film, warm color cast, film grain, halation, retro aesthetic" },
  { id: "none", name: "No Style", suffix: "" },
];

// ── Story templates ──
const STORY_TEMPLATES = [
  { label: "Product Launch", concept: "A sleek product reveal video: close-up of the product emerging from shadow into spotlight, then lifestyle shots of people using it, ending with the brand logo" },
  { label: "Travel Montage", concept: "A cinematic travel montage through Tokyo at night: neon-lit streets, ramen shops, temple visits at dawn, bullet train passing, cherry blossoms, ending at sunset from a rooftop" },
  { label: "Music Video", concept: "An atmospheric music video: a lone figure walking through rain-soaked city streets at night, reflections in puddles, neon signs, ending looking up at the sky as rain stops" },
  { label: "Short Film", concept: "A samurai stands alone on a misty battlefield at dawn. He draws his sword, cherry blossoms fall. A rival appears. They clash in slow motion. The samurai sheathes his sword and walks away" },
  { label: "Brand Story", concept: "A craftsman in a workshop: hands shaping wood, sparks from metalwork, close-up of focused eyes, the finished beautiful product revealed, customers smiling as they receive it" },
  { label: "Anime Opening", concept: "An anime opening sequence: a student running to school, dramatic sky shots, friends laughing, mysterious antagonist in shadows, epic battle montage, ending with the cast posing together" },
];

type MovieScene = {
  id: string;
  prompt: string;
  duration: number;
  status: "pending" | "generating_image" | "generating_video" | "done" | "failed";
  imageUrl?: string;
  videoUrl?: string;
  error?: string;
};

type MovieStep = "concept" | "scenes" | "generating" | "music" | "export";

export default function MovieMakerPage() {
  const { session, loading: authLoading } = useAuth();

  // Pipeline state
  const [step, setStep] = useState<MovieStep>("concept");
  const [concept, setConcept] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [videoModel, setVideoModel] = useState("fal_ltx_t2v");
  const [scenes, setScenes] = useState<MovieScene[]>([]);

  // Music
  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicLoading, setMusicLoading] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // Generation progress
  const [generatingIdx, setGeneratingIdx] = useState(-1);

  const selectedStyle = STYLES.find((s) => s.id === style) || STYLES[0];

  // ── Step 1: Break concept into scenes ──
  const breakIntoScenes = useCallback(() => {
    if (!concept.trim()) {
      toast.error("Enter a concept first");
      return;
    }

    // Split concept by sentences/phrases and create scenes
    const parts = concept
      .split(/[.。!！?？;；\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    // Limit to 3-8 scenes
    const sceneParts = parts.length <= 2
      ? [concept] // If too few parts, keep as one scene and let user edit
      : parts.slice(0, 8);

    const newScenes: MovieScene[] = sceneParts.map((prompt) => ({
      id: crypto.randomUUID(),
      prompt,
      duration: 5,
      status: "pending",
    }));

    // Ensure at least 3 scenes for a video feel
    while (newScenes.length < 3) {
      newScenes.push({
        id: crypto.randomUUID(),
        prompt: "",
        duration: 5,
        status: "pending",
      });
    }

    setScenes(newScenes);
    setStep("scenes");

    // Auto-suggest music prompt from concept
    setMusicPrompt(`background music for: ${concept.slice(0, 200)}`);
  }, [concept]);

  // ── Step 2: Generate all scenes ──
  const generateAllScenes = useCallback(async () => {
    if (!session?.access_token) return;

    const validScenes = scenes.filter((s) => s.prompt.trim());
    if (validScenes.length === 0) {
      toast.error("Add prompts to your scenes");
      return;
    }

    setStep("generating");

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (!scene.prompt.trim()) continue;

      setGeneratingIdx(i);

      // Update status
      setScenes((prev) =>
        prev.map((s) => (s.id === scene.id ? { ...s, status: "generating_video" } : s))
      );

      try {
        const fullPrompt = scene.prompt + selectedStyle.suffix;

        const res = await api.generateVideo(session.access_token, {
          prompt: fullPrompt,
          negative_prompt: "worst quality, low quality, blurry, deformed, text, watermark",
          model: videoModel,
          width: 512,
          height: 512,
          steps: 25,
          cfg: 7,
          sampler: "euler_ancestral",
          seed: -1,
          frame_count: Math.round(scene.duration * 8),
          fps: 8,
          nsfw: false,
        });

        // Poll for result
        const jobId = res.job_id;
        for (let poll = 0; poll < 120; poll++) {
          await new Promise((r) => setTimeout(r, 3000));
          const status = await api.getJobStatus(session.access_token, jobId);
          if (status.status === "completed" && status.result_url) {
            const url = resolveResultUrl(status.result_url) || status.result_url;
            setScenes((prev) =>
              prev.map((s) => (s.id === scene.id ? { ...s, status: "done", videoUrl: url } : s))
            );
            break;
          }
          if (status.status === "failed") {
            setScenes((prev) =>
              prev.map((s) => (s.id === scene.id ? { ...s, status: "failed", error: status.error || "Failed" } : s))
            );
            break;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed";
        setScenes((prev) =>
          prev.map((s) => (s.id === scene.id ? { ...s, status: "failed", error: msg } : s))
        );
      }
    }

    setGeneratingIdx(-1);
    setStep("music");
    toast.success("Scenes generated! Now add music.");
  }, [session, scenes, videoModel, selectedStyle]);

  // ── Step 3: Generate music ──
  const generateMusic = useCallback(async () => {
    if (!session?.access_token) return;
    setMusicLoading(true);
    try {
      const totalDuration = Math.min(
        scenes.filter((s) => s.status === "done").reduce((sum, s) => sum + s.duration, 0),
        60
      );
      const res = await api.generateMusic(session.access_token, {
        prompt: musicPrompt || `cinematic background music, ${concept.slice(0, 100)}`,
        duration: Math.max(totalDuration, 15),
        model: "ace_step",
      });
      if (res.result_url) {
        setMusicUrl(resolveResultUrl(res.result_url) || res.result_url);
        toast.success("Music generated!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Music generation failed");
    } finally {
      setMusicLoading(false);
    }
  }, [session, musicPrompt, concept, scenes]);

  // ── Step 4: Export final video ──
  const exportVideo = useCallback(async () => {
    const doneScenes = scenes.filter((s) => s.status === "done" && s.videoUrl);
    if (doneScenes.length === 0) {
      toast.error("No completed scenes");
      return;
    }

    setExporting(true);
    setStep("export");
    setExportProgress("Loading ffmpeg...");

    try {
      if (!ffmpegRef.current) {
        const ffmpeg = new FFmpeg();
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        ffmpegRef.current = ffmpeg;
      }

      const ffmpeg = ffmpegRef.current;

      // Download scene videos
      const fileList: string[] = [];
      for (let i = 0; i < doneScenes.length; i++) {
        setExportProgress(`Downloading scene ${i + 1}/${doneScenes.length}...`);
        const videoData = await fetchFile(doneScenes[i].videoUrl!);
        const inputName = `scene_${i}.mp4`;
        await ffmpeg.writeFile(inputName, videoData);
        fileList.push(inputName);
      }

      // Build concat
      const concatContent = fileList.map((f) => `file '${f}'`).join("\n");
      await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(concatContent));

      // Download music if available
      let hasMusic = false;
      if (musicUrl) {
        setExportProgress("Downloading music...");
        const musicData = await fetchFile(musicUrl);
        await ffmpeg.writeFile("music.mp3", musicData);
        hasMusic = true;
      }

      setExportProgress("Stitching final video...");

      if (hasMusic) {
        await ffmpeg.exec([
          "-f", "concat", "-safe", "0", "-i", "concat.txt",
          "-i", "music.mp3",
          "-c:v", "copy",
          "-map", "0:v:0",
          "-map", "1:a:0",
          "-shortest",
          "-y", "output.mp4",
        ]);
      } else {
        await ffmpeg.exec([
          "-f", "concat", "-safe", "0", "-i", "concat.txt",
          "-c:v", "copy",
          "-y", "output.mp4",
        ]);
      }

      const outputData = await ffmpeg.readFile("output.mp4");
      const bytes = outputData instanceof Uint8Array ? outputData : new TextEncoder().encode(outputData as string);
      const blob = new Blob([new Uint8Array(bytes)], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      setExportProgress("");
      toast.success("Movie exported!");

      // Cleanup
      for (const f of fileList) {
        try { await ffmpeg.deleteFile(f); } catch {}
      }
      try { await ffmpeg.deleteFile("concat.txt"); } catch {}
      try { await ffmpeg.deleteFile("music.mp3"); } catch {}
      try { await ffmpeg.deleteFile("output.mp4"); } catch {}
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
      setExportProgress("");
    } finally {
      setExporting(false);
    }
  }, [scenes, musicUrl]);

  // ── Scene helpers ──
  const updateScene = (id: string, updates: Partial<MovieScene>) => {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const addScene = () => {
    setScenes((prev) => [...prev, {
      id: crypto.randomUUID(),
      prompt: "",
      duration: 5,
      status: "pending",
    }]);
  };

  const removeScene = (id: string) => {
    if (scenes.length <= 1) return;
    setScenes((prev) => prev.filter((s) => s.id !== id));
  };

  const doneCount = scenes.filter((s) => s.status === "done").length;
  const totalCredits = scenes.filter((s) => s.prompt.trim()).length * (VIDEO_MODELS.find((m) => m.id === videoModel)?.credits || 5);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">AI Movie Maker</h1>
          <span className="text-[10px] font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 px-2 py-0.5 rounded-full">
            NEW
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          One concept, one click. AI breaks your idea into scenes, generates video for each, adds music, and exports a finished movie.
        </p>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8 text-xs">
          {(["concept", "scenes", "generating", "music", "export"] as MovieStep[]).map((s, i) => {
            const labels = ["Concept", "Scenes", "Generate", "Music", "Export"];
            const isActive = s === step;
            const isDone = ["concept", "scenes", "generating", "music", "export"].indexOf(step) > i;
            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <ChevronRightIcon className="size-3 text-white/20" />}
                <span className={`px-3 py-1 rounded-full ${isActive ? "bg-purple-500 text-white" : isDone ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/30"}`}>
                  {labels[i]}
                </span>
              </div>
            );
          })}
        </div>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to create AI movies</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Step 1: Concept ── */}
            {step === "concept" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs text-white/50 mb-3">Story Templates</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STORY_TEMPLATES.map((t) => (
                      <button
                        key={t.label}
                        onClick={() => setConcept(t.concept)}
                        className={`p-3 rounded-xl border text-left transition-all text-xs ${
                          concept === t.concept
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-white/[0.06] hover:border-white/20"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-2">
                    Your Movie Concept
                  </label>
                  <Textarea
                    placeholder="Describe your movie idea. Each sentence becomes a scene. Example: A samurai stands alone on a misty battlefield at dawn. He draws his sword. Cherry blossoms fall around him..."
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    rows={5}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Visual Style</label>
                    <Select value={style} onValueChange={(v) => v && setStyle(v)}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STYLES.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Video Model</label>
                    <Select value={videoModel} onValueChange={(v) => v && setVideoModel(v)}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VIDEO_MODELS.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} ({m.credits} cr/scene)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={breakIntoScenes}
                  disabled={!concept.trim()}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full text-base"
                >
                  <SparklesIcon className="size-5 mr-2" />
                  Break into Scenes
                </Button>
              </div>
            )}

            {/* ── Step 2: Edit Scenes ── */}
            {step === "scenes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{scenes.length} Scenes</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={addScene} className="rounded-full text-xs">
                      + Add Scene
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setStep("concept")} className="rounded-full text-xs">
                      Back
                    </Button>
                  </div>
                </div>

                {scenes.map((scene, i) => (
                  <div key={scene.id} className="rounded-xl border border-white/[0.06] p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">Scene {i + 1}</span>
                      <button onClick={() => removeScene(scene.id)} className="text-xs text-red-400 hover:text-red-300">
                        Remove
                      </button>
                    </div>
                    <Textarea
                      value={scene.prompt}
                      onChange={(e) => updateScene(scene.id, { prompt: e.target.value })}
                      placeholder="Describe what happens in this scene..."
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex items-center gap-4">
                      <label className="text-xs text-white/40">Duration: {scene.duration}s</label>
                      <Input
                        type="range"
                        min={3}
                        max={10}
                        value={scene.duration}
                        onChange={(e) => updateScene(scene.id, { duration: Number(e.target.value) })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}

                <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-4 text-sm">
                  <p className="text-white/60">
                    Estimated cost: <span className="text-white font-medium">{totalCredits} credits</span> for {scenes.filter((s) => s.prompt.trim()).length} scenes + 5 credits for AI music
                  </p>
                </div>

                <Button
                  onClick={generateAllScenes}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full text-base"
                >
                  <FilmIcon className="size-5 mr-2" />
                  Generate All Scenes ({totalCredits} credits)
                </Button>
              </div>
            )}

            {/* ── Step 3: Generating ── */}
            {step === "generating" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Generating Scenes...</h2>
                <p className="text-sm text-white/50">This may take a few minutes depending on the model.</p>

                {scenes.map((scene, i) => (
                  <div key={scene.id} className={`rounded-xl border p-4 flex items-center gap-4 ${
                    scene.status === "done" ? "border-green-500/30 bg-green-500/5" :
                    scene.status === "failed" ? "border-red-500/30 bg-red-500/5" :
                    scene.status === "generating_video" ? "border-purple-500/30 bg-purple-500/5" :
                    "border-white/[0.06]"
                  }`}>
                    <div className="flex-shrink-0">
                      {scene.status === "done" && <CheckCircle2Icon className="size-5 text-green-400" />}
                      {scene.status === "failed" && <XCircleIcon className="size-5 text-red-400" />}
                      {scene.status === "generating_video" && <Loader2Icon className="size-5 text-purple-400 animate-spin" />}
                      {scene.status === "pending" && <div className="size-5 rounded-full border border-white/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/40">Scene {i + 1}</div>
                      <div className="text-sm truncate">{scene.prompt}</div>
                      {scene.error && <div className="text-xs text-red-400 mt-1">{scene.error}</div>}
                    </div>
                    {scene.videoUrl && (
                      <video src={scene.videoUrl} className="w-20 h-14 rounded object-cover" muted />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Step 4: Music ── */}
            {step === "music" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Add Music</h2>

                {/* Scene preview */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {scenes.filter((s) => s.videoUrl).map((scene, i) => (
                    <div key={scene.id} className="relative rounded-lg overflow-hidden">
                      <video src={scene.videoUrl} className="w-full aspect-video object-cover" muted loop
                        onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                        onMouseLeave={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                      />
                      <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 px-1.5 py-0.5 rounded">
                        Scene {i + 1}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-2">
                    Describe the music you want (or leave auto)
                  </label>
                  <Textarea
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    placeholder="e.g., Epic cinematic orchestral soundtrack with building tension..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={generateMusic}
                    disabled={musicLoading}
                    className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full"
                  >
                    {musicLoading ? (
                      <><Loader2Icon className="size-5 mr-2 animate-spin" />Generating music...</>
                    ) : (
                      <><Music2Icon className="size-5 mr-2" />Generate AI Music (5 credits)</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStep("export")}
                    className="rounded-full"
                  >
                    Skip
                  </Button>
                </div>

                {musicUrl && (
                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Music2Icon className="size-4 text-purple-400" />
                      <span className="text-sm font-medium">Generated Music</span>
                    </div>
                    <audio src={musicUrl} controls className="w-full" />
                    <Button
                      onClick={exportVideo}
                      className="w-full h-12 bg-green-600 hover:bg-green-500 text-white rounded-full text-base"
                    >
                      <DownloadIcon className="size-5 mr-2" />
                      Export Final Movie
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 5: Export ── */}
            {step === "export" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">
                  {exporting ? "Exporting..." : exportUrl ? "Your Movie is Ready" : "Export"}
                </h2>

                {exporting && (
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <Loader2Icon className="size-5 animate-spin text-purple-400" />
                    {exportProgress}
                  </div>
                )}

                {!exporting && !exportUrl && (
                  <Button
                    onClick={exportVideo}
                    className="w-full h-12 bg-green-600 hover:bg-green-500 text-white rounded-full text-base"
                  >
                    <DownloadIcon className="size-5 mr-2" />
                    Export Final Movie {musicUrl ? "(with music)" : "(no music)"}
                  </Button>
                )}

                {exportUrl && (
                  <div className="space-y-4">
                    <video src={exportUrl} controls className="w-full rounded-xl" />
                    <a href={exportUrl} download={`egaku-movie-${Date.now()}.mp4`}>
                      <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-base">
                        <DownloadIcon className="size-5 mr-2" />
                        Download Movie
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep("concept");
                        setScenes([]);
                        setConcept("");
                        setMusicUrl(null);
                        setExportUrl(null);
                      }}
                      className="w-full rounded-full"
                    >
                      Make Another Movie
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
