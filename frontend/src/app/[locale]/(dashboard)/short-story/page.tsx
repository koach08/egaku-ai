"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import Link from "next/link";
import {
  BookOpenIcon,
  Loader2Icon,
  SparklesIcon,
  FilmIcon,
  ImageIcon,
} from "lucide-react";

const STORY_STYLES = [
  { id: "cinematic", name: "Cinematic", icon: "🎬", promptSuffix: ", cinematic film still, dramatic lighting, shallow depth of field, 8k" },
  { id: "anime", name: "Anime", icon: "🎨", promptSuffix: ", anime illustration, vibrant colors, detailed, studio quality, best quality" },
  { id: "ghibli", name: "Ghibli", icon: "🌸", promptSuffix: ", Studio Ghibli style, hand-painted, soft pastel colors, whimsical, Miyazaki aesthetic" },
  { id: "comic", name: "Comic Book", icon: "💥", promptSuffix: ", comic book panel, bold outlines, dynamic composition, vivid colors, halftone dots" },
  { id: "noir", name: "Film Noir", icon: "🌑", promptSuffix: ", black and white film noir, high contrast shadows, dramatic lighting, 1940s aesthetic" },
  { id: "fantasy", name: "Fantasy Art", icon: "🐉", promptSuffix: ", fantasy art, detailed illustration, magical atmosphere, epic scale, volumetric lighting" },
  { id: "pixel", name: "Pixel Art", icon: "👾", promptSuffix: ", pixel art, 16-bit retro game style, limited color palette, nostalgic" },
  { id: "photo", name: "Photorealistic", icon: "📸", promptSuffix: ", photorealistic, professional photography, natural lighting, sharp details, 8k" },
];

const ASPECT_RATIOS = [
  { id: "9:16", name: "TikTok / Reels (9:16)", w: 576, h: 1024 },
  { id: "16:9", name: "YouTube / Landscape (16:9)", w: 1024, h: 576 },
  { id: "1:1", name: "Instagram Post (1:1)", w: 1024, h: 1024 },
];

type Scene = {
  description: string;
  imageUrl: string | null;
  generating: boolean;
};

