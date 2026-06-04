import { describe, it, expect } from "vitest";
import {
  validateCoord,
  getDaylightInfo,
  getWeatherScore,
  countryCodeToFlag,
  getFeelsLikeExplanation,
  getWeatherInfo,
  getDayName,
  getFormattedDate,
  getLastYearDate,
  getWeatherRating,
  describeUV,
  tempDiffDescription,
  formatHour,
  scoreHour,
  getHourlyAnalysis,
  getDayHourlyData,
  findBestGeoMatch,
  getWeatherAnimClass,
  getWeatherFact,
  getWeatherAlert,
  getWindDirection,
  getWindArrow,
  getOutdoorSummary,
  getDressCode,
  type OutdoorWindow,
  type HourlyForecastResponse,
  type GeocodingResult,
} from "./weather";
import { formatPopulation, normalizeCountryName, selectCandidates } from "./countries";
import { normalizeCountryName, selectCandidates } from "./countries";

describe("getWeatherInfo", () => {
  it("returns Clear Sky for code 0", () => {
    expect(getWeatherInfo(0)).toEqual({ emoji: "☀️", label: "Clear Sky" });
  });

  it("returns Partly Cloudy for codes 1-2", () => {
    expect(getWeatherInfo(1)).toEqual({ emoji: "⛅", label: "Partly Cloudy" });
    expect(getWeatherInfo(2)).toEqual({ emoji: "⛅", label: "Partly Cloudy" });
  });

  it("returns Overcast for code 3", () => {
    expect(getWeatherInfo(3)).toEqual({ emoji: "☁️", label: "Overcast" });
  });

  it("returns Foggy for codes 45 and 48", () => {
    expect(getWeatherInfo(45)).toEqual({ emoji: "🌫️", label: "Foggy" });
    expect(getWeatherInfo(48)).toEqual({ emoji: "🌫️", label: "Foggy" });
  });

  it("returns Drizzle for codes 51-57", () => {
    expect(getWeatherInfo(51)).toEqual({ emoji: "🌦️", label: "Drizzle" });
    expect(getWeatherInfo(55)).toEqual({ emoji: "🌦️", label: "Drizzle" });
    expect(getWeatherInfo(57)).toEqual({ emoji: "🌦️", label: "Drizzle" });
  });

  it("returns Rain for codes 61-67", () => {
    expect(getWeatherInfo(61)).toEqual({ emoji: "🌧️", label: "Rain" });
    expect(getWeatherInfo(65)).toEqual({ emoji: "🌧️", label: "Rain" });
    expect(getWeatherInfo(67)).toEqual({ emoji: "🌧️", label: "Rain" });
  });

  it("returns Snow for codes 71-77", () => {
    expect(getWeatherInfo(71)).toEqual({ emoji: "❄️", label: "Snow" });
    expect(getWeatherInfo(75)).toEqual({ emoji: "❄️", label: "Snow" });
    expect(getWeatherInfo(77)).toEqual({ emoji: "❄️", label: "Snow" });
  });

  it("returns Rain Showers for codes 80-82", () => {
    expect(getWeatherInfo(80)).toEqual({ emoji: "🌦️", label: "Rain Showers" });
    expect(getWeatherInfo(82)).toEqual({ emoji: "🌦️", label: "Rain Showers" });
  });

  it("returns Thunderstorm for codes 95+", () => {
    expect(getWeatherInfo(95)).toEqual({ emoji: "⛈️", label: "Thunderstorm" });
    expect(getWeatherInfo(99)).toEqual({ emoji: "⛈️", label: "Thunderstorm" });
  });

  it("returns Fair for unknown codes", () => {
    expect(getWeatherInfo(-1)).toEqual({ emoji: "🌤️", label: "Fair" });
    expect(getWeatherInfo(58)).toEqual({ emoji: "🌤️", label: "Fair" });
    expect(getWeatherInfo(78)).toEqual({ emoji: "🌤️", label: "Fair" });
  });
});

describe("getDayName", () => {
  it("returns 'Today' for the current date", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(getDayName(today)).toBe("Today");
  });

  it("returns 'Tomorrow' for the next day", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    expect(getDayName(dateStr)).toBe("Tomorrow");
  });

  it("returns the weekday name for dates further in the future", () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const dateStr = future.toISOString().split("T")[0];
    const expected = future.toLocaleDateString("en-GB", { weekday: "long" });
    expect(getDayName(dateStr)).toBe(expected);
  });
});

describe("getFormattedDate", () => {
  it("returns a formatted date string", () => {
    const result = getFormattedDate("2026-06-15");
    expect(result).toContain("June");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });
});

describe("getLastYearDate", () => {
  it("returns the same date one year earlier", () => {
    expect(getLastYearDate("2026-06-03")).toBe("2025-06-03");
    expect(getLastYearDate("2024-02-29")).toBe("2023-03-01");
  });
});

