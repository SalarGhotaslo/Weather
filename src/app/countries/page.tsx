import Link from "next/link";
import { getAllCountries, type Country } from "@/lib/countries";
import Header from "@/app/components/Header";

export const revalidate = 86400;

export default async function CountriesPage() {
  let countries: Country[];
  try {
    countries = await getAllCountries();
  } catch {
    return (
      <div className="min-h-screen bg-[#0e1723] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#7ea8c2]">Failed to load countries. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Group alphabetically
  const grouped = countries.reduce<Record<string, Country[]>>((acc, country) => {
    const letter = country.name.common[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(country);
    return acc;
  }, {});
  const letters = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-[#0e1723] flex flex-col">
      <Header />

      <main className="mx-auto w-full max-w-5xl px-4 py-6 flex-1">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[#5a7d99] mb-4">
          <Link href="/" className="hover:text-[#7ea8c2] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#7ea8c2]">Countries</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">All Countries</h1>
          <p className="text-[#5a7d99] text-sm mt-1">
            {countries.length} countries · click to browse cities and weather
          </p>
        </div>

        {letters.map((letter) => (
          <section key={letter} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[#3b87d6] font-bold text-lg w-6">{letter}</span>
              <div className="flex-1 h-px bg-[#1e3347]" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {grouped[letter].map((country) => (
                <Link
                  key={country.cca2}
                  href={`/countries/${country.cca2}`}
                  className="flex items-center gap-2.5 bg-[#162535] hover:bg-[#1c2f3f] rounded-lg px-3 py-2.5 transition-colors group"
                >
                  <span className="text-xl shrink-0">{country.flag}</span>
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate group-hover:text-[#3b87d6] transition-colors">
                      {country.name.common}
                    </div>
                    {country.capital?.[0] && (
                      <div className="text-[#5a7d99] text-xs truncate">
                        {country.capital[0]}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="text-center text-xs text-[#2a4055] py-4">
        Country data from <span className="text-[#3a5a72]">REST Countries</span>
      </footer>
    </div>
  );
}
