<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Salar Weather

## Project overview
A global city weather app. Users search any city (with autocomplete), browse all world countries and their cities, and navigate an interactive SVG world map. Built with Next.js 16 App Router + Tailwind CSS v4 + react-simple-maps.

Key features:
- Search autocomplete (Open-Meteo geocoding, live dropdown)
- 5-day forecast with temperature range bars, stats strip
- Day detail: historical comparison, UV/wind/rain detail, **best times outside** (hourly colour strip + scored windows)
- Countries browser: all 250 countries A–Z with flag, capital, city list
- Interactive world map: hover country → cities panel loads; click → zoom in + city markers appear on map; click marker/city → weather

## Commands
- `npm run dev` — start dev server (http://localhost:3000)
- `npm run build` — production build (also runs type check)
- `npm run test` — run Vitest unit tests
- `npm run test:watch` — run tests in watch mode
- `npm run lint` — run ESLint

## Routes
| Route | Description |
|-------|-------------|
| `/` | Home — `?q=CityName` fetches and renders 5-day forecast |
| `/day/[index]` | Day detail — `?lat=&lon=&name=` params required |
| `/countries` | All countries A–Z browser |
| `/countries/[code]` | Cities for a country (ISO alpha-2 e.g. `GB`) |
| `/map` | Interactive world map |
| `/api/cities?country=Name` | Server proxy → CountriesNow, cached 24 h |

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

## APIs used
| API | Purpose |
|-----|---------|
| `https://api.open-meteo.com/v1/forecast` | Current + 5-day + hourly weather |
| `https://archive-api.open-meteo.com/v1/archive` | Historical comparison |
| `https://geocoding-api.open-meteo.com/v1/search` | City geocoding + autocomplete |
| `https://restcountries.com/v3.1/all` | Country list (name, flag, capital, code) |
| `https://countriesnow.space/api/v0.1/countries/cities/q` | Cities per country |
| `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` | Map TopoJSON |

## Key lib functions (`src/lib/weather.ts`)
- `buildForecastUrl(lat, lon)` — daily + current forecast URL
- `buildHourlyForecastUrl(lat, lon)` — 6-day hourly URL
- `getHourlyAnalysis(hourly, dateStr, sunriseISO, sunsetISO)` — returns `{ hours, bestWindows, badWindows }` for the Best Times Outside section
- `scoreHour(temp, precipProb, windSpeed, isNight)` → -1..3
- `formatHour(hour)` → "9am", "12pm", etc.
- `getWeatherInfo(code)`, `getDayName(dateStr)`, `getWeatherRating(code, temp)`, `describeUV(uv)`, `tempDiffDescription(forecast, historical)`

## Open-Meteo weather codes
0=clear · 1-2=partly cloudy · 3=overcast · 45/48=fog · 51-57=drizzle · 61-67=rain · 71-77=snow · 80-82=showers · 95+=thunderstorm
