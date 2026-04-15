"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

const MAX_AUDIO_MB = 10;
const MAX_CHARS = 5000;

const EMOTIVE_TAGS = [
  "<laugh>",
  "<sigh>",
  "<whisper>",
  "<gasp>",
  "<cry>",
  "<cough>",
];

const fileToDataUrl = (f: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });

function calcCredits(textLen: number): number {
  if (textLen <= 500) return 20;
  const extraBlocks = Math.ceil((textLen - 500) / 500);
  return 20 + extraBlocks * 10;
}

export default function VoiceClonePage() {
  const { user, session, loading: authLoading } = useAuth();

  const [refFile, setRefFile] = useState<File | null>(null);
  const [refPreviewUrl, setRefPreviewUrl] = useState<string | null>(null);

  const [text, setText] = useState<string>("");
  const [exaggeration, setExaggeration] = useState<number>(0.5);
  const [temperature, setTemperature] = useState<number>(0.8);
  const [cfg, setCfg] = useState<number>(0.5);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Clean up object URL when ref file changes
  useEffect(() => {
    return () => {
      if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
    };
  }, [refPreviewUrl]);

  const onRefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
    setRefFile(f);
    setRefPreviewUrl(URL.createObjectURL(f));
    setResultUrl(null);
  };

  const clearRef = () => {
    if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
    setRefFile(null);
    setRefPreviewUrl(null);
  };

  const insertTag = (tag: string) => {
    const el = textareaRef.current;
    if (!el) {
      setText((t) => `${t}${t.endsWith(" ") || t === "" ? "" : " "}${tag} `);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const insert = `${before.endsWith(" ") || before === "" ? "" : " "}${tag} `;
    const next = before + insert + after;
    if (next.length > MAX_CHARS) {
      toast.error(`Text would exceed ${MAX_CHARS} characters.`);
      return;
    }
    setText(next);
    // Restore caret
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      const pos = (before + insert).length;
      textareaRef.current.selectionStart = pos;
      textareaRef.current.selectionEnd = pos;
      textareaRef.current.focus();
    });
  };

  const credits = calcCredits(text.length);

  const handleGenerate = async () => {
    if (!session) {
      toast.error("Please sign in first.");
      return;
    }
    if (!text.trim()) {
      toast.error("Please enter some text.");
      return;
    }
    if (text.length > MAX_CHARS) {
      toast.error(`Text must be under ${MAX_CHARS} characters.`);
      return;
    }

    setGenerating(true);
    setResultUrl(null);
    setElapsed(0);
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);

    try {
      let reference_audio = "";
      if (refFile) {
        reference_audio = await fileToDataUrl(refFile);
      }

      // Direct fetch — this job can take 15-60 seconds; bypass the retry-on-5xx helper.
      const res = await fetch(`${API_BASE}/generate/voice-clone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text: text,
          reference_audio,
          exaggeration,
          temperature,
          cfg,
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
        toast.success("Your voice clone is ready!");
      } else {
        toast.error("Generation finished but returned no audio URL");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
      clearInterval(timer);
    }
  };

  const resetAll = () => {
    setResultUrl(null);
    setText("");
    clearRef();
    setExaggeration(0.5);
    setTemperature(0.8);
    setCfg(0.5);
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-3xl font-bold">Voice Cloning</h1>
          <p className="text-muted-foreground">
            Clone any voice. Upload a 5-10 sec sample, type your text, and hear
            them say it.
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
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Voice Cloning</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Clone any voice. Upload a 5-10 second sample, type the text, and
            get audio of that voice saying it.
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by fal-ai / chatterbox text-to-speech.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: inputs */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">1. Reference voice (optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  Upload a 5-10 second audio sample of the voice you want to
                  clone. Leave empty to use the default voice.
                </p>
                <input
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/*"
                  onChange={onRefChange}
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/30 cursor-pointer"
                />
                {refPreviewUrl && (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <audio src={refPreviewUrl} controls className="w-full" />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate">{refFile?.name}</span>
                      <button
                        type="button"
                        onClick={clearRef}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">
                  MP3, WAV, or M4A — max {MAX_AUDIO_MB} MB.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">2. Text to speak</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                  maxLength={MAX_CHARS}
                  rows={6}
                  placeholder="Type what you want the voice to say. Add emotive tags like <laugh> or <whisper> for more expression."
                  className="w-full rounded-md border border-muted bg-background px-3 py-2 text-sm"
                />
                <div className="flex flex-wrap gap-1.5">
                  {EMOTIVE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertTag(tag)}
                      className="text-[11px] px-2 py-1 rounded-md border border-muted bg-background hover:bg-purple-600/20 hover:border-purple-500/40 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Emotive tags help Chatterbox read with feeling.
                  </span>
                  <span>
                    {text.length} / {MAX_CHARS}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                className="pb-2 flex flex-row items-center justify-between cursor-pointer"
                onClick={() => setShowAdvanced((v) => !v)}
              >
                <CardTitle className="text-sm">3. Advanced settings</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {showAdvanced ? "Hide ▲" : "Show ▼"}
                </span>
              </CardHeader>
              {showAdvanced && (
                <CardContent className="space-y-4">
                  <label className="block space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Exaggeration
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {exaggeration.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={exaggeration}
                      onChange={(e) => setExaggeration(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Higher = more expressive. Default 0.5.
                    </p>
                  </label>

                  <label className="block space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Temperature
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {temperature.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={2.0}
                      step={0.05}
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Higher = more variation between takes. Default 0.8.
                    </p>
                  </label>

                  <label className="block space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        CFG
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {cfg.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      value={cfg}
                      onChange={(e) => setCfg(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      How strictly it follows the reference voice. Default 0.5.
                    </p>
                  </label>
                </CardContent>
              )}
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={generating || !text.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              size="lg"
            >
              {generating
                ? `Generating... (${mm}:${ss})`
                : `Generate Voice (${credits} credits)`}
            </Button>

            {generating && (
              <p className="text-xs text-amber-400 text-center">
                Chatterbox usually takes 15-60 seconds. Keep this tab open —
                the audio will appear automatically when ready.
              </p>
            )}

            <Card className="border-dashed bg-purple-950/10">
              <CardContent className="pt-4 text-[11px] text-muted-foreground space-y-1.5">
                <p className="font-medium text-purple-300">
                  Tips for best results
                </p>
                <p>
                  • Upload clear, noise-free audio of a single speaker — no
                  background music or multiple voices.
                </p>
                <p>
                  • Longer samples (10 seconds) give better cloning than
                  shorter ones.
                </p>
                <p>
                  • Keep the speaking style consistent with what you want
                  generated.
                </p>
                <p>
                  • Use emotive tags like <code>&lt;laugh&gt;</code>{" "}
                  <code>&lt;whisper&gt;</code> inline to add expression.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right: result */}
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Audio output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full min-h-[220px] rounded-lg bg-muted overflow-hidden flex items-center justify-center p-6">
                {resultUrl ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <audio
                    src={resultUrl}
                    controls
                    autoPlay
                    className="w-full"
                  />
                ) : generating ? (
                  <div className="flex flex-col items-center justify-center space-y-3 text-center px-6">
                    <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Cloning the voice and generating audio…
                    </p>
                    <p className="text-xl font-mono tabular-nums">
                      {mm}:{ss}
                    </p>
                    <p className="text-[10px] text-muted-foreground max-w-xs">
                      Chatterbox is rendering. Most jobs finish in 15-60
                      seconds.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center px-4">
                    Your generated audio will appear here.
                  </p>
                )}
              </div>
              {resultUrl && (
                <div className="flex gap-2 mt-3 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      import("@/lib/utils").then((m) =>
                        m.downloadFile(resultUrl, "egaku-voice-clone.wav"),
                      );
                    }}
                  >
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAll}
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
