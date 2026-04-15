"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/header";

type LoRA = {
  id: string;
  name: string;
  trigger_word: string;
  status: "training" | "completed" | "failed";
  progress: number;
  lora_url: string | null;
  nsfw: boolean;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
};

export default function MyLorasPage() {
  const { user, session, loading: authLoading } = useAuth();
  const [loras, setLoras] = useState<LoRA[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateOpen, setGenerateOpen] = useState<LoRA | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const data = (await api.listLoras(session.access_token)) as LoRA[];
      setLoras(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load models";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    refresh();
  }, [session, refresh]);

  // Auto-refresh every 30s while anything is still training
  useEffect(() => {
    const anyTraining = loras.some((l) => l.status === "training");
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (!anyTraining) return;
    pollTimerRef.current = setInterval(() => {
      refresh();
    }, 30_000);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loras, refresh]);

  const handleDelete = async (lora: LoRA) => {
    if (!session) return;
    if (!confirm(`Delete "${lora.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteLora(session.access_token, lora.id);
      setLoras((prev) => prev.filter((l) => l.id !== lora.id));
      toast.success("Model deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    }
  };

  if (authLoading) return null;
  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
          <h1 className="text-3xl font-bold">My Trained Models</h1>
          <Link href="/register">
            <Button size="lg">Sign in to continue</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Trained Models</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your custom LoRA models. Generate unlimited new images once training completes.
            </p>
          </div>
          <Link href="/lora-train">
            <Button>+ Train New Model</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading…</div>
        ) : loras.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-center py-16 space-y-4">
              <div className="text-5xl">🎯</div>
              <h2 className="text-xl font-semibold">No trained models yet</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Upload 4-20 photos of yourself, your pet, or a style, and generate unlimited
                images of that subject.
              </p>
              <Link href="/lora-train">
                <Button>Train your first model →</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loras.map((lora) => (
              <LoraCard
                key={lora.id}
                lora={lora}
                onGenerate={() => setGenerateOpen(lora)}
                onDelete={() => handleDelete(lora)}
              />
            ))}
          </div>
        )}
      </main>

      {generateOpen && session && (
        <GenerateModal
          lora={generateOpen}
          token={session.access_token}
          onClose={() => setGenerateOpen(null)}
        />
      )}
    </>
  );
}

function LoraCard({
  lora,
  onGenerate,
  onDelete,
}: {
  lora: LoRA;
  onGenerate: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{lora.name}</h3>
            <p className="text-xs text-muted-foreground">
              Trigger: <code className="text-purple-300">{lora.trigger_word}</code>
            </p>
          </div>
          <StatusBadge status={lora.status} />
        </div>

        {lora.status === "training" && (
          <div className="space-y-1">
            <div className="h-2 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${Math.max(5, lora.progress)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Training… ~5-15 min total. Check back soon.
            </p>
          </div>
        )}

        {lora.status === "failed" && lora.error_message && (
          <p className="text-xs text-red-400 line-clamp-3">{lora.error_message}</p>
        )}

        <div className="flex gap-2 pt-2">
          {lora.status === "completed" && (
            <Button size="sm" className="flex-1" onClick={onGenerate}>
              Generate
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: LoRA["status"] }) {
  if (status === "training") {
    return (
      <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-400">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1.5 animate-pulse" />
        Training
      </Badge>
    );
  }
  if (status === "completed") {
    return (
      <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-400">
        ✓ Ready
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-400">
      Failed
    </Badge>
  );
}

function GenerateModal({
  lora,
  token,
  onClose,
}: {
  lora: LoRA;
  token: string;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [strength, setStrength] = useState(1.0);
  const [numImages, setNumImages] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe what you want to see");
      return;
    }
    setGenerating(true);
    setResults([]);
    try {
      const res = (await api.generateWithLora(token, {
        lora_id: lora.id,
        prompt,
        lora_strength: strength,
        num_images: numImages,
      })) as { result_urls: string[] };
      setResults(res.result_urls || []);
      if (!res.result_urls?.length) toast.error("No images returned");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border border-muted rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-muted flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Generate with {lora.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trigger word <code className="text-purple-300">{lora.trigger_word}</code> is added
              automatically if missing.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`${lora.trigger_word} wearing a spacesuit on Mars, cinematic lighting`}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Strength ({strength.toFixed(2)})</Label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={strength}
                onChange={(e) => setStrength(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Number of images</Label>
              <select
                value={numImages}
                onChange={(e) => setNumImages(parseInt(e.target.value, 10))}
                className="w-full h-9 rounded border border-muted bg-background px-2 text-sm"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={generating || !prompt.trim()}
            onClick={handleGenerate}
          >
            {generating ? "Generating…" : `Generate (${3 * numImages} credits)`}
          </Button>

          {results.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {results.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`result-${i}`}
                  className="w-full rounded border border-muted"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
