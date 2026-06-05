import Link from "next/link";
import TimeGradient from "@/app/components/TimeGradient";
import styles from "./CurrentHero.module.css";

export interface CurrentHeroProps {
  href: string;
  timezone?: string;
  temp: number;
  label: string;
  emoji: string;
  animClass: string;
  isNight: boolean;
  isClearish: boolean;
  feelsLike: number;
  feelsLikeExplanation: string;
  high: number;
  low: number;
}

// Clickable "today" hero card on the home forecast view → links to /day/0.
export default function CurrentHero({
  href, timezone, temp, label, emoji, animClass, isNight, isClearish,
  feelsLike, feelsLikeExplanation, high, low,
}: CurrentHeroProps) {
  const showMoon = isNight && isClearish;
  return (
    <Link
      href={href}
      className={styles.hero}
      aria-label={`Today: ${label}, ${Math.round(temp)}°C. View details.`}
    >
      <TimeGradient timezone={timezone} />
      <div className={styles.top}>
        <div>
          <div className={styles.temp} aria-hidden="true">{Math.round(temp)}°C</div>
          <div className={styles.label}>{label}</div>
          <div className={styles.feels}>
            Feels like {Math.round(feelsLike)}°C
            {feelsLikeExplanation && (
              <span className={styles.feelsExtra}>· {feelsLikeExplanation}</span>
            )}
          </div>
        </div>
        <span className={`${styles.emoji} ${showMoon ? "" : animClass}`} aria-hidden="true">
          {showMoon ? "🌙" : emoji}
        </span>
      </div>
      <div className={styles.footer}>
        <span className={styles.range}>
          High {Math.round(high)}°C · Low {Math.round(low)}°C
        </span>
        <span className={styles.cta}>View details →</span>
      </div>
    </Link>
  );
}
