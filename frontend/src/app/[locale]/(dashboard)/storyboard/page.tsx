"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import Link from "next/link";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// ── Cinema Camera Presets (shared with generate page) ──
const CINEMA_PRESETS = [
  { id: "none", name: "None", suffix: "" },
  { id: "blockbuster", name: "Cinematic Blockbuster", suffix: ", shot on ARRI Alexa 35, Cooke S7/i 50mm T2.0, shallow depth of field, anamorphic lens flare, 2.39:1 cinematic framing" },
  { id: "indie_a24", name: "Indie / A24", suffix: ", shot on ARRI AMIRA, Zeiss Super Speed 35mm T1.3, natural lighting, 16mm film grain, muted desaturated palette, handheld camera" },
  { id: "vintage_70s", name: "Vintage 70s", suffix: ", shot on Panavision Panaflex, anamorphic Panavision C-Series lenses, heavy halation, warm color cast, film grain" },
  { id: "music_video", name: "Music Video", suffix: ", shot on RED V-Raptor 8K, Sigma Cine 85mm T1.5, extreme shallow DOF, high contrast, teal and orange grade, slow motion" },
  { id: "horror", name: "Horror", suffix: ", shot on RED Monstro 8K, Leica Summilux-C 29mm T1.4, dutch angle, underexposed, desaturated, green-tinted shadows" },
  { id: "wes_anderson", name: "Wes Anderson", suffix: ", shot on ARRI Alexa Mini, Zeiss Master Prime 40mm T1.3, symmetrical composition, pastel color palette, flat lighting" },
  { id: "neon_noir", name: "Neon Noir", suffix: ", shot on Blackmagic URSA Mini Pro 12K, Sigma Art 35mm f/1.4, neon reflections on wet pavement, high contrast, cyan and magenta grade" },
  { id: "anime_cinema", name: "Anime Cinematic", suffix: ", anime feature film quality, Makoto Shinkai style lighting, detailed backgrounds, volumetric light rays, 2.39:1 cinematic letterbox" },
];

const VIDEO_MODELS = [
  { id: "fal_ltx_t2v", name: "LTX 2.3", credits: 5 },
  { id: "fal_wan_t2v", name: "Wan 2.1", credits: 10 },
  { id: "fal_kling_t2v", name: "Kling v2", credits: 15 },
  { id: "fal_minimax_t2v", name: "Minimax Hailuo", credits: 15 },
  { id: "fal_kling25_t2v", name: "Kling 2.5 Pro", credits: 25 },
  { id: "fal_seedance2_t2v", name: "Seedance 2.0 (Audio)", credits: 30 },
  { id: "fal_veo3_t2v", name: "Veo 3 (Google)", credits: 40 },
];

const COLOR_GRADES = [
  { id: "none", name: "None", filter: "" },
  { id: "teal_orange", name: "Teal & Orange", filter: "contrast(1.15) saturate(1.3) hue-rotate(-8deg)" },
  { id: "vintage_warm", name: "Vintage Warm", filter: "sepia(0.25) contrast(1.1) brightness(1.05) saturate(0.9)" },
  { id: "noir", name: "Film Noir", filter: "grayscale(1) contrast(1.4) brightness(0.9)" },
  { id: "cold_blue", name: "Cold Blue", filter: "saturate(0.8) brightness(1.05) hue-rotate(15deg) contrast(1.05)" },
  { id: "golden_hour", name: "Golden Hour", filter: "sepia(0.15) saturate(1.3) brightness(1.1) contrast(1.05)" },
  { id: "bleach_bypass", name: "Bleach Bypass", filter: "saturate(0.4) contrast(1.5) brightness(0.95)" },
  { id: "neon_glow", name: "Neon Glow", filter: "saturate(1.8) contrast(1.2) brightness(1.1) hue-rotate(-5deg)" },
  { id: "matte_film", name: "Matte Film", filter: "contrast(0.95) brightness(1.08) saturate(0.85) sepia(0.08)" },
];

