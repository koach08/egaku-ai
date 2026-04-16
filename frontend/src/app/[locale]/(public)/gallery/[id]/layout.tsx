import type { Metadata } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_BASE}/gallery/${id}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("Not found");
    const data = await res.json();
    const item = data.item || data;

    const title = item.title || `AI Art by ${item.author_name || "Artist"}`;
    const description = item.prompt
      ? `${item.prompt.slice(0, 150)}${item.prompt.length > 150 ? "..." : ""} — Created with ${item.model || "AI"} on EGAKU AI`
      : `AI-generated artwork on EGAKU AI`;

    // Note: opengraph-image.tsx auto-generates a branded card image at
    // /gallery/[id]/opengraph-image. Next.js wires it into the <meta> tags
    // automatically — we don't need to set `images` manually here.

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://egaku-ai.com/gallery/${id}`,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      alternates: {
        canonical: `/gallery/${id}`,
        languages: {
          en: `/gallery/${id}`,
          ja: `/ja/gallery/${id}`,
          es: `/es/gallery/${id}`,
          zh: `/zh/gallery/${id}`,
        },
      },
    };
  } catch {
    return {
      title: "AI Artwork",
      description: "AI-generated artwork on EGAKU AI",
    };
  }
}

export default function GalleryItemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
