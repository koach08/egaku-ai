import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore AI Art Gallery - Trending AI Generated Images & Videos",
  description:
    "Browse trending AI-generated artwork created with Flux, SDXL, and Stable Diffusion. Discover anime, realistic, fantasy art and more. Like, remix, and share creations.",
  alternates: {
    canonical: "/explore",
    languages: { en: "/explore", ja: "/ja/explore", es: "/es/explore", zh: "/zh/explore" },
  },
  openGraph: {
    title: "Explore AI Art - EGAKU AI Gallery",
    description:
      "Discover trending AI-generated images and videos. Browse, like, remix and share artwork.",
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