// BGM presets — royalty-free music from Pixabay (CC0 / Pixabay License)
const BGM_PRESETS = [
  { id: "none", name: "No BGM", url: "" },
  { id: "cinematic_epic", name: "Cinematic Epic", url: "https://cdn.pixabay.com/audio/2024/11/29/audio_7e42a90175.mp3" },
  { id: "ambient_calm", name: "Ambient Calm", url: "https://cdn.pixabay.com/audio/2024/09/10/audio_6e8cd58e22.mp3" },
  { id: "electronic_beat", name: "Electronic Beat", url: "https://cdn.pixabay.com/audio/2024/11/21/audio_42f55fbb7b.mp3" },
  { id: "piano_emotional", name: "Piano Emotional", url: "https://cdn.pixabay.com/audio/2024/02/14/audio_08625c674c.mp3" },
  { id: "lofi_chill", name: "Lo-Fi Chill", url: "https://cdn.pixabay.com/audio/2024/09/03/audio_f1afef2ddb.mp3" },
  { id: "dark_tension", name: "Dark Tension", url: "https://cdn.pixabay.com/audio/2024/04/17/audio_61d02fd9b0.mp3" },
  { id: "upbeat_pop", name: "Upbeat Pop", url: "https://cdn.pixabay.com/audio/2024/09/28/audio_16d54fffa4.mp3" },
  { id: "orchestral_drama", name: "Orchestral Drama", url: "https://cdn.pixabay.com/audio/2023/10/01/audio_dc34cfab40.mp3" },
];

type Scene = {
  id: string;
  prompt: string;
  cinemaPreset: string;
  colorGrade: string;
  duration: number; // seconds
  status: "draft" | "generating" | "done" | "failed";
  videoUrl?: string;
  narration?: string;
  narrationAudioUrl?: string;
  error?: string;
};

const PLAN_RANK: Record<string, number> = {
  free: 0, lite: 1, basic: 2, pro: 3, unlimited: 4, studio: 5,
};

