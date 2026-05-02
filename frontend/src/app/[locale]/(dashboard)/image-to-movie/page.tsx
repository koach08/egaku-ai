"use client";

import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
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
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
  Loader2Icon,
  SparklesIcon,
  UploadIcon,
  ImageIcon,
  FilmIcon,
  Music2Icon,
  DownloadIcon,
  PlusIcon,
  Trash2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "lucide-react";

const VIDEO_MODELS = [
  { id: "fal_ltx_i2v", name: "LTX 2 I2V (Fast)", credits: 5 },
  { id: "fal_wan_i2v", name: "Wan 2.1 I2V", credits: 10 },
  { id: "fal_wan26_i2v", name: "Wan 2.6 I2V (15s)", credits: 12 },
  { id: "fal_kling_i2v", name: "Kling v2 I2V", credits: 15 },
  { id: "fal_kling25_i2v", name: "Kling 2.5 Pro I2V", credits: 25 },
  { id: "fal_seedance2_i2v", name: "Seedance 2.0 I2V (Audio)", credits: 60 },
  { id: "fal_seedance2_fast_i2v", name: "Seedance 2 Fast I2V", credits: 50 },
];

type SceneItem = {
  id: string;
  imageUrl: string | null; // uploaded or generated image
  imageSource: "upload" | "generate";
  prompt: string; // motion prompt for img2vid
  generatePrompt: string; // image generation prompt (if generating)
  status: "draft" | "generating_image" | "generating_video" | "done" | "failed";
  videoUrl?: string;
  error?: string;
};

