"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import {
  Loader2Icon,
  SparklesIcon,
  UploadIcon,
  DownloadIcon,
  UserIcon,
} from "lucide-react";

const SCENE_PRESETS = [
  { label: "Professional Portrait", prompt: "professional headshot, studio lighting, business attire, clean background, corporate photo" },
  { label: "Anime Style", prompt: "anime style portrait, vibrant colors, detailed face, colorful background, masterpiece" },
  { label: "Fantasy Warrior", prompt: "epic fantasy warrior in golden armor, dramatic lighting, castle background, cinematic" },
  { label: "Beach Vacation", prompt: "casual photo at a tropical beach, sunset, palm trees, relaxed, natural lighting" },
  { label: "Cyberpunk", prompt: "cyberpunk character portrait, neon lights, futuristic city, rain, blade runner style" },
  { label: "Historical", prompt: "renaissance portrait painting, oil on canvas, classical style, ornate frame, museum quality" },
  { label: "Magazine Cover", prompt: "fashion magazine cover photo, high fashion, dramatic makeup, professional photography, vogue style" },
  { label: "Superhero", prompt: "superhero character, dynamic pose, cape flowing, city skyline background, comic book style" },
];

export default function FaceGenPage() {
  const { session } = useAuth();
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFaceImage(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !faceImage || !prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.consistentCharacter(session.access_token, {
        reference_image: faceImage,
        prompt,
        negative_prompt: "worst quality, low quality, blurry, deformed, ugly",
        seed: -1,
      });

      if (res.result_url) {
        setResult(resolveResultUrl(res.result_url) || res.result_url);
        toast.success("Generated!");
      } else if (res.job_id) {
        for (let i = 0; i < 60; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const status = await api.getJobStatus(session.access_token, res.job_id);
          if (status.status === "completed" && status.result_url) {
            setResult(resolveResultUrl(status.result_url) || status.result_url);
            toast.success("Generated!");
            return;
          }
          if (status.status === "failed") {
            toast.error("Generation failed");
            return;
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [session, faceImage, prompt]);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Face to Character</h1>
          <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">NEW</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Upload a face photo, describe a scene. AI generates an image with that person in the scene. Identity preserved.
        </p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to use</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Face upload */}
            <div>
              <label className="block text-xs text-white/50 mb-2">Reference Face</label>
              {faceImage ? (
                <div className="flex items-center gap-4">
                  <img src={faceImage} alt="Face" className="w-24 h-24 rounded-xl object-cover" />
                  <button onClick={() => { setFaceImage(null); setResult(null); }} className="text-xs text-white/40 hover:text-white/60">
                    Change photo
                  </button>
                </div>
              ) : (
                <label className="block w-full rounded-xl border border-dashed border-white/20 p-10 text-center cursor-pointer hover:border-white/40 transition-colors">
                  <UserIcon className="size-8 mx-auto text-white/20 mb-2" />
                  <p className="text-sm text-white/40">Upload a clear face photo</p>
                  <p className="text-[10px] text-white/20 mt-1">Front-facing, good lighting works best</p>
                  <input type="file" accept="image/*" onChange={handleFaceUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Scene presets */}
            <div>
              <label className="block text-xs text-white/50 mb-3">Scene Presets</label>
              <div className="flex flex-wrap gap-2">
                {SCENE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setPrompt(p.prompt)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                      prompt === p.prompt
                        ? "bg-purple-500 text-white"
                        : "border border-white/[0.06] text-white/50 hover:text-white/80"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scene description */}
            <div>
              <label className="block text-xs text-white/50 mb-2">Describe the scene</label>
              <Textarea
                placeholder="e.g., professional headshot with studio lighting, or anime warrior in golden armor..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
            </div>

            {/* Generate */}
            <Button
              onClick={handleGenerate}
              disabled={loading || !faceImage || !prompt.trim()}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full text-base"
            >
              {loading ? (
                <><Loader2Icon className="size-5 mr-2 animate-spin" />Generating...</>
              ) : (
                <><SparklesIcon className="size-5 mr-2" />Generate (5 credits)</>
              )}
            </Button>

            {/* Result */}
            {result && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-white/40 mb-1">Reference</div>
                    <img src={faceImage!} alt="Reference" className="w-full rounded-lg" />
                  </div>
                  <div>
                    <div className="text-xs text-white/40 mb-1">Generated</div>
                    <img src={result} alt="Generated" className="w-full rounded-lg" />
                  </div>
                </div>
                <a href={result} download={`face-gen-${Date.now()}.png`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-full">
                    <DownloadIcon className="size-4 mr-2" />Download
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
