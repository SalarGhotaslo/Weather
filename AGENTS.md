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
- `npm run test` — run Vitest unit tests (233 tests across `src/lib/*.test.ts`)
- `npm run test:watch` — run tests in watch mode
- `npm run lint` — run ESLint

## Routes
| Route | Description |
|-------|-------------|
| `/` | Home — `?q=CityName` fetches and renders 7-day forecast |
| `/day/[index]` | Day detail — `?lat=&lon=&name=&code=` params required; lat/lon validated; index 0–6 |
| `/countries` | All countries A–Z browser with search + region filter + alphabet jump nav |
| `/countries/[code]` | Cities for a country (ISO alpha-2 e.g. `GB`) + same-region section |
| `/map` | Interactive world map with instruction bar |
| `/about` | Static page: features, data sources, tech stack, security note |
| `/api/cities?country=Name` | Server proxy → CountriesNow, validated + cached 24 h |
| `/api/city-markers?country=Name` | Geocodes major cities for map markers (area-scaled 2–52), concurrency-limited fan-out, validated + cached 24 h |
| `/api/current?lat=&lon=[&name=]` / `?city=&country=` / `?country=` | Current temp + feels-like + weather code + IANA timezone for the map's inline weather card. 3 modes: direct coords, named city, or country→capital. Validated + cached 30 min |

## Code conventions
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
| `https://geocoding-api.open-meteo.com/v1/search` | City geocoding + autocomplete |
| `https://restcountries.com/v3.1/all` | Country list (name, flag, capital, code) |
| `https://countriesnow.space/api/v0.1/countries/cities/q` | Cities per country |
| `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` | Map TopoJSON |

## Key lib functions (`src/lib/weather.ts`)
- `fetchForecast(lat, lon, tz?)` — 7-day + current forecast with 30-min ISR; shared by the home and day server components
- `buildForecastUrl(lat, lon)` — 7-day + current forecast URL (includes wind_direction, surface_pressure, precip_probability_max)
- `buildHourlyForecastUrl(lat, lon)` — 6-day hourly URL
- `validateCoord(value, min, max, fallback)` — validates lat/lon params, rejects NaN/Infinity/out-of-range
- `countryCodeToFlag(code)` — ISO 3166-1 alpha-2 → flag emoji ("GB" → 🇬🇧)
- `getFeelsLikeExplanation(actual, feelsLike, humidity, wind)` — human-readable feels-like reason
- `getWeatherScore(code, tempMax)` — 0–4 score for best-day badge ranking
- `getDaylightInfo(sunriseISO, sunsetISO)` — `{ hours, minutes, risePercent, lightPercent }`
- `getHourlyAnalysis(hourly, dateStr, sunriseISO, sunsetISO)` — `{ hours, bestWindows, badWindows }`
  - Each `HourData` carries `active` (within `ACTIVE_START`–`ACTIVE_END`, i.e. **6am–10pm**). Best/bad windows are detected **only within active hours**; the night score (-1) trims dark hours.
  - Best windows = runs where every active hour is at least "Good" (score ≥2), so a long comfortable stretch isn't discarded for one slightly-better hour; relaxes to ≥1 only if nothing qualifies. Separate windows appear only when split by genuinely poor hours. Ranked **best-first** by total score, then drier, then calmer, then earlier (a damp 6am loses to a clearing 7pm); max 3; each tags its peak hour.
  - `rating` is honest about marginal stretches: a window that only ever reaches score 2 is **Fair**, not Good (Excellent ≥3.3, Good ≥2.3, Fair ≥1.3 avg).
  - Windows use **average** precip (not max); shows range if spread > 30 pp
  - Bad windows require **≥ 2** consecutive score-0 hours within active hours (worst + also-avoid)
- `getOutdoorSummary(bestWindows, badWindows)` → natural-language summary; when even the best window is Fair/Poor it frames it as "a rough day to be outside" with the least-bad slot rather than overselling.
- `scoreHour(temp, precipProb, windSpeed, isNight)` → -1..3
- `formatHour(hour)` → "9am", "12pm", etc.
- `getWeatherInfo(code)`, `getDayName(dateStr)`, `getWeatherRating(code, temp)`, `describeUV(uv)`, `tempDiffDescription(forecast, historical)`
- `getWeatherAnimClass(code)` → CSS class for animated emoji
- `getWeatherFact(code, temp)` → contextual fun weather fact
- `getWeatherAlert(code, windMax, uvMax, precipSum)` → `WeatherAlert | null`
- `getWindDirection(degrees)` → "N"|"NE"|...|"NW"; `getWindArrow(degrees)` → unicode arrow
- `getDressCode(code, tempMax, windMax)` → `{ summary, items[] }`

## Key lib functions (`src/lib/countries.ts`)
- `normalizeCountryName(name)` — maps TopoJSON names to CountriesNow names
- `getAllCountries()` — all ~250 countries (name, cca2, flag, capital, region, subregion, population)
- `getCountryByCode(code)` — single country by ISO alpha-2
- `getCountriesByRegion(region)` — all countries in a region (for "same region" section)
- `selectCandidates(cities, max)` — evenly-spaced sample from a large city list
- `mapWithConcurrency(items, limit, fn)` — order-preserving async map with at most `limit`
  promises in flight; used to fan out geocoding without tripping upstream rate limits
- `formatPopulation(n)` → "1.4B" / "67.2M" / "50K" / "500"

## Security conventions
- All API route `country` params: must match `/^[\p{L}\s\-'.()]+$/u`, max 100 chars
- CSP header in `next.config.ts`: connect-src allowlist for 6 external APIs; frame-ancestors, base-uri, form-action all restricted
- `validateCoord` used for lat/lon in day detail; `name` param capped at 200 chars

## Open-Meteo weather codes
0=clear · 1-2=partly cloudy · 3=overcast · 45/48=fog · 51-57=drizzle · 61-67=rain · 71-77=snow · 80-82=showers · 95+=thunderstorm
