"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";

const TECH_STACK = [
  { name: "Next.js 16", desc: "App Router, SSR, i18n (5 languages)" },
  { name: "FastAPI", desc: "Python backend, async, type-safe" },
  { name: "Supabase", desc: "Auth, PostgreSQL, RLS, Storage" },
  { name: "Stripe", desc: "Subscriptions, one-time payments, webhooks" },
  { name: "fal.ai", desc: "20+ GPU models, pay-per-use, no GPU management" },
  { name: "Tailwind + shadcn/ui", desc: "Dark mode, responsive, accessible" },
];

const MODELS = [
  { name: "Nano Banana 2", by: "Google", type: "Image" },
  { name: "Grok Imagine", by: "xAI", type: "Image" },
  { name: "Flux Dev / Schnell", by: "Black Forest Labs", type: "Image" },
  { name: "SDXL / SD 3.5", by: "Stability AI", type: "Image" },
  { name: "Sora 2", by: "OpenAI", type: "Video" },
  { name: "Veo 3", by: "Google", type: "Video" },
  { name: "Kling 2.5 Pro", by: "Kuaishou", type: "Video" },
  { name: "Grok Imagine Video", by: "xAI", type: "Video" },
  { name: "Wan 2.1", by: "Alibaba", type: "Video" },
  { name: "CivitAI LoRA/Checkpoints", by: "Community", type: "Image" },
];

const FEATURES = [
  "Text-to-image with 15+ models",
  "Text-to-video & image-to-video (Sora 2, Veo 3, Kling)",
  "NSFW generation fully supported",
  "CivitAI custom model browser & generation",
  "Style transfer (8 presets: Ghibli, Anime, Cyberpunk...)",
  "ControlNet (Canny, Depth, OpenPose, Scribble)",
  "Image upscaling, inpainting, background removal",
  "Credit-based billing with 6 subscription tiers",
  "Public gallery with likes, NSFW filter, user profiles",
  "Prompt assistant (AI chat for better prompts)",
  "Google Ads conversion tracking",
  "Cookie consent (GDPR)",
  "Multi-language (EN, JA, ES, ZH, PT)",
  "Regional PPP pricing (24 countries)",
];

const INCLUDED = [
  "Full source code (frontend + backend)",
  "Supabase schema & migrations",
  "Deployment guide (Vercel + Railway)",
  "fal.ai / Stripe / Supabase setup docs",
  "Model addition guide",
  ".env.example with all required keys",
  "Commercial license (1 project)",
];

const PRICE = "¥4,980";

export default function SelfHostedPage() {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">
            One-Time Purchase
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Deploy Your Own AI Art Platform
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Full source code for a production-ready AI image &amp; video generation SaaS.
            20+ models including Sora 2, Veo 3, and Nano Banana 2.
            NSFW-ready. Deploy in 30 minutes.
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-5xl font-bold">{PRICE}</span>
            <span className="text-muted-foreground text-lg">one-time</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="text-lg px-8 py-6" render={<Link href="/register?plan=local" />}>
              Buy Now
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" render={<a href="https://egaku-ai.com" target="_blank" rel="noopener noreferrer" />}>
              Live Demo
            </Button>
          </div>
        </div>

        {/* What You Get */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">What&apos;s Included</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {INCLUDED.map((item) => (
              <div key={item} className="flex items-start gap-3 p-3 rounded-lg border">
                <span className="text-green-500 mt-0.5 shrink-0">&#10003;</span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Tech Stack</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TECH_STACK.map((tech) => (
              <Card key={tech.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{tech.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{tech.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Supported Models */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">20+ AI Models Built In</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {MODELS.map((m) => (
              <div key={m.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <span className="font-medium text-sm">{m.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">by {m.by}</span>
                </div>
                <Badge variant="secondary" className="text-xs">{m.type}</Badge>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">All Features</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2 p-2">
                <span className="text-purple-500 mt-0.5 shrink-0">&#9679;</span>
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </section>

        {/* License */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">License</h2>
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span className="text-sm">Personal &amp; commercial use</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span className="text-sm">Modify freely — make it yours</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span className="text-sm">Deploy to 1 production project</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500">&#10007;</span>
                <span className="text-sm">No redistribution or resale of code</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground">&#8212;</span>
                <span className="text-sm text-muted-foreground">Sold as-is. You bring your own API keys.</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">FAQ</h2>
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="font-semibold mb-1">How quickly can I deploy?</h3>
              <p className="text-sm text-muted-foreground">
                30 minutes if you have Supabase, Vercel, and fal.ai accounts ready.
                The deployment guide walks you through every step.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">What are the ongoing costs?</h3>
              <p className="text-sm text-muted-foreground">
                Vercel and Supabase have generous free tiers. Railway starts at ~$5/month.
                fal.ai charges per generation ($0.01-$0.50 depending on model).
                Total: near zero until you have real users.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Can I add my own models?</h3>
              <p className="text-sm text-muted-foreground">
                Yes. The model addition guide shows how to add any fal.ai model in minutes.
                Just add a config entry and redeploy.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Is NSFW generation included?</h3>
              <p className="text-sm text-muted-foreground">
                Yes. NSFW is fully supported with safety_tolerance controls, age verification,
                regional content rules, and content policy page.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Do I get updates?</h3>
              <p className="text-sm text-muted-foreground">
                The purchase includes the current version. Future updates may be available
                for existing customers at a discount.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Is support included?</h3>
              <p className="text-sm text-muted-foreground">
                The standard license is sold as-is without support.
                A premium option with email support is available at checkout.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 border-t">
          <h2 className="text-3xl font-bold mb-4">Ready to launch your own AI platform?</h2>
          <p className="text-muted-foreground mb-8">
            One purchase. Full source code. Deploy today.
          </p>
          <Button size="lg" className="text-lg px-10 py-6" render={<Link href="/register?plan=local" />}>
            Buy for {PRICE}
          </Button>
        </section>
      </div>
    </>
  );
}
