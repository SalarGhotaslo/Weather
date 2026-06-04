"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        router.push(`/day/0?lat=${lat}&lon=${lon}&name=My%20Location`);
      },
      () => setState("error"),
      { timeout: 10_000 },
    );
  };

  if (state === "error") {
    return (
      <p className="text-[#78a8c4] text-xs mt-3 text-center">
        Location access denied or unavailable.
      </p>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="mt-3 w-full text-center text-[#78a8c4] hover:text-[#7ea8c2] text-sm py-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      aria-label="Get weather for my current location"
    >
      {state === "loading" ? (
        <span className="animate-pulse">Detecting location…</span>
      ) : (
        <>
          <span aria-hidden="true">📍</span>
          <span>Use my location</span>
        </>
      )}
    </button>
  );
}
