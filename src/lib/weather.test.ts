import { describe, it, expect } from "vitest";
import {
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
  type HourlyForecastResponse,
  type GeocodingResult,
} from "./weather";
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
