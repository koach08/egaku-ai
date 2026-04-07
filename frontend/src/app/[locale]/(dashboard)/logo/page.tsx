"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import Link from "next/link";

const LOGO_STYLES = [
  { id: "minimal", name: "Minimalist", prompt: "minimalist logo design, clean lines, simple geometric shapes, flat design, professional, vector style" },
  { id: "modern", name: "Modern Tech", prompt: "modern technology logo, sleek gradient, geometric, futuristic, startup branding, clean design" },
  { id: "vintage", name: "Vintage / Retro", prompt: "vintage retro logo, badge style, distressed texture, classic typography, hand-drawn feel" },
  { id: "luxury", name: "Luxury / Premium", prompt: "luxury brand logo, gold and black, elegant serif typography, premium feel, sophisticated" },
  { id: "playful", name: "Playful / Fun", prompt: "playful colorful logo, rounded shapes, friendly, cartoon-inspired, vibrant colors, fun brand" },
  { id: "japanese", name: "Japanese / Zen", prompt: "Japanese zen inspired logo, minimal brush strokes, wabi-sabi aesthetic, organic shapes, ink style" },
  { id: "gaming", name: "Gaming / Esports", prompt: "gaming esports logo, aggressive angular shapes, bold colors, mascot style, dynamic energy" },
  { id: "organic", name: "Organic / Natural", prompt: "organic natural logo, leaf motif, earth tones, sustainable brand feel, hand-crafted" },
];

const BG_OPTIONS = [
  { id: "white", name: "White", prompt: "on pure white background" },
  { id: "black", name: "Black", prompt: "on pure black background" },
  { id: "transparent", name: "Transparent", prompt: "on transparent background, no background" },
  { id: "gradient", name: "Gradient", prompt: "on subtle gradient background" },
];

export default function LogoPage() {
  const { user, session } = useAuth();
  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline] = useState("");
  const [industry, setIndustry] = useState("");
  const [logoStyle, setLogoStyle] = useState("minimal");
  const [bgOption, setBgOption] = useState("white");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const generateLogos = async () => {
    if (!brandName.trim() || !session) {
      toast.error("Enter your brand name");
      return;
    }

    setGenerating(true);
    setResults([]);

    const style = LOGO_STYLES.find((s) => s.id === logoStyle);
    const bg = BG_OPTIONS.find((b) => b.id === bgOption);

    const basePrompt = `Logo design for "${brandName}"${tagline ? `, tagline: "${tagline}"` : ""}${industry ? `, industry: ${industry}` : ""}, ${style?.prompt || ""}, ${bg?.prompt || ""}, centered composition, high resolution, professional branding`;

    // Generate 3 variations
    const urls: string[] = [];
    for (let i = 0; i < 3; i++) {
      try {
        // Use Ideogram v3 for best text rendering
        const res = await api.generateImage(session.access_token, {
          prompt: basePrompt,
          negative_prompt: "blurry, low quality, distorted text, misspelled, amateur, clip art",
          model: "fal_ideogram",
          width: 1024, height: 1024,
          steps: 25, cfg: 7, sampler: "euler_ancestral", seed: -1, nsfw: false,
        });

        if (res.status === "completed" && res.result_url) {
          urls.push(resolveResultUrl(res.result_url) || "");
        } else {
          for (let j = 0; j < 40; j++) {
            await new Promise((r) => setTimeout(r, 3000));
            const status = await api.getJobStatus(session.access_token, res.job_id);
            if (status.status === "completed" && status.result_url) {
              urls.push(resolveResultUrl(status.result_url) || "");
              break;
            }
            if (status.status === "failed") break;
          }
        }
        setResults([...urls]);
      } catch {
        // Continue generating other variations
      }
    }

    setGenerating(false);
    if (urls.length > 0) toast.success(`${urls.length} logo variations generated!`);
    else toast.error("Logo generation failed");
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-3xl font-bold">AI Logo Maker</h1>
          <p className="text-muted-foreground">Enter your brand name and get 3 professional logo variations in seconds. Powered by Ideogram v3.</p>
          <Link href="/register"><Button size="lg">Create Your Logo</Button></Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">AI Logo Maker</h1>
          <p className="text-muted-foreground">3 professional logo variations from your brand name. Powered by Ideogram v3&apos;s industry-leading text rendering.</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Brand Name *</Label>
                  <Input placeholder="EGAKU AI" value={brandName} onChange={(e) => setBrandName(e.target.value)} className="text-lg font-bold" />
                </div>
                <div>
                  <Label className="text-xs">Tagline (optional)</Label>
                  <Input placeholder="Create with AI" value={tagline} onChange={(e) => setTagline(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Industry (optional)</Label>
                  <Input placeholder="Technology, Fashion, Food..." value={industry} onChange={(e) => setIndustry(e.target.value)} />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Logo Style</Label>
                  <Select value={logoStyle} onValueChange={(v) => v && setLogoStyle(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LOGO_STYLES.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Background</Label>
                  <Select value={bgOption} onValueChange={(v) => v && setBgOption(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BG_OPTIONS.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Button onClick={generateLogos} disabled={generating || !brandName.trim()} className="w-full bg-gradient-to-r from-violet-600 to-purple-600" size="lg">
              {generating ? "Generating 3 variations..." : "Generate 3 Logo Variations (15 credits)"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3">Your Logo Variations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {results.map((url, i) => (
                <Card key={i} className="overflow-hidden">
                  <img src={url} alt={`Logo variation ${i + 1}`} className="w-full aspect-square object-contain bg-white" />
                  <CardContent className="p-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                      import("@/lib/utils").then((m) => m.downloadFile(url, `${brandName.replace(/\s+/g, "_")}_logo_${i + 1}.png`));
                    }}>Download</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      import("@/lib/utils").then((m) => m.downloadFile(url, `${brandName.replace(/\s+/g, "_")}_logo_${i + 1}.png`));
                    }}>PNG</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {generating && results.length === 0 && (
          <div className="flex flex-col items-center py-16 space-y-3">
            <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Generating 3 logo variations...</p>
          </div>
        )}
      </div>
    </>
  );
}
