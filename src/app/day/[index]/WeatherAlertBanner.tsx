import { type WeatherAlert } from "@/lib/weather";
import styles from "./WeatherAlertBanner.module.css";

// Severe-weather banner shown above the detail grid. `warning` is the higher
// severity (red); `advisory` is amber.
export default function WeatherAlertBanner({ alert }: { alert: WeatherAlert }) {
  const isWarning = alert.level === "warning";
  return (
    <div role="alert" className={`${styles.banner} ${isWarning ? styles.warning : styles.advisory}`}>
      <span className={styles.icon} aria-hidden="true">{isWarning ? "🚨" : "⚠️"}</span>
      <div>
        <p className={`${styles.title} ${isWarning ? styles.titleWarning : styles.titleAdvisory}`}>
          {alert.title}
        </p>
        <p className={styles.message}>{alert.message}</p>
      </div>
    </div>
  );
}
