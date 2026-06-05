// Maps world-atlas / Natural Earth country names → CountriesNow API names.
// Add entries whenever a country's name in the TopoJSON differs from what
// CountriesNow expects.
const COUNTRY_NAME_MAP: Record<string, string> = {
  UK: "United Kingdom",
  US: "United States",
  USA: "United States",
  "United States of America": "United States",
  "Democratic Republic of the Congo": "DR Congo",
  "Republic of the Congo": "Republic of Congo",
  "United Republic of Tanzania": "Tanzania",
  "Lao PDR": "Laos",
  "Viet Nam": "Vietnam",
  "Republic of Moldova": "Moldova",
  "Syrian Arab Republic": "Syria",
  "Timor-Leste": "East Timor",
  "Czechia": "Czech Republic",
  "North Macedonia": "Macedonia",
  "Eswatini": "Swaziland",
  "Cabo Verde": "Cape Verde",
  "Sao Tome and Principe": "Sao Tome And Principe",
};

export function normalizeCountryName(name: string): string {
  return COUNTRY_NAME_MAP[name] ?? name;
}

export interface Country {
  name: { common: string; official: string };
  cca2: string;
  flag: string;
  capital?: string[];
  region: string;
  subregion?: string;
  population?: number;
}

export async function getAllCountries(): Promise<Country[]> {
  const res = await fetch(
    "https://restcountries.com/v3.1/all?fields=name,cca2,flag,capital,region,subregion,population",
    { next: { revalidate: 86400 } },
  );
  if (!res.ok) throw new Error("Failed to fetch countries");
  const data: Country[] = await res.json();
  return data.sort((a, b) => a.name.common.localeCompare(b.name.common));
}

export async function getCountryByCode(code: string): Promise<Country | null> {
  try {
    const res = await fetch(
      `https://restcountries.com/v3.1/alpha/${code.toUpperCase()}?fields=name,cca2,flag,capital,region,subregion,population`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Returns up to `max` cities spread evenly across the full list.
// This is far more reliable than first-per-letter because alphabetical order
// has no relation to city importance — Recife comes before Rio de Janeiro,
// Macclesfield before Manchester, etc.
export function selectCandidates(cities: string[], max: number): string[] {
  if (cities.length <= max) return cities;
  return Array.from({ length: max }, (_, i) =>
    cities[Math.floor((i * cities.length) / max)],
  );
}

// Runs `fn` over `items` with at most `limit` promises in flight at once,
// preserving input order in the result. Used to fan out upstream geocoding
// requests without firing hundreds simultaneously (which trips rate limits and
// hurts cold-start latency). `limit` is clamped to at least 1.
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  const max = Math.max(1, Math.min(limit, items.length));
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: max }, worker));
  return results;
}

export async function getCountriesByRegion(region: string): Promise<Country[]> {
  try {
    const res = await fetch(
      `https://restcountries.com/v3.1/region/${encodeURIComponent(region)}?fields=name,cca2,flag,capital,region,subregion,population`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return [];
    const data: Country[] = await res.json();
    return data.sort((a, b) => a.name.common.localeCompare(b.name.common));
  } catch {
    return [];
  }
}

export async function getCitiesForCountry(countryName: string): Promise<string[]> {
  const normalized = normalizeCountryName(countryName);
  try {
    const res = await fetch(
      `https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(normalized)}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (data.error || !Array.isArray(data.data)) return [];
    return (data.data as string[]).sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export function formatPopulation(pop: number): string {
  if (pop >= 1_000_000_000) return `${(pop / 1_000_000_000).toFixed(1)}B`;
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`;
  if (pop >= 1_000) return `${(pop / 1_000).toFixed(0)}K`;
  return pop.toLocaleString();
}
