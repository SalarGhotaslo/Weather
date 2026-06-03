import { describe, it, expect } from "vitest";
import {
  getWeatherInfo,
  getDayName,
  getFormattedDate,
  getLastYearDate,
  getWeatherRating,
  describeUV,
  tempDiffDescription,
} from "./weather";

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