export default function ShortStoryPage() {
  const { user, session, loading: authLoading } = useAuth();

  const [storyPrompt, setStoryPrompt] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [sceneCount, setSceneCount] = useState("4");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [splitting, setSplitting] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);

  // Step 1: AI splits the story into scenes
  const handleSplitStory = async () => {
    if (!storyPrompt.trim()) {
      toast.error("Enter a story idea first");
      return;
    }
    setSplitting(true);

    // Simple client-side scene splitting based on narrative beats
    const count = parseInt(sceneCount);
    const storyParts = splitStoryIntoScenes(storyPrompt, count);
    setScenes(storyParts.map((desc) => ({ description: desc, imageUrl: null, generating: false })));
    setSplitting(false);
    toast.success(`Story split into ${storyParts.length} scenes`);
  };

  // Simple scene splitter (could be replaced with AI API later)
  const splitStoryIntoScenes = (story: string, count: number): string[] => {
    // Generate scene descriptions from the story concept
    const templates = [
      `Opening scene: establishing shot of the world described in "${story}"`,
      `The main character or subject is introduced in "${story}"`,
      `Rising action: the key event or conflict begins in "${story}"`,
      `Climax: the most dramatic moment of "${story}"`,
      `Resolution: the ending or aftermath of "${story}"`,
      `Final shot: a wide establishing shot showing the conclusion of "${story}"`,
    ];
    return templates.slice(0, count);
  };

  // Step 2: Generate all scene images
  const handleGenerateAll = async () => {
    if (!session || scenes.length === 0) return;
    setGeneratingAll(true);

    const ratio = ASPECT_RATIOS.find((r) => r.id === aspectRatio) || ASPECT_RATIOS[0];
    const styleObj = STORY_STYLES.find((s) => s.id === style);
    const suffix = styleObj?.promptSuffix || "";

    for (let i = 0; i < scenes.length; i++) {
      setScenes((prev) => prev.map((s, j) => j === i ? { ...s, generating: true } : s));

      try {
        const fullPrompt = scenes[i].description + suffix;
        const res = await api.generateImage(session.access_token, {
          prompt: fullPrompt,
          negative_prompt: "blurry, low quality, text, watermark, deformed",
          model: "flux_schnell",
          width: ratio.w,
          height: ratio.h,
          steps: 4,
          cfg: 3.5,
          seed: -1,
        });

        const url = resolveResultUrl(res.result_url) || res.result_url;
        setScenes((prev) =>
          prev.map((s, j) => j === i ? { ...s, imageUrl: url, generating: false } : s)
        );
      } catch {
        setScenes((prev) =>
          prev.map((s, j) => j === i ? { ...s, generating: false } : s)
        );
        toast.error(`Scene ${i + 1} failed`);
      }
    }

    setGeneratingAll(false);
    toast.success("All scenes generated!");
  };

  // Update a single scene description
  const updateScene = (index: number, desc: string) => {
    setScenes((prev) => prev.map((s, i) => i === index ? { ...s, description: desc } : s));
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <BookOpenIcon className="h-12 w-12 mx-auto text-purple-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Short Story Generator</h1>
          <p className="text-muted-foreground mb-6">
            Turn a story idea into visual scenes for TikTok, Reels, and YouTube Shorts.
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
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Short Story Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Describe a story → AI splits it into scenes → generates visuals for each. Perfect for TikTok, Reels, Shorts.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          {/* Left: Controls */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Your Story Idea</Label>
                  <Textarea
                    placeholder="e.g. A lonely robot finds a flower growing in a ruined city and learns to care for it..."
                    value={storyPrompt}
                    onChange={(e) => setStoryPrompt(e.target.value)}
                    rows={4}
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Visual Style</Label>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {STORY_STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`flex items-center gap-1.5 p-2 rounded-md border text-xs transition-all ${
                          style === s.id
                            ? "border-purple-500 bg-purple-500/10 font-medium"
                            : "border-muted hover:border-purple-500/30"
                        }`}
                      >
                        <span>{s.icon}</span>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={(v) => v && setAspectRatio(v)}>
                      <SelectTrigger className="mt-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Scenes</Label>
                    <Select value={sceneCount} onValueChange={(v) => v && setSceneCount(v)}>
                      <SelectTrigger className="mt-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["3", "4", "5", "6"].map((n) => (
                          <SelectItem key={n} value={n}>{n} scenes</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleSplitStory}
                  disabled={splitting || !storyPrompt.trim()}
                  className="w-full"
                  variant="outline"
                >
                  {splitting ? (
                    <><Loader2Icon className="h-4 w-4 animate-spin mr-2" /> Splitting story...</>
                  ) : (
                    <><SparklesIcon className="h-4 w-4 mr-2" /> Split into Scenes</>
                  )}
                </Button>

                {scenes.length > 0 && (
                  <Button
                    onClick={handleGenerateAll}
                    disabled={generatingAll}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {generatingAll ? (
                      <><Loader2Icon className="h-4 w-4 animate-spin mr-2" /> Generating all scenes...</>
                    ) : (
                      <><FilmIcon className="h-4 w-4 mr-2" /> Generate All ({scenes.length} credits)</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Scene cards */}
          <div className="space-y-3">
            {scenes.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpenIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Write a story idea and click &quot;Split into Scenes&quot;</p>
              </div>
            ) : (
              scenes.map((scene, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="flex gap-0">
                    {/* Scene image */}
                    <div className="w-32 sm:w-48 shrink-0 bg-muted flex items-center justify-center">
                      {scene.generating ? (
                        <Loader2Icon className="h-6 w-6 animate-spin text-purple-500" />
                      ) : scene.imageUrl ? (
                        <img src={scene.imageUrl} alt={`Scene ${i + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                      )}
                    </div>
                    {/* Scene text */}
                    <CardContent className="flex-1 py-3 px-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                          Scene {i + 1}
                        </span>
                      </div>
                      <Textarea
                        value={scene.description}
                        onChange={(e) => updateScene(i, e.target.value)}
                        rows={2}
                        className="text-xs border-none p-0 resize-none focus-visible:ring-0 bg-transparent"
                      />
                    </CardContent>
                  </div>
                </Card>
              ))
            )}

            {scenes.length > 0 && scenes.every((s) => s.imageUrl) && (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-2">
                  All scenes generated! Use Storyboard Studio to combine into a video with BGM.
                </p>
                <Button variant="outline" size="sm" render={<Link href="/storyboard" />}>
                  Open Storyboard Studio →
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
