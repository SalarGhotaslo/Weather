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
      <div
        tabIndex={0}
        role="group"
        aria-label="Map instructions"
        className="bg-[#121f2f] border-b border-[#1e3347] px-4 py-2 flex items-center gap-5 text-[10px] text-[var(--text-muted)] shrink-0 overflow-x-auto"
      >
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm">👆</span>
          Hover a country to see its cities
        </span>
        <span className="text-[var(--text-faint)] shrink-0">·</span>
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm">🖱️</span>
          Click a country to zoom in &amp; drop city markers
        </span>
        <span className="text-[var(--text-faint)] shrink-0">·</span>
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm">🔍</span>
          Scroll or pinch to zoom · drag to pan
        </span>
        <span className="text-[var(--text-faint)] shrink-0">·</span>
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm">📍</span>
          Hover a city dot to see its name · click for weather
        </span>
        <span className="text-[var(--text-faint)] shrink-0">·</span>
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm">🔄</span>
          Triple-click the map to zoom out
        </span>
      </div>

      <main id="main-content" className="flex-1 flex flex-col min-h-0">
        <WorldMapLoader />
      </main>
    </div>
  );
}
