import { type NextRequest } from "next/server";
import { normalizeCountryName } from "@/lib/countries";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/rateLimit";

function validateCountry(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return null;
  // Only letters, spaces, hyphens, apostrophes, periods, parentheses — all valid country name chars
  if (!/^[\p{L}\s\-'.()]+$/u.test(trimmed)) return null;
  return trimmed;
}

// 60 requests / minute per client — generous for browsing, caps abuse.
const RATE_LIMIT = { limit: 60, windowMs: 60_000 };

export async function GET(request: NextRequest) {
  const { limited, result } = enforceRateLimit(request, RATE_LIMIT, "cities");
  if (limited) return limited;

  const validated = validateCountry(request.nextUrl.searchParams.get("country"));
  if (!validated) return Response.json([], { headers: rateLimitHeaders(result) });
  const country = normalizeCountryName(validated);

  try {
    const res = await fetch(
      `https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(country)}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return Response.json([], { headers: rateLimitHeaders(result) });
    const data = await res.json();
    if (data.error || !Array.isArray(data.data)) return Response.json([], { headers: rateLimitHeaders(result) });
    const cities = (data.data as string[]).sort((a, b) => a.localeCompare(b));
    return Response.json(cities, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        ...rateLimitHeaders(result),
      },
    });
  } catch {
    return Response.json([], { headers: rateLimitHeaders(result) });
  }
}
