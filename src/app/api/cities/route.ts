import { type NextRequest } from "next/server";
import { normalizeCountryName } from "@/lib/countries";

function validateCountry(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return null;
  // Only letters, spaces, hyphens, apostrophes, periods, parentheses — all valid country name chars
  if (!/^[\p{L}\s\-'.()]+$/u.test(trimmed)) return null;
  return trimmed;
}

export async function GET(request: NextRequest) {
  const validated = validateCountry(request.nextUrl.searchParams.get("country"));
  if (!validated) return Response.json([]);
  const country = normalizeCountryName(validated);

  try {
    const res = await fetch(
      `https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(country)}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return Response.json([]);
    const data = await res.json();
    if (data.error || !Array.isArray(data.data)) return Response.json([]);
    const cities = (data.data as string[]).sort((a, b) => a.localeCompare(b));
    return Response.json(cities, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    });
  } catch {
    return Response.json([]);
  }
}
