import { type NextRequest } from "next/server";
import { normalizeCountryName } from "@/lib/countries";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/rateLimit";

// Current conditions + local timezone for a single location, used by the world
// map's inline weather card. Three input modes (checked in order):
//   ?lat=&lon=[&name=]   — direct coordinates (city markers already have these)
//   ?city=&country=       — geocode the named city within a country
//   ?country=             — resolve the country's capital, then geocode it
export interface CurrentWeather {
  name: string; // resolved location label shown in the card
  temp: number;
  feelsLike: number;
  code: number;
  timezone: string; // IANA timezone e.g. "Europe/London"
  isCapital: boolean;
}

interface GeoRow {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
}

const NAME_RE = /^[\p{L}\s\-'.()]+$/u;

function validName(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return null;
  if (!NAME_RE.test(trimmed)) return null;
  return trimmed;
}

function validCoord(raw: string | null, max: number): number | null {
  if (!raw) return null;
  const n = parseFloat(raw);
  if (!isFinite(n) || n < -max || n > max) return null;
  return n;
}

// Resolve a country's capital city name via restcountries. The map passes the
// raw TopoJSON name (e.g. "United States of America"), which restcountries
// matches by official/common name.
async function capitalOf(rawCountry: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(rawCountry)}?fields=name,capital`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const capital = data[0]?.capital;
    return Array.isArray(capital) && capital.length > 0 ? capital[0] : null;
  } catch {
    return null;
  }
}

async function geocode(
  cityName: string,
  countryHint: string,
): Promise<{ lat: number; lon: number } | null> {
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
    return { lat: match.latitude, lon: match.longitude };
  } catch {
    return null;
  }
}

async function fetchWeather(
  lat: number,
  lon: number,
): Promise<Omit<CurrentWeather, "name" | "isCapital"> | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`,
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const c = data?.current;
    if (!c || typeof c.temperature_2m !== "number") return null;
    return {
      temp: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature ?? c.temperature_2m),
      code: c.weather_code ?? 0,
      timezone: typeof data.timezone === "string" ? data.timezone : "auto",
    };
  } catch {
    return null;
  }
}

// 60 requests / minute per client. Each call can trigger geocode + forecast
// fan-out upstream, so the cap protects those free APIs.
const RATE_LIMIT = { limit: 60, windowMs: 60_000 };

export async function GET(request: NextRequest) {
  const { limited, result } = enforceRateLimit(request, RATE_LIMIT, "current");
  if (limited) return limited;

  const sp = request.nextUrl.searchParams;
  const lat = validCoord(sp.get("lat"), 90);
  const lon = validCoord(sp.get("lon"), 180);

  let name: string | null = null;
  let isCapital = false;
  let coords: { lat: number; lon: number } | null = null;

  if (lat !== null && lon !== null) {
    // Mode 1 — direct coordinates
    coords = { lat, lon };
    name = validName(sp.get("name"));
  } else {
    const country = validName(sp.get("country"));
    if (!country) return Response.json(null, { status: 400 });
    const normalized = normalizeCountryName(country);
    const city = validName(sp.get("city"));

    if (city) {
      // Mode 2 — named city within a country
      name = city;
      coords = await geocode(city, normalized);
    } else {
      // Mode 3 — country → capital
      const capital = await capitalOf(country);
      if (!capital) return Response.json(null, { status: 404 });
      name = capital;
      isCapital = true;
      coords = await geocode(capital, normalized);
    }
  }

  if (!coords) return Response.json(null, { status: 404 });

  const weather = await fetchWeather(coords.lat, coords.lon);
  if (!weather) return Response.json(null, { status: 502 });

  const payload: CurrentWeather = {
    name: name ?? "This location",
    isCapital,
    ...weather,
  };

  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      ...rateLimitHeaders(result),
    },
  });
}
