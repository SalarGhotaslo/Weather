"use client";

import dynamic from "next/dynamic";

const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

export default function WorldMapLoader() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <WorldMap />
    </div>
  );
}
