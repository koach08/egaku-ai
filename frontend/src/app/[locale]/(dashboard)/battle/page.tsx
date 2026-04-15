"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import Link from "next/link";

const BATTLE_THEMES = [
  "Epic dragon in a library",
  "Futuristic Tokyo at night",
  "Underwater civilization",
  "Haunted Victorian mansion",
  "Deep space battle",
  "Enchanted forest spirits",
  "Cyberpunk samurai duel",
  "Desert oasis at dawn",
  "Steampunk airship",
  "Crystal cave interior",
  "Volcanic god awakening",
  "Aurora over mountains",
  "Ancient temple ruins",
  "Robot uprising",
  "Fairy tale castle",
];

type BattleStatus = "waiting_opponent" | "voting" | "completed" | "cancelled";

type Battle = {
  id: string;
  creator_id: string;
  opponent_id: string | null;
  creator_name: string;
  opponent_name: string | null;
  theme: string;
  prompt_a: string;
  image_a_url: string;
  prompt_b: string | null;
  image_b_url: string | null;
  model_a: string;
  model_b: string | null;
  status: BattleStatus;
  votes_a: number;
  votes_b: number;
  total_votes: number;
  winner: "A" | "B" | "T" | null;
  nsfw: boolean;
  created_at: string;
  voting_ends_at: string | null;
  closed_at: string | null;
  has_voted: "A" | "B" | null;
};

type LeaderboardRow = {
  user_id: string;
  display_name: string;
  wins: number;
  losses: number;
  ties: number;
  battles_total: number;
  total_votes_received: number;
  elo: number;
};

type MyStats = {
  user_id: string;
  wins: number;
  losses: number;
  ties: number;
  battles_total: number;
  total_votes_received: number;
  elo: number;
};

