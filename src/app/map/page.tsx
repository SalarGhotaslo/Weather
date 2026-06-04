import type { Metadata } from "next";
import Header from "@/app/components/Header";
import WorldMapLoader from "@/app/components/WorldMapLoader";

export const metadata: Metadata = {
  title: "World Map",
  description:
    "Interactive world map — hover any country to see its cities, click to zoom in and view city weather forecasts.",
};

export default function MapPage() {
  return (
    <div className="h-screen bg-[#0e1723] flex flex-col overflow-hidden">
      <Header />

      {/* Instruction bar */}
      <div className="bg-[#121f2f] border-b border-[#1e3347] px-4 py-2 flex items-center gap-4 text-[10px] text-[#5a7d99] shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="text-sm">👆</span>
          Hover a country to see cities
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-sm">🖱️</span>
          Click to zoom &amp; show markers
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-sm">📍</span>
          Click a city dot for weather
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="text-sm">🔗</span>
          &quot;Browse all cities&quot; opens the countries browser
        </span>
      </div>

      <main id="main-content" className="flex-1 flex flex-col min-h-0">
        <WorldMapLoader />
      </main>
    </div>
  );
}
