"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import Link from "next/link";

const DEVICES = [
  { id: "iphone", name: "iPhone / Mobile", width: 1170, height: 2532, ratio: "9:19.5" },
  { id: "android", name: "Android / Mobile", width: 1080, height: 2400, ratio: "9:20" },
  { id: "ipad", name: "iPad / Tablet", width: 2048, height: 2732, ratio: "3:4" },
  { id: "desktop_hd", name: "Desktop HD (1920x1080)", width: 1920, height: 1080, ratio: "16:9" },
  { id: "desktop_4k", name: "Desktop 4K (3840x2160)", width: 2048, height: 1152, ratio: "16:9" },
  { id: "ultrawide", name: "Ultrawide (3440x1440)", width: 2048, height: 858, ratio: "21:9" },
  { id: "dual", name: "Dual Monitor (3840x1080)", width: 2048, height: 576, ratio: "32:9" },
];

const WALL_THEMES = [
  { id: "nature", name: "Nature & Landscape", suffix: ", stunning natural landscape, dramatic sky, vibrant colors, 8K wallpaper quality" },
  { id: "space", name: "Space & Cosmos", suffix: ", deep space, nebula, stars, planets, cosmic, 8K wallpaper" },
  { id: "abstract", name: "Abstract Art", suffix: ", abstract digital art, flowing colors, geometric patterns, modern, 8K wallpaper" },
  { id: "cyberpunk", name: "Cyberpunk City", suffix: ", cyberpunk neon city, rain, futuristic, blade runner aesthetic, 8K wallpaper" },
  { id: "anime", name: "Anime Scene", suffix: ", anime style illustration, vibrant, detailed background, Makoto Shinkai quality, wallpaper" },
  { id: "minimal", name: "Minimalist", suffix: ", minimalist design, clean, simple shapes, solid colors, elegant, wallpaper" },
  { id: "dark", name: "Dark & Moody", suffix: ", dark moody atmosphere, deep shadows, dramatic lighting, AMOLED black, wallpaper" },
  { id: "gradient", name: "Gradient / Mesh", suffix: ", beautiful color gradient, mesh gradient, smooth color transitions, modern iOS style wallpaper" },
  { id: "photography", name: "Photography", suffix: ", professional photograph, stunning composition, cinematic lighting, 8K wallpaper" },
  { id: "fantasy", name: "Fantasy World", suffix: ", epic fantasy landscape, magical atmosphere, ethereal lighting, detailed world, wallpaper" },
];

export default function WallpaperPage() {
  const { user, session } = useAuth();
  const [idea, setIdea] = useState("");
  const [device, setDevice] = useState("iphone");
  const [theme, setTheme] = useState("nature");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!session) { toast.error("Please sign in"); return; }

    const deviceInfo = DEVICES.find((d) => d.id === device)!;
    const themeInfo = WALL_THEMES.find((t) => t.id === theme);

    const prompt = `${idea.trim() || "beautiful"}${themeInfo?.suffix || ""}, perfect for ${deviceInfo.name} wallpaper, seamless edge-to-edge, no text, no watermark`;

    setGenerating(true);
    setResultUrl(null);

    try {
      const res = await api.generateImage(session.access_token, {
        prompt,
        negative_prompt: "text, watermark, logo, border, frame, blurry, low quality",
        model: "fal_flux_dev",
        width: Math.min(deviceInfo.width, 2048),
        height: Math.min(deviceInfo.height, 2048),
        steps: 28, cfg: 7, sampler: "euler_ancestral", seed: -1, nsfw: false,
      });

      let finalUrl: string | null = null;

      if (res.status === "completed" && res.result_url) {
        finalUrl = resolveResultUrl(res.result_url) || null;
        setResultUrl(finalUrl);
      } else {
        for (let i = 0; i < 60; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const status = await api.getJobStatus(session.access_token, res.job_id);
          if (status.status === "completed" && status.result_url) {
            finalUrl = resolveResultUrl(status.result_url) || null;
            setResultUrl(finalUrl);
            break;
          }
          if (status.status === "failed") break;
        }
      }

      if (finalUrl) toast.success("Wallpaper ready!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setGenerating(false);
    }
  };

  const deviceInfo = DEVICES.find((d) => d.id === device)!;

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-3xl font-bold">AI Wallpaper Generator</h1>
          <p className="text-muted-foreground">Generate perfect wallpapers for any device — iPhone, Android, Desktop, 4K, Ultrawide. AI-powered, unique every time.</p>
          <Link href="/register"><Button size="lg">Create Wallpapers Free</Button></Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">AI Wallpaper Generator</h1>
          <p className="text-muted-foreground">Perfect wallpapers for every device. Describe your idea or pick a theme.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <Label className="text-xs">Device</Label>
                  <Select value={device} onValueChange={(v) => v && setDevice(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEVICES.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name} ({d.width}x{d.height})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Theme</Label>
                  <Select value={theme} onValueChange={(v) => v && setTheme(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WALL_THEMES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Your idea (optional)</Label>
                  <Textarea
                    placeholder="Cherry blossoms over Tokyo at sunset..."
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
            <Button onClick={handleGenerate} disabled={generating} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600" size="lg">
              {generating ? "Generating..." : "Generate Wallpaper (3 credits)"}
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Preview ({deviceInfo.name})</CardTitle></CardHeader>
            <CardContent>
              <div className="mx-auto overflow-hidden rounded-xl border bg-muted"
                style={{
                  maxWidth: deviceInfo.width > deviceInfo.height ? 400 : 220,
                  aspectRatio: `${deviceInfo.width}/${deviceInfo.height}`,
                }}>
                {resultUrl ? (
                  <img src={resultUrl} alt="Wallpaper" className="w-full h-full object-cover" />
                ) : generating ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] text-muted-foreground">Creating...</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-[10px] text-muted-foreground">Preview</p>
                  </div>
                )}
              </div>
              {resultUrl && (
                <div className="flex gap-2 mt-3 justify-center">
                  <Button variant="outline" size="sm" onClick={() => {
                    import("@/lib/utils").then((m) => m.downloadFile(resultUrl, `egaku_wallpaper_${device}.png`));
                  }}>Download</Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent("AI wallpaper by EGAKU AI")}&url=${encodeURIComponent("https://egaku-ai.com/wallpaper")}`, '_blank');
                  }}>Share</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
