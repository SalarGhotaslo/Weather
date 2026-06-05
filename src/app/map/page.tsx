import type { Metadata } from "next";
import { Fragment } from "react";
import Header from "@/app/components/Header";
import WorldMapLoader from "@/app/components/WorldMapLoader";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "World Map",
  description:
    "Interactive world map — hover any country to see its cities, click to zoom in and view city weather forecasts.",
};

const HINTS = [
  { icon: "👆", text: "Hover a country to see its cities" },
  { icon: "🖱️", text: "Click a country to zoom in & drop city markers" },
  { icon: "🔍", text: "Scroll or pinch to zoom · drag to pan" },
  { icon: "📍", text: "Hover a city dot to see its name · click for weather" },
  { icon: "🔄", text: "Triple-click the map to zoom out" },
];

export default function MapPage() {
  return (
    <div className={styles.shell}>
      <Header />

      <div tabIndex={0} role="group" aria-label="Map instructions" className={styles.bar}>
        {HINTS.map((hint, i) => (
          <Fragment key={hint.icon}>
            {i > 0 && <span className={styles.dot} aria-hidden="true">·</span>}
            <span className={styles.hint}>
              <span className={styles.hintIcon}>{hint.icon}</span>
              {hint.text}
            </span>
          </Fragment>
        ))}
      </div>

      <main id="main-content" className={styles.main}>
        <h1 className="sr-only">World Map</h1>
        <WorldMapLoader />
      </main>
    </div>
  );
}
