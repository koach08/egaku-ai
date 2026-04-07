"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import Link from "next/link";

const PHOTO_PRESETS = [
  {
    id: "business",
    name: "Business Portrait",
    prompt: "Professional corporate headshot, wearing a navy blue suit and tie, clean white background, confident smile, studio lighting, LinkedIn profile photo quality, sharp focus, 8K",
    icon: "💼",
  },
  {
    id: "casual",
    name: "Casual Portrait",
    prompt: "Natural casual portrait in a coffee shop, wearing a smart casual outfit, warm ambient lighting, bokeh background, friendly approachable expression, lifestyle photography, 8K",
    icon: "☕",
  },
  {
    id: "creative",
    name: "Creative Professional",
    prompt: "Creative industry headshot, wearing stylish black turtleneck, minimalist gray background, artistic lighting with subtle colored accent, modern professional look, 8K",
    icon: "🎨",
  },
  {
    id: "academic",
    name: "Academic / Professor",
    prompt: "Distinguished academic portrait, wearing tweed blazer with glasses, library or bookshelf background, warm scholarly atmosphere, university professor look, 8K",
    icon: "📚",
  },
  {
    id: "dating",
    name: "Dating App",
    prompt: "Attractive natural portrait, golden hour outdoor lighting, warm smile, wearing casual clothes, park or urban background with bokeh, genuine and approachable, 8K",
    icon: "❤️",
  },
  {
    id: "influencer",
    name: "Social Media / Influencer",
    prompt: "Instagram-ready portrait, trendy outfit, vibrant colorful background, ring light reflection in eyes, confident pose, content creator aesthetic, 8K",
    icon: "📸",
  },
  {
    id: "graduation",
    name: "Graduation Photo",
    prompt: "Graduation portrait wearing cap and gown, proud expression, university campus background, formal academic photography, celebratory atmosphere, 8K",
    icon: "🎓",
  },
  {
    id: "fitness",
    name: "Fitness / Sports",
    prompt: "Athletic fitness portrait, wearing sportswear, gym or outdoor setting, dynamic lighting emphasizing physique, motivational energy, sports photography, 8K",
    icon: "💪",
  },
];

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoBoothPage() {
  const { user, session, loading: authLoading } = useAuth();
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfie(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (!selfie || !session) {
      toast.error("Please upload a face photo first");
      return;
    }
    const preset = PHOTO_PRESETS.find((p) => p.id === selectedPreset);
    const promptText = customPrompt.trim() || preset?.prompt || PHOTO_PRESETS[0].prompt;

    setGenerating(true);
    setResultUrl(null);
    try {
      const refB64 = await fileToBase64(selfie);
      const res = await api.consistentCharacter(session.access_token, {
        prompt: promptText,
        reference_image: refB64,
        width: 768,
        height: 1024,
        id_weight: 1.2,
        seed: -1,
        nsfw: false,
      });
      if (res.result_url) {
        setResultUrl(res.result_url);
        toast.success("Photo generated!");
      } else {
        toast.error("Generation did not return a result");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-3xl font-bold">AI Photo Booth</h1>
          <p className="text-muted-foreground">Transform your selfie into professional portraits for LinkedIn, dating apps, social media, and more.</p>
          <Link href="/register"><Button size="lg">Get Started Free</Button></Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">AI Photo Booth</h1>
          <p className="text-muted-foreground">Upload your face, pick a style, get a professional portrait in seconds.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Upload + Settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">1. Upload Your Face</CardTitle>
              </CardHeader>
              <CardContent>
                <Input type="file" accept="image/*" onChange={handleSelfieSelect} />
                {selfiePreview && (
                  <img src={selfiePreview} alt="Your photo" className="mt-3 rounded-lg max-h-48 object-cover mx-auto" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">2. Choose a Style</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {PHOTO_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => { setSelectedPreset(preset.id); setCustomPrompt(""); }}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedPreset === preset.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-muted hover:border-purple-500/30"
                      }`}
                    >
                      <span className="text-lg">{preset.icon}</span>
                      <p className="text-xs font-medium mt-1">{preset.name}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground">Or describe your own style:</Label>
                  <Input
                    placeholder="e.g. Astronaut in space suit, Earth in background"
                    value={customPrompt}
                    onChange={(e) => { setCustomPrompt(e.target.value); setSelectedPreset(null); }}
                    className="mt-1 text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={generating || !selfie}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              size="lg"
            >
              {generating ? "Generating portrait..." : "Generate Portrait (5 credits)"}
            </Button>
          </div>

          {/* Right: Result */}
          <div>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Your Portrait</CardTitle>
              </CardHeader>
              <CardContent>
                {resultUrl ? (
                  <div className="space-y-3">
                    <img src={resultUrl} alt="Generated portrait" className="w-full rounded-lg" />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          import("@/lib/utils").then((m) => m.downloadFile(resultUrl, "egaku-portrait.png"));
                        }}
                      >
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const text = `My AI portrait by EGAKU AI`;
                          const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(resultUrl)}`;
                          window.open(xUrl, "_blank", "width=600,height=400");
                        }}
                      >
                        Share
                      </Button>
                    </div>
                  </div>
                ) : generating ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Creating your portrait...</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-20">
                    <p className="text-sm text-muted-foreground">Your AI portrait will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
