"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import { trackSignup } from "@/components/analytics";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleOAuth = async (provider: "google" | "discord" | "github" | "twitter") => {
    trackSignup(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/generate` },
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/generate` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.session) {
      trackSignup("email");
      router.push("/generate");
    } else {
      // Confirm email is ON — show check email message
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
              Start with 50 free credits
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Button variant="outline" className="w-full" onClick={() => handleOAuth("google")}>
                Continue with Google
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleOAuth("discord")}>
                Continue with Discord
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
