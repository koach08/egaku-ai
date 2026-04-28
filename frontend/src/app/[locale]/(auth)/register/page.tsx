"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import { PromoCodeInput } from "@/components/promo-code-input";
import { trackSignup } from "@/components/analytics";

const PAID_PLANS = ["lite", "basic", "pro", "unlimited", "studio", "local"];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "";
  const hasPaidPlan = PAID_PLANS.includes(plan);
  const refCode = searchParams.get("ref") || "";

  // Save referral code to localStorage so it persists through OAuth redirect
  useEffect(() => {
    if (refCode) {
      try {
        localStorage.setItem("egaku_pending_ref", refCode);
      } catch {}
    }
  }, [refCode]);

  // After auth, redirect to settings with upgrade param if paid plan selected
  const redirectPath = hasPaidPlan ? `/settings?upgrade=${plan}` : "/generate";
  const redirectUrl = typeof window !== "undefined"
    ? `${window.location.origin}${redirectPath}`
    : redirectPath;

  const handleOAuth = async (provider: "google" | "discord" | "github" | "twitter") => {
    trackSignup(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl },
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.session) {
      trackSignup("email");
      // Apply pending referral code if any
      try {
        const pending = localStorage.getItem("egaku_pending_ref");
        if (pending && data.session.access_token) {
          await api.useReferralCode(data.session.access_token, pending);
          localStorage.removeItem("egaku_pending_ref");
        }
      } catch {}
      router.push(redirectPath);
    } else {
      setError("Check your email for a confirmation link.");
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <p className="text-sm text-muted-foreground">
              {hasPaidPlan
                ? `Sign up to continue with the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`
                : "Start with 50 free credits"}
            </p>
            {refCode && (
              <div className="mt-3 rounded-lg bg-green-500/10 border border-green-500/30 p-2">
                <p className="text-xs text-green-400 font-medium">
                  🎁 You&apos;ve been invited! +50 bonus credits on signup
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Code: <code>{refCode}</code></p>
              </div>
            )}
            <div className="mt-3 text-left">
              <PromoCodeInput compact={false} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Button variant="outline" className="w-full" onClick={() => handleOAuth("google")}>
                Continue with Google
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleOAuth("discord")}>
                Continue with Discord
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleOAuth("twitter")}>
                Continue with X (Twitter)
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleOAuth("github")}>
                Continue with GitHub
              </Button>
            </div>

            <div className="my-6 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
