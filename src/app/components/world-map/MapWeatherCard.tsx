import { getWeatherInfo, formatCityTime } from "@/lib/weather";
import LocalTime from "../LocalTime";
import type { CurrentWeather } from "@/app/api/current/route";
import styles from "./MapWeatherCard.module.css";

type Card = CurrentWeather & { country: string };

// Inline weather card in the cities panel — the capital on a country click, or
// the clicked city. Renders a loading skeleton / error / the resolved card.
export default function MapWeatherCard({
  loading,
  error,
  card,
}: {
  loading: boolean;
  error: boolean;
  card: Card | null;
}) {
  if (!loading && !error && !card) return null;

  return (
    <div className={styles.card}>
      {loading ? (
        <div className={styles.skeleton}>
          <div className={styles.skelLine1} />
          <div className={styles.skelLine2} />
          <div className={styles.skelLine3} />
        </div>
      ) : error ? (
        <p className={styles.error}>Weather unavailable for this location.</p>
      ) : card ? (
        <>
          <p className={styles.name}>
            {card.name}
            {card.isCapital && <span className={styles.capital}>capital</span>}
          </p>
          <div className={styles.row}>
            <span className={styles.emoji} aria-hidden="true">{getWeatherInfo(card.code).emoji}</span>
            <span className={styles.temp}>{card.temp}°</span>
            <span className={styles.label}>{getWeatherInfo(card.code).label}</span>
          </div>
          <p className={styles.feels}>
            Feels {card.feelsLike}° ·{" "}
            <LocalTime
              timezone={card.timezone}
              initial={formatCityTime(card.timezone)}
              className="inline"
              label={`Local time in ${card.name}`}
            />
          </p>
          <a
            href={`/?q=${encodeURIComponent(`${card.name}, ${card.country}`)}`}
            className={styles.link}
          >
            Full 5-day forecast →
          </a>
        </>
      ) : null}
    </div>
  );
}
