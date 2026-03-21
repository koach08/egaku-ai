import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community AI Art Gallery - Share & Discover AI Creations",
  description:
    "Community gallery of AI-generated images and videos. Browse by anime, realistic, fantasy, landscape, portrait styles. Like, remix, and follow artists. Content filter available.",
  alternates: {
    canonical: "/gallery",
    languages: { en: "/gallery", ja: "/ja/gallery", es: "/es/gallery", zh: "/zh/gallery" },
  },
  openGraph: {
    title: "Community Gallery - EGAKU AI",
    description:
      "Community gallery of AI art. Browse, like, remix creations. Follow your favorite AI artists.",
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
