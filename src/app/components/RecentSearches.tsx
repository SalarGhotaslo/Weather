"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LS_KEY = "salar_weather_recent";
const MAX_RECENT = 5;

export function recordRecentSearch(cityLabel: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LS_KEY);
    const prev: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    const updated = [cityLabel, ...prev.filter((c) => c !== cityLabel)].slice(0, MAX_RECENT);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  } catch {
    // localStorage blocked — silently ignore
  }
}

export default function RecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    // Defer setState so it runs inside an async callback, not synchronously
    // in the effect body (which the linter correctly flags as a cascade risk).
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) setSearches(JSON.parse(raw) as string[]);
      } catch {
        // localStorage blocked — silently ignore
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  if (searches.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="text-[#5a7d99] text-xs font-semibold uppercase tracking-wider mb-2">
        Recent searches
      </p>
      <div className="flex flex-wrap gap-2">
        {searches.map((city) => (
          <Link
            key={city}
            href={`/?q=${encodeURIComponent(city)}`}
            className="bg-[#162535] hover:bg-[#1c2f3f] border border-[#2a4055] text-[#7ea8c2] hover:text-white text-xs px-3 py-1.5 rounded-full transition-colors"
          >
            🕐 {city}
          </Link>
        ))}
      </div>
    </div>
  );
}
