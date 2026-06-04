# Code Review — Salar Weather

Two review-and-improve passes covering: weather-matched backgrounds, accessibility,
current-time-in-city awareness, and live local clock. Each pass ends with a review.

- **Framework**: Next.js 16 App Router + Tailwind CSS v4
- **Tests**: Vitest — **208 unit tests passing** (was 192) + **6 Playwright/axe a11y
  checks passing** (new automated accessibility gate)
- **Build**: clean (no TypeScript or ESLint errors)

---

## What changed in this work

### 1. Weather- and time-aware backgrounds (`src/lib/weatherTheme.ts`)
- `getWeatherTheme(weatherCode, isNight?)` now returns a **day/night gradient pair**
  per weather type and a `isNight` flag.
- Backgrounds are now strongly, recognisably weather-coloured:
  - **Clear / sunny → warm golden-orange** sky (was a near-black brown).
  - Partly cloudy → blue sky with a warm sun hint; overcast → soft grey;
    fog → muted grey; rain → deep cool blue; snow → bright icy blue;
    thunderstorm → charged purple.
  - Every type has a darker **night** variant (clear night = deep starlit blue, etc.).
- Each gradient keeps a dark base toward the bottom so dark cards and white text
  stay readable on top.
- New `getWeatherThemeType(code)` extracted so `WeatherBackground` can pick effects
  without rebuilding a gradient string.

### 2. Current time within the city
- New helpers in `src/lib/weather.ts` (all server-safe, Intl-based, unit-tested):
  - `getCityHour(timezone, now?)` — current hour 0–23 in the city's timezone.
  - `formatCityTime(timezone, now?)` — `HH:MM` snapshot for SSR.
  - `isNightHour(hour, sunriseHour, sunsetHour)` — day/night decision.
  - `getTimeOfDayLabel(hour)` — "Morning", "Evening", "Night", …
- **`LocalTime` component** (`src/app/components/LocalTime.tsx`) — a live clock that
  ticks every second, seeded with the server value (no hydration flash), shown on the
  home hero and the day-detail header. Tells the user the actual local time in that
  city/country.
- **Day detail now reflects the current time in the city**:
  - Page theme + ambient effect use the city's real day/night state (today only).
  - A **"Right now in <city>"** strip shows the current hour's temperature, sky,
    rain chance and wind, plus a time-of-day / day-night label.
  - The **current hour is ringed and labelled "Now"** in the hourly strip and in the
    "best times outside" 24-hour strip.
- Home page picks day/night styling from the searched city's local time and swaps the
  hero sun for a 🌙 on clear nights; `WeatherBackground` renders a moon-and-stars sky
  at night for clear / partly-cloudy.

### 3. Accessibility
- **Colour contrast (the bulk of the reported issues)**: the failing low-contrast text
  colours `#2a4055`, `#3a5a72`, `#1e3347` (used for axis labels, "last year" figures,
  night-dimmed hourly values, footer text, etc.) were replaced with a single accessible
  token `--text-faint: #7693ac`, which meets WCAG AA (≥4.5:1) on the dark backgrounds.
  Defined on both `:root` and `[data-weather]` so it resolves on every page.
- **Accent contrast**: `--accent-color` darkened to `#2f6fb5` so **white text on the
  active day pill** meets AA; `--text-accent` brightened to `#5aa0dd` (and thunderstorm
  to `#a98fe0`) so small accent text passes on the card backgrounds.
- **`prefers-reduced-motion`**: a global media query disables the ambient weather
  animations (rain, snow, clouds, sun spin, lightning) and emoji motion (WCAG 2.3.3).
- **Semantics**: `aria-current="page"` on the breadcrumb leaf and active day pill;
  `aria-current="time"` on the current-hour cells. The colour-only "best times" strip,
  its axis labels and legend are marked `aria-hidden` because the same information is
  available textually in the summary sentence and the best/worst window cards.
- `LocalTime` exposes an `aria-label` ("Local time in <city> HH:MM") on a `<time>`.

### 4. Tests
- `weatherTheme.test.ts`: day vs night gradients differ; night variants exist for every
  type; `getWeatherThemeType` mapping.
- `weather.test.ts`: `getCityHour` (UTC, +offset, −offset/DST, invalid tz, no tz),
  `formatCityTime`, `isNightHour`, `getTimeOfDayLabel`.

### 5. Weather-tinted card colours (follow-up)
- Muted/accent text was tokenised app-wide (`--text-muted`, `--text-faint`,
  `--text-accent`) so themes can retint cohesively instead of cards always being cool blue.
- **Sunny/clear now uses warm amber cards** (`--card-bg` etc.) with amber accents and a
  deep-orange active pill; rain leans cooler blue; overcast/fog are desaturated grey.
  All retinted tokens were checked to keep WCAG AA contrast on their own card backgrounds.

### 6. Automated accessibility (axe) check in CI (follow-up)
- Added Playwright + `@axe-core/playwright`: `e2e/a11y.spec.ts` scans home (landing &
  searched), day detail (today & future), about, and countries, failing on any
  serious/critical WCAG 2.0/2.1 A & AA violation.
- `npm run test:a11y` runs it locally; `.github/workflows/ci.yml` runs lint → unit tests →
  build → axe on every push/PR. `.npmrc` pins `legacy-peer-deps=true` for reproducible
  installs (react-simple-maps peers React 18).

---

## Review — Pass 1 findings

