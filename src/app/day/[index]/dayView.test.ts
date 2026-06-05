import { describe, it, expect } from "vitest";
import { buildDayView } from "./dayView";
import { makeWeather, makeHourlyEntry } from "@/test/fixtures";

const base = {
  weather: makeWeather(),
  dateStr: "2026-06-05",
  lat: 51.5,
  lon: -0.1,
  locationName: "London, UK",
  code: "GB",
  tz: "Europe/London",
  hourlyEntries: [makeHourlyEntry({ hour: 9 }), makeHourlyEntry({ hour: 12 })],
  dayAverages: { humidity: 70, pressure: 1010 },
};

describe("buildDayView", () => {
  it("marks day index 0 as today and resolves scalars for that day", () => {
    const vm = buildDayView({ ...base, dayIndex: 0 });
    expect(vm.isToday).toBe(true);
    expect(vm.maxTemp).toBe(22);
    expect(vm.minTemp).toBe(12);
    expect(vm.precip).toBe(0);
    expect(vm.uvIndex).toBe(5);
  });

  it("is not 'today' for future days", () => {
    expect(buildDayView({ ...base, dayIndex: 3 }).isToday).toBe(false);
  });

  it("builds baseParams with encoded name, code and tz", () => {
    const vm = buildDayView({ ...base, dayIndex: 0 });
    expect(vm.baseParams).toBe("lat=51.5&lon=-0.1&name=London%2C%20UK&code=GB&tz=Europe%2FLondon");
  });

  it("omits code + tz from baseParams when absent", () => {
    const vm = buildDayView({ ...base, dayIndex: 0, code: undefined, tz: undefined });
    expect(vm.baseParams).toBe("lat=51.5&lon=-0.1&name=London%2C%20UK");
  });

  it("derives sunrise/sunset hours from the ISO strings", () => {
    const vm = buildDayView({ ...base, dayIndex: 0 });
    expect(vm.sunriseHour).toBe(4);
    expect(vm.sunsetHour).toBe(21);
  });

  it("provides a flag, fact, theme and dress code", () => {
    const vm = buildDayView({ ...base, dayIndex: 0 });
    expect(vm.countryFlag).toBe("🇬🇧");
    expect(typeof vm.weatherFact).toBe("string");
    expect(vm.theme.type).toBeTruthy();
    expect(Array.isArray(vm.dressCode.items)).toBe(true);
    expect(vm.dayLabels).toHaveLength(7);
  });

  it("exposes wind direction + arrow for the current conditions", () => {
    const vm = buildDayView({ ...base, dayIndex: 0 });
    expect(typeof vm.windArrow).toBe("string");
    expect(typeof vm.windDirection).toBe("string");
  });

  it("uses live current conditions for today's feels-like / humidity / pressure", () => {
    const vm = buildDayView({ ...base, dayIndex: 0 });
    expect(vm.feelsLike).toBe(17); // round(current.apparent_temperature)
    expect(vm.humidity).toBe(60);  // current.relative_humidity_2m
    expect(vm.pressure).toBe(1015); // round(current.surface_pressure)
  });

  it("falls back to daily/hourly aggregates for a future day (same cards)", () => {
    const vm = buildDayView({ ...base, dayIndex: 3 });
    expect(vm.feelsLike).toBe(18); // round(daily.apparent_temperature_max[3])
    expect(vm.humidity).toBe(70);  // dayAverages.humidity
    expect(vm.pressure).toBe(1010); // dayAverages.pressure
  });
});
