"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { PromoCodeInput } from "@/components/promo-code-input";
import { toast } from "sonner";
import { trackPurchase, trackBeginCheckout } from "@/components/analytics";

const PLAN_DISPLAY: Record<string, { name: string; price: string; credits: string }> = {
  free: { name: "Free", price: "¥0", credits: "50 / month" },
  lite: { name: "Lite", price: "¥480/mo", credits: "150 / month" },
  basic: { name: "Basic", price: "¥980/mo", credits: "500 / month" },
  pro: { name: "Pro", price: "¥2,980/mo", credits: "2,000 / month" },
  unlimited: { name: "Unlimited", price: "¥5,980/mo", credits: "Unlimited" },
  studio: { name: "Studio", price: "¥9,980/mo", credits: "Unlimited" },
};

interface SubscriptionInfo {
  plan: string;
  has_stripe: boolean;
  local_license?: boolean;
  subscription?: {
    status: string;
    current_period_end: number;
    cancel_at_period_end: boolean;
  };
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const { user, session, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [credits, setCredits] = useState<{ balance: number; lifetime_used: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [sendingVerification, setSendingVerification] = useState(false);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const plan = searchParams.get("plan") || "unknown";
    if (checkout === "success") {
      if (plan === "local") {
        toast.success("Self-hosted license purchased! Scroll down to download.");
      } else {
        toast.success("Subscription activated! Credits have been added.");
      }
      const planPrices: Record<string, number> = {
        lite: 480, basic: 980, pro: 2980, unlimited: 5980, studio: 9980, local: 4980,
      };
      trackPurchase(plan, planPrices[plan] || 0);
    } else if (checkout === "cancel") {
      toast.info("Checkout cancelled.");
    }
  }, [searchParams]);

