"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/header";

const MIN_IMAGES = 4;
const MAX_IMAGES = 20;
const MAX_IMAGE_MB = 5;
const TRAINING_CREDITS = 300;

type TrainingMode = "subject" | "style";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function LoraTrainPage() {
  const { user, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [triggerWord, setTriggerWord] = useState("");
  const [mode, setMode] = useState<TrainingMode>("subject");
  const [steps, setSteps] = useState(1000);
  const [submitting, setSubmitting] = useState(false);

  const validTriggerWord = /^[A-Za-z0-9_-]{1,32}$/.test(triggerWord);

  const handleFilesSelected = async (chosen: FileList | null) => {
    if (!chosen || chosen.length === 0) return;
    const next: File[] = [...files];
    for (const f of Array.from(chosen)) {
      if (next.length >= MAX_IMAGES) break;
      if (!f.type.startsWith("image/")) {
        toast.warning(`Skipped: ${f.name} is not an image`);
        continue;
      }
      if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
        toast.warning(`Skipped: ${f.name} exceeds ${MAX_IMAGE_MB} MB`);
        continue;
      }
      next.push(f);
    }
    setFiles(next);
    const urls = await Promise.all(next.map((f) => fileToDataUrl(f)));
    setPreviews(urls);
  };

  const removeImage = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!session) {
      toast.error("Please sign in first");
      return;
    }
    if (files.length < MIN_IMAGES || files.length > MAX_IMAGES) {
      toast.error(`Please upload ${MIN_IMAGES}-${MAX_IMAGES} images`);
      return;
    }
    if (!name.trim()) {
      toast.error("Please name your model");
      return;
    }
    if (!validTriggerWord) {
      toast.error("Trigger word: letters, numbers, _ or - only (no spaces)");
      return;
    }

    setSubmitting(true);
    try {
      const imageDataUrls = previews; // already base64 data URLs
      const res = (await api.trainLora(session.access_token, {
        name: name.trim(),
        trigger_word: triggerWord.trim(),
        images: imageDataUrls,
        steps,
        is_style: mode === "style",
        nsfw: false,
      })) as { id: string; message: string };
      toast.success(res.message || "Training started!");
      router.push("/my-loras");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Training failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Train Your Own AI Model
          </h1>
          <p className="text-muted-foreground">
            Upload 4-20 photos, get a custom AI model. Generate unlimited new images of your subject.
          </p>
          <Link href="/register">
            <Button size="lg">Start Free</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-block text-[10px] tracking-wider uppercase text-purple-400 border border-purple-500/40 rounded-full px-3 py-1">
            NEW · Pro-tier feature
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Train your own AI model
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            15 minutes of training, then unlimited future generations. Works for people, pets,
            objects, or artistic styles.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Left column — uploader + form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Training Images ({files.length}/{MAX_IMAGES})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFilesSelected(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                >
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-sm text-muted-foreground">
                    Drag & drop, or click to add images
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG / PNG / WebP · up to {MAX_IMAGE_MB} MB each · {MIN_IMAGES}-{MAX_IMAGES} total
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                </div>

                {previews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {previews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded overflow-hidden bg-muted group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`training-${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Model Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="lora-name">Model name</Label>
                  <Input
                    id="lora-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My dog Max"
                    maxLength={64}
                  />
                  <p className="text-xs text-muted-foreground">
                    Just a label for you — shows up in your model list.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trigger-word">Trigger word</Label>
                  <Input
                    id="trigger-word"
                    value={triggerWord}
                    onChange={(e) => setTriggerWord(e.target.value.replace(/\s/g, ""))}
                    placeholder="maxdog"
                    maxLength={32}
                  />
                  <p className="text-xs text-muted-foreground">
                    A unique word to invoke your model. Letters / numbers / _ / - only, no spaces.
                    Use an invented word (e.g. <code className="text-purple-300">taro_style</code>)
                    so it doesn&apos;t collide with real words.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Training mode</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode("subject")}
                      className={`p-3 text-sm rounded border transition-colors ${
                        mode === "subject"
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-muted hover:border-purple-500/30"
                      }`}
                    >
                      <div className="font-medium">Subject</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        A specific person, pet, or object
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("style")}
                      className={`p-3 text-sm rounded border transition-colors ${
                        mode === "style"
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-muted hover:border-purple-500/30"
                      }`}
                    >
                      <div className="font-medium">Style</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        An artistic look or aesthetic
                      </div>
                    </button>
                  </div>
                </div>

                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Advanced — training steps
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Steps</Label>
                      <span className="text-xs text-muted-foreground">{steps}</span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={3000}
                      step={100}
                      value={steps}
                      onChange={(e) => setSteps(parseInt(e.target.value, 10))}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      More steps = stronger learning, but risk of overfitting. 1000 is a good default.
                    </p>
                  </div>
                </details>
              </CardContent>
            </Card>
          </div>

          {/* Right column — summary + submit */}
          <div className="space-y-6 lg:sticky lg:top-24 self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ready to train?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Images</span>
                  <span className={files.length >= MIN_IMAGES ? "" : "text-red-400"}>
                    {files.length} / {MIN_IMAGES}+
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <span className="capitalize">{mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Steps</span>
                  <span>{steps}</span>
                </div>
                <div className="border-t border-muted pt-3 flex justify-between font-medium">
                  <span>Cost</span>
                  <span className="text-purple-400">{TRAINING_CREDITS} credits</span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={
                    submitting ||
                    files.length < MIN_IMAGES ||
                    !name.trim() ||
                    !validTriggerWord
                  }
                  onClick={handleSubmit}
                >
                  {submitting ? "Starting training…" : `Start Training (${TRAINING_CREDITS} credits)`}
                </Button>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Training runs for about 5-15 minutes.</p>
                  <p>
                    • You can leave this page — check progress anytime at{" "}
                    <Link href="/my-loras" className="underline hover:text-purple-400">
                      My Models
                    </Link>
                    .
                  </p>
                  <p>• Credits are refunded automatically if training fails.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tips for best results</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">Variety:</strong> Use different angles,
                  lighting, and backgrounds.
                </p>
                <p>
                  <strong className="text-foreground">Quality:</strong> Sharp, well-lit photos
                  work much better than blurry ones.
                </p>
                <p>
                  <strong className="text-foreground">Consistency:</strong> All photos should be of
                  the same subject (for Subject mode) or the same visual style (for Style mode).
                </p>
                <p>
                  <strong className="text-foreground">10-15 photos</strong> is the sweet spot for
                  most subjects.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
