import { type NextRequest } from "next/server";
import { normalizeCountryName } from "@/lib/countries";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("country");
  if (!raw) return Response.json([]);
  const country = normalizeCountryName(raw);

  try {
    const res = await fetch(
      `https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(country)}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return Response.json([]);
    const data = await res.json();
    if (data.error || !Array.isArray(data.data)) return Response.json([]);
    const cities = (data.data as string[]).sort((a, b) => a.localeCompare(b));
    return Response.json(cities);
  } catch {
    return Response.json([]);
  }
}
