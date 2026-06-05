import Link from "next/link";
import { getWeatherInfo, getDayName } from "@/lib/weather";
import styles from "./FiveDayForecast.module.css";

function getBarColor(avgTemp: number): string {
  if (avgTemp <= 2) return "#60a5fa";
  if (avgTemp <= 10) return "#38bdf8";
  if (avgTemp <= 18) return "#86efac";
  if (avgTemp <= 26) return "#fbbf24";
  return "#f97316";
}

function TrendIndicator({ temps }: { temps: number[] }) {
  const diff = Math.round(temps[4] - temps[0]);
  if (diff > 2) return <span className={styles.trendWarm}>↑ warming {diff}°</span>;
  if (diff < -2) return <span className={styles.trendCool}>↓ cooling {Math.abs(diff)}°</span>;
  return <span className={styles.trendSteady}>→ steady</span>;
}

function TempSparkline({ maxTemps }: { maxTemps: number[] }) {
  const minT = Math.min(...maxTemps);
  const maxT = Math.max(...maxTemps);
  const range = maxT - minT || 1;
  const W = 100, H = 20, PAD = 3;
  const px = (i: number) => (i / 4) * W;
  const py = (t: number) => PAD + (1 - (t - minT) / range) * (H - PAD * 2);
  const pts = maxTemps.map((t, i) => `${px(i).toFixed(1)},${py(t).toFixed(1)}`);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p}`).join(" ");
  return (
    <div className={styles.spark}>
      <span className={styles.sparkLabel}>Temp trend</span>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.sparkSvg} aria-hidden="true" preserveAspectRatio="none">
        <path d={d} fill="none" stroke="#3b87d6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {maxTemps.map((t, i) => <circle key={i} cx={px(i)} cy={py(t)} r="2" fill="#3b87d6" />)}
      </svg>
      <span className={styles.sparkLabel}>
        {Math.round(maxTemps[0])}° → {Math.round(maxTemps[4])}°
      </span>
    </div>
  );
}

export interface FiveDayForecastProps {
  dates: string[];
  weatherCodes: number[];
  maxTemps: number[];
  minTemps: number[];
  precipProbs: number[];
  overallMin: number;
  tempRange: number;
  bestDayIndices: number[];
  hrefFor: (index: number) => string;
}

// Five-day forecast grid with temperature-range bars, "best day" stars, rain
// probability and a temperature-trend sparkline.
export default function FiveDayForecast({
  dates, weatherCodes, maxTemps, minTemps, precipProbs, overallMin, tempRange, bestDayIndices, hrefFor,
}: FiveDayForecastProps) {
  return (
    <div className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.heading}>5-Day Forecast</h2>
        <TrendIndicator temps={maxTemps} />
      </div>
      <div className={styles.grid} role="list">
        {dates.map((dateStr, i) => {
          const info = getWeatherInfo(weatherCodes[i]);
          const maxTemp = Math.round(maxTemps[i]);
          const minTemp = Math.round(minTemps[i]);
          const avgTemp = (maxTemps[i] + minTemps[i]) / 2;
          const barLeft = ((minTemps[i] - overallMin) / tempRange) * 100;
          const barWidth = Math.max(((maxTemps[i] - minTemps[i]) / tempRange) * 100, 8);
          const isToday = i === 0;
          const prob = precipProbs[i] ?? 0;

          return (
            <Link
              key={dateStr}
              href={hrefFor(i)}
              role="listitem"
              aria-label={`${getDayName(dateStr)}: ${info.label}, high ${maxTemp}°C, low ${minTemp}°C`}
              className={isToday ? styles.dayToday : styles.day}
            >
              <div className={isToday ? styles.dayNameToday : styles.dayName}>{getDayName(dateStr)}</div>
              {bestDayIndices.includes(i) && <div className={styles.best}>⭐ Best</div>}
              <div className={styles.dayEmoji} aria-hidden="true">{info.emoji}</div>
              <div className={styles.max}>{maxTemp}°</div>
              <div className={styles.bar} role="presentation">
                <div
                  className={styles.barFill}
                  style={{ left: `${barLeft}%`, width: `${barWidth}%`, backgroundColor: getBarColor(avgTemp) }}
                />
              </div>
              <div className={styles.min}>{minTemp}°</div>
              {prob >= 15 && (
                <div className={prob >= 60 ? styles.precipHigh : styles.precipLow}>💧{prob}%</div>
              )}
            </Link>
          );
        })}
      </div>
      <TempSparkline maxTemps={maxTemps} />
    </div>
  );
}
