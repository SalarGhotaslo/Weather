"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./CitiesFilter.module.css";

const PAGE_SIZE = 48;

export default function CitiesFilter({
  cities,
  countryName,
}: {
  cities: string[];
  countryName: string;
}) {
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filtered = query
    ? cities.filter((c) => c.toLowerCase().includes(query))
    : cities;

  const visible = query ? filtered : filtered.slice(0, PAGE_SIZE);
  const hasMore = !query && cities.length > PAGE_SIZE;

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

      {hasMore && (
        <p className={styles.more}>
          Search above to see all {cities.length.toLocaleString()} cities
        </p>
      )}
    </div>
  );
}
