# Salar Weather App — Plan

## Overview
A Next.js 16 weather app with global city search, 5-day forecasts, a countries browser, and an interactive world map. Styled after BBC Weather with a dark navy theme.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + custom CSS animations
- **APIs**: Open-Meteo (weather + geocoding), REST Countries, CountriesNow, Open-Meteo Archive
- **Map**: react-simple-maps (SVG world map)
- **Testing**: Vitest (81 tests)

## Requirements

### Functional
- Search any city with **autocomplete suggestions** pulled from Open-Meteo geocoding as you type
- Show current temperature, feels-like, humidity, precipitation, UV index, wind speed
- Show a **5-day forecast** with daily max/min temps, weather condition, temperature range bar
- Click any forecast day card to open a **day detail page** with:
  - Expanded data: UV index, sunrise/sunset, feels-like, humidity, precipitation, wind
  - **Day picker strip** — jump between the 5 forecast days directly
  - Historical comparison: same calendar date last year (temp, precipitation, verdict)
  - Activity rating & suggestion
  - **Best Times Outside** — 24-hour colour strip + scored windows with peak hour, temperature range, and activity suggestions (Cycling, Running, Picnic, etc.)
  - **Avoid windows** — periods to stay indoors with detailed conditions
  - **Did you know?** fun weather fact relevant to the day's conditions
- **Breadcrumb navigation** on every page: Home / Country / Day / etc.
- **Countries tab** — browse all ~250 countries A–Z (flag, name, capital)
  - Click a country → city list with live filter (can have thousands of cities)
  - Click a city → weather forecast for that city
- **Map tab** — interactive SVG world map
  - Hover over a country → side panel loads and shows its cities (debounced 350ms, cached)
  - Click a country → map zooms to that country's centroid; side panel shows its cities
  - City markers with **label background rects** for clear readability and glow rings for visibility
  - Click a city in the side panel or on map → weather forecast for that city
  - "← World" button resets zoom
- Graceful error handling for all API failures
- Data revalidates every 30 minutes (ISR); country/city data every 24 hours

### Non-Functional
- Server Components by default; `'use client'` only for interactive pieces
- Mobile-responsive layout (stacked on mobile, side-by-side on desktop)
- Dark navy theme (BBC Weather-inspired)
- **Security**: HTTP security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), strict input validation on all API routes
- **Animations**: Weather-specific CSS animations — sun spins with glow, clouds bob, rain sways, snow drifts, thunder flashes, fog drifts

## Project Structure

```
src/
├── app/
│   ├── globals.css                    # Tailwind base + CSS vars + weather animations
│   ├── layout.tsx                     # Root layout (fonts, metadata)
│   ├── page.tsx                       # Home — weather search & 5-day forecast
│   ├── api/
│   │   ├── cities/
│   │   │   └── route.ts               # GET /api/cities?country=X (proxy + validation)
│   │   └── city-markers/
│   │       └── route.ts               # GET /api/city-markers?country=X (geocoded dots)
│   ├── countries/
│   │   ├── page.tsx                   # All countries A–Z list + breadcrumb
│   │   └── [code]/
│   │       ├── page.tsx               # Cities for a country + breadcrumb
│   │       └── CitiesFilter.tsx       # 'use client' — live filter for city grid
│   ├── day/
│   │   └── [index]/
│   │       └── page.tsx               # Day detail — breadcrumb, day picker, windows, fun fact
│   ├── map/
│   │   └── page.tsx                   # Map page (server wrapper)
│   └── components/
│       ├── Header.tsx                 # Nav header (server)
│       ├── NavTabs.tsx                # 'use client' — Home/Countries/Map tabs
│       ├── SearchAutocomplete.tsx     # 'use client' — search with dropdown
│       ├── WorldMapLoader.tsx         # 'use client' — dynamic(WorldMap, {ssr:false})
│       └── WorldMap.tsx               # 'use client' — react-simple-maps interactive map
├── lib/
│   ├── weather.ts                     # Weather API helpers + types + facts + animation classes
│   ├── weather.test.ts                # Unit tests (81 tests)
│   └── countries.ts                   # Country/city API helpers + types
└── types/
    └── react-simple-maps.d.ts         # TypeScript declarations for react-simple-maps
```

## APIs

