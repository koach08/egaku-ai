"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import Link from "next/link";
import {
  UploadIcon,
  WandIcon,
  DownloadIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";

const SCENE_PRESETS = [
  {
    id: "white_studio",
    name: "Clean White",
    icon: "⬜",
    prompt: "professional product photography on pure white background, soft studio lighting, commercial quality, sharp details, high-end advertising",
  },
  {
    id: "marble",
    name: "Marble Surface",
    icon: "🪨",
    prompt: "product on elegant marble surface, soft natural light from window, minimalist luxury aesthetic, commercial photography",
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    icon: "🏠",
    prompt: "product in cozy lifestyle setting, warm natural light, wooden table, plants in background, Instagram aesthetic, editorial photography",
  },
  {
    id: "outdoor",
    name: "Nature",
    icon: "🌿",
    prompt: "product placed on natural stone in forest setting, soft morning light, moss, leaves, organic aesthetic, high-end outdoor photography",
  },
  {
    id: "neon",
    name: "Neon Glow",
    icon: "💜",
    prompt: "product floating against dark background with dramatic neon purple and blue rim lighting, futuristic, premium tech product photography",
  },
  {
    id: "gradient",
    name: "Gradient",
    icon: "🌈",
    prompt: "product on smooth gradient background from soft pink to lavender, clean modern aesthetic, cosmetics advertising style, professional studio",
  },
  {
    id: "holiday",
    name: "Holiday",
    icon: "🎄",
    prompt: "product with festive holiday decorations, warm golden bokeh lights, gift wrapping elements, seasonal marketing photography",
  },
  {
    id: "custom",
    name: "Custom",
    icon: "✏️",
    prompt: "",
  },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

export default function ProductStudioPage() {
  const { user, session, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productImage, setProductImage] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [noBgImage, setNoBgImage] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState("white_studio");
  const [customPrompt, setCustomPrompt] = useState("");
  const [productName, setProductName] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProductImage(file);
    setProductPreview(URL.createObjectURL(file));
    setNoBgImage(null);
    setResults([]);
    setStep(1);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Step 1: Remove background
  const handleRemoveBg = async () => {
    if (!session || !productImage) return;
    setRemovingBg(true);
    try {
      const b64 = await fileToBase64(productImage);
      const res = await api.removeBg(session.access_token, { image: b64 });
      if (res.result_url) {
        setNoBgImage(res.result_url);
        setStep(2);
        toast.success("Background removed!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Background removal failed");
    } finally {
      setRemovingBg(false);
    }
  };

  // Step 2: Generate product shots
  const handleGenerate = async () => {
    if (!session) return;
    setGenerating(true);
    setResults([]);

    const scene = SCENE_PRESETS.find((s) => s.id === selectedScene);
    const scenePrompt = selectedScene === "custom" ? customPrompt : (scene?.prompt || "");
    const fullPrompt = productName
      ? `${productName} product, ${scenePrompt}`
      : `product, ${scenePrompt}`;

    try {
      // Generate with img2img using the no-bg product as input
      const imageToUse = noBgImage || productPreview;
      if (!imageToUse) {
        toast.error("No product image");
        return;
      }

      // Fetch the no-bg image and convert to base64
      let b64: string;
      if (noBgImage) {
        const resp = await fetch(noBgImage);
        const blob = await resp.blob();
        b64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(blob);
        });
      } else {
        b64 = await fileToBase64(productImage!);
      }

      // Generate 3 variations using img2img with low denoise (preserve product)
      const generated: string[] = [];
      for (let i = 0; i < 3; i++) {
        try {
          const res = await api.img2img(session.access_token, {
            prompt: fullPrompt,
            negative_prompt: "blurry, low quality, distorted, deformed product, wrong colors, text, watermark",
            image: b64,
            width: 1024,
            height: 1024,
            steps: 25,
            cfg: 7,
            denoise: 0.65 + i * 0.05, // Slight variation: 0.65, 0.70, 0.75
            sampler: "dpmpp_2m",
            seed: -1,
          });
          if (res.result_url) {
            generated.push(res.result_url);
          }
        } catch {
          // Continue with remaining variations
        }
      }

      if (generated.length > 0) {
        setResults(generated);
        setStep(3);
        toast.success(`Generated ${generated.length} product shot${generated.length > 1 ? "s" : ""}!`);
      } else {
        toast.error("Generation failed — try a different scene or prompt");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <SparklesIcon className="h-12 w-12 mx-auto text-purple-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Product Studio</h1>
          <p className="text-muted-foreground mb-6">
            Turn product photos into professional ad images with AI.
          </p>
          <Button render={<Link href="/register" />} className="bg-purple-600 hover:bg-purple-700">
            Sign Up Free
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Product Studio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a product photo → AI generates professional ad-quality images for Instagram, Amazon, Shopify.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { n: 1, label: "Upload" },
            { n: 2, label: "Choose Scene" },
            { n: 3, label: "Results" },
          ].map((s) => (
            <div key={s.n} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s.n
                    ? "bg-purple-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.n}
              </div>
              <span className={`text-xs ${step >= s.n ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {s.n < 3 && <div className="w-8 h-px bg-muted" />}
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Upload + Preview */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Label className="text-sm font-medium">Product Image</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                >
                  {productPreview ? (
                    <img
                      src={productPreview}
                      alt="Product"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                  ) : (
                    <div className="space-y-2">
                      <UploadIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload product photo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG. Best results with clean product photos.
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {productImage && !noBgImage && (
                  <Button
                    onClick={handleRemoveBg}
                    disabled={removingBg}
                    className="w-full"
                    variant="outline"
                  >
                    {removingBg ? (
                      <><Loader2Icon className="h-4 w-4 animate-spin mr-2" /> Removing background...</>
                    ) : (
                      "Remove Background (1 credit)"
                    )}
                  </Button>
                )}

                {noBgImage && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Background removed:</p>
                    <img
                      src={noBgImage}
                      alt="Product (no bg)"
                      className="max-h-48 mx-auto rounded-lg bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48L3N2Zz4=')]"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-xs">Product Name (optional)</Label>
                  <Input
                    placeholder="e.g. Ceramic coffee mug, Leather handbag"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Scene Selection + Generate */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Label className="text-sm font-medium">Scene / Background</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SCENE_PRESETS.map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => setSelectedScene(scene.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                        selectedScene === scene.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-muted hover:border-purple-500/30"
                      }`}
                    >
                      <span className="text-lg">{scene.icon}</span>
                      <span className="text-xs font-medium">{scene.name}</span>
                    </button>
                  ))}
                </div>

                {selectedScene === "custom" && (
                  <Textarea
                    placeholder="Describe the scene or background you want..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={generating || (!productImage && !noBgImage)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                >
                  {generating ? (
                    <><Loader2Icon className="h-4 w-4 animate-spin mr-2" /> Generating 3 variations...</>
                  ) : (
                    <><WandIcon className="h-4 w-4 mr-2" /> Generate Product Shots (3 credits)</>
                  )}
                </Button>

                <p className="text-[10px] text-muted-foreground text-center">
                  Tip: Remove background first for best results. 3 variations generated per click.
                </p>
              </CardContent>
            </Card>

            {/* Results */}
            {results.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <Label className="text-sm font-medium mb-3 block">Generated Product Shots</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {results.map((url, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden">
                        <img src={url} alt={`Product shot ${i + 1}`} className="w-full aspect-square object-cover" />
                        <a
                          href={url}
                          download={`product-shot-${i + 1}.jpg`}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <DownloadIcon className="h-6 w-6 text-white" />
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
