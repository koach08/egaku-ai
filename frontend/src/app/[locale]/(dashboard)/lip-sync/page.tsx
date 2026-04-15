"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

const MAX_VIDEO_MB = 25;
const MAX_AUDIO_MB = 10;
const LIPSYNC_CREDITS = 80;

const SYNC_MODES = [
  { id: "cut_off", label: "Cut off (default) — trim to shortest input" },
  { id: "loop", label: "Loop — loop video to match audio length" },
  { id: "bounce", label: "Bounce — ping-pong video to match audio" },
  { id: "silence", label: "Silence — pad audio with silence" },
  { id: "remap", label: "Remap — stretch/compress to match" },
];

export default function LipSyncPage() {
  const { user, session, loading: authLoading } = useAuth();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);

  const [syncMode, setSyncMode] = useState<string>("cut_off");

  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const onVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setVideoFile(f);
    const url = URL.createObjectURL(f);
    setVideoPreview(url);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    v.onloadedmetadata = () => {
      setVideoDuration(v.duration);
      if (v.duration < 2 || v.duration > 30) {
        toast.warning(`Video is ${v.duration.toFixed(1)}s. Lip sync works best with 2–30 second clips.`);
      }
    };
    setResultUrl(null);
  };

  const onAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("audio/")) {
      toast.error("Please select an audio file (MP3, WAV, or M4A)");
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
    if (!videoFile || !audioFile || !session) {
      toast.error("Please upload both a video and an audio file");
      return;
    }

    setGenerating(true);
    setResultUrl(null);
    setElapsed(0);
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);

    try {
      const [videoDataUrl, audioDataUrl] = await Promise.all([
        fileToDataUrl(videoFile),
        fileToDataUrl(audioFile),
      ]);

      // Direct fetch (not api.lipsync) to avoid retry-on-5xx for long jobs (3-8 min typical).
      const res = await fetch(`${API_BASE}/generate/lipsync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          video: videoDataUrl,
          audio: audioDataUrl,
          sync_mode: syncMode,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `Request failed (${res.status})`);
      }
      const data = await res.json();
      if (data.result_url) {
        setResultUrl(data.result_url);
        toast.success("Your lip-synced video is ready!");
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
          <h1 className="text-3xl font-bold">Lip Sync</h1>
          <p className="text-muted-foreground">
            Perfect for VTubers, dubbing, voiceovers. Upload a face video + any audio, and watch them speak it.
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
          <h1 className="text-3xl font-bold">Lip Sync</h1>
          <p className="text-muted-foreground">
            Perfect for VTubers, dubbing, voiceovers. Upload a face video + any audio, and watch them speak it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: inputs */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">1. Upload the face video</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/*"
                  onChange={onVideoChange}
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/30 cursor-pointer"
                />
                {videoFile && (
                  <div className="text-xs text-muted-foreground">
                    <div>{videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</div>
                    {videoDuration !== null && (
                      <div>Duration: {videoDuration.toFixed(1)}s {videoDuration >= 2 && videoDuration <= 30 ? "✓" : "(outside 2–30s sweet spot)"}</div>
                    )}
                  </div>
                )}
                {videoPreview && (
                  <video
                    src={videoPreview}
                    controls
                    muted
                    className="w-full rounded-md bg-black"
                    style={{ maxHeight: 200 }}
                  />
                )}
                <p className="text-[10px] text-muted-foreground">MP4/MOV, 2–30 seconds, max {MAX_VIDEO_MB} MB. Works best with a clear, front-facing face.</p>
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
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/x-m4a,audio/mp4,audio/*"
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
                <p className="text-[10px] text-muted-foreground">MP3/WAV/M4A, max {MAX_AUDIO_MB} MB.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">3. Sync mode</CardTitle>
              </CardHeader>
              <CardContent>
                <Label className="text-xs">How should mismatched lengths be handled?</Label>
                <Select value={syncMode} onValueChange={(v) => v && setSyncMode(v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SYNC_MODES.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={generating || !videoFile || !audioFile}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              size="lg"
            >
              {generating ? `Syncing... (${mm}:${ss})` : `Sync Lips (${LIPSYNC_CREDITS} credits)`}
            </Button>

            {generating && (
              <p className="text-xs text-amber-400 text-center">
                ⏳ Lip sync takes about 3–8 minutes. Please keep this tab open — the video will appear automatically when ready.
              </p>
            )}
          </div>

          {/* Right: result */}
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Lip-synced output</CardTitle>
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
                    <p className="text-sm text-muted-foreground">Syncing lips to audio…</p>
                    <p className="text-xl font-mono tabular-nums">{mm}:{ss}</p>
                    <p className="text-[10px] text-muted-foreground max-w-xs">
                      Sync v3 is analyzing the face and aligning mouth shapes. Most jobs finish in 3–8 minutes.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center px-4">
                    Your lip-synced video will appear here.
                  </p>
                )}
              </div>
              {resultUrl && (
                <div className="flex gap-2 mt-3 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      import("@/lib/utils").then((m) => m.downloadFile(resultUrl, "egaku-lipsync.mp4"));
                    }}
                  >
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setResultUrl(null);
                      setVideoFile(null);
                      setVideoPreview(null);
                      setVideoDuration(null);
                      setAudioFile(null);
                      setAudioPreview(null);
                      if (videoInputRef.current) videoInputRef.current.value = "";
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
