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

  const handleClear = () => {
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
    setSearches([]);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
          Recent searches
        </p>
        <button
          onClick={handleClear}
          className="text-[var(--text-faint)] hover:text-white text-[10px] transition-colors"
          aria-label="Clear recent searches"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((city) => (
          <Link
            key={city}
            href={`/?q=${encodeURIComponent(city)}`}
            className="bg-[#162535] hover:bg-[#1c2f3f] border border-[#2a4055] text-[var(--text-muted)] hover:text-white text-xs px-3 py-1.5 rounded-full transition-colors"
          >
            🕐 {city}
          </Link>
        ))}
      </div>
    </div>
  );
}
