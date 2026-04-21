import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Video Shorts Generator — TikTok & Reels | EGAKU AI",
  description: "Create vertical videos for TikTok, Reels, and Shorts with AI. Multiple styles, instant generation.",
  openGraph: {
    title: "AI Video Shorts Generator — TikTok & Reels",
    description: "Create vertical videos for TikTok, Reels, and Shorts with AI. Multiple styles, instant generation.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