export default function ImageToMoviePage() {
  const { session } = useAuth();
  const [scenes, setScenes] = useState<SceneItem[]>([
    { id: crypto.randomUUID(), imageUrl: null, imageSource: "upload", prompt: "", generatePrompt: "", status: "draft" },
  ]);
  const [videoModel, setVideoModel] = useState("fal_wan_i2v");
  const [nsfw, setNsfw] = useState(false);
  const [generatingIdx, setGeneratingIdx] = useState(-1);

  // Music
  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicLoading, setMusicLoading] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const updateScene = (id: string, updates: Partial<SceneItem>) => {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const addScene = () => {
    setScenes((prev) => [...prev, {
      id: crypto.randomUUID(), imageUrl: null, imageSource: "upload", prompt: "", generatePrompt: "", status: "draft",
    }]);
  };

  const removeScene = (id: string) => {
    if (scenes.length <= 1) return;
    setScenes((prev) => prev.filter((s) => s.id !== id));
  };

  const moveScene = (id: string, dir: "up" | "down") => {
    setScenes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  const handleImageUpload = (sceneId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateScene(sceneId, { imageUrl: reader.result as string, imageSource: "upload" });
    };
    reader.readAsDataURL(file);
  };

  // Generate image for a scene
  const generateImage = useCallback(async (sceneId: string) => {
    if (!session?.access_token) return;
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene?.generatePrompt.trim()) {
      toast.error("Enter an image prompt first");
      return;
    }
    updateScene(sceneId, { status: "generating_image" });
    try {
      const res = await api.generateImage(session.access_token, {
        prompt: scene.generatePrompt,
        negative_prompt: "worst quality, low quality, blurry, deformed",
        model: "fal_flux_dev",
        width: 768, height: 768,
        steps: 25, cfg: 7, sampler: "euler_ancestral", seed: -1,
        nsfw,
      });
      const jobId = res.job_id;
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await api.getJobStatus(session.access_token, jobId);
        if (status.status === "completed" && status.result_url) {
          updateScene(sceneId, {
            imageUrl: resolveResultUrl(status.result_url) || status.result_url,
            imageSource: "generate",
            status: "draft",
          });
          return;
        }
        if (status.status === "failed") {
          updateScene(sceneId, { status: "failed", error: "Image generation failed" });
          return;
        }
      }
      updateScene(sceneId, { status: "failed", error: "Timeout" });
    } catch (err) {
      updateScene(sceneId, { status: "failed", error: err instanceof Error ? err.message : "Failed" });
    }
  }, [session, scenes, nsfw]);

  // Animate all scenes (img2vid)
  const animateAll = useCallback(async () => {
    if (!session?.access_token) return;
    const ready = scenes.filter((s) => s.imageUrl && s.status !== "done");
    if (ready.length === 0) {
      toast.error("Add images to your scenes first");
      return;
    }

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (!scene.imageUrl || scene.status === "done") continue;

      setGeneratingIdx(i);
      updateScene(scene.id, { status: "generating_video", error: undefined });

      try {
        const res = await api.img2vid(session.access_token, {
          image: scene.imageUrl,
          prompt: scene.prompt || "smooth cinematic motion, professional quality",
          negative_prompt: "worst quality, blurry, static, jitter",
          model: videoModel,
          frame_count: 32,
          fps: 8,
          width: 512, height: 512,
          steps: 20, cfg: 7,
          nsfw,
        });

        const jobId = res.job_id;
        for (let poll = 0; poll < 120; poll++) {
          await new Promise((r) => setTimeout(r, 3000));
          const status = await api.getJobStatus(session.access_token, jobId);
          if (status.status === "completed" && status.result_url) {
            updateScene(scene.id, {
              status: "done",
              videoUrl: resolveResultUrl(status.result_url) || status.result_url,
            });
            break;
          }
          if (status.status === "failed") {
            updateScene(scene.id, { status: "failed", error: status.error || "Failed" });
            break;
          }
        }
      } catch (err) {
        updateScene(scene.id, { status: "failed", error: err instanceof Error ? err.message : "Failed" });
      }
    }
    setGeneratingIdx(-1);
    toast.success("All scenes animated!");
  }, [session, scenes, videoModel, nsfw]);

  // Generate music
  const generateMusic = useCallback(async () => {
    if (!session?.access_token) return;
    setMusicLoading(true);
    try {
      const autoPrompt = musicPrompt || `cinematic background music for a video with scenes: ${scenes.map((s) => s.prompt || s.generatePrompt).filter(Boolean).join(", ")}`;
      const res = await api.generateMusic(session.access_token, {
        prompt: autoPrompt,
        duration: Math.min(scenes.length * 5, 60),
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
  }, [session, musicPrompt, scenes]);

  // Export final movie
  const exportMovie = useCallback(async () => {
    const doneScenes = scenes.filter((s) => s.status === "done" && s.videoUrl);
    if (doneScenes.length === 0) {
      toast.error("No animated scenes to export");
      return;
    }
    setExporting(true);
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

      const fileList: string[] = [];
      for (let i = 0; i < doneScenes.length; i++) {
        setExportProgress(`Downloading scene ${i + 1}/${doneScenes.length}...`);
        const videoData = await fetchFile(doneScenes[i].videoUrl!);
        const name = `scene_${i}.mp4`;
        await ffmpeg.writeFile(name, videoData);
        fileList.push(name);
      }

      const concatContent = fileList.map((f) => `file '${f}'`).join("\n");
      await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(concatContent));

      let hasMusic = false;
      if (musicUrl) {
        setExportProgress("Downloading music...");
        const musicData = await fetchFile(musicUrl);
        await ffmpeg.writeFile("music.mp3", musicData);
        hasMusic = true;
      }

      setExportProgress("Stitching movie...");
      if (hasMusic) {
        await ffmpeg.exec([
          "-f", "concat", "-safe", "0", "-i", "concat.txt",
          "-i", "music.mp3",
          "-c:v", "copy", "-map", "0:v:0", "-map", "1:a:0",
          "-shortest", "-y", "output.mp4",
        ]);
      } else {
        await ffmpeg.exec([
          "-f", "concat", "-safe", "0", "-i", "concat.txt",
          "-c:v", "copy", "-y", "output.mp4",
        ]);
      }

      const outputData = await ffmpeg.readFile("output.mp4");
      const bytes = outputData instanceof Uint8Array ? outputData : new TextEncoder().encode(outputData as string);
      const blob = new Blob([new Uint8Array(bytes)], { type: "video/mp4" });
      setExportUrl(URL.createObjectURL(blob));
      setExportProgress("");
      toast.success("Movie exported!");

      for (const f of fileList) { try { await ffmpeg.deleteFile(f); } catch {} }
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

  const doneCount = scenes.filter((s) => s.status === "done").length;
  const modelCredits = VIDEO_MODELS.find((m) => m.id === videoModel)?.credits || 10;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Image to Movie</h1>
          <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">NEW</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Upload or generate images for each scene. AI animates them into video clips with Seedance, Kling, or Wan. Add music and export.
        </p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to create</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Settings bar */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-white/50 mb-1">Video Model</label>
                <Select value={videoModel} onValueChange={(v) => v && setVideoModel(v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIDEO_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.credits} cr)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer mt-5">
                <input type="checkbox" checked={nsfw} onChange={(e) => setNsfw(e.target.checked)} className="rounded" />
                <span className="text-white/50">NSFW</span>
              </label>
            </div>

            {/* Scenes */}
            {scenes.map((scene, i) => (
              <div key={scene.id} className={`rounded-xl border p-4 space-y-3 ${
                scene.status === "done" ? "border-green-500/30 bg-green-500/5" :
                scene.status === "failed" ? "border-red-500/30 bg-red-500/5" :
                scene.status.startsWith("generating") ? "border-purple-500/30 bg-purple-500/5" :
                "border-white/[0.06]"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">Scene {i + 1}</span>
                    {scene.status === "done" && <CheckCircle2Icon className="size-4 text-green-400" />}
                    {scene.status === "failed" && <XCircleIcon className="size-4 text-red-400" />}
                    {scene.status.startsWith("generating") && <Loader2Icon className="size-4 text-purple-400 animate-spin" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveScene(scene.id, "up")} className="p-1 text-white/30 hover:text-white/60"><ArrowUpIcon className="size-3" /></button>
                    <button onClick={() => moveScene(scene.id, "down")} className="p-1 text-white/30 hover:text-white/60"><ArrowDownIcon className="size-3" /></button>
                    <button onClick={() => removeScene(scene.id)} className="p-1 text-red-400/50 hover:text-red-400"><Trash2Icon className="size-3" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Image area */}
                  <div>
                    {scene.imageUrl ? (
                      <div className="relative">
                        <img src={scene.imageUrl} alt={`Scene ${i+1}`} className="w-full aspect-square object-cover rounded-lg" />
                        <button
                          onClick={() => updateScene(scene.id, { imageUrl: null })}
                          className="absolute top-2 right-2 bg-black/60 text-white/60 hover:text-white p-1 rounded-full"
                        >
                          <XCircleIcon className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block w-full aspect-square rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-colors">
                          <UploadIcon className="size-6 text-white/20 mb-2" />
                          <span className="text-xs text-white/30">Upload image</span>
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(scene.id, e)} className="hidden" />
                        </label>
                        <div className="text-center text-[10px] text-white/30">or</div>
                        <Input
                          placeholder="Describe image to generate..."
                          value={scene.generatePrompt}
                          onChange={(e) => updateScene(scene.id, { generatePrompt: e.target.value })}
                          className="text-xs h-8"
                        />
                        <Button
                          size="sm"
                          onClick={() => generateImage(scene.id)}
                          disabled={scene.status === "generating_image" || !scene.generatePrompt.trim()}
                          className="w-full text-xs h-8 rounded-full"
                        >
                          {scene.status === "generating_image" ? (
                            <Loader2Icon className="size-3 mr-1 animate-spin" />
                          ) : (
                            <ImageIcon className="size-3 mr-1" />
                          )}
                          Generate Image (3 cr)
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Motion prompt + video preview */}
                  <div className="space-y-2">
                    <label className="block text-xs text-white/50">Motion prompt</label>
                    <Textarea
                      placeholder="e.g., camera slowly zooms in, hair blowing in wind, gentle motion..."
                      value={scene.prompt}
                      onChange={(e) => updateScene(scene.id, { prompt: e.target.value })}
                      rows={3}
                      className="text-xs"
                    />
                    {scene.videoUrl && (
                      <video src={scene.videoUrl} controls className="w-full rounded-lg" loop muted />
                    )}
                    {scene.error && <p className="text-xs text-red-400">{scene.error}</p>}
                  </div>
                </div>
              </div>
            ))}

            {/* Add scene */}
            <button
              onClick={addScene}
              className="w-full rounded-xl border border-dashed border-white/20 p-4 text-sm text-white/30 hover:text-white/60 hover:border-white/40 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="size-4" /> Add Scene
            </button>

            {/* Animate all */}
            <Button
              onClick={animateAll}
              disabled={generatingIdx >= 0 || scenes.every((s) => !s.imageUrl || s.status === "done")}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full text-base"
            >
              {generatingIdx >= 0 ? (
                <><Loader2Icon className="size-5 mr-2 animate-spin" />Animating scene {generatingIdx + 1}...</>
              ) : (
                <><FilmIcon className="size-5 mr-2" />Animate All Scenes ({scenes.filter((s) => s.imageUrl && s.status !== "done").length} x {modelCredits} cr)</>
              )}
            </Button>

            {/* Music section (shows after at least 1 scene is done) */}
            {doneCount > 0 && (
              <div className="rounded-xl border border-white/[0.06] p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Music2Icon className="size-4 text-purple-400" /> Add Music
                </h3>
                <Input
                  placeholder="Describe the music mood (or auto from scene prompts)"
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  className="text-xs h-9"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={generateMusic}
                    disabled={musicLoading}
                    size="sm"
                    className="rounded-full"
                  >
                    {musicLoading ? <Loader2Icon className="size-3 mr-1 animate-spin" /> : <Music2Icon className="size-3 mr-1" />}
                    Generate Music (5 cr)
                  </Button>
                  {musicUrl && <audio src={musicUrl} controls className="h-8 flex-1" />}
                </div>
              </div>
            )}

            {/* Export */}
            {doneCount > 0 && (
              <Button
                onClick={exportMovie}
                disabled={exporting}
                className="w-full h-12 bg-green-600 hover:bg-green-500 text-white rounded-full text-base"
              >
                {exporting ? (
                  <><Loader2Icon className="size-5 mr-2 animate-spin" />{exportProgress}</>
                ) : (
                  <><DownloadIcon className="size-5 mr-2" />Export Movie ({doneCount} scenes{musicUrl ? " + music" : ""})</>
                )}
              </Button>
            )}

            {/* Final video */}
            {exportUrl && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 space-y-4">
                <video src={exportUrl} controls className="w-full rounded-xl" />
                <a href={exportUrl} download={`egaku-movie-${Date.now()}.mp4`}>
                  <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-base">
                    <DownloadIcon className="size-5 mr-2" />Download Movie
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
