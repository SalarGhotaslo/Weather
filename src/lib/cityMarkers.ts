import { normalizeCountryName, selectCandidates, mapWithConcurrency } from "@/lib/countries";

// Upstream-request budget. Geocoding is fanned out across the city list, but we
// must not fire hundreds of simultaneous requests at Open-Meteo (free-tier rate
// limits + slow cold starts). GEOCODE_CONCURRENCY caps in-flight requests;
// SAMPLE_CAP bounds how many list cities we geocode beyond the prefix search.
const GEOCODE_CONCURRENCY = 12;
const SAMPLE_CAP = 80;
const MIN_CITY_POPULATION = 50_000;

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
  country_code?: string;
  population?: number;
}

interface CountryMeta {
  code: string;
  capital: string | null;
  area: number | null;
}

interface RestCountryItem {
  name?: { common?: string; official?: string };
  cca2?: string;
  capital?: string[];
  area?: number;
}

export async function resolveCountryMeta(name: string): Promise<CountryMeta | null> {
  try {
    const res = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=name,cca2,capital,area`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const lower = name.toLowerCase();
    const best: RestCountryItem | undefined =
      (data as RestCountryItem[]).find(
        (c) =>
          c?.name?.common?.toLowerCase() === lower ||
          c?.name?.official?.toLowerCase() === lower,
      ) ?? data[0];
    const code = typeof best?.cca2 === "string" ? best.cca2.toLowerCase() : null;
    if (!code) return null;
    const capital =
      Array.isArray(best?.capital) && best.capital.length > 0
        ? best.capital[0].split(",")[0].trim()
        : null;
    const area = typeof best?.area === "number" ? best.area : null;
    return { code, capital, area };
  } catch {
    return null;
  }
}

export async function geocodeCity(cityName: string, countryCode: string): Promise<CityMarker | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=5&language=en&format=json`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results?.length) return null;
    const match = (data.results as GeoRow[]).find(
      (r) => r.country_code?.toLowerCase() === countryCode && (r.population ?? 0) >= MIN_CITY_POPULATION,
    );
    if (!match) return null;
    return { name: match.name, lat: match.latitude, lon: match.longitude, population: match.population ?? 0 };
  } catch {
    return null;
  }
}

// Targeted prefixes that start the names of the world's most populous /
// well-known cities. Searching these without a country_code filter returns
// results sorted by relevance (population); we then filter by country.
// Multi-word names need longer prefixes (e.g. "los ang" for Los Angeles).
const MAJOR_CITY_PREFIXES = [
  "aba", "abu", "acc", "ada", "ade", "ale", "alg", "ama", "amr", "ams",
  "anc", "ank", "ant", "ara", "ath", "atl", "bam", "ban", "bar", "bei",
  "bel", "ben", "ber", "bog", "bom", "bor", "bra", "bri", "bro", "bru",
  "buc", "bud", "buf", "buj", "cai", "cal", "cam", "can", "cap", "car",
  "cas", "cha", "che", "chi", "cho", "chr", "col", "cur", "dal", "dam",
  "dan", "del", "den", "det", "dha", "doh", "dub",   "dur", "edi",
  "fri", "fuk",
  "gen", "gua", "gui", "ham", "hel", "hin", "hon", "hou", "hy",
  "ind", "iro", "is", "ist", "jak", "jer", "joh", "kan", "kar", "kat",
  "kin", "kol", "kua", "kum", "kwa", "lag", "lah", "las", "lim", "lis",
  "liv", "lon", "los", "lub", "lui", "ly", "mad", "mal", "man", "mar",
  "mat", "med", "mel", "mex", "mia", "mil", "min", "mon", "mos", "mum",
  "mun", "mus", "nag", "nah", "nas", "new", "nic", "nou", "nuk", "nur",
  "ok", "oma", "osa", "osl", "ott", "pan", "par", "phi", "pho",   "por",
  "pra", "que", "qui", "ply", "rec", "rey", "rio", "riv", "ros", "rot", "sac",
  "sal", "san", "sao", "sap", "sea", "sed", "seo", "sha", "she", "shi",
  "sin", "sof", "sto", "str", "syd", "tab", "tai", "tal", "tam", "tan",
  "tbi", "tel", "the", "tia", "tok", "tor", "tou", "tri", "tul", "tun",
  "ula", "val", "van", "vas", "ven", "vic", "vie", "vil", "war", "was",
  "zag", "zur",
  // multi-word city prefixes (need more chars to match)
  "new yor", "los ang", "san fr", "san jo", "san an", "las ve",
  "kuala ", "buen ", "mexic", "ho ch", "cape ", "hong ", "rio d",
  "sao p", "port ", "kuwa", "sri ",
];

