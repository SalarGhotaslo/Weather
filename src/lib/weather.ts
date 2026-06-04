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
    weather_code: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
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

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode?: string;  // ISO 3166-1 alpha-2
  admin1?: string;
  population?: number;
  timezone?: string;     // IANA timezone e.g. "Europe/London"
}

// Convert ISO 3166-1 alpha-2 code to flag emoji (e.g. "GB" → "🇬🇧")
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const OFFSET = 0x1f1e6 - 65; // 'A' is 65
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + OFFSET))
    .join("");
}

// Explain why feels-like differs from actual temperature
export function getFeelsLikeExplanation(
  actual: number,
  feelsLike: number,
  humidity: number,
  windSpeed: number,
): string {
  const diff = Math.round(feelsLike - actual);
  if (Math.abs(diff) < 1) return "Same as actual temperature";
  if (diff < -1 && windSpeed >= 20) return `Wind chill makes it feel ${Math.abs(diff)}° colder`;
  if (diff < -1) return `Feels ${Math.abs(diff)}° cooler than the thermometer`;
  if (diff > 1 && humidity >= 65) return `Humidity makes it feel ${diff}° warmer`;
  if (diff > 1) return `Feels ${diff}° warmer than the thermometer`;
  return "";
}

// ── Local time within a city / timezone ──────────────────────────────
//
// Server-safe: relies only on Intl, so it produces the same value during SSR
// and on the client. Live second-by-second updates are handled by the
// `LocalTime` client component; these helpers give a correct snapshot.

/** Current hour (0–23) in the given IANA timezone. Falls back to the host hour. */
export function getCityHour(timezone?: string, now: Date = new Date()): number {
  if (!timezone) return now.getHours();
  try {
    const hour = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(now);
    const parsed = parseInt(hour, 10);
    return isNaN(parsed) ? now.getHours() : parsed;
  } catch {
    return now.getHours();
  }
}

/** Formatted local time string (e.g. "14:32") for the given timezone. */
export function formatCityTime(timezone?: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);
  }
}

/**
 * Is the given hour during night (before sunrise or at/after sunset)?
 * Sunrise/sunset are passed as 0–23 hour integers.
 */
export function isNightHour(hour: number, sunriseHour: number, sunsetHour: number): boolean {
  return hour < sunriseHour || hour >= sunsetHour;
}

/** Human label for a time of day, used in "right now" copy. */
export function getTimeOfDayLabel(hour: number): string {
  if (hour < 5) return "Night";
  if (hour < 8) return "Early morning";
  if (hour < 12) return "Morning";
  if (hour < 14) return "Midday";
  if (hour < 17) return "Afternoon";
  if (hour < 20) return "Evening";
  if (hour < 23) return "Night";
  return "Night";
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

export function buildForecastUrl(lat: number, lon: number, timezone?: string): string {
  const tz = timezone ? `&timezone=${encodeURIComponent(timezone)}` : "&timezone=auto";
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset&forecast_days=7${tz}`;
}

export function getWindDirection(degrees: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
  return dirs[Math.round(((degrees % 360) + 360) % 360 / 45) % 8];
}

export function getWindArrow(degrees: number): string {
  const arrows: Record<string, string> = {
    N: "↑", NE: "↗", E: "→", SE: "↘", S: "↓", SW: "↙", W: "←", NW: "↖",
  };
  return arrows[getWindDirection(degrees)] ?? "→";
}

// Pure function — picks the best result from a geocoding response given an
// optional country hint. Extracted so it can be unit-tested without network calls.
export function findBestGeoMatch(
  results: GeocodingResult[],
  countryHint: string | null,
): GeocodingResult | null {
  if (!results.length) return null;

  const byPopulation = (a: GeocodingResult, b: GeocodingResult) =>
    (b.population ?? 0) - (a.population ?? 0);

  if (!countryHint) {
    // No hint — prefer the most populated result; the geocoding API doesn't
    // guarantee population order so "Manchester UK" could rank below
    // "Manchester NH" purely on string relevance.
    return [...results].sort(byPopulation)[0] ?? results[0];
  }

  const hint = countryHint.toLowerCase();
  const countryMatches = results.filter((r) => {
    const c = (r.country ?? "").toLowerCase();
    return c === hint || c.includes(hint) || hint.includes(c);
  });

  if (!countryMatches.length) return results[0]; // no country match — fall back to top result
  return [...countryMatches].sort(byPopulation)[0] ?? countryMatches[0];
}

export async function geocodeLocation(
  name: string,
): Promise<GeocodingResult | null> {
  // The geocoding API only understands city names — compound strings like
  // "La Paz, Bolivia" or "London, Greater London, UK" return 0 results.
  // Strategy: extract just the city name, fetch more candidates, then use
  // findBestGeoMatch to pick the right country.
  const parts = name.split(",").map((s) => s.trim());
  const cityName = parts[0];
  const countryHint = parts.length > 1 ? parts[parts.length - 1] : null;

  // Always fetch 10 candidates so findBestGeoMatch can rank by population.
  // With count=1 we'd blindly take the first string-relevance result, which
  // can return the wrong Manchester or the wrong Rio.
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=10&language=en&format=json`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results?.length) return null;

    const results: GeocodingResult[] = (
      data.results as {
        name: string;
        latitude: number;
        longitude: number;
        country?: string;
        country_code?: string;
        admin1?: string;
        population?: number;
        timezone?: string;
      }[]
    ).map((r) => ({
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country ?? "",
      countryCode: r.country_code,
      admin1: r.admin1,
      population: r.population,
      timezone: r.timezone,
    }));

    return findBestGeoMatch(results, countryHint);
  } catch {
    return null;
  }
}

