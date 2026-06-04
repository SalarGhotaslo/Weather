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
  population?: number;
}

function validateCountry(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return null;
  if (!/^[\p{L}\s\-'.()]+$/u.test(trimmed)) return null;
  return trimmed;
}

async function geocodeCity(
  cityName: string,
  countryHint: string,
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
    const match: GeoRow | undefined =
      (data.results as GeoRow[]).find((r) => {
        const c = (r.country ?? "").toLowerCase();
        return c === hint || c.includes(hint) || hint.includes(c);
      }) ?? data.results[0];

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

  // Fetch full city list (cached 24 h)
  let cities: string[] = [];
  try {
    const res = await fetch(
      `https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(country)}`,
      { next: { revalidate: 86400 } },
    );
    if (res.ok) {
      const data = await res.json();
      if (!data.error && Array.isArray(data.data)) cities = data.data as string[];
    }
  } catch {
    // proceed with empty list
  }

  // Sample up to 150 cities spread evenly across the alphabetically sorted list.
  const candidates = selectCandidates(cities, 150);

  if (candidates.length === 0) return Response.json([]);

  // Geocode all candidates in parallel, filter valid, sort by population
  const geocoded = await Promise.all(
    candidates.map((c) => geocodeCity(c, country)),
  );

  const markers = geocoded
    .filter((m): m is CityMarker => m !== null && m.population > 0)
    .sort((a, b) => b.population - a.population)
    .slice(0, 10);

  return Response.json(markers, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
  });
}
