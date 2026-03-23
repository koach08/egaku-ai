import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Image Generator - Create Art with Flux, SDXL, Stable Diffusion",
  description:
    "Generate AI images and videos with 15+ models. Flux, SDXL, SD 3.5, CivitAI LoRA. Text-to-image, img2img, style transfer, upscaling, inpainting, video generation. Free to start.",
  alternates: {
    canonical: "/generate",
    languages: { en: "/generate", ja: "/ja/generate", es: "/es/generate", zh: "/zh/generate" },
  },
  openGraph: {
    title: "AI Image Generator - EGAKU AI",
    description:
      "Generate stunning AI art with 15+ models. Flux, SDXL, SD 3.5, anime, realistic. Free 15 credits.",
  },
};

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
