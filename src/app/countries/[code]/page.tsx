import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountryByCode, getCitiesForCountry } from "@/lib/countries";
import Header from "@/app/components/Header";
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

  const cities = await getCitiesForCountry(country.name.common);

  const capital = country.capital?.[0];

  return (
    <div className="min-h-screen bg-[#0e1723] flex flex-col">
      <Header />

      <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-6 flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#5a7d99] mb-5 flex-wrap">
          <Link href="/" className="hover:text-[#7ea8c2] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/countries" className="hover:text-[#7ea8c2] transition-colors">Countries</Link>
          <span>/</span>
          <span className="text-[#7ea8c2]">{country.name.common}</span>
        </nav>

        {/* Country hero */}
        <div className="bg-[#162535] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{country.flag}</span>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {country.name.common}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                {capital && (
                  <span className="text-[#7ea8c2] text-sm">
                    Capital: {capital}
                  </span>
                )}
                <span className="text-[#5a7d99] text-xs">{country.region}</span>
              </div>
            </div>
          </div>

          {/* Quick link to capital weather */}
          {capital && (
            <div className="mt-4 pt-4 border-t border-[#1e3347]">
              <Link
                href={`/?q=${encodeURIComponent(`${capital}, ${country.name.common}`)}`}
                className="inline-flex items-center gap-2 bg-[#3b87d6] hover:bg-[#2d6fb8] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ⛅ Weather in {capital}
              </Link>
            </div>
          )}
        </div>

        {/* Cities section */}
        <div>
          <h2 className="text-white font-semibold mb-1">Cities</h2>
          <p className="text-[#5a7d99] text-xs mb-4">
            Click any city to see its weather forecast
          </p>

          {cities.length > 0 ? (
            <CitiesFilter cities={cities} countryName={country.name.common} />
          ) : (
            <div className="bg-[#162535] rounded-xl p-6 text-center">
              <p className="text-[#7ea8c2] mb-2">
                City data unavailable for {country.name.common}.
              </p>
              <p className="text-[#5a7d99] text-sm">
                Use the search bar above to find a specific city.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-[#2a4055] py-4">
        City data from <span className="text-[#3a5a72]">CountriesNow</span>
        {" · "}
        Weather from <span className="text-[#3a5a72]">Open-Meteo</span>
      </footer>
    </div>
  );
}
