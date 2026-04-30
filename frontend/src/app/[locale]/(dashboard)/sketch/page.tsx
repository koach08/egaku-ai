"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, WandIcon, Trash2Icon } from "lucide-react";

const CANVAS_SIZE = 512;

export default function SketchToImagePage() {
  const { session } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(4);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }, []);

  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const draw = useCallback((x: number, y: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    setHasDrawn(true);
  }, [brushSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const { x, y } = getPos(e);
    draw(x, y);
  }, [getPos, draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    draw(x, y);
  }, [isDrawing, getPos, draw]);

  const handleMouseUp = useCallback(() => setIsDrawing(false), []);

  const handleClear = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setHasDrawn(false);
    setResult(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !canvasRef.current || !prompt.trim()) return;
    setLoading(true);
    setError("");

    try {
      const sketchDataUrl = canvasRef.current.toDataURL("image/png");

      const res = await api.controlnet(session.access_token, {
        prompt,
        image: sketchDataUrl,
        control_type: "scribble",
        control_strength: 0.8,
        width: 1024,
        height: 1024,
        steps: 25,
        cfg: 7.0,
        seed: -1,
      });

      if (res.result_url) {
        setResult(resolveResultUrl(res.result_url) || res.result_url);
      } else if (res.job_id) {
        // Poll for result
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const status = await api.getJobStatus(session.access_token, res.job_id);
          if (status.status === "completed" && status.result_url) {
            setResult(resolveResultUrl(status.result_url) || status.result_url);
            break;
          }
          if (status.status === "failed") {
            setError("Generation failed. Try a different prompt.");
            break;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [session, prompt]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-2">Sketch to Image</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Draw a rough sketch, describe what you want, and AI turns it into a polished image.
        </p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to use Sketch to Image</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Drawing canvas */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-xs text-white/50">Brush: {brushSize}px</label>
                <Input
                  type="range"
                  min={1}
                  max={20}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleClear}>
                  <Trash2Icon className="size-3 mr-1" />
                  Clear
                </Button>
              </div>

              <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-white">
                <canvas
                  ref={canvasRef}
                  className="w-full aspect-square cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Describe what your sketch should become..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !hasDrawn || !prompt.trim()}
                  className="w-full bg-white text-black hover:bg-white/90 rounded-full"
                >
                  {loading ? (
                    <>
                      <Loader2Icon className="size-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <WandIcon className="size-4 mr-2" />
                      Generate from Sketch (3 credits)
                    </>
                  )}
                </Button>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>

            {/* Right: Result */}
            <div>
              {result ? (
                <div className="space-y-3">
                  <h2 className="text-sm font-medium">Result</h2>
                  <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                    <img src={result} alt="Generated from sketch" className="w-full" />
                  </div>
                  <a href={result} download="sketch-to-image.png" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="rounded-full">
                      <DownloadIcon className="size-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/[0.06] p-12 text-center text-white/30 aspect-square flex items-center justify-center">
                  <div>
                    <WandIcon className="size-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Your generated image will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
