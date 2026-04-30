"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, GridIcon } from "lucide-react";

const ANGLES = [
  { label: "Front", suffix: "front view, facing camera directly" },
  { label: "3/4 Left", suffix: "three-quarter view from the left side, slightly turned" },
  { label: "3/4 Right", suffix: "three-quarter view from the right side, slightly turned" },
  { label: "Side Left", suffix: "left side profile view" },
  { label: "Side Right", suffix: "right side profile view" },
  { label: "Back", suffix: "back view, facing away from camera" },
  { label: "High Angle", suffix: "high angle shot looking down from above" },
  { label: "Low Angle", suffix: "low angle shot looking up, dramatic perspective" },
  { label: "Close-up", suffix: "extreme close-up, detailed face/features" },
];

export default function MultiShotPage() {
  const { session } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [selectedAngles, setSelectedAngles] = useState<string[]>(["Front", "3/4 Left", "3/4 Right", "Side Left"]);
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleAngle = (label: string) => {
    setSelectedAngles((prev) =>
      prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]
    );
  };

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !prompt.trim() || selectedAngles.length === 0) return;
    setLoading(true); setError(""); setResults({});

    try {
      for (const angleLabel of selectedAngles) {
        const angle = ANGLES.find((a) => a.label === angleLabel);
        if (!angle) continue;

        const fullPrompt = `${prompt}, ${angle.suffix}, consistent character, same lighting`;
        const res = await api.generateImage(session.access_token, {
          prompt: fullPrompt,
          model: "fal_flux_dev",
          width: 1024, height: 1024,
          steps: 25, cfg: 7.0, seed: -1, nsfw: false,
        });

        if (res.result_url) {
          setResults((prev) => ({ ...prev, [angleLabel]: resolveResultUrl(res.result_url) || res.result_url }));
        } else if (res.job_id) {
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            const status = await api.getJobStatus(session.access_token, res.job_id);
            if (status.status === "completed" && status.result_url) {
              setResults((prev) => ({ ...prev, [angleLabel]: resolveResultUrl(status.result_url) || status.result_url }));
              break;
            }
            if (status.status === "failed") break;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }, [session, prompt, selectedAngles]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Multi-Shot</h1>
          <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Generate the same subject from multiple camera angles. Great for character sheets and product views.</p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to use Multi-Shot</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Input placeholder="Describe your subject (e.g. a warrior in silver armor, a red sports car, a cute robot)"
              value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <div>
              <label className="block text-xs text-white/50 mb-3">Select Angles ({selectedAngles.length} selected, {selectedAngles.length * 3} credits)</label>
              <div className="flex flex-wrap gap-2">
                {ANGLES.map((a) => (
                  <button key={a.label} onClick={() => toggleAngle(a.label)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                      selectedAngles.includes(a.label) ? "bg-white text-black" : "border border-white/[0.06] text-white/50 hover:text-white/80"
                    }`}>{a.label}</button>
                ))}
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={loading || !prompt.trim() || selectedAngles.length === 0}
              className="w-full bg-white text-black hover:bg-white/90 rounded-full">
              {loading ? <><Loader2Icon className="size-4 mr-2 animate-spin" />Generating {selectedAngles.length} shots...</> :
                <><GridIcon className="size-4 mr-2" />Generate {selectedAngles.length} Shots ({selectedAngles.length * 3} credits)</>}
            </Button>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {Object.keys(results).length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedAngles.map((label) => (
                  <div key={label} className="rounded-xl overflow-hidden border border-white/[0.06]">
                    {results[label] ? (
                      <>
                        <img src={results[label]} alt={label} className="w-full aspect-square object-cover" />
                        <div className="p-2 flex items-center justify-between">
                          <span className="text-xs text-white/50">{label}</span>
                          <a href={results[label]} download={`${label}.png`} target="_blank" rel="noopener noreferrer">
                            <DownloadIcon className="size-3 text-white/30 hover:text-white/70" />
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-square flex items-center justify-center bg-white/[0.02]">
                        <Loader2Icon className="size-5 animate-spin text-white/20" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
