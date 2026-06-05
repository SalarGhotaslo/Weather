"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./SearchAutocomplete.module.css";

interface GeoResult {
  name: string;
  country: string;
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
  // Tracks whether the current value came from the user typing. We only fetch
  // suggestions / open the dropdown after real interaction — otherwise every
  // page that seeds the header search with a default value (a searched city,
  // the day page) would pop its dropdown open on load and fire a geocode call.
  const interacted = useRef(false);

  // Sync external defaultValue (e.g. after client navigation) without opening
  // the panel. Done in a zero-delay timeout so the state update runs inside an
  // async callback rather than synchronously in the effect body.
  useEffect(() => {
    const id = setTimeout(() => {
      interacted.current = false;
      setValue(defaultValue);
      setOpen(false);
      setSuggestions([]);
    }, 0);
    return () => clearTimeout(id);
  }, [defaultValue]);

  useEffect(() => {
    if (!interacted.current) return; // wait for the user to type
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
    // Keep it simple: just "City, Country" (no admin1/region clutter).
    const q = `${suggestion.name}, ${suggestion.country}`;
    setValue(q);
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

  const inputClass = large ? styles.inputLarge : styles.inputSmall;
  const buttonClass = large ? styles.buttonLarge : styles.buttonSmall;

  return (
    <div className={`${styles.wrapper} ${large ? "" : styles.wrapperSmall}`}>
      <form
        onSubmit={handleSubmit}
        className={large ? styles.formLarge : styles.formSmall}
        suppressHydrationWarning
      >
        <div className={large ? styles.innerLarge : styles.innerSmall}>
          <input
            type="search"
            value={value}
            aria-label="Search for a city"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            // Only reference the listbox while it is actually rendered — a
            // dangling aria-controls/activedescendant id is itself an a11y fault.
            aria-controls={open && suggestions.length > 0 ? "search-suggestions" : undefined}
            aria-autocomplete="list"
            aria-activedescendant={
              open && suggestions.length > 0 && activeIndex >= 0
                ? `search-option-${activeIndex}`
                : undefined
            }
            suppressHydrationWarning
            onChange={(e) => {
              interacted.current = true;
              setValue(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={
              large ? "Enter a city, town or postcode…" : "Search location…"
            }
            className={inputClass}
            autoComplete="off"
          />
          <button
            type="submit"
            className={buttonClass}
            suppressHydrationWarning
          >
            Search
          </button>
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <div
          id="search-suggestions"
          role="listbox"
          aria-label="City suggestions"
          className={`${styles.dropdown} ${large ? styles.dropdownLarge : styles.dropdownSmall}`}
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              id={`search-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => navigate(s)}
              className={`${styles.option} ${i === activeIndex ? styles.optionActive : styles.optionIdle}`}
            >
              <span className={styles.optionName}>{s.name}</span>
              <span className={styles.optionCountry}>{s.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
