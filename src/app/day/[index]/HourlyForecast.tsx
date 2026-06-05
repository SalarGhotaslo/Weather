"use client";

import { useEffect, useRef } from "react";
import { getHourWeatherInfo, getHourAnimClass } from "@/lib/weather";
import { type HourlyEntry } from "@/lib/forecast";
import styles from "./HourlyForecast.module.css";

// Horizontal hour-by-hour strip for the day detail page. Night hours are dimmed
// (🌙), the current hour (today only) is ringed and labelled "Now". On today,
// the strip auto-scrolls so the current hour sits at the left edge.
export default function HourlyForecast({
  entries,
  sunriseHour,
  sunsetHour,
  isToday,
  cityHour,
}: {
  entries: HourlyEntry[];
  sunriseHour: number;
  sunsetHour: number;
  isToday: boolean;
  cityHour: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isToday) return;
    const container = scrollRef.current;
    const cell = nowRef.current;
    if (!container || !cell) return;
    // Align the current hour to the left edge without touching page scroll.
    container.scrollLeft += cell.getBoundingClientRect().left - container.getBoundingClientRect().left;
  }, [isToday, cityHour, entries.length]);

  if (entries.length === 0) return null;

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Hourly Forecast</h2>
      <div
        ref={scrollRef}
        tabIndex={0}
        role="group"
        aria-label="Hourly forecast — scroll horizontally for more hours"
        className={`${styles.scroll} scroll-fade-right`}
      >
        <div className={styles.track}>
          {entries.map((entry) => {
            const hourIsNight = entry.hour < sunriseHour || entry.hour >= sunsetHour;
            const isCurrentHour = isToday && entry.hour === cityHour;
            const cellTone = isCurrentHour ? styles.cellNow : hourIsNight ? styles.cellNight : styles.cellDay;
            const labelTone = isCurrentHour ? styles.labelNow : hourIsNight ? styles.labelNight : styles.labelDay;
            // Dynamic precip colour stays a literal Tailwind utility.
            const precipColor =
              entry.precipProb >= 60 ? "text-blue-400"
              : entry.precipProb >= 30 ? "text-sky-400"
              : isCurrentHour ? "text-[var(--text-muted)]" : "text-[var(--text-faint)]";

            return (
              <div
                key={entry.hour}
                ref={isCurrentHour ? nowRef : undefined}
                aria-current={isCurrentHour ? "time" : undefined}
                className={`${styles.cellBase} ${cellTone}`}
              >
                <span className={`${styles.labelBase} ${labelTone}`}>
                  {isCurrentHour ? "Now" : entry.label}
                </span>
                <span
                  className={`${styles.emoji} ${!hourIsNight ? getHourAnimClass(entry.weatherCode, entry.precipProb, entry.precip) : ""}`}
                  aria-hidden="true"
                >
                  {hourIsNight ? "🌙" : getHourWeatherInfo(entry.weatherCode, entry.precipProb, entry.precip).emoji}
                </span>
                <span className={hourIsNight && !isCurrentHour ? styles.tempDim : styles.tempBright}>
                  {entry.temp}°
                </span>
                <div className={styles.precipRow}>
                  <span className={`${styles.precipBase} group ${precipColor}`} tabIndex={0}>
                    💧 {entry.precipProb}%
                    <span className={styles.tooltip}>{entry.precip.toFixed(1)}mm</span>
                  </span>
                </div>
                <span className={isCurrentHour ? styles.windNow : styles.windDim}>
                  💨 {entry.windSpeed}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.legend}>
        <span>🌙 Night hours dimmed</span>
        <span>💧 Rain probability</span>
        <span>💨 Wind (km/h)</span>
      </div>
    </div>
  );
}
