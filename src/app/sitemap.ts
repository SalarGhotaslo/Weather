import type { MetadataRoute } from "next";

const BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "https://salarweather.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/countries`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/map`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  ];
}
