import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountryByCode, getCitiesForCountry, getCountriesByRegion, formatPopulation } from "@/lib/countries";
import Header from "@/app/components/Header";
import AppFooter from "@/app/components/AppFooter";
import CitiesFilter from "./CitiesFilter";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const country = await getCountryByCode(code);
  if (!country) return {};
  return {
    title: `${country.name.common} — Cities & Weather`,
    description: `Browse cities in ${country.name.common} and get weather forecasts. Capital: ${country.capital?.[0] ?? "N/A"}.`,
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const country = await getCountryByCode(code);
  if (!country) notFound();

  const [cities, regionCountries] = await Promise.all([
    getCitiesForCountry(country.name.common),
    getCountriesByRegion(country.region),
  ]);

  const sameRegion = regionCountries
    .filter((c) => c.cca2 !== country.cca2)
    .slice(0, 6);

  const capital = country.capital?.[0];

  return (
    <div className="min-h-screen bg-[#0e1723] flex flex-col">
      <Header />

      <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-6 flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-5 flex-wrap">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/countries" className="hover:text-white transition-colors">Countries</Link>
          <span>/</span>
          <span className="text-[var(--text-muted)]">{country.name.common}</span>
        </nav>

        {/* Country hero */}
        <div className="bg-[#162535] rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <span className="text-5xl shrink-0">{country.flag}</span>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white">{country.name.common}</h1>
              <p className="text-[var(--text-muted)] text-xs mt-0.5 italic truncate">{country.name.official}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                {capital && (
                  <span className="text-[var(--text-muted)] text-sm">📍 Capital: {capital}</span>
                )}
                <span className="text-[var(--text-muted)] text-xs">
                  {country.subregion ?? country.region}
                </span>
                {country.population != null && country.population > 0 && (
                  <span className="text-[var(--text-muted)] text-xs">
                    👥 {formatPopulation(country.population)} people
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="mt-4 pt-4 border-t border-[#1e3347] flex flex-wrap gap-2">
            {capital && (
              <Link
                href={`/?q=${encodeURIComponent(`${capital}, ${country.name.common}`)}`}
                className="inline-flex items-center gap-2 bg-[#2f6fb5] hover:bg-[#2d6fb8] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ⛅ Weather in {capital}
              </Link>
            )}
            <Link
              href={`/map`}
              className="inline-flex items-center gap-2 bg-[#162535] hover:bg-[#1c2f3f] border border-[#2a4055] text-[var(--text-muted)] hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              🗺️ View on map
            </Link>
          </div>
        </div>

        {/* Cities section */}
        <div>
          <h2 className="text-white font-semibold mb-1">Cities</h2>
          <p className="text-[var(--text-muted)] text-xs mb-4">
            Click any city to see its weather forecast
          </p>

          {cities.length > 0 ? (
            <CitiesFilter cities={cities} countryName={country.name.common} />
          ) : (
            <div className="bg-[#162535] rounded-xl p-6 text-center">
              <p className="text-[var(--text-muted)] mb-2">
                City data unavailable for {country.name.common}.
              </p>
              <p className="text-[var(--text-muted)] text-sm">
                Use the search bar above to find a specific city.
              </p>
            </div>
          )}
        </div>

        {/* Same region */}
        {sameRegion.length > 0 && (
          <div className="mt-8">
            <h2 className="text-white font-semibold mb-3">
              More in {country.subregion ?? country.region}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {sameRegion.map((c) => (
                <Link
                  key={c.cca2}
                  href={`/countries/${c.cca2}`}
                  className="flex items-center gap-2 bg-[#162535] hover:bg-[#1c2f3f] rounded-lg px-3 py-2.5 transition-colors group"
                >
                  <span className="text-lg shrink-0">{c.flag}</span>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-medium truncate group-hover:text-[var(--text-accent)] transition-colors">
                      {c.name.common}
                    </p>
                    {c.capital?.[0] && (
                      <p className="text-[var(--text-muted)] text-[10px] truncate">{c.capital[0]}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
