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
  admin1?: string;
  population?: number;
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

export function buildForecastUrl(lat: number, lon: number): string {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset&forecast_days=7&timezone=auto`;
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
        admin1?: string;
        population?: number;
      }[]
    ).map((r) => ({
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country ?? "",
      admin1: r.admin1,
      population: r.population,
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
  if (code >= 51 && code <= 57) return { emoji: "🌦️", label: "Drizzle" };
  if (code >= 61 && code <= 67) return { emoji: "🌧️", label: "Rain" };
  if (code >= 71 && code <= 77) return { emoji: "❄️", label: "Snow" };
  if (code >= 80 && code <= 82) return { emoji: "🌦️", label: "Rain Showers" };
  if (code >= 95) return { emoji: "⛈️", label: "Thunderstorm" };
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

export function buildHourlyForecastUrl(lat: number, lon: number): string {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,wind_speed_10m,uv_index,weather_code&timezone=auto&forecast_days=6`;
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
}

export interface OutdoorWindow {
  timeLabel: string;
  rating: "Excellent" | "Good" | "Fair" | "Poor";
  conditions: string;
  isBad: boolean;
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
  if (precipProb >= 70 || windSpeed > 55 || temp < 0 || temp > 40) return 0;
  if (precipProb >= 40 || windSpeed > 35 || temp < 6 || temp > 33) return 1;
  if (temp >= 13 && temp <= 27 && precipProb < 15 && windSpeed < 22) return 3;
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
      };
    });

  function findRuns(pred: (s: number) => boolean): { start: number; end: number }[] {
    const runs: { start: number; end: number }[] = [];
    let start = -1;
    hours.forEach((h, idx) => {
      if (pred(h.score)) {
        if (start === -1) start = idx;
      } else if (start !== -1) {
        if (idx - start >= 2) runs.push({ start, end: idx - 1 });
        start = -1;
      }
    });
    if (start !== -1 && hours.length - start >= 2) runs.push({ start, end: hours.length - 1 });
    return runs;
  }

  function suggestActivities(avgTemp: number, maxPrecip: number, avgWind: number): string[] {
    const acts: string[] = [];
    if (maxPrecip < 10 && avgTemp >= 12) acts.push("Running");
    if (maxPrecip < 15 && avgWind < 20 && avgTemp >= 10 && avgTemp <= 28) acts.push("Cycling");
    if (maxPrecip < 5 && avgTemp >= 18 && avgWind < 15) acts.push("Picnic");
    if (maxPrecip < 20 && avgTemp >= 6) acts.push("Walking");
    if (avgTemp >= 23 && maxPrecip < 5) acts.push("Beach");
    if (acts.length === 0) acts.push("Light stroll");
    return acts.slice(0, 3);
  }

  function runToWindow(run: { start: number; end: number }, isBad: boolean): OutdoorWindow {
    const slice = hours.slice(run.start, run.end + 1);
    const avgTemp = Math.round(slice.reduce((s, h) => s + h.temp, 0) / slice.length);
    const avgScore = slice.reduce((s, h) => s + h.score, 0) / slice.length;
    const maxPrecip = Math.max(...slice.map((h) => h.precipProb));
    const avgWind = Math.round(slice.reduce((s, h) => s + h.windSpeed, 0) / slice.length);
    const minTemp = Math.min(...slice.map((h) => h.temp));
    const maxTemp = Math.max(...slice.map((h) => h.temp));

    const peakIdx = slice.reduce(
      (best, h, i) => (h.score > slice[best].score ? i : best),
      0,
    );
    const peakHour = slice[peakIdx]?.label;

    const rating: OutdoorWindow["rating"] = isBad
      ? "Poor"
      : avgScore >= 2.7
        ? "Excellent"
        : avgScore >= 2.3
          ? "Good"
          : "Fair";
    const conditions = [
      `avg ${avgTemp}°C`,
      maxPrecip < 15 ? "dry" : `${maxPrecip}% rain chance`,
      avgWind < 15 ? "calm" : avgWind < 28 ? "light breeze" : `${avgWind} km/h wind`,
    ].join(", ");
    return {
      timeLabel: `${hours[run.start]?.label ?? ""} – ${hours[run.end]?.label ?? ""}`,
      rating,
      conditions,
      isBad,
      peakHour,
      tempRange: `${minTemp}–${maxTemp}°C`,
      activities: isBad ? [] : suggestActivities(avgTemp, maxPrecip, avgWind),
    };
  }

  const bestWindows = findRuns((s) => s >= 2)
    .sort(
      (a, b) =>
        hours.slice(b.start, b.end + 1).reduce((s, h) => s + h.score, 0) -
        hours.slice(a.start, a.end + 1).reduce((s, h) => s + h.score, 0),
    )
    .slice(0, 2)
    .sort((a, b) => a.start - b.start)
    .map((r) => runToWindow(r, false));

  const badWindows = findRuns((s) => s === 0)
    .sort((a, b) => b.end - b.start - (a.end - a.start))
    .slice(0, 1)
    .map((r) => runToWindow(r, true));

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
  if (bestWindows.length === 0 && badWindows.length > 0) {
    return `Stay in during ${badWindows[0].timeLabel} — conditions are poor. Limited outdoor opportunities today.`;
  }
  if (bestWindows.length === 0) {
    return "No standout outdoor windows today, but conditions are broadly reasonable.";
  }
  const best = bestWindows[0];
  const acts =
    best.activities && best.activities.length > 0
      ? best.activities.slice(0, 2).join(" or ").toLowerCase()
      : "outdoor activity";
  if (best.rating === "Excellent")
    return `Excellent conditions — ideal for ${acts} between ${best.timeLabel}${best.tempRange ? ` (${best.tempRange})` : ""}.`;
  if (best.rating === "Good")
    return `Good window for ${acts}: ${best.timeLabel}${best.tempRange ? ` at ${best.tempRange}` : ""}.`;
  return `Decent conditions around ${best.timeLabel} for ${acts}.`;
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
  if (code === 0) return "weather-sunny weather-sunny-glow";
  if (code === 1 || code === 2) return "weather-cloudy";
  if (code === 3) return "weather-cloudy";
  if (code === 45 || code === 48) return "weather-foggy";
  if (code >= 95) return "weather-thunder";
  if (code >= 71 && code <= 77) return "weather-snowy";
  if (code >= 51 && code <= 82) return "weather-rainy";
  return "weather-cloudy";
}

// ── Fun weather facts ─────────────────────────────────────────────────

export function getWeatherFact(code: number, temp: number): string {
  if (code >= 95)
    return "Lightning strikes Earth ~100 times every second — about 8 million bolts a day.";
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
