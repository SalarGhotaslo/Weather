import {
  getHourWeatherInfo,
  getHourAnimClass,
  type HourlyEntry,
} from "@/lib/weather";

// Horizontal hour-by-hour strip for the day detail page. Night hours are dimmed
// (🌙), the current hour (today only) is ringed and labelled "Now".
export default function HourlyForecast({
  entries,
  sunriseHour,
  sunsetHour,
  isToday,
  cityHour,
}: {
  entries: HourlyEntry[];
  sunriseHour: number;
  sunsetHour: number;
  isToday: boolean;
  cityHour: number;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 mb-3">
      <h2 className="text-white font-semibold mb-4 text-lg">Hourly Forecast</h2>
      <div
        tabIndex={0}
        role="group"
        aria-label="Hourly forecast — scroll horizontally for more hours"
        className="overflow-x-auto -mx-1 px-1 scroll-fade-right"
      >
        <div className="flex gap-2 min-w-max">
          {entries.map((entry) => {
            const hourIsNight = entry.hour < sunriseHour || entry.hour >= sunsetHour;
            const isCurrentHour = isToday && entry.hour === cityHour;
            return (
              <div
                key={entry.hour}
                aria-current={isCurrentHour ? "time" : undefined}
                className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-xl min-w-[72px] ${
                  isCurrentHour
                    ? "bg-[var(--card-bg-secondary)] ring-2 ring-[var(--accent-color)]"
                    : hourIsNight
                      ? "bg-[#0e1723]/70"
                      : "bg-[var(--card-bg-alt)]"
                }`}
              >
                <span
                  className={`text-[11px] font-semibold whitespace-nowrap ${
                    isCurrentHour ? "text-[var(--text-accent)]" : hourIsNight ? "text-[var(--text-faint)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  {isCurrentHour ? "Now" : entry.label}
                </span>
                <span className={`text-2xl leading-none ${!hourIsNight ? getHourAnimClass(entry.weatherCode, entry.precipProb, entry.precip) : ""}`} aria-hidden="true">
                  {hourIsNight ? "🌙" : getHourWeatherInfo(entry.weatherCode, entry.precipProb, entry.precip).emoji}
                </span>
                <span
                  className={`text-base font-bold ${hourIsNight && !isCurrentHour ? "text-[var(--text-faint)]" : "text-white"}`}
                >
                  {entry.temp}°
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`relative group text-[11px] font-medium ${
                      entry.precipProb >= 60
                        ? "text-blue-400"
                        : entry.precipProb >= 30
                          ? "text-sky-400"
                          : isCurrentHour
                            ? "text-[var(--text-muted)]"
                            : "text-[var(--text-faint)]"
                    }`}
                  >
                    💧 {entry.precipProb}%
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1c2f3f] text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                      {entry.precip.toFixed(1)}mm
                    </span>
                  </span>
                </div>
                <span className={`text-[10px] ${isCurrentHour ? "text-[var(--text-muted)]" : "text-[var(--text-faint)]"}`}>
                  💨 {entry.windSpeed}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[var(--text-muted)] text-[10px]">
        <span>🌙 Night hours dimmed</span>
        <span>💧 Rain probability</span>
        <span>💨 Wind (km/h)</span>
      </div>
    </div>
  );
}
