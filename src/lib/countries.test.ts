import { describe, it, expect, vi, afterEach } from "vitest";
import {
  normalizeCountryName,
  selectCandidates,
  formatPopulation,
  mapWithConcurrency,
  getAllCountries,
  getCountryByCode,
  getCountriesByRegion,
  getCitiesForCountry,
} from "./countries";

function mockFetch(payload: unknown, ok = true) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok, json: async () => payload }));
}

const country = (common: string) => ({
  name: { common }, cca2: common.slice(0, 2).toUpperCase(), flag: "🏳️",
  capital: ["Cap"], region: "R", subregion: "S", population: 1,
});

afterEach(() => vi.restoreAllMocks());

describe("getAllCountries", () => {
  it("returns countries sorted by common name", async () => {
    mockFetch([country("Brazil"), country("Argentina")]);
    const out = await getAllCountries();
    expect(out.map((c) => c.name.common)).toEqual(["Argentina", "Brazil"]);
  });

  it("throws when the response is not ok", async () => {
    mockFetch(null, false);
    await expect(getAllCountries()).rejects.toThrow(/failed/i);
  });
});

describe("getCountryByCode", () => {
  it("returns the country payload on success", async () => {
    mockFetch(country("France"));
    expect((await getCountryByCode("fr"))?.name.common).toBe("France");
  });

  it("returns null on a non-ok response", async () => {
    mockFetch(null, false);
    expect(await getCountryByCode("zz")).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await getCountryByCode("fr")).toBeNull();
  });
});

describe("getCountriesByRegion", () => {
  it("returns sorted countries for a region", async () => {
    mockFetch([country("Spain"), country("France")]);
    expect((await getCountriesByRegion("Europe")).map((c) => c.name.common)).toEqual(["France", "Spain"]);
  });

  it("returns [] on failure", async () => {
    mockFetch(null, false);
    expect(await getCountriesByRegion("Europe")).toEqual([]);
  });
});

describe("getCitiesForCountry", () => {
  it("returns sorted city names", async () => {
    mockFetch({ error: false, data: ["Lyon", "Paris", "Cannes"] });
    expect(await getCitiesForCountry("France")).toEqual(["Cannes", "Lyon", "Paris"]);
  });

  it("returns [] when the payload signals an error", async () => {
    mockFetch({ error: true, msg: "nope" });
    expect(await getCitiesForCountry("France")).toEqual([]);
  });

  it("returns [] when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await getCitiesForCountry("France")).toEqual([]);
  });
});

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

describe("mapWithConcurrency", () => {
  it("preserves input order in the result", async () => {
    const out = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (n) => n * 2);
    expect(out).toEqual([2, 4, 6, 8, 10]);
  });

  it("never exceeds the concurrency limit", async () => {
    let inFlight = 0;
    let peak = 0;
    await mapWithConcurrency(Array.from({ length: 20 }, (_, i) => i), 4, async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight--;
    });
    expect(peak).toBeLessThanOrEqual(4);
  });

  it("processes every item", async () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const out = await mapWithConcurrency(items, 8, async (n) => n + 1);
    expect(out).toEqual(items.map((n) => n + 1));
  });

  it("handles an empty list", async () => {
    expect(await mapWithConcurrency([], 4, async (n) => n)).toEqual([]);
  });

  it("clamps a limit below 1 up to 1", async () => {
    const out = await mapWithConcurrency([1, 2, 3], 0, async (n) => n);
    expect(out).toEqual([1, 2, 3]);
  });

  it("passes the index to the callback", async () => {
    const out = await mapWithConcurrency(["a", "b", "c"], 2, async (item, i) => `${i}:${item}`);
    expect(out).toEqual(["0:a", "1:b", "2:c"]);
  });
});
