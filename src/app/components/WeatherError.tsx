import Header from "./Header";
import styles from "./WeatherError.module.css";

// Shared fallback shown when the forecast fetch fails on the home or day pages.
export default function WeatherError({ defaultSearch }: { defaultSearch?: string }) {
  return (
    <div className={styles.shell}>
      <Header defaultSearch={defaultSearch} />
      <main id="main-content" className={styles.main}>
        <p className={styles.message}>Failed to load weather data. Please try again later.</p>
      </main>
    </div>
  );
}
