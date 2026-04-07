"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import Link from "next/link";

const SHORTS_STYLES = [
  { id: "cinematic", name: "Cinematic", suffix: ", cinematic quality, dramatic lighting, shallow depth of field, movie quality" },
  { id: "anime", name: "Anime", suffix: ", anime style, vibrant colors, cel shading, Japanese animation quality" },
  { id: "dreamy", name: "Dreamy / Ethereal", suffix: ", soft dreamy atmosphere, ethereal glow, pastel colors, flowing motion" },
  { id: "action", name: "Action / Epic", suffix: ", dynamic action, explosive energy, dramatic camera angles, blockbuster quality" },
  { id: "horror", name: "Dark / Horror", suffix: ", dark moody atmosphere, shadows, eerie lighting, thriller tension" },
  { id: "vintage", name: "Vintage / Retro", suffix: ", vintage film grain, warm retro colors, nostalgic atmosphere, 70s aesthetic" },
  { id: "neon", name: "Neon Cyberpunk", suffix: ", neon lights, cyberpunk city, rain reflections, futuristic, pink and blue glow" },
  { id: "nature", name: "Nature / Zen", suffix: ", peaceful natural scenery, gentle movement, soft sunlight, meditative calm" },
];

const VIDEO_MODELS = [
  { id: "fal_ltx_t2v", name: "LTX 2.3 (Fast)", credits: 5 },
  { id: "fal_wan_t2v", name: "Wan 2.1", credits: 10 },
  { id: "fal_kling_t2v", name: "Kling v2 (Best)", credits: 15 },
  { id: "fal_minimax_t2v", name: "Minimax Hailuo", credits: 15 },
];

export default function ShortsPage() {
  const { user, session, loading: authLoading } = useAuth();
  const [idea, setIdea] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [videoModel, setVideoModel] = useState("fal_kling_t2v");
  const [overlay, setOverlay] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const handleGenerate = async () => {
    if (!idea.trim() || !session) {
      toast.error("Please describe your short video idea");
      return;
    }

    setGenerating(true);
    setResultUrl(null);
    setElapsed(0);
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);

    try {
      const styleObj = SHORTS_STYLES.find((s) => s.id === style);
      const fullPrompt = `${idea.trim()}${styleObj?.suffix || ""}, vertical 9:16 format, short form video, smooth motion`;

      const res = await api.generateVideo(session.access_token, {
        prompt: fullPrompt,
        negative_prompt: "worst quality, low quality, blurry, deformed, watermark, text overlay, letterbox",
        model: videoModel,
        width: 576,
        height: 1024,
        steps: 25,
        cfg: 7,
        sampler: "euler_ancestral",
        seed: -1,
        frame_count: 40,
        fps: 8,
        nsfw: false,
      });

      // Poll for result
      const jobId = res.job_id;
      for (let i = 0; i < 120; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const status = await api.getJobStatus(session.access_token, jobId);
        if (status.status === "completed" && status.result_url) {
          setResultUrl(resolveResultUrl(status.result_url) || null);
          toast.success("Short video ready!");
          break;
        }
        if (status.status === "failed") {
          toast.error(status.error || "Generation failed");
          break;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
      clearInterval(timer);
    }
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-3xl font-bold">AI Video Shorts</h1>
          <p className="text-muted-foreground">Create TikTok, Reels, and Shorts videos with AI in seconds. Just describe your idea.</p>
          <Link href="/register"><Button size="lg">Start Creating</Button></Link>
        </div>
      </>
    );
  }

  const selectedCredits = VIDEO_MODELS.find((m) => m.id === videoModel)?.credits || 15;

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">AI Video Shorts</h1>
          <p className="text-muted-foreground">Describe your idea, pick a style, get a vertical video for TikTok / Reels / Shorts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Input */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Your Video Idea</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="A woman walking through cherry blossoms in slow motion..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={3}
                />
                <div>
                  <Label className="text-xs">Visual Style</Label>
                  <Select value={style} onValueChange={(v) => v && setStyle(v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SHORTS_STYLES.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Video Model</Label>
                  <Select value={videoModel} onValueChange={(v) => v && setVideoModel(v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VIDEO_MODELS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name} ({m.credits} cr)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Text Overlay (optional)</Label>
                  <Input
                    placeholder="Your caption or hashtag..."
                    value={overlay}
                    onChange={(e) => setOverlay(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={generating || !idea.trim()}
              className="w-full bg-gradient-to-r from-pink-600 to-red-600"
              size="lg"
            >
              {generating ? `Generating... (${elapsed}s)` : `Create Short (${selectedCredits} credits)`}
            </Button>
          </div>

          {/* Right: Preview */}
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Preview (9:16)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mx-auto" style={{ maxWidth: 270, aspectRatio: "9/16" }}>
                {resultUrl ? (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black">
                    <video
                      src={resultUrl}
                      controls
                      loop
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                    />
                    {overlay && (
                      <div className="absolute bottom-8 left-0 right-0 text-center px-4">
                        <p className="text-white text-sm font-bold drop-shadow-lg"
                          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                          {overlay}
                        </p>
                      </div>
                    )}
                  </div>
                ) : generating ? (
                  <div className="w-full h-full rounded-2xl bg-muted flex flex-col items-center justify-center space-y-3">
                    <div className="w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground">Creating your short...</p>
                    <p className="text-xs text-muted-foreground">{elapsed}s</p>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-2xl bg-muted flex items-center justify-center">
                    <p className="text-xs text-muted-foreground text-center px-4">Your vertical video will appear here</p>
                  </div>
                )}
              </div>
              {resultUrl && (
                <div className="flex gap-2 mt-3 justify-center">
                  <Button variant="outline" size="sm" onClick={() => {
                    import("@/lib/utils").then((m) => m.downloadFile(resultUrl, "egaku-short.mp4"));
                  }}>Download</Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const text = `Created with EGAKU AI`;
                    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(resultUrl)}`, '_blank');
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
