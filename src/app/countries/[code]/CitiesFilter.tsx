"use client";

import { useState } from "react";
import Link from "next/link";

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
      {/* Filter input */}
      <div className="mb-4">
        <input
          type="search"
          value={search}
          aria-label={`Search ${countryName} cities`}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${cities.length.toLocaleString()} cities…`}
          className="w-full bg-[#1c2f3f] border border-[#2a4055] rounded-lg px-4 py-2.5 text-white placeholder-[#5a7d99] focus:outline-none focus:border-[#3b87d6] text-sm transition-colors"
        />
        {query && (
          <p className="text-[#78a8c4] text-xs mt-2">
            {filtered.length} {filtered.length === 1 ? "city" : "cities"} matching &ldquo;{search.trim()}&rdquo;
          </p>
        )}
        {!query && (
          <p className="text-[#78a8c4] text-xs mt-2">
            Showing {Math.min(PAGE_SIZE, cities.length)} of {cities.length.toLocaleString()} cities · search to filter
          </p>
        )}
      </div>

      {/* City grid */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {visible.map((city) => (
            <Link
              key={city}
              href={`/?q=${encodeURIComponent(`${city}, ${countryName}`)}`}
              className="bg-[#162535] hover:bg-[#1c2f3f] rounded-lg px-3 py-2 text-sm text-white hover:text-[#3b87d6] transition-colors truncate text-center"
            >
              {city}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-[#78a8c4] text-sm">No cities match your search.</p>
      )}

      {hasMore && (
        <p className="text-[#78a8c4] text-xs mt-4 text-center">
          Search above to see all {cities.length.toLocaleString()} cities
        </p>
      )}
    </div>
  );
}
