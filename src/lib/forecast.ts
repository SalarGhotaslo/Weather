export interface WeatherResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    surface_pressure: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    weather_code: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    wind_direction_10m_dominant: number[];
    uv_index_max: number[];
    sunrise: string[];
    sunset: string[];
  };
}

export interface HistoricalDay {
  temperature_2m_max: number;
  temperature_2m_min: number;
  precipitation_sum: number;
}

export interface HourlyForecastResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    wind_speed_10m: number[];
    uv_index: number[];
    weather_code: number[];
    // Only consumed by getDayAverages (Humidity/Pressure cards); optional so the
    // hourly-analysis fixtures/callers that don't need them still type-check.
    relative_humidity_2m?: number[];
    surface_pressure?: number[];
  };
}

export interface HourlyEntry {
  hour: number;
  label: string;
  temp: number;
  precipProb: number;
  precip: number;
  windSpeed: number;
  weatherCode: number;
}

export function validateCoord(
  value: string | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (!value) return fallback;
  const parsed = parseFloat(value);
  if (!isFinite(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

// Fetches the 7-day + current forecast with 30-min ISR. Shared by the home and
// day detail server components, which previously each defined this identically.
export async function fetchForecast(
  lat: number,
  lon: number,
  timezone?: string,
): Promise<WeatherResponse> {
  const res = await fetch(buildForecastUrl(lat, lon, timezone), {
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error("Failed to fetch weather data");
  return res.json();
}

export function buildForecastUrl(lat: number, lon: number, timezone?: string): string {
  const tz = timezone ? `&timezone=${encodeURIComponent(timezone)}` : "&timezone=auto";
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,uv_index_max,sunrise,sunset&forecast_days=7${tz}`;
}

export function buildHourlyForecastUrl(lat: number, lon: number, timezone?: string): string {
  const tz = timezone ? `&timezone=${encodeURIComponent(timezone)}` : "&timezone=auto";
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m,surface_pressure,uv_index,weather_code${tz}&forecast_days=7`;
}

export function getLastYearDate(dateStr: string): string {
  const date = new Date(dateStr);
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split("T")[0];
}

export function getHistoricalApiUrl(
  dateStr: string,
  lat: number,
  lon: number,
): string {
  const lastYear = getLastYearDate(dateStr);
  return `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${lastYear}&end_date=${lastYear}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
}

export function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}

export function getDayHourlyData(
  hourly: HourlyForecastResponse["hourly"],
  dateStr: string,
): HourlyEntry[] {
  return hourly.time
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.startsWith(dateStr))
    .map(({ t, i }) => {
      const hour = parseInt(t.split("T")[1]?.split(":")[0] ?? "0", 10);
      return {
        hour,
        label: formatHour(hour),
        temp: Math.round(hourly.temperature_2m[i] ?? 0),
        precipProb: hourly.precipitation_probability[i] ?? 0,
        precip: hourly.precipitation[i] ?? 0,
        windSpeed: Math.round(hourly.wind_speed_10m[i] ?? 0),
        weatherCode: hourly.weather_code[i] ?? 0,
      };
    });
}

// Daily-mean humidity + pressure for a date, derived from the hourly forecast.
// Lets future days show the same Humidity/Pressure cards as "today" (which uses
// live current conditions). Returns null fields when the series is absent.
export function getDayAverages(
  hourly: HourlyForecastResponse["hourly"],
  dateStr: string,
): { humidity: number | null; pressure: number | null } {
  const times = hourly?.time;
  if (!Array.isArray(times)) return { humidity: null, pressure: null };
  const idxs = times.reduce<number[]>((acc, t, i) => {
    if (typeof t === "string" && t.startsWith(dateStr)) acc.push(i);
    return acc;
  }, []);

  const mean = (arr: number[] | undefined): number | null => {
    if (!Array.isArray(arr)) return null;
    const vals = idxs.map((i) => arr[i]).filter((v): v is number => typeof v === "number");
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  };

  return { humidity: mean(hourly.relative_humidity_2m), pressure: mean(hourly.surface_pressure) };
}