  // Auto-start checkout if redirected from register with a plan
  useEffect(() => {
    const upgradePlan = searchParams.get("upgrade");
    if (upgradePlan && session && !upgrading) {
      handleUpgrade(upgradePlan);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, session]);

  useEffect(() => {
    if (!session) return;
    const token = session.access_token;

    Promise.all([
      api.getSubscription(token).then(setSubscription).catch(() => {}),
      api.getBalance(token).then(setCredits).catch(() => {}),
      api.getMe(token).then((me: { email_verified?: boolean }) => {
        setEmailVerified(me.email_verified !== false);
      }).catch(() => {}),
    ]);
  }, [session]);

  const handleSendVerification = async () => {
    if (!user?.email) return;
    setSendingVerification(true);
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOtp({
        email: user.email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });
      toast.success("Verification email sent! Check your inbox.");
    } catch {
      toast.error("Failed to send verification email");
    } finally {
      setSendingVerification(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    if (!session) return;
    setUpgrading(plan);
    const planPrices: Record<string, number> = {
      lite: 480, basic: 980, pro: 2980, unlimited: 5980, studio: 9980,
    };
    trackBeginCheckout(plan, planPrices[plan] || 0);
    try {
      const { checkout_url } = await api.createCheckout(session.access_token, plan);
      window.location.href = checkout_url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start checkout";
      toast.error(message);
    } finally {
      setUpgrading(null);
    }
  };

  const handleCryptoUpgrade = async (plan: string) => {
    if (!session) return;
    setUpgrading(plan);
    try {
      const res = await api.createCryptoCheckout(session.access_token, plan);
      if (res.invoice_url) window.location.href = res.invoice_url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Crypto checkout failed";
      toast.error(msg.includes("coming soon") ? "Crypto payments coming soon!" : msg);
    } finally {
      setUpgrading(null);
    }
  };

  const handleBuyCredits = async (pack: string) => {
    if (!session) return;
    setUpgrading(pack);
    try {
      const { checkout_url } = await api.createCreditPackCheckout(session.access_token, pack);
      window.location.href = checkout_url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start checkout";
      toast.error(message);
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { portal_url } = await api.createPortalSession(session.access_token);
      window.location.href = portal_url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to open billing portal";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p>Sign in to view settings</p>
        </div>
      </>
    );
  }

  const currentPlan = subscription?.plan || "free";
  const planInfo = PLAN_DISPLAY[currentPlan] || PLAN_DISPLAY.free;

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {/* Email Verification Banner */}
        {!emailVerified && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">Verify your email</p>
                  <p className="text-xs text-muted-foreground">
                    Email verification is required to upgrade your plan.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-amber-500/30 hover:bg-amber-500/10"
                  onClick={handleSendVerification}
                  disabled={sendingVerification}
                >
                  {sendingVerification ? "Sending..." : "Send Verification Email"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="text-xs font-mono text-muted-foreground">{user.id}</span>
            </div>
          </CardContent>
        </Card>

        {/* Auto-post to X/Twitter via RSS */}
        <AutoPostRssCard userId={user.id} />

        {/* Credits */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Credits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Balance</span>
              <span className="text-2xl font-bold">{credits?.balance ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Lifetime Used</span>
              <span className="text-sm">{credits?.lifetime_used ?? "—"}</span>
            </div>
            <div className="pt-2">
              <PromoCodeInput accessToken={session?.access_token} />
            </div>
          </CardContent>
        </Card>

        {/* Credit Packs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Buy Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">One-time purchase. No subscription needed. Credits never expire.</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {([
                { id: "pack_500", credits: 500, price: "¥500" },
                { id: "pack_1500", credits: 1500, price: "¥1,500" },
                { id: "pack_3000", credits: 3000, price: "¥3,000" },
                { id: "pack_6000", credits: 6000, price: "¥6,000", badge: "Recommended" },
                { id: "pack_12000", credits: 12000, price: "¥12,000" },
              ] as const).map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => handleBuyCredits(pack.id)}
                  disabled={upgrading === pack.id}
                  className="relative rounded-xl border border-white/[0.06] hover:border-purple-500/30 hover:bg-purple-500/5 p-4 text-center transition-all disabled:opacity-50"
                >
                  {pack.badge && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-purple-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                      {pack.badge}
                    </span>
                  )}
                  <div className="text-xl font-bold">{pack.credits.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">credits</div>
                  <div className="text-sm font-semibold mt-2">{pack.price}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Plan</CardTitle>
              <Badge variant={currentPlan === "free" ? "secondary" : "default"}>
                {planInfo.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="text-sm font-medium">{planInfo.price}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Credits</span>
              <span className="text-sm">{planInfo.credits}</span>
            </div>

            {subscription?.subscription && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="secondary">{subscription.subscription.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Next billing</span>
                  <span className="text-sm">
                    {new Date(subscription.subscription.current_period_end * 1000).toLocaleDateString()}
                  </span>
                </div>
                {subscription.subscription.cancel_at_period_end && (
                  <p className="text-sm text-amber-500">
                    Your subscription will be cancelled at the end of the current period.
                  </p>
                )}
              </>
            )}

            {/* Manage billing */}
            {subscription?.has_stripe && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageBilling}
                disabled={loading}
              >
                {loading ? "Opening..." : "Manage Billing"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Adult Expression Opt-in (Pro/Unlimited/Studio only) */}
        {["pro", "unlimited", "studio"].includes(currentPlan) && (
          <AdultOptInCard session={session} />
        )}

        {/* Upgrade Plans */}
        {currentPlan === "free" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upgrade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {(["lite", "basic", "pro", "unlimited", "studio"] as const).map((plan) => {
                  const info = PLAN_DISPLAY[plan];
                  return (
                    <div
                      key={plan}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{info.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {info.price} &middot; {info.credits} credits
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!emailVerified ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-500/30 text-amber-600"
                            onClick={handleSendVerification}
                            disabled={sendingVerification}
                          >
                            {sendingVerification ? "Sending..." : "Verify Email First"}
                          </Button>
                        ) : (
                          <div className="space-y-1.5">
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                              onClick={() => handleUpgrade(plan)}
                              disabled={upgrading !== null}
                            >
                              {upgrading === plan ? "Loading..." : "Upgrade (Credit Card)"}
                            </Button>
                            <button
                              onClick={() => handleCryptoUpgrade(plan)}
                              disabled={upgrading !== null}
                              className="w-full text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 border rounded transition-colors disabled:opacity-50"
                            >
                              or pay with Crypto
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Already subscribed - change plan */}
        {currentPlan !== "free" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Change Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Use the billing portal to upgrade, downgrade, or cancel your subscription.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageBilling}
                disabled={loading}
              >
                {loading ? "Opening..." : "Open Billing Portal"}
              </Button>
            </CardContent>
          </Card>
        )}
        {/* Self-Hosted Download */}
        {subscription?.local_license && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Self-Hosted License</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You own the self-hosted license. Download the full source code package below.
              </p>
              <Button
                className="w-full"
                onClick={async () => {
                  if (!session) return;
                  try {
                    const { download_url } = await api.getSelfHostedDownload(session.access_token);
                    window.location.href = download_url;
                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : "Download failed";
                    toast.error(message);
                  }
                }}
              >
                Download Source Code (.zip)
              </Button>
              <p className="text-xs text-muted-foreground">
                Includes: Next.js frontend, FastAPI backend, Supabase schema, deployment guide, and setup documentation.
                License: 1 project, commercial use OK, redistribution prohibited.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}


// ── Auto-post RSS Card ──

function AutoPostRssCard({ userId }: { userId: string }) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";
  const rssUrl = `${API_BASE}/rss/user/${userId}.xml`;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rssUrl);
      setCopied(true);
      toast.success("RSS URL copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Auto-post to X/Twitter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect this RSS feed to Zapier / IFTTT / Make.com to auto-tweet
          every new public creation.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Your personal RSS feed
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md break-all">
              {rssUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? "Copied" : "Copy URL"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            How to auto-post to X
          </p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>
              Sign up at{" "}
              <a
                href="https://zapier.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                zapier.com
              </a>{" "}
              (free plan, 100 tasks/month)
            </li>
            <li>Create a new Zap: &ldquo;RSS by Zapier&rdquo; → &ldquo;Twitter&rdquo;</li>
            <li>Paste the URL above as the RSS feed</li>
            <li>Connect your X account</li>
            <li>
              Customize tweet template, e.g.:{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                {"{{title}}\\n\\n{{description}}\\n{{link}}"}
              </code>
            </li>
            <li>Turn on — every new public creation auto-tweets!</li>
          </ol>
        </div>

        <p className="text-xs text-muted-foreground">
          Only public SFW items appear in the feed. Make items public from{" "}
          <span className="font-medium">My Gallery</span>.
        </p>
      </CardContent>
    </Card>
  );
}


// ── Adult Expression Opt-in Component ──

function AdultOptInCard({ session }: { session: { access_token: string } | null }) {
  const [status, setStatus] = useState<"loading" | "inactive" | "active">("loading");
  const [processing, setProcessing] = useState(false);
  const [adultPlan, setAdultPlan] = useState("");

  useEffect(() => {
    if (!session) return;
    api.getAdultSubscription(session.access_token)
      .then((data: Record<string, unknown>) => {
        if (data.adult_plan && data.adult_plan !== "none") {
          setStatus("active");
          setAdultPlan(data.adult_plan as string);
        } else {
          setStatus("inactive");
        }
      })
      .catch(() => setStatus("inactive"));
  }, [session]);

  const handleOptIn = async () => {
    if (!session) return;
    const confirmed = window.confirm(
      "Adult Expression contains explicit content (18+).\n\n" +
      "By enabling this feature, you confirm:\n" +
      "- You are 18 years or older\n" +
      "- You understand the content may be sexually explicit\n" +
      "- You agree to the Content Policy\n\n" +
      "Enable Adult Expression?"
    );
    if (!confirmed) return;

    setProcessing(true);
    try {
      await api.verifyAge(session.access_token, true);
      const res = await api.adultOptIn(session.access_token);
      if (res.status === "activated" || res.status === "already_active") {
        setStatus("active");
        setAdultPlan(res.adult_plan || "adult_creator");
        toast.success("Adult Expression enabled! 500 credits added.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to enable");
    } finally {
      setProcessing(false);
    }
  };

  const handleOptOut = async () => {
    if (!session) return;
    if (!window.confirm("Disable Adult Expression?")) return;
    setProcessing(true);
    try {
      await api.adultOptOut(session.access_token);
      setStatus("inactive");
      setAdultPlan("");
      toast.success("Adult Expression disabled.");
    } catch {
      toast.error("Failed to disable");
    } finally {
      setProcessing(false);
    }
  };

  if (status === "loading") return null;

  return (
    <Card className="mb-6 border-pink-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Adult Expression</CardTitle>
          <Badge variant={status === "active" ? "default" : "secondary"}
                 className={status === "active" ? "bg-pink-600" : ""}>
            {status === "active" ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {status === "active"
            ? "NSFW generation is enabled. Visit the Adult page to create content."
            : "Included free with your plan. Enable to access NSFW AI generation (18+)."}
        </p>
        {status === "active" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Access Level</span>
              <span className="text-sm">Creator (500 credits/mo)</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-pink-400 border-pink-500/30 hover:bg-pink-500/10"
              onClick={handleOptOut}
              disabled={processing}
            >
              {processing ? "Processing..." : "Disable Adult Expression"}
            </Button>
          </div>
        ) : (
          <Button
            className="w-full bg-pink-600 hover:bg-pink-700"
            onClick={handleOptIn}
            disabled={processing}
          >
            {processing ? "Processing..." : "Enable Adult Expression (Free)"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
