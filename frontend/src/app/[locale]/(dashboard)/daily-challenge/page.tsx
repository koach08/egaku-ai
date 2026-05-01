"use client";

import { useCallback, useEffect, useState } from "react";
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
  ThumbsUpIcon,
  TrophyIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "lucide-react";

// 365 themes that rotate daily based on day-of-year
const DAILY_THEMES = [
  "A dragon reading books in a cozy library",
  "Futuristic Tokyo at night, neon-lit rain",
  "An underwater city with bioluminescent architecture",
  "A samurai standing in a field of cherry blossoms at dawn",
  "Steampunk airship battle above the clouds",
  "A witch's potion shop, magical ingredients everywhere",
  "Cyberpunk street market in a dystopian megacity",
  "An astronaut discovering alien ruins on Mars",
  "A giant tree city in an enchanted forest",
  "A cozy cabin in a blizzard, warm light from windows",
  "Crystal cave with underground waterfalls",
  "A time traveler arriving in ancient Rome",
  "Abandoned theme park overtaken by nature",
  "Northern lights over a Viking longship",
  "A robot painter creating art in a gallery",
  "Desert oasis with floating islands above it",
  "A cat cafe on the moon",
  "Medieval jousting tournament with dragons watching",
  "Bioluminescent deep sea creatures",
  "A portal opening in a peaceful countryside",
  "Volcanic eruption viewed from a safe distance at sunset",
  "A jazz club in 1920s New York",
  "Ancient Egyptian temple during a solar eclipse",
  "A garden of giant flowers with tiny houses",
  "Pirate ship ghost sailing through fog",
  "A clockwork city with gears and brass",
  "Aurora borealis over a frozen lake",
  "A magical bookshop where books fly",
  "Samurai vs robots in Neo-Kyoto",
  "A treehouse village connected by rope bridges",
];

function getTodayTheme(): { theme: string; dayIndex: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayIndex = Math.floor(diff / (1000 * 60 * 60 * 24));
  const theme = DAILY_THEMES[dayIndex % DAILY_THEMES.length];
  return { theme, dayIndex };
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

type Submission = {
  id: string;
  user_id: string;
  display_name: string;
  image_url: string;
  prompt: string;
  votes: number;
  has_voted: boolean;
  created_at: string;
};

export default function DailyChallengePage() {
  const { session } = useAuth();
  const { theme } = getTodayTheme();
  const todayKey = getTodayKey();

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [mySubmission, setMySubmission] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  // Check if user already submitted today (localStorage)
  useEffect(() => {
    const stored = localStorage.getItem(`egaku_daily_${todayKey}`);
    if (stored) setMySubmission(stored);
  }, [todayKey]);

  // Load today's submissions
  useEffect(() => {
    setLoadingSubs(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/submissions?date=${todayKey}`)
      .then((r) => r.json())
      .then((data) => setSubmissions(data.submissions || []))
      .catch(() => {})
      .finally(() => setLoadingSubs(false));
  }, [todayKey]);

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || !prompt.trim()) return;
    setGenerating(true);
    try {
      const fullPrompt = `${theme}. ${prompt}`;
      const res = await api.generateImage(session.access_token, {
        prompt: fullPrompt,
        negative_prompt: "worst quality, low quality, blurry, deformed",
        model: "fal_flux_dev",
        width: 1024,
        height: 1024,
        steps: 25,
        cfg: 7,
        sampler: "euler_ancestral",
        seed: -1,
        nsfw: false,
      });

      // Poll for result
      const jobId = res.job_id;
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await api.getJobStatus(session.access_token, jobId);
        if (status.status === "completed" && status.result_url) {
          const url = resolveResultUrl(status.result_url) || status.result_url;

          // Submit to daily challenge
          try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/submit`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                date: todayKey,
                theme,
                prompt: fullPrompt,
                image_url: url,
              }),
            });
          } catch {}

          setMySubmission(url);
          localStorage.setItem(`egaku_daily_${todayKey}`, url);
          toast.success("Submitted to today's challenge!");

          // Reload submissions
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/submissions?date=${todayKey}`)
            .then((r) => r.json())
            .then((data) => setSubmissions(data.submissions || []))
            .catch(() => {});
          return;
        }
        if (status.status === "failed") {
          toast.error("Generation failed. Try again.");
          return;
        }
      }
      toast.error("Generation timed out.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }, [session, prompt, theme, todayKey]);

  const handleVote = async (submissionId: string) => {
    if (!session?.access_token) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ submission_id: submissionId, date: todayKey }),
      });
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId ? { ...s, votes: s.votes + 1, has_voted: true } : s
        )
      );
      toast.success("Voted!");
    } catch {
      toast.error("Vote failed");
    }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <CalendarIcon className="size-6 text-amber-400" />
          <h1 className="text-2xl font-bold">Daily Challenge</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          New theme every day. Create your best interpretation. Community votes for the winner.
        </p>

        {/* Today's theme */}
        <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-6 mb-8">
          <div className="text-xs text-amber-400 font-medium mb-2">TODAY&apos;S THEME</div>
          <h2 className="text-xl font-bold">{theme}</h2>
          <div className="text-xs text-white/40 mt-2">{todayKey}</div>
        </div>

        {!session ? (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to participate</p>
            <Button render={<Link href="/login" />}>Sign In</Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Submit section */}
            {!mySubmission ? (
              <div className="rounded-xl border border-white/[0.06] p-6 space-y-4">
                <h3 className="text-sm font-semibold">Your Interpretation</h3>
                <Textarea
                  placeholder={`Add your creative spin on "${theme}"... (style, mood, details)`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={2}
                />
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-full h-11"
                >
                  {generating ? (
                    <><Loader2Icon className="size-4 mr-2 animate-spin" />Generating &amp; Submitting...</>
                  ) : (
                    <><SparklesIcon className="size-4 mr-2" />Generate &amp; Submit (3 credits)</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrophyIcon className="size-4 text-emerald-400" />
                  <span className="text-sm font-medium">Your submission for today</span>
                </div>
                <img src={mySubmission} alt="My submission" className="w-full max-w-sm rounded-lg" />
              </div>
            )}

            {/* Gallery of submissions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Today&apos;s Submissions ({submissions.length})
              </h3>
              {loadingSubs ? (
                <div className="text-sm text-white/40">Loading...</div>
              ) : submissions.length === 0 ? (
                <div className="text-sm text-white/40">No submissions yet. Be the first!</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {submissions
                    .sort((a, b) => b.votes - a.votes)
                    .map((sub, i) => (
                      <div key={sub.id} className="relative rounded-xl border border-white/[0.06] overflow-hidden group">
                        {i === 0 && submissions.length > 1 && (
                          <div className="absolute top-2 left-2 z-10 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <TrophyIcon className="size-3" /> Leading
                          </div>
                        )}
                        <img
                          src={sub.image_url}
                          alt={sub.prompt}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="p-3 space-y-2">
                          <div className="text-xs text-white/40 truncate">{sub.display_name}</div>
                          <div className="text-xs text-white/60 line-clamp-2">{sub.prompt}</div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/40">{sub.votes} votes</span>
                            <button
                              onClick={() => handleVote(sub.id)}
                              disabled={sub.has_voted}
                              className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-colors ${
                                sub.has_voted
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <ThumbsUpIcon className="size-3" />
                              {sub.has_voted ? "Voted" : "Vote"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