describe("getWeatherRating", () => {
  it("rates thunderstorm as Poor", () => {
    const r = getWeatherRating(95, 20);
    expect(r.rating).toContain("Poor");
    expect(r.suggestion).toContain("indoors");
  });

  it("rates sunny and warm as Excellent", () => {
    const r = getWeatherRating(0, 22);
    expect(r.rating).toContain("Excellent");
    expect(r.suggestion).toContain("walk");
  });

  it("rates rainy day with umbrella suggestion", () => {
    const r = getWeatherRating(61, 15);
    expect(r.rating).toContain("Wet");
    expect(r.suggestion).toContain("umbrella");
  });
});

describe("describeUV", () => {
  it("returns Low for UV <= 2", () => {
    expect(describeUV(1).label).toBe("Low");
    expect(describeUV(1).tip).not.toContain("sunscreen");
  });

  it("returns Moderate for UV 3-5", () => {
    expect(describeUV(4).label).toBe("Moderate");
    expect(describeUV(4).tip).toContain("Sunscreen");
  });

  it("returns Extreme for UV > 10", () => {
    expect(describeUV(11).label).toBe("Extreme");
    expect(describeUV(11).tip).toContain("Avoid");
  });
});

describe("tempDiffDescription", () => {
  it("returns no data message when historical is null", () => {
    expect(tempDiffDescription(20, null)).toBe("No historical data available");
  });

  it("describes warmer weather", () => {
    expect(tempDiffDescription(25, 20)).toContain("warmer");
  });

  it("describes cooler weather", () => {
    expect(tempDiffDescription(15, 20)).toContain("cooler");
  });

  it("returns same when temperatures match", () => {
    expect(tempDiffDescription(20, 20)).toBe("Same as last year");
  });
});

describe("formatHour", () => {
  it("formats midnight as 12am", () => {
    expect(formatHour(0)).toBe("12am");
  });
  it("formats noon as 12pm", () => {
    expect(formatHour(12)).toBe("12pm");
  });
  it("formats morning hours with am", () => {
    expect(formatHour(9)).toBe("9am");
  });
  it("formats afternoon hours with pm", () => {
    expect(formatHour(15)).toBe("3pm");
  });
});

describe("scoreHour", () => {
  it("returns -1 for night hours", () => {
    expect(scoreHour(15, 0, 10, true)).toBe(-1);
  });
  it("returns 0 for heavy rain", () => {
    expect(scoreHour(18, 80, 10, false)).toBe(0);
  });
  it("returns 0 for extreme wind", () => {
    expect(scoreHour(18, 10, 60, false)).toBe(0);
  });
  it("returns 1 for moderate rain chance", () => {
    expect(scoreHour(18, 50, 10, false)).toBe(1);
  });
  it("returns 3 for ideal conditions", () => {
    expect(scoreHour(20, 5, 10, false)).toBe(3);
  });
  it("returns 2 for good but not ideal conditions", () => {
    expect(scoreHour(10, 10, 10, false)).toBe(2);
  });
});

describe("getHourlyAnalysis", () => {
  function makeHourly(scores: { temp: number; precip: number; wind: number }[]): HourlyForecastResponse["hourly"] {
    const date = "2026-06-04";
    return {
      time: scores.map((_, i) => `${date}T${String(i).padStart(2, "0")}:00`),
      temperature_2m: scores.map((s) => s.temp),
      precipitation_probability: scores.map((s) => s.precip),
      wind_speed_10m: scores.map((s) => s.wind),
      uv_index: scores.fill({ temp: 0, precip: 0, wind: 0 }).map(() => 3),
      weather_code: scores.map(() => 1),
    };
  }

  it("returns 24 hour entries for the given date", () => {
    const hourly = makeHourly(
      Array.from({ length: 24 }, () => ({ temp: 18, precip: 5, wind: 10 })),
    );
    const { hours } = getHourlyAnalysis(hourly, "2026-06-04", "2026-06-04T06:00", "2026-06-04T21:00");
    expect(hours).toHaveLength(24);
  });

  it("marks hours before sunrise as night (score -1)", () => {
    const hourly = makeHourly(
      Array.from({ length: 24 }, () => ({ temp: 18, precip: 5, wind: 10 })),
    );
    const { hours } = getHourlyAnalysis(hourly, "2026-06-04", "2026-06-04T06:00", "2026-06-04T21:00");
    expect(hours[0].score).toBe(-1); // midnight
    expect(hours[5].score).toBe(-1); // 5am (before 6am sunrise)
    expect(hours[6].score).toBeGreaterThanOrEqual(0); // 6am — daytime
  });

  it("returns empty arrays when no hours match the date", () => {
    const hourly = makeHourly(
      Array.from({ length: 24 }, () => ({ temp: 18, precip: 5, wind: 10 })),
    );
    const { hours, bestWindows } = getHourlyAnalysis(
      hourly,
      "2099-01-01",
      "2099-01-01T06:00",
      "2099-01-01T21:00",
    );
    expect(hours).toHaveLength(0);
    expect(bestWindows).toHaveLength(0);
  });

  it("identifies best windows from good daytime hours", () => {
    const data = Array.from({ length: 24 }, (_, i) => {
      if (i >= 9 && i <= 12) return { temp: 20, precip: 5, wind: 10 }; // ideal window
      if (i >= 14 && i <= 16) return { temp: 18, precip: 80, wind: 10 }; // rain window
      return { temp: 5, precip: 10, wind: 10 };
    });
    const hourly = makeHourly(data);
    const { bestWindows, badWindows } = getHourlyAnalysis(hourly, "2026-06-04", "2026-06-04T07:00", "2026-06-04T21:00");
    expect(bestWindows.length).toBeGreaterThan(0);
    expect(bestWindows[0].rating).toMatch(/Excellent|Good/);
    expect(badWindows.length).toBeGreaterThan(0);
  });
});

