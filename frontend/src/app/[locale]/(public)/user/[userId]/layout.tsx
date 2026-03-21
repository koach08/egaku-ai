import type { Metadata } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

type Props = {
  params: Promise<{ userId: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;

  try {
    const res = await fetch(`${API_BASE}/gallery/user/${userId}/profile`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("Not found");
    const profile = await res.json();

    const name = profile.display_name || "Artist";
    const title = `${name}'s AI Art Gallery`;
    const description = profile.bio
      ? `${profile.bio.slice(0, 120)} — ${profile.gallery_count || 0} artworks on EGAKU AI`
      : `${name} has created ${profile.gallery_count || 0} AI artworks on EGAKU AI. Follow and explore their gallery.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://egaku-ai.com/user/${userId}`,
        type: "profile",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
      alternates: {
        canonical: `/user/${userId}`,
        languages: {
          en: `/user/${userId}`,
          ja: `/ja/user/${userId}`,
          es: `/es/user/${userId}`,
          zh: `/zh/user/${userId}`,
        },
      },
    };
  } catch {
    return {
      title: "Artist Profile",
      description: "AI artist profile on EGAKU AI",
    };
  }
}

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
