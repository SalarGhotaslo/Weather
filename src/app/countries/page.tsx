import type { Metadata } from "next";
import Link from "next/link";
import { getAllCountries, type Country } from "@/lib/countries";
import Header from "@/app/components/Header";
import AppFooter from "@/app/components/AppFooter";
import CountriesFilter from "./CountriesFilter";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "All Countries",
  description: "Browse weather for all 250 countries — click any country to explore its cities and get a forecast.",
};

export default async function CountriesPage() {
  let countries: Country[];
  try {
    countries = await getAllCountries();
  } catch {
    return (
      <div className="min-h-screen bg-[#0e1723] flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center">
          <p className="text-[var(--text-muted)]">Failed to load countries. Please try again later.</p>
        </main>
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

      <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-6 flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-4">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--text-muted)]">Countries</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">All Countries</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {countries.length} countries · search, filter by region, or click to browse cities
          </p>
        </div>

        <CountriesFilter countries={countries} grouped={grouped} letters={letters} />
      </main>

      <AppFooter />
    </div>
  );
}
