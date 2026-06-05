import { type NextRequest } from "next/server";
import { normalizeCountryName, selectCandidates, mapWithConcurrency } from "@/lib/countries";

// Upstream-request budget. Geocoding is fanned out across the city list, but we
// must not fire hundreds of simultaneous requests at Open-Meteo (free-tier rate
// limits + slow cold starts). GEOCODE_CONCURRENCY caps in-flight requests;
// SAMPLE_CAP bounds how many list cities we geocode beyond the prefix search.
const GEOCODE_CONCURRENCY = 12;
const SAMPLE_CAP = 80;

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

function validateCountry(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return null;
  if (!/^[\p{L}\s\-'.()]+$/u.test(trimmed)) return null;
  return trimmed;
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

async function resolveCountryMeta(name: string): Promise<CountryMeta | null> {
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

async function geocodeCity(
  cityName: string,
  countryCode: string,
): Promise<CityMarker | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=5&language=en&format=json`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results?.length) return null;
    const match = (data.results as GeoRow[]).find(
      (r) => r.country_code?.toLowerCase() === countryCode && (r.population ?? 0) >= 50000,
    );
    if (!match) return null;
    return {
      name: match.name,
      lat: match.latitude,
      lon: match.longitude,
      population: match.population ?? 0,
    };
  } catch {
    return null;
  }
}

// Targeted prefixes that start the names of the world's most populous /
// well-known cities.  Searching these without a country_code filter returns
// results sorted by relevance (population).  We then filter by country.
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

async function searchTopCities(
  countryCode: string,
): Promise<CityMarker[]> {
  const results = await mapWithConcurrency(
    MAJOR_CITY_PREFIXES,
    GEOCODE_CONCURRENCY,
    async (prefix) => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${prefix}&count=5&format=json`,
          { next: { revalidate: 86400 } },
        );
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.results?.length) return [];
        return (data.results as GeoRow[])
          .filter(
            (r) =>
              r.country_code?.toLowerCase() === countryCode &&
              (r.population ?? 0) >= 50000,
          )
          .map((r) => ({
            name: r.name,
            lat: r.latitude,
            lon: r.longitude,
            population: r.population ?? 0,
          }));
      } catch {
        return [];
      }
    },
  );
  const seen = new Set<string>();
  const markers: CityMarker[] = [];
  for (const batch of results) {
    for (const m of batch) {
      if (!seen.has(m.name)) {
        seen.add(m.name);
        markers.push(m);
      }
    }
  }
  return markers.sort((a, b) => b.population - a.population);
}

function maxMarkers(area: number | null): number {
  if (area === null) return 6;
  if (area <= 2_500) return 2;    // Luxembourg / Singapore
  if (area <= 10_000) return 3;   // very small
  if (area <= 100_000) return 4;  // small
  if (area <= 500_000) return 5;  // medium-small (UK, Japan)
  if (area <= 1_000_000) return 8; // medium (France, Germany)
  if (area <= 3_000_000) return 15; // large (Mexico, Bolivia, India)
  if (area <= 8_000_000) return 25; // very large (Argentina, Kazakhstan)
  return 52;                        // huge (US, China, Canada, Russia)
}

export async function GET(request: NextRequest) {
  const validated = validateCountry(request.nextUrl.searchParams.get("country"));
  if (!validated) return Response.json([]);
  const country = normalizeCountryName(validated);

  const [meta, cities] = await Promise.all([
    resolveCountryMeta(country),
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

  if (!meta) return Response.json([]);

  // 1. Direct prefix search — finds major cities by their name starts
  const prefixMarkers = await searchTopCities(meta.code);

  // 2. Even-sampled geocoding from the full city list for broader coverage.
  //    Capped at SAMPLE_CAP candidates and concurrency-limited — the prefix
  //    search + capital already cover the major cities; this only fills gaps.
  const sampled =
    cities.length > 0
      ? await mapWithConcurrency(
          selectCandidates(cities, Math.min(SAMPLE_CAP, cities.length)),
          GEOCODE_CONCURRENCY,
          (c) => geocodeCity(c, meta.code),
        )
      : [];

  // 3. Geocode the capital separately to guarantee it appears
  const capitalMarker = meta.capital
    ? await geocodeCity(meta.capital, meta.code)
    : null;

  // Combine, deduplicate, keep area-scaled limit (capital first, then prefix
  // relevance order, then sampled fills)
  const seen = new Set<string>();
  const markers: CityMarker[] = [];

  if (capitalMarker && !seen.has(capitalMarker.name)) {
    seen.add(capitalMarker.name);
    markers.push(capitalMarker);
  }
  for (const m of prefixMarkers) {
    if (!seen.has(m.name)) {
      seen.add(m.name);
      markers.push(m);
    }
  }
  for (const m of sampled) {
    if (m && !seen.has(m.name)) {
      seen.add(m.name);
      markers.push(m);
    }
  }

  // Keep capital first, then prefix results (Open-Meteo relevance order),
  // then sampled cities to fill gaps.  Don't re-sort by population —
  // Open-Meteo's relevance ranking is a better proxy for "major city"
  // than raw population figures.
  const limit = maxMarkers(meta.area);
  markers.splice(limit);

  // Filter out any result whose name is basically the country name itself
  // (e.g. Open-Meteo returns "Mexico" for the country, not a city).
  const countryLower = country.toLowerCase();
  const filtered = markers.filter(
    (m) => m.name.toLowerCase() !== countryLower,
  );

  return Response.json(filtered, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
  });
}