"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

const STYLE_PRESETS = [
  {
    id: "watercolor",
    name: "Watercolor",
    prompt: "Transform the scene into a hand-painted watercolor painting style, soft pastel colors, flowing brush strokes, artistic, dreamy atmosphere",
  },
  {
    id: "anime",
    name: "Anime",
    prompt: "Transform into vibrant anime style, bold outlines, cel shading, saturated colors, Japanese animation quality",
  },
  {
    id: "ghibli",
    name: "Studio Ghibli",
    prompt: "Restyle in Studio Ghibli hand-painted animation, soft colors, whimsical, Miyazaki aesthetic, painterly backgrounds",
  },
  {
    id: "oil",
    name: "Oil Painting",
    prompt: "Transform into a classical oil painting, thick impasto brushstrokes, rich color palette, canvas texture, fine art",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    prompt: "Restyle as cyberpunk, neon lights, futuristic cityscape, rain reflections, pink and blue glow, sci-fi atmosphere",
  },
  {
    id: "noir",
    name: "Film Noir",
    prompt: "Transform into black and white film noir, high contrast shadows, dramatic lighting, 1940s cinema aesthetic",
  },
  {
    id: "pixar",
    name: "3D Animation",
    prompt: "Restyle as a Pixar-quality 3D animated film, vibrant colors, expressive characters, cinematic lighting",
  },
  {
    id: "ukiyoe",
    name: "Ukiyo-e",
    prompt: "Transform into Japanese ukiyo-e woodblock print style, flat colors, bold outlines, Edo period aesthetic",
  },
  {
    id: "custom",
    name: "Custom (write your own)",
    prompt: "",
  },
];

const MAX_VIDEO_MB = 25; // hard cap on client upload
const VID2VID_CREDITS = 40;

export default function Vid2VidPage() {
  const { user, session, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileDuration, setFileDuration] = useState<number | null>(null);

  const [stylePreset, setStylePreset] = useState<string>("watercolor");
  const [customPrompt, setCustomPrompt] = useState("");
  const [resolution, setResolution] = useState<"720p" | "1080p">("720p");

  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      toast.error("Please select a video file (MP4 or MOV)");
      return;
    }
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`Video is too large. Max ${MAX_VIDEO_MB} MB.`);
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setFilePreview(url);
    // Probe duration
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    v.onloadedmetadata = () => {
      setFileDuration(v.duration);
      if (v.duration < 2 || v.duration > 10) {
        toast.warning(`Video is ${v.duration.toFixed(1)}s. WAN 2.7 works best with 2-10 second clips.`);
      }
    };
    setResultUrl(null);
  };

  const fileToDataUrl = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleGenerate = async () => {
    if (!file || !session) {
      toast.error("Please upload a video first");
      return;
    }
    const presetObj = STYLE_PRESETS.find((p) => p.id === stylePreset);
    const prompt = (stylePreset === "custom" ? customPrompt : presetObj?.prompt) || "";
    if (!prompt.trim()) {
      toast.error("Please describe the style you want");
      return;
    }

    setGenerating(true);
    setResultUrl(null);
    setElapsed(0);
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);

    try {
      const dataUrl = await fileToDataUrl(file);

      // Direct fetch (not api.vid2vid) to avoid retry-on-5xx, since this is a
      // long-running sync request (5-8 min typical for WAN 2.7).
      const res = await fetch(`${API_BASE}/generate/vid2vid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          video: dataUrl,
          prompt,
          resolution,
          duration: 0, // match input
          seed: -1,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `Request failed (${res.status})`);
      }
      const data = await res.json();
      if (data.result_url) {
        setResultUrl(data.result_url);
        toast.success("Your restyled video is ready!");
      } else {
        toast.error("Generation finished but returned no video URL");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
      clearInterval(timer);
    }
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-3xl font-bold">Video-to-Video Style Transfer</h1>
          <p className="text-muted-foreground">
            Upload any short video and restyle it with AI — watercolor, anime, cyberpunk, and more.
          </p>
          <Link href="/register">
            <Button size="lg">Start Creating</Button>
          </Link>
        </div>
      </>
    );
  }

  const mm = Math.floor(elapsed / 60);
  const ss = (elapsed % 60).toString().padStart(2, "0");

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Video-to-Video Style Transfer</h1>
          <p className="text-muted-foreground">
            Upload a short clip (2–10 seconds, max {MAX_VIDEO_MB} MB) and restyle it with WAN 2.7.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: input */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">1. Upload your video</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/*"
                  onChange={onFileChange}
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/30 cursor-pointer"
                />
                {file && (
                  <div className="text-xs text-muted-foreground">
                    <div>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</div>
                    {fileDuration !== null && (
                      <div>Duration: {fileDuration.toFixed(1)}s {fileDuration >= 2 && fileDuration <= 10 ? "✓" : "(outside 2–10s sweet spot)"}</div>
                    )}
                  </div>
                )}
                {filePreview && (
                  <video
                    src={filePreview}
                    controls
                    muted
                    className="w-full rounded-md bg-black"
                    style={{ maxHeight: 240 }}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">2. Pick a style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={stylePreset} onValueChange={(v) => v && setStylePreset(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STYLE_PRESETS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <Label className="text-xs">
                    {stylePreset === "custom" ? "Your style instruction" : "Prompt (preview)"}
                  </Label>
                  <Textarea
                    value={stylePreset === "custom" ? customPrompt : (STYLE_PRESETS.find((p) => p.id === stylePreset)?.prompt || "")}
                    onChange={(e) => stylePreset === "custom" && setCustomPrompt(e.target.value)}
                    readOnly={stylePreset !== "custom"}
                    rows={3}
                    className="mt-1 text-xs"
                    placeholder={stylePreset === "custom" ? "e.g. Transform into an impressionist painting with visible brushstrokes and soft light..." : undefined}
                  />
                </div>
                <div>
                  <Label className="text-xs">Output resolution</Label>
                  <Select value={resolution} onValueChange={(v) => v && setResolution(v as "720p" | "1080p")}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p (faster)</SelectItem>
                      <SelectItem value="1080p">1080p (higher quality)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={generating || !file}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              size="lg"
            >
              {generating ? `Restyling... (${mm}:${ss})` : `Restyle Video (${VID2VID_CREDITS} credits)`}
            </Button>

            {generating && (
              <p className="text-xs text-amber-400 text-center">
                ⏳ WAN 2.7 takes about 5–8 minutes. Please keep this tab open — the video will appear automatically when ready.
              </p>
            )}
          </div>

          {/* Right: result */}
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Restyled output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full aspect-video rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                {resultUrl ? (
                  <video
                    src={resultUrl}
                    controls
                    loop
                    autoPlay
                    muted
                    className="w-full h-full object-contain bg-black"
                  />
                ) : generating ? (
                  <div className="flex flex-col items-center justify-center space-y-3 text-center px-6">
                    <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Restyling your video…</p>
                    <p className="text-xl font-mono tabular-nums">{mm}:{ss}</p>
                    <p className="text-[10px] text-muted-foreground max-w-xs">
                      WAN 2.7 is processing frame-by-frame. Most jobs finish in 5–8 minutes.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center px-4">
                    Your restyled video will appear here.
                  </p>
                )}
              </div>
              {resultUrl && (
                <div className="flex gap-2 mt-3 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      import("@/lib/utils").then((m) => m.downloadFile(resultUrl, "egaku-vid2vid.mp4"));
                    }}
                  >
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setResultUrl(null);
                      setFile(null);
                      setFilePreview(null);
                      setFileDuration(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Start over
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
