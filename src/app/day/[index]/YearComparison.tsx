import { type HistoricalDay } from "@/lib/weather";
import styles from "./YearComparison.module.css";

// One year-over-year tile: current value + colour-coded delta + prior-year value.
function YoyStat({
  label,
  icon,
  current,
  historical,
  unit,
  higherWarmer,
}: {
  label: string;
  icon: string;
  current: number;
  historical: number;
  unit: string;
  higherWarmer: boolean; // true for temp (up=orange), false for rain (up=blue)
}) {
  const diff = +(current - historical).toFixed(1);
  const isUp = diff > 0.05;
  const isDown = diff < -0.05;
  // Dynamic colour stays a literal Tailwind utility appended to the module class.
  const deltaColor = !isUp && !isDown
    ? "text-[var(--text-muted)]"
    : higherWarmer
      ? isUp ? "text-orange-400" : "text-sky-400"
      : isUp ? "text-blue-400" : "text-emerald-400";
  const arrow = isUp ? "▲" : isDown ? "▼" : "—";
  const diffStr = isUp ? `+${diff}` : isDown ? `${diff}` : "±0";

  return (
    <div className={styles.tile}>
      <div className={styles.tileHead}>
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className={styles.tileValue}>
        {current % 1 === 0 ? Math.round(current) : current.toFixed(1)}{unit}
      </div>
      <div className={`${styles.tileDelta} ${deltaColor}`}>
        <span>{arrow}</span>
        <span>{!isUp && !isDown ? "same" : `${diffStr}${unit}`}</span>
      </div>
      <div className={styles.tilePrior}>
        {historical % 1 === 0 ? Math.round(historical) : historical.toFixed(1)}{unit} last year
      </div>
    </div>
  );
}

// "Compared to Last Year" card — three YoY tiles + a verdict, or a fallback when
// the archive has no data for the date.
export default function YearComparison({
  maxTemp,
  minTemp,
  precip,
  historical,
}: {
  maxTemp: number;
  minTemp: number;
  precip: number;
  historical: HistoricalDay | null;
}) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Compared to Last Year</h2>
      <p className={styles.subtitle}>Same date, one year ago</p>

      {historical ? (
        <div className={styles.grid}>
          <YoyStat label="Max Temp" icon="🌡️" current={maxTemp} historical={historical.temperature_2m_max} unit="°C" higherWarmer />
          <YoyStat label="Min Temp" icon="❄️" current={minTemp} historical={historical.temperature_2m_min} unit="°C" higherWarmer />
          <YoyStat label="Rainfall" icon="🌧️" current={precip} historical={historical.precipitation_sum} unit="mm" higherWarmer={false} />
        </div>
      ) : (
        <p className={styles.empty}>Historical data unavailable for this date.</p>
      )}
    </div>
  );
}
