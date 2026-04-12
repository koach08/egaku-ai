"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MessageSquareIcon, XIcon } from "lucide-react";

type Category = "bug" | "feature_request" | "praise" | "general";

const CATEGORY_LABELS: Record<Category, string> = {
  bug: "🐛 Bug / Not working",
  feature_request: "💡 Feature request",
  praise: "❤️ Praise / Compliment",
  general: "💬 General comment",
};

/** Best-effort feature key based on current pathname. */
function featureFromPath(pathname: string): string {
  // Strip locale prefix like /en, /ja
  const clean = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
  const seg = clean.split("/").filter(Boolean)[0] || "home";
  return seg;
}

export function FeedbackButton() {
  const { session } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("bug");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const submit = async () => {
    if (!message.trim()) {
      toast.error("Please write a message");
      return;
    }
    setSubmitting(true);
    try {
      await api.submitFeedback(session?.access_token ?? null, {
        feature: featureFromPath(pathname),
        category,
        message: message.trim(),
        rating: rating ?? undefined,
        page_url: typeof window !== "undefined" ? window.location.href : undefined,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });
      toast.success("Thanks! We'll read this.");
      setOpen(false);
      setMessage("");
      setRating(null);
      setCategory("bug");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 shadow-lg transition-all hover:scale-105"
        aria-label="Send feedback"
      >
        <MessageSquareIcon className="size-4" />
        <span className="text-sm font-medium hidden sm:inline">Feedback</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-base font-semibold">Send us feedback</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10"
                aria-label="Close"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={category} onValueChange={(v) => v && setCategory(v as Category)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABELS) as Category[]).map((k) => (
                      <SelectItem key={k} value={k}>{CATEGORY_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">
                  What happened? / What would you like?
                </Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    category === "bug"
                      ? "e.g. I set duration to 15s but the output video was only 5s long."
                      : category === "feature_request"
                      ? "e.g. I'd love to upload a reference image for style..."
                      : "Your thoughts..."
                  }
                  rows={5}
                  className="mt-1"
                  autoFocus
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Overall experience (optional)
                </Label>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(rating === n ? null : n)}
                      className={`w-9 h-9 rounded-lg text-lg transition-colors ${
                        rating !== null && n <= rating
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground">
                Page: <span className="text-white/60">{featureFromPath(pathname) || "home"}</span>
                {session ? "" : " · sending anonymously"}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-white/10 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={submitting || !message.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {submitting ? "Sending…" : "Send feedback"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
