import StatTooltip from "@/app/components/StatTooltip";
import styles from "./StatsStrip.module.css";

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className={`${styles.card} group`} tabIndex={0}>
      <StatTooltip label={label} />
      <div className={styles.label}>{label}</div>
      <div className={styles.valueRow}>
        <span className={styles.icon} aria-hidden="true">{icon}</span>
        <span className={styles.value}>{value}</span>
      </div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  );
}

export interface StatsStripProps {
  humidity: number;
  windSpeed: number;
  windArrow: string;
  windDirection: string;
  precip: number;
  uvIndex: number;
  uvLabel: string;
  pressure: number;
  sunrise: string;
  sunset: string;
}

// Six-up stat strip on the home forecast view.
export default function StatsStrip({
  humidity, windSpeed, windArrow, windDirection, precip, uvIndex, uvLabel, pressure, sunrise, sunset,
}: StatsStripProps) {
  return (
    <div className={styles.grid}>
      <StatCard icon="💧" label="Humidity" value={`${humidity}%`} />
      <StatCard icon="💨" label="Wind" value={`${windSpeed} km/h`} sub={`${windArrow} ${windDirection}`} />
      <StatCard icon="🌧️" label="Precipitation" value={`${precip} mm`} />
      <StatCard icon="☀️" label="UV Index" value={`${uvIndex} · ${uvLabel}`} />
      <StatCard icon="🌡️" label="Pressure" value={`${pressure} hPa`} />
      <StatCard icon="🌅" label="Sunrise" value={sunrise} sub={`Sunset ${sunset}`} />
    </div>
  );
}
