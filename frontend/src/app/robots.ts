import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/og/"],
        disallow: ["/api/generate/", "/api/admin/", "/api/gallery/", "/api/billing/", "/settings", "/my-gallery", "/adult"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/api/og/"],
        disallow: ["/api/generate/", "/api/admin/", "/api/gallery/", "/api/billing/", "/settings", "/my-gallery", "/adult"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/gallery/", "/explore/", "/user/"],
      },
    ],
    sitemap: "https://egaku-ai.com/sitemap.xml",
  };
}
