"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
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

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const plan = searchParams.get("plan") || "unknown";
    if (checkout === "success") {
      toast.success("Subscription activated! Credits have been added.");
      // Fire purchase conversion for Google Ads + GA4
      const planPrices: Record<string, number> = {
        lite: 480, basic: 980, pro: 2980, unlimited: 5980, studio: 9980,
      };
      trackPurchase(plan, planPrices[plan] || 0);
    } else if (checkout === "cancel") {
      toast.info("Checkout cancelled.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!session) return;
    const token = session.access_token;

    Promise.all([
      api.getSubscription(token).then(setSubscription).catch(() => {}),
      api.getBalance(token).then(setCredits).catch(() => {}),
    ]);
  }, [session]);

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
                      <Button
                        size="sm"
                        onClick={() => handleUpgrade(plan)}
                        disabled={upgrading !== null}
                      >
                        {upgrading === plan ? "Loading..." : "Upgrade"}
                      </Button>
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
      </div>
    </>
  );
}
