"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./GeolocateButton.module.css";

export default function GeolocateButton() {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const router = useRouter();

  const handleClick = () => {
    if (!navigator.geolocation) {
      setState("error");
      return;
    }
    setState("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude.toFixed(4);
        const lon = coords.longitude.toFixed(4);
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const tzParam = tz ? `&tz=${encodeURIComponent(tz)}` : "";
        router.push(`/day/0?lat=${lat}&lon=${lon}&name=My%20Location${tzParam}`);
      },
      () => setState("error"),
      { timeout: 10_000 },
    );
  };

  if (state === "error") {
    return <p className={styles.error}>Location access denied or unavailable.</p>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className={styles.button}
      aria-label="Get weather for my current location"
    >
      {state === "loading" ? (
        <span className={styles.loading}>Detecting location…</span>
      ) : (
        <>
          <span aria-hidden="true">📍</span>
          <span>Use my location</span>
        </>
      )}
    </button>
  );
}
