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
  const { user } = useAuth();
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
                <div className="flex justify-end">
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
