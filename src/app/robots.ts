import type { MetadataRoute } from "next";

const BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "https://salarweather.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
