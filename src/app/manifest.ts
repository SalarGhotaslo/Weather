import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Salar Weather",
    short_name: "Weather",
    description:
      "Global city weather — 5-day forecasts, hourly detail, best outdoor times, and an interactive world map.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1723",
    theme_color: "#121f2f",
    categories: ["weather", "travel", "utilities"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