describe("getDayHourlyData", () => {
  function makeHourly24(): HourlyForecastResponse["hourly"] {
    const date = "2026-06-04";
    return {
      time: Array.from({ length: 24 }, (_, i) => `${date}T${String(i).padStart(2, "0")}:00`),
      temperature_2m: Array.from({ length: 24 }, (_, i) => 10 + i * 0.5),
      precipitation_probability: Array.from({ length: 24 }, (_, i) => i * 4),
      wind_speed_10m: Array.from({ length: 24 }, () => 15),
      uv_index: Array.from({ length: 24 }, () => 3),
      weather_code: Array.from({ length: 24 }, () => 1),
    };
  }

  it("returns one entry per hour for the given date", () => {
    const entries = getDayHourlyData(makeHourly24(), "2026-06-04");
    expect(entries).toHaveLength(24);
  });

  it("sets hour, label, temp, precipProb, windSpeed, weatherCode correctly", () => {
    const entries = getDayHourlyData(makeHourly24(), "2026-06-04");
    expect(entries[0].hour).toBe(0);
    expect(entries[0].label).toBe("12am");
    expect(entries[12].hour).toBe(12);
    expect(entries[12].label).toBe("12pm");
    expect(entries[0].weatherCode).toBe(1);
    expect(entries[0].windSpeed).toBe(15);
  });

  it("returns empty array when date has no matching entries", () => {
    const entries = getDayHourlyData(makeHourly24(), "2099-01-01");
    expect(entries).toHaveLength(0);
  });
});

describe("findBestGeoMatch", () => {
  // Mirrors the real Open-Meteo response order for "La Paz" — Mexico comes first
  // but has the lowest population, so population-based selection changes the order.
  const lapazResults: GeocodingResult[] = [
    { name: "La Paz", country: "Mexico",   latitude: 24.14,  longitude: -110.31, admin1: "Baja California Sur",  population: 215000 },
    { name: "La Paz", country: "Bolivia",  latitude: -16.5,  longitude: -68.15,  admin1: "La Paz Department",    population: 789541 },
    { name: "La Paz", country: "Honduras", latitude: 14.32,  longitude: -87.68,  admin1: "La Paz Department",    population: 10000 },
  ];

  it("returns null for empty results", () => {
    expect(findBestGeoMatch([], null)).toBeNull();
    expect(findBestGeoMatch([], "Bolivia")).toBeNull();
  });

  it("returns the most populated result when there is no country hint", () => {
    // Bolivia has the highest population so it should win with no hint
    expect(findBestGeoMatch(lapazResults, null)?.country).toBe("Bolivia");
  });

  it("falls back to first result when all populations are equal (or unknown)", () => {
    const equal: GeocodingResult[] = [
      { name: "X", country: "A", latitude: 0, longitude: 0 },
      { name: "X", country: "B", latitude: 1, longitude: 1 },
    ];
    // All population undefined → treated as 0 → sort is stable → first wins
    expect(findBestGeoMatch(equal, null)?.country).toBe("A");
  });

  it("picks Bolivia over Mexico when the hint is Bolivia", () => {
    const result = findBestGeoMatch(lapazResults, "Bolivia");
    expect(result?.country).toBe("Bolivia");
    expect(result?.latitude).toBeCloseTo(-16.5, 1);
  });

  it("picks Honduras over Mexico when the hint is Honduras", () => {
    expect(findBestGeoMatch(lapazResults, "Honduras")?.country).toBe("Honduras");
  });

  it("prefers the most populated city among country matches", () => {
    const manchesters: GeocodingResult[] = [
      { name: "Manchester", country: "United Kingdom", latitude: 53.48, longitude: -2.24, admin1: "England",        population: 553230 },
      { name: "Manchester", country: "United States",  latitude: 42.99, longitude: -71.46, admin1: "New Hampshire",  population: 115644 },
    ];
    // With hint "United Kingdom", UK Manchester should win
    expect(findBestGeoMatch(manchesters, "United Kingdom")?.admin1).toBe("England");
  });

  it("picks the populous Rio de Janeiro over a smaller same-name place", () => {
    const rios: GeocodingResult[] = [
      { name: "Rio de Janeiro", country: "Brazil", latitude: -22.90, longitude: -43.17, admin1: "Rio de Janeiro", population: 6748000 },
      { name: "Rio de Janeiro", country: "Brazil", latitude: -22.50, longitude: -43.00, admin1: "Suburb",          population: 12000 },
    ];
    expect(findBestGeoMatch(rios, "Brazil")?.population).toBe(6748000);
  });

  it("falls back to the first result when no country matches the hint", () => {
    expect(findBestGeoMatch(lapazResults, "France")?.country).toBe("Mexico");
  });

  it("matches when hint is a substring of the country name", () => {
    const results: GeocodingResult[] = [
      { name: "Kinshasa", country: "Democratic Republic of the Congo", latitude: -4.32, longitude: 15.32 },
    ];
    expect(findBestGeoMatch(results, "Congo")?.country).toBe(
      "Democratic Republic of the Congo",
    );
  });

  it("matches when country name is a substring of hint", () => {
    const results: GeocodingResult[] = [
      { name: "New York", country: "United States", latitude: 40.71, longitude: -74.0 },
    ];
    expect(findBestGeoMatch(results, "United States of America")?.country).toBe(
      "United States",
    );
  });

  it("is case-insensitive", () => {
    expect(findBestGeoMatch(lapazResults, "BOLIVIA")?.country).toBe("Bolivia");
    expect(findBestGeoMatch(lapazResults, "bolivia")?.country).toBe("Bolivia");
  });
});

