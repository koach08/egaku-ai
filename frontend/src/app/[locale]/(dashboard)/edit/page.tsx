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
  WandIcon,
  UploadIcon,
  DownloadIcon,
  ArrowRightIcon,
} from "lucide-react";

const EDIT_PRESETS = [
  { label: "Change background to beach", prompt: "Change the background to a tropical beach with palm trees and blue ocean" },
  { label: "Make it nighttime", prompt: "Change the scene to nighttime with moonlight and stars" },
  { label: "Add sunglasses", prompt: "Add stylish sunglasses to the person" },
  { label: "Ghibli style", prompt: "Transform into Studio Ghibli anime style, hand-painted look" },
  { label: "Cyberpunk style", prompt: "Transform into cyberpunk style with neon lights and futuristic elements" },
  { label: "Oil painting", prompt: "Transform into a classical oil painting style with visible brushstrokes" },
  { label: "Change hair to red", prompt: "Change the hair color to vibrant red" },
  { label: "Add a cat", prompt: "Add a cute cat sitting next to the subject" },
  { label: "Remove background", prompt: "Remove the background and replace with a clean white studio backdrop" },
  { label: "Change outfit to suit", prompt: "Change the clothing to a professional business suit" },
  { label: "Make it winter", prompt: "Add snow falling, frost on surfaces, winter atmosphere" },
  { label: "Watercolor effect", prompt: "Transform into a soft watercolor painting" },
];

export default function EditPage() {
  const { session } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = useCallback(async () => {
    if (!session?.access_token || !image || !prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.kontextEdit(session.access_token, {
        image_url: image,
        prompt,
      });
      if (res.result_url) {
        setResult(resolveResultUrl(res.result_url) || res.result_url);
        toast.success("Edit complete!");
      } else {
        toast.error("Edit failed. Try a different instruction.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [session, image, prompt]);

  // Use result as new input for iterative editing
  const useResultAsInput = () => {
    if (result) {
      setImage(result);
      setResult(null);
      setPrompt("");
      toast.success("Using result as new input. Edit again!");
    }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">AI Image Editor</h1>
          <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
            Flux Kontext
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Upload an image and tell AI what to change. &ldquo;Change the background to a beach&rdquo;, &ldquo;Add sunglasses&rdquo;, &ldquo;Make it anime style&rdquo;. Character identity is preserved.
        </p>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to edit images</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upload */}
            {!image ? (
              <label className="block w-full rounded-xl border border-dashed border-white/20 p-16 text-center cursor-pointer hover:border-white/40 transition-colors">
                <UploadIcon className="size-10 mx-auto text-white/20 mb-3" />
                <p className="text-sm text-white/40">Upload an image to edit</p>
                <p className="text-xs text-white/20 mt-1">JPG, PNG, WebP</p>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            ) : (
              <div className="space-y-6">
                {/* Before / After */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-white/40 mb-2">Original</div>
                    <div className="relative rounded-xl overflow-hidden border border-white/[0.06]">
                      <img src={image} alt="Original" className="w-full" />
                      <button
                        onClick={() => { setImage(null); setResult(null); }}
                        className="absolute top-2 right-2 bg-black/60 text-white/60 hover:text-white px-2 py-1 rounded text-xs"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                  {result && (
                    <div>
                      <div className="text-xs text-white/40 mb-2">Edited</div>
                      <div className="rounded-xl overflow-hidden border border-purple-500/20">
                        <img src={result} alt="Edited" className="w-full" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit presets */}
                <div>
                  <label className="block text-xs text-white/50 mb-3">Quick Edits</label>
                  <div className="flex flex-wrap gap-2">
                    {EDIT_PRESETS.map((p) => (
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

                {/* Edit instruction */}
                <div>
                  <label className="block text-xs text-white/50 mb-2">
                    What do you want to change?
                  </label>
                  <Textarea
                    placeholder="e.g., Change the background to a sunset beach, keep the person the same..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Edit button */}
                <Button
                  onClick={handleEdit}
                  disabled={loading || !prompt.trim()}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full text-base"
                >
                  {loading ? (
                    <><Loader2Icon className="size-5 mr-2 animate-spin" />Editing...</>
                  ) : (
                    <><WandIcon className="size-5 mr-2" />Apply Edit (5 credits)</>
                  )}
                </Button>

                {/* Result actions */}
                {result && (
                  <div className="flex gap-3 flex-wrap">
                    <a href={result} download={`egaku-edit-${Date.now()}.png`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="rounded-full">
                        <DownloadIcon className="size-4 mr-2" />Download
                      </Button>
                    </a>
                    <Button variant="outline" onClick={useResultAsInput} className="rounded-full">
                      <ArrowRightIcon className="size-4 mr-2" />Edit Again
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
