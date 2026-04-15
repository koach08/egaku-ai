"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { AnimateButton } from "@/components/animate-button";
import { toast } from "sonner";

interface GalleryItem {
  id: string;
  prompt: string;
  nsfw: boolean;
  public: boolean;
  image_url: string | null;
  video_url?: string | null;
  created_at: string;
}

export default function GalleryPage() {
  const { user, session, loading: authLoading } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const fetchGallery = async () => {
    if (!session || !user) return;
    setLoading(true);
    try {
      const showNsfw = filter === "all" || filter === "nsfw";
      const data = await api.getMyGallery(session.access_token, user.id, page, 24, showNsfw);
      // Map backend field names to component expectations
      const mapped = (data.items || []).map((item: Record<string, unknown>) => ({
        ...item,
        public: item.public ?? false,
      }));
      // Client-side filter for SFW/NSFW
      const filtered = filter === "sfw"
        ? mapped.filter((i: GalleryItem) => !i.nsfw)
        : filter === "nsfw"
          ? mapped.filter((i: GalleryItem) => i.nsfw)
          : mapped;
      setItems(filtered);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && user) fetchGallery();
  }, [session, user, page, filter]);

  const handleDelete = async (id: string) => {
    if (!session) return;
    try {
      await api.deleteGalleryItem(session.access_token, id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleTogglePublish = async (item: GalleryItem) => {
    if (!session) return;
    try {
      if (item.public) {
        await api.unpublishGalleryItem(session.access_token, item.id);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, public: false } : i))
        );
        toast.success("Removed from public gallery");
      } else {
        await api.publishGalleryItem(session.access_token, item.id);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, public: true } : i))
        );
        toast.success("Published to Explore!");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update";
      toast.error(message);
    }
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p>Sign in to view your gallery</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Gallery</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{total} items</span>
            <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="sfw">SFW</SelectItem>
                <SelectItem value="nsfw">NSFW</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No generations yet</p>
            <Button render={<a href="/generate" />}>Start Generating</Button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden group">
                <div className="aspect-square bg-muted relative">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.prompt.slice(0, 50)}
                      className={`w-full h-full object-cover ${item.nsfw ? "blur-xl group-hover:blur-none transition-all" : ""}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      Processing...
                    </div>
                  )}
                  {item.public && (
                    <Badge className="absolute top-2 right-2 bg-green-500/80 text-[10px]">
                      Public
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.prompt}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.image_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 text-purple-500"
                          render={
                            <a
                              href={item.image_url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                        >
                          DL
                        </Button>
                      )}
                      {item.image_url && !item.video_url && (
                        <AnimateButton
                          imageUrl={item.image_url}
                          label="Animate"
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`text-xs h-6 ${item.public ? "text-green-500" : "text-muted-foreground"}`}
                        onClick={() => handleTogglePublish(item)}
                      >
                        {item.public ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 text-red-500"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
