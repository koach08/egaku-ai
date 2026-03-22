import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Self-Hosted AI Image & Video Generator | EGAKU AI Source Code",
  description:
    "Deploy your own AI image & video generation platform. Full source code: Next.js + FastAPI + 20+ models (Sora 2, Veo 3, Nano Banana 2, Flux, SDXL). NSFW-ready, Stripe billing, multi-language. One-time purchase.",
  alternates: {
    canonical: "/self-hosted",
    languages: { en: "/self-hosted", ja: "/ja/self-hosted" },
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