describe("selectCandidates", () => {
  it("returns the list unchanged when it is smaller than max", () => {
    const cities = ["Aalborg", "Berlin", "Cairo"];
    expect(selectCandidates(cities, 10)).toEqual(cities);
  });

  it("returns exactly max items when the list is larger than max", () => {
    const cities = Array.from({ length: 300 }, (_, i) => `City${i}`);
    expect(selectCandidates(cities, 50)).toHaveLength(50);
  });

  it("includes the first city", () => {
    const cities = Array.from({ length: 200 }, (_, i) => `City${i}`);
    expect(selectCandidates(cities, 50)[0]).toBe("City0");
  });

  it("spreads selections evenly so mid-list cities are represented", () => {
    // 10 cities, pick 5: indices 0, 2, 4, 6, 8
    const cities = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const result = selectCandidates(cities, 5);
    expect(result).toEqual(["A", "C", "E", "G", "I"]);
  });

  it("does not include duplicates when sampling evenly", () => {
    const cities = Array.from({ length: 100 }, (_, i) => `City${i}`);
    const result = selectCandidates(cities, 40);
    expect(new Set(result).size).toBe(result.length);
  });

  it("simulates Brazil — Rio de Janeiro is included in a 150-city sample of 300", () => {
    // Construct a Brazil-like alphabetical list where Rio de Janeiro sits at index 180
    const cities = Array.from({ length: 300 }, (_, i) => `City${String(i).padStart(3, "0")}`);
    cities[180] = "Rio de Janeiro";
    const result = selectCandidates(cities, 150);
    expect(result).toContain("Rio de Janeiro");
  });
});

describe("countryCodeToFlag", () => {
  it("converts GB to UK flag emoji", () => {
    expect(countryCodeToFlag("GB")).toBe("🇬🇧");
  });
  it("converts US to US flag emoji", () => {
    expect(countryCodeToFlag("US")).toBe("🇺🇸");
  });
  it("converts FR to French flag", () => {
    expect(countryCodeToFlag("FR")).toBe("🇫🇷");
  });
  it("is case-insensitive (lowercased code)", () => {
    expect(countryCodeToFlag("gb")).toBe("🇬🇧");
  });
  it("returns empty string for empty input", () => {
    expect(countryCodeToFlag("")).toBe("");
  });
  it("returns empty string for non-2-char input", () => {
    expect(countryCodeToFlag("GBR")).toBe("");
    expect(countryCodeToFlag("G")).toBe("");
  });
  it("converts AU correctly", () => {
    expect(countryCodeToFlag("AU")).toBe("🇦🇺");
  });
});

describe("getFeelsLikeExplanation", () => {
  it("returns empty/same when diff is < 1°", () => {
    const r = getFeelsLikeExplanation(20, 20.4, 50, 10);
    expect(r).toBe("Same as actual temperature");
  });
  it("mentions wind chill when cold and windy", () => {
    const r = getFeelsLikeExplanation(10, 6, 50, 30);
    expect(r.toLowerCase()).toContain("wind");
    expect(r.toLowerCase()).toContain("colder");
  });
  it("mentions humidity when hot and humid", () => {
    const r = getFeelsLikeExplanation(25, 29, 80, 5);
    expect(r.toLowerCase()).toContain("humid");
    expect(r.toLowerCase()).toContain("warmer");
  });
  it("returns cooler explanation without humidity/wind context", () => {
    const r = getFeelsLikeExplanation(20, 16, 40, 5);
    expect(r.toLowerCase()).toContain("cooler");
  });
  it("returns warmer explanation for moderate diff without high humidity", () => {
    const r = getFeelsLikeExplanation(20, 23, 40, 5);
    expect(r.toLowerCase()).toContain("warmer");
  });
});

