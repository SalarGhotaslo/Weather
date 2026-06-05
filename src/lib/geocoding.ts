export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode?: string;  // ISO 3166-1 alpha-2
  admin1?: string;
  population?: number;
  timezone?: string;     // IANA timezone e.g. "Europe/London"
}

// Convert ISO 3166-1 alpha-2 code to flag emoji (e.g. "GB" → "🇬🇧")
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const OFFSET = 0x1f1e6 - 65; // 'A' is 65
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + OFFSET))
    .join("");
}

// Pure function — picks the best result from a geocoding response given an
// optional country hint. Extracted so it can be unit-tested without network calls.
export function findBestGeoMatch(
  results: GeocodingResult[],
  countryHint: string | null,
): GeocodingResult | null {
  if (!results.length) return null;

  const byPopulation = (a: GeocodingResult, b: GeocodingResult) =>
    (b.population ?? 0) - (a.population ?? 0);

  if (!countryHint) {
    // No hint — prefer the most populated result; the geocoding API doesn't
    // guarantee population order so "Manchester UK" could rank below
    // "Manchester NH" purely on string relevance.
    return [...results].sort(byPopulation)[0] ?? results[0];
  }

  const hint = countryHint.toLowerCase();
  const countryMatches = results.filter((r) => {
    const c = (r.country ?? "").toLowerCase();
    return c === hint || c.includes(hint) || hint.includes(c);
  });

  if (!countryMatches.length) return results[0]; // no country match — fall back to top result
  return [...countryMatches].sort(byPopulation)[0] ?? countryMatches[0];
}

export async function geocodeLocation(
  name: string,
): Promise<GeocodingResult | null> {
  // The geocoding API only understands city names — compound strings like
  // "La Paz, Bolivia" or "London, Greater London, UK" return 0 results.
  // Strategy: extract just the city name, fetch more candidates, then use
  // findBestGeoMatch to pick the right country.
  const parts = name.split(",").map((s) => s.trim());
  const cityName = parts[0];
  const countryHint = parts.length > 1 ? parts[parts.length - 1] : null;

  // Always fetch 10 candidates so findBestGeoMatch can rank by population.
  // With count=1 we'd blindly take the first string-relevance result, which
  // can return the wrong Manchester or the wrong Rio.
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=10&language=en&format=json`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results?.length) return null;

    const results: GeocodingResult[] = (
      data.results as {
        name: string;
        latitude: number;
        longitude: number;
        country?: string;
        country_code?: string;
        admin1?: string;
        population?: number;
        timezone?: string;
      }[]
    ).map((r) => ({
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country ?? "",
      countryCode: r.country_code,
      admin1: r.admin1,
      population: r.population,
      timezone: r.timezone,
    }));

    return findBestGeoMatch(results, countryHint);
  } catch {
    return null;
  }
}
