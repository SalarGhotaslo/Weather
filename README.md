# Salar Weather

A global city weather app built with Next.js 16. Search any city for a 7-day forecast, explore all world countries and their cities, and navigate an interactive SVG world map.

## Features

- **City search** — autocomplete dropdown with Open-Meteo geocoding, recent searches saved locally
- **7-day forecast** — temperature range bars, precipitation probability, ⭐ best-day badge, sparkline trend
- **Day detail** — hourly temperature curve, rain probability bars, UV meter, daylight bar, feels-like explanation
- **Best times outside** — 24-hour scored colour strip with "Good times to go out" and "Best avoided" windows; uses average rain probability so one rainy hour does not misrepresent the whole window
- **Year-on-year comparison** — 3-tile grid (max temp, min temp, rainfall) with colour-coded deltas vs same date last year
- **What to wear** — clothing chip suggestions based on conditions
- **Countries browser** — all ~250 countries A–Z, searchable, with flag, capital, region, population
- **Country detail** — city browser with live filter, capital weather button, same-region countries
- **World map** — interactive SVG map; hover a country to see its cities, click to zoom in and drop geocoded city markers; hover a dot to reveal its label, click for weather
- **Geolocation** — "Use my location" button navigates to your local forecast
- **PWA** — installable in supporting browsers
- **Weather alerts** — banner for thunderstorms, high UV, strong winds, heavy rain

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build + type check |
| `npm run test` | Run Vitest unit tests (233 tests) |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:a11y` | Run the Playwright + axe accessibility gate (requires a build first) |
| `npm run lint` | ESLint |

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components, ISR) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + custom CSS keyframe animations |
| Map | react-simple-maps + d3-geo + topojson-client |
| Testing | Vitest |
| Fonts | Geist (via `next/font`) |

## Data sources

| Source | Used for |
|--------|---------|
| [Open-Meteo](https://open-meteo.com) | Weather forecast, historical archive, geocoding |
| [REST Countries](https://restcountries.com) | Country names, flags, capitals, regions |
| [CountriesNow](https://countriesnow.space) | City lists per country |
| [world-atlas](https://github.com/topojson/world-atlas) | SVG map TopoJSON |

All APIs are free and require no key.

## Project structure

```
src/
├── app/
│   ├── page.tsx                  Home page (7-day forecast)
│   ├── layout.tsx                Root layout (fonts, metadata, viewport)
│   ├── globals.css               Tailwind + custom animations + print styles
│   ├── components/               Shared UI components
│   │   ├── Header.tsx            Nav bar with search
│   │   ├── SearchAutocomplete.tsx  Geocoding dropdown
│   │   ├── RecentSearches.tsx    localStorage recent searches
│   │   ├── GeolocateButton.tsx   Geolocation to /day/0
│   │   ├── WorldMap.tsx          react-simple-maps interactive map
│   │   ├── WorldMapLoader.tsx    dynamic() wrapper (ssr:false)
│   │   ├── AppFooter.tsx         Shared footer
│   │   ├── ShareButton.tsx       navigator.share / clipboard
│   │   └── TimeGradient.tsx      Time-of-day gradient overlay
│   ├── day/[index]/page.tsx      Day detail page
│   ├── countries/                Countries browser + country detail
│   ├── map/page.tsx              World map page
│   ├── about/page.tsx            About page
│   └── api/                      API routes (cities, city-markers)
├── lib/
│   ├── weather.ts                All weather utilities + types
│   ├── weather.test.ts           163 Vitest tests
│   └── countries.ts              Country data utilities
next.config.ts                    CSP headers + transpilePackages
```

## Security

- **Content-Security-Policy** restricts `connect-src` to the six data APIs; `frame-ancestors`, `base-uri`, and `form-action` all locked to `'self'`
- **Coordinate validation** — `validateCoord()` rejects NaN, Infinity, and out-of-range values before any API call
- **API param validation** — `country` query param must match `^[\p{L}\s\-'.()]+$`, max 100 chars
- Server Components by default — no secrets exposed to the client
