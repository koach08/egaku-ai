import type { MetadataRoute } from "next";

const BASE_URL = "https://egaku-ai.com";
const LOCALES = ["en", "ja", "es", "zh"];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/generate", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/explore", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/gallery", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/register", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/login", priority: 0.5, changeFrequency: "monthly" as const },
    // Programmatic SEO landing pages
    { path: "/ai/flux-ai-image-generator", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/ai/sdxl-image-generator", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/ai/stable-diffusion-3-generator", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/ai/anime-ai-art-generator", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/ai/ghibli-style-ai-art", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/ai/nsfw-ai-art-generator", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/ai/ai-video-generator", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/ai/ai-image-upscaler", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/ai/ai-background-remover", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/ai/civitai-models-online", priority: 0.7, changeFrequency: "monthly" as const },
    // Adult SEO pages
    { path: "/ai/ai-nsfw-generator", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/ai/ai-hentai-generator", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/ai/ai-nsfw-video-generator", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/adult", priority: 0.6, changeFrequency: "weekly" as const },
    // New feature pages
    { path: "/photo-booth", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/shorts", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/storyboard", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/meme", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/logo", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/wallpaper", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/battle", priority: 0.7, changeFrequency: "weekly" as const },
    // Legal pages
    { path: "/content-policy", priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  const langAlternates = (path: string) => {
    const result: Record<string, string> = {};
    for (const locale of LOCALES) {
      result[locale] =
        locale === "en"
          ? `${BASE_URL}${path}`
          : `${BASE_URL}/${locale}${path === "/" ? "" : path}`;
    }
    return result;
  };

  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    for (const locale of LOCALES) {
      const url =
        locale === "en"
          ? `${BASE_URL}${page.path}`
          : `${BASE_URL}/${locale}${page.path === "/" ? "" : page.path}`;

      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: langAlternates(page.path),
        },
      });
    }
  }

  return entries;
}
