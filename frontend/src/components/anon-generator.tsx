"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

const EXAMPLE_PROMPTS = [
  "A samurai standing in cherry blossom rain, cinematic lighting",
  "Cyberpunk Tokyo street at night, neon reflections, rain",
  "Beautiful woman in traditional kimono, golden hour portrait",
  "Dragon flying over misty mountains, fantasy art",
  "Futuristic city skyline at sunset, sci-fi concept art",
];

export function AnonGenerator() {
  const t = useTranslations("anon");
  const tc = useTranslations("common");

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    url: string;
    enhanced: string;
    remaining: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError("");
    setResult(null);

    try {
      const res = await api.generateAnonymous(prompt);
      if (res.result_url) {
        setResult({
          url: res.result_url,
          enhanced: res.enhanced_prompt || "",
          remaining: res.remaining ?? 0,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("FREE_LIMIT_REACHED")) {
        setLimitReached(true);
      } else {
        setError("Generation failed. Please try again.");
      }
    } finally {
      setGenerating(false);
    }
  };

  if (limitReached) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center space-y-4">
        <p className="text-lg font-semibold">{t("limitTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("limitDesc")}</p>
        <Button size="lg" className="text-lg px-8 py-6" render={<Link href="/register" />}>
          {t("signupFree")}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur p-6 space-y-4">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground mb-1">{t("tryNow")}</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder={t("placeholder")}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !generating && handleGenerate()}
          className="flex-1 h-12 text-base"
          disabled={generating}
        />
        <Button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="h-12 px-6 text-base"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t("creating")}
            </span>
          ) : (
            t("generate")
          )}
        </Button>
      </div>

      {/* Example prompts */}
      {!result && !generating && (
        <div className="flex flex-wrap gap-2 justify-center">
          {EXAMPLE_PROMPTS.slice(0, 3).map((ex, i) => (
            <button
              key={i}
              onClick={() => setPrompt(ex)}
              className="text-xs px-3 py-1.5 rounded-full border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {ex.slice(0, 40)}...
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {generating && (
        <div className="text-center py-8 space-y-3">
          <div className="flex justify-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-8 bg-primary/60 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{t("aiCreating")}</p>
          <p className="text-xs text-muted-foreground">{t("poweredBy")}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <img
            src={result.url}
            alt="Generated"
            className="w-full max-h-[500px] object-contain rounded-lg"
          />
          {result.enhanced && (
            <p className="text-xs text-muted-foreground italic">
              {t("enhancedPrompt")}: {result.enhanced.slice(0, 150)}...
            </p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {result.remaining > 0
                ? t("remaining", { count: result.remaining })
                : t("lastFree")}
            </p>
            <div className="flex gap-2">
              <a
                href={result.url}
                download="egaku-ai-generation.png"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded border hover:bg-muted transition-colors"
              >
                {t("download")}
              </a>
              <Button
                size="sm"
                onClick={() => { setResult(null); setPrompt(""); }}
              >
                {t("another")}
              </Button>
            </div>
          </div>
          {result.remaining === 0 && (
            <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium mb-2">{t("wantMore")}</p>
              <Button render={<Link href="/register" />}>
                {tc("startFree")}
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}
