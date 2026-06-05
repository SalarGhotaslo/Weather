# Salar Weather

## Project overview
A global city weather app. Users search any city (with autocomplete), browse all world countries and their cities, and navigate an interactive SVG world map. Built with Next.js 16 App Router + Tailwind CSS v4 + react-simple-maps.

Key features:
- Search autocomplete (Open-Meteo geocoding, live dropdown, recent searches in localStorage)
- 5-day forecast with temperature range bars, stats strip, sparkline trend
- Day detail: historical YoY comparison (YoyStat tiles), UV/wind/rain detail, **best times outside** (hourly colour strip + scored windows with chip conditions)
- Countries browser: all 250 countries A–Z with flag, capital, city list
- Interactive world map: hover country → cities panel; click → zoom in + city markers; hover marker → label (click-only labels, never permanent)

## Commands
- `npm run dev` — start dev server (http://localhost:3000)
- `npm run build` — production build (also runs type check)
- `npm run test` — run Vitest unit tests (`src/**/*.test.ts`)
- `npm run test:watch` — run tests in watch mode
- `npm run test:coverage` — Vitest with v8 coverage + 80% threshold gate (logic layer)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — run ESLint
- `npm run test:a11y` — Playwright axe accessibility scan (needs a prior `npm run build`)
- `npm run audit:ci` — `npm audit` for production deps, fails on high+ severity
- `npm run verify` — lint + typecheck + test:coverage + audit:ci (the pre-push gate, minus a11y)
- `npm run verify:a11y` — build + axe scan

### Git hooks (husky)
- **pre-commit** — `lint` (fast feedback)
- **pre-push** — full scan: `verify` (lint, typecheck, tests+coverage, audit) then build + axe
  a11y. Skip the slow a11y step with `SKIP_A11Y=1 git push`.

### Coverage policy
The 80% gate (`vitest.config.ts`) targets the **logic layer** — `src/lib/**` and the
`*View.ts` view-model builders — where unit tests are meaningful. Presentational
Server/Client components and pages are verified by TypeScript, the production build,
and the Playwright axe/e2e suite, not line-coverage.

## Routes
| Route | Description |
|-------|-------------|
| `/` | Home — `?q=CityName` fetches and renders 7-day forecast |
| `/day/[index]` | Day detail — `?lat=&lon=&name=&code=` params required; lat/lon validated; index 0–6 |
| `/countries` | All countries A–Z browser with search + region filter + alphabet jump nav |
| `/countries/[code]` | Cities for a country (ISO alpha-2 e.g. `GB`) + same-region section |
| `/map` | Interactive world map with instruction bar |
| `/about` | Static page: features, data sources, tech stack, security note |
| `/api/cities?country=Name` | Server proxy → CountriesNow, validated + cached 24 h, rate-limited 60/min |
| `/api/city-markers?country=Name` | Geocodes major cities for map markers (area-scaled 2–52), concurrency-limited fan-out (logic in `lib/cityMarkers.ts`), validated + cached 24 h, rate-limited 15/min |
| `/api/current?lat=&lon=[&name=]` / `?city=&country=` / `?country=` | Current temp + feels-like + weather code + IANA timezone for the map's inline weather card. 3 modes: direct coords, named city, or country→capital. Validated + cached 30 min, rate-limited 60/min |

## Code conventions
- **Page/component size:** keep route + component files under ~200 lines. Extract
  presentational subcomponents and pure `*View.ts` view-model builders (see
  `home/homeView.ts`, `day/[index]/dayView.ts`) rather than letting pages grow.
- **Styling — CSS Modules:** each component/page has a colocated `*.module.css`.
  Tailwind v4 powers the styles via `@apply` inside the module, with
  `@reference "<path>/globals.css";` at the top so theme tokens/utilities resolve.
  Keep one design-token source of truth in `globals.css`. **Caveat:** variant
  markers like `group` / `peer` can't be `@apply`'d (they'd be module-scoped) —
  add them as literal global classes in JSX alongside `styles.x`. Dynamic
  per-state colour ternaries also stay literal Tailwind utilities.
- Server Components by default; only add `'use client'` for state/effects/browser APIs
- Fetch in Server Components with `next: { revalidate: N }`:
  - Weather: `1800` (30 min)
  - Countries / cities: `86400` (24 h)
- Utility helpers live in `src/lib/`; types alongside their functions
- Use `@/` path alias for `src/`
- Always extend `src/lib/*.test.ts` when adding utility functions
- `'use client'` components that use browser/map libraries must be wrapped with `dynamic(() => import(...), { ssr: false })` inside another `'use client'` loader component (see `WorldMapLoader.tsx`)
- `params` and `searchParams` are `Promise<{...}>` — always `await` them
- `themeColor` lives in a `viewport` export (not `metadata`) — Next.js 16 requirement
- `react-simple-maps`, `d3-geo`, `d3-zoom`, `topojson-client` are listed in `transpilePackages` in `next.config.ts` — they ship CJS and must be transpiled for Turbopack's ESM context

## APIs used
| API | Purpose |
|-----|---------|
| `https://api.open-meteo.com/v1/forecast` | Current + 7-day + hourly weather |
| `https://archive-api.open-meteo.com/v1/archive` | Historical comparison (same date last year) |
| `https://air-quality-api.open-meteo.com/v1/air-quality` | Day detail: US AQI + PM2.5 (global) and pollen (CAMS Europe, EU only) — one request |
| `https://geocoding-api.open-meteo.com/v1/search` | City geocoding + autocomplete |
| `https://restcountries.com/v3.1/all` | Country list (name, flag, capital, code) |
| `https://countriesnow.space/api/v0.1/countries/cities/q` | Cities per country |
| `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` | Map TopoJSON |

## Key lib functions (`src/lib/forecast.ts`)
- `fetchForecast(lat, lon, tz?)` — 7-day + current forecast with 30-min ISR; shared by the home and day server components
- `buildForecastUrl(lat, lon)` — 7-day + current forecast URL (daily includes `apparent_temperature_max/min` + `wind_direction_10m_dominant` so future days show the same Feels-Like / Wind-direction cards as today)
- `buildHourlyForecastUrl(lat, lon)` — **7-day** hourly URL (includes `relative_humidity_2m` + `surface_pressure` for per-day Humidity/Pressure means)
- `getDayAverages(hourly, dateStr)` → `{ humidity, pressure }` — daily means from hourly forecast; non-today days fill the same stat cards (live `current` is today-only)
- `getDayHourlyData(hourly, dateStr)` — extracts one day's slice from the 7-day hourly response
- `validateCoord(value, min, max, fallback)` — validates lat/lon params, rejects NaN/Infinity/out-of-range
- `formatHour(hour)` → "9am", "12pm", etc.
- `getLastYearDate(dateStr)` — returns same calendar date last year for historical comparison

## Key lib functions (`src/lib/weather.ts`)
- `getWeatherInfo(code)` → `{ label, emoji }` — human-readable label + emoji for a WMO weather code
- `getDayName(dateStr)` → "Monday" etc.; `getFormattedDate(dateStr)` → "Mon 5 Jun"
- `getWeatherRating(code, temp)` → qualitative rating string
- `getWeatherScore(code, tempMax)` — 0–4 score for best-day badge ranking
- `describeUV(uv)` → `{ label, tip }` — UV index descriptor
- `tempDiffDescription(forecast, historical)` → year-over-year comparison string
- `getWeatherAnimClass(code)` → CSS class for animated emoji
- `getHourWeatherInfo(code)` / `getHourAnimClass(code)` — hourly variants
- `getWeatherFact(code, temp)` → contextual fun weather fact
- `getWeatherAlert(code, windMax, uvMax, precipSum)` → `WeatherAlert | null`
- `getWindDirection(degrees)` → "N"|"NE"|...|"NW"; `getWindArrow(degrees)` → unicode arrow
- `getDressCode(code, tempMax, windMax)` → `{ summary, items[] }`
- `getFeelsLikeExplanation(actual, feelsLike, humidity, wind)` — human-readable feels-like reason
- `getDaylightInfo(sunriseISO, sunsetISO)` → `{ hours, minutes, risePercent, lightPercent }`
- `getCityHour(timezone)` / `formatCityTime(timezone)` / `isNightHour(timezone)` / `getTimeOfDayLabel(timezone)` — timezone-aware time helpers

## Key lib functions (`src/lib/outdoor.ts`)
- `getHourlyAnalysis(hourly, dateStr, sunriseISO, sunsetISO)` → `{ hours[24], bestWindows, badWindows }`
  - Each `HourData` carries `active` (within `ACTIVE_START`–`ACTIVE_END`, i.e. **6am–10pm**). Best/bad windows detected **only within active hours**; night score (-1) trims dark hours.
  - Best windows = runs where every active hour is at least "Good" (score ≥2); relaxes to ≥1 only if nothing qualifies. Ranked **best-first** by total score, then drier, then calmer, then earlier; max 3; each tags its peak hour.
  - `rating` is honest about marginal stretches: a window that only reaches score 2 is **Fair** (Excellent ≥3.3, Good ≥2.3, Fair ≥1.3 avg).
  - Windows use **average** precip (not max); shows range if spread > 30 pp
  - Bad windows require **≥ 2** consecutive score-0 hours within active hours
- `getOutdoorSummary(bestWindows, badWindows)` → natural-language summary; frames "rough days" honestly rather than overselling a fair window
- `scoreHour(temp, precipProb, windSpeed, isNight)` → -1..3
- `describeWind(avgWind)` → shared wind descriptor (calm/light breeze/gentle breeze/breezy/windy); used by outdoor-window reason sentence and its condition chip so they always agree

## Key lib functions (`src/lib/geocoding.ts`)
- `geocodeLocation(query)` → `GeocodingResult | null` — extracts city/country, fetches 10 candidates, applies country hint + population ranking
- `findBestGeoMatch(results, countryHint?)` — population-ranked match with optional country bias
- `countryCodeToFlag(code)` — ISO 3166-1 alpha-2 → flag emoji ("GB" → 🇬🇧)

## Key lib functions (`src/lib/weatherTheme.ts`)
- `getWeatherThemeType(code, isNight)` → `WeatherThemeType` — one of 8 variants: clear, partly-cloudy, overcast, foggy, rainy, snowy, thunderstorm (day + night variants)
- `getWeatherTheme(code, isNight)` → `{ gradient, radial }` — CSS gradient strings for hero backgrounds

## Key lib functions (`src/lib/airQuality.ts`)
- `buildAirQualityUrl(lat, lon, tz?)` — one Open-Meteo air-quality URL: 6 pollen types + `pm2_5` + `us_aqi`, 7-day
- `describeUsAqi(value)` → `{ label, tip }` — US AQI (0–500) → Good/Moderate/…/Hazardous (global coverage)
- `getDayAqi(response, dateStr)` → `AqiInfo | null` — daily-max US AQI + PM2.5 at the peak hour
- `describePollenLevel(value)` → `{ label, tip }` — grains/m³ → None/Low/Moderate/High/Very High
- `getDayPollen(response, dateStr)` → `PollenInfo | null` — dominant type + daily-max for a date
  (null outside Europe — pollen is EU-only — or when the date is outside the window)
  Pollen types: Alder, Birch, Grass, Mugwort, Olive, Ragweed

## Key lib functions (`src/lib/countries.ts`)
- `normalizeCountryName(name)` — maps TopoJSON names to CountriesNow names (21 mappings)
- `getAllCountries()` — all ~250 countries (name, cca2, flag, capital, region, subregion, population)
- `getCountryByCode(code)` — single country by ISO alpha-2
- `getCountriesByRegion(region)` — all countries in a region (for "same region" section)
- `getCitiesForCountry(country)` — proxied from CountriesNow, cached 24 h
- `selectCandidates(cities, max)` — evenly-spaced sample from a large city list
- `mapWithConcurrency(items, limit, fn)` — order-preserving async map with at most `limit` promises in flight; used to fan out geocoding without tripping upstream rate limits
- `formatPopulation(n)` → "1.4B" / "67.2M" / "50K" / "500"

## Key lib functions (`src/lib/rateLimit.ts` + `src/lib/cityMarkers.ts`)
- `rateLimit(key, {limit, windowMs}, now?)` — in-memory fixed-window limiter (injectable clock)
- `enforceRateLimit(request, opts, keyPrefix)` — route guard → `{ limited: Response|null, result }`
- `getClientId(request)` / `rateLimitHeaders(result)` — IP derivation + standard RateLimit-* headers
- `getCityMarkers(country)` — full map-marker fan-out orchestration (meta + capital + prefix
  search + sampled geocoding, deduped, area-scaled). `maxMarkers`, `dedupeByName`, `geocodeCity`,
  `resolveCountryMeta` are the testable units behind it.
- `dedupeByProximity(markers)` — haversine-distance dedup for geocoded results

## Security conventions
- All API route `country` params: must match `/^[\p{L}\s\-'.()]+$/u`, max 100 chars
- **Rate limiting:** every `/api/*` route is guarded by `enforceRateLimit` — 60/min for
  `/cities` + `/current`, 15/min for the heavier `/city-markers` fan-out. Returns 429 +
  `Retry-After`. In-memory (per-instance); swap `rateLimit`'s store for Redis/KV at scale.
- CSP header in `next.config.ts`: connect-src allowlist for 6 external APIs; frame-ancestors, base-uri, form-action all restricted
- `validateCoord` (`lib/forecast.ts`) used for lat/lon in day detail; `name` param capped at 200 chars
- **Dependency audit:** `npm audit:ci` gates pushes (prod deps, high+). `overrides` pins
  `d3-color@^3.1.0` to patch react-simple-maps' ReDoS (GHSA-36jr-mh4h-2g58). Remaining
  advisories are dev-only (vitest/esbuild) or transitive postcss under Next — not shipped.

## Open-Meteo weather codes
0=clear · 1-2=partly cloudy · 3=overcast · 45/48=fog · 51-57=drizzle · 61-67=rain · 71-77=snow · 80-82=showers · 95+=thunderstorm
