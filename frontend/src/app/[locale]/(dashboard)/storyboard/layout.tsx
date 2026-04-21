import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Storyboard Studio — Multi-Scene Video | EGAKU AI",
  description: "Create multi-scene AI videos with cinema presets, BGM, and narration.",
  openGraph: {
    title: "Storyboard Studio — Multi-Scene Video",
    description: "Create multi-scene AI videos with cinema presets, BGM, and narration.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
