@AGENTS.md

## Component architecture quick reference

```
src/app/
├── components/
│   ├── Header.tsx            Server — brand + NavTabs + SearchAutocomplete (hideSearch prop omits search)
│   ├── NavTabs.tsx           'use client' — usePathname active-tab highlight (Home/Countries/Map/About)
│   ├── SearchAutocomplete.tsx  'use client' — debounced geocoding combobox (ARIA listbox)
│   ├── SearchTracker.tsx     'use client' — writes search to localStorage on mount
│   ├── RecentSearches.tsx    'use client' — reads localStorage, renders recent list
│   ├── GeolocateButton.tsx   'use client' — navigator.geolocation → /day/0
│   ├── ShareButton.tsx       'use client' — navigator.share / clipboard fallback
│   ├── TimeGradient.tsx      'use client' — reads browser hour, fades time-of-day overlay
│   ├── StatTooltip.tsx       Server — shared hover tooltip + STAT_TOOLTIPS dict (home + day)
│   ├── WeatherFactCard.tsx   Server — shared "Did you know?" fact card (home + day)
│   ├── WeatherError.tsx      Server — shared forecast-failed fallback (home + day)
│   ├── WeatherBackground.tsx 'use client' — dispatches to weather-effects/* per weather type
│   ├── LocalTime.tsx         'use client' — live per-second clock for a city timezone
│   ├── AppFooter.tsx         Server — shared footer (nav links + attribution + year)
│   ├── WorldMapLoader.tsx    'use client' — dynamic(WorldMap, {ssr:false})
│   ├── WorldMap.tsx          'use client' — thin: useWorldMap() + composes world-map/*
│   ├── world-map/            Map pieces extracted from WorldMap
│   │   ├── useWorldMap.ts     hook: all state, caches, data-loading + handlers
│   │   ├── MapGeographies.tsx country polygons + hover/click/keyboard
│   │   ├── CityMarkers.tsx    SVG city dots (hover/focus label, click → forecast)
│   │   ├── CitiesPanel.tsx    right panel (header, filter, list, footer, empty state)
│   │   └── MapWeatherCard.tsx inline capital/city weather card
│   └── weather-effects/      WeatherBackground.tsx dispatches to these per type
│       ├── Overlay.tsx        shared full-viewport aria-hidden wrapper
│       ├── ParticleField.tsx  reusable animated particle base
│       └── {Sun,Stars,Cloud,Rain,Snow,Thunder,Fog}Effect.tsx
├── map/page.tsx              Server wrapper → WorldMapLoader
├── page.tsx                  Server — thin: geocode → branch → render (see home/)
├── home/                     Home-page pieces extracted from page.tsx
│   ├── homeView.ts           buildHomeView() view-model + buildDayHref()
│   ├── HomeLanding.tsx       Server — empty-state landing; Header hideSearch=true here
│   ├── LocationNotFound.tsx  Server — no-geocode-match fallback
│   ├── ForecastView.tsx      Server — composes the resolved-location forecast
│   ├── CurrentHero.tsx       Server — clickable "today" hero → /day/0
│   ├── StatsStrip.tsx        Server — 6-up stat strip (incl. StatCard)
│   └── FiveDayForecast.tsx   Server — 5-day grid + TrendIndicator + TempSparkline
├── day/[index]/              page.tsx = thin fetch + buildDayView() + compose
│   ├── dayData.ts            Server fetch helpers (getHourlyWeather, getHistorical, getAirQuality)
│   ├── dayView.ts            buildDayView() view-model builder
│   ├── DayHeader.tsx         Server — breadcrumb + title/share + day-picker strip
│   ├── CurrentWeatherCard.tsx Server — hero temp + "right now" strip
│   ├── WeatherAlertBanner.tsx Server — severe-weather banner
│   ├── DetailGrid.tsx        Server — stat grid (incl. UvMeter, DaylightBar, DetailCard)
│   ├── WhatToWear.tsx        Server — dress-code chips
│   ├── HourlyForecast.tsx    Server — SVG temp curve + rain bars + hour strip (night-dimmed)
│   ├── OutdoorTimes.tsx      Server — 24h colour strip + best/bad outdoor windows
│   └── YearComparison.tsx    Server — YoY tiles (incl. YoyStat) + verdict
│   Each home/ + day/ component has a colocated *.module.css.
│   Pattern: @apply + @reference "globals.css" inside modules; `group`/`peer`
│   markers + dynamic colour ternaries stay literal global utilities.
├── countries/
│   ├── page.tsx              Server — breadcrumb + A–Z country grid; Header hideSearch=true
│   ├── CountriesFilter.tsx   'use client' — live search + region filter + alphabet jump nav
│   └── [code]/
│       ├── page.tsx          Server — breadcrumb + country hero + same-region section
│       └── CitiesFilter.tsx  'use client' — live search over city list
├── api/                      All routes guarded by enforceRateLimit (lib/rateLimit.ts)
│   ├── cities/route.ts       GET — validates country, proxies CountriesNow, 24 h, 60/min
│   ├── current/route.ts      GET — current conditions for the map card, 30 min, 60/min
│   └── city-markers/route.ts GET — thin handler → getCityMarkers (lib/cityMarkers.ts),
│                               area-scaled fan-out, 24 h, 15/min
└── types/
    └── react-simple-maps.d.ts  TypeScript declarations for react-simple-maps
```

