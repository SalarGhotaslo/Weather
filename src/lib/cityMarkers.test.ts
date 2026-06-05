import { describe, it, expect, vi, afterEach } from "vitest";
import {
  maxMarkers,
  dedupeByName,
  resolveCountryMeta,
  geocodeCity,
  getCityMarkers,
  type CityMarker,
} from "./cityMarkers";

const marker = (name: string, population = 100_000): CityMarker => ({
  name, lat: 0, lon: 0, population,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("maxMarkers", () => {
  it("scales the marker count with country area", () => {
    expect(maxMarkers(null)).toBe(6);
    expect(maxMarkers(2_000)).toBe(2);
    expect(maxMarkers(50_000)).toBe(4);
    expect(maxMarkers(700_000)).toBe(8);
    expect(maxMarkers(9_000_000)).toBe(52);
  });
});

describe("dedupeByName", () => {
  it("keeps the first occurrence of each name, preserving order", () => {
    const out = dedupeByName([marker("Paris", 1), marker("Lyon"), marker("Paris", 2)]);
    expect(out.map((m) => m.name)).toEqual(["Paris", "Lyon"]);
    expect(out[0].population).toBe(1); // first wins
  });

  it("handles an empty list", () => {
    expect(dedupeByName([])).toEqual([]);
  });
});

function mockFetchOnce(payload: unknown, ok = true) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok,
    json: async () => payload,
  }));
}

describe("resolveCountryMeta", () => {
  it("returns code, capital and area from restcountries", async () => {
    mockFetchOnce([
      { name: { common: "France" }, cca2: "FR", capital: ["Paris"], area: 551695 },
    ]);
    const meta = await resolveCountryMeta("France");
    expect(meta).toEqual({ code: "fr", capital: "Paris", area: 551695 });
  });

  it("returns null on a non-ok response", async () => {
    mockFetchOnce(null, false);
    expect(await resolveCountryMeta("Nowhere")).toBeNull();
  });

  it("returns null when the payload is empty", async () => {
    mockFetchOnce([]);
    expect(await resolveCountryMeta("Nowhere")).toBeNull();
  });
});

describe("geocodeCity", () => {
  it("returns a marker for a matching country + populous city", async () => {
    mockFetchOnce({
      results: [
        { name: "Paris", latitude: 48.85, longitude: 2.35, country_code: "FR", population: 2_000_000 },
      ],
    });
    expect(await geocodeCity("Paris", "fr")).toEqual({
      name: "Paris", lat: 48.85, lon: 2.35, population: 2_000_000,
    });
  });

  it("returns null when no result matches the country code", async () => {
    mockFetchOnce({
      results: [{ name: "Paris", latitude: 0, longitude: 0, country_code: "us", population: 1_000_000 }],
    });
    expect(await geocodeCity("Paris", "fr")).toBeNull();
  });

  it("returns null for under-populated matches", async () => {
    mockFetchOnce({
      results: [{ name: "Tiny", latitude: 0, longitude: 0, country_code: "fr", population: 100 }],
    });
    expect(await geocodeCity("Tiny", "fr")).toBeNull();
  });
});

// Routes each upstream call by URL so the full orchestration can be exercised.
function mockUpstream(geoResults: unknown[]) {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) => {
    if (url.includes("restcountries")) {
      return { ok: true, json: async () => [
        { name: { common: "France" }, cca2: "FR", capital: ["Paris"], area: 551_695 },
      ] };
    }
    if (url.includes("countriesnow")) {
      return { ok: true, json: async () => ({ error: false, data: ["Paris", "Lyon", "Marseille"] }) };
    }
    if (url.includes("geocoding")) {
      return { ok: true, json: async () => ({ results: geoResults }) };
    }
    return { ok: false, json: async () => null };
  }));
}

describe("getCityMarkers", () => {
  it("returns [] when the country metadata cannot be resolved", async () => {
    // All fetches fail → resolveCountryMeta returns null → orchestrator bails.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => null }));
    expect(await getCityMarkers("Atlantis")).toEqual([]);
  });

  it("resolves and dedupes markers from the full fan-out", async () => {
    mockUpstream([
      { name: "Paris", latitude: 48.85, longitude: 2.35, country_code: "fr", population: 2_000_000 },
    ]);
    const markers = await getCityMarkers("France");
    expect(markers.length).toBeGreaterThan(0);
    expect(markers.every((m) => m.name === "Paris")).toBe(true); // deduped to one
  });

  it("filters out a result whose name is the country itself", async () => {
    mockUpstream([
      { name: "France", latitude: 46, longitude: 2, country_code: "fr", population: 9_000_000 },
    ]);
    const markers = await getCityMarkers("France");
    expect(markers.find((m) => m.name === "France")).toBeUndefined();
  });
});
