import type { MetadataRoute } from "next";
import { GENERATED_PAGES } from "./[locale]/(public)/ai/[slug]/generated-pages";
import { ARTICLES } from "./[locale]/(public)/blog/[slug]/articles";

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
    // New SEO landing pages
    { path: "/ai/ai-portrait-generator", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/ai/ai-logo-maker", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/ai/ai-meme-generator", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/ai/video-style-transfer", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/ai/ai-face-swap-online", priority: 0.8, changeFrequency: "monthly" as const },
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

  // Auto-generated long-tail SEO pages (style × subject combinations + use-cases)
  for (const slug of Object.keys(GENERATED_PAGES)) {
    pages.push({
      path: `/ai/${slug}`,
      priority: 0.6,
      changeFrequency: "monthly" as const,
    });
  }

  // Blog / Journal articles
  pages.push({ path: "/blog", priority: 0.7, changeFrequency: "weekly" as const });
  for (const article of ARTICLES) {
    pages.push({
      path: `/blog/${article.slug}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
    });
  }

  // New feature pages
  pages.push({ path: "/product-studio", priority: 0.8, changeFrequency: "weekly" as const });
  pages.push({ path: "/short-story", priority: 0.8, changeFrequency: "weekly" as const });
  pages.push({ path: "/vid2vid", priority: 0.7, changeFrequency: "weekly" as const });
  // 2026-05 feature pages
  pages.push({ path: "/movie-maker", priority: 0.9, changeFrequency: "weekly" as const });
  pages.push({ path: "/music-gen", priority: 0.9, changeFrequency: "weekly" as const });
  pages.push({ path: "/cinema-studio", priority: 0.8, changeFrequency: "weekly" as const });
  pages.push({ path: "/music-video", priority: 0.8, changeFrequency: "weekly" as const });
  pages.push({ path: "/marketing-video", priority: 0.7, changeFrequency: "weekly" as const });
  pages.push({ path: "/url-to-ad", priority: 0.7, changeFrequency: "weekly" as const });
  pages.push({ path: "/voiceover", priority: 0.8, changeFrequency: "weekly" as const });
  pages.push({ path: "/photodump", priority: 0.7, changeFrequency: "weekly" as const });
  pages.push({ path: "/templates", priority: 0.8, changeFrequency: "weekly" as const });
  pages.push({ path: "/vfx", priority: 0.8, changeFrequency: "weekly" as const });
  pages.push({ path: "/sketch", priority: 0.8, changeFrequency: "weekly" as const });
  pages.push({ path: "/expand", priority: 0.7, changeFrequency: "weekly" as const });
  pages.push({ path: "/remove-object", priority: 0.8, changeFrequency: "weekly" as const });
  pages.push({ path: "/find-replace", priority: 0.7, changeFrequency: "weekly" as const });
  pages.push({ path: "/try-on", priority: 0.8, changeFrequency: "weekly" as const });
  pages.push({ path: "/multi-shot", priority: 0.7, changeFrequency: "weekly" as const });
  pages.push({ path: "/sound-effects", priority: 0.7, changeFrequency: "weekly" as const });
  pages.push({ path: "/tools", priority: 0.8, changeFrequency: "weekly" as const });
  pages.push({ path: "/talking-avatar", priority: 0.7, changeFrequency: "weekly" as const });
  pages.push({ path: "/lip-sync", priority: 0.7, changeFrequency: "weekly" as const });
  pages.push({ path: "/character-video", priority: 0.7, changeFrequency: "weekly" as const });
  pages.push({ path: "/voice-clone", priority: 0.7, changeFrequency: "weekly" as const });
  pages.push({ path: "/lora-train", priority: 0.7, changeFrequency: "weekly" as const });
  pages.push({ path: "/referrals", priority: 0.5, changeFrequency: "monthly" as const });

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