| # | Area | Finding | Status |
|---|------|---------|--------|
| 1 | Backgrounds | Sunny background was a dark muddy brown, not "warm orange". | **Fixed** — golden-orange day gradient. |
| 2 | A11y contrast | ~39 contrast failures on the day page from `#2a4055`/`#3a5a72`/`#1e3347` text. | **Fixed** via `--text-faint` token. |
| 3 | Current time | No indication of the time in the viewed city; "today" ignored the current hour. | **Fixed** — `LocalTime` + "Right now" + current-hour highlight. |
| 4 | Variable shadow | Inner `isNight` in the hourly map shadowed the new page-level `isNight`. | **Fixed** — renamed to `hourIsNight`. |
| 5 | Motion | Infinite ambient animations had no reduced-motion guard. | **Fixed** — `prefers-reduced-motion` block. |

## Review — Pass 2 findings

| # | Area | Finding | Status |
|---|------|---------|--------|
| 6 | A11y contrast | White text on `--accent-color` (#3b87d6) active day pill was ~3.8:1 (< AA). | **Fixed** — accent darkened to `#2f6fb5`. |
| 7 | A11y semantics | Breadcrumb leaf and active day pill lacked `aria-current`. | **Fixed**. |
| 8 | A11y colour-only | "Best times outside" strip conveyed rating by colour + `title` only. | **Fixed** — strip/legend `aria-hidden`; text equivalents retained. |
| 9 | Night realism | Clear sky at night still showed a sun emoji and sun rays. | **Fixed** — moon + stars at night. |
| 10 | Hydration | A naive live clock would flash/mismatch on hydration. | **Avoided** — seeded with server `initial` value. |

## Review — Pass 3 (verified by the new axe gate)

Running the axe check surfaced **real serious/critical violations that hand-computation
had missed** — exactly why the automated gate is valuable. All were fixed and the suite
now passes on all six routes.

| # | Route(s) | axe finding | Fix |
|---|----------|-------------|-----|
| 11 | all | `select-name` (critical) — region filter `<select>` had no accessible name. | Added `aria-label="Filter countries by region"`. |
| 12 | home, about, day, countries | `color-contrast` — white on `#3b87d6` Search buttons = 3.73:1. | Button fills darkened to `#2f6fb5` (≈5:1). |
| 13 | about | `color-contrast` — `#3b87d6` chip text on `#1c3450` = 3.39:1. | Tokenised to `--text-accent` `#6aaae0` (≈5:1). |
| 14 | day detail | `scrollable-region-focusable` (serious) — horizontal hourly strip wasn't keyboard-reachable. | Added `tabIndex={0}` + `role="group"` + label (also map instruction bar). |
| 15 | day detail (today) | `color-contrast` — `text-red-400/70` "Times to avoid" = 3.42:1. | Removed opacity from red labels/chips. |
| 16 | day detail (today) | `color-contrast` — faint wind text on the lighter "Now" cell = 3.88:1. | Current-hour cell uses brighter `--text-muted`. |

**Result:** `npm run test:a11y` → 6/6 routes pass, 0 serious/critical violations.

## Review — Pass 4 (browser review via Playwright/Chromium)

Drove a real headless Chromium (`scripts/visual-check.mjs`) over home (day & night
cities), day detail, countries and the landing page at desktop & mobile widths, then
inspected the screenshots. Findings, all fixed:

| # | Finding | Fix |
|---|---------|-----|
| 17 | **Local time wrong** — the day page showed the host (UK) time for every city (e.g. Tehran matched London) because `buildDayHref` on the home page never passed `tz`. | Pass `location.timezone` into both day links; `GeolocateButton` now passes the browser timezone too. |
| 18 | **Redundant copy** — the "Right now" strip read "· Night · Night" (time-of-day label + a separate day/night word). | Dropped the duplicate day/night word; the 🌙/🌤️ emoji + time-of-day label already convey it. |
| 19 | **Autocomplete dropdown auto-opened** on every page that seeds the header search with a default value (searched city, day page), and fired a geocoding request on load. | Gate suggestion fetching/opening behind real user interaction (`interacted` ref) — also removes an unnecessary network call per page load. |

Confirmed visually after the fixes: clear nights render a moon + stars and a 🌙 hero;
the warm-amber sunny cards and cool rain/snow cards read correctly; mobile layout holds.

---

## Remaining / future opportunities (not blocking)

These are pre-existing observations carried forward; none are regressions from this work.

1. **`TimeGradient` overlap** (`src/app/components/TimeGradient.tsx`): the per-card
   time-of-day overlay now overlaps conceptually with the page-level day/night theme.
   It still adds a subtle hero tint, but the two could be unified.
2. **`getAllCountries` / map geocoding** (`src/lib/countries.ts`,
   `src/app/api/city-markers/route.ts`): country data and up-to-150 parallel geocode
   calls could be pre-generated / batched. Mitigated by 24 h caching.
3. **`any` cast for `geoCentroid`** (`src/app/components/WorldMap.tsx`): still uses
   `geo as any`; a GeoJSON feature type would restore type safety.
4. **No component-level tests**: the lib layer is well covered (208 tests) and the axe
   gate covers rendered pages, but there are no React Testing Library tests for search
   flow, autocomplete keyboard nav, or the `LocalTime` tick behaviour.

---

## Summary

The passes deliver the requested outcomes: backgrounds now clearly match the weather
(warm orange for sun, icy blue for snow, etc.) **and** the time of day, with warm/cool
**card** colours to match; the day page shows the city's correct live local time and the
weather for the current hour in that city; the accessibility issues — dominated by
colour-contrast failures — are resolved (verified by an automated axe gate in CI), with
reduced-motion support and `aria-current` semantics on top; and a real-browser review
caught and fixed the timezone, redundant-copy, and autocomplete-dropdown issues.

All **208 unit tests** and **6 axe accessibility checks** pass, and the production build
is clean.
