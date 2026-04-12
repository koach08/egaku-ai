import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "EGAKU AI - AI Image & Video Generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 40%, #2d1b4e 70%, #1a0a2e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo / Brand */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            background: "linear-gradient(90deg, #a855f7, #6366f1, #ec4899)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 16,
            display: "flex",
          }}
        >
          EGAKU AI
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#e2e8f0",
            marginBottom: 40,
            display: "flex",
          }}
        >
          AI Image & Video Generator
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: 900,
          }}
        >
          {[
            "Sora 2",
            "Veo 3",
            "Flux",
            "Kling 2.5",
            "SDXL",
            "CivitAI",
            "Vid2Vid",
            "Face Swap",
          ].map((label) => (
            <div
              key={label}
              style={{
                background: "rgba(168, 85, 247, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                borderRadius: 24,
                padding: "8px 20px",
                color: "#c4b5fd",
                fontSize: 18,
                display: "flex",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 18,
            color: "#94a3b8",
            display: "flex",
          }}
        >
          25+ AI Models | Free to Start | egaku-ai.com
        </div>
      </div>
    ),
    { ...size }
  );
}
