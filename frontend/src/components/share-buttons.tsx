"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LinkIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// ShareButtons — compact row of share targets for a gallery item.
//
// Renders X/Twitter, LINE, Pinterest, and Copy-link buttons. Designed to be
// dropped next to Remix/Animate actions on the gallery detail page, or inline
// on gallery cards.
// ---------------------------------------------------------------------------

export interface ShareButtonsProps {
  imageUrl?: string | null;
  videoUrl?: string | null;
  title?: string;
  prompt?: string;
  galleryId: string;
  /** Visual size. "sm" for detail pages, "xs" for cards. */
  size?: "xs" | "sm";
  /** Optional extra classnames applied to the wrapping row. */
  className?: string;
}

const SITE = "https://egaku-ai.com";

export function ShareButtons({
  imageUrl,
  videoUrl: _videoUrl,
  title,
  prompt,
  galleryId,
  size = "sm",
  className,
}: ShareButtonsProps) {
  const url = `${SITE}/gallery/${galleryId}`;
  const safeTitle = (title || "").trim();
  const safePrompt = (prompt || "").trim().slice(0, 180);
  const tweetText = [
    safeTitle,
    safePrompt ? `\n\n${safePrompt}${safePrompt.length === 180 ? "..." : ""}` : "",
    "\n\n#AIart #AIgenerated #StableDiffusion #FluxAI #egakuai",
  ].join("").trim();

  const openPopup = (href: string) => {
    try {
      window.open(href, "_blank", "noopener,noreferrer,width=720,height=640");
    } catch {
      window.open(href, "_blank");
    }
  };

  const handleX = () => {
    const href = `https://x.com/intent/tweet?text=${encodeURIComponent(
      tweetText
    )}&url=${encodeURIComponent(url)}`;
    openPopup(href);
  };

  const handleLine = () => {
    const href = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
      url
    )}`;
    openPopup(href);
  };

  const handlePinterest = () => {
    // Pinterest requires a fully-qualified image URL to pin.
    const pinMedia = imageUrl || "";
    const href = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
      url
    )}&media=${encodeURIComponent(pinMedia)}&description=${encodeURIComponent(
      safeTitle || safePrompt || "AI art"
    )}`;
    openPopup(href);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const btnSize = size === "xs" ? "xs" : "sm";
  const iconSize = size === "xs" ? "size-3" : "size-4";

  return (
    <div className={`flex items-center gap-1 ${className || ""}`}>
      <Button
        variant="ghost"
        size={btnSize}
        onClick={handleX}
        title="Share on X"
        aria-label="Share on X"
      >
        <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </Button>
      <Button
        variant="ghost"
        size={btnSize}
        onClick={handleLine}
        title="Share on LINE"
        aria-label="Share on LINE"
      >
        <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
      </Button>
      <Button
        variant="ghost"
        size={btnSize}
        onClick={handlePinterest}
        title="Share on Pinterest"
        aria-label="Share on Pinterest"
        disabled={!imageUrl}
      >
        <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.697-2.43-2.884-2.43-4.638 0-3.776 2.743-7.245 7.908-7.245 4.153 0 7.38 2.956 7.38 6.908 0 4.124-2.6 7.445-6.209 7.445-1.213 0-2.354-.63-2.744-1.374l-.746 2.842c-.27 1.04-1 2.345-1.489 3.138C9.583 23.812 10.77 24 12 24c6.628 0 12-5.372 12-12S18.628 0 12 0z" />
        </svg>
      </Button>
      <Button
        variant="ghost"
        size={btnSize}
        onClick={handleCopy}
        title="Copy link"
        aria-label="Copy link"
      >
        <LinkIcon className={iconSize} />
      </Button>
    </div>
  );
}

export default ShareButtons;
