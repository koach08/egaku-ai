"use client";

import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
  Loader2Icon,
  SparklesIcon,
  UploadIcon,
  PlusIcon,
  Trash2Icon,
  DownloadIcon,
  ArrowRightIcon,
} from "lucide-react";

const VIDEO_MODELS = [
  { id: "fal_wan_i2v", name: "Wan 2.1 (Smooth)", credits: 10 },
  { id: "fal_wan26_i2v", name: "Wan 2.6 (15s)", credits: 12 },
  { id: "fal_kling_i2v", name: "Kling v2", credits: 15 },
  { id: "fal_kling25_i2v", name: "Kling 2.5 Pro", credits: 25 },
];

type ImageFrame = {
  id: string;
  url: string;
};

export default function TransitionsPage() {
  const { session } = useAuth();
  const [frames, setFrames] = useState<ImageFrame[]>([]);
  const [model, setModel] = useState("fal_wan_i2v");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || frames.length >= 5) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFrames((prev) => [...prev, { id: crypto.randomUUID(), url: reader.result as string }]);
      setResultUrl(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeFrame = (id: string) => {
    setFrames((prev) => prev.filter((f) => f.id !== id));
    setResultUrl(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || frames.length < 2) return;
    setLoading(true);
    setResultUrl(null);

    try {
      // Generate transition clips between consecutive pairs
      const clips: string[] = [];

      for (let i = 0; i < frames.length - 1; i++) {
        setProgress(`Generating transition ${i + 1}/${frames.length - 1}...`);

        const res = await api.img2vid(session.access_token, {
          image: frames[i].url,
          prompt: "smooth cinematic transition, morphing gradually into the next scene, fluid motion, professional quality",
          negative_prompt: "worst quality, blurry, static, jitter, abrupt cut",
          model,
          frame_count: 32,
          fps: 8,
          width: 512,
          height: 512,
          steps: 20,
          cfg: 7,
          nsfw: false,
        });

        const jobId = res.job_id;
        for (let poll = 0; poll < 120; poll++) {
          await new Promise((r) => setTimeout(r, 3000));
          const status = await api.getJobStatus(session.access_token, jobId);
          if (status.status === "completed" && status.result_url) {
            clips.push(resolveResultUrl(status.result_url) || status.result_url);
            break;
          }
          if (status.status === "failed") {
            toast.error(`Transition ${i + 1} failed`);
            break;
          }
        }
      }

      if (clips.length === 0) {
        toast.error("No transitions generated");
        return;
      }

      // Stitch clips with ffmpeg
      setProgress("Stitching video...");

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
      for (let i = 0; i < clips.length; i++) {
        const data = await fetchFile(clips[i]);
        const name = `clip_${i}.mp4`;
        await ffmpeg.writeFile(name, data);
        fileList.push(name);
      }

      await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(fileList.map((f) => `file '${f}'`).join("\n")));
      await ffmpeg.exec(["-f", "concat", "-safe", "0", "-i", "concat.txt", "-c:v", "copy", "-y", "output.mp4"]);

      const outputData = await ffmpeg.readFile("output.mp4");
      const bytes = outputData instanceof Uint8Array ? outputData : new TextEncoder().encode(outputData as string);
      const blob = new Blob([new Uint8Array(bytes)], { type: "video/mp4" });
      setResultUrl(URL.createObjectURL(blob));
      setProgress("");
      toast.success("Transition video ready!");

      for (const f of fileList) { try { await ffmpeg.deleteFile(f); } catch {} }
      try { await ffmpeg.deleteFile("concat.txt"); } catch {}
      try { await ffmpeg.deleteFile("output.mp4"); } catch {}
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
      setProgress("");
    } finally {
      setLoading(false);
    }
  }, [session, frames, model]);

  const modelCredits = VIDEO_MODELS.find((m) => m.id === model)?.credits || 10;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Image Transitions</h1>
          <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">NEW</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Upload 2-5 images. AI creates smooth transition videos between them. Like Pikaframes.
        </p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to create</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {frames.map((frame, i) => (
                <div key={frame.id} className="relative flex-shrink-0">
                  <img src={frame.url} alt={`Frame ${i+1}`} className="w-24 h-24 rounded-lg object-cover" />
                  <button
                    onClick={() => removeFrame(frame.id)}
                    className="absolute -top-1 -right-1 bg-black/70 text-white/60 hover:text-red-400 p-0.5 rounded-full"
                  >
                    <Trash2Icon className="size-3" />
                  </button>
                  <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-black/60 text-white/60 px-1 rounded">{i+1}</span>
                  {i < frames.length - 1 && (
                    <ArrowRightIcon className="absolute -right-2 top-1/2 -translate-y-1/2 size-3 text-purple-400" />
                  )}
                </div>
              ))}
              {frames.length < 5 && (
                <label className="flex-shrink-0 w-24 h-24 rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-white/40">
                  <PlusIcon className="size-5 text-white/20" />
                  <span className="text-[9px] text-white/20 mt-1">{frames.length}/5</span>
                  <input type="file" accept="image/*" onChange={addImage} className="hidden" />
                </label>
              )}
            </div>

            {frames.length < 2 && (
              <p className="text-xs text-white/30 text-center">Upload at least 2 images to create transitions</p>
            )}

            {/* Model selection */}
            <div className="flex items-center gap-3 flex-wrap">
              {VIDEO_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    model === m.id ? "bg-purple-500 text-white" : "border border-white/[0.06] text-white/50 hover:text-white/80"
                  }`}
                >
                  {m.name} ({m.credits}cr)
                </button>
              ))}
            </div>

            {/* Generate */}
            <Button
              onClick={handleGenerate}
              disabled={loading || frames.length < 2}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full text-base"
            >
              {loading ? (
                <><Loader2Icon className="size-5 mr-2 animate-spin" />{progress}</>
              ) : (
                <><SparklesIcon className="size-5 mr-2" />Create Transitions ({(frames.length - 1) * modelCredits} credits)</>
              )}
            </Button>

            {/* Result */}
            {resultUrl && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 space-y-4">
                <video src={resultUrl} controls loop className="w-full rounded-xl" />
                <a href={resultUrl} download={`transition-${Date.now()}.mp4`}>
                  <Button variant="outline" className="rounded-full">
                    <DownloadIcon className="size-4 mr-2" />Download
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
