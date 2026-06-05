import { tempDiffDescription, type HistoricalDay } from "@/lib/weather";

// One year-over-year tile: current value + colour-coded delta + prior-year value.
function YoyStat({
  label,
  icon,
  current,
  historical,
  unit,
  higherWarmer,
}: {
  label: string;
  icon: string;
  current: number;
  historical: number;
  unit: string;
  higherWarmer: boolean; // true for temp (up=orange), false for rain (up=blue)
}) {
  const diff = +(current - historical).toFixed(1);
  const isUp = diff > 0.05;
  const isDown = diff < -0.05;
  const deltaColor = !isUp && !isDown
    ? "text-[var(--text-muted)]"
    : higherWarmer
      ? isUp ? "text-orange-400" : "text-sky-400"
      : isUp ? "text-blue-400" : "text-emerald-400";
  const arrow = isUp ? "▲" : isDown ? "▼" : "—";
  const diffStr = isUp ? `+${diff}` : isDown ? `${diff}` : "±0";

  return (
    <div className="bg-[var(--card-bg-alt)] rounded-xl p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px] uppercase tracking-wider">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-white font-bold text-2xl leading-none">
        {current % 1 === 0 ? Math.round(current) : current.toFixed(1)}{unit}
      </div>
      <div className={`flex items-center gap-1 text-sm font-semibold ${deltaColor}`}>
        <span>{arrow}</span>
        <span>{!isUp && !isDown ? "same" : `${diffStr}${unit}`}</span>
      </div>
      <div className="text-[var(--text-faint)] text-[10px]">
        {historical % 1 === 0 ? Math.round(historical) : historical.toFixed(1)}{unit} last year
      </div>
    </div>
  );
}

// "Compared to Last Year" card — three YoY tiles + a verdict, or a fallback when
// the archive has no data for the date.
export default function YearComparison({
  maxTemp,
  minTemp,
  precip,
  historical,
}: {
  maxTemp: number;
  minTemp: number;
  precip: number;
  historical: HistoricalDay | null;
}) {
  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 mb-3">
      <h2 className="text-white font-semibold mb-1">Compared to Last Year</h2>
      <p className="text-[var(--text-muted)] text-xs mb-4">Same date, one year ago</p>

      {historical ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <YoyStat label="Max Temp" icon="🌡️" current={maxTemp} historical={historical.temperature_2m_max} unit="°C" higherWarmer />
            <YoyStat label="Min Temp" icon="❄️" current={minTemp} historical={historical.temperature_2m_min} unit="°C" higherWarmer />
            <YoyStat label="Rainfall" icon="🌧️" current={precip} historical={historical.precipitation_sum} unit="mm" higherWarmer={false} />
          </div>
          <div className="pt-3 border-t border-[#1e3347] flex items-center gap-2">
            <span className="text-[var(--text-muted)] text-sm">Verdict:</span>
            <span className="text-white text-sm font-medium">
              {tempDiffDescription(maxTemp, historical.temperature_2m_max)}
            </span>
          </div>
        </>
      ) : (
        <p className="text-[var(--text-muted)] text-sm">
          Historical data unavailable for this date.
        </p>
      )}
    </div>
  );
}
