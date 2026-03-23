import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up Free - Start Creating AI Art",
  description:
    "Create a free EGAKU AI account and get 15 credits to generate AI images. Sign up with Google, Discord, GitHub, or email. No credit card required.",
  alternates: {
    canonical: "/register",
    languages: { en: "/register", ja: "/ja/register", es: "/es/register", zh: "/zh/register" },
  },
  openGraph: {
    title: "Sign Up Free - EGAKU AI",
    description: "Get 15 free credits. Create AI images with Flux, SDXL, and more. No credit card required.",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
