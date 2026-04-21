import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Meme Generator — Create Viral Memes | EGAKU AI",
  description: "Generate custom memes with AI images and text overlay. Free meme maker powered by AI.",
  openGraph: {
    title: "AI Meme Generator — Create Viral Memes",
    description: "Generate custom memes with AI images and text overlay. Free meme maker powered by AI.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
