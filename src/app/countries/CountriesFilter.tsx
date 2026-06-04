"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Country } from "@/lib/countries";

const POPULAR_REGIONS = [
  "Europe", "Asia", "Africa", "Americas", "Oceania", "Antarctic",
];

export default function CountriesFilter({
  countries,
  grouped,
  letters,
}: {
  countries: Country[];
  grouped: Record<string, Country[]>;
  letters: string[];
}) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [region, setRegion] = useState("");

  const query = search.trim().toLowerCase();
  const filtered = countries.filter((c) => {
    const matchesSearch =
      !query || c.name.common.toLowerCase().includes(query) || (c.capital?.[0] ?? "").toLowerCase().includes(query);
    const matchesRegion = !region || c.region === region;
    return matchesSearch && matchesRegion;
  });

  const filteredGrouped = filtered.reduce<Record<string, Country[]>>((acc, c) => {
    const letter = c.name.common[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(c);
    return acc;
  }, {});
  const filteredLetters = Object.keys(filteredGrouped).sort();

  const isFiltered = query || region;
  const displayGrouped = isFiltered ? filteredGrouped : grouped;
  const displayLetters = isFiltered ? filteredLetters : letters;

  return (
    <div>
      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${countries.length} countries or capitals…`}
          className="flex-1 bg-[#162535] border border-[#2a4055] rounded-lg px-4 py-2.5 text-white placeholder-[#5a7d99] focus:outline-none focus:border-[#3b87d6] text-sm transition-colors"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="bg-[#162535] border border-[#2a4055] rounded-lg px-3 py-2.5 text-[#7ea8c2] focus:outline-none focus:border-[#3b87d6] text-sm transition-colors"
        >
          <option value="">All regions</option>
          {POPULAR_REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {isFiltered && (
        <p className="text-[#5a7d99] text-xs mb-4">
          {filtered.length} {filtered.length === 1 ? "country" : "countries"} found
          {query ? ` matching "${search.trim()}"` : ""}
          {region ? ` in ${region}` : ""}
        </p>
      )}

      {displayLetters.length === 0 && (
        <div className="bg-[#162535] rounded-xl p-8 text-center">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-[#7ea8c2]">No countries found.</p>
          <button
            onClick={() => { setSearch(""); setRegion(""); }}
            className="mt-3 text-[#3b87d6] text-sm hover:text-white transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {displayLetters.map((letter) => (
        <section key={letter} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[#3b87d6] font-bold text-lg w-6">{letter}</span>
            <div className="flex-1 h-px bg-[#1e3347]" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {displayGrouped[letter].map((country) => (
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
    </div>
  );
}
