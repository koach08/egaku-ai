"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const COOKIE_KEY = "egaku_cookie_consent";

export type ConsentState = "undecided" | "accepted" | "rejected";

export function getConsentState(): ConsentState {
  if (typeof window === "undefined") return "undecided";
  const val = localStorage.getItem(COOKIE_KEY);
  if (val === "accepted") return "accepted";
  if (val === "rejected") return "rejected";
  return "undecided";
}

export function CookieConsent() {
  const [state, setState] = useState<ConsentState>("undecided");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setState(getConsentState());
  }, []);

  if (!mounted || state !== "undecided") return null;

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setState("accepted");
    // Reload to activate GA
    window.location.reload();
  };

  const reject = () => {
    localStorage.setItem(COOKIE_KEY, "rejected");
    setState("rejected");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t p-4 shadow-lg">
      <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          We use cookies for analytics to improve our service.
          Essential cookies for authentication are always active.
          See our{" "}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>{" "}
          for details.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={reject}>
            Reject
          </Button>
          <Button size="sm" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
