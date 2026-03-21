import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to EGAKU AI to generate AI art with Flux, SDXL, Stable Diffusion, and custom CivitAI models.",
  alternates: {
    canonical: "/login",
    languages: {
      en: "/login",
      ja: "/ja/login",
      es: "/es/login",
      zh: "/zh/login",
    },
  },
  openGraph: {
    title: "Sign In | EGAKU AI",
    description: "Sign in to start creating AI art with 15+ models.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
