"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2Icon, FilmIcon } from "lucide-react";

// Quick model picker — mirrors VIDEO_MODELS_I2V in /generate page
const MODELS = [
  { id: "fal_ltx_i2v", name: "LTX Fast", credits: 5, maxDuration: 5 },
  { id: "fal_wan_i2v", name: "Wan 2.1", credits: 10, maxDuration: 5 },
  { id: "fal_kling_i2v", name: "Kling v2 (HD)", credits: 15, maxDuration: 10 },
  { id: "fal_kling25_i2v", name: "Kling 2.5 Pro (Cinema)", credits: 25, maxDuration: 10 },
] as const;

type ModelId = (typeof MODELS)[number]["id"];

interface JobStatus {
  status: "queued" | "processing" | "completed" | "failed";
  result_url?: string | null;
  error?: string | null;
  progress?: number | null;
  gallery_id?: string | null;
}

interface AnimateModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (videoUrl: string, galleryId?: string) => void;
}

export function AnimateModal({
  imageUrl,
  isOpen,
  onClose,
  onSuccess,
}: AnimateModalProps) {
  const { session } = useAuth();
  const router = useRouter();

  const [model, setModel] = useState<ModelId>("fal_ltx_i2v");
  const [duration, setDuration] = useState(5);
  const [mode, setMode] = useState<"animate" | "reimagine">("animate");
  const [prompt, setPrompt] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedModel = MODELS.find((m) => m.id === model) ?? MODELS[0];
  const maxDuration = selectedModel.maxDuration;
  const effectiveDuration = Math.min(duration, maxDuration);

  // Reset state when modal opens / closes
  useEffect(() => {
    if (!isOpen) {
      stopTimers();
      setSubmitting(false);
      setElapsed(0);
      setPrompt("");
      setMode("animate");
      setDuration(5);
      setModel("fal_ltx_i2v");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => stopTimers();
  }, []);

  function stopTimers() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function formatElapsed(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function startElapsedTimer() {
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }

  function pollUntilDone(jobId: string): Promise<JobStatus> {
    return new Promise((resolve, reject) => {
      if (!session) {
        reject(new Error("Not authenticated"));
        return;
      }
      pollRef.current = setInterval(async () => {
        try {
          const status: JobStatus = await api.getJobStatus(
            session.access_token,
            jobId
          );
          if (status.status === "completed" || status.status === "failed") {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            resolve(status);
          }
        } catch {
          // Network blip — keep polling
        }
      }, 3000);
    });
  }

  async function handleSubmit() {
    if (!session) {
      toast.error("Sign in to animate images");
      return;
    }
    setSubmitting(true);
    startElapsedTimer();

    try {
      // Direct fetch (no 5xx retries — this is a long-running call)
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";
      const res = await fetch(`${apiBase}/generate/img2vid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          image: imageUrl,
          model,
          duration: effectiveDuration,
          mode,
          prompt: prompt.trim() || undefined,
          frame_count: Math.min(effectiveDuration * 8, 32),
          fps: 8,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // FastAPI 422 returns detail as array of objects
        const rawDetail = err?.detail;
        const detail = typeof rawDetail === "string"
          ? rawDetail
          : Array.isArray(rawDetail)
            ? rawDetail.map((e: Record<string, unknown>) => e.msg || String(e)).join(", ")
            : `Request failed (${res.status})`;
        if (res.status === 402) {
          toast.error("Not enough credits. Upgrade your plan to continue.", {
            action: {
              label: "Upgrade",
              onClick: () => (window.location.href = "/settings"),
            },
          });
        } else if (res.status === 403) {
          toast.error(detail || "This model requires a higher plan.");
        } else {
          toast.error(detail, { duration: 10000 });
        }
        stopTimers();
        setSubmitting(false);
        return;
      }

      const data = await res.json();

      // Synchronous completion (fal.ai path)
      let finalStatus: JobStatus = {
        status: data.status,
        result_url: data.result_url,
        gallery_id: data.gallery_id,
        error: data.error,
      };

      // Otherwise poll until finished
      if (data.status === "queued" || data.status === "processing") {
        toast.info("Generating video — this can take 1-5 minutes…");
        finalStatus = await pollUntilDone(data.job_id);
      }

      stopTimers();

      if (finalStatus.status === "completed") {
        const videoUrl = resolveResultUrl(finalStatus.result_url ?? undefined);
        toast.success("Video ready!", {
          action: finalStatus.gallery_id
            ? {
                label: "View",
                onClick: () =>
                  router.push(`/gallery/${finalStatus.gallery_id}`),
              }
            : videoUrl
              ? {
                  label: "Open",
                  onClick: () => window.open(videoUrl, "_blank"),
                }
              : undefined,
        });
        if (videoUrl && onSuccess) {
          onSuccess(videoUrl, finalStatus.gallery_id ?? undefined);
        }
        if (finalStatus.gallery_id) {
          router.push(`/gallery/${finalStatus.gallery_id}`);
        }
        onClose();
      } else {
        toast.error(finalStatus.error || "Video generation failed");
        setSubmitting(false);
      }
    } catch (err: unknown) {
      stopTimers();
      const msg = err instanceof Error ? err.message : "Generation failed";
      toast.error(msg);
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilmIcon className="size-4" />
            Animate to Video
          </DialogTitle>
          <DialogDescription>
            Turn this image into a short video. Generation takes 1-5 minutes.
          </DialogDescription>
        </DialogHeader>

        {/* Image preview */}
        <div className="rounded-md overflow-hidden bg-muted aspect-video flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Source"
            className="max-h-40 w-auto object-contain"
          />
        </div>

        {/* Model picker */}
        <div className="space-y-2">
          <Label>Video model</Label>
          <Select value={model} onValueChange={(v) => v && setModel(v as ModelId)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} — {m.credits} credits
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Duration</Label>
            <span className="text-xs text-muted-foreground">
              {effectiveDuration}s (max {maxDuration}s)
            </span>
          </div>
          <Input
            type="range"
            min={3}
            max={maxDuration}
            step={1}
            value={effectiveDuration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>

        {/* Mode */}
        <div className="space-y-2">
          <Label>Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("animate")}
              className={`text-left rounded-md border p-2 text-xs transition-colors ${
                mode === "animate"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              <div className="font-medium">Animate</div>
              <div className="text-muted-foreground">Preserve image, add motion</div>
            </button>
            <button
              type="button"
              onClick={() => setMode("reimagine")}
              className={`text-left rounded-md border p-2 text-xs transition-colors ${
                mode === "reimagine"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              <div className="font-medium">Reimagine</div>
              <div className="text-muted-foreground">Use as inspiration</div>
            </button>
          </div>
        </div>

        {/* Optional prompt */}
        <div className="space-y-2">
          <Label htmlFor="animate-prompt">Motion prompt (optional)</Label>
          <Textarea
            id="animate-prompt"
            placeholder="Slow zoom in, gentle camera pan, leaves rustling…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
          />
        </div>

        {/* Submit */}
        <div className="space-y-2">
          {submitting && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2Icon className="size-3 animate-spin" />
              Generating… elapsed {formatElapsed(elapsed)}
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
          >
            {submitting
              ? "Generating…"
              : `Generate Video (${selectedModel.credits} credits)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
