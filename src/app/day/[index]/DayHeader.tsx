import Link from "next/link";
import ShareButton from "@/app/components/ShareButton";
import LocalTime from "@/app/components/LocalTime";
import styles from "./DayHeader.module.css";

export interface DayHeaderProps {
  locationName: string;
  searchQuery: string; // already encodeURIComponent'd
  dayName: string;
  formattedDate: string;
  countryFlag: string;
  dayIndex: number;
  baseParams: string;
  isToday: boolean;
  tz?: string;
  cityTimeInitial: string;
  timeOfDay: string;
  dayLabels: string[]; // labels for daily.time.slice(0, 7)
  shareUrl: string;
  shareTitle: string;
}

// Breadcrumb + location title (with share) + the prev/next day-picker strip.
export default function DayHeader({
  locationName, searchQuery, dayName, formattedDate, countryFlag, dayIndex,
  baseParams, isToday, tz, cityTimeInitial, timeOfDay, dayLabels, shareUrl, shareTitle,
}: DayHeaderProps) {
  return (
    <>
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <Link href="/" className={styles.crumbLink}>Home</Link>
        <span>/</span>
        <Link href={`/?q=${searchQuery}`} className={styles.crumbCurrentLink}>{locationName}</Link>
        <span>/</span>
        <span aria-current="page" className={styles.crumbCurrent}>{dayName}</span>
      </nav>

      <div className={styles.headerBlock}>
        <div className={styles.titleRow}>
          {countryFlag && <span className={styles.flag} aria-hidden="true">{countryFlag}</span>}
          <h1 className={styles.title}>{locationName}</h1>
          <div className={styles.shareWrap}>
            <ShareButton url={shareUrl} title={shareTitle} />
          </div>
        </div>
        <div className={styles.metaRow}>
          <p className={styles.date}>{formattedDate}</p>
          {isToday && (
            <>
              <span className={styles.dot} aria-hidden="true">·</span>
              <LocalTime
                timezone={tz}
                initial={cityTimeInitial}
                withSeconds
                label={`Local time in ${locationName}`}
                className={styles.localTime}
              />
              <span className={styles.timeOfDay}>local time · {timeOfDay}</span>
            </>
          )}
        </div>
      </div>

      <div className={styles.picker}>
        {dayIndex > 0 ? (
          <Link href={`/day/${dayIndex - 1}?${baseParams}`} className={styles.arrow} aria-label="Previous day">←</Link>
        ) : (
          <span className={styles.arrowDisabled} aria-hidden="true">←</span>
        )}
        <div className={styles.pickerTrack}>
          {dayLabels.map((label, i) => (
            <Link
              key={i}
              href={`/day/${i}?${baseParams}`}
              aria-current={i === dayIndex ? "page" : undefined}
              className={i === dayIndex ? styles.pickerDayActive : styles.pickerDay}
            >
              {label}
            </Link>
          ))}
        </div>
        {dayIndex < 6 ? (
          <Link href={`/day/${dayIndex + 1}?${baseParams}`} className={styles.arrow} aria-label="Next day">→</Link>
        ) : (
          <span className={styles.arrowDisabled} aria-hidden="true">→</span>
        )}
      </div>
    </>
  );
}