| API | Purpose |
|-----|---------|
| `https://api.open-meteo.com/v1/forecast` | 5-day + current weather |
| `https://archive-api.open-meteo.com/v1/archive` | Historical weather (day detail) |
| `https://geocoding-api.open-meteo.com/v1/search` | City search + autocomplete |
| `https://restcountries.com/v3.1/all` | Country list (name, flag, capital, code) |
| `https://countriesnow.space/api/v0.1/countries/cities/q` | Cities per country |
| `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` | World map TopoJSON |

## Security

- **HTTP headers** (via `next.config.ts`): X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control
- **API route validation**: `country` parameter is stripped, length-checked (max 100 chars) and validated against a Unicode letter/space/punctuation allowlist before being forwarded to external APIs
- **Cache headers**: API routes set `Cache-Control: public, s-maxage=86400, stale-while-revalidate` to reduce backend exposure
- **Server Components** as default: user data never touches client-side state unless necessary

## New Functions (`src/lib/weather.ts`)

| Function | Purpose |
|----------|---------|
| `getWeatherAnimClass(code)` | Returns CSS class for animated weather emoji |
| `getWeatherFact(code, temp)` | Returns a contextual fun weather fact |
| `suggestActivities(...)` | Internal — suggests activities for an outdoor window |

## Enhanced OutdoorWindow

```typescript
interface OutdoorWindow {
  timeLabel: string;       // "9am – 1pm"
  rating: "Excellent" | "Good" | "Fair" | "Poor";
  conditions: string;      // "avg 18°C, dry, calm"
  isBad: boolean;
  peakHour?: string;       // best single hour in the window
  tempRange?: string;      // "15–21°C"
  activities?: string[];   // ["Running", "Cycling", "Picnic"]
}
```

## PWA Support
`src/app/manifest.ts` exports the Web App Manifest via the Next.js manifest convention. Appears at `/manifest.webmanifest`. Layout sets `<meta name="theme-color">` and links the manifest. App is installable in supported browsers.

## Print Support
`@media print` rules in `globals.css` flatten backgrounds, hide navigation/chrome, and produce clean printed forecasts.

## Loading States
Each dynamic route has a `loading.tsx` skeleton that mirrors the page layout and animates with `animate-pulse` while data is fetching.

## Implemented

- [x] City search with autocomplete dropdown
- [x] BBC Weather-inspired dark navy UI
- [x] 5-day forecast with temperature range bars
- [x] Day detail page with historical comparison
- [x] Countries browser (all 250 countries, flag + capital)
- [x] City browser per country (live filter, thousands of cities)
- [x] Navigation tabs (Home / Countries / Map) with active state
- [x] Interactive world map (hover cities, click zoom, city → weather)
- [x] City markers on map when zoomed into a country (geocoded dots, click → weather)
- [x] Best Times Outside on day detail (24-h colour strip + scored windows)
- [x] Search autocomplete dropdown (debounced, keyboard navigable)
- [x] Weather emoji CSS animations (sun, cloud, rain, snow, thunder, fog)
- [x] Fun weather facts on home + day detail pages
- [x] Day picker strip on day detail (jump between 5 forecast days)
- [x] Breadcrumbs on all pages (Home / Location / Day etc.)
- [x] Enhanced outdoor windows (peak hour, temp range, activity suggestions)
- [x] Improved map city labels (background rect, glow ring, larger font)
- [x] Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- [x] API route input validation + sanitisation
- [x] TypeScript declarations for react-simple-maps + d3-geo
- [x] 111 unit tests covering all lib functions
- [x] Weather alert banners (thunderstorm, snow, wind, rain, UV)
- [x] Dynamic SEO metadata on all pages (`generateMetadata`)
- [x] Recent searches (localStorage chips on landing page)
- [x] Popular cities quick-links on landing page
- [x] Countries page: search by name/capital + region filter dropdown
- [x] Map panel: "Browse all cities" deep link to `/countries?search=X`
- [x] 5-day temperature trend indicator (warming/cooling/steady + sparkline)
- [x] Outdoor window summary sentence at top of Best Times section
- [x] Custom 404 not-found page (animated fog, three nav links)
- [x] Custom error boundary (`error.tsx`) with try-again button
- [x] Loading skeleton pages for home, day, and countries routes
- [x] Wind direction compass (arrow + cardinal label) in stats cards
- [x] Surface pressure in stats with High/Low/Normal context
- [x] Server-rendered SVG temperature curve in hourly forecast section
- [x] Skip to main content accessibility link
- [x] ARIA labels, roles, and aria-hidden on decorative elements
