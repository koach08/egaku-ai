"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

const MAX_IMAGE_MB = 8;
const MAX_REFS = 5;
const CHARACTER_VIDEO_CREDITS = 100;

type RefType = "subject" | "background";

interface ReferenceSlot {
  id: string;
  file: File | null;
  preview: string | null;
  refName: string;
  type: RefType;
}

function newSlot(defaultName: string, type: RefType = "subject"): ReferenceSlot {
  return {
    id: Math.random().toString(36).slice(2),
    file: null,
    preview: null,
    refName: defaultName,
    type,
  };
}

const RESOLUTIONS = [
  { value: "360p", label: "360p · Fast" },
  { value: "540p", label: "540p" },
  { value: "720p", label: "720p · Recommended" },
  { value: "1080p", label: "1080p · HD" },
];

const ASPECTS = [
  { value: "16:9", label: "16:9 Landscape" },
  { value: "9:16", label: "9:16 Portrait" },
  { value: "1:1", label: "1:1 Square" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
];

const fileToDataUrl = (f: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });

export default function CharacterVideoPage() {
  const { user, session, loading: authLoading } = useAuth();

  const [slots, setSlots] = useState<ReferenceSlot[]>([
    newSlot("char1", "subject"),
  ]);
  const [prompt, setPrompt] = useState<string>("");
  const [resolution, setResolution] = useState<string>("720p");
  const [duration, setDuration] = useState<number>(5);
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [generateAudio, setGenerateAudio] = useState<boolean>(false);
  const [nsfw, setNsfw] = useState<boolean>(false);

  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateSlot = (id: string, patch: Partial<ReferenceSlot>) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const onFileChange = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
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
    updateSlot(id, { file: f, preview: URL.createObjectURL(f) });
    setResultUrl(null);
  };

  const addSlot = () => {
    if (slots.length >= MAX_REFS) {
      toast.error(`You can only add up to ${MAX_REFS} references.`);
      return;
    }
    const nextName = `char${slots.length + 1}`;
    setSlots((prev) => [...prev, newSlot(nextName, "subject")]);
  };

  const removeSlot = (id: string) => {
    if (slots.length <= 1) {
      toast.error("At least one reference is required.");
      return;
    }
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const validRefNames = () => {
    const names = slots.map((s) => s.refName.trim());
    const empty = names.some((n) => n.length === 0);
    if (empty) return { ok: false, reason: "Every reference needs a name" };
    const invalid = names.find((n) => !/^[A-Za-z0-9_]+$/.test(n));
    if (invalid) return { ok: false, reason: `"${invalid}" must use only letters, numbers, underscore` };
    const unique = new Set(names);
    if (unique.size !== names.length) return { ok: false, reason: "Reference names must be unique" };
    return { ok: true as const };
  };

  const handleGenerate = async () => {
    if (!session) {
      toast.error("Please sign in first.");
      return;
    }
    if (slots.some((s) => !s.file)) {
      toast.error("Please upload an image for every reference, or remove empty slots.");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Please describe what happens in the scene.");
      return;
    }
    const check = validRefNames();
    if (!check.ok) {
      toast.error(check.reason);
      return;
    }

    setGenerating(true);
    setResultUrl(null);
    setElapsed(0);
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);

    try {
      const references = await Promise.all(
        slots.map(async (s) => ({
          image: await fileToDataUrl(s.file as File),
          ref_name: s.refName.trim(),
          type: s.type,
        })),
      );

      // Direct fetch — this job can run 2-5 min; bypass the retry-on-5xx helper.
      const res = await fetch(`${API_BASE}/generate/character-video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          references,
          resolution,
          duration,
          aspect_ratio: aspectRatio,
          generate_audio: generateAudio,
          nsfw,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `Request failed (${res.status})`);
      }
      const data = await res.json();
      if (data.result_url) {
        setResultUrl(data.result_url);
        toast.success("Your character video is ready!");
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
          <h1 className="text-3xl font-bold">Character Reference Video</h1>
          <p className="text-muted-foreground">
            Upload 1-3 character images. Get a video where they stay consistent across every frame.
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
  const subjectSlots = slots.filter((s) => s.type === "subject");
  const backgroundSlots = slots.filter((s) => s.type === "background");
  const tooManySubjects = subjectSlots.length > 3;
  const tooManyBackgrounds = backgroundSlots.length > 2;

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Character Reference Video</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Consistent characters across the whole video. Upload 1-3 reference images,
            describe your scene using <code className="px-1 py-0.5 rounded bg-muted">@refname</code> tags,
            and let PixVerse C1 keep them on-model in every frame.
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by fal-ai / pixverse / c1 reference-to-video.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: inputs */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">1. Reference images</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSlot}
                  disabled={slots.length >= MAX_REFS || generating}
                >
                  + Add reference
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[11px] text-muted-foreground">
                  Use up to 3 subjects (people, pets, products) and up to 2 backgrounds.
                  Each reference gets a short name — mention it in the prompt as <code>@name</code>.
                </p>
                {(tooManySubjects || tooManyBackgrounds) && (
                  <p className="text-[11px] text-amber-400">
                    {tooManySubjects && "Tip: PixVerse works best with at most 3 subjects. "}
                    {tooManyBackgrounds && "Tip: PixVerse works best with at most 2 backgrounds."}
                  </p>
                )}

                <div className="space-y-3">
                  {slots.map((slot, idx) => (
                    <div
                      key={slot.id}
                      className="rounded-md border border-muted p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          Reference #{idx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSlot(slot.id)}
                          disabled={slots.length <= 1 || generating}
                          className="text-xs text-red-400 hover:text-red-300 h-7 px-2"
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <label className="col-span-2 space-y-1">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Ref name (used as @name)
                          </span>
                          <input
                            type="text"
                            value={slot.refName}
                            onChange={(e) =>
                              updateSlot(slot.id, {
                                refName: e.target.value.replace(/\s+/g, ""),
                              })
                            }
                            maxLength={20}
                            placeholder="alice"
                            className="w-full rounded-md border border-muted bg-background px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Type
                          </span>
                          <select
                            value={slot.type}
                            onChange={(e) =>
                              updateSlot(slot.id, { type: e.target.value as RefType })
                            }
                            className="w-full rounded-md border border-muted bg-background px-2 py-1.5 text-sm"
                          >
                            <option value="subject">Subject</option>
                            <option value="background">Background</option>
                          </select>
                        </label>
                      </div>

                      <input
                        ref={(el) => {
                          fileInputs.current[slot.id] = el;
                        }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/*"
                        onChange={(e) => onFileChange(slot.id, e)}
                        className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/30 cursor-pointer"
                      />
                      {slot.preview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={slot.preview}
                          alt={slot.refName}
                          className="w-full rounded-md bg-black object-contain"
                          style={{ maxHeight: 200 }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">2. Describe the scene</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder="@alice walks into the café and smiles at @dog who is wagging its tail by the window, warm afternoon light"
                  className="w-full rounded-md border border-muted bg-background px-3 py-2 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Mention each reference by its name using <code>@refname</code>.
                  Example: <code>@alice walks into the café with @dog</code>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">3. Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Resolution
                    </span>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full rounded-md border border-muted bg-background px-2 py-1.5 text-sm"
                    >
                      {RESOLUTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Aspect ratio
                    </span>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full rounded-md border border-muted bg-background px-2 py-1.5 text-sm"
                    >
                      {ASPECTS.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Duration
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {duration}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={15}
                    step={1}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 text-sm">
                  <span>Generate audio (ambient SFX)</span>
                  <input
                    type="checkbox"
                    checked={generateAudio}
                    onChange={(e) => setGenerateAudio(e.target.checked)}
                  />
                </label>

                <label className="flex items-center justify-between gap-3 text-sm pt-2 border-t border-muted">
                  <span>
                    <span className="font-medium text-pink-400">18+ NSFW mode</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">
                      Uses 1st subject ref only (Wan 2.6, NSFW-friendly).
                      Multi-reference NSFW not yet available.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={nsfw}
                    onChange={(e) => setNsfw(e.target.checked)}
                  />
                </label>
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={generating || slots.some((s) => !s.file) || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              size="lg"
            >
              {generating
                ? `Generating... (${mm}:${ss})`
                : `Generate Character Video (${CHARACTER_VIDEO_CREDITS} credits)`}
            </Button>

            {generating && (
              <p className="text-xs text-amber-400 text-center">
                PixVerse C1 usually takes 2-5 minutes. Keep this tab open — the video
                will appear automatically when ready.
              </p>
            )}
          </div>

          {/* Right: result */}
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Video output</CardTitle>
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
                    <p className="text-sm text-muted-foreground">
                      Keeping your characters consistent across every frame…
                    </p>
                    <p className="text-xl font-mono tabular-nums">
                      {mm}:{ss}
                    </p>
                    <p className="text-[10px] text-muted-foreground max-w-xs">
                      PixVerse C1 is rendering. Most jobs finish in 2-5 minutes.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center px-4">
                    Your character video will appear here.
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
                        m.downloadFile(resultUrl, "egaku-character-video.mp4"),
                      );
                    }}
                  >
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setResultUrl(null);
                      setSlots([newSlot("char1", "subject")]);
                      setPrompt("");
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
