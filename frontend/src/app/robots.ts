import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/settings", "/my-gallery"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/settings", "/my-gallery"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/gallery/", "/explore/", "/user/"],
      },
    ],
    sitemap: "https://egaku-ai.com/sitemap.xml",
  };
}
