import {
  formatHour,
  getOutdoorSummary,
  type HourData,
  type OutdoorWindow,
} from "@/lib/weather";

interface OutdoorAnalysis {
  hours: HourData[];
  bestWindows: OutdoorWindow[];
  badWindows: OutdoorWindow[];
}

// Chip emoji prefix shared by best/bad condition chips.
function chipPrefix(c: string): string {
  if (c.includes("rain")) return "🌧️ ";
  if (c.includes("wind") || c.includes("breeze")) return "💨 ";
  if (c.includes("°C")) return "🌡️ ";
  return "";
}

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

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 mb-3">
      <h2 className="text-white font-semibold mb-1">Best Times Outside</h2>
      <p className="text-[#c8dae7] text-sm mb-3 leading-relaxed">
        {getOutdoorSummary(bestWindows, badWindows)}
      </p>
      <p className="text-[var(--text-muted)] text-xs mb-4">
        Best options scored within typical hours out (6am–10pm) by temperature,
        rain chance, expected amount and wind
      </p>

      {/* 24-hour colour strip — decorative; the windows below convey it textually. */}
      <div aria-hidden="true" className="grid gap-px mb-1" style={{ gridTemplateColumns: "repeat(24, 1fr)" }}>
        {hours.map((h) => {
          const isCurrentHour = isToday && h.hour === cityHour;
          return (
            <div
              key={h.hour}
              aria-current={isCurrentHour ? "time" : undefined}
              title={`${h.label}${isCurrentHour ? " (now)" : ""}: ${h.temp}°C · ${h.precipProb}% rain · ${h.windSpeed} km/h wind`}
              className={`h-8 rounded-sm ${isCurrentHour ? "ring-2 ring-white relative z-10" : ""} ${
                h.score === -1
                  ? "bg-[#1a2d3e] border border-[#1e3347]"
                  : h.score === 0
                    ? "bg-red-500/60"
                    : h.score === 1
                      ? "bg-amber-500/60"
                      : h.score === 2
                        ? "bg-blue-500/60"
                        : "bg-green-500/70"
              }`}
            />
          );
        })}
      </div>

      {/* Hour labels every 6 h */}
      <div aria-hidden="true" className="grid mb-4" style={{ gridTemplateColumns: "repeat(24, 1fr)" }}>
        {hours.map((h) => (
          <div key={h.hour} className="text-[9px] text-[var(--text-muted)] overflow-hidden whitespace-nowrap">
            {h.hour % 6 === 0 ? formatHour(h.hour) : ""}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1 mb-5 text-xs text-[var(--text-muted)]">
        {[
          { cls: "bg-green-500/70", label: "Excellent" },
          { cls: "bg-blue-500/60", label: "Good" },
          { cls: "bg-amber-500/60", label: "Fair" },
          { cls: "bg-red-500/60", label: "Bad" },
          { cls: "bg-[#1a2d3e] border border-[#1e3347]", label: "Night" },
        ].map(({ cls, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm inline-block ${cls}`} />
            {label}
          </span>
        ))}
      </div>

      {/* Best windows */}
      {bestWindows.length > 0 && (
        <div className="mb-4">
          <p className="text-[var(--text-accent)] text-xs font-semibold uppercase tracking-wider mb-2">
            Best times to go out{bestWindows.length > 1 ? ` · ${bestWindows.length} options` : ""}
          </p>
          {bestWindows.map((w, i) => (
            <div key={i} className="rounded-xl bg-[#0e1f2f] p-4 mb-2 border border-[#1a3347]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    w.rating === "Excellent" ? "bg-green-500/20 text-green-400"
                    : w.rating === "Good" ? "bg-blue-500/20 text-blue-400"
                    : "bg-amber-500/20 text-amber-400"
                  }`}>{w.rating}</span>
                  <span className="text-white font-semibold">{w.timeLabel}</span>
                </div>
                {w.peakHour && (
                  <span className="text-[var(--text-muted)] text-xs">peak {w.peakHour}</span>
                )}
              </div>
              <p className="text-[#c8dae7] text-sm mb-3 leading-snug">{w.reason}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {w.tempRange && (
                  <span className="text-[10px] bg-[var(--card-bg)] border border-[#2a4055] text-[#c8dae7] px-2.5 py-1 rounded-full">
                    🌡️ {w.tempRange}
                  </span>
                )}
                {w.conditions.split(", ").slice(1).map((c, ci) => (
                  <span key={ci} className="text-[10px] bg-[var(--card-bg)] border border-[#2a4055] text-[#c8dae7] px-2.5 py-1 rounded-full">
                    {chipPrefix(c)}{c}
                  </span>
                ))}
              </div>
              {w.activities && w.activities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {w.activities.map((act) => (
                    <span key={act} className="text-[10px] text-[var(--text-accent)] bg-[#0d1d2e] border border-[#1a3347] px-2.5 py-1 rounded-full font-medium">
                      {act}
                    </span>
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
          <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Times to avoid
          </p>
          {badWindows.map((w, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 mb-2 border ${
                w.severity === "worst"
                  ? "bg-[#2a0a0a] border-[#5a1a1a]"
                  : "bg-[#1f0e0e] border-[#3a1a1a]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    w.severity === "worst"
                      ? "bg-red-600/30 text-red-300"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {w.severity === "worst" ? "Worst period" : "Also avoid"}
                  </span>
                  <span className="text-white font-semibold">{w.timeLabel}</span>
                </div>
              </div>
              <p className={`text-sm mb-3 leading-snug ${w.severity === "worst" ? "text-red-200" : "text-red-300"}`}>{w.reason}</p>
              <div className="flex flex-wrap gap-2">
                {w.tempRange && (
                  <span className="text-[10px] bg-red-950/40 border border-red-900/40 text-red-300 px-2.5 py-1 rounded-full">
                    🌡️ {w.tempRange}
                  </span>
                )}
                {w.conditions.split(", ").map((c, ci) => (
                  <span key={ci} className="text-[10px] bg-red-950/40 border border-red-900/40 text-red-300 px-2.5 py-1 rounded-full">
                    {chipPrefix(c)}{c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {bestWindows.length === 0 && badWindows.length === 0 && (
        <p className="text-[var(--text-muted)] text-sm border-t border-[#1e3347] pt-3">
          No significant outdoor windows identified today.
        </p>
      )}
    </div>
  );
}