export default function StoryboardPage() {
  const { user, session, loading: authLoading } = useAuth();
  const [userPlan, setUserPlan] = useState("free");

  // Scenes
  const [scenes, setScenes] = useState<Scene[]>([
    { id: crypto.randomUUID(), prompt: "", cinemaPreset: "blockbuster", colorGrade: "none", duration: 5, status: "draft" },
  ]);

  // Global settings
  const [videoModel, setVideoModel] = useState("fal_ltx_t2v");
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  // TTS
  const [ttsEngine, setTtsEngine] = useState("openai");
  const [ttsVoice, setTtsVoice] = useState("nova");
  const [ttsLang, setTtsLang] = useState("en");

  // BGM
  const [bgmPreset, setBgmPreset] = useState("none");
  const [aiBgmPrompt, setAiBgmPrompt] = useState("");
  const [aiBgmUrl, setAiBgmUrl] = useState<string | null>(null);
  const [aiBgmLoading, setAiBgmLoading] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const ffmpegRef = useRef<FFmpeg | null>(null);

  useEffect(() => {
    if (!session) return;
    api.getSubscription(session.access_token)
      .then((data) => setUserPlan(data.plan || "free"))
      .catch(() => {});
  }, [session]);

  const addScene = () => {
    setScenes((prev) => [
      ...prev,
      { id: crypto.randomUUID(), prompt: "", cinemaPreset: "blockbuster", colorGrade: "none", duration: 5, status: "draft" },
    ]);
  };

  const removeScene = (id: string) => {
    if (scenes.length <= 1) return;
    setScenes((prev) => prev.filter((s) => s.id !== id));
  };

  const updateScene = (id: string, updates: Partial<Scene>) => {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const moveScene = (id: string, direction: "up" | "down") => {
    setScenes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  const buildScenePrompt = (scene: Scene) => {
    const preset = CINEMA_PRESETS.find((p) => p.id === scene.cinemaPreset);
    return scene.prompt + (preset?.suffix || "");
  };

  // Generate AI BGM
  const generateAiBgm = useCallback(async () => {
    if (!session?.access_token) return;
    const prompt = aiBgmPrompt.trim() || scenes.map((s) => s.prompt).filter(Boolean).join(", ");
    if (!prompt) {
      toast.error("Add scene prompts or describe the BGM you want");
      return;
    }
    setAiBgmLoading(true);
    try {
      const totalDuration = Math.min(scenes.reduce((sum, s) => sum + s.duration, 0), 60);
      const res = await api.generateMusic(session.access_token, {
        prompt: `background music for a video: ${prompt}`,
        duration: Math.max(totalDuration, 15),
        model: "ace_step",
      });
      if (res.result_url) {
        const url = resolveResultUrl(res.result_url) || res.result_url;
        setAiBgmUrl(url);
        setBgmPreset("ai_generated");
        toast.success("AI BGM generated!");
      } else {
        toast.error("BGM generation failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "BGM generation failed");
    } finally {
      setAiBgmLoading(false);
    }
  }, [session, aiBgmPrompt, scenes]);

  // Generate a single scene
  const generateScene = useCallback(async (sceneId: string) => {
    if (!session) return;
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene || !scene.prompt.trim()) {
      toast.error("Scene prompt is empty");
      return;
    }

    updateScene(sceneId, { status: "generating", error: undefined });

    try {
      const res = await api.generateVideo(session.access_token, {
        prompt: buildScenePrompt(scene),
        negative_prompt: "worst quality, low quality, blurry, deformed",
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
      const maxPolls = 120;
      for (let i = 0; i < maxPolls; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const status = await api.getJobStatus(session.access_token, jobId);
        if (status.status === "completed" && status.result_url) {
          updateScene(sceneId, {
            status: "done",
            videoUrl: resolveResultUrl(status.result_url) || undefined,
          });
          return;
        }
        if (status.status === "failed") {
          updateScene(sceneId, { status: "failed", error: status.error || "Generation failed" });
          return;
        }
      }
      updateScene(sceneId, { status: "failed", error: "Timeout" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      updateScene(sceneId, { status: "failed", error: msg });
    }
  }, [session, scenes, videoModel]);

  // Generate all scenes sequentially
  const generateAll = async () => {
    if (!session) return;
    const drafts = scenes.filter((s) => s.status === "draft" || s.status === "failed");
    if (drafts.length === 0) {
      toast.error("No scenes to generate");
      return;
    }
    setIsGeneratingAll(true);
    for (const scene of drafts) {
      if (!scene.prompt.trim()) continue;
      await generateScene(scene.id);
    }
    setIsGeneratingAll(false);
    toast.success("All scenes generated!");
  };

  // Generate narration for a scene
  const generateNarration = async (sceneId: string) => {
    if (!session) return;
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene?.narration?.trim()) {
      toast.error("Enter narration text first");
      return;
    }

    try {
      const blob = await api.synthesizeSpeech(session.access_token, {
        text: scene.narration,
        language: ttsLang,
        engine: ttsEngine,
        voice_id: ttsVoice,
      });
      const url = URL.createObjectURL(blob);
      updateScene(sceneId, { narrationAudioUrl: url });
      toast.success("Narration generated!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "TTS failed";
      toast.error(msg);
    }
  };

  // Export stitched video via ffmpeg.wasm
  const exportVideo = async () => {
    const doneScenes = scenes.filter((s) => s.status === "done" && s.videoUrl);
    if (doneScenes.length === 0) {
      toast.error("No completed scenes to export");
      return;
    }

    setExporting(true);
    setExportProgress("Loading ffmpeg...");

    try {
      // Load ffmpeg if not already loaded
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

      // Download all scene videos and write to ffmpeg filesystem
      const fileList: string[] = [];
      for (let i = 0; i < doneScenes.length; i++) {
        const scene = doneScenes[i];
        setExportProgress(`Downloading scene ${i + 1}/${doneScenes.length}...`);
        const videoData = await fetchFile(scene.videoUrl!);
        const inputName = `scene_${i}.mp4`;
        await ffmpeg.writeFile(inputName, videoData);
        fileList.push(inputName);
      }

      // Build concat file for ffmpeg
      const concatContent = fileList.map((f) => `file '${f}'`).join("\n");
      await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(concatContent));

      // Audio tracks: narration and/or BGM
      const narrationScenes = doneScenes.filter((s) => s.narrationAudioUrl);
      let hasNarration = false;
      let hasBgm = false;
      const selectedBgm = BGM_PRESETS.find((b) => b.id === bgmPreset);
      const bgmUrl = bgmPreset === "ai_generated" ? aiBgmUrl : selectedBgm?.url;

      if (narrationScenes.length > 0) {
        setExportProgress("Processing narration...");
        const narrationData = await fetchFile(narrationScenes[0].narrationAudioUrl!);
        await ffmpeg.writeFile("narration.mp3", narrationData);
        hasNarration = true;
      }

      if (bgmUrl) {
        setExportProgress("Downloading BGM...");
        const bgmData = await fetchFile(bgmUrl);
        await ffmpeg.writeFile("bgm.mp3", bgmData);
        hasBgm = true;
      }

      setExportProgress("Stitching video...");

      if (hasNarration && hasBgm) {
        // Video + narration + BGM (mix audio tracks)
        await ffmpeg.exec([
          "-f", "concat", "-safe", "0", "-i", "concat.txt",
          "-i", "narration.mp3",
          "-i", "bgm.mp3",
          "-filter_complex", "[1:a]volume=1.0[narr];[2:a]volume=0.3[bgm];[narr][bgm]amix=inputs=2:duration=shortest[aout]",
          "-c:v", "copy",
          "-map", "0:v:0",
          "-map", "[aout]",
          "-shortest",
          "-y", "output.mp4",
        ]);
      } else if (hasNarration) {
        await ffmpeg.exec([
          "-f", "concat", "-safe", "0", "-i", "concat.txt",
          "-i", "narration.mp3",
          "-c:v", "copy", "-c:a", "aac",
          "-map", "0:v:0", "-map", "1:a:0",
          "-shortest",
          "-y", "output.mp4",
        ]);
      } else if (hasBgm) {
        await ffmpeg.exec([
          "-f", "concat", "-safe", "0", "-i", "concat.txt",
          "-i", "bgm.mp3",
          "-c:v", "copy", "-c:a", "aac",
          "-map", "0:v:0", "-map", "1:a:0",
          "-shortest",
          "-y", "output.mp4",
        ]);
      } else {
        await ffmpeg.exec([
          "-f", "concat", "-safe", "0", "-i", "concat.txt",
          "-c", "copy",
          "-y", "output.mp4",
        ]);
      }

      setExportProgress("Preparing download...");
      const outputData = await ffmpeg.readFile("output.mp4");
      // ffmpeg.readFile returns FileData which may be Uint8Array — convert to standard ArrayBuffer
      const bytes = outputData instanceof Uint8Array ? outputData : new TextEncoder().encode(outputData as string);
      const blob = new Blob([new Uint8Array(bytes)], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectTitle.replace(/[^a-zA-Z0-9]/g, "_")}_storyboard.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Cleanup ffmpeg filesystem
      for (const f of fileList) {
        try { await ffmpeg.deleteFile(f); } catch {}
      }
      try { await ffmpeg.deleteFile("concat.txt"); } catch {}
      try { await ffmpeg.deleteFile("output.mp4"); } catch {}
      if (hasNarration) {
        try { await ffmpeg.deleteFile("narration.mp3"); } catch {}
      }
      if (hasBgm) {
        try { await ffmpeg.deleteFile("bgm.mp3"); } catch {}
      }

      toast.success("Video exported!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      toast.error(msg);
      console.error("Export error:", err);
    } finally {
      setExporting(false);
      setExportProgress("");
    }
  };

  // Calculate total credits
  const totalCredits = scenes.filter((s) => s.prompt.trim() && (s.status === "draft" || s.status === "failed")).length *
    (VIDEO_MODELS.find((m) => m.id === videoModel)?.credits ?? 5);
  const completedScenes = scenes.filter((s) => s.status === "done").length;

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-bold">Storyboard Studio</h1>
          <p className="text-muted-foreground">Create multi-scene AI videos with cinema-quality presets.</p>
          <Link href="/register">
            <Button size="lg">Sign up to start creating</Button>
          </Link>
        </div>
      </>
    );
  }

  // Plan gate: Basic+ for storyboard
  if (PLAN_RANK[userPlan] < PLAN_RANK["basic"]) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-bold">Storyboard Studio</h1>
          <p className="text-muted-foreground">
            Create multi-scene AI movies with cinema camera presets, color grading, and narration.
          </p>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 space-y-3">
            <p className="text-amber-400 font-medium">Basic plan or above required</p>
            <p className="text-sm text-muted-foreground">
              Free: 2 scenes max. Basic: unlimited scenes. Pro: + voice cloning narration.
            </p>
            <Link href="/#pricing">
              <Button variant="outline" className="border-amber-500/30 text-amber-400">
                View Plans
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="text-xl font-bold bg-transparent border-none px-0 h-auto focus-visible:ring-0"
              placeholder="Project Title"
            />
            <p className="text-xs text-muted-foreground">
              {scenes.length} scene{scenes.length !== 1 ? "s" : ""} | {completedScenes} generated | ~{totalCredits} credits to generate remaining
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={videoModel} onValueChange={(v) => v && setVideoModel(v)}>
              <SelectTrigger className="w-[200px]">
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
            <Button
              onClick={generateAll}
              disabled={isGeneratingAll || scenes.every((s) => s.status === "done" || !s.prompt.trim())}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {isGeneratingAll ? "Generating..." : `Generate All (${totalCredits} cr)`}
            </Button>
          </div>
        </div>

        {/* Audio Settings: TTS + BGM */}
        <Card className="border-cyan-500/20">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <Label className="text-xs whitespace-nowrap">BGM:</Label>
              <Select value={bgmPreset} onValueChange={(v) => {
                if (v) {
                  setBgmPreset(v);
                  if (v !== "ai_generated") setAiBgmUrl(null);
                }
              }}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BGM_PRESETS.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                  <SelectItem value="ai_generated">AI Generate BGM</SelectItem>
                </SelectContent>
              </Select>
              {bgmPreset === "ai_generated" && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Input
                    placeholder="Describe BGM mood (or auto from scenes)"
                    value={aiBgmPrompt}
                    onChange={(e) => setAiBgmPrompt(e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <Button
                    onClick={generateAiBgm}
                    disabled={aiBgmLoading}
                    size="sm"
                    className="h-8 text-xs whitespace-nowrap bg-purple-600 hover:bg-purple-500"
                  >
                    {aiBgmLoading ? "Generating..." : "Generate (5 cr)"}
                  </Button>
                </div>
              )}
              {bgmPreset === "ai_generated" && aiBgmUrl && (
                <audio src={aiBgmUrl} controls className="h-8" style={{ maxWidth: 200 }} />
              )}
              {bgmPreset !== "none" && bgmPreset !== "ai_generated" && (
                <audio
                  src={BGM_PRESETS.find((b) => b.id === bgmPreset)?.url}
                  controls
                  className="h-8"
                  style={{ maxWidth: 200 }}
                />
              )}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Label className="text-xs whitespace-nowrap">Narration Voice:</Label>
              <Select value={ttsEngine} onValueChange={(v) => v && setTtsEngine(v)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI (3 cr)</SelectItem>
                  <SelectItem value="openai_hd">OpenAI HD (5 cr)</SelectItem>
                  <SelectItem value="chatterbox" disabled={PLAN_RANK[userPlan] < PLAN_RANK["pro"]}>
                    Chatterbox {PLAN_RANK[userPlan] < PLAN_RANK["pro"] ? "(Pro+)" : "(2 cr)"}
                  </SelectItem>
                  <SelectItem value="kokoro">Kokoro (1 cr)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ttsVoice} onValueChange={(v) => v && setTtsVoice(v)}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nova">Nova (F)</SelectItem>
                  <SelectItem value="alloy">Alloy</SelectItem>
                  <SelectItem value="echo">Echo (M)</SelectItem>
                  <SelectItem value="onyx">Onyx (M)</SelectItem>
                  <SelectItem value="shimmer">Shimmer (F)</SelectItem>
                  <SelectItem value="fable">Fable</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ttsLang} onValueChange={(v) => v && setTtsLang(v)}>
                <SelectTrigger className="w-[100px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Scene Cards */}
        <div className="space-y-4">
          {scenes.map((scene, idx) => (
            <Card key={scene.id} className={`border ${
              scene.status === "done" ? "border-green-500/30" :
              scene.status === "generating" ? "border-purple-500/30 animate-pulse" :
              scene.status === "failed" ? "border-red-500/30" :
              "border-muted"
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Scene {idx + 1}
                    {scene.status === "done" && <span className="ml-2 text-green-500 text-xs">Done</span>}
                    {scene.status === "generating" && <span className="ml-2 text-purple-400 text-xs">Generating...</span>}
                    {scene.status === "failed" && <span className="ml-2 text-red-500 text-xs">Failed</span>}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveScene(scene.id, "up")} disabled={idx === 0} className="text-xs px-2 py-1 rounded hover:bg-muted disabled:opacity-30">
                      Up
                    </button>
                    <button onClick={() => moveScene(scene.id, "down")} disabled={idx === scenes.length - 1} className="text-xs px-2 py-1 rounded hover:bg-muted disabled:opacity-30">
                      Down
                    </button>
                    <button onClick={() => removeScene(scene.id)} disabled={scenes.length <= 1} className="text-xs px-2 py-1 rounded hover:bg-muted text-red-400 disabled:opacity-30">
                      Remove
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Prompt & Settings */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Scene Description</Label>
                      <Textarea
                        placeholder="A woman walks through a neon-lit Tokyo street at night..."
                        value={scene.prompt}
                        onChange={(e) => updateScene(scene.id, { prompt: e.target.value })}
                        rows={3}
                        disabled={scene.status === "generating"}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Camera Preset</Label>
                        <Select value={scene.cinemaPreset} onValueChange={(v) => v && updateScene(scene.id, { cinemaPreset: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CINEMA_PRESETS.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Color Grade</Label>
                        <Select value={scene.colorGrade} onValueChange={(v) => v && updateScene(scene.id, { colorGrade: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {COLOR_GRADES.map((g) => (
                              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Duration: {scene.duration}s</Label>
                      <Input
                        type="range" min={3} max={15} step={1} value={scene.duration}
                        onChange={(e) => updateScene(scene.id, { duration: Number(e.target.value) })}
                      />
                    </div>

                    {/* Narration */}
                    <div>
                      <Label className="text-xs">Narration (optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="The city never sleeps..."
                          value={scene.narration || ""}
                          onChange={(e) => updateScene(scene.id, { narration: e.target.value })}
                          className="text-xs h-8"
                        />
                        <Button
                          variant="outline" size="sm"
                          onClick={() => generateNarration(scene.id)}
                          disabled={!scene.narration?.trim()}
                          className="text-xs h-8 whitespace-nowrap"
                        >
                          Generate
                        </Button>
                      </div>
                      {scene.narrationAudioUrl && (
                        <audio src={scene.narrationAudioUrl} controls className="w-full mt-2 h-8" />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm" variant="outline"
                        onClick={() => generateScene(scene.id)}
                        disabled={scene.status === "generating" || !scene.prompt.trim()}
                        className="text-xs"
                      >
                        {scene.status === "generating" ? "Generating..." : scene.status === "done" ? "Regenerate" : "Generate Scene"}
                      </Button>
                    </div>

                    {scene.error && (
                      <p className="text-xs text-red-400">{scene.error}</p>
                    )}
                  </div>

                  {/* Right: Preview */}
                  <div className="rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
                    {scene.videoUrl ? (
                      <video
                        src={scene.videoUrl}
                        controls loop autoPlay muted
                        className="w-full h-full object-cover"
                        style={scene.colorGrade !== "none" ? { filter: COLOR_GRADES.find((g) => g.id === scene.colorGrade)?.filter } : undefined}
                      />
                    ) : scene.status === "generating" ? (
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-muted-foreground">Generating scene...</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Preview will appear here</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Scene */}
        <button
          onClick={addScene}
          className="w-full border-2 border-dashed border-muted-foreground/20 rounded-lg py-4 text-sm text-muted-foreground hover:border-purple-500/30 hover:text-purple-400 transition-colors"
        >
          + Add Scene
        </button>

        {/* Timeline Preview */}
        {completedScenes > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Timeline Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {scenes.filter((s) => s.status === "done" && s.videoUrl).map((scene, idx) => (
                  <div key={scene.id} className="flex-shrink-0 w-32">
                    <video
                      src={scene.videoUrl}
                      muted loop autoPlay
                      className="w-32 h-20 object-cover rounded"
                      style={scene.colorGrade !== "none" ? { filter: COLOR_GRADES.find((g) => g.id === scene.colorGrade)?.filter } : undefined}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                      Scene {scenes.indexOf(scene) + 1} ({scene.duration}s)
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted-foreground">
                  Total: {scenes.filter((s) => s.status === "done").reduce((sum, s) => sum + s.duration, 0)}s |
                  {scenes.filter((s) => s.status === "done").length} scenes ready
                </p>
                <Button
                  onClick={exportVideo}
                  disabled={exporting || completedScenes === 0}
                  className="bg-gradient-to-r from-green-600 to-emerald-600"
                  size="sm"
                >
                  {exporting ? exportProgress || "Exporting..." : "Export Video (.mp4)"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
