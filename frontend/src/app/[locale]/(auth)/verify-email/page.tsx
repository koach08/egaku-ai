"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    if (loading) return;
    if (!session) {
      // No session yet — wait for Supabase to process the magic link
      const timeout = setTimeout(() => setStatus("error"), 10000);
      return () => clearTimeout(timeout);
    }

    // Session exists — mark email as verified in our DB
    api
      .markEmailVerified(session.access_token)
      .then(() => {
        setStatus("success");
        setTimeout(() => router.push("/settings"), 1500);
      })
      .catch(() => setStatus("error"));
  }, [session, loading, router]);

  return (
    <>
      <Header />
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {status === "verifying" && "Verifying your email..."}
              {status === "success" && "Email verified!"}
              {status === "error" && "Verification failed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {status === "verifying" && (
              <p className="text-sm text-muted-foreground">Please wait...</p>
            )}
            {status === "success" && (
              <p className="text-sm text-muted-foreground">
                Redirecting to settings...
              </p>
            )}
            {status === "error" && (
              <p className="text-sm text-muted-foreground">
                The link may have expired. Please request a new verification email from Settings.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
