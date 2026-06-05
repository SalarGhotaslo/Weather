import {
  buildHourlyForecastUrl,
  getHistoricalApiUrl,
  buildAirQualityUrl,
  getDayPollen,
  getDayAqi,
  type HistoricalDay,
  type HourlyForecastResponse,
  type PollenInfo,
  type AqiInfo,
  type AirQualityResponse,
} from "@/lib/weather";

// Server-side fetch helpers for the day detail page. Kept out of page.tsx so the
// page component stays focused on orchestration + layout.

export async function getHourlyWeather(
  lat: number,
  lon: number,
  tz?: string,
): Promise<HourlyForecastResponse | null> {
  try {
    const res = await fetch(buildHourlyForecastUrl(lat, lon, tz), {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface AirQuality {
  pollen: PollenInfo | null;
  aqi: AqiInfo | null;
}

// One request to the air-quality API powers both the AQI card (global) and the
// pollen card (EU only). Returns nulls — never throws — so a failure just hides
// the optional cards.
export async function getAirQuality(
  dateStr: string,
  lat: number,
  lon: number,
  tz?: string,
): Promise<AirQuality> {
  try {
    const res = await fetch(buildAirQualityUrl(lat, lon, tz), { next: { revalidate: 1800 } });
    if (!res.ok) return { pollen: null, aqi: null };
    const data: AirQualityResponse = await res.json();
    return { pollen: getDayPollen(data, dateStr), aqi: getDayAqi(data, dateStr) };
  } catch {
    return { pollen: null, aqi: null };
  }
}

export async function getHistorical(
  dateStr: string,
  lat: number,
  lon: number,
): Promise<HistoricalDay | null> {
  try {
    const res = await fetch(getHistoricalApiUrl(dateStr, lat, lon), {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      temperature_2m_max: data.daily.temperature_2m_max[0],
      temperature_2m_min: data.daily.temperature_2m_min[0],
      precipitation_sum: data.daily.precipitation_sum[0],
    };
  } catch {
    return null;
  }
}
