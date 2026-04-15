"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import { AnimateButton } from "@/components/animate-button";
import { ShareButtons } from "@/components/share-buttons";
import { toast } from "sonner";
import {
  HeartIcon,
  ArrowLeftIcon,
  Loader2Icon,
  CopyIcon,
  SparklesIcon,
  EyeIcon,
  EyeOffIcon,
  DownloadIcon,
  ShareIcon,
  LinkIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GalleryItemDetail {
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

interface RelatedItem {
  id: string;
  title: string;
  prompt: string;
  image_url: string | null;
  video_url: string | null;
  nsfw: boolean;
  likes_count: number;
  author_name: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GalleryItemPage() {
  const params = useParams();
  const router = useRouter();
  const { user, session } = useAuth();

  const id = params?.id as string;

  const [item, setItem] = useState<GalleryItemDetail | null>(null);
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [nsfwRevealed, setNsfwRevealed] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  // ─── Data Fetching ───

  const fetchItem = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getGalleryItem(id);
      setItem(data.item || data);
      if (data.related) {
        setRelatedItems(data.related);
      }
    } catch {
      toast.error("Failed to load artwork");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  // ─── Like ───

  const handleLike = async () => {
    if (!session) {
      toast.error("Sign in to like images");
      return;
    }
    if (!item || liking) return;

    setLiking(true);
    try {
      const res = await api.toggleLike(session.access_token, item.id);
      setItem((prev) =>
        prev ? { ...prev, liked_by_me: res.liked, likes_count: res.likes_count } : prev
      );
    } catch {
      toast.error("Failed to update like");
    } finally {
      setLiking(false);
    }
  };

  // ─── Remix ───

  const handleRemix = async () => {
    if (!session) {
      toast.error("Sign in to remix images");
      return;
    }
    if (!item) return;

    try {
      const remixData = await api.getRemixData(session.access_token, item.id);
      // Build query params from remix data for the generate page
      const params = new URLSearchParams();
      if (remixData.prompt) params.set("prompt", remixData.prompt);
      if (remixData.negative_prompt)
        params.set("negative_prompt", remixData.negative_prompt);
      if (remixData.model) params.set("model", remixData.model);
      if (remixData.width) params.set("width", String(remixData.width));
      if (remixData.height) params.set("height", String(remixData.height));
      if (remixData.steps) params.set("steps", String(remixData.steps));
      if (remixData.cfg) params.set("cfg", String(remixData.cfg));
      if (remixData.sampler) params.set("sampler", remixData.sampler);
      if (remixData.seed) params.set("seed", String(remixData.seed));

      router.push(`/generate?${params.toString()}`);
    } catch {
      // Fallback: use the item data directly
      const params = new URLSearchParams();
      if (item.prompt) params.set("prompt", item.prompt);
      if (item.negative_prompt)
        params.set("negative_prompt", item.negative_prompt);
      if (item.model) params.set("model", item.model);
      if (item.width) params.set("width", String(item.width));
      if (item.height) params.set("height", String(item.height));
      if (item.steps) params.set("steps", String(item.steps));
      if (item.cfg) params.set("cfg", String(item.cfg));
      if (item.sampler) params.set("sampler", item.sampler);
      if (item.seed) params.set("seed", String(item.seed));

      router.push(`/generate?${params.toString()}`);
    }
  };

  // ─── Copy Prompt ───

  const handleCopyPrompt = async () => {
    if (!item?.prompt) return;
    try {
      await navigator.clipboard.writeText(item.prompt);
      setPromptCopied(true);
      toast.success("Prompt copied to clipboard");
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

  // ─── Share ───

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = item?.title
    ? `${item.title} - Created with EGAKU AI`
    : "Check out this AI artwork - Created with EGAKU AI";

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShareX = () => {
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const handleShareLine = () => {
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  // ─── Loading State ───

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted-foreground">Artwork not found</p>
          <Button variant="outline" render={<Link href="/gallery" />}>
            Back to Gallery
          </Button>
        </div>
      </>
    );
  }

  const isNsfwBlurred = item.nsfw && !nsfwRevealed;

  // ─── Render ───

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon className="size-4 mr-1" />
          Back
        </Button>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* ─── Left Column: Image ─── */}
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-muted">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title || item.prompt.slice(0, 50)}
                  className={`w-full max-h-[80vh] object-contain transition-all duration-300 ${
                    isNsfwBlurred ? "blur-[20px]" : ""
                  }`}
                />
              ) : item.video_url ? (
                <video
                  src={item.video_url}
                  className={`w-full max-h-[80vh] ${
                    isNsfwBlurred ? "blur-[20px]" : ""
                  }`}
                  controls
                  loop
                  autoPlay
                  muted
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
                  No preview available
                </div>
              )}

              {/* NSFW overlay */}
              {item.nsfw && isNsfwBlurred && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="text-center space-y-3">
                    <Badge variant="destructive" className="text-sm px-3 py-1">
                      NSFW Content
                    </Badge>
                    <p className="text-white text-sm">
                      This image contains mature content
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNsfwRevealed(true)}
                      className="bg-black/50 border-white/30 text-white hover:bg-black/70"
                    >
                      <EyeIcon className="size-4 mr-1" />
                      Reveal
                    </Button>
                  </div>
                </div>
              )}

              {/* NSFW revealed toggle */}
              {item.nsfw && nsfwRevealed && (
                <button
                  onClick={() => setNsfwRevealed(false)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  title="Hide image"
                >
                  <EyeOffIcon className="size-4" />
                </button>
              )}
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={item.liked_by_me ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  disabled={liking}
                  className={
                    item.liked_by_me
                      ? "bg-pink-500/20 text-pink-500 border-pink-500/30 hover:bg-pink-500/30"
                      : ""
                  }
                >
                  <HeartIcon
                    className={`size-4 mr-1 ${
                      item.liked_by_me ? "fill-pink-500" : ""
                    }`}
                  />
                  {item.likes_count > 0 ? item.likes_count : "Like"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleRemix}>
                  <SparklesIcon className="size-4 mr-1" />
                  Remix
                </Button>
                {user && item.image_url && !item.video_url && (
                  <AnimateButton
                    imageUrl={item.image_url}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-purple-500 border-purple-500/30 hover:bg-purple-500/10"
                    label="Animate to Video"
                  />
                )}
                <ShareButtons
                  imageUrl={item.image_url}
                  videoUrl={item.video_url}
                  title={item.title}
                  prompt={item.prompt}
                  galleryId={item.id}
                  size="sm"
                  className="ml-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleShareX} title="Share on X">
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleShareFacebook} title="Share on Facebook">
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleShareLine} title="Share on LINE">
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleShare} title="Copy link">
                  <LinkIcon className="size-4" />
                </Button>
                {(item.image_url || item.video_url) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const url = item.video_url || item.image_url;
                      if (url) import("@/lib/utils").then(m => m.downloadFile(url, item.video_url ? "egaku-video.mp4" : "egaku-image.png"));
                    }}
                  >
                    <DownloadIcon className="size-4 mr-1" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ─── Right Column: Details ─── */}
          <div className="space-y-4">
            {/* Author */}
            <Card>
              <CardContent className="p-4">
                <Link href={`/user/${item.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm">
                      {item.author_name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.author_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Title & Tags */}
            <Card>
              <CardContent className="p-4 space-y-3">
                {item.title && (
                  <h1 className="text-lg font-bold">{item.title}</h1>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t) => (
                      <Link key={t} href={`/gallery?tag=${t}`}>
                        <Badge variant="secondary" className="text-xs cursor-pointer">
                          {t}
                        </Badge>
                      </Link>
                    ))}
                    {item.nsfw && (
                      <Badge variant="destructive" className="text-xs">
                        NSFW
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prompt */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Prompt
                  </p>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleCopyPrompt}
                  >
                    <CopyIcon className="size-3 mr-1" />
                    {promptCopied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="text-sm bg-muted p-3 rounded-md leading-relaxed whitespace-pre-wrap">
                  {item.prompt}
                </p>

                {item.negative_prompt && (
                  <>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Negative Prompt
                    </p>
                    <p className="text-sm bg-muted p-3 rounded-md leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {item.negative_prompt}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Generation Parameters */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Parameters
                </p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  {item.model && (
                    <>
                      <span className="text-muted-foreground">Model</span>
                      <span className="font-mono text-xs">{item.model}</span>
                    </>
                  )}
                  {item.width && item.height && (
                    <>
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-mono text-xs">
                        {item.width} x {item.height}
                      </span>
                    </>
                  )}
                  {item.steps && (
                    <>
                      <span className="text-muted-foreground">Steps</span>
                      <span className="font-mono text-xs">{item.steps}</span>
                    </>
                  )}
                  {item.cfg && (
                    <>
                      <span className="text-muted-foreground">CFG Scale</span>
                      <span className="font-mono text-xs">{item.cfg}</span>
                    </>
                  )}
                  {item.sampler && (
                    <>
                      <span className="text-muted-foreground">Sampler</span>
                      <span className="font-mono text-xs">{item.sampler}</span>
                    </>
                  )}
                  {item.seed != null && item.seed !== -1 && (
                    <>
                      <span className="text-muted-foreground">Seed</span>
                      <span className="font-mono text-xs">{item.seed}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ─── Related Images ─── */}
        {relatedItems.length > 0 && (
          <div className="mt-12">
            <Separator className="mb-8" />
            <h2 className="text-lg font-bold mb-4">Related Artworks</h2>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {relatedItems.map((related) => (
                <Link
                  key={related.id}
                  href={`/gallery/${related.id}`}
                  className="block group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {related.image_url ? (
                        <img
                          src={related.image_url}
                          alt={
                            related.title || related.prompt.slice(0, 50)
                          }
                          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                            related.nsfw ? "blur-[20px]" : ""
                          }`}
                          loading="lazy"
                        />
                      ) : related.video_url ? (
                        <video
                          src={related.video_url}
                          className={`w-full h-full object-cover ${
                            related.nsfw ? "blur-[20px]" : ""
                          }`}
                          loop
                          muted
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No preview
                        </div>
                      )}
                      {related.nsfw && (
                        <Badge
                          variant="destructive"
                          className="absolute top-1.5 left-1.5 text-[9px]"
                        >
                          NSFW
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {related.title || related.prompt}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground truncate">
                          {related.author_name}
                        </span>
                        {related.likes_count > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <HeartIcon className="size-2.5" />
                            {related.likes_count}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
