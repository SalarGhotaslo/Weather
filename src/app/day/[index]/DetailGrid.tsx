import StatTooltip from "@/app/components/StatTooltip";
import { type PollenInfo, type AqiInfo } from "@/lib/weather";
import styles from "./DetailGrid.module.css";

// ── UV index colour meter ─────────────────────────────────────────────
function uvColor(uv: number): string {
  if (uv <= 2) return "#22c55e";
  if (uv <= 5) return "#eab308";
  if (uv <= 7) return "#f97316";
  if (uv <= 10) return "#ef4444";
  return "#a855f7";
}

function UvMeter({ uv }: { uv: number }) {
  const pct = Math.min((uv / 12) * 100, 100);
  return (
    <div className={styles.uvMeter} aria-label={`UV index ${uv} of 12`}>
      <div className={styles.uvTrack}>
        <div className={styles.uvFill} style={{ width: `${pct}%`, backgroundColor: uvColor(uv) }} />
      </div>
      <div className={styles.uvScale}>
        {["0", "3", "6", "8", "11+"].map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

// ── Daylight 24-hour bar ──────────────────────────────────────────────
function DaylightBar({ risePercent, lightPercent, hours, minutes }: {
  risePercent: number;
  lightPercent: number;
  hours: number;
  minutes: number;
}) {
  return (
    <div className={styles.daylight}>
      <div className={styles.daylightHead}>
        <span>☀️ Daylight</span>
        <span>{hours}h {minutes}m</span>
      </div>
      <div className={styles.daylightTrack}>
        <div
          className={styles.daylightFill}
          style={{
            left: `${risePercent}%`,
            width: `${lightPercent}%`,
            background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #f97316 100%)",
          }}
          aria-hidden="true"
        />
      </div>
      <div className={styles.daylightScale}>
        {["12am", "6am", "12pm", "6pm", "12am"].map((l, i) => <span key={`${l}-${i}`}>{l}</span>)}
      </div>
    </div>
  );
}

function DetailCard({ icon, label, value, sub }: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className={`${styles.card} group`}>
      <StatTooltip label={label} />
      <div className={styles.cardLabel}>
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className={styles.cardValue}>{value}</div>
      {sub && <div className={styles.cardSub}>{sub}</div>}
    </div>
  );
}

export interface DetailGridProps {
  feelsLike: number;
  feelsLikeExplanation?: string;
  humidity: number | null;
  windMax: number;
  windArrow: string;
  windDirection: string;
  precip: number;
  uvIndex: number;
  uvLabel: string;
  uvTip: string;
  sunrise: string;
  sunset: string;
  daylight: { risePercent: number; lightPercent: number; hours: number; minutes: number };
  pressure: number | null;
  aqi: AqiInfo | null;
  pollen: PollenInfo | null;
}

// The 2/3-column stat grid on the day detail page. The same cards render for
// every day — "today" uses live current conditions, future days use the daily
// forecast aggregates / hourly-mean fallbacks resolved in buildDayView.
export default function DetailGrid(props: DetailGridProps) {
  const {
    feelsLike, feelsLikeExplanation, humidity, windMax, windArrow,
    windDirection, precip, uvIndex, uvLabel, uvTip, sunrise, sunset, daylight, pressure, aqi, pollen,
  } = props;

  return (
    <div className={styles.grid}>
      <DetailCard
        icon="🌡️"
        label="Feels Like"
        value={`${feelsLike}°C`}
        sub={feelsLikeExplanation || undefined}
      />
      <DetailCard icon="💧" label="Humidity" value={humidity !== null ? `${humidity}%` : "—"} />
      <DetailCard
        icon="💨"
        label="Wind"
        value={`${windMax} km/h`}
        sub={`${windArrow} ${windDirection}`}
      />
      <DetailCard icon="🌧️" label="Precipitation" value={`${precip} mm`} />

      <div className={`${styles.card} group`}>
        <StatTooltip label="UV Index" />
        <div className={styles.cardLabel}>
          <span aria-hidden="true">☀️</span>
          <span>UV Index</span>
        </div>
        <div className={styles.cardValue}>{uvIndex} · {uvLabel}</div>
        <div className={styles.cardSub}>{uvTip}</div>
        <UvMeter uv={uvIndex} />
      </div>

      <div className={`${styles.card} group`}>
        <StatTooltip text="The times when the sun appears and disappears over the horizon. Daylight length changes throughout the year based on your latitude." />
        <div className={styles.cardLabel}>
          <span aria-hidden="true">🌅</span>
          <span>Sunrise / Sunset</span>
        </div>
        <div className={styles.cardValue}>{sunrise}</div>
        <div className={styles.cardSub}>Sunset {sunset}</div>
        <DaylightBar {...daylight} />
      </div>

      <DetailCard
        icon="🔵"
        label="Pressure"
        value={pressure !== null ? `${pressure} hPa` : "—"}
        sub={pressure !== null ? (pressure > 1013 ? "High pressure" : pressure < 1000 ? "Low pressure" : "Normal") : undefined}
      />
      {aqi && (
        <DetailCard
          icon="🫧"
          label="Air Quality"
          value={aqi.label}
          sub={`AQI ${aqi.aqi}${aqi.pm25 !== null ? ` · PM2.5 ${aqi.pm25} µg/m³` : ""}`}
        />
      )}
      {pollen && (
        <DetailCard
          icon="🌸"
          label="Pollen"
          value={pollen.label}
          sub={`${pollen.dominant} · ${pollen.value} grains/m³`}
        />
      )}
    </div>
  );
}
