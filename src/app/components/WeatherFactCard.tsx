// "Did you know?" contextual weather fact card, shared by the home and day
// detail pages. Pass the string from getWeatherFact().
import styles from "./WeatherFactCard.module.css";

export default function WeatherFactCard({
  fact,
  className = "",
}: {
  fact: string;
  className?: string;
}) {
  return (
    <div className={`${styles.card} ${className}`} role="note">
      <span className={styles.icon} aria-hidden="true">💡</span>
      <div>
        <p className={styles.label}>Did you know?</p>
        <p className={styles.fact}>{fact}</p>
      </div>
    </div>
  );
}
