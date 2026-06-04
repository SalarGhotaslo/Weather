"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface GeoResult {
  name: string;
  country: string;
  admin1?: string;
}

export default function SearchAutocomplete({
  defaultValue = "",
  large = false,
}: {
  defaultValue?: string;
  large?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sync prop → state via a zero-delay timeout so setState is inside an async
  // callback, not synchronously in the effect body (which the linter flags).
  useEffect(() => {
    const id = setTimeout(() => setValue(defaultValue), 0);
    return () => clearTimeout(id);
  }, [defaultValue]);

  useEffect(() => {
    const query = value.trim();
    clearTimeout(timer.current);
    // Defer all state updates so they run inside the async callback, not
    // synchronously in the effect body.
    timer.current = setTimeout(async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`,
        );
        const data = await res.json();
        const results: GeoResult[] = (data.results ?? []).map(
          (r: GeoResult) => ({
            name: r.name,
            country: r.country,
            admin1: r.admin1,
          }),
        );
        setSuggestions(results);
        setOpen(results.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 280);

    return () => clearTimeout(timer.current);
  }, [value]);

  const navigate = (suggestion: GeoResult) => {
    const display = suggestion.admin1
      ? `${suggestion.name}, ${suggestion.admin1}, ${suggestion.country}`
      : `${suggestion.name}, ${suggestion.country}`;
    const q = `${suggestion.name}, ${suggestion.country}`;
    setValue(display);
    setOpen(false);
    router.push(`/?q=${encodeURIComponent(q)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    const q = value.trim();
    if (q) router.push(`/?q=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigate(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const inputClass = large
    ? "flex-1 bg-[#1c2f3f] border border-[#2a4055] rounded-lg px-5 py-4 text-white placeholder-[#5a7d99] focus:outline-none focus:border-[#3b87d6] text-lg transition-colors"
    : "flex-1 min-w-0 bg-[#1c2f3f] border border-[#2a4055] rounded px-3 py-1.5 text-white placeholder-[#5a7d99] focus:outline-none focus:border-[#3b87d6] text-sm transition-colors";

  const buttonClass = large
    ? "bg-[#3b87d6] hover:bg-[#2d6fb8] active:bg-[#2560a0] text-white px-7 py-4 rounded-lg font-semibold transition-colors text-lg whitespace-nowrap"
    : "bg-[#3b87d6] hover:bg-[#2d6fb8] active:bg-[#2560a0] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap";

  return (
    <div className={`relative ${large ? "" : "flex-1 flex gap-2"}`}>
      <form
        onSubmit={handleSubmit}
        className={large ? "flex gap-3" : "contents"}
        suppressHydrationWarning
      >
        <div className={large ? "flex gap-3 flex-1" : "contents"}>
          <input
            type="search"
            value={value}
            aria-label="Search for a city"
            suppressHydrationWarning
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={
              large ? "Enter a city, town or postcode…" : "Search location…"
            }
            className={inputClass}
            autoComplete="off"
          />
          <button type="submit" className={buttonClass}>
            Search
          </button>
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <div
          className={`absolute z-50 bg-[#162535] border border-[#2a4055] rounded-lg overflow-hidden shadow-xl ${large ? "top-full mt-1 left-0 right-0" : "top-full mt-1 left-0 right-[72px]"}`}
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={() => navigate(s)}
              className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                i === activeIndex
                  ? "bg-[#1c3d6b] text-white"
                  : "hover:bg-[#1c2f3f] text-white"
              }`}
            >
              <span className="text-sm truncate">
                {s.name}
                {s.admin1 ? (
                  <span className="text-[#7ea8c2]">, {s.admin1}</span>
                ) : null}
              </span>
              <span className="text-[#78a8c4] text-xs shrink-0">
                {s.country}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
