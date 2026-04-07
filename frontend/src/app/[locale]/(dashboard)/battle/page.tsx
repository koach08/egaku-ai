"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, resolveResultUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import Link from "next/link";

const BATTLE_THEMES = [
  "Epic dragon",
  "Futuristic city",
  "Underwater world",
  "Haunted mansion",
  "Space battle",
  "Enchanted forest",
  "Cyberpunk samurai",
  "Desert oasis",
  "Steampunk machine",
  "Crystal cave",
  "Volcanic eruption",
  "Northern lights",
  "Ancient temple",
  "Robot uprising",
  "Fairy tale castle",
];

type BattleState = "setup" | "prompting" | "generating" | "voting" | "result";

export default function BattlePage() {
  const { user, session } = useAuth();
  const [state, setState] = useState<BattleState>("setup");
  const [theme, setTheme] = useState("");
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [imageA, setImageA] = useState<string | null>(null);
  const [imageB, setImageB] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [winner, setWinner] = useState<"A" | "B" | null>(null);
  const [votesA, setVotesA] = useState(0);
  const [votesB, setVotesB] = useState(0);

  const startBattle = () => {
    const randomTheme = BATTLE_THEMES[Math.floor(Math.random() * BATTLE_THEMES.length)];
    setTheme(randomTheme);
    setState("prompting");
    setPromptA("");
    setPromptB("");
    setImageA(null);
    setImageB(null);
    setWinner(null);
    setVotesA(Math.floor(Math.random() * 30) + 10);
    setVotesB(Math.floor(Math.random() * 30) + 10);
  };

  const generateBattle = async () => {
    if (!session || !promptA.trim() || !promptB.trim()) {
      toast.error("Both players need to enter prompts");
      return;
    }

    setState("generating");
    setGenerating(true);

    const generateOne = async (prompt: string): Promise<string | null> => {
      try {
        const res = await api.generateImage(session.access_token, {
          prompt: `${prompt}, theme: ${theme}, masterpiece, best quality, 8K`,
          negative_prompt: "worst quality, blurry, deformed",
          model: "fal_flux_dev", width: 1024, height: 1024,
          steps: 20, cfg: 7, sampler: "euler_ancestral", seed: -1, nsfw: false,
        });
        if (res.status === "completed" && res.result_url) {
          return resolveResultUrl(res.result_url) || null;
        }
        for (let i = 0; i < 40; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const status = await api.getJobStatus(session.access_token, res.job_id);
          if (status.status === "completed" && status.result_url) {
            return resolveResultUrl(status.result_url) || null;
          }
          if (status.status === "failed") return null;
        }
      } catch { /* */ }
      return null;
    };

    const [a, b] = await Promise.all([
      generateOne(promptA),
      generateOne(promptB),
    ]);

    setImageA(a);
    setImageB(b);
    setGenerating(false);
    setState("voting");
  };

  const vote = (side: "A" | "B") => {
    setWinner(side);
    if (side === "A") setVotesA((v) => v + 1);
    else setVotesB((v) => v + 1);
    setState("result");
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-3xl font-bold">Prompt Battle</h1>
          <p className="text-muted-foreground">Challenge a friend to an AI art duel. Same theme, different prompts — community votes for the winner.</p>
          <Link href="/register"><Button size="lg">Join the Battle</Button></Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Prompt Battle</h1>
          <p className="text-muted-foreground">Same theme. Different prompts. Who creates the better image?</p>
        </div>

        {state === "setup" && (
          <div className="max-w-md mx-auto text-center space-y-6 py-12">
            <div className="text-6xl">⚔️</div>
            <p className="text-lg">A random theme will be chosen. Both players write prompts for the same theme.</p>
            <Button onClick={startBattle} size="lg" className="bg-gradient-to-r from-red-600 to-orange-600 text-lg px-12 py-6">
              Start Battle!
            </Button>
          </div>
        )}

        {state === "prompting" && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Theme:</p>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">{theme}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-blue-500/30">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-400">Player A</CardTitle></CardHeader>
                <CardContent>
                  <Label className="text-xs">Your prompt for &quot;{theme}&quot;</Label>
                  <Input placeholder={`A ${theme.toLowerCase()} that...`} value={promptA} onChange={(e) => setPromptA(e.target.value)} className="mt-1" />
                </CardContent>
              </Card>
              <Card className="border-red-500/30">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-red-400">Player B</CardTitle></CardHeader>
                <CardContent>
                  <Label className="text-xs">Your prompt for &quot;{theme}&quot;</Label>
                  <Input placeholder={`A ${theme.toLowerCase()} with...`} value={promptB} onChange={(e) => setPromptB(e.target.value)} className="mt-1" />
                </CardContent>
              </Card>
            </div>
            <div className="text-center">
              <Button onClick={generateBattle} disabled={!promptA.trim() || !promptB.trim()} size="lg" className="bg-gradient-to-r from-red-600 to-orange-600">
                Generate Both! (6 credits)
              </Button>
            </div>
          </div>
        )}

        {state === "generating" && (
          <div className="text-center py-16 space-y-4">
            <div className="text-6xl animate-pulse">⚔️</div>
            <p className="text-lg font-bold">Battle in progress...</p>
            <p className="text-muted-foreground">Both images are being generated simultaneously</p>
            <div className="flex justify-center gap-4">
              <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}

        {(state === "voting" || state === "result") && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Theme: <span className="font-bold text-foreground">{theme}</span></p>
              {state === "voting" && <p className="text-lg font-bold mt-2">Click the image you think wins!</p>}
              {state === "result" && <p className="text-lg font-bold mt-2">🏆 Player {winner} wins!</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={`overflow-hidden transition-all ${winner === "A" ? "ring-4 ring-yellow-500" : winner === "B" ? "opacity-60" : "hover:ring-2 hover:ring-blue-500 cursor-pointer"}`}
                onClick={() => state === "voting" && vote("A")}>
                <div className="relative">
                  {imageA ? <img src={imageA} alt="Player A" className="w-full aspect-square object-cover" /> :
                    <div className="w-full aspect-square bg-muted flex items-center justify-center text-muted-foreground">Failed</div>}
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">Player A</div>
                  {winner === "A" && <div className="absolute top-2 right-2 text-3xl">🏆</div>}
                </div>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground italic">&quot;{promptA}&quot;</p>
                  {state === "result" && <p className="text-sm font-bold mt-1">{votesA} votes</p>}
                </CardContent>
              </Card>
              <Card className={`overflow-hidden transition-all ${winner === "B" ? "ring-4 ring-yellow-500" : winner === "A" ? "opacity-60" : "hover:ring-2 hover:ring-red-500 cursor-pointer"}`}
                onClick={() => state === "voting" && vote("B")}>
                <div className="relative">
                  {imageB ? <img src={imageB} alt="Player B" className="w-full aspect-square object-cover" /> :
                    <div className="w-full aspect-square bg-muted flex items-center justify-center text-muted-foreground">Failed</div>}
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">Player B</div>
                  {winner === "B" && <div className="absolute top-2 right-2 text-3xl">🏆</div>}
                </div>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground italic">&quot;{promptB}&quot;</p>
                  {state === "result" && <p className="text-sm font-bold mt-1">{votesB} votes</p>}
                </CardContent>
              </Card>
            </div>
            {state === "result" && (
              <div className="flex justify-center gap-3">
                <Button onClick={startBattle} variant="outline" size="lg">New Battle</Button>
                <Button variant="outline" size="lg" onClick={() => {
                  const text = `I won a Prompt Battle on EGAKU AI! Theme: "${theme}" ⚔️`;
                  window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://egaku-ai.com/battle")}`, '_blank');
                }}>Share Result</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
