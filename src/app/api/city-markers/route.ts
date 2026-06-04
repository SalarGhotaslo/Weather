import { type NextRequest } from "next/server";
import { normalizeCountryName, selectCandidates } from "@/lib/countries";

export interface CityMarker {
  name: string;
  lat: number;
  lon: number;
  population: number;
}

interface GeoRow {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string; // ISO 3166-1 alpha-2 from Open-Meteo
  population?: number;
}

function validateCountry(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return null;
  if (!/^[\p{L}\s\-'.()]+$/u.test(trimmed)) return null;
  return trimmed;
}

// Resolve a country name to its ISO alpha-2 code (cached). Matching geocoded
// cities by code is far more reliable than by name: it avoids both same-named
// foreign cities (La Paz, Mexico vs Bolivia) and name-format mismatches
// ("DR Congo" vs the geocoder's "Democratic Republic of the Congo").
async function resolveCountryCode(name: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=name,cca2`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const lower = name.toLowerCase();
    const best =
      data.find(
        (c) =>
          c?.name?.common?.toLowerCase() === lower ||
          c?.name?.official?.toLowerCase() === lower,
      ) ?? data[0];
    return typeof best?.cca2 === "string" ? best.cca2.toLowerCase() : null;
  } catch {
    return null;
  }
}

async function geocodeCity(
  cityName: string,
  countryHint: string,
  countryCode: string | null,
): Promise<CityMarker | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=10&language=en&format=json`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results?.length) return null;

    const hint = countryHint.toLowerCase();
    const results = data.results as GeoRow[];
    // Prefer matching by ISO code (most reliable). Fall back to an exact, then
    // fuzzy, country-name match only when the code couldn't be resolved.
    // Crucially there is NO blind fall-through to the first global result — that
    // used to drop a same-named foreign city onto the wrong country's map.
    const match: GeoRow | undefined =
      (countryCode
        ? results.find((r) => r.country_code?.toLowerCase() === countryCode)
        : undefined) ??
      results.find((r) => (r.country ?? "").toLowerCase() === hint) ??
      results.find((r) => {
        const c = (r.country ?? "").toLowerCase();
        return c.includes(hint) || hint.includes(c);
      });

    if (!match) return null;
    return {
      name: cityName,
      lat: match.latitude,
      lon: match.longitude,
      population: match.population ?? 0,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const validated = validateCountry(request.nextUrl.searchParams.get("country"));
  if (!validated) return Response.json([]);
  const country = normalizeCountryName(validated);

  // Resolve the ISO code (for reliable geocode matching) and the city list in
  // parallel — neither depends on the other.
  const [countryCode, cities] = await Promise.all([
    resolveCountryCode(country),
    (async (): Promise<string[]> => {
      try {
        const res = await fetch(
          `https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(country)}`,
          { next: { revalidate: 86400 } },
        );
        if (!res.ok) return [];
        const data = await res.json();
        return !data.error && Array.isArray(data.data) ? (data.data as string[]) : [];
      } catch {
        return [];
      }
    })(),
  ]);

  // Sample up to 80 cities spread evenly across the alphabetically sorted list.
  const candidates = selectCandidates(cities, 80);

  if (candidates.length === 0) return Response.json([]);

  // Geocode all candidates in parallel, filter valid, sort by population
  const geocoded = await Promise.all(
    candidates.map((c) => geocodeCity(c, country, countryCode)),
  );

  const markers = geocoded
    .filter((m): m is CityMarker => m !== null && m.population > 0)
    .sort((a, b) => b.population - a.population)
    .slice(0, 10);

  return Response.json(markers, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
  });
}
