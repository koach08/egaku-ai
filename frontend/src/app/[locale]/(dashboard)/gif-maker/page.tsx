"use client";

import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
  Loader2Icon,
  UploadIcon,
  SparklesIcon,
  DownloadIcon,
  ImageIcon,
} from "lucide-react";

export default function GifMakerPage() {
  const { session } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("subtle motion, gentle sway, atmospheric");
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    setVideoUrl(null);
    setGifUrl(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !image) return;
    setLoading(true);
    setVideoUrl(null);
    setGifUrl(null);
    try {
      // Use img2vid with short duration for GIF-like output
      const res = await api.img2vid(session.access_token, {
        image,
        prompt: prompt || "subtle motion, gentle animation",
        negative_prompt: "worst quality, blurry, static",
        model: "fal_ltx_i2v",
        frame_count: 24,
        fps: 8,
        width: 512,
        height: 512,
        steps: 20,
        cfg: 7,
        nsfw: false,
      });

      const jobId = res.job_id;
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const status = await api.getJobStatus(session.access_token, jobId);
        if (status.status === "completed" && status.result_url) {
          const url = resolveResultUrl(status.result_url) || status.result_url;
          setVideoUrl(url);
          toast.success("Animation created! Converting to GIF...");
          await convertToGif(url);
          return;
        }
        if (status.status === "failed") {
          toast.error("Animation failed. Try a different image or prompt.");
          return;
        }
      }
      toast.error("Timeout");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [session, image, prompt]);

  const convertToGif = async (url: string) => {
    setConverting(true);
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
      const videoData = await fetchFile(url);
      await ffmpeg.writeFile("input.mp4", videoData);

      // Convert to GIF with good quality
      await ffmpeg.exec([
        "-i", "input.mp4",
        "-vf", "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
        "-loop", "0",
        "-y", "output.gif",
      ]);

      const outputData = await ffmpeg.readFile("output.gif");
      const bytes = outputData instanceof Uint8Array ? outputData : new TextEncoder().encode(outputData as string);
      const blob = new Blob([new Uint8Array(bytes)], { type: "image/gif" });
      const gifBlobUrl = URL.createObjectURL(blob);
      setGifUrl(gifBlobUrl);
      toast.success("GIF ready!");

      try { await ffmpeg.deleteFile("input.mp4"); } catch {}
      try { await ffmpeg.deleteFile("output.gif"); } catch {}
    } catch (err) {
      toast.error("GIF conversion failed");
    } finally {
      setConverting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">GIF Maker</h1>
          <span className="text-[10px] font-semibold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">NEW</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Upload an image, AI animates it, and you get a looping GIF. Share anywhere.
        </p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to create GIFs</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upload */}
            <div className="rounded-xl border border-dashed border-white/20 p-8 text-center">
              {image ? (
                <div className="space-y-3">
                  <img src={image} alt="Input" className="max-h-64 mx-auto rounded-lg" />
                  <button
                    onClick={() => { setImage(null); setImageFile(null); setVideoUrl(null); setGifUrl(null); }}
                    className="text-xs text-white/40 hover:text-white/60"
                  >
                    Change image
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer space-y-2">
                  <UploadIcon className="size-8 mx-auto text-white/20" />
                  <p className="text-sm text-white/40">Drop an image or click to upload</p>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Motion prompt */}
            <div>
              <label className="block text-xs text-white/50 mb-2">Motion description</label>
              <Input
                placeholder="e.g., hair blowing in wind, subtle breathing, water ripple"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            {/* Generate */}
            <Button
              onClick={handleGenerate}
              disabled={loading || converting || !image}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-full text-base"
            >
              {loading ? (
                <><Loader2Icon className="size-5 mr-2 animate-spin" />Animating...</>
              ) : converting ? (
                <><Loader2Icon className="size-5 mr-2 animate-spin" />Converting to GIF...</>
              ) : (
                <><SparklesIcon className="size-5 mr-2" />Create GIF (5 credits)</>
              )}
            </Button>

            {/* Results */}
            {gifUrl && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 space-y-4">
                <h3 className="text-sm font-medium">Your GIF</h3>
                <img src={gifUrl} alt="Generated GIF" className="w-full max-w-md mx-auto rounded-lg" />
                <div className="flex gap-3 justify-center">
                  <a href={gifUrl} download={`egaku-gif-${Date.now()}.gif`}>
                    <Button variant="outline" className="rounded-full">
                      <DownloadIcon className="size-4 mr-2" />Download GIF
                    </Button>
                  </a>
                  {videoUrl && (
                    <a href={videoUrl} download={`egaku-animation-${Date.now()}.mp4`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="rounded-full">
                        <DownloadIcon className="size-4 mr-2" />Download MP4
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
