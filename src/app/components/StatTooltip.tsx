// Shared hover tooltip for the stat / detail cards. The bubble markup and the
// explanatory copy used to be duplicated across the home StatCard, the day
// DetailCard, and the day page's hand-rolled UV / Sunrise cards.
//
// Must be rendered inside a parent with the `group relative` classes — the
// bubble fades in on `group-hover`.

export const STAT_TOOLTIPS: Record<string, string> = {
  "Feels Like": "How the temperature actually feels when wind chill and humidity are factored in.",
  Humidity: "The amount of water vapour in the air. Higher humidity can make the air feel warmer and more oppressive.",
  Wind: "Air movement speed. Stronger wind increases wind chill, making it feel colder than the actual temperature.",
  Precipitation: "The total amount of rain or snow expected to fall from the sky over this period.",
  "UV Index": "A measure of ultraviolet radiation from the sun. Higher values mean greater risk of sunburn and skin damage.",
  Pressure: "Atmospheric pressure — high pressure usually means stable, clear weather, while low pressure brings clouds and rain.",
  Sunrise: "The time when the sun appears over the horizon. Sunset is when it disappears for the day.",
  "Sunrise / Sunset": "The times when the sun appears and disappears over the horizon each day.",
};

export default function StatTooltip({ label, text }: { label?: string; text?: string }) {
  const content = text ?? (label ? STAT_TOOLTIPS[label] : undefined);
  if (!content) return null;
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#0e1723] border border-[#2a4055] text-[#c8dae7] text-[10px] leading-relaxed px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2a4055]" />
    </div>
  );
}
