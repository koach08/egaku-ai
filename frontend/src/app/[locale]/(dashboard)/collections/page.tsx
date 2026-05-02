"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { BookmarkIcon, Trash2Icon, ExternalLinkIcon } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

type BookmarkedItem = {
  id: string;
  prompt: string;
  image_url?: string;
  video_url?: string;
  model: string;
  nsfw: boolean;
};

export default function CollectionsPage() {
  const { session } = useAuth();
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
  const [items, setItems] = useState<BookmarkedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("egaku_bookmarks");
      if (stored) setBookmarkIds(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (bookmarkIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      bookmarkIds.map((id) =>
        fetch(`${API_BASE}/gallery/${id}`)
          .then((r) => r.json())
          .then((data) => ({
            id,
            prompt: data.prompt || "",
            image_url: data.image_url,
            video_url: data.video_url,
            model: data.model || "",
            nsfw: data.nsfw || false,
          }))
          .catch(() => null)
      )
    ).then((results) => {
      setItems(results.filter(Boolean) as BookmarkedItem[]);
      setLoading(false);
    });
  }, [bookmarkIds]);

  const removeBookmark = (id: string) => {
    const updated = bookmarkIds.filter((b) => b !== id);
    setBookmarkIds(updated);
    setItems((prev) => prev.filter((i) => i.id !== id));
    localStorage.setItem("egaku_bookmarks", JSON.stringify(updated));
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <BookmarkIcon className="size-6 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold">My Collection</h1>
            <p className="text-sm text-muted-foreground">Images and videos you bookmarked from the gallery.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/30">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <BookmarkIcon className="size-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No bookmarks yet.</p>
            <p className="text-xs mt-1 mb-4">Browse the gallery and tap the bookmark icon to save.</p>
            <Button variant="outline" render={<Link href="/gallery" />} className="rounded-full">
              Browse Gallery
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item) => (
              <div key={item.id} className="group relative rounded-xl border border-white/[0.06] overflow-hidden">
                <Link href={`/gallery/${item.id}`}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.prompt.slice(0, 50)} className="w-full aspect-square object-cover" loading="lazy" />
                  ) : item.video_url ? (
                    <video src={item.video_url} className="w-full aspect-square object-cover" muted loop autoPlay playsInline />
                  ) : (
                    <div className="w-full aspect-square bg-white/[0.02] flex items-center justify-center text-white/10 text-xs">No preview</div>
                  )}
                </Link>
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => removeBookmark(item.id)}
                    className="p-1.5 bg-black/60 rounded-full text-white/60 hover:text-red-400"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
                <div className="p-2">
                  <p className="text-[10px] text-white/40 line-clamp-1">{item.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
