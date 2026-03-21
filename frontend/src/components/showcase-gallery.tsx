"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

interface ShowcaseItem {
  id: string;
  prompt: string;
  image_url: string | null;
  video_url: string | null;
  nsfw: boolean;
  likes_count: number;
  author_name: string;
  title: string;
  tags: string[];
}

interface ShowcaseGalleryProps {
  title?: string;
}

const PLACEHOLDER_GRADIENTS = [
  "from-purple-600/40 to-pink-600/40",
  "from-blue-600/40 to-purple-600/40",
  "from-pink-600/40 to-orange-600/40",
  "from-cyan-600/40 to-blue-600/40",
  "from-violet-600/40 to-fuchsia-600/40",
  "from-emerald-600/40 to-teal-600/40",
  "from-rose-600/40 to-pink-600/40",
  "from-indigo-600/40 to-violet-600/40",
];

function SkeletonCard() {
  return (
    <div className="aspect-square rounded-lg bg-muted/50 animate-pulse">
      <div className="w-full h-full rounded-lg bg-gradient-to-br from-muted/30 to-muted/60" />
    </div>
  );
}

function PlaceholderCard({ gradient }: { gradient: string }) {
  return (
    <div
      className={`aspect-square rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center border border-white/5`}
    >
      <p className="text-sm text-white/60 text-center px-4 font-medium">
        Your art could be here
      </p>
    </div>
  );
}

export function ShowcaseGallery({ title = "Recent Creations" }: ShowcaseGalleryProps) {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchShowcase() {
      try {
        // Fetch from gallery API (has likes_count for curation)
        const res = await fetch(
          `${API_BASE}/gallery/?page=1&limit=100&sort=popular&nsfw=false`
        );
        if (!res.ok) throw new Error("API error");
        const data = await res.json();

        if (cancelled) return;

        const allItems: (ShowcaseItem & { likes_count?: number })[] = (data.items || [])
          .filter(
            (item: ShowcaseItem) => (item.image_url != null || item.video_url != null) && !item.nsfw
          );

        // Quality curation: liked items first, then admin, then newest
        const CURATED_AUTHORS = new Set(["japanesebusinessman4"]);
        const liked = allItems.filter((item) => (item.likes_count || 0) > 0);
        const adminItems = allItems.filter((item) =>
          (item.likes_count || 0) === 0 && CURATED_AUTHORS.has(item.author_name)
        );
        const rest = allItems.filter((item) =>
          (item.likes_count || 0) === 0 && !CURATED_AUTHORS.has(item.author_name)
        );
        // Sort liked by count descending
        liked.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        const filtered = [...liked, ...adminItems, ...rest].slice(0, 8);

        setItems(filtered);
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchShowcase();
    return () => {
      cancelled = true;
    };
  }, []);

  const showPlaceholders = failed || (!loading && items.length === 0);

  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-10">{title}</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : showPlaceholders
            ? PLACEHOLDER_GRADIENTS.map((gradient, i) => (
                <PlaceholderCard key={i} gradient={gradient} />
              ))
            : items.map((item) => (
                <Link
                  key={item.id}
                  href={`/gallery/${item.id}`}
                  className="group block"
                >
                  <div className="aspect-square rounded-lg overflow-hidden relative bg-muted">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title || item.prompt.slice(0, 60)}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : item.video_url ? (
                      <video
                        src={item.video_url}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loop
                        muted
                        autoPlay
                        playsInline
                      />
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
      </div>

      <div className="flex justify-center mt-10">
        <Button
          size="lg"
          variant="outline"
          render={<Link href="/explore" />}
        >
          Explore Gallery
        </Button>
      </div>
    </section>
  );
}
