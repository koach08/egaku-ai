import { ImageResponse } from "next/og";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

export const runtime = "edge";
export const alt = "AI Art on EGAKU AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

export default async function Image({ params }: Props) {
  const { id } = await params;

  let title = "AI Creation";
  let author = "EGAKU AI";
  let imageUrl: string | null = null;
  let nsfw = false;

  try {
    const res = await fetch(`${API_BASE}/gallery/${id}`, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      const item = data.item || data;
      title = item.title || item.prompt?.slice(0, 60) || title;
      author = item.author_name || "Anonymous";
      nsfw = !!item.nsfw;
      if (!nsfw && item.image_url) imageUrl = item.image_url;
    }
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1a0033 0%, #330066 50%, #4a0080 100%)",
          padding: 40,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Image on left */}
        <div
          style={{
            width: 520,
            height: 520,
            borderRadius: 16,
            background: "#0a0014",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            marginRight: 40,
            border: "2px solid rgba(236, 72, 153, 0.4)",
          }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              width={520}
              height={520}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ display: "flex", color: "#ec4899", fontSize: 72 }}>
              {nsfw ? "🔞" : "🎨"}
            </div>
          )}
        </div>

        {/* Text on right */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 20,
                color: "#ec4899",
                fontWeight: 600,
              }}
            >
              <div style={{ display: "flex" }}>✨ EGAKU AI</div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 52,
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.1,
                maxWidth: 560,
              }}
            >
              {title.length > 70 ? title.slice(0, 70) + "…" : title}
            </div>
            <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.7)" }}>
              by {author}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                display: "flex",
                fontSize: 20,
                color: "#fff",
                padding: "8px 16px",
                background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
                borderRadius: 8,
                width: "fit-content",
                fontWeight: 600,
              }}
            >
              Generate yours free →
            </div>
            <div style={{ display: "flex", fontSize: 16, color: "rgba(255,255,255,0.6)" }}>
              30+ AI models · Sora 2 · Veo 3 · Flux · Kling · egaku-ai.com
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
