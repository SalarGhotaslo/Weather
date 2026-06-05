import { type NextRequest } from "next/server";
import { getCityMarkers } from "@/lib/cityMarkers";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/rateLimit";

function validateCountry(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return null;
  if (!/^[\p{L}\s\-'.()]+$/u.test(trimmed)) return null;
  return trimmed;
}

// Stricter cap than the other routes: each call fans out a large geocoding
// batch upstream, so 15 requests / minute per client is plenty for map use.
const RATE_LIMIT = { limit: 15, windowMs: 60_000 };

export async function GET(request: NextRequest) {
  const { limited, result } = enforceRateLimit(request, RATE_LIMIT, "city-markers");
  if (limited) return limited;

  const validated = validateCountry(request.nextUrl.searchParams.get("country"));
  if (!validated) return Response.json([], { headers: rateLimitHeaders(result) });

  const markers = await getCityMarkers(validated);
  return Response.json(markers, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      ...rateLimitHeaders(result),
    },
  });
}
