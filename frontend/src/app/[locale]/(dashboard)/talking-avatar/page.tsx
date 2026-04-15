"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

const MAX_IMAGE_MB = 10;
const MAX_AUDIO_MB = 10;
const AVATAR_CREDITS = 60;

export default function TalkingAvatarPage() {
  const { user, session, loading: authLoading } = useAuth();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please select an image (JPG, PNG, or WebP)");
      return;
    }
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image is too large. Max ${MAX_IMAGE_MB} MB.`);
      return;
    }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    setResultUrl(null);
  };

  const onAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("audio/")) {
      toast.error("Please select an audio file (MP3 or WAV)");
      return;
    }
    if (f.size > MAX_AUDIO_MB * 1024 * 1024) {
      toast.error(`Audio is too large. Max ${MAX_AUDIO_MB} MB.`);
      return;
    }
    setAudioFile(f);
    setAudioPreview(URL.createObjectURL(f));
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
    if (!imageFile || !audioFile || !session) {
      toast.error("Please upload both a character image and an audio file");
      return;
    }

    setGenerating(true);
    setResultUrl(null);
    setElapsed(0);
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);

    try {
      const [imageDataUrl, audioDataUrl] = await Promise.all([
        fileToDataUrl(imageFile),
        fileToDataUrl(audioFile),
      ]);

      // Direct fetch to avoid retry-on-5xx for long jobs (3-5 min typical).
      const res = await fetch(`${API_BASE}/generate/talking-avatar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          image: imageDataUrl,
          audio: audioDataUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `Request failed (${res.status})`);
      }
      const data = await res.json();
      if (data.result_url) {
        setResultUrl(data.result_url);
        toast.success("Your talking avatar is ready!");
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
          <h1 className="text-3xl font-bold">Talking Avatar</h1>
          <p className="text-muted-foreground">
            Turn any photo into a talking avatar. Upload a character image + audio, get a video of them speaking.
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
          <h1 className="text-3xl font-bold">Talking Avatar</h1>
          <p className="text-muted-foreground">
            Turn any photo into a talking avatar. Upload a character image + audio, get a video of them speaking.
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by OmniHuman v1.5 (ByteDance).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: inputs */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">1. Upload the character image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  onChange={onImageChange}
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/30 cursor-pointer"
                />
                {imageFile && (
                  <div className="text-xs text-muted-foreground">
                    {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(1)} MB)
                  </div>
                )}
                {imagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Character"
                    className="w-full rounded-md bg-black object-contain"
                    style={{ maxHeight: 280 }}
                  />
                )}
                <p className="text-[10px] text-muted-foreground">JPG/PNG/WebP, max {MAX_IMAGE_MB} MB. Works best with a clear, front-facing portrait or character.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">2. Upload the audio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/*"
                  onChange={onAudioChange}
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/30 cursor-pointer"
                />
                {audioFile && (
                  <div className="text-xs text-muted-foreground">
                    {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(1)} MB)
                  </div>
                )}
                {audioPreview && (
                  <audio src={audioPreview} controls className="w-full" />
                )}
                <p className="text-[10px] text-muted-foreground">MP3/WAV, max {MAX_AUDIO_MB} MB. 60 credits covers ~10 seconds.</p>
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={generating || !imageFile || !audioFile}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              size="lg"
            >
              {generating ? `Generating... (${mm}:${ss})` : `Generate Talking Avatar (${AVATAR_CREDITS} credits)`}
            </Button>

            {generating && (
              <p className="text-xs text-amber-400 text-center">
                ⏳ OmniHuman takes about 3–5 minutes. Please keep this tab open — the video will appear automatically when ready.
              </p>
            )}
          </div>

          {/* Right: result */}
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Talking avatar output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full aspect-video rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                {resultUrl ? (
                  <video
                    src={resultUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain bg-black"
                  />
                ) : generating ? (
                  <div className="flex flex-col items-center justify-center space-y-3 text-center px-6">
                    <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Bringing your character to life…</p>
                    <p className="text-xl font-mono tabular-nums">{mm}:{ss}</p>
                    <p className="text-[10px] text-muted-foreground max-w-xs">
                      OmniHuman is animating the face, body, and lip movements. Most jobs finish in 3–5 minutes.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center px-4">
                    Your talking avatar video will appear here.
                  </p>
                )}
              </div>
              {resultUrl && (
                <div className="flex gap-2 mt-3 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      import("@/lib/utils").then((m) => m.downloadFile(resultUrl, "egaku-talking-avatar.mp4"));
                    }}
                  >
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setResultUrl(null);
                      setImageFile(null);
                      setImagePreview(null);
                      setAudioFile(null);
                      setAudioPreview(null);
                      if (imageInputRef.current) imageInputRef.current.value = "";
                      if (audioInputRef.current) audioInputRef.current.value = "";
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
