import {
  formatHour,
  getOutdoorSummary,
  type HourData,
  type OutdoorWindow,
} from "@/lib/weather";
import styles from "./OutdoorTimes.module.css";

interface OutdoorAnalysis {
  hours: HourData[];
  bestWindows: OutdoorWindow[];
  badWindows: OutdoorWindow[];
}

// Chip emoji prefix shared by best/bad condition chips.
function chipPrefix(c: string): string {
  if (c.includes("rain")) return "🌧️ ";
  if (/wind|breez|calm/.test(c)) return "💨 "; // wind, breeze, breezy, windy, calm
  if (c.includes("°C")) return "🌡️ ";
  return "";
}

// Dynamic colour utilities stay literal Tailwind (they vary per score/rating).
function scoreColor(score: number): string {
  if (score === -1) return "bg-[#1a2d3e] border border-[#1e3347]";
  if (score === 0) return "bg-red-500/60";
  if (score === 1) return "bg-amber-500/60";
  if (score === 2) return "bg-blue-500/60";
  return "bg-green-500/70";
}

function ratingColor(rating: string): string {
  if (rating === "Excellent") return "bg-green-500/20 text-green-400";
  if (rating === "Good") return "bg-blue-500/20 text-blue-400";
  return "bg-amber-500/20 text-amber-400";
}

const LEGEND = [
  { cls: "bg-green-500/70", label: "Excellent" },
  { cls: "bg-blue-500/60", label: "Good" },
  { cls: "bg-amber-500/60", label: "Fair" },
  { cls: "bg-red-500/60", label: "Bad" },
  { cls: "bg-[#1a2d3e] border border-[#1e3347]", label: "Night" },
];

// "Best Times Outside" — a colour strip (decorative, mirrored textually below)
// plus scored best/worst window cards. Strip + legend are aria-hidden because
// the same information is in the summary sentence and window cards.
export default function OutdoorTimes({
  analysis,
  isToday,
  cityHour,
}: {
  analysis: OutdoorAnalysis;
  isToday: boolean;
  cityHour: number;
}) {
  const { hours, bestWindows, badWindows } = analysis;
  const cols = { gridTemplateColumns: "repeat(24, 1fr)" };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Best Times Outside</h2>
      <p className={styles.summary}>{getOutdoorSummary(bestWindows, badWindows)}</p>
      <p className={styles.note}>
        Best options scored within typical hours out (6am–10pm) by temperature,
        rain chance, expected amount and wind
      </p>

      {/* 24-hour colour strip — decorative; the windows below convey it textually. */}
      <div aria-hidden="true" className={styles.strip} style={cols}>
        {hours.map((h) => {
          const isCurrentHour = isToday && h.hour === cityHour;
          return (
            <div
              key={h.hour}
              aria-current={isCurrentHour ? "time" : undefined}
              title={`${h.label}${isCurrentHour ? " (now)" : ""}: ${h.temp}°C · ${h.precipProb}% rain · ${h.windSpeed} km/h wind`}
              className={`${styles.cell} ${isCurrentHour ? styles.cellNow : ""} ${scoreColor(h.score)}`}
            />
          );
        })}
      </div>

      {/* Hour labels every 6 h */}
      <div aria-hidden="true" className={styles.labels} style={cols}>
        {hours.map((h) => (
          <div key={h.hour} className={styles.label}>
            {h.hour % 6 === 0 ? formatHour(h.hour) : ""}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div aria-hidden="true" className={styles.legend}>
        {LEGEND.map(({ cls, label }) => (
          <span key={label} className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${cls}`} />
            {label}
          </span>
        ))}
      </div>

      {/* Best windows */}
      {bestWindows.length > 0 && (
        <div className={styles.bestSection}>
          <p className={styles.bestHeading}>
            Best times to go out{bestWindows.length > 1 ? ` · ${bestWindows.length} options` : ""}
          </p>
          {bestWindows.map((w, i) => (
            <div key={i} className={styles.bestCard}>
              <div className={styles.cardHead}>
                <div className={styles.cardHeadLeft}>
                  <span className={`${styles.badge} ${ratingColor(w.rating)}`}>{w.rating}</span>
                  <span className={styles.timeLabel}>{w.timeLabel}</span>
                </div>
                {w.peakHour && <span className={styles.peak}>peak {w.peakHour}</span>}
              </div>
              <p className={styles.reason}>{w.reason}</p>
              <div className={styles.chips}>
                {w.tempRange && <span className={styles.chip}>🌡️ {w.tempRange}</span>}
                {w.conditions.split(", ").slice(1).map((c, ci) => (
                  <span key={ci} className={styles.chip}>{chipPrefix(c)}{c}</span>
                ))}
              </div>
              {w.activities && w.activities.length > 0 && (
                <div className={styles.activities}>
                  {w.activities.map((act) => (
                    <span key={act} className={styles.activity}>{act}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bad windows */}
      {badWindows.length > 0 && (
        <div>
          <p className={styles.badHeading}>Times to avoid</p>
          {badWindows.map((w, i) => {
            const isWorst = w.severity === "worst";
            return (
              <div
                key={i}
                className={`${styles.badCard} ${isWorst ? "bg-[#2a0a0a] border-[#5a1a1a]" : "bg-[#1f0e0e] border-[#3a1a1a]"}`}
              >
                <div className={styles.cardHead}>
                  <div className={styles.cardHeadLeft}>
                    <span className={`${styles.badge} ${isWorst ? "bg-red-600/30 text-red-300" : "bg-red-500/20 text-red-400"}`}>
                      {isWorst ? "Worst period" : "Also avoid"}
                    </span>
                    <span className={styles.timeLabel}>{w.timeLabel}</span>
                  </div>
                </div>
                <p className={`text-sm mb-3 leading-snug ${isWorst ? "text-red-200" : "text-red-300"}`}>{w.reason}</p>
                <div className={styles.badChips}>
                  {w.tempRange && <span className={styles.badChip}>🌡️ {w.tempRange}</span>}
                  {w.conditions.split(", ").map((c, ci) => (
                    <span key={ci} className={styles.badChip}>{chipPrefix(c)}{c}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {bestWindows.length === 0 && badWindows.length === 0 && (
        <p className={styles.empty}>No significant outdoor windows identified today.</p>
      )}
    </div>
  );
}