export function getWeatherInfo(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: "☀️", label: "Clear Sky" };
  if (code === 1 || code === 2) return { emoji: "⛅", label: "Partly Cloudy" };
  if (code === 3) return { emoji: "☁️", label: "Overcast" };
  if (code === 45 || code === 48) return { emoji: "🌫️", label: "Foggy" };
  if (code >= 51 && code <= 53) return { emoji: "🌦️", label: "Light Drizzle" };
  if (code >= 55 && code <= 57) return { emoji: "🌧️", label: "Dense Drizzle" };
  if (code === 61 || code === 63) return { emoji: "🌦️", label: "Light Rain" };
  if (code === 65 || code === 66) return { emoji: "🌧️", label: "Rain" };
  if (code === 67) return { emoji: "🌧️", label: "Heavy Rain" };
  if (code >= 71 && code <= 73) return { emoji: "🌨️", label: "Light Snow" };
  if (code === 75 || code === 77) return { emoji: "❄️", label: "Snow" };
  if (code >= 80 && code <= 82) return { emoji: "🌦️", label: "Rain Showers" };
  if (code >= 85 && code <= 86) return { emoji: "🌨️", label: "Snow Showers" };
  if (code === 95) return { emoji: "⛈️", label: "Thunderstorm" };
  if (code >= 96) return { emoji: "🌩️", label: "Thunderstorm with Hail" };
  return { emoji: "🌤️", label: "Fair" };
}

export function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return date.toLocaleDateString("en-GB", { weekday: "long" });
}

export function getFormattedDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

function getUVLabel(uv: number): string {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

export function getWeatherRating(
  code: number,
  tempMax: number,
): { rating: string; suggestion: string } {
  if (code >= 95) return { rating: "🌩️ Poor", suggestion: "Stay indoors" };
  if (code >= 71) return { rating: "❄️ Chilly", suggestion: "Wrap up warm" };
  if (code >= 61) return { rating: "🌧️ Wet", suggestion: "Bring an umbrella" };
  if (code >= 51) return { rating: "🌦️ Drizzly", suggestion: "Light jacket recommended" };
  if (code === 45 || code === 48) return { rating: "🌫️ Hazy", suggestion: "Drive carefully" };
  if (code <= 2 && tempMax >= 20) return { rating: "☀️ Excellent", suggestion: "Great day for a walk" };
  if (code <= 2 && tempMax >= 15) return { rating: "🌤️ Good", suggestion: "Nice day to be outside" };
  if (code === 3) return { rating: "☁️ Gloomy", suggestion: "Mood lighting day" };
  return { rating: "🌤️ Fair", suggestion: "Decent enough" };
}

export function describeUV(uv: number): { label: string; tip: string } {
  const label = getUVLabel(uv);
  const tip =
    uv <= 2
      ? "No protection needed"
      : uv <= 5
        ? "Sunscreen recommended"
        : uv <= 7
          ? "Sunscreen essential, seek shade at midday"
          : "Avoid sun exposure, stay indoors";
  return { label, tip };
}

export function tempDiffDescription(
  forecastTemp: number,
  historicalTemp: number | null,
): string {
  if (historicalTemp === null) return "No historical data available";
  const diff = Math.round(forecastTemp - historicalTemp);
  if (diff === 0) return "Same as last year";
  if (diff > 0) return `${diff}° warmer than last year`;
  return `${Math.abs(diff)}° cooler than last year`;
}

// ── Hourly forecast & outdoor-time analysis ──────────────────────────────────

export interface HourlyEntry {
  hour: number;
  label: string;
  temp: number;
  precipProb: number;
  windSpeed: number;
  weatherCode: number;
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
        windSpeed: Math.round(hourly.wind_speed_10m[i] ?? 0),
        weatherCode: hourly.weather_code[i] ?? 0,
      };
    });
}