describe("getWeatherScore", () => {
  it("returns 4 for excellent sunny warm day", () => {
    expect(getWeatherScore(0, 22)).toBe(4);
  });
  it("returns 3 for good partly-cloudy warm day", () => {
    expect(getWeatherScore(1, 18)).toBe(3);
  });
  it("returns 2 for overcast (Gloomy)", () => {
    expect(getWeatherScore(3, 15)).toBe(2);
  });
  it("returns 1 for drizzle", () => {
    expect(getWeatherScore(55, 15)).toBe(1);
  });
  it("returns 0 for thunderstorm", () => {
    expect(getWeatherScore(95, 20)).toBe(0);
  });
  it("returns 0 for heavy rain", () => {
    expect(getWeatherScore(65, 15)).toBe(0);
  });
  it("scores are ordered: excellent > good > fair > poor", () => {
    expect(getWeatherScore(0, 22)).toBeGreaterThan(getWeatherScore(1, 18));
    expect(getWeatherScore(1, 18)).toBeGreaterThan(getWeatherScore(55, 15));
    expect(getWeatherScore(55, 15)).toBeGreaterThan(getWeatherScore(95, 20));
  });
});

describe("getDaylightInfo", () => {
  it("calculates daylight duration correctly", () => {
    const info = getDaylightInfo("2026-06-04T06:00", "2026-06-04T21:00");
    expect(info.hours).toBe(15);
    expect(info.minutes).toBe(0);
  });

  it("calculates fractional hours correctly", () => {
    const info = getDaylightInfo("2026-06-04T06:30", "2026-06-04T20:45");
    expect(info.hours).toBe(14);
    expect(info.minutes).toBe(15);
  });

  it("risePercent is a fraction of 24 hours", () => {
    // Sunrise at 6:00 = 360 min of 1440 = 25%
    const info = getDaylightInfo("2026-06-04T06:00", "2026-06-04T21:00");
    expect(info.risePercent).toBeCloseTo(25);
  });

  it("lightPercent is a fraction of 24 hours", () => {
    // 15 h of 24 h = 62.5%
    const info = getDaylightInfo("2026-06-04T06:00", "2026-06-04T21:00");
    expect(info.lightPercent).toBeCloseTo(62.5);
  });

  it("returns zero duration for invalid / same times", () => {
    const info = getDaylightInfo("2026-06-04T12:00", "2026-06-04T12:00");
    expect(info.hours).toBe(0);
    expect(info.minutes).toBe(0);
    expect(info.lightPercent).toBe(0);
  });

  it("handles short winter days (4h daylight)", () => {
    const info = getDaylightInfo("2026-12-21T08:00", "2026-12-21T12:00");
    expect(info.hours).toBe(4);
    expect(info.minutes).toBe(0);
  });
});

describe("validateCoord", () => {
  it("returns the parsed value when in range", () => {
    expect(validateCoord("51.5", -90, 90, 0)).toBeCloseTo(51.5);
    expect(validateCoord("-0.12", -180, 180, 0)).toBeCloseTo(-0.12);
  });
  it("returns the fallback for undefined", () => {
    expect(validateCoord(undefined, -90, 90, 51.5)).toBe(51.5);
  });
  it("returns the fallback for NaN input", () => {
    expect(validateCoord("abc", -90, 90, 10)).toBe(10);
  });
  it("returns the fallback when value is below minimum", () => {
    expect(validateCoord("-91", -90, 90, 0)).toBe(0);
  });
  it("returns the fallback when value is above maximum", () => {
    expect(validateCoord("181", -180, 180, 0)).toBe(0);
  });
  it("accepts exact boundary values", () => {
    expect(validateCoord("90", -90, 90, 0)).toBe(90);
    expect(validateCoord("-90", -90, 90, 0)).toBe(-90);
    expect(validateCoord("180", -180, 180, 0)).toBe(180);
  });
  it("rejects Infinity", () => {
    expect(validateCoord("Infinity", -90, 90, 42)).toBe(42);
  });
});

describe("getDressCode", () => {
  it("suggests heavy winter gear for freezing temperatures", () => {
    const { items, summary } = getDressCode(0, -5, 10);
    expect(items.some((i) => i.toLowerCase().includes("coat"))).toBe(true);
    expect(summary.toLowerCase()).toContain("bundle");
  });

  it("suggests light summer clothing for hot weather", () => {
    const { items, summary } = getDressCode(0, 30, 5);
    expect(items.some((i) => i.toLowerCase().includes("summer") || i.toLowerCase().includes("shorts"))).toBe(true);
    expect(summary.toLowerCase()).toContain("summer");
  });

  it("includes umbrella suggestion for rainy weather", () => {
    const { items } = getDressCode(65, 15, 10);
    expect(items.some((i) => i.toLowerCase().includes("umbrella") || i.toLowerCase().includes("waterproof"))).toBe(true);
  });

  it("includes sunscreen for clear sunny hot day", () => {
    const { items } = getDressCode(0, 25, 5);
    expect(items.some((i) => i.toLowerCase().includes("sunscreen"))).toBe(true);
  });

  it("includes wind-resistant layer for high wind", () => {
    const { items } = getDressCode(1, 15, 50);
    expect(items.some((i) => i.toLowerCase().includes("wind"))).toBe(true);
  });

  it("returns at most 5 items", () => {
    const { items } = getDressCode(95, -5, 70);
    expect(items.length).toBeLessThanOrEqual(5);
  });

  it("always returns a non-empty summary", () => {
    const codes = [0, 3, 45, 65, 77, 95];
    for (const code of codes) {
      const { summary } = getDressCode(code, 10, 20);
      expect(typeof summary).toBe("string");
      expect(summary.length).toBeGreaterThan(0);
    }
  });
});

