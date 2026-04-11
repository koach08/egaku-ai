"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

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
  model: string;
}

type MediaFilter = "all" | "image" | "video";

interface ShowcaseGalleryProps {
  title?: string;
  filter?: MediaFilter;
  maxItems?: number;
}

const HQ_MODELS = new Set([
  "fal_flux_dev", "fal_flux_realism", "fal_nano_banana_2", "fal_grok_imagine",
  "flux_dev", "flux_realism", "nano_banana_2", "grok_imagine",
  "fal_kling25_t2v", "fal_kling_t2v", "fal_veo3_t2v", "fal_sora2_t2v", "fal_grok_t2v",
  "pro",
]);

export function ShowcaseGallery({
  title = "Recent Creations",
  filter = "all",
  maxItems = 24,
}: ShowcaseGalleryProps) {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchShowcase() {
      try {
        const res = await fetch(
          `${API_BASE}/gallery/?page=1&limit=100&sort=popular&nsfw=false`
        );
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (cancelled) return;

        const allItems: ShowcaseItem[] = (data.items || []).filter(
          (item: ShowcaseItem) => {
            if (item.nsfw) return false;
            if (!(HQ_MODELS.has(item.model) || item.title)) return false;
            // Media-type filter
            if (filter === "image") {
              return item.image_url != null && item.video_url == null;
            }
            if (filter === "video") {
              return item.video_url != null;
            }
            return item.image_url != null || item.video_url != null;
          }
        );

        const liked = allItems.filter((item) => (item.likes_count || 0) > 0);
        const hq = allItems.filter((item) => (item.likes_count || 0) === 0 && HQ_MODELS.has(item.model));
        const rest = allItems.filter((item) => (item.likes_count || 0) === 0 && !HQ_MODELS.has(item.model) && item.title);
        liked.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));

        setItems([...liked, ...hq, ...rest].slice(0, maxItems));
      } catch {
        // silent fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchShowcase();
    return () => { cancelled = true; };
  }, [filter, maxItems]);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollButtons);
    updateScrollButtons();
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, [items, updateScrollButtons]);

  // Auto-scroll
  useEffect(() => {
    if (items.length === 0) return;
    autoScrollRef.current = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 320, behavior: "smooth" });
      }
    }, 4000);
    return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    el.scrollBy({ left: direction === "left" ? -640 : 640, behavior: "smooth" });
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">{title}</h2>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-none w-72 aspect-[4/5] rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRightIcon className="size-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseEnter={() => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); }}
        onMouseLeave={() => {
          autoScrollRef.current = setInterval(() => {
            const el = scrollRef.current;
            if (!el) return;
            if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
              el.scrollTo({ left: 0, behavior: "smooth" });
            } else {
              el.scrollBy({ left: 320, behavior: "smooth" });
            }
          }, 4000);
        }}
      >
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/gallery/${item.id}`}
            className="group flex-none snap-start"
          >
            <div className="w-72 aspect-[4/5] rounded-xl overflow-hidden relative bg-muted/30">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title || item.prompt.slice(0, 60)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              ) : item.video_url ? (
                <video
                  src={item.video_url}
                  className="w-full h-full object-cover"
                  loop
                  muted
                  autoPlay
                  playsInline
                />
              ) : null}

              {/* Gradient overlay - always visible at bottom, full on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Title + prompt on hover */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                {item.title && (
                  <h3 className="text-sm font-semibold text-white mb-1 drop-shadow-lg">
                    {item.title}
                  </h3>
                )}
                <p className="text-xs text-white/70 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {item.prompt.slice(0, 80)}
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
