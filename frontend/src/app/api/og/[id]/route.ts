import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

export const runtime = "nodejs";

/**
 * GET /api/og/[id] — serve a gallery image as a compressed JPEG for OG/Twitter cards.
 * Raw images from Supabase can be 5-6MB. X rejects anything over 5MB.
 * This resizes to 1200px wide and compresses to JPEG ~200-400KB.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fallback = new URL("/og-image.jpg", _request.url);

  try {
    const metaRes = await fetch(`${API_BASE}/gallery/${id}`, {
      next: { revalidate: 300 },
    });
    if (!metaRes.ok) return NextResponse.redirect(fallback);

    const data = await metaRes.json();
    const item = data.item || data;

    if (item.nsfw || !item.image_url) return NextResponse.redirect(fallback);

    const imgRes = await fetch(item.image_url);
    if (!imgRes.ok) return NextResponse.redirect(fallback);

    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // Resize to 1200x630 (OG standard), center crop, compress to JPEG
    const compressed = await sharp(buffer)
      .resize(1200, 630, { fit: "cover", position: "centre" })
      .jpeg({ quality: 80 })
      .toBuffer();

    return new NextResponse(new Uint8Array(compressed), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(compressed.length),
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.redirect(fallback);
  }
}