async function searchTopCities(countryCode: string): Promise<CityMarker[]> {
  const results = await mapWithConcurrency(MAJOR_CITY_PREFIXES, GEOCODE_CONCURRENCY, async (prefix) => {
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${prefix}&count=5&format=json`,
        { next: { revalidate: 86400 } },
      );
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.results?.length) return [];
      return (data.results as GeoRow[])
        .filter((r) => r.country_code?.toLowerCase() === countryCode && (r.population ?? 0) >= MIN_CITY_POPULATION)
        .map((r) => ({ name: r.name, lat: r.latitude, lon: r.longitude, population: r.population ?? 0 }));
    } catch {
      return [];
    }
  });
  return dedupeByName(results.flat()).sort((a, b) => b.population - a.population);
}

export function maxMarkers(area: number | null): number {
  if (area === null) return 6;
  if (area <= 2_500) return 2;       // Luxembourg / Singapore
  if (area <= 10_000) return 3;      // very small
  if (area <= 100_000) return 4;     // small
  if (area <= 500_000) return 5;     // medium-small (UK, Japan)
  if (area <= 1_000_000) return 8;   // medium (France, Germany)
  if (area <= 3_000_000) return 15;  // large (Mexico, Bolivia, India)
  if (area <= 8_000_000) return 25;  // very large (Argentina, Kazakhstan)
  return 52;                         // huge (US, China, Canada, Russia)
}

// First-wins dedupe by city name, preserving input order.
export function dedupeByName(markers: CityMarker[]): CityMarker[] {
  const seen = new Set<string>();
  const out: CityMarker[] = [];
  for (const m of markers) {
    if (!seen.has(m.name)) {
      seen.add(m.name);
      out.push(m);
    }
  }
  return out;
}

async function fetchCityList(country: string): Promise<string[]> {
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
}

// Orchestrates the full marker resolution for a (already validated) country name:
// metadata + capital + prefix search + even-sampled list geocoding, deduped and
// trimmed to an area-scaled count. Returns [] when the country can't be resolved.
export async function getCityMarkers(rawCountry: string): Promise<CityMarker[]> {
  const country = normalizeCountryName(rawCountry);
  const [meta, cities] = await Promise.all([resolveCountryMeta(country), fetchCityList(country)]);
  if (!meta) return [];

  // 1. Direct prefix search — finds major cities by their name starts.
  const prefixMarkers = await searchTopCities(meta.code);

  // 2. Even-sampled geocoding from the full city list for broader coverage,
  //    capped at SAMPLE_CAP candidates and concurrency-limited.
  const sampled = cities.length > 0
    ? await mapWithConcurrency(
        selectCandidates(cities, Math.min(SAMPLE_CAP, cities.length)),
        GEOCODE_CONCURRENCY,
        (c) => geocodeCity(c, meta.code),
      )
    : [];

  // 3. Geocode the capital separately to guarantee it appears (capital first).
  const capitalMarker = meta.capital ? await geocodeCity(meta.capital, meta.code) : null;

  const combined = dedupeByName([
    ...(capitalMarker ? [capitalMarker] : []),
    ...prefixMarkers,
    ...sampled.filter((m): m is CityMarker => m !== null),
  ]).slice(0, maxMarkers(meta.area));

  // Drop any result whose name is basically the country name itself
  // (e.g. Open-Meteo returns "Mexico" for the country, not a city).
  const countryLower = country.toLowerCase();
  return combined.filter((m) => m.name.toLowerCase() !== countryLower);
}
