"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import Link from "next/link";

type ReferralInfo = {
  code: string;
  share_url: string;
  total_referred: number;
  total_bonus_credits: number;
  signup_bonus: number;
  upgrade_bonus: number;
};

export default function ReferralsPage() {
  const { user, session, loading: authLoading } = useAuth();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    api.getMyReferralCode(session.access_token)
      .then((data: ReferralInfo) => setInfo(data))
      .catch(() => toast.error("Failed to load referral info"))
      .finally(() => setLoading(false));
  }, [session]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const shareOnX = () => {
    if (!info) return;
    const text = `I'm creating AI art, video & music on EGAKU AI — 40+ tools, free to start. Use my link for +${info.signup_bonus} bonus credits!`;
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(info.share_url)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-3xl font-bold">Refer Friends, Earn Credits</h1>
          <p className="text-muted-foreground">Invite your friends to EGAKU AI. Both of you get bonus credits.</p>
          <Link href="/register"><Button size="lg">Sign up to start referring</Button></Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Referral Program</h1>
          <p className="text-muted-foreground">Invite friends, earn credits together.</p>
        </div>

        {loading || !info ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent></Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">{info.total_referred}</p>
                  <p className="text-xs text-muted-foreground mt-1">Friends Invited</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-green-400">+{info.total_bonus_credits}</p>
                  <p className="text-xs text-muted-foreground mt-1">Credits Earned</p>
                </CardContent>
              </Card>
            </div>

            {/* How it works */}
            <Card className="border-purple-500/30 bg-purple-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎁</span>
                  <div>
                    <p className="font-semibold">Friend signs up with your link</p>
                    <p className="text-xs text-muted-foreground">You both get <strong className="text-green-400">+{info.signup_bonus} credits</strong></p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💎</span>
                  <div>
                    <p className="font-semibold">Friend upgrades to a paid plan</p>
                    <p className="text-xs text-muted-foreground">You get <strong className="text-green-400">+{info.upgrade_bonus} credits</strong> on top</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share box */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Your Referral Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input value={info.share_url} readOnly className="font-mono text-xs" />
                  <Button onClick={() => copy(info.share_url, "Link")} variant="outline">
                    Copy
                  </Button>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground">Code:</span>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{info.code}</code>
                  <Button onClick={() => copy(info.code, "Code")} variant="ghost" size="sm">Copy code</Button>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={shareOnX}
                    className="flex-1 bg-black text-white hover:bg-gray-900"
                  >
                    Share on X
                  </Button>
                  <Button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: "EGAKU AI - Join with my link",
                          text: `Get +${info?.signup_bonus} free credits on EGAKU AI`,
                          url: info.share_url,
                        }).catch(() => {});
                      } else {
                        copy(info.share_url, "Link");
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Share...
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
