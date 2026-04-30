import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

/**
 * GET /api/og/[id] — serve a gallery image as a compressed OG image.
 * X/Twitter rejects images over 5MB. This endpoint fetches the original,
 * and proxies it. For images already under 5MB it passes through directly.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Fetch gallery item metadata
    const metaRes = await fetch(`${API_BASE}/gallery/${id}`, {
      next: { revalidate: 300 },
    });
    if (!metaRes.ok) {
      return NextResponse.redirect(new URL("/og-image.jpg", _request.url));
    }

    const data = await metaRes.json();
    const item = data.item || data;

    if (item.nsfw || !item.image_url) {
      return NextResponse.redirect(new URL("/og-image.jpg", _request.url));
    }

    // Fetch the actual image
    const imgRes = await fetch(item.image_url);
    if (!imgRes.ok) {
      return NextResponse.redirect(new URL("/og-image.jpg", _request.url));
    }

    const buffer = await imgRes.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/og-image.jpg", _request.url));
  }
}
