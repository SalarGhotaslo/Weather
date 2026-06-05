import { getWeatherInfo, getHourWeatherInfo, type HourlyEntry } from "@/lib/weather";
import styles from "./CurrentWeatherCard.module.css";

export interface CurrentWeatherCardProps {
  isToday: boolean;
  todayTemp: number | null;
  maxTemp: number;
  minTemp: number;
  dayName: string;
  infoLabel: string;
  infoEmoji: string;
  animClass: string;
  locationName: string;
  timeOfDay: string;
  isNight: boolean;
  currentHourEntry: HourlyEntry | null;
}

// The hero weather card on the day detail page: big temperature, condition,
// high/low, and a "right now" strip (today only).
export default function CurrentWeatherCard({
  isToday, todayTemp, maxTemp, minTemp, dayName, infoLabel, infoEmoji, animClass,
  locationName, timeOfDay, isNight, currentHourEntry,
}: CurrentWeatherCardProps) {
  const heroTemp = isToday && todayTemp !== null ? todayTemp : maxTemp;

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div>
          <div className={styles.temp}>{Math.round(heroTemp)}°C</div>
          <div className={styles.labelRow}>
            <span className={styles.label}>{dayName} · {infoLabel}</span>
          </div>
          <div className={styles.range}>
            <span className={styles.rangeHigh}>{Math.round(maxTemp)}°</span>
            {" / "}
            <span>{Math.round(minTemp)}°</span>
            {isToday && todayTemp !== null ? " · High / Low" : ""}
          </div>
        </div>
        <span className={`${styles.emoji} ${animClass}`} aria-hidden="true">{infoEmoji}</span>
      </div>

      {isToday && (
        <div className={styles.now}>
          <div className={styles.nowHead}>
            <span aria-hidden="true">
              {currentHourEntry
                ? (isNight ? "🌙" : getHourWeatherInfo(currentHourEntry.weatherCode, currentHourEntry.precipProb, currentHourEntry.precip).emoji)
                : (isNight ? "🌙" : "🌤️")}
            </span>
            <span className={styles.nowTitle}>Right now in {locationName.split(",")[0]}</span>
            <span className={styles.nowMeta}>· {timeOfDay}</span>
          </div>
          <div className={styles.nowStats}>
            <span className={styles.nowTemp}>{Math.round(todayTemp ?? maxTemp)}°C</span>
            {currentHourEntry && (
              <>
                <span className={styles.nowMuted} aria-hidden="true">
                  {isNight ? "🌙" : getWeatherInfo(currentHourEntry.weatherCode).emoji}{" "}
                  <span className={styles.nowStrong}>{getWeatherInfo(currentHourEntry.weatherCode).label}</span>
                </span>
                <span className={styles.nowMuted}>
                  <span aria-hidden="true">💧</span> {currentHourEntry.precipProb}% rain
                </span>
                <span className={styles.nowMuted}>
                  <span aria-hidden="true">💨</span> {currentHourEntry.windSpeed} km/h
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
