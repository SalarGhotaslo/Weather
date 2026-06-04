@AGENTS.md

## Component architecture quick reference

```
src/app/
├── components/
│   ├── Header.tsx            Server — brand + NavTabs + SearchAutocomplete
│   ├── NavTabs.tsx           'use client' — usePathname active-tab highlight
│   ├── SearchAutocomplete.tsx  'use client' — debounced geocoding dropdown
│   ├── SearchForm.tsx        'use client' — thin search form wrapper
│   ├── SearchTracker.tsx     'use client' — writes search to localStorage on mount
│   ├── RecentSearches.tsx    'use client' — reads localStorage, renders recent list
│   ├── GeolocateButton.tsx   'use client' — navigator.geolocation → /day/0
│   ├── ShareButton.tsx       'use client' — navigator.share / clipboard fallback
│   ├── TimeGradient.tsx      'use client' — reads browser hour, fades time-of-day overlay
│   ├── AppFooter.tsx         Server — shared footer (nav links + attribution + year)
│   ├── WorldMapLoader.tsx    'use client' — dynamic(WorldMap, {ssr:false})
│   └── WorldMap.tsx          'use client' — react-simple-maps, hover/click/markers
│                               city markers: dot always shown, label appears on hover
│                               state: position, hoveredCountry, selectedCountry,
│                                      panelCountry, panelCities, cityMarkers, hoveredMarker
├── map/page.tsx              Server wrapper → WorldMapLoader
├── countries/
│   ├── page.tsx              Server — breadcrumb + A–Z country grid
│   └── [code]/
│       ├── page.tsx          Server — breadcrumb + country hero + CitiesFilter
│       └── CitiesFilter.tsx  'use client' — live search over city list
├── api/
│   ├── cities/route.ts       GET — validates country param, proxies CountriesNow, 24 h cache
│   └── city-markers/route.ts GET — validates country param, geocodes up to 10 cities
└── types/
    └── react-simple-maps.d.ts  TypeScript declarations for react-simple-maps
```

## Day detail page data flow
```
DayPage (server)
  ├── getWeather(lat, lon)         → daily + current (30 min ISR)
  ├── getHourlyWeather(lat, lon)   → 6-day hourly (30 min ISR)
  └── getHistorical(dateStr, lat, lon) → last-year archive (24 h ISR)
      → getHourlyAnalysis(hourly, dateStr, sunrise, sunset)
         returns { hours[24], bestWindows, badWindows }
         each OutdoorWindow: timeLabel, rating, conditions (avg precip, range if spread>30),
           isBad, peakHour, tempRange, activities[]
         bad windows: minimum 3 consecutive score-0 hours
  → getWeatherFact(code, temp)     → fun fact string shown in "Did you know?" card
  → getWeatherAnimClass(code)      → CSS class for animated emoji
  → YoyStat (server component)    → 3-column year-over-year comparison tiles
      shows current value + colour-coded delta (▲/▼) + prior-year value
      orange=warmer, sky=cooler (temp); blue=wetter, emerald=drier (rain)
```

## Map interaction flow
```
hover country (350 ms debounce)
  → /api/cities?country=Name  (in-memory + server cache)
  → panel shows city list

click country
  → zoom to centroid (zoom=4)
  → showPanel(name) → cities in panel
  → fetchCityMarkers: sample up to 150 cities → geocode via Open-Meteo → top 10 by population
  → Marker: dot + glow ring always visible
      hover dot → <g> onMouseEnter → label appears above dot (styled rect + text)
                   dot grows (r×1.3) and brightens (#60a5fa) on hover
      click dot → /?q=City, Country

instruction bar hints: hover · click · scroll/pinch to zoom + drag to pan · hover dot for name
```

## Weather animations (globals.css)
Six keyframe animations exposed as CSS classes on emoji wrapper spans:
- `.weather-sunny` + `.weather-sunny-glow` — slow spin + drop-shadow pulse
- `.weather-cloudy` — vertical bob
- `.weather-rainy` — sway rotation
- `.weather-snowy` — drift + rotate
- `.weather-thunder` — brightness flash
- `.weather-foggy` — horizontal drift + opacity

Use `getWeatherAnimClass(code)` from `weather.ts` to get the right class.

## Shared components
- `AppFooter.tsx` — server component used as the footer on all pages (nav links + attribution + year)
- `TimeGradient.tsx` — `'use client'` — reads browser hour, fades in a subtle time-of-day gradient overlay on hero cards

## Key route `loading.tsx` skeletons
- `src/app/loading.tsx` — home page
- `src/app/day/[index]/loading.tsx` — day detail
- `src/app/countries/loading.tsx` — countries grid

## Security
- `next.config.ts`: Content-Security-Policy (connect-src allowlist for 6 external APIs), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control
- `next.config.ts` also sets `transpilePackages: ["react-simple-maps", "d3-geo", "d3-zoom", "topojson-client"]` — required because these ship CJS builds that break in Turbopack's ESM context
- API routes validate `country` param: `/^[\p{L}\s\-'.()]+$/u`, max 100 chars, empty → `[]`
- `validateCoord(value, min, max, fallback)` in weather.ts — used for lat/lon in day detail page
- `viewport` export in `layout.tsx` carries `themeColor` (not `metadata` — Next.js 16 requirement)

## `globals.css` utilities
- `:focus-visible` rule — blue outline for keyboard navigation
- Custom webkit scrollbar (dark themed)
- `.card-hover` — smooth bg + shadow transition for interactive cards
- Weather animation classes: `.weather-sunny`, `.weather-rainy`, `.weather-snowy`, `.weather-thunder`, `.weather-foggy`, `.weather-cloudy`
- `@media print` — flattens backgrounds, hides navigation for clean printed forecasts
