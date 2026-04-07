import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Download a file from a URL (works with cross-origin like fal.ai) */
export async function downloadFile(url: string, filename?: string, watermark?: boolean) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();

    // Add watermark for free plan users (images only)
    if (watermark && blob.type.startsWith("image/")) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const imgUrl = URL.createObjectURL(blob);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imgUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      // Semi-transparent watermark in bottom-right
      const fontSize = Math.max(14, Math.floor(img.width / 40));
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.textAlign = "right";
      ctx.fillText("EGAKU AI", img.width - fontSize, img.height - fontSize);
      URL.revokeObjectURL(imgUrl);

      canvas.toBlob((wmBlob) => {
        if (!wmBlob) return;
        const blobUrl = URL.createObjectURL(wmBlob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || "egaku-image.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, "image/png");
      return;
    }

    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || url.split("/").pop()?.split("?")[0] || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // Fallback: open in new tab
    window.open(url, "_blank");
  }
}
