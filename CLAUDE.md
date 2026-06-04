@AGENTS.md

## Component architecture quick reference

```
src/app/
├── components/
│   ├── Header.tsx          Server — brand + NavTabs + SearchAutocomplete
│   ├── NavTabs.tsx         'use client' — usePathname active-tab highlight
│   ├── SearchAutocomplete.tsx  'use client' — debounced geocoding dropdown
│   ├── WorldMapLoader.tsx  'use client' — dynamic(WorldMap, {ssr:false})
│   └── WorldMap.tsx        'use client' — react-simple-maps, hover/click/markers
│                             city markers have: background label rect, glow ring, scaled label
├── map/page.tsx            Server wrapper → WorldMapLoader
├── countries/
│   ├── page.tsx            Server — breadcrumb + A–Z country grid
│   └── [code]/
│       ├── page.tsx        Server — breadcrumb + country hero + CitiesFilter
│       └── CitiesFilter.tsx  'use client' — live search over city list
├── api/
│   ├── cities/route.ts     GET — validates country param, proxies CountriesNow, 24 h cache
│   └── city-markers/route.ts  GET — validates country param, geocodes up to 10 cities
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
         each OutdoorWindow has: timeLabel, rating, conditions,
           peakHour, tempRange, activities[]
  → getWeatherFact(code, temp)     → fun fact string shown in "Did you know?" card
  → getWeatherAnimClass(code)      → CSS class for animated emoji
```

## Map interaction flow
```
hover country (350 ms debounce)
  → /api/cities?country=Name  (in-memory + server cache)
  → panel shows city list

click country
  → zoom to centroid (zoom=4)
  → showPanel(name) → cities in panel
  → fetchCityMarkers: sample 150 cities → geocode via Open-Meteo → top 10 by population
  → Marker: background rect + label + dot + glow ring → click → /?q=City, Country
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

## Security
- `next.config.ts` sets X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy on all routes
- API routes validate `country` param: `/^[\p{L}\s\-'.()]+$/u`, max 100 chars, empty → `[]`
