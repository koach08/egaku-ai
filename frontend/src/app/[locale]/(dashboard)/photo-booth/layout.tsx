import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Photo Booth — Professional Portraits from Selfie | EGAKU AI",
  description: "Transform your selfie into professional portraits for LinkedIn, dating apps, and social media with AI.",
  openGraph: {
    title: "AI Photo Booth — Professional Portraits from Selfie",
    description: "Transform your selfie into professional portraits for LinkedIn, dating apps, and social media with AI.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