describe("formatPopulation", () => {
  it("formats billions with B suffix", () => {
    expect(formatPopulation(1_400_000_000)).toContain("B");
  });
  it("formats millions with M suffix", () => {
    expect(formatPopulation(67_000_000)).toContain("M");
    expect(formatPopulation(67_000_000)).toContain("67");
  });
  it("formats thousands with K suffix", () => {
    expect(formatPopulation(50_000)).toContain("K");
  });
  it("formats small numbers without suffix", () => {
    expect(formatPopulation(500)).toBe("500");
  });
  it("formats exactly 1 billion", () => {
    expect(formatPopulation(1_000_000_000)).toContain("B");
  });
  it("formats exactly 1 million", () => {
    expect(formatPopulation(1_000_000)).toContain("M");
  });
});

describe("normalizeCountryName (comprehensive)", () => {
  it("maps all known TopoJSON names", () => {
    const expected: Record<string, string> = {
      "United States of America": "United States",
      "Democratic Republic of the Congo": "DR Congo",
      "Republic of the Congo": "Republic of Congo",
      "United Republic of Tanzania": "Tanzania",
      "Lao PDR": "Laos",
      "Viet Nam": "Vietnam",
      "Republic of Moldova": "Moldova",
      "Syrian Arab Republic": "Syria",
      "Czechia": "Czech Republic",
      "North Macedonia": "Macedonia",
      "Eswatini": "Swaziland",
    };
    for (const [raw, expected_val] of Object.entries(expected)) {
      expect(normalizeCountryName(raw)).toBe(expected_val);
    }
  });

  it("returns the original name for unmapped countries", () => {
    expect(normalizeCountryName("Germany")).toBe("Germany");
    expect(normalizeCountryName("Australia")).toBe("Australia");
    expect(normalizeCountryName("Brazil")).toBe("Brazil");
  });

  it("is case-sensitive — capitalisation matters", () => {
    // Map keys are exact strings, so lowercase won't match
    expect(normalizeCountryName("czechia")).toBe("czechia");
  });
});

describe("selectCandidates (additional edge cases)", () => {
  it("returns empty array for empty input", () => {
    expect(selectCandidates([], 10)).toEqual([]);
  });
  it("returns single-item list when max=1", () => {
    expect(selectCandidates(["A", "B", "C"], 1)).toEqual(["A"]);
  });
  it("always includes the first city in the sample", () => {
    const cities = Array.from({ length: 500 }, (_, i) => `City${i}`);
    expect(selectCandidates(cities, 20)[0]).toBe("City0");
  });
  it("returns exactly max items when list > max", () => {
    const cities = Array.from({ length: 1000 }, (_, i) => `X${i}`);
    expect(selectCandidates(cities, 50)).toHaveLength(50);
  });
});

describe("getOutdoorSummary", () => {
  const makeWindow = (
    rating: OutdoorWindow["rating"],
    timeLabel: string,
    activities: string[],
    isBad: boolean,
    tempRange?: string,
  ): OutdoorWindow => ({
    timeLabel,
    rating,
    conditions: "20°C, dry, calm",
    reason: "Warm, dry, calm — ideal conditions for getting outside",
    isBad,
    activities,
    tempRange,
  });

  it("returns excellent summary when best window is Excellent", () => {
    const w = makeWindow("Excellent", "9am – 1pm", ["Running", "Cycling"], false, "18–22°C");
    const s = getOutdoorSummary([w], []);
    expect(s).toContain("Excellent");
    expect(s).toContain("9am – 1pm");
  });

  it("returns good summary for Good rating", () => {
    const w = makeWindow("Good", "2pm – 4pm", ["Walking"], false, "15–18°C");
    const s = getOutdoorSummary([w], []);
    expect(s).toContain("Good");
    expect(s).toContain("2pm – 4pm");
  });

  it("returns decent summary for Fair rating", () => {
    const w = makeWindow("Fair", "11am – 1pm", ["Walking"], false);
    const s = getOutdoorSummary([w], []);
    expect(s.toLowerCase()).toContain("decent");
  });

  it("mentions stay in when no best windows but bad window exists", () => {
    const bad = makeWindow("Poor", "1pm – 5pm", [], true);
    const s = getOutdoorSummary([], [bad]);
    expect(s.toLowerCase()).toContain("1pm – 5pm");
  });

  it("returns generic message when no windows at all", () => {
    const s = getOutdoorSummary([], []);
    expect(typeof s).toBe("string");
    expect(s.length).toBeGreaterThan(10);
  });

  it("returns a non-empty string in all cases", () => {
    const w = makeWindow("Good", "10am – 12pm", [], false);
    expect(getOutdoorSummary([w], [])).toBeTruthy();
    expect(getOutdoorSummary([], [])).toBeTruthy();
  });
});

