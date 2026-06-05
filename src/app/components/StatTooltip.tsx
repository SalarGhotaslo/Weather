// Shared hover tooltip for the stat / detail cards. The bubble markup and the
// explanatory copy used to be duplicated across the home StatCard, the day
// DetailCard, and the day page's hand-rolled UV / Sunrise cards.
//
// Must be rendered inside a parent with the `group relative` classes — the
// bubble fades in on `group-hover`.
import styles from "./StatTooltip.module.css";

export const STAT_TOOLTIPS: Record<string, string> = {
  "Feels Like": "How the temperature actually feels when wind chill and humidity are factored in.",
  Humidity: "The amount of water vapour in the air. Higher humidity can make the air feel warmer and more oppressive.",
  Wind: "Air movement speed. Stronger wind increases wind chill, making it feel colder than the actual temperature.",
  Precipitation: "The total amount of rain or snow expected to fall from the sky over this period.",
  "UV Index": "A measure of ultraviolet radiation from the sun. Higher values mean greater risk of sunburn and skin damage.",
  Pressure: "Atmospheric pressure — high pressure usually means stable, clear weather, while low pressure brings clouds and rain.",
  "Air Quality": "US Air Quality Index (0–500) based on fine particulates and pollutants. Lower is cleaner: 0–50 Good, 51–100 Moderate, 100+ increasingly unhealthy. PM2.5 is the fine-particle concentration.",
  Pollen: "Airborne pollen grains that can trigger hay-fever and allergies. Levels peak in spring and summer. Modelled for Europe; the dominant pollen type and its daily peak are shown.",
  Sunrise: "The time when the sun appears over the horizon. Sunset is when it disappears for the day.",
  "Sunrise / Sunset": "The times when the sun appears and disappears over the horizon each day.",
};

export default function StatTooltip({ label, text }: { label?: string; text?: string }) {
  const content = text ?? (label ? STAT_TOOLTIPS[label] : undefined);
  if (!content) return null;
  return (
    <div className={styles.bubble}>
      {content}
      <div className={styles.arrow} />
    </div>
  );
}
