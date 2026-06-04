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
├── map/page.tsx            Server wrapper → WorldMapLoader
├── countries/
│   ├── page.tsx            Server — A–Z country grid
│   └── [code]/
│       ├── page.tsx        Server — country hero + CitiesFilter
│       └── CitiesFilter.tsx  'use client' — live search over city list
└── api/cities/route.ts     GET handler — proxies CountriesNow, 24 h cache
```

## Day detail page data flow
```
DayPage (server)
  ├── getWeather(lat, lon)         → daily + current (30 min ISR)
  ├── getHourlyWeather(lat, lon)   → 6-day hourly (30 min ISR)
  └── getHistorical(dateStr, lat, lon) → last-year archive (24 h ISR)
      → getHourlyAnalysis(hourly, dateStr, sunrise, sunset)
         returns { hours[24], bestWindows, badWindows }
```

## Map interaction flow
```
hover country (350 ms debounce)
  → /api/cities?country=Name  (in-memory + server cache)
  → panel shows city list

click country
  → zoom to centroid (zoom=4)
  → showPanel(name) → cities in panel
  → fetchCityMarkers: sample 10 cities → geocode via Open-Meteo → Marker components
  → city dot on map → click → /?q=City, Country
```
