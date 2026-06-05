// ── Air quality (Open-Meteo Air Quality API) ────────────────────────────────
// One request powers two cards: US AQI + PM2.5 (CAMS global — worldwide) and
// pollen (CAMS Europe — EU only).
const POLLEN_TYPES = [
  { key: "alder_pollen", label: "Alder" },
  { key: "birch_pollen", label: "Birch" },
  { key: "grass_pollen", label: "Grass" },
  { key: "mugwort_pollen", label: "Mugwort" },
  { key: "olive_pollen", label: "Olive" },
  { key: "ragweed_pollen", label: "Ragweed" },
] as const;

export type PollenKey = (typeof POLLEN_TYPES)[number]["key"];

export interface AirQualityResponse {
  hourly?: { time: string[] }
    & Partial<Record<PollenKey, (number | null)[]>>
    & { pm2_5?: (number | null)[]; us_aqi?: (number | null)[] };
}

export interface PollenInfo {
  dominant: string; // e.g. "Grass" — the type driving the reading
  value: number;    // grains/m³ (daily max of the dominant type)
  label: string;    // None | Low | Moderate | High | Very High
  tip: string;
}

export interface AqiInfo {
  aqi: number;          // US AQI (daily max for the date)
  pm25: number | null;  // PM2.5 µg/m³ at the peak-AQI hour
  label: string;        // Good | Moderate | …
  tip: string;
}

export function buildAirQualityUrl(lat: number, lon: number, timezone?: string): string {
  const tz = timezone ? `&timezone=${encodeURIComponent(timezone)}` : "&timezone=auto";
  const vars = [...POLLEN_TYPES.map((p) => p.key), "pm2_5", "us_aqi"].join(",");
  return `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=${vars}${tz}&forecast_days=7`;
}

// Indices of the hourly samples that fall on `dateStr`.
function dayIndices(times: unknown, dateStr: string): number[] {
  if (!Array.isArray(times)) return [];
  return times.reduce<number[]>((acc, t, i) => {
    if (typeof t === "string" && t.startsWith(dateStr)) acc.push(i);
    return acc;
  }, []);
}

// US EPA AQI bands (0–500).
export function describeUsAqi(aqi: number): { label: string; tip: string } {
  if (aqi <= 50) return { label: "Good", tip: "Air quality is satisfactory" };
  if (aqi <= 100) return { label: "Moderate", tip: "Acceptable; unusually sensitive people take care" };
  if (aqi <= 150) return { label: "Unhealthy for sensitive", tip: "Sensitive groups may feel effects" };
  if (aqi <= 200) return { label: "Unhealthy", tip: "Everyone may feel effects — limit exertion" };
  if (aqi <= 300) return { label: "Very unhealthy", tip: "Health warnings — avoid outdoor exertion" };
  return { label: "Hazardous", tip: "Serious health risk — stay indoors" };
}

// Daily-max US AQI for a date (+ PM2.5 at that hour). Global coverage; null only
// when the date is outside the forecast window or the API returns no AQI.
export function getDayAqi(data: AirQualityResponse, dateStr: string): AqiInfo | null {
  const idxs = dayIndices(data.hourly?.time, dateStr);
  const aqiArr = data.hourly?.us_aqi;
  if (idxs.length === 0 || !Array.isArray(aqiArr)) return null;

  const pmArr = data.hourly?.pm2_5;
  let maxAqi = -1;
  let pm25AtPeak: number | null = null;
  for (const i of idxs) {
    const v = aqiArr[i];
    if (typeof v === "number" && v > maxAqi) {
      maxAqi = v;
      pm25AtPeak = Array.isArray(pmArr) && typeof pmArr[i] === "number" ? (pmArr[i] as number) : null;
    }
  }
  if (maxAqi < 0) return null;

  const { label, tip } = describeUsAqi(maxAqi);
  return {
    aqi: Math.round(maxAqi),
    pm25: pm25AtPeak !== null ? Math.round(pm25AtPeak) : null,
    label,
    tip,
  };
}

// Map a grains/m³ reading to an approximate risk band. Species thresholds vary;
// this is a pragmatic general scale aligned with common EU bandings.
export function describePollenLevel(value: number): { label: string; tip: string } {
  if (value <= 0) return { label: "None", tip: "No pollen detected" };
  if (value < 20) return { label: "Low", tip: "Comfortable for most people" };
  if (value < 50) return { label: "Moderate", tip: "Sensitive people may react" };
  if (value < 150) return { label: "High", tip: "Allergy symptoms likely — take precautions" };
  return { label: "Very High", tip: "Severe symptoms likely — limit time outside" };
}

// Reduce the hourly pollen forecast to the dominant type + daily-max reading for
// a given date. Returns null when the location has no pollen coverage (the API
// only models pollen across Europe) or the date is outside the forecast window.
export function getDayPollen(data: AirQualityResponse, dateStr: string): PollenInfo | null {
  const idxs = dayIndices(data.hourly?.time, dateStr);
  if (idxs.length === 0) return null;

  let best: { label: string; value: number } | null = null;
  for (const { key, label } of POLLEN_TYPES) {
    const arr = data.hourly?.[key];
    if (!Array.isArray(arr)) continue;
    let max = -1;
    for (const i of idxs) {
      const v = arr[i];
      if (typeof v === "number" && v > max) max = v;
    }
    if (max > (best?.value ?? -1)) best = { label, value: max };
  }
  if (!best || best.value < 0) return null;

  const { label, tip } = describePollenLevel(best.value);
  return { dominant: best.label, value: Math.round(best.value), label, tip };
}