describe("getWindDirection", () => {
  it("returns N for 0°", () => expect(getWindDirection(0)).toBe("N"));
  it("returns N for 360°", () => expect(getWindDirection(360)).toBe("N"));
  it("returns E for 90°", () => expect(getWindDirection(90)).toBe("E"));
  it("returns S for 180°", () => expect(getWindDirection(180)).toBe("S"));
  it("returns W for 270°", () => expect(getWindDirection(270)).toBe("W"));
  it("returns NE for 45°", () => expect(getWindDirection(45)).toBe("NE"));
  it("returns SW for 225°", () => expect(getWindDirection(225)).toBe("SW"));
  it("handles negative degrees (wraps correctly)", () => {
    expect(getWindDirection(-90)).toBe("W"); // -90 + 360 = 270
  });
  it("handles degrees > 360", () => {
    expect(getWindDirection(450)).toBe("E"); // 450 % 360 = 90
  });
});

describe("getWindArrow", () => {
  it("returns ↑ for North", () => expect(getWindArrow(0)).toBe("↑"));
  it("returns ↓ for South", () => expect(getWindArrow(180)).toBe("↓"));
  it("returns → for East", () => expect(getWindArrow(90)).toBe("→"));
  it("returns ← for West", () => expect(getWindArrow(270)).toBe("←"));
  it("returns ↗ for NE", () => expect(getWindArrow(45)).toBe("↗"));
  it("returns ↙ for SW", () => expect(getWindArrow(225)).toBe("↙"));
});

describe("getWeatherAlert", () => {
  it("returns a thunderstorm warning for codes 95+", () => {
    const alert = getWeatherAlert(95, 20, 5, 5);
    expect(alert).not.toBeNull();
    expect(alert!.level).toBe("warning");
    expect(alert!.title).toContain("Thunderstorm");
  });

  it("returns a heavy snow warning when code is snow + precip > 10", () => {
    const alert = getWeatherAlert(73, 15, 0, 15);
    expect(alert).not.toBeNull();
    expect(alert!.level).toBe("warning");
    expect(alert!.title).toContain("Snow");
  });

  it("does not return snow warning for low precipitation snow", () => {
    const alert = getWeatherAlert(71, 15, 0, 3);
    // No snow warning, but might get other alerts
    if (alert) expect(alert.title).not.toContain("Snow");
  });

  it("returns high wind warning when windSpeed > 65", () => {
    const alert = getWeatherAlert(0, 70, 5, 0);
    expect(alert).not.toBeNull();
    expect(alert!.level).toBe("warning");
    expect(alert!.title).toContain("Wind");
    expect(alert!.message).toContain("70");
  });

  it("does not return wind warning below threshold", () => {
    const alert = getWeatherAlert(0, 50, 5, 0);
    expect(alert).toBeNull();
  });

  it("returns heavy rain advisory for heavy rain + precip > 25", () => {
    const alert = getWeatherAlert(63, 10, 3, 30);
    expect(alert).not.toBeNull();
    expect(alert!.level).toBe("advisory");
    expect(alert!.title).toContain("Rain");
  });

  it("returns UV advisory for index >= 8", () => {
    const alert = getWeatherAlert(0, 10, 9, 0);
    expect(alert).not.toBeNull();
    expect(alert!.level).toBe("advisory");
    expect(alert!.title).toContain("UV");
    expect(alert!.message).toContain("9");
  });

  it("returns null for benign conditions", () => {
    expect(getWeatherAlert(1, 20, 3, 2)).toBeNull();
    expect(getWeatherAlert(3, 10, 2, 0)).toBeNull();
  });

  it("prioritises thunderstorm warning over wind warning", () => {
    const alert = getWeatherAlert(95, 80, 3, 5);
    expect(alert!.title).toContain("Thunderstorm");
  });
});

describe("getWeatherAnimClass", () => {
  it("returns sunny class for clear sky (code 0)", () => {
    const cls = getWeatherAnimClass(0);
    expect(cls).toContain("weather-sunny");
  });
  it("returns cloudy class for partly cloudy (codes 1-2)", () => {
    expect(getWeatherAnimClass(1)).toBe("weather-cloudy");
    expect(getWeatherAnimClass(2)).toBe("weather-cloudy");
  });
  it("returns thunder class for thunderstorm (code 95+)", () => {
    expect(getWeatherAnimClass(95)).toBe("weather-thunder");
    expect(getWeatherAnimClass(99)).toBe("weather-thunder");
  });
  it("returns snowy class for snow (codes 71-77)", () => {
    expect(getWeatherAnimClass(71)).toBe("weather-snowy");
    expect(getWeatherAnimClass(77)).toBe("weather-snowy");
  });
  it("returns rainy class for rain (codes 61-67)", () => {
    expect(getWeatherAnimClass(61)).toBe("weather-rainy");
    expect(getWeatherAnimClass(67)).toBe("weather-rainy");
  });
  it("returns rainy class for showers (codes 80-82)", () => {
    expect(getWeatherAnimClass(80)).toBe("weather-rainy");
    expect(getWeatherAnimClass(82)).toBe("weather-rainy");
  });
  it("returns foggy class for fog (codes 45, 48)", () => {
    expect(getWeatherAnimClass(45)).toBe("weather-foggy");
    expect(getWeatherAnimClass(48)).toBe("weather-foggy");
  });
  it("returns cloudy as default for overcast (code 3)", () => {
    expect(getWeatherAnimClass(3)).toBe("weather-cloudy");
  });
});

