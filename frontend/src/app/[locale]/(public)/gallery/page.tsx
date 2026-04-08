"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import { HeartIcon, EyeIcon, EyeOffIcon, Loader2Icon, SparklesIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GalleryItem {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  negative_prompt?: string;
  model: string;
  image_url: string | null;
  video_url: string | null;
  nsfw: boolean;
  likes_count: number;
  liked_by_me: boolean;
  tags: string[];
  author_name: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  sampler?: string;
  seed?: number;
  created_at: string;
}

interface GalleryResponse {
  items: GalleryItem[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "trending", label: "Trending" },
  { value: "popular", label: "Popular" },
];

const TAG_FILTERS = [
  { value: "all", label: "All" },
  { value: "anime", label: "Anime" },
  { value: "realistic", label: "Realistic" },
  { value: "fantasy", label: "Fantasy" },
  { value: "landscape", label: "Landscape" },
  { value: "portrait", label: "Portrait" },
  { value: "abstract", label: "Abstract" },
];

const PER_PAGE = 48;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GalleryPage() {
  const { user, session } = useAuth();

  // State
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("popular");
  const [tag, setTag] = useState("all");
  const [showNsfw, setShowNsfw] = useState(false);
  const [nsfwRevealed, setNsfwRevealed] = useState<Set<string>>(new Set());
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());

  // Sentinel ref for intersection observer (load more)
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ─── Data Fetching ───

  const fetchGallery = useCallback(
    async (pageNum: number, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const data: GalleryResponse = await api.getPublicGallery(
          pageNum,
          PER_PAGE,
          sort,
          showNsfw,
          tag === "all" ? undefined : tag
        );
        if (append) {
          setItems((prev) => [...prev, ...data.items]);
        } else {
          setItems(data.items);
        }
        setTotal(data.total);
        setPage(pageNum);
      } catch {
        toast.error("Failed to load gallery");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sort, showNsfw, tag]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setItems([]);
    setPage(1);
    fetchGallery(1, false);
  }, [fetchGallery]);

  // ─── NSFW Toggle ───

  const handleNsfwToggle = () => {
    if (!showNsfw && !ageConfirmed) {
      const confirmed = window.confirm(
        "You must be 18 or older to view NSFW content. Are you 18+?"
      );
      if (!confirmed) return;
      setAgeConfirmed(true);
    }
    setShowNsfw((prev) => !prev);
  };

  const toggleNsfwReveal = (id: string) => {
    setNsfwRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ─── Like ───

  const handleLike = async (e: React.MouseEvent, item: GalleryItem) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      toast.error("Sign in to like images");
      return;
    }
    if (likingIds.has(item.id)) return;

    setLikingIds((prev) => new Set(prev).add(item.id));
    try {
      const res = await api.toggleLike(session.access_token, item.id);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, liked_by_me: res.liked, likes_count: res.likes_count }
            : i
        )
      );
    } catch {
      toast.error("Failed to update like");
    } finally {
      setLikingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  // ─── Load More ───

  const hasMore = items.length < total;

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchGallery(page + 1, true);
  };

  // ─── Render ───

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Gallery</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explore stunning AI-generated artworks from the community
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Sort tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              value={sort}
              onValueChange={(v) => {
                if (v) setSort(v);
              }}
            >
              <TabsList>
                {SORT_OPTIONS.map((s) => (
                  <TabsTrigger key={s.value} value={s.value}>
                    {s.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {total.toLocaleString()} works
              </span>
              <Button
                variant={showNsfw ? "destructive" : "outline"}
                size="sm"
                onClick={handleNsfwToggle}
              >
                {showNsfw ? "NSFW ON" : "SFW Only"}
              </Button>
            </div>
          </div>

          {/* Tag filter pills */}
          <div className="flex flex-wrap gap-2">
            {TAG_FILTERS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTag(t.value)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  tag === t.value
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Trending Prompts */}
          <div className="rounded-lg border border-muted bg-card/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Trending prompts — click to generate</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Cyberpunk Tokyo at night",
                "Anime warrior girl",
                "Golden hour portrait",
                "Fantasy dragon",
                "Product photography",
                "Underwater scene",
                "Samurai in cherry blossoms",
                "Futuristic city",
                "Oil painting style",
                "Neon noir aesthetic",
              ].map((p) => (
                <Link
                  key={p}
                  href={`/generate?prompt=${encodeURIComponent(p + ", masterpiece, best quality, 8K")}`}
                  className="text-[11px] px-2 py-1 rounded-full border border-muted hover:border-purple-500/40 hover:text-purple-400 transition-colors"
                >
                  {p}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              No artworks found. Try adjusting your filters or be the first to
              share!
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => {
                const isNsfwBlurred =
                  item.nsfw && !nsfwRevealed.has(item.id);

                return (
                  <div key={item.id} className="group">
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                      {/* Image */}
                      <Link href={`/gallery/${item.id}`} className="block">
                      <div className="aspect-square bg-muted relative overflow-hidden cursor-pointer">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title || item.prompt.slice(0, 50)}
                            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                              isNsfwBlurred ? "blur-[20px]" : ""
                            }`}
                            loading="lazy"
                          />
                        ) : item.video_url ? (
                          <video
                            src={item.video_url}
                            className={`w-full h-full object-cover ${
                              isNsfwBlurred ? "blur-[20px]" : ""
                            }`}
                            loop
                            muted
                            autoPlay
                            playsInline
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                            No preview
                          </div>
                        )}

                        {/* NSFW badge + toggle */}
                        {item.nsfw && (
                          <>
                            <Badge
                              variant="destructive"
                              className="absolute top-2 left-2 text-[10px]"
                            >
                              NSFW
                            </Badge>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleNsfwReveal(item.id);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                              title={
                                isNsfwBlurred ? "Show image" : "Hide image"
                              }
                            >
                              {isNsfwBlurred ? (
                                <EyeIcon className="size-4" />
                              ) : (
                                <EyeOffIcon className="size-4" />
                              )}
                            </button>
                          </>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      </Link>

                      {/* Content */}
                      <CardContent className="p-3 space-y-2">
                        {/* Title */}
                        {item.title && (
                          <p className="text-sm font-medium line-clamp-1">
                            {item.title}
                          </p>
                        )}

                        {/* Prompt */}
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.prompt}
                        </p>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                              >
                                {t}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{item.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-1">
                          <span
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `/user/${item.user_id}`;
                            }}
                            className="text-xs text-muted-foreground truncate max-w-[40%] cursor-pointer hover:text-foreground transition-colors"
                          >
                            {item.author_name}
                          </span>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/generate?prompt=${encodeURIComponent(item.prompt)}&model=${item.model}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-purple-400 transition-colors"
                              title="Remix with same settings"
                            >
                              <SparklesIcon className="size-3.5" />
                            </Link>
                            <button
                              onClick={(e) => handleLike(e, item)}
                              className={`flex items-center gap-1 text-xs transition-colors ${
                                item.liked_by_me
                                  ? "text-pink-500"
                                  : "text-muted-foreground hover:text-pink-500"
                              }`}
                              disabled={likingIds.has(item.id)}
                            >
                              <HeartIcon
                                className={`size-3.5 ${
                                  item.liked_by_me ? "fill-pink-500" : ""
                                }`}
                              />
                              {item.likes_count > 0 && (
                                <span>{item.likes_count}</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div
                ref={sentinelRef}
                className="flex justify-center mt-8"
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${items.length} / ${total})`
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