export function buildHourlyForecastUrl(lat: number, lon: number, timezone?: string): string {
  const tz = timezone ? `&timezone=${encodeURIComponent(timezone)}` : "&timezone=auto";
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,wind_speed_10m,uv_index,weather_code${tz}&forecast_days=6`;
}

export interface HourlyForecastResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
    uv_index: number[];
    weather_code: number[];
  };
}

export interface HourData {
  hour: number;
  label: string;
  temp: number;
  precipProb: number;
  windSpeed: number;
  score: number; // -1=night  0=bad  1=poor  2=good  3=excellent
  active: boolean; // within typical waking/social hours (see ACTIVE_START/END)
}

// Best- and worst-time windows are detected only within the hours people
// realistically want to be outside — a 6am–10pm waking window. The night score
// (-1) still trims any dark hours inside that range (e.g. pre-sunrise winter).
export const ACTIVE_START = 6; // 6am, inclusive
export const ACTIVE_END = 22; // 10pm, exclusive

export interface OutdoorWindow {
  timeLabel: string;
  rating: "Excellent" | "Good" | "Fair" | "Poor";
  conditions: string;
  reason: string;
  isBad: boolean;
  severity?: "worst" | "bad";
  peakHour?: string;
  tempRange?: string;
  activities?: string[];
}

export function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}

export function scoreHour(
  temp: number,
  precipProb: number,
  windSpeed: number,
  isNight: boolean,
): number {
  if (isNight) return -1;
  if (precipProb >= 85 || windSpeed > 60 || temp < -5 || temp > 42) return 0;
  if (precipProb >= 60 || windSpeed > 45 || temp < 2 || temp > 36) return 1;
  if (precipProb >= 35 || windSpeed > 30 || temp < 8 || temp > 30) return 2;
  if (temp >= 14 && temp <= 26 && precipProb < 10 && windSpeed < 18) return 4;
  if (temp >= 11 && temp <= 29 && precipProb < 20 && windSpeed < 25) return 3;
  return 2;
}

export function getHourlyAnalysis(
  hourly: HourlyForecastResponse["hourly"],
  dateStr: string,
  sunriseISO: string,
  sunsetISO: string,
): { hours: HourData[]; bestWindows: OutdoorWindow[]; badWindows: OutdoorWindow[] } {
  const sunriseHour = parseInt(sunriseISO.split("T")[1]?.split(":")[0] ?? "6", 10);
  const sunsetHour = parseInt(sunsetISO.split("T")[1]?.split(":")[0] ?? "20", 10);

  const hours: HourData[] = hourly.time
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.startsWith(dateStr))
    .map(({ t, i }) => {
      const hour = parseInt(t.split("T")[1]?.split(":")[0] ?? "0", 10);
      const isNight = hour < sunriseHour || hour >= sunsetHour;
      return {
        hour,
        label: formatHour(hour),
        temp: Math.round(hourly.temperature_2m[i] ?? 0),
        precipProb: hourly.precipitation_probability[i] ?? 0,
        windSpeed: Math.round(hourly.wind_speed_10m[i] ?? 0),
        score: scoreHour(
          hourly.temperature_2m[i] ?? 0,
          hourly.precipitation_probability[i] ?? 0,
          hourly.wind_speed_10m[i] ?? 0,
          isNight,
        ),
        active: hour >= ACTIVE_START && hour < ACTIVE_END,
      };
    });

  function findRuns(pred: (h: HourData) => boolean, minLen = 2): { start: number; end: number }[] {
    const runs: { start: number; end: number }[] = [];
    let start = -1;
    hours.forEach((h, idx) => {
      if (pred(h)) {
        if (start === -1) start = idx;
      } else if (start !== -1) {
        if (idx - start >= minLen) runs.push({ start, end: idx - 1 });
        start = -1;
      }
    });
    if (start !== -1 && hours.length - start >= minLen) runs.push({ start, end: hours.length - 1 });
    return runs;
  }

  function suggestActivities(avgTemp: number, maxPrecip: number, avgWind: number): string[] {
    const acts: string[] = [];
    if (maxPrecip < 5 && avgTemp >= 20 && avgWind < 15) acts.push("Picnic");
    if (maxPrecip < 10 && avgTemp >= 12 && avgWind < 22) acts.push("Running");
    if (maxPrecip < 15 && avgWind < 20 && avgTemp >= 10 && avgTemp <= 28) acts.push("Cycling");
    if (maxPrecip < 10 && avgTemp >= 23 && avgWind < 18) acts.push("Swimming");
    if (maxPrecip < 20 && avgTemp >= 6 && avgWind < 30) acts.push("Walking");
    if (avgTemp >= 23 && maxPrecip < 5 && avgWind < 15) acts.push("Beach");
    if (maxPrecip < 10 && (avgTemp >= 15 && avgTemp <= 22)) acts.push("Coffee outside");
    if (maxPrecip < 5 && avgTemp >= 8 && avgTemp <= 14) acts.push("Leaf peeping");
    if (maxPrecip < 5 && avgTemp < 8 && avgTemp >= 0) acts.push("Winter walk");
    if (acts.length === 0) acts.push("Light stroll");
    return acts.slice(0, 3);
  }

  function buildReason(
    avgTemp: number,
    avgPrecip: number,
    maxPrecip: number,
    avgWind: number,
    maxWind: number,
    minTemp: number,
    maxTemp: number,
    isBad: boolean,
    rating: OutdoorWindow["rating"],
    precipTrend: "clearing" | "worsening" | "steady",
  ): string {
    if (isBad) {
      const parts: string[] = [];
      if (maxPrecip >= 80) parts.push(`torrential rain (up to ${maxPrecip}%)`);
      else if (avgPrecip >= 65) parts.push(`persistent heavy rain (avg ${avgPrecip}%)`);
      else if (avgPrecip >= 50) parts.push(`rain throughout (${avgPrecip}% avg)`);
      else if (maxPrecip >= 60) parts.push(`frequent heavy showers (peaks at ${maxPrecip}%)`);
      else if (avgPrecip >= 40) parts.push(`drizzly conditions (${avgPrecip}% avg)`);
      if (maxWind > 60) parts.push(`dangerous gusts (${maxWind} km/h)`);
      else if (avgWind > 45) parts.push(`strong, blustery winds (avg ${avgWind} km/h)`);
      else if (maxWind > 40) parts.push(`gusty winds (up to ${maxWind} km/h)`);
      else if (avgWind > 30) parts.push(`brisk wind (avg ${avgWind} km/h)`);
      if (minTemp < 0) parts.push(`freezing cold (${minTemp}°C)`);
      else if (minTemp < 3) parts.push(`near-freezing (${minTemp}°C)`);
      else if (maxTemp > 38) parts.push(`dangerous heat (${maxTemp}°C)`);
      else if (maxTemp > 33) parts.push(`very hot (${maxTemp}°C)`);
      if (precipTrend === "worsening") parts.push("conditions expected to deteriorate");
      else if (precipTrend === "clearing") parts.push("rain easing off toward the end");
      if (parts.length === 0) parts.push("poor all-around conditions");
      const s = parts.slice(0, 2).join("; ");
      return s.charAt(0).toUpperCase() + s.slice(1);
    }

    const bits: string[] = [];
    if (avgTemp >= 24 && avgTemp <= 28) bits.push("warm and pleasant");
    else if (avgTemp >= 20 && avgTemp <= 23) bits.push("pleasantly warm");
    else if (avgTemp >= 17 && avgTemp <= 19) bits.push("mild and comfortable");
    else if (avgTemp >= 13 && avgTemp <= 16) bits.push("cool and fresh");
    else if (avgTemp >= 10 && avgTemp <= 12) bits.push("crisp");
    else if (avgTemp > 28) bits.push("hot");
    else if (avgTemp >= 6 && avgTemp < 10) bits.push("chilly");

    if (maxPrecip < 5) bits.push("completely dry");
    else if (avgPrecip < 10) bits.push("mostly dry");
    else if (avgPrecip < 20) bits.push("low rain risk");
    else if (avgPrecip < 35) bits.push("some rain risk");
    else if (avgPrecip < 55) bits.push(`a fair chance of rain (${avgPrecip}%)`);
    else bits.push(`rain likely (${avgPrecip}%)`);

    if (avgWind < 10) bits.push("calm");
    else if (avgWind < 18) bits.push("light breeze");
    else if (avgWind < 25) bits.push("gentle breeze");
    else if (avgWind < 35) bits.push("breezy");
    else bits.push(`windy (${avgWind} km/h)`);

    if (bits.length === 0) return "Conditions are acceptable for outdoor time";
    const joined = bits.join(", ");
    const cap = joined.charAt(0).toUpperCase() + joined.slice(1);
    if (rating === "Excellent") return `${cap} — ideal conditions for getting outside`;
    if (rating === "Good") return `${cap} — a solid outdoor window`;
    return `${cap} conditions`;
  }

  function computePrecipTrend(slice: HourData[]): "clearing" | "worsening" | "steady" {
    if (slice.length < 3) return "steady";
    const firstHalf = slice.slice(0, Math.ceil(slice.length / 2));
    const secondHalf = slice.slice(Math.floor(slice.length / 2));
    const firstAvg = firstHalf.reduce((s, h) => s + h.precipProb, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, h) => s + h.precipProb, 0) / secondHalf.length;
    if (secondAvg < firstAvg - 15) return "clearing";
    if (secondAvg > firstAvg + 15) return "worsening";
    return "steady";
  }

  function runToWindow(
    run: { start: number; end: number },
    isBad: boolean,
    severity?: "worst" | "bad",
  ): OutdoorWindow {
    const slice = hours.slice(run.start, run.end + 1);
    const avgTemp = Math.round(slice.reduce((s, h) => s + h.temp, 0) / slice.length);
    const avgScore = slice.reduce((s, h) => s + h.score, 0) / slice.length;
    const minPrecip = Math.min(...slice.map((h) => h.precipProb));
    const maxPrecip = Math.max(...slice.map((h) => h.precipProb));
    const avgPrecip = Math.round(slice.reduce((s, h) => s + h.precipProb, 0) / slice.length);
    const avgWind = Math.round(slice.reduce((s, h) => s + h.windSpeed, 0) / slice.length);
    const maxWind = Math.max(...slice.map((h) => h.windSpeed));
    const minTemp = Math.min(...slice.map((h) => h.temp));
    const maxTemp = Math.max(...slice.map((h) => h.temp));

    const peakIdx = slice.reduce(
      (best, h, i) => (h.score > slice[best].score ? i : best),
      0,
    );
    const peakHour = slice[peakIdx]?.label;

    // Honest about marginal windows: a stretch that only ever reaches "Good"
    // (score 2 — e.g. 30–50% rain risk) is Fair, not Good, so a wet day's
    // least-bad slot isn't oversold.
    const rating: OutdoorWindow["rating"] = isBad
      ? "Poor"
      : avgScore >= 3.3
        ? "Excellent"
        : avgScore >= 2.3
          ? "Good"
          : avgScore >= 1.3
            ? "Fair"
            : "Poor";

    // Use avg precip (not max) so a single heavy-rain hour doesn't inflate the description.
    // Show a range when there's significant spread across the window.
    const precipSpread = maxPrecip - minPrecip;
    const precipDesc =
      avgPrecip < 10
        ? "dry"
        : precipSpread > 35
          ? `${minPrecip}–${maxPrecip}% rain`
          : `${avgPrecip}% rain chance`;

    const windDesc =
      avgWind < 12 ? "calm" : avgWind < 22 ? "light breeze" : avgWind < 35 ? "moderate wind" : `${avgWind} km/h wind`;

    const conditions = [`avg ${avgTemp}°C`, precipDesc, windDesc].join(", ");

    const precipTrend = computePrecipTrend(slice);
    const reason = buildReason(avgTemp, avgPrecip, maxPrecip, avgWind, maxWind, minTemp, maxTemp, isBad, rating, precipTrend);

    return {
      timeLabel: `${hours[run.start]?.label ?? ""} – ${hours[run.end]?.label ?? ""}`,
      rating,
      conditions,
      reason,
      isBad,
      severity,
      peakHour,
      tempRange: `${minTemp}–${maxTemp}°C`,
      activities: isBad ? [] : suggestActivities(avgTemp, maxPrecip, avgWind),
    };
  }

  const runStats = (r: { start: number; end: number }) => {
    const slice = hours.slice(r.start, r.end + 1);
    return {
      score: slice.reduce((s, h) => s + h.score, 0),
      precip: slice.reduce((s, h) => s + h.precipProb, 0),
      wind: slice.reduce((s, h) => s + h.windSpeed, 0),
    };
  };

  // Best windows — only ever within active social hours. A window counts as a
  // good time to be out if every hour is at least "Good" (score ≥ 2); we do NOT
  // require every hour to be pristine. Requiring ≥ 3 used to collapse a long,
  // comfortable afternoon (e.g. 25% rain risk) down to a single slightly-better
  // evening hour. We only relax to "Poor" (≥ 1) when nothing better exists, so a
  // rough day still surfaces its least-bad options instead of reporting nothing.
  let bestRuns = findRuns((h) => h.active && h.score >= 2);
  if (bestRuns.length === 0) bestRuns = findRuns((h) => h.active && h.score >= 1);

  const bestWindows = bestRuns
    // Rank best-first: total quality (so a long pleasant stretch beats a brief
    // perfect one), then drier, then calmer, then earlier. The drier tiebreak
    // matters when two windows score equally — e.g. a damp 6am vs a clearing
    // 7pm both rate "Fair", but the evening is the better shout.
    .map((r) => ({ r, st: runStats(r) }))
    .sort(
      (a, b) =>
        b.st.score - a.st.score ||
        a.st.precip - b.st.precip ||
        a.st.wind - b.st.wind ||
        a.r.start - b.r.start,
    )
    .slice(0, 3)
    .map(({ r }) => runToWindow(r, false));

  // Worst windows — genuinely bad stretches (score 0) inside active hours.
  // Two consecutive bad hours is enough to flag once we're already confined to
  // the part of the day people actually go out in.
  const badWindows = findRuns((h) => h.active && h.score === 0)
    .sort((a, b) => b.end - b.start - (a.end - a.start))
    .slice(0, 2)
    .map((r, i) => runToWindow(r, true, i === 0 ? "worst" : "bad"));

  return { hours, bestWindows, badWindows };
}

// ── Numeric weather score (used for best-day ranking) ────────────────

export function getWeatherScore(weatherCode: number, tempMax: number): number {
  const rating = getWeatherRating(weatherCode, tempMax).rating;
  if (rating.includes("Excellent")) return 4;
  if (rating.includes("Good")) return 3;
  if (rating.includes("Fair") || rating.includes("Gloomy")) return 2;
  if (rating.includes("Drizzly") || rating.includes("Chilly")) return 1;
  return 0;
}

// ── Daylight info ─────────────────────────────────────────────────────

export interface DaylightInfo {
  hours: number;
  minutes: number;
  risePercent: number;   // 0-100: sunrise position on a 24-h bar
  lightPercent: number;  // 0-100: width of daylight band on a 24-h bar
}

export function getDaylightInfo(sunriseISO: string, sunsetISO: string): DaylightInfo {
  const parseHM = (iso: string) => {
    const [h, m] = (iso.split("T")[1] ?? "00:00").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const riseTotal = parseHM(sunriseISO);
  const setTotal = parseHM(sunsetISO);
  const duration = Math.max(setTotal - riseTotal, 0);
  return {
    hours: Math.floor(duration / 60),
    minutes: duration % 60,
    risePercent: (riseTotal / 1440) * 100,
    lightPercent: (duration / 1440) * 100,
  };
}

// ── Outdoor window summary sentence ─────────────────────────────────

export function getOutdoorSummary(
  bestWindows: OutdoorWindow[],
  badWindows: OutdoorWindow[],
): string {
  const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

  if (bestWindows.length === 0 && badWindows.length > 0) {
    const why = badWindows[0].reason ?? "conditions are poor";
    return `Tricky day for outdoor plans — ${lc(why)}. Avoid ${badWindows[0].timeLabel} especially.`;
  }
  if (bestWindows.length === 0) {
    return `No standout outdoor windows between ${formatHour(ACTIVE_START)} and ${formatHour(ACTIVE_END)} today, but conditions are broadly reasonable.`;
  }

  const best = bestWindows[0];
  const acts =
    best.activities && best.activities.length > 0
      ? best.activities.slice(0, 2).join(" or ").toLowerCase()
      : "outdoor activity";

  // When even the best stretch is only Fair/Poor it's a rough day — say so and
  // frame the window as the least-bad option rather than a positive pick.
  const isToughDay = best.rating === "Fair" || best.rating === "Poor";

  let summary: string;
  if (best.rating === "Excellent")
    summary = `Excellent: ${best.timeLabel}. ${best.reason ?? "Great conditions"}. Perfect for ${acts}.`;
  else if (best.rating === "Good")
    summary = `Good window for ${acts}: ${best.timeLabel}. ${best.reason ?? "Decent conditions"}.`;
  else
    summary = `A rough day to be outside — your best bet is ${best.timeLabel}${best.reason ? `: ${lc(best.reason)}` : ""}. Indoors is the safer call.`;

  // Point to the other options so the reader sees more than one choice — but
  // only when the day is actually good; on a tough day extra "options" mislead.
  if (!isToughDay && bestWindows.length > 1) {
    const others = bestWindows.slice(1, 3).map((w) => w.timeLabel).join(" and ");
    summary += ` Also worth a look: ${others}.`;
  }

  // Always name the worst stretch to steer clear of, when there is one.
  if (badWindows.length > 0) {
    summary += ` Steer clear of ${badWindows[0].timeLabel}.`;
  }

  return summary;
}

// ── Weather alert banner ─────────────────────────────────────────────

export interface WeatherAlert {
  level: "warning" | "advisory";
  title: string;
  message: string;
}

export function getWeatherAlert(
  weatherCode: number,
  windSpeedMax: number,
  uvIndexMax: number,
  precipSum: number,
): WeatherAlert | null {
  if (weatherCode >= 95)
    return {
      level: "warning",
      title: "Thunderstorm Warning",
      message:
        "Severe thunderstorm conditions expected. Stay indoors and away from windows and tall trees.",
    };
  if (weatherCode >= 85 && weatherCode <= 86 && precipSum > 5)
    return {
      level: "advisory",
      title: "Snow Showers Advisory",
      message:
        "Snow showers expected. Brief bursts of snow may create slippery surfaces — take care if travelling.",
    };
  if (weatherCode >= 71 && weatherCode <= 77 && precipSum > 10)
    return {
      level: "warning",
      title: "Heavy Snow Warning",
      message:
        "Significant snowfall forecast. Travel may be severely disrupted — check before setting out.",
    };
  if (windSpeedMax > 65)
    return {
      level: "warning",
      title: "High Wind Warning",
      message: `Wind gusts of up to ${Math.round(windSpeedMax)} km/h expected. Secure loose outdoor items and avoid exposed areas.`,
    };
  if (weatherCode >= 61 && weatherCode <= 67 && precipSum > 25)
    return {
      level: "advisory",
      title: "Heavy Rain Advisory",
      message: `${Math.round(precipSum)} mm of rain forecast. There is a risk of localised surface flooding — avoid low-lying areas.`,
    };
  if (uvIndexMax >= 8)
    return {
      level: "advisory",
      title: "High UV Advisory",
      message: `UV index of ${Math.round(uvIndexMax)} (${uvIndexMax >= 11 ? "Extreme" : "Very High"}). Apply SPF 30+ sunscreen, wear a hat, and seek shade between 11am–3pm.`,
    };
  return null;
}

// ── Dress-for-the-weather suggestion ─────────────────────────────────

export interface DressCode {
  summary: string;
  items: string[];
}

export function getDressCode(
  weatherCode: number,
  tempMax: number,
  windSpeedMax: number,
): DressCode {
  const items: string[] = [];

  if (tempMax <= 0) {
    items.push("Heavy winter coat", "Thermal underlayer", "Hat & gloves", "Warm boots");
  } else if (tempMax <= 8) {
    items.push("Warm coat", "Jumper or sweater", "Scarf", "Warm socks");
  } else if (tempMax <= 14) {
    items.push("Light jacket", "Layered clothing");
  } else if (tempMax <= 20) {
    items.push("Light jacket or cardigan");
  } else if (tempMax <= 26) {
    items.push("T-shirt or light shirt", "Light trousers");
  } else {
    items.push("Summer clothing", "Shorts or light dress");
  }

  if (weatherCode >= 51 && weatherCode <= 82) items.push("Waterproof jacket or umbrella");
  if (weatherCode >= 71 && weatherCode <= 77) items.push("Waterproof & grip footwear");
  if (weatherCode >= 85 && weatherCode <= 86) items.push("Waterproof & grip footwear");
  if (weatherCode >= 95) items.push("Shelter nearby if going out");
  if (windSpeedMax > 45) items.push("Wind-resistant outer layer");
  if (weatherCode === 0 && tempMax > 18) items.push("Sunglasses & sunscreen SPF 30+");

  const summary =
    tempMax > 22
      ? "Light summer day"
      : tempMax > 15
        ? "Comfortable with a light layer"
        : tempMax > 8
          ? "Layered-up weather"
          : "Bundle up — cold day";

  return { summary, items: items.slice(0, 5) };
}

// ── Weather emoji animation class ────────────────────────────────────

export function getWeatherAnimClass(code: number): string {
  if (code === 0) return "weather-sunny";
  if (code === 1 || code === 2) return "weather-cloudy";
  if (code === 3) return "weather-overcast";
  if (code === 45 || code === 48) return "weather-foggy";
  if (code >= 96) return "weather-thunder weather-hail";
  if (code === 95) return "weather-thunder";
  if (code >= 71 && code <= 77) return "weather-snowy";
  if (code >= 85 && code <= 86) return "weather-snowy weather-showers";
  if (code >= 64 && code <= 67) return "weather-rainy weather-heavy";
  if (code >= 55 && code <= 57) return "weather-rainy weather-heavy";
  if (code >= 80 && code <= 82) return "weather-rainy weather-showers";
  if (code >= 51 && code <= 53) return "weather-drizzle";
  if (code === 61 || code === 63) return "weather-drizzle";
  return "weather-cloudy";
}

// ── Fun weather facts ─────────────────────────────────────────────────

export function getWeatherFact(code: number, temp: number): string {
  if (code >= 95)
    return "Lightning strikes Earth ~100 times every second — about 8 million bolts a day.";
  if (code >= 85 && code <= 86)
    return "Snow showers are bursts of snow that come and go quickly — often with brief sunny breaks between them.";
  if (code >= 71 && code <= 77)
    return "No two snowflakes are identical. Each crystal forms a unique pattern as it falls through different temperature layers.";
  if (code >= 61 && code <= 67)
    return "A typical rain cloud weighs around 500,000 kg — roughly the same as 100 elephants.";
  if (code >= 51 && code <= 57)
    return "Drizzle droplets are less than 0.5 mm across. Despite their tiny size, billions can fall in a single minute.";
  if (code === 45 || code === 48)
    return "Fog is essentially a cloud at ground level. The densest fog ever recorded reduced London visibility to near zero in 1952.";
  if (temp >= 35)
    return "The hottest air temperature ever recorded was 56.7 °C (134 °F) in Death Valley, California, in July 1913.";
  if (temp <= -10)
    return "At −40 °C, Celsius and Fahrenheit read exactly the same — the only point where the two scales agree.";
  if (code === 0 && temp >= 20)
    return "Sunshine boosts serotonin production in the brain, which can lift mood and sharpen focus. Get outside!";
  if (code <= 2 && temp >= 14)
    return "Sunlight takes about 8 minutes 20 seconds to reach Earth. The light you see outside is already 8 minutes old.";
  if (code === 3)
    return "Heavy cloud cover can block up to 70–90 % of UV radiation — handy if you forgot sunscreen.";
  if (temp <= 5)
    return "Cold air holds less moisture than warm air. That's why winter air often feels crisp and dry even without frost.";
  return "Wind is caused by pressure differences — air always rushes from high-pressure areas toward low-pressure ones.";
}
