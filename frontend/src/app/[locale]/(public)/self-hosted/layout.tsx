import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Self-Hosted AI Image & Video Generator | EGAKU AI Source Code",
  description:
    "Deploy your own AI image & video generation platform. Full source code: Next.js + FastAPI + 30+ models (Veo 3, Seedance 2.0, Nano Banana 2, Flux, SDXL). NSFW-ready, Stripe billing, multi-language. One-time purchase.",
  alternates: {
    canonical: "/self-hosted",
    languages: { en: "/self-hosted", ja: "/ja/self-hosted" },
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
