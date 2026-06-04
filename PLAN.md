# Salar Weather App — Plan

## Overview
A Next.js 16 weather app with global city search, 5-day forecasts, a countries browser, and an interactive world map. Styled after BBC Weather with a dark navy theme.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **APIs**: Open-Meteo (weather + geocoding), REST Countries, CountriesNow, Open-Meteo Archive
- **Map**: react-simple-maps (SVG world map)
- **Testing**: Vitest

## Requirements

### Functional
- Search any city with **autocomplete suggestions** pulled from Open-Meteo geocoding as you type
- Show current temperature, feels-like, humidity, precipitation, UV index, wind speed
- Show a **5-day forecast** with daily max/min temps, weather condition, temperature range bar
- Click any forecast day card to open a **day detail page** with:
  - Expanded data: UV index, sunrise/sunset, feels-like, humidity, precipitation, wind
  - Historical comparison: same calendar date last year (temp, precipitation, verdict)
  - Activity rating & suggestion
- **Countries tab** — browse all ~250 countries A–Z (flag, name, capital)
  - Click a country → city list with live filter (can have thousands of cities)
  - Click a city → weather forecast for that city
- **Map tab** — interactive SVG world map
  - Hover over a country → side panel loads and shows its cities (debounced 350ms, cached)
  - Click a country → map zooms to that country's centroid; side panel shows its cities
  - Click a city in the side panel → weather forecast for that city
  - "← World" button resets zoom
- Graceful error handling for all API failures
- Data revalidates every 30 minutes (ISR); country/city data every 24 hours

### Non-Functional
- Server Components by default; `'use client'` only for interactive pieces
- Mobile-responsive layout (stacked on mobile, side-by-side on desktop)
- Dark navy theme (BBC Weather-inspired)

## Project Structure

```
src/
├── app/
│   ├── globals.css                    # Tailwind base + CSS vars
│   ├── layout.tsx                     # Root layout (fonts, metadata)
│   ├── page.tsx                       # Home — weather search & 5-day forecast
│   ├── api/
│   │   └── cities/
│   │       └── route.ts               # GET /api/cities?country=X (proxy for map)
│   ├── countries/
│   │   ├── page.tsx                   # All countries A–Z list
│   │   └── [code]/
│   │       ├── page.tsx               # Cities for a country
│   │       └── CitiesFilter.tsx       # 'use client' — live filter for city grid
│   ├── day/
│   │   └── [index]/
│   │       └── page.tsx               # Day detail page
│   ├── map/
│   │   └── page.tsx                   # Map page (server wrapper)
│   └── components/
│       ├── Header.tsx                 # Nav header (server)
│       ├── NavTabs.tsx                # 'use client' — Home/Countries/Map tabs
│       ├── SearchAutocomplete.tsx     # 'use client' — search with dropdown
│       ├── WorldMapLoader.tsx         # 'use client' — dynamic(WorldMap, {ssr:false})
│       └── WorldMap.tsx               # 'use client' — react-simple-maps interactive map
├── lib/
│   ├── weather.ts                     # Weather API helpers + types
│   ├── weather.test.ts                # Unit tests
│   └── countries.ts                   # Country/city API helpers + types
```

## APIs

| API | Purpose | Key |
|-----|---------|-----|
| `https://api.open-meteo.com/v1/forecast` | 5-day + current weather | None |
| `https://archive-api.open-meteo.com/v1/archive` | Historical weather (day detail) | None |
| `https://geocoding-api.open-meteo.com/v1/search` | City search + autocomplete | None |
| `https://restcountries.com/v3.1/all` | Country list (name, flag, capital, code) | None |
| `https://countriesnow.space/api/v0.1/countries/cities/q` | Cities per country | None |
| `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` | World map TopoJSON | None |

## Map Interaction Detail

```
User hovers country (350ms delay)
  → fetch /api/cities?country=Name  (cached in-memory + server 24h revalidate)
  → side panel shows city list with filter

User clicks country
  → map zooms to country centroid (zoom level 4)
  → same city list shown in panel
  → "← World" button resets zoom + clears panel

User clicks city in panel
  → navigates to /?q=City, Country
  → weather forecast page loads
```

## Build & Run

```bash
npm install        # Install dependencies (includes react-simple-maps)
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build (also runs type check)
npm run test       # Run Vitest unit tests
```

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
