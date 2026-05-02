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

    // Use our own /api/og/[id] proxy to serve the image.
    // Supabase storage sends "x-robots-tag: none" on ALL responses,
    // which tells Twitter/X crawler to ignore the image entirely.
    // Our proxy fetches, resizes to 1200x630 via sharp, and serves
    // clean headers (no x-robots-tag), so Twitter cards work correctly.
    const hasImage = !item.nsfw && item.image_url;
    const ogImage = hasImage
      ? `https://egaku-ai.com/api/og/${id}`
      : "https://egaku-ai.com/og-image.jpg";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://egaku-ai.com/gallery/${id}`,
        type: "article",
        images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
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
