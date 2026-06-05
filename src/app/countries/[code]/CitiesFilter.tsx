"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./CitiesFilter.module.css";

const PAGE_SIZE = 64;

export default function CitiesFilter({
  cities,
  countryName,
  countryCode,
}: {
  cities: string[];
  countryName: string;
  countryCode?: string;
}) {
  const [search, setSearch] = useState("");
  const [majorCities, setMajorCities] = useState<string[]>([]);

  useEffect(() => {
    if (!countryCode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/city-markers?country=${encodeURIComponent(countryName)}`);
        if (!res.ok) return;
        const markers: { name: string }[] = await res.json();
        if (cancelled) return;
        const citySet = new Set(cities.map((c) => c.toLowerCase()));
        const valid = markers
          .map((m) => m.name)
          .filter((n) => citySet.has(n.toLowerCase()))
          .slice(0, 10);
        setMajorCities(valid);
      } catch {
        // silently ignore — popular section simply won't appear
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [countryCode, countryName, cities]);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? cities.filter((c) => c.toLowerCase().includes(query))
    : cities;

  const majorSet = new Set(majorCities.map((c) => c.toLowerCase()));
  const rest = query ? filtered : filtered.filter((c) => !majorSet.has(c.toLowerCase()));
  const visible = query ? rest : rest.slice(0, PAGE_SIZE);
  const hasMore = !query && rest.length > PAGE_SIZE;

  return (
    <div>
      <div className={styles.filterBlock}>
        <input
          type="search"
          value={search}
          aria-label={`Search ${countryName} cities`}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${cities.length.toLocaleString()} cities…`}
          className={styles.input}
        />
        {query ? (
          <p className={styles.note}>
            {filtered.length} {filtered.length === 1 ? "city" : "cities"} matching &ldquo;{search.trim()}&rdquo;
          </p>
        ) : (
          <p className={styles.note}>
            Showing {Math.min(PAGE_SIZE, cities.length)} of {cities.length.toLocaleString()} cities · search to filter
          </p>
        )}
      </div>

      {!query && majorCities.length > 0 && (
        <div className={styles.popularBlock}>
          <h3 className={styles.popularTitle}>Popular Cities</h3>
          <div className={styles.grid}>
            {majorCities.map((city) => (
              <Link
                key={city}
                href={`/?q=${encodeURIComponent(`${city}, ${countryName}`)}`}
                className={styles.cityLink}
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      )}

      {visible.length > 0 ? (
        <div className={styles.grid}>
          {visible.map((city) => (
            <Link
              key={city}
              href={`/?q=${encodeURIComponent(`${city}, ${countryName}`)}`}
              className={styles.cityLink}
            >
              {city}
            </Link>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No cities match your search.</p>
      )}

      {hasMore && !query && (
        <p className={styles.more}>
          Search above to see all {cities.length.toLocaleString()} cities
        </p>
      )}
    </div>
  );
}
