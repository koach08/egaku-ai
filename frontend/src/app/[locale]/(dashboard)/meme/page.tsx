"use client";

import { useRef, useState } from "react";
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

const MEME_TEMPLATES = [
  { id: "custom", name: "Custom (AI generates image)", prompt: "" },
  { id: "drake", name: "Drake Approve/Disapprove", prompt: "Split panel meme template, top panel showing a man disapproving with hand up, bottom panel showing same man pointing and approving, clean white background, cartoon style" },
  { id: "expanding_brain", name: "Expanding Brain", prompt: "Four panel meme showing increasing brain sizes from small normal brain to massive glowing galaxy brain, clean template style, each panel labeled" },
  { id: "distracted", name: "Distracted Boyfriend", prompt: "Three people on a street, a man looking back at a passing woman while his girlfriend looks disapproved, stock photo style, meme template" },
  { id: "this_is_fine", name: "This Is Fine", prompt: "Cartoon dog sitting in a room that is on fire, drinking coffee calmly, everything is on fire around him, comic style" },
  { id: "stonks", name: "Stonks", prompt: "Low-poly 3D rendered bald man in suit standing in front of a stock market chart going up, glowing green arrows, stonks meme style" },
  { id: "galaxy_brain", name: "Galaxy Brain", prompt: "A person with an enormous glowing cosmic galaxy brain emanating light and energy, transcendent knowledge, surreal digital art" },
  { id: "anime_reaction", name: "Anime Reaction", prompt: "Anime character with extremely exaggerated shocked expression, wide eyes, open mouth, speed lines background, manga reaction style" },
];

const FONT_STYLES = [
  { id: "impact", name: "Impact (Classic)", font: "Impact, sans-serif", color: "#ffffff", stroke: "#000000" },
  { id: "comic", name: "Comic Sans", font: "Comic Sans MS, cursive", color: "#000000", stroke: "none" },
  { id: "bold", name: "Bold Modern", font: "Arial Black, sans-serif", color: "#ffffff", stroke: "#000000" },
  { id: "handwritten", name: "Handwritten", font: "Brush Script MT, cursive", color: "#ffffff", stroke: "#000000" },
];

export default function MemePage() {
  const { user, session } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [template, setTemplate] = useState("custom");
  const [customPrompt, setCustomPrompt] = useState("");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [fontStyle, setFontStyle] = useState("impact");
  const [generating, setGenerating] = useState(false);
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);
  const [memeDataUrl, setMemeDataUrl] = useState<string | null>(null);

  const generateMeme = async () => {
    if (!session) { toast.error("Please sign in"); return; }

    const selectedTemplate = MEME_TEMPLATES.find((t) => t.id === template);
    const imgPrompt = template === "custom"
      ? (customPrompt || "funny situation, meme format, humorous, clean background")
      : selectedTemplate?.prompt || "";

    setGenerating(true);
    setMemeDataUrl(null);

    try {
      const res = await api.generateImage(session.access_token, {
        prompt: imgPrompt,
        negative_prompt: "text, words, letters, watermark, signature",
        model: "fal_flux_dev",
        width: 1024, height: 1024,
        steps: 20, cfg: 7, sampler: "euler_ancestral", seed: -1, nsfw: false,
      });

      let imageUrl: string | null = null;
      if (res.status === "completed" && res.result_url) {
        imageUrl = resolveResultUrl(res.result_url) || null;
      } else {
        for (let i = 0; i < 60; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const status = await api.getJobStatus(session.access_token, res.job_id);
          if (status.status === "completed" && status.result_url) {
            imageUrl = resolveResultUrl(status.result_url) || null;
            break;
          }
          if (status.status === "failed") break;
        }
      }

      if (!imageUrl) { toast.error("Image generation failed"); return; }
      setBaseImageUrl(imageUrl);

      // Render meme with text overlay on canvas
      await renderMeme(imageUrl, topText, bottomText);
      toast.success("Meme created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setGenerating(false);
    }
  };

  const renderMeme = async (imgUrl: string, top: string, bottom: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imgUrl;
    });

    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const style = FONT_STYLES.find((f) => f.id === fontStyle) || FONT_STYLES[0];
    const fontSize = Math.floor(img.width / 12);

    ctx.font = `bold ${fontSize}px ${style.font}`;
    ctx.textAlign = "center";
    ctx.fillStyle = style.color;
    if (style.stroke !== "none") {
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = fontSize / 10;
      ctx.lineJoin = "round";
    }

    const drawText = (text: string, y: number) => {
      const words = text.toUpperCase().split(" ");
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > img.width * 0.9) {
          if (current) lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);

      lines.forEach((line, i) => {
        const ly = y + i * (fontSize * 1.2);
        if (style.stroke !== "none") ctx.strokeText(line, img.width / 2, ly);
        ctx.fillText(line, img.width / 2, ly);
      });
    };

    if (top) drawText(top, fontSize * 1.2);
    if (bottom) drawText(bottom, img.height - fontSize * 0.5);

    setMemeDataUrl(canvas.toDataURL("image/png"));
  };

  // Re-render when text changes (if base image exists)
  const updateText = async () => {
    if (baseImageUrl) await renderMeme(baseImageUrl, topText, bottomText);
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-3xl font-bold">AI Meme Generator</h1>
          <p className="text-muted-foreground">Create viral memes with AI-generated images. Add custom text, choose templates, share instantly.</p>
          <Link href="/register"><Button size="lg">Start Creating Memes</Button></Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">AI Meme Generator</h1>
          <p className="text-muted-foreground">AI creates the image, you add the punchline.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Meme Setup</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Template</Label>
                  <Select value={template} onValueChange={(v) => v && setTemplate(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MEME_TEMPLATES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {template === "custom" && (
                  <div>
                    <Label className="text-xs">Image Description</Label>
                    <Textarea
                      placeholder="A cat wearing a tiny business suit sitting at a desk..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
                <div>
                  <Label className="text-xs">Top Text</Label>
                  <Input placeholder="WHEN THE BOSS SAYS..." value={topText} onChange={(e) => setTopText(e.target.value)} onBlur={updateText} />
                </div>
                <div>
                  <Label className="text-xs">Bottom Text</Label>
                  <Input placeholder="...BUT YOU ALREADY LEFT" value={bottomText} onChange={(e) => setBottomText(e.target.value)} onBlur={updateText} />
                </div>
                <div>
                  <Label className="text-xs">Font Style</Label>
                  <Select value={fontStyle} onValueChange={(v) => v && setFontStyle(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_STYLES.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Button onClick={generateMeme} disabled={generating} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500" size="lg">
              {generating ? "Creating meme..." : "Generate Meme (3 credits)"}
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Your Meme</CardTitle></CardHeader>
            <CardContent>
              <canvas ref={canvasRef} className="hidden" />
              {memeDataUrl ? (
                <div className="space-y-3">
                  <img src={memeDataUrl} alt="Generated meme" className="w-full rounded-lg" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                      const a = document.createElement("a");
                      a.href = memeDataUrl;
                      a.download = "egaku-meme.png";
                      a.click();
                    }}>Download</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent("Made with EGAKU AI Meme Generator")}&url=${encodeURIComponent("https://egaku-ai.com/meme")}`, '_blank');
                    }}>Share</Button>
                  </div>
                </div>
              ) : generating ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">AI is creating your meme...</p>
                </div>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <p className="text-sm text-muted-foreground">Your meme will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
