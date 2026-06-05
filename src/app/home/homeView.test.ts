import { describe, it, expect } from "vitest";
import { buildHomeView, buildDayHref } from "./homeView";
import { makeWeather, makeLocation } from "@/test/fixtures";

describe("buildHomeView", () => {
  it("builds a label with admin1 when present", () => {
    const vm = buildHomeView(makeWeather(), makeLocation());
    expect(vm.locationLabel).toBe("London, England, United Kingdom");
  });

  it("omits admin1 from the label when absent", () => {
    const vm = buildHomeView(makeWeather(), makeLocation({ admin1: undefined }));
    expect(vm.locationLabel).toBe("London, United Kingdom");
  });

  it("computes the 5-day temperature range", () => {
    const vm = buildHomeView(makeWeather(), makeLocation());
    expect(vm.overallMax).toBe(25);
    expect(vm.overallMin).toBe(10);
    expect(vm.tempRange).toBe(15);
  });

  it("flags best days (weather score >= 3)", () => {
    const vm = buildHomeView(makeWeather(), makeLocation());
    expect(Array.isArray(vm.bestDayIndices)).toBe(true);
    // Clear/sunny warm days should qualify; rainy day index 3 should not.
    expect(vm.bestDayIndices).not.toContain(3);
  });

  it("derives a flag from the country code", () => {
    expect(buildHomeView(makeWeather(), makeLocation({ countryCode: "GB" })).countryFlag).toBe("🇬🇧");
    expect(buildHomeView(makeWeather(), makeLocation({ countryCode: undefined })).countryFlag).toBe("");
  });

  it("exposes a theme and weather fact", () => {
    const vm = buildHomeView(makeWeather(), makeLocation());
    expect(vm.theme.type).toBeTruthy();
    expect(typeof vm.weatherFact).toBe("string");
  });
});

describe("buildDayHref", () => {
  it("encodes name and includes optional code + tz", () => {
    const href = buildDayHref(0, 51.5, -0.1, "London, UK", "GB", "Europe/London");
    expect(href).toBe("/day/0?lat=51.5&lon=-0.1&name=London%2C%20UK&code=GB&tz=Europe%2FLondon");
  });

  it("omits code + tz when not provided", () => {
    expect(buildDayHref(2, 1, 2, "Paris")).toBe("/day/2?lat=1&lon=2&name=Paris");
  });
});
