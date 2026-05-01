"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

interface Announcement {
  id: string;
  type: "info" | "update" | "warning" | "error" | "success";
  title: string;
  message: string;
  link_url?: string;
  link_label?: string;
  created_at: string;
}

interface Props {
  location?: "home" | "gallery";
}

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  info: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "ℹ️", text: "text-blue-400" },
  update: { bg: "bg-purple-500/10", border: "border-purple-500/30", icon: "🚀", text: "text-purple-400" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "⚠️", text: "text-amber-400" },
  error: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "🔴", text: "text-red-400" },
  success: { bg: "bg-green-500/10", border: "border-green-500/30", icon: "✅", text: "text-green-400" },
};

export function AnnouncementBanner({ location = "home" }: Props) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load dismissed IDs from localStorage
    try {
      const stored = localStorage.getItem("egaku_dismissed_announcements");
      if (stored) setDismissed(new Set(JSON.parse(stored)));
    } catch {}

    // Hardcoded new-feature announcement (remove after 2 weeks)
    const hardcoded: Announcement[] = [
      {
        id: "music-moviemaker-launch-2026-05",
        type: "update",
        title: "NEW: AI Music Generator + AI Movie Maker",
        message: "Create original music from text (like Suno) and produce complete AI movies from a single concept. Image → Video → Music → Export.",
        link_url: "/movie-maker",
        link_label: "Try AI Movie Maker",
        created_at: new Date().toISOString(),
      },
    ];

    // Fetch announcements from API and merge with hardcoded
    fetch(`${API_BASE}/announcements/?location=${location}`)
      .then((res) => res.json())
      .then((data) => setItems([...hardcoded, ...(data.announcements || [])]))
      .catch(() => setItems(hardcoded));
  }, [location]);

  const dismiss = (id: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(id);
    setDismissed(newDismissed);
    try {
      localStorage.setItem("egaku_dismissed_announcements", JSON.stringify([...newDismissed]));
    } catch {}
  };

  const visible = items.filter((item) => !dismissed.has(item.id));
  if (visible.length === 0) return null;

  return (
    <div className="container mx-auto px-4 pt-4 space-y-2">
      {visible.map((item) => {
        const style = TYPE_STYLES[item.type] || TYPE_STYLES.info;
        return (
          <div
            key={item.id}
            className={`relative rounded-lg border ${style.border} ${style.bg} p-3 flex items-start gap-3`}
          >
            <span className="text-xl flex-shrink-0">{style.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${style.text}`}>{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.message}</p>
              {item.link_url && item.link_label && (
                <Link
                  href={item.link_url}
                  className={`text-xs ${style.text} hover:underline mt-1 inline-block`}
                >
                  {item.link_label} →
                </Link>
              )}
            </div>
            <button
              onClick={() => dismiss(item.id)}
              className="text-muted-foreground hover:text-foreground text-sm flex-shrink-0"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
