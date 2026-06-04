# Code Review — Salar Weather

## Overview

- **Total files**: 39 source files across `src/lib/`, `src/app/`, `src/app/components/`, `src/app/api/`
- **Total lines**: ~6,300
- **Framework**: Next.js 16 App Router + Tailwind CSS v4
- **Test framework**: Vitest (169 tests, all passing)
- **Build**: Clean, no lint errors, no TypeScript errors

---

## Critical Issues

### 1. `getWeatherFact` doesn't handle snow showers (codes 85-86)
**File**: `src/lib/weather.ts:718-741`

Codes 85-86 (snow showers) now have a dedicated emoji (🌨️) and animation class (`weather-snowy weather-showers`), but `getWeatherFact` doesn't have a matching case. These codes fall through to the cold-temp or generic wind fact.

**Fix**: Add a case for `code >= 85 && code <= 86` before the `code >= 71` check.

### 2. `getWeatherAlert` doesn't handle snow showers (codes 85-86)
**File**: `src/lib/weather.ts:610-649`

Same gap — snow showers won't trigger a weather alert. The `code >= 71 && code <= 77` check excludes 85-86.

**Fix**: Add a case for `code >= 85 && code <= 86` before the general snow check, or include it in the existing snow alert.

### 3. `weather-sunny-glow` CSS class referenced but not defined
**Files**:
- `src/app/page.tsx:101` — landing page hero emoji
- `src/app/about/page.tsx:79` — about page hero emoji

The class `weather-sunny-glow` is applied in JSX but only exists in CSS as a print-style hide selector (in `globals.css:38`: `.weather-sunny-glow` is listed among animation classes to hide in print). It has no keyframe or style rule, so it does nothing in regular rendering. It was previously used alongside `weather-sunny` which does have an animation, but the landing page emoji (⛅) and about page emoji (⛅) are static without animation.

**Fix**: Either remove the class or add a CSS definition — e.g., `filter: drop-shadow(0 0 8px rgba(255,200,50,0.3))` to give the hero emoji a glow.

### 4. Duplicate import in test file
**File**: `src/lib/weather.test.ts:31-32`

```typescript
import { formatPopulation, normalizeCountryName, selectCandidates } from "./countries";
import { normalizeCountryName, selectCandidates } from "./countries"; // duplicate
```

Line 32 is a duplicate of `normalizeCountryName` and `selectCandidates` imports. Only `formatPopulation` from line 31 is used in the tests; lines 31-32 both resolve to the same file, so this compiles, but the redundancy should be cleaned up.

---

## Accessibility Issues

### 5. Missing `aria-hidden="true"` on decorative emojis
**File**: `src/app/day/[index]/page.tsx`

- Line 548: Main weather emoji in the hero card — `{info.emoji}` — lacks `aria-hidden="true"`. Same emoji on the home page (`page.tsx:275`) has it correctly.
- Line 662: Hourly strip emojis use `isNight ? "🌙" : getWeatherInfo(entry.weatherCode).emoji` — these are decorative but have no `aria-hidden`.
- Line 367: 5-day forecast card emojis — `{info.emoji}` — lacks `aria-hidden`.

These emojis are visual indicators that don't add information not already present in the adjacent text (temperature, weather label). They should all have `aria-hidden="true"`.

### 6. SVG `id` collision risk
**File**: `src/app/day/[index]/page.tsx:98`

The `TempCurve` component uses a `linearGradient` with `id="tempFill"`. If multiple `TempCurve` instances render on one page (possible with React rendering), SVG `id` attributes would collide since they're document-global. React does not scope SVG `id`s.

**Fix**: Use `useId()` or pass a unique suffix to the gradient `id`.

---

## Code Quality & Maintainability

### 7. `any` type cast for geoCentroid
**File**: `src/app/components/WorldMap.tsx:116`

```typescript
const centroid = geoCentroid(geo as any) as [number, number];
```

The `GeoCentroid` function from `d3-geo` expects a specific feature type. Using `as any` bypasses type safety. If `react-simple-maps` types change, this could silently break.

**Fix**: Define an interface for the geography feature shape or use `@types/geojson` types.

### 8. CSS selectors based on generated class names are fragile
**File**: `src/app/globals.css:150-193`

```css
[data-weather="thunderstorm"] [class*="bg-[#162535]"] {
  background-color: #151830 !important;
}
```

Tailwind v4's `bg-[#162535]` generates a class like `bg-\\#162535` (with escaped hash). These selectors depend on the exact class name generation, which could change across Tailwind versions. The `!important` usage is also maintenance-heavy.

**Alternative**: Use CSS custom properties (design tokens) switched per `data-weather` attribute instead.

### 9. `TimeGradient` uses deferred state and causes flash
**File**: `src/app/components/TimeGradient.tsx:26-31`

```typescript
useEffect(() => {
  const id = setTimeout(() => {
    setGradient(...);
  }, 0);
  return () => clearTimeout(id);
}, []);
```

The component returns `null` until the timeout fires, meaning the gradient overlay appears after a brief delay, causing a visual flash. The comment says this is to avoid "synchronous setState in effect body (linter rule)" but the real issue is that this makes the component non-functional during SSR.

**Fix**: Derive the gradient from `Date` directly (no client state needed), or use `typeof window !== "undefined"` to defer the initial render.

### 10. IIFE in JSX makes component harder to read
**File**: `src/app/page.tsx:329-335` and `src/app/page.tsx:392-416`

