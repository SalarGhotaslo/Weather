import { describe, it, expect } from "vitest";
import { normalizeCountryName, selectCandidates, formatPopulation } from "./countries";

describe("normalizeCountryName", () => {
  it("maps United States of America to United States", () => {
    expect(normalizeCountryName("United States of America")).toBe("United States");
  });

  it("maps known TopoJSON names to CountriesNow names", () => {
    expect(normalizeCountryName("Czechia")).toBe("Czech Republic");
    expect(normalizeCountryName("North Macedonia")).toBe("Macedonia");
    expect(normalizeCountryName("Eswatini")).toBe("Swaziland");
    expect(normalizeCountryName("Cabo Verde")).toBe("Cape Verde");
    expect(normalizeCountryName("Timor-Leste")).toBe("East Timor");
  });

  it("passes through names that don't need mapping", () => {
    expect(normalizeCountryName("France")).toBe("France");
    expect(normalizeCountryName("Japan")).toBe("Japan");
    expect(normalizeCountryName("Brazil")).toBe("Brazil");
  });
});

describe("selectCandidates", () => {
  it("returns all cities when under max", () => {
    const cities = ["A", "B", "C"];
    expect(selectCandidates(cities, 10)).toEqual(cities);
  });

  it("returns evenly-spaced samples when over max", () => {
    const cities = ["A", "B", "C", "D", "E", "F"];
    const result = selectCandidates(cities, 3);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("A");
    expect(result[1]).toBe("C");
    expect(result[2]).toBe("E");
  });

  it("handles empty list", () => {
    expect(selectCandidates([], 5)).toEqual([]);
  });

  it("handles max of 0", () => {
    expect(selectCandidates(["A", "B"], 0)).toEqual([]);
  });
});

describe("formatPopulation", () => {
  it("formats billions", () => {
    expect(formatPopulation(1_400_000_000)).toBe("1.4B");
    expect(formatPopulation(7_700_000_000)).toBe("7.7B");
  });

  it("formats millions", () => {
    expect(formatPopulation(67_200_000)).toBe("67.2M");
    expect(formatPopulation(1_000_000)).toBe("1.0M");
  });

  it("formats thousands", () => {
    expect(formatPopulation(50_000)).toBe("50K");
    expect(formatPopulation(999_999)).toBe("1000K");
  });

  it("formats small numbers with locale separator", () => {
    expect(formatPopulation(500)).toBe("500");
    expect(formatPopulation(42)).toBe("42");
  });

  it("handles zero", () => {
    expect(formatPopulation(0)).toBe("0");
  });
});
