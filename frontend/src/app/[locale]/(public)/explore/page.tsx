"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ImageIcon,
  VideoIcon,
  WandIcon,
  CopyIcon,
  RefreshCwIcon,
  FlagIcon,
  ShareIcon,
} from "lucide-react";

interface ExploreItem {
  id: string;
  prompt: string;
  model: string;
  nsfw: boolean;
  image_url: string | null;
  video_url: string | null;
  author_name: string;
  likes: number;
  created_at: string;
}

export default function ExplorePage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [showNsfw, setShowNsfw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExploreItem | null>(null);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const fetchExplore = async () => {
    setLoading(true);
    try {
      const data = await api.getExplore(page, sort, showNsfw);
      setItems(data.items);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load explore");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExplore();
  }, [page, sort, showNsfw]);

  const handleNsfwToggle = () => {
    if (!showNsfw && !ageConfirmed) {
      const confirmed = window.confirm(
        "You must be 18 or older to view NSFW content. Are you 18+?"
      );
      if (!confirmed) return;
      setAgeConfirmed(true);
    }
    setShowNsfw(!showNsfw);
    setPage(1);
  };

  const perPage = 24;

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Explore</h1>
            <p className="text-sm text-muted-foreground">
              Discover creations from the EGAKU AI community
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{total} works</span>
            <Select value={sort} onValueChange={(v) => v && setSort(v)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showNsfw ? "destructive" : "outline"}
              size="sm"
              onClick={handleNsfwToggle}
            >
              {showNsfw ? "NSFW ON" : "SFW Only"}
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              No public works yet. Be the first to share!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {items.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedItem(item)}
              >
                <div className="aspect-square bg-muted relative">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.prompt.slice(0, 50)}
                      className={`w-full h-full object-cover ${
                        item.nsfw
                          ? "blur-xl group-hover:blur-none transition-all"
                          : ""
                      }`}
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
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No preview
                    </div>
                  )}
                  {item.nsfw && (
                    <span className="absolute top-2 left-2 bg-red-500/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      NSFW
                    </span>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.prompt}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {item.author_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.likes > 0 && `${item.likes} likes`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > perPage && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm">
              Page {page} of {Math.ceil(total / perPage)}
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil(total / perPage)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}

        {/* Detail Modal */}
        {selectedItem && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className="bg-background rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                {selectedItem.image_url ? (
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.prompt.slice(0, 50)}
                    className="w-full rounded-t-lg"
                  />
                ) : selectedItem.video_url ? (
                  <video
                    src={selectedItem.video_url}
                    className="w-full rounded-t-lg"
                    controls
                    loop
                    autoPlay
                    muted
                  />
                ) : null}
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedItem.author_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedItem.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Prompt</p>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {selectedItem.prompt}
                  </p>
                </div>
                {selectedItem.model && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Model</p>
                    <p className="text-sm">{selectedItem.model}</p>
                  </div>
                )}

                {/* Share */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        const shareUrl = `https://egaku-ai.com/gallery/${selectedItem.id}`;
                        const text = `Check out this AI art! Made with EGAKU AI\n\n"${selectedItem.prompt.slice(0, 100)}..."`;
                        window.open(
                          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
                          "_blank"
                        );
                      }}
                    >
                      <ShareIcon className="h-3.5 w-3.5" />
                      Share to X
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        const shareUrl = `https://egaku-ai.com/gallery/${selectedItem.id}`;
                        navigator.clipboard.writeText(shareUrl);
                        toast.success("Link copied!");
                      }}
                    >
                      <CopyIcon className="h-3.5 w-3.5" />
                      Copy Link
                    </Button>
                  </div>
                </div>

                {/* Remix / Use as Input Actions */}
                <div className="border-t pt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Use as Input</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Copy Prompt */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedItem.prompt);
                        toast.success("Prompt copied!");
                      }}
                    >
                      <CopyIcon className="h-3.5 w-3.5" />
                      Copy Prompt
                    </Button>

                    {/* Remix (same prompt + settings → generate) */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        const params = new URLSearchParams({
                          prompt: selectedItem.prompt,
                          ...(selectedItem.model ? { model: selectedItem.model } : {}),
                        });
                        const dest = selectedItem.nsfw ? "/adult" : "/generate";
                        router.push(`${dest}?${params.toString()}`);
                      }}
                    >
                      <RefreshCwIcon className="h-3.5 w-3.5" />
                      Remix
                    </Button>

                    {/* img2img (use image as input for image-to-image) */}
                    {selectedItem.image_url && (
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => {
                          const params = new URLSearchParams({
                            remix_mode: "img2img",
                            remix_image: selectedItem.image_url!,
                            prompt: selectedItem.prompt,
                          });
                          const dest = selectedItem.nsfw ? "/adult" : "/generate";
                          router.push(`${dest}?${params.toString()}`);
                        }}
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        Img2Img
                      </Button>
                    )}

                    {/* img2vid (use image as input for image-to-video) */}
                    {selectedItem.image_url && (
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                        onClick={() => {
                          const params = new URLSearchParams({
                            remix_mode: "i2v",
                            remix_image: selectedItem.image_url!,
                            prompt: selectedItem.prompt,
                          });
                          const dest = selectedItem.nsfw ? "/adult" : "/generate";
                          router.push(`${dest}?${params.toString()}`);
                        }}
                      >
                        <VideoIcon className="h-3.5 w-3.5" />
                        Img2Vid
                      </Button>
                    )}

                    {/* vid2vid (use video as input for video-to-video) */}
                    {selectedItem.video_url && (
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                        onClick={() => {
                          const params = new URLSearchParams({
                            remix_mode: "vid2vid",
                            remix_video: selectedItem.video_url!,
                            prompt: selectedItem.prompt,
                          });
                          const dest = selectedItem.nsfw ? "/adult" : "/vid2vid";
                          router.push(`${dest}?${params.toString()}`);
                        }}
                      >
                        <WandIcon className="h-3.5 w-3.5" />
                        Vid2Vid
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    onClick={() => {
                      if (!session) {
                        toast.error("Please log in to report content");
                        return;
                      }
                      const reason = window.prompt(
                        "Report reason (e.g. deepfake, real person, CSAM, copyright):"
                      );
                      if (!reason) return;
                      api.reportContent(session.access_token, selectedItem!.id, reason)
                        .then(() => toast.success("Report submitted. We will review this content."))
                        .catch(() => toast.error("Failed to submit report"));
                    }}
                  >
                    <FlagIcon className="h-3.5 w-3.5" />
                    Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedItem(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