### hideSearch usage
`Header` accepts `hideSearch?: boolean`. When true, `SearchAutocomplete` is omitted.
- `HomeLanding` → `hideSearch=true` (has its own centred search)
- `/countries/page.tsx` → `hideSearch=true` (has its own `CountriesFilter`)
- `/map`, `/about`, `/day/[index]`, `/countries/[code]` → search visible (default)

## Day detail page data flow
```
DayPage (server)
  ├── fetchForecast(lat, lon, tz)    → daily + current (30 min ISR; shared with home)
  ├── getHourlyWeather(lat, lon)     → 7-day hourly (30 min ISR)
  ├── getAirQuality(dateStr, lat, lon) → one air-quality call → { aqi, pollen }:
  │     getDayAqi() (US AQI + PM2.5, global) + getDayPollen() (EU only) → DetailGrid cards
  └── getHistorical(dateStr, lat, lon) → last-year archive (24 h ISR)
      → getHourlyAnalysis(hourly, dateStr, sunrise, sunset)  [lib/outdoor.ts]
         returns { hours[24], bestWindows, badWindows }
         windows detected only within ACTIVE_START–ACTIVE_END (6am–10pm)
         each OutdoorWindow: timeLabel, rating, conditions (avg precip, range if spread>30),
           isBad, peakHour, tempRange, activities[]
         best windows: runs of score≥2 (relax to ≥1), ranked best-first (score→drier→calmer→earlier)
         bad windows: minimum 2 consecutive score-0 hours within active hours
  → getWeatherFact(code, temp)       → fun fact string shown in "Did you know?" card
  → getWeatherAnimClass(code)        → CSS class for animated emoji
  → YoyStat (server component)      → 3-column year-over-year comparison tiles
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
  → fetchCityMarkers: /api/city-markers — prefix search + capital + an area-scaled
       even-sample of the city list (≤ SAMPLE_CAP), geocoded via Open-Meteo with a
       concurrency cap (GEOCODE_CONCURRENCY); count scales with country area (2–52)
  → loadWeather({country}) → /api/current resolves capital → inline weather card in panel
  → Marker: dot + glow ring always visible
      hover dot (or keyboard-focus it) → <g> onMouseEnter / circle onFocus →
                   label appears above dot (styled rect + text)
                   dot grows (r×1.3) and brightens (#60a5fa)
      click dot / Enter / Space → openMarkerForecast(marker) → router.push /day/0
                   (mouse and keyboard share one handler — kept consistent)

inline weather card (top of cities panel): shown for the capital on a country click.
  location name (+ "capital" badge), emoji + temp + label, feels-like, live LocalTime,
  "Full 5-day forecast →" link.
  Clicking a city in the panel list → router.push /?q=City, Country (home forecast).
  cardReq ref tokens guard against out-of-order responses from rapid clicks.

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

Use `getWeatherAnimClass(code)` from `lib/weather.ts` to get the right class.

## Shared components
- `AppFooter.tsx` — server component used as the footer on all pages (nav links + attribution + year)
- `TimeGradient.tsx` — `'use client'` — reads browser hour, fades in a subtle time-of-day gradient overlay on hero cards
- `WeatherBackground.tsx` — `'use client'` — full-viewport animated weather effect; dispatches to `weather-effects/*` based on weather code + day/night

## Key route `loading.tsx` skeletons
- `src/app/loading.tsx` — home page
- `src/app/day/[index]/loading.tsx` — day detail
- `src/app/countries/loading.tsx` — countries grid

## Security
- `next.config.ts`: Content-Security-Policy (connect-src allowlist for 6 external APIs), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control
- `next.config.ts` also sets `transpilePackages: ["react-simple-maps", "d3-geo", "d3-zoom", "topojson-client"]` — required because these ship CJS builds that break in Turbopack's ESM context
- API routes validate `country` param: `/^[\p{L}\s\-'.()]+$/u`, max 100 chars, empty → `[]`
- **Rate limiting** (`lib/rateLimit.ts`): all `/api/*` routes call `enforceRateLimit` →
  429 + `Retry-After`. 60/min for cities + current, 15/min for city-markers. In-memory
  per-instance; swap the store for Redis/KV at multi-instance scale.
- `validateCoord(value, min, max, fallback)` in `lib/forecast.ts` — used for lat/lon in day detail page
- `viewport` export in `layout.tsx` carries `themeColor` (not `metadata` — Next.js 16 requirement)
- **Dependency overrides** in `package.json`: `d3-color@^3.1.0` patches react-simple-maps'
  transitive ReDoS. `npm run audit:ci` (prod deps, high+) gates pushes via the husky pre-push hook.

## `globals.css` utilities
- `:focus-visible` rule — blue outline for keyboard navigation
- Custom webkit scrollbar (dark themed)
- `.card-hover` — smooth bg + shadow transition for interactive cards
- Weather animation classes: `.weather-sunny`, `.weather-rainy`, `.weather-snowy`, `.weather-thunder`, `.weather-foggy`, `.weather-cloudy`
- `@media print` — flattens backgrounds, hides navigation for clean printed forecasts
