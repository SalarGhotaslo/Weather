"use client";

import dynamic from "next/dynamic";
import styles from "./WorldMapLoader.module.css";

const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

export default function WorldMapLoader() {
  return (
    <div className={styles.wrap}>
      <WorldMap />
    </div>
  );
}
