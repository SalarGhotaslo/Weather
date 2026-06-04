"use client";

import { useEffect, useState } from "react";

function format(timezone: string | undefined, withSeconds: boolean): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      ...(withSeconds ? { second: "2-digit" } : {}),
      hourCycle: "h23",
    }).format(new Date());
  } catch {
    return "";
  }
}

/**
 * Live local clock for the viewed city. Renders the city's current time and
 * ticks every second. Timezone is an IANA name (e.g. "Europe/London"); when
 * absent it falls back to the visitor's own timezone.
 *
 * The server-rendered value (from `formatCityTime`) is passed as `initial` so
 * there is no layout shift or flash before hydration.
 */
export default function LocalTime({
  timezone,
  initial,
  withSeconds = false,
  className = "",
  label = "Local time",
}: {
  timezone?: string;
  initial?: string;
  withSeconds?: boolean;
  className?: string;
  label?: string;
}) {
  const [time, setTime] = useState(initial ?? "");

  useEffect(() => {
    const tick = () => setTime(format(timezone, withSeconds));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timezone, withSeconds]);

  if (!time) return null;

  return (
    <span className={className}>
      <span aria-hidden="true">🕐</span>{" "}
      <time aria-label={`${label} ${time}`}>{time}</time>
    </span>
  );
}