function formatTimeRemaining(endsAt: string | null): string {
  if (!endsAt) return "";
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  const ms = end - now;
  if (ms <= 0) return "Closing…";
  const days = Math.floor(ms / (24 * 3600 * 1000));
  const hours = Math.floor((ms % (24 * 3600 * 1000)) / (3600 * 1000));
  const mins = Math.floor((ms % (3600 * 1000)) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export default function BattlePage() {
  const { user, session } = useAuth();
  const [tab, setTab] = useState("create");

  // Create tab state
  const [theme, setTheme] = useState("");
  const [customTheme, setCustomTheme] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [nsfw, setNsfw] = useState(false);
  const [creating, setCreating] = useState(false);

  // Challenges tab state
  const [waitingBattles, setWaitingBattles] = useState<Battle[]>([]);
  const [loadingWaiting, setLoadingWaiting] = useState(false);
  const [acceptTarget, setAcceptTarget] = useState<Battle | null>(null);
  const [counterPrompt, setCounterPrompt] = useState("");
  const [accepting, setAccepting] = useState(false);

  // Voting tab state
  const [votingBattles, setVotingBattles] = useState<Battle[]>([]);
  const [loadingVoting, setLoadingVoting] = useState(false);
  const [votingInFlight, setVotingInFlight] = useState<string | null>(null);

  // Leaderboard + My Stats
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [myBattles, setMyBattles] = useState<Battle[]>([]);
  const [loadingLb, setLoadingLb] = useState(false);

  const loadWaiting = useCallback(async () => {
    setLoadingWaiting(true);
    try {
      const res = await api.listBattles(
        "waiting_opponent",
        1,
        24,
        false,
        session?.access_token,
      );
      setWaitingBattles(res.items || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load challenges";
      toast.error(msg);
    } finally {
      setLoadingWaiting(false);
    }
  }, [session?.access_token]);

  const loadVoting = useCallback(async () => {
    setLoadingVoting(true);
    try {
      const res = await api.listBattles(
        "voting",
        1,
        24,
        false,
        session?.access_token,
      );
      setVotingBattles(res.items || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load battles";
      toast.error(msg);
    } finally {
      setLoadingVoting(false);
    }
  }, [session?.access_token]);

  const loadLeaderboard = useCallback(async () => {
    setLoadingLb(true);
    try {
      const [lb, mine] = await Promise.all([
        api.battleLeaderboard(20),
        session ? api.myBattles(session.access_token) : Promise.resolve(null),
      ]);
      setLeaderboard(lb.items || []);
      if (mine) {
        setMyStats(mine.stats || null);
        setMyBattles(mine.items || []);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load leaderboard";
      toast.error(msg);
    } finally {
      setLoadingLb(false);
    }
  }, [session]);

  useEffect(() => {
    if (tab === "challenges") void loadWaiting();
    else if (tab === "vote") void loadVoting();
    else if (tab === "leaderboard") void loadLeaderboard();
  }, [tab, loadWaiting, loadVoting, loadLeaderboard]);

  const handleCreate = async () => {
    if (!session) {
      toast.error("Please sign in first.");
      return;
    }
    const themeText = customTheme ? theme.trim() : theme;
    if (!themeText) {
      toast.error("Pick or enter a theme.");
      return;
    }
    if (prompt.trim().length < 3) {
      toast.error("Write a prompt (at least 3 characters).");
      return;
    }
    setCreating(true);
    try {
      const res: Battle = await api.createBattle(session.access_token, {
        theme: themeText,
        prompt: prompt.trim(),
        nsfw,
      });
      toast.success("Battle created! Waiting for an opponent to accept.");
      setPrompt("");
      setTab("challenges");
      setWaitingBattles((prev) => [res, ...prev]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create battle";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleAccept = async () => {
    if (!session || !acceptTarget) return;
    if (counterPrompt.trim().length < 3) {
      toast.error("Write a counter-prompt (at least 3 characters).");
      return;
    }
    setAccepting(true);
    try {
      const res: Battle = await api.acceptBattle(
        session.access_token,
        acceptTarget.id,
        { prompt: counterPrompt.trim() },
      );
      toast.success("Challenge accepted! Voting is open.");
      setAcceptTarget(null);
      setCounterPrompt("");
      // Remove from waiting list, add to voting list
      setWaitingBattles((prev) => prev.filter((b) => b.id !== res.id));
      setVotingBattles((prev) => [res, ...prev]);
      setTab("vote");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to accept battle";
      toast.error(msg);
    } finally {
      setAccepting(false);
    }
  };

  const handleVote = async (battle: Battle, side: "A" | "B") => {
    if (!session) {
      toast.error("Sign in to vote.");
      return;
    }
    if (battle.has_voted) {
      toast.info("You've already voted on this battle.");
      return;
    }
    setVotingInFlight(battle.id);
    try {
      const updated: Battle = await api.voteBattle(
        session.access_token,
        battle.id,
        side,
      );
      setVotingBattles((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b)),
      );
      toast.success(`Voted for Player ${side}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to vote";
      toast.error(msg);
    } finally {
      setVotingInFlight(null);
    }
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-3xl font-bold">Prompt Battle</h1>
          <p className="text-muted-foreground">
            Challenge other creators to an AI art duel. Pick a theme, write a
            prompt, and let the community vote for the winner.
          </p>
          <Link href="/register">
            <Button size="lg">Sign in to play</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Prompt Battle</h1>
          <p className="text-muted-foreground">
            Write one prompt. Someone else writes the counter. Community votes.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="vote">Vote</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* ────── CREATE ────── */}
          <TabsContent value="create" className="space-y-4 mt-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex flex-wrap gap-2">
                    {BATTLE_THEMES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTheme(t);
                          setCustomTheme(false);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full border transition ${
                          !customTheme && theme === t
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomTheme(true);
                        setTheme("");
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition ${
                        customTheme
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      Custom…
                    </button>
                  </div>
                  {customTheme && (
                    <Input
                      placeholder="Enter a theme (e.g. 'Lighthouse in a storm')"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      maxLength={200}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Your prompt (Player A)</Label>
                  <Textarea
                    placeholder="Describe your take on the theme. The better the prompt, the better the image."
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {prompt.length}/1000
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={nsfw}
                    onChange={(e) => setNsfw(e.target.checked)}
                  />
                  NSFW (requires age verification)
                </label>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Cost: 2 credits (one image). Opponent pays their own 2 credits
                    when accepting.
                  </p>
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="bg-gradient-to-r from-red-600 to-orange-600"
                  >
                    {creating ? "Generating…" : "Create battle"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ────── CHALLENGES ────── */}
          <TabsContent value="challenges" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Open challenges</h2>
              <Button variant="outline" size="sm" onClick={loadWaiting}>
                Refresh
              </Button>
            </div>
            {loadingWaiting ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : waitingBattles.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                No open challenges right now. Create one from the Create tab!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {waitingBattles.map((b) => (
                  <Card key={b.id} className="overflow-hidden">
                    {b.image_a_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={b.image_a_url}
                        alt={b.theme}
                        className="w-full aspect-square object-cover"
                      />
                    ) : (
                      <div className="aspect-square bg-muted" />
                    )}
                    <CardContent className="p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {b.creator_name}
                      </p>
                      <p className="text-sm font-semibold line-clamp-2">
                        {b.theme}
                      </p>
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={b.creator_id === user.id}
                        onClick={() => {
                          setAcceptTarget(b);
                          setCounterPrompt("");
                        }}
                      >
                        {b.creator_id === user.id
                          ? "Your battle"
                          : "Accept challenge"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Dialog
              open={!!acceptTarget}
              onOpenChange={(open) => {
                if (!open) {
                  setAcceptTarget(null);
                  setCounterPrompt("");
                }
              }}
            >
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Accept challenge</DialogTitle>
                </DialogHeader>
                {acceptTarget && (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={acceptTarget.image_a_url}
                        alt={acceptTarget.theme}
                        className="w-24 h-24 rounded object-cover"
                      />
                      <div className="text-sm">
                        <p className="font-semibold">{acceptTarget.theme}</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          by {acceptTarget.creator_name}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-3 italic">
                          &quot;{acceptTarget.prompt_a}&quot;
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Your counter-prompt (Player B)</Label>
                      <Textarea
                        placeholder="Write your take on the same theme. Costs 2 credits."
                        rows={4}
                        value={counterPrompt}
                        onChange={(e) => setCounterPrompt(e.target.value)}
                        maxLength={1000}
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAcceptTarget(null)}
                    disabled={accepting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAccept} disabled={accepting}>
                    {accepting ? "Generating…" : "Accept (2 credits)"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ────── VOTE ────── */}
          <TabsContent value="vote" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Active battles</h2>
              <Button variant="outline" size="sm" onClick={loadVoting}>
                Refresh
              </Button>
            </div>
            {loadingVoting ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : votingBattles.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                No battles to vote on right now.
              </p>
            ) : (
              <div className="space-y-6">
                {votingBattles.map((b) => (
                  <VotingBattleCard
                    key={b.id}
                    battle={b}
                    onVote={(side) => handleVote(b, side)}
                    voting={votingInFlight === b.id}
                    currentUserId={user.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ────── LEADERBOARD + MY STATS ────── */}
          <TabsContent value="leaderboard" className="mt-6 space-y-6">
            {myStats && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold mb-3">Your stats</h3>
                  <div className="grid grid-cols-5 gap-4 text-center">
                    <Stat label="ELO" value={myStats.elo} />
                    <Stat label="Wins" value={myStats.wins} />
                    <Stat label="Losses" value={myStats.losses} />
                    <Stat label="Ties" value={myStats.ties} />
                    <Stat label="Total" value={myStats.battles_total} />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold">Top players</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadLeaderboard}
                  >
                    Refresh
                  </Button>
                </div>
                {loadingLb ? (
                  <p className="text-muted-foreground text-sm">Loading…</p>
                ) : leaderboard.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No ranked players yet. Be the first!
                  </p>
                ) : (
                  <div className="divide-y">
                    {leaderboard.map((row, i) => (
                      <div
                        key={row.user_id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground w-6 text-right">
                            {i + 1}
                          </span>
                          <span className="font-medium">
                            {row.display_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {row.wins}W / {row.losses}L
                            {row.ties > 0 ? ` / ${row.ties}T` : ""}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {row.elo}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {myBattles.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold mb-3">Your recent battles</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {myBattles.slice(0, 8).map((b) => (
                      <div
                        key={b.id}
                        className="space-y-1"
                        title={b.theme}
                      >
                        {b.image_a_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={b.image_a_url}
                            alt={b.theme}
                            className="w-full aspect-square object-cover rounded"
                          />
                        ) : (
                          <div className="aspect-square bg-muted rounded" />
                        )}
                        <p className="text-xs truncate">{b.theme}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {b.status.replace("_", " ")}
                          {b.winner && ` · ${b.winner === "T" ? "Tie" : `Winner ${b.winner}`}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function VotingBattleCard({
  battle,
  onVote,
  voting,
  currentUserId,
}: {
  battle: Battle;
  onVote: (side: "A" | "B") => void;
  voting: boolean;
  currentUserId: string;
}) {
  const isOwnBattle =
    battle.creator_id === currentUserId ||
    battle.opponent_id === currentUserId;
  const total = battle.votes_a + battle.votes_b;
  const pctA = total > 0 ? Math.round((battle.votes_a / total) * 100) : 0;
  const pctB = total > 0 ? 100 - pctA : 0;
  const showPercents = !!battle.has_voted || isOwnBattle;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">{battle.theme}</p>
            {battle.nsfw && (
              <Badge variant="destructive" className="text-xs mt-1">
                NSFW
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatTimeRemaining(battle.voting_ends_at)}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <BattleSide
            side="A"
            imageUrl={battle.image_a_url}
            prompt={battle.prompt_a}
            author={battle.creator_name}
            votes={battle.votes_a}
            pct={pctA}
            showPct={showPercents}
            votedFor={battle.has_voted}
            disabled={voting || isOwnBattle || !!battle.has_voted}
            onClick={() => onVote("A")}
          />
          <BattleSide
            side="B"
            imageUrl={battle.image_b_url}
            prompt={battle.prompt_b || ""}
            author={battle.opponent_name || "Player B"}
            votes={battle.votes_b}
            pct={pctB}
            showPct={showPercents}
            votedFor={battle.has_voted}
            disabled={voting || isOwnBattle || !!battle.has_voted}
            onClick={() => onVote("B")}
          />
        </div>
        {isOwnBattle && (
          <p className="text-xs text-muted-foreground italic">
            You&apos;re a player in this battle — you can&apos;t vote.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function BattleSide({
  side,
  imageUrl,
  prompt,
  author,
  votes,
  pct,
  showPct,
  votedFor,
  disabled,
  onClick,
}: {
  side: "A" | "B";
  imageUrl: string | null;
  prompt: string;
  author: string;
  votes: number;
  pct: number;
  showPct: boolean;
  votedFor: "A" | "B" | null;
  disabled: boolean;
  onClick: () => void;
}) {
  const tint = side === "A" ? "blue" : "red";
  const ringClass =
    votedFor === side
      ? "ring-4 ring-yellow-500"
      : votedFor && votedFor !== side
      ? "opacity-60"
      : !disabled
      ? `hover:ring-2 hover:ring-${tint}-500 cursor-pointer`
      : "";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`block text-left overflow-hidden rounded-lg transition-all border border-border ${ringClass}`}
    >
      <div className="relative">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={`Player ${side}`}
            className="w-full aspect-square object-cover"
          />
        ) : (
          <div className="w-full aspect-square bg-muted flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
        <div
          className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded ${
            side === "A" ? "bg-blue-500" : "bg-red-500"
          }`}
        >
          Player {side}
        </div>
        {showPct && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
            {pct}% · {votes}
          </div>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-xs text-muted-foreground">{author}</p>
        <p className="text-xs line-clamp-3 italic">&quot;{prompt}&quot;</p>
      </div>
    </button>
  );
}
