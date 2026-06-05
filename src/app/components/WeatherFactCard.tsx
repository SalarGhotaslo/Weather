// "Did you know?" contextual weather fact card, shared by the home and day
// detail pages. Pass the string from getWeatherFact().

export default function WeatherFactCard({
  fact,
  className = "",
}: {
  fact: string;
  className?: string;
}) {
  return (
    <div className={`bg-[var(--card-bg)] rounded-xl p-4 flex items-start gap-3 ${className}`} role="note">
      <span className="text-2xl shrink-0" aria-hidden="true">💡</span>
      <div>
        <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">Did you know?</p>
        <p className="text-[#c8dae7] text-sm leading-relaxed">{fact}</p>
      </div>
    </div>
  );
}
