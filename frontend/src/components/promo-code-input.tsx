"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  accessToken?: string | null;
  onApplied?: (code: string, discountPercent: number) => void;
  compact?: boolean;
};

export function PromoCodeInput({ accessToken, onApplied, compact }: Props) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "applied" | "error">("idle");
  const [message, setMessage] = useState("");
  const [discount, setDiscount] = useState(0);

  const apply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setStatus("checking");
    setMessage("");
    try {
      if (accessToken) {
        const r = await api.redeemPromoCode(accessToken, trimmed);
        setStatus("applied");
        setDiscount(r.discount_percent);
        setMessage(r.message);
        try { localStorage.setItem("egaku_applied_promo", trimmed); } catch {}
        onApplied?.(trimmed, r.discount_percent);
      } else {
        const r = await api.checkPromoCode(trimmed);
        setStatus("applied");
        setDiscount(r.discount_percent);
        setMessage(`✅ ${r.discount_percent}% off — ${r.description}. Sign up to lock it in.`);
        try { localStorage.setItem("egaku_pending_promo", trimmed); } catch {}
        onApplied?.(trimmed, r.discount_percent);
      }
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Invalid code");
    }
  };

  return (
    <div className={compact ? "" : "rounded-lg border border-muted p-3 bg-card/50"}>
      {!compact && (
        <p className="text-xs font-medium mb-2">🎁 Have a promo code?</p>
      )}
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setStatus("idle"); }}
          placeholder="LAUNCH50"
          className="flex-1 font-mono uppercase text-sm"
          maxLength={20}
          disabled={status === "applied"}
        />
        <Button
          onClick={apply}
          disabled={!code.trim() || status === "checking" || status === "applied"}
          size="sm"
          variant={status === "applied" ? "outline" : "default"}
        >
          {status === "checking" ? "..." : status === "applied" ? "✓" : "Apply"}
        </Button>
      </div>
      {message && (
        <p className={`text-xs mt-2 ${status === "applied" ? "text-green-400" : "text-red-400"}`}>
          {message}
        </p>
      )}
      {status !== "applied" && !compact && (
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Try: <code className="font-mono bg-muted px-1 rounded">LAUNCH50</code> (50% off first 3 months)
        </p>
      )}
    </div>
  );
}
