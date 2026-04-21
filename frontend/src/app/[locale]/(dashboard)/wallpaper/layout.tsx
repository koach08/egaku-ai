import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Wallpaper Generator — Device-Perfect Wallpapers | EGAKU AI",
  description: "Generate wallpapers for iPhone, Android, Desktop, 4K, and Ultrawide. AI-powered, unique every time.",
  openGraph: {
    title: "AI Wallpaper Generator — Device-Perfect Wallpapers",
    description: "Generate wallpapers for iPhone, Android, Desktop, 4K, and Ultrawide. AI-powered, unique every time.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
