"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PricingTab = "monthly" | "yearly" | "credits";

const planKeys = ["free", "lite", "basic", "pro", "unlimited", "studio"] as const;

const planNames: Record<string, string> = {
  free: "Free", lite: "Lite", basic: "Basic", pro: "Pro", unlimited: "Unlimited", studio: "Studio",
};

const planCredits: Record<string, string> = {
  free: "50", lite: "150", basic: "500", pro: "2,000", unlimited: "Unlimited", studio: "Unlimited",
};

const planFeatures: Record<string, string[]> = {
  free: ["50 credits/month", "5 free models", "Community gallery", "Watermark on images"],
  lite: ["150 credits/month", "10 models", "No watermark", "Priority queue"],
  basic: ["500 credits/month", "All models", "CivitAI LoRA (2)", "Batch generation"],
  pro: ["2,000 credits/month", "All models", "CivitAI LoRA (5)", "API access", "Priority support"],
  unlimited: ["Unlimited generations", "All models", "CivitAI LoRA (10)", "API access", "Priority support"],
  studio: ["Unlimited generations", "All models + early access", "Unlimited LoRA", "API access", "Dedicated support"],
};

const monthlyPrices: Record<string, string> = {
  free: "0", lite: "480", basic: "980", pro: "2,980", unlimited: "4,980", studio: "6,980",
};

const yearlyMonthly: Record<string, string> = {
  free: "0", lite: "400", basic: "817", pro: "2,483", unlimited: "4,150", studio: "5,817",
};

const yearlyTotal: Record<string, string> = {
  free: "0", lite: "4,800", basic: "9,800", pro: "29,800", unlimited: "49,800", studio: "69,800",
};

const creditPacks = [
  { id: "pack_500", credits: 500, price: "500", badge: "" },
  { id: "pack_1500", credits: 1500, price: "1,500", badge: "" },
  { id: "pack_3000", credits: 3000, price: "3,000", badge: "" },
  { id: "pack_6000", credits: 6000, price: "6,000", badge: "Recommended" },
  { id: "pack_12000", credits: 12000, price: "12,000", badge: "" },
];

export function PricingSection() {
  const [tab, setTab] = useState<PricingTab>("monthly");

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex items-center justify-center gap-1 mb-10 bg-white/[0.04] rounded-full p-1 max-w-md mx-auto">
        <button
          onClick={() => setTab("monthly")}
          className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            tab === "monthly" ? "bg-white text-black" : "text-white/50 hover:text-white/80"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setTab("yearly")}
          className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            tab === "yearly" ? "bg-white text-black" : "text-white/50 hover:text-white/80"
          }`}
        >
          Yearly
          <span className="ml-1.5 text-[10px] text-emerald-400 font-semibold">2mo free</span>
        </button>
        <button
          onClick={() => setTab("credits")}
          className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            tab === "credits" ? "bg-white text-black" : "text-white/50 hover:text-white/80"
          }`}
        >
          Buy Credits
        </button>
      </div>

      {/* Credits tab */}
      {tab === "credits" && (
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-6">
            One-time purchase. No subscription. Credits never expire.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {creditPacks.map((pack) => (
              <Link
                key={pack.id}
                href={`/register?pack=${pack.id}`}
                className="relative rounded-xl border border-white/[0.06] hover:border-purple-500/30 hover:bg-purple-500/5 p-5 text-center transition-all"
              >
                {pack.badge && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-purple-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                    {pack.badge}
                  </span>
                )}
                <div className="text-2xl font-bold">{pack.credits.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">credits</div>
                <div className="text-sm font-semibold mt-2">&yen;{pack.price}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Monthly / Yearly plans */}
      {tab !== "credits" && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 max-w-7xl mx-auto">
          {planKeys.map((planKey) => {
            const isYearly = tab === "yearly";
            const price = isYearly ? yearlyMonthly[planKey] : monthlyPrices[planKey];
            const features = planFeatures[planKey];
            const isRecommended = planKey === "basic";
            return (
              <Card
                key={planKey}
                className={isRecommended ? "border-white/30 ring-1 ring-white/10" : "border-white/[0.06]"}
              >
                <CardHeader className="text-center">
                  {isRecommended && (
                    <span className="inline-block text-[10px] font-semibold bg-white text-black px-3 py-1 rounded-full mb-2">
                      RECOMMENDED
                    </span>
                  )}
                  <CardTitle className="text-base">{planNames[planKey]}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">
                      {price === "0" ? "Free" : `¥${price}`}
                    </span>
                    {price !== "0" && (
                      <span className="text-muted-foreground text-sm"> /mo</span>
                    )}
                  </div>
                  {isYearly && yearlyTotal[planKey] !== "0" && (
                    <p className="text-[10px] text-emerald-400 mt-1">
                      &yen;{yearlyTotal[planKey]}/year (2 months free)
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {planCredits[planKey]} credits
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">&#10003;</span>
                        <span className="text-white/60">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full mt-6 rounded-full ${isRecommended ? "bg-white text-black hover:bg-white/90" : ""}`}
                    variant={isRecommended ? "default" : "outline"}
                    render={<Link href={price === "0" ? "/register" : `/register?plan=${planKey}${isYearly ? "&billing=yearly" : ""}`} />}
                  >
                    {price === "0" ? "Start Free" : "Subscribe"}
                  </Button>
                  {price !== "0" && (
                    <Link
                      href={`/register?plan=${planKey}&crypto=1`}
                      className="block w-full text-center text-[10px] text-white/30 hover:text-white/60 mt-2 py-1 transition-colors"
                    >
                      Pay with Crypto
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
