"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, MaximizeIcon } from "lucide-react";

const DIRECTIONS = [
  { value: "all", label: "All sides" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "up", label: "Up" },
  { value: "down", label: "Down" },
] as const;

export default function ExpandImagePage() {
  const { session } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [direction, setDirection] = useState("all");
  const [expandPx, setExpandPx] = useState(256);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
      setError("");
    }
  }, []);

  const handleExpand = useCallback(async () => {
    if (!session?.access_token || !file) return;
    setLoading(true);
    setError("");

    try {
      const reader = new FileReader();
      const imageB64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const res = await api.outpaint(session.access_token, {
        image: imageB64,
        prompt: prompt || "",
        direction,
        expand_pixels: expandPx,
        seed: -1,
      });

      if (res.result_url) {
        setResult(resolveResultUrl(res.result_url) || res.result_url);
      } else if (res.job_id) {
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const status = await api.getJobStatus(session.access_token, res.job_id);
          if (status.status === "completed" && status.result_url) {
            setResult(resolveResultUrl(status.result_url) || status.result_url);
            break;
          }
          if (status.status === "failed") {
            setError("Expansion failed. Try a different prompt or direction.");
            break;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [session, file, prompt, direction, expandPx]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-2">Expand Image</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Extend your image beyond its borders. AI generates new content that seamlessly continues the scene.
        </p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to use Expand Image</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-white/10 file:text-white/70 hover:file:bg-white/20"
              />
            </div>

            {/* Preview */}
            {preview && (
              <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                <img src={preview} alt="Preview" className="w-full max-h-96 object-contain bg-black" />
              </div>
            )}

            {/* Options */}
            {file && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-2">Direction</label>
                  <div className="flex flex-wrap gap-2">
                    {DIRECTIONS.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDirection(d.value)}
                        className={`px-4 py-2 rounded-full text-xs transition-colors ${
                          direction === d.value
                            ? "bg-white text-black"
                            : "border border-white/[0.06] text-white/50 hover:text-white/80"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-2">
                    Expand by: {expandPx}px
                  </label>
                  <Input
                    type="range"
                    min={64}
                    max={512}
                    step={64}
                    value={expandPx}
                    onChange={(e) => setExpandPx(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-2">Prompt (optional)</label>
                  <Input
                    placeholder="Describe what should appear in the expanded area..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleExpand}
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-white/90 rounded-full"
                >
                  {loading ? (
                    <>
                      <Loader2Icon className="size-4 mr-2 animate-spin" />
                      Expanding...
                    </>
                  ) : (
                    <>
                      <MaximizeIcon className="size-4 mr-2" />
                      Expand Image (3 credits)
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Error */}
            {error && <p className="text-sm text-red-400">{error}</p>}

            {/* Result */}
            {result && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium">Expanded Image</h2>
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <img src={result} alt="Expanded" className="w-full" />
                </div>
                <a href={result} download="expanded-image.png" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-full">
                    <DownloadIcon className="size-4 mr-2" />
                    Download
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
