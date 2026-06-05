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

// ── Wind ─────────────────────────────────────────────────────────────

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

// ── Core weather display ──────────────────────────────────────────────

export function getWeatherInfo(code: number, precipSum?: number): { emoji: string; label: string } {
  if (code === 80 && precipSum !== undefined && precipSum < 0.5) return { emoji: "☁️", label: "Overcast" };
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
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split("T")[0];
  if (dateStr === todayStr) return "Today";
  if (dateStr === tomorrowStr) return "Tomorrow";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
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

// ── Hourly weather emoji and animation (considers precip probability) ─

/** Weather info for an hourly forecast slot — overrides clear/cloudy emoji
 *  when precipitation probability is high AND there's expected amount. */
export function getHourWeatherInfo(code: number, precipProb: number, precip: number): { emoji: string; label: string } {
  if ((code <= 3) && precipProb >= 60 && precip > 0) {
    return precipProb >= 85
      ? { emoji: "🌧️", label: "Rain" }
      : { emoji: "🌦️", label: "Rain Likely" };
  }
  if ((code <= 3) && precipProb >= 85 && precip === 0) {
    return { emoji: "🌦️", label: "Possible Rain" };
  }
  return getWeatherInfo(code);
}

/** Animation class for an hourly slot — same precip override. */
export function getHourAnimClass(code: number, precipProb: number, precip: number): string {
  if ((code <= 3) && precipProb >= 60 && precip > 0) {
    return precipProb >= 85 ? "weather-rainy weather-heavy" : "weather-drizzle";
  }
  if ((code <= 3) && precipProb >= 85 && precip === 0) {
    return "weather-drizzle";
  }
  return getWeatherAnimClass(code);
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