The trend indicator and sparkline are wrapped in IIFEs inside JSX. These should be extracted as separate functions or components:

```tsx
// Instead of:
{(() => { ... })()}

// Extract to:
function TrendIndicator({ temps }: { temps: number[] }) { ... }
function TempSparkline({ maxTemps }: { maxTemps: number[] }) { ... }
```

### 11. `getDressCode` doesn't account for snow showers (85-86)
**File**: `src/lib/weather.ts:679-681`

```typescript
if (weatherCode >= 51 && weatherCode <= 82) items.push("Waterproof jacket or umbrella");
if (weatherCode >= 71 && weatherCode <= 77) items.push("Waterproof & grip footwear");
```

Codes 85-86 (snow showers) are excluded from both the rain gear check (≤82) and the snow footwear check (≥77). They'd only get rain gear if temperature-based clothing is adequate, but never get the footwear suggestion.

---

## Edge Cases & Potential Bugs

### 12. `buildDayHref` may encode "undefined" for code
**File**: `src/app/page.tsx:49-52`

```typescript
function buildDayHref(index: number, lat: number, lon: number, name: string, code?: string) {
  const c = code ? `&code=${encodeURIComponent(code)}` : "";
```

This correctly short-circuits on falsy `code`. However, if `location.countryCode` is an empty string (which it won't be from Open-Meteo, but could be from other sources), it would also short-circuit. This is fine in practice but worth noting.

### 13. `formatHour` range is 0-23 but hourly data may include edge cases
**File**: `src/lib/weather.ts:337-341`

The function handles hours 0-23 correctly. During daylight saving transitions, some locales might see hour 24 or hour 25 on rare occasions (though Open-Meteo doesn't produce these). This is a very edge case and unlikely to be triggered.

### 14. `WorldMap` cities panel shows first 60 of potentially thousands
**File**: `src/app/components/WorldMap.tsx:142`

```typescript
? panelCities.slice(0, 60)
```

Large countries (US, Russia, China) may have thousands of cities. When unfiltered, only 60 of potentially 500+ are shown, which could be confusing. The "Search to filter" hint at the bottom helps, but users may not notice it.

---

## Testing Gaps

### 15. No tests for `getWeatherTheme`
**File**: `src/lib/weatherTheme.ts`

All 7 weather theme types and their gradient outputs have no tests. Gradient structure changes would not be caught by the test suite.

### 16. No tests for `countries.ts`
**File**: `src/lib/countries.ts`

Functions like `normalizeCountryName`, `getAllCountries`, `getCountryByCode`, `getCitiesForCountry`, and `formatPopulation` have no unit tests. The name mapping table in particular is prone to gaps.

### 17. No component/integration tests
No React Testing Library tests exist for any component. The weather search flow, keyboard navigation in autocomplete, country filter, map interactions, and error states are all untested at the component level.

---

## Performance

### 18. `getAllCountries` fetches all 250 countries on every page visit
**File**: `src/lib/countries.ts:35-43`

This is mitigated by `next: { revalidate: 86400 }` which caches for 24 hours. However, the initial render for every unique deploy or cache bust fetches ~15KB of country data. Consider pre-generating this as static JSON.

### 19. Hourly analysis runs on every day detail page render
**File**: `src/app/day/[index]/page.tsx:387-395`

`getHourlyAnalysis` runs on the server for every request (cached at 30 min). For a 6-day hourly dataset (144 entries), this is fast (~1-2ms), but doing it on every request vs caching the result could add up.

### 20. WorldMap geocodes up to 150 cities in parallel
**File**: `src/app/api/city-markers/route.ts:85-87`

150 parallel geocoding API calls is aggressive. Open-Meteo's free tier may rate-limit. Consider reducing the sample size to 50-80 or adding a small delay between batches.

---

## Recommendations (Priority Order)

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | Fix `getWeatherFact` and `getWeatherAlert` for codes 85-86 | 5 min | Missing weather facts/alerts for snow showers |
| P1 | Add `aria-hidden="true"` to decorative emojis | 5 min | Better screen reader experience |
| P1 | Add CSS definition for `weather-sunny-glow` or remove references | 2 min | Dead class that does nothing |
| P2 | Remove duplicate test import | 30 sec | Code cleanliness |
| P2 | Extract IIFEs from JSX in page.tsx | 10 min | Readability |
| P2 | Add tests for `weatherTheme.ts` and `countries.ts` | 30 min | Test coverage gap |
| P3 | Fix SVG `id` collision potential in TempCurve | 5 min | Prevents rare rendering bug |
| P3 | Replace `any` cast in WorldMap with proper types | 10 min | Type safety |
| P3 | Reduce parallel geocoding batch size in city-markers route | 2 min | Rate-limit safety |

---

## Summary

The codebase is well-structured with consistent patterns (Server Components by default, `'use client'` only when needed, proper param validation, security headers, accessibility basics). The project has good conventions documented in `AGENTS.md` and follows them consistently.

The most impactful improvements are:
1. **Close the 85-86 coverage gap** in weather facts and alerts (5 min, actually missing features)
2. **Fix decorative emoji accessibility** (5 min, easy win for screen readers)
3. **Add tests for the uncovered modules** (30 min, prevents regression)

No major architectural issues exist. The code is clean, well-organized, and follows Next.js 16 and React 19 best practices throughout.
