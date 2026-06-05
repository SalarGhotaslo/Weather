"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Country } from "@/lib/countries";
import styles from "./CountriesFilter.module.css";

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
      <div className={styles.bar}>
        <input
          type="search"
          value={search}
          aria-label="Search countries or capitals"
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${countries.length} countries or capitals…`}
          className={styles.input}
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label="Filter countries by region"
          className={styles.select}
        >
          <option value="">All regions</option>
          {POPULAR_REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Alphabet jump navigation — only shown when not filtering */}
      {!isFiltered && (
        <div className={styles.alphabet} aria-label="Jump to letter">
          {letters.map((letter) => (
            <button
              key={letter}
              onClick={() => document.getElementById(`country-letter-${letter}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={styles.alphaBtn}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      {isFiltered && (
        <p className={styles.resultCount}>
          {filtered.length} {filtered.length === 1 ? "country" : "countries"} found
          {query ? ` matching "${search.trim()}"` : ""}
          {region ? ` in ${region}` : ""}
        </p>
      )}

      {displayLetters.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>🔍</div>
          <p className={styles.emptyText}>No countries found.</p>
          <button onClick={() => { setSearch(""); setRegion(""); }} className={styles.clearBtn}>
            Clear filters
          </button>
        </div>
      )}

      {displayLetters.map((letter) => (
        <section key={letter} id={`country-letter-${letter}`} className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.letter}>{letter}</h2>
            <div className={styles.rule} />
          </div>
          <div className={styles.grid}>
            {displayGrouped[letter].map((country) => (
              <Link
                key={country.cca2}
                href={`/countries/${country.cca2}`}
                className={`${styles.countryLink} group`}
              >
                <span className={styles.flag}>{country.flag}</span>
                <div className="min-w-0">
                  <div className={styles.countryName}>{country.name.common}</div>
                  {country.capital?.[0] && (
                    <div className={styles.capital}>{country.capital[0]}</div>
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
