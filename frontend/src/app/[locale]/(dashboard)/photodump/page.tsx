"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { Loader2Icon, DownloadIcon, UsersIcon } from "lucide-react";

const SCENE_PRESETS = [
  { label: "Coffee Shop", prompt: "sitting in a cozy coffee shop, warm lighting, latte on table, casual relaxed pose" },
  { label: "City Street", prompt: "walking on a busy city street, urban background, natural candid pose" },
  { label: "Beach", prompt: "standing on a tropical beach at golden hour, ocean waves, wind in hair" },
  { label: "Office", prompt: "professional setting in modern office, standing confidently, business casual" },
  { label: "Park", prompt: "sitting under a tree in a green park, dappled sunlight, relaxed" },
  { label: "Gym", prompt: "in a modern gym, athletic wear, confident pose, studio-quality fitness photo" },
  { label: "Restaurant", prompt: "sitting at a restaurant table, fine dining, elegant, candlelight, evening" },
  { label: "Rooftop", prompt: "standing on a city rooftop at sunset, skyline background, dramatic" },
  { label: "Studio", prompt: "professional studio portrait, clean background, perfect lighting" },
  { label: "Travel", prompt: "traveling, famous landmark in background, tourist selfie, happy" },
  { label: "Night Out", prompt: "night city, neon lights, stylish outfit, going out, vibrant" },
  { label: "Home", prompt: "relaxing at home, cozy interior, soft natural window light, casual" },
];

export default function PhotodumpPage() {
  const { session } = useAuth();
  const [characterDesc, setCharacterDesc] = useState("");
  const [selectedScenes, setSelectedScenes] = useState<string[]>(["Coffee Shop", "City Street", "Beach", "Studio"]);
  const [customScene, setCustomScene] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleScene = (label: string) => {
    setSelectedScenes((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !characterDesc.trim() || selectedScenes.length === 0) return;
    setLoading(true); setError(""); setResults({});

    const scenes = [...selectedScenes];
    if (customScene.trim()) scenes.push(customScene.trim());

    try {
      for (const sceneLabel of scenes) {
        const preset = SCENE_PRESETS.find((p) => p.label === sceneLabel);
        const scenePrompt = preset?.prompt || sceneLabel;
        const fullPrompt = `${characterDesc}, ${scenePrompt}, photorealistic, 8K, shot on Sony A7R IV, shallow depth of field, natural skin tones`;

        const res = await api.generateImage(session.access_token, {
          prompt: fullPrompt, model: "fal_flux_dev", width: 1024, height: 1024,
          steps: 25, cfg: 7.0, seed: -1, nsfw: false,
        });

        if (res.result_url) {
          setResults((prev) => ({ ...prev, [sceneLabel]: resolveResultUrl(res.result_url) || res.result_url }));
        } else if (res.job_id) {
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            const status = await api.getJobStatus(session.access_token, res.job_id);
            if (status.status === "completed" && status.result_url) {
              setResults((prev) => ({ ...prev, [sceneLabel]: resolveResultUrl(status.result_url) || status.result_url }));
              break;
            }
            if (status.status === "failed") break;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }, [session, characterDesc, selectedScenes, customScene]);

  const totalScenes = selectedScenes.length + (customScene.trim() ? 1 : 0);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Photodump</h1>
          <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Describe a character once, generate them in multiple scenes. Like an Instagram photodump.</p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to use Photodump</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Character Description</label>
              <Textarea placeholder="Describe your character in detail (e.g. a 25 year old Japanese woman with shoulder-length black hair, brown eyes, small mole under left eye, fair skin)"
                value={characterDesc} onChange={(e) => setCharacterDesc(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-3">Scenes ({totalScenes} selected, {totalScenes * 3} credits)</label>
              <div className="flex flex-wrap gap-2">
                {SCENE_PRESETS.map((s) => (
                  <button key={s.label} onClick={() => toggleScene(s.label)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                      selectedScenes.includes(s.label) ? "bg-white text-black" : "border border-white/[0.06] text-white/50 hover:text-white/80"
                    }`}>{s.label}</button>
                ))}
              </div>
              <Input placeholder="Custom scene (optional)" value={customScene}
                onChange={(e) => setCustomScene(e.target.value)} className="mt-3" />
            </div>
            <Button onClick={handleGenerate} disabled={loading || !characterDesc.trim() || totalScenes === 0}
              className="w-full bg-white text-black hover:bg-white/90 rounded-full">
              {loading ? <><Loader2Icon className="size-4 mr-2 animate-spin" />Generating {totalScenes} photos...</> :
                <><UsersIcon className="size-4 mr-2" />Generate Photodump ({totalScenes * 3} credits)</>}
            </Button>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {Object.keys(results).length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[...selectedScenes, ...(customScene.trim() ? [customScene.trim()] : [])].map((label) => (
                  <div key={label} className="rounded-xl overflow-hidden border border-white/[0.06]">
                    {results[label] ? (
                      <>
                        <img src={results[label]} alt={label} className="w-full aspect-square object-cover" />
                        <div className="p-2 flex items-center justify-between">
                          <span className="text-xs text-white/50">{label}</span>
                          <a href={results[label]} download={`photodump-${label}.png`} target="_blank" rel="noopener noreferrer">
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