describe("getWeatherFact", () => {
  it("returns a non-empty string for any weather code and temperature", () => {
    const codes = [0, 1, 2, 3, 45, 48, 51, 55, 61, 65, 71, 75, 80, 82, 95, 99];
    const temps = [-20, -5, 0, 10, 20, 35, 40];
    for (const code of codes) {
      for (const temp of temps) {
        const fact = getWeatherFact(code, temp);
        expect(typeof fact).toBe("string");
        expect(fact.length).toBeGreaterThan(10);
      }
    }
  });
  it("returns lightning fact for thunderstorm", () => {
    const fact = getWeatherFact(95, 20);
    expect(fact.toLowerCase()).toContain("lightning");
  });
  it("returns snowflake fact for snow", () => {
    const fact = getWeatherFact(71, 0);
    expect(fact.toLowerCase()).toContain("snowflake");
  });
  it("returns rain cloud fact for heavy rain", () => {
    const fact = getWeatherFact(63, 15);
    expect(fact.toLowerCase()).toContain("cloud");
  });
  it("returns heat fact for very high temperature", () => {
    const fact = getWeatherFact(0, 40);
    expect(fact.toLowerCase()).toMatch(/death valley|hottest/);
  });
  it("returns cold fact for very low temperature", () => {
    const fact = getWeatherFact(0, -15);
    expect(fact.toLowerCase()).toContain("−40");
  });
});

describe("getHourlyAnalysis enhanced windows", () => {
  function makeIdealHourly(): HourlyForecastResponse["hourly"] {
    const date = "2026-06-04";
    return {
      time: Array.from({ length: 24 }, (_, i) => `${date}T${String(i).padStart(2, "0")}:00`),
      temperature_2m: Array.from({ length: 24 }, (_, i) => {
        // Ideal temp 9am-5pm
        if (i >= 9 && i <= 17) return 20;
        return 8;
      }),
      precipitation_probability: Array.from({ length: 24 }, (_, i) =>
        i >= 14 && i <= 16 ? 75 : 5,
      ),
      wind_speed_10m: Array.from({ length: 24 }, () => 10),
      uv_index: Array.from({ length: 24 }, () => 3),
      weather_code: Array.from({ length: 24 }, () => 1),
    };
  }

  it("populates peakHour on best windows", () => {
    const hourly = makeIdealHourly();
    const { bestWindows } = getHourlyAnalysis(
      hourly, "2026-06-04", "2026-06-04T06:00", "2026-06-04T21:00",
    );
    expect(bestWindows.length).toBeGreaterThan(0);
    expect(bestWindows[0].peakHour).toBeTruthy();
    expect(typeof bestWindows[0].peakHour).toBe("string");
  });

  it("populates tempRange on best windows", () => {
    const hourly = makeIdealHourly();
    const { bestWindows } = getHourlyAnalysis(
      hourly, "2026-06-04", "2026-06-04T06:00", "2026-06-04T21:00",
    );
    expect(bestWindows.length).toBeGreaterThan(0);
    expect(bestWindows[0].tempRange).toMatch(/\d+–\d+°C/);
  });

  it("populates activities on best windows", () => {
    const hourly = makeIdealHourly();
    const { bestWindows } = getHourlyAnalysis(
      hourly, "2026-06-04", "2026-06-04T06:00", "2026-06-04T21:00",
    );
    expect(bestWindows.length).toBeGreaterThan(0);
    expect(Array.isArray(bestWindows[0].activities)).toBe(true);
    expect(bestWindows[0].activities!.length).toBeGreaterThan(0);
  });

  it("returns empty activities for bad windows", () => {
    const hourly = makeIdealHourly();
    const { badWindows } = getHourlyAnalysis(
      hourly, "2026-06-04", "2026-06-04T06:00", "2026-06-04T21:00",
    );
    if (badWindows.length > 0) {
      expect(badWindows[0].activities).toEqual([]);
    }
  });
});

describe("normalizeCountryName", () => {
  it("maps United States of America to United States", () => {
    expect(normalizeCountryName("United States of America")).toBe("United States");
  });

  it("maps Democratic Republic of the Congo to DR Congo", () => {
    expect(normalizeCountryName("Democratic Republic of the Congo")).toBe("DR Congo");
  });

  it("passes through names that need no mapping", () => {
    expect(normalizeCountryName("Germany")).toBe("Germany");
    expect(normalizeCountryName("France")).toBe("France");
    expect(normalizeCountryName("United Kingdom")).toBe("United Kingdom");
  });

  it("maps Lao PDR to Laos", () => {
    expect(normalizeCountryName("Lao PDR")).toBe("Laos");
  });
});
