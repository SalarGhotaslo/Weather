# Salar Weather App — Plan

## Overview
A Next.js 16 weather app with global city search, 5-day forecasts, a countries browser, and an interactive world map. Styled after BBC Weather with a dark navy theme.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Server Components, ISR)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + custom CSS animations
- **APIs**: Open-Meteo (weather + geocoding), REST Countries, CountriesNow, Open-Meteo Archive
- **Map**: react-simple-maps (SVG world map, d3-geo)
- **Testing**: Vitest (163 tests)

## Routes
| Route | Description |
|-------|-------------|
| `/` | Home — `?q=CityName` fetches and renders 7-day forecast |
| `/day/[index]` | Day detail — `?lat&lon&name&code` params; lat/lon validated; index 0–6 |
| `/countries` | All countries A–Z browser with search, region filter, alphabet jump nav |
| `/countries/[code]` | Cities for a country + same-region section |
| `/map` | Interactive world map with instruction bar |
| `/about` | Static page: features, data sources, tech stack, security |
| `/api/cities?country=Name` | Server proxy → CountriesNow, validated + cached 24 h |
| `/api/city-markers?country=Name` | Geocodes top 10 cities for map markers, cached 24 h |
| `/manifest.webmanifest` | PWA manifest (static) |

## Features

### Home page (`/`)
- City search with autocomplete dropdown (debounced, keyboard navigable)
- "Use my location" geolocation button → navigates to `/day/0`
- Recent searches persisted in localStorage (with Clear button)
- Popular cities quick-links grid
- Current weather hero with time-of-day gradient overlay
- Animated weather emoji (sun spins, rain sways, thunder flashes, etc.)
- Weather alert banner for today (thunderstorm, wind, UV, heavy rain)
- 6-card stats strip: Humidity, Wind+direction, Precipitation, UV, Pressure, Sunrise/Sunset
- 5-day forecast grid with temperature range bars, precipitation probability badge, **⭐ Best** badge
- 5-day temperature trend indicator (warming/cooling/steady) + sparkline SVG
- "Did you know?" fun weather fact
- Country flag emoji next to location name
- Feels-like explanation ("Wind chill makes it feel 4° colder")

### Day detail (`/day/[index]`)
- 7-day forecast with ← / → arrow navigation between days
- Day picker strip (7 buttons, active highlighted)
- Country flag + Share button in header
- Weather alert banner (warning/advisory)
- Main hero: temp, condition, rating, suggestion
- Detail grid: Feels Like (with explanation), Humidity, Wind+direction, Precipitation, UV meter (coloured bar), Sunrise/Sunset + daylight progress bar, Pressure
- Hourly forecast: SVG temperature curve (night shading, sunrise/sunset markers), precipitation probability bar chart, emoji strip with rain% and wind
- Best Times Outside: 24-h colour strip + summary sentence + Excellent/Good windows (peak hour, temp range, activities) + Avoid windows
- What to Wear: clothing chip tags
- Compared to Last Year: visual bar chart (this year vs last year)
- "Did you know?" fun weather fact

### Countries (`/countries`)
- All ~250 countries A–Z with flag, name, capital
- Live search by name or capital, region dropdown filter
- Alphabet jump navigation (A–Z buttons)
- Country data: population, subregion

### Country detail (`/countries/[code]`)
- Country hero: flag, official name, capital, subregion, population (formatted)
- Capital weather button + View on map button
- City browser with live filter (thousands of cities)
- Same-region section (6 countries from same region)

### World map (`/map`)
- Interactive SVG world map (react-simple-maps)
- Hover country → city panel with filter (debounced 350ms, cached)
- Click country → zoom to centroid, city panel, geocoded city markers
- City markers: background label rect, glow ring, clear name labels
- "Browse all cities" → `/countries?search=X` deep link
- Instruction bar showing hover/click/dot/browse hints

### About (`/about`)
- Features overview, data sources, tech stack, security note
- Static page (SSG)

## APIs

| API | Purpose |
|-----|---------|
| `https://api.open-meteo.com/v1/forecast` | 7-day + current weather (incl. wind direction, pressure, precip probability) |
| `https://archive-api.open-meteo.com/v1/archive` | Historical weather |
| `https://geocoding-api.open-meteo.com/v1/search` | City search + autocomplete + country_code |
| `https://restcountries.com/v3.1/all` | Country list (name, flag, capital, region, subregion, population) |
| `https://countriesnow.space/api/v0.1/countries/cities/q` | Cities per country |
| `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` | World map TopoJSON |

## Security

- **HTTP headers**: Content-Security-Policy (connect-src allowlist for 5 APIs), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **API route validation**: `country` param validated with Unicode letter allowlist, max 100 chars
- **Coordinate validation**: `validateCoord()` rejects NaN, Infinity, and out-of-range lat/lon
- **Name capping**: location name param capped at 200 chars
- **Server Components** by default — minimal client-side state

## PWA Support
`src/app/manifest.ts` produces `/manifest.webmanifest` (standalone display, dark theme). Layout sets `themeColor` meta. App is installable in supporting browsers.

## Loading States
Each dynamic route has a `loading.tsx` skeleton matching the page layout.

## Print Support
`@media print` rules in `globals.css` flatten backgrounds and hide navigation for clean printed forecasts.

## Key Lib Functions

### `src/lib/weather.ts`
| Function | Returns |
|----------|---------|
| `buildForecastUrl(lat, lon)` | URL including forecast_days=7, wind, pressure, precip_probability |
| `validateCoord(value, min, max, fallback)` | Validated number or fallback |
| `countryCodeToFlag(code)` | Flag emoji from ISO 3166-1 alpha-2 (e.g. "GB" → 🇬🇧) |
| `getFeelsLikeExplanation(actual, feelsLike, humidity, wind)` | Human-readable explanation |
| `getWeatherScore(code, tempMax)` | 0–4 numeric score for best-day ranking |
| `getDaylightInfo(sunriseISO, sunsetISO)` | `{ hours, minutes, risePercent, lightPercent }` |
| `getOutdoorSummary(bestWindows, badWindows)` | Natural-language summary sentence |
| `getDressCode(code, tempMax, windMax)` | `{ summary, items[] }` clothing suggestions |
| `getWeatherAlert(code, wind, uv, precip)` | `WeatherAlert \| null` |
| `getWindDirection(degrees)` | "N"\|"NE"\|...\|"NW" |
| `getWindArrow(degrees)` | Unicode arrow (↑ ↗ → etc.) |
| `getWeatherAnimClass(code)` | CSS animation class |
| `getWeatherFact(code, temp)` | Contextual weather trivia string |
| `getHourlyAnalysis(...)` | `{ hours, bestWindows, badWindows }` with peak hour, temp range, activities |
| `scoreHour(temp, precipProb, wind, isNight)` | -1..3 score |

### `src/lib/countries.ts`
| Function | Returns |
|----------|---------|
| `normalizeCountryName(name)` | Mapped country name for CountriesNow |
| `getAllCountries()` | All countries (name, cca2, flag, capital, region, subregion, population) |
| `getCountryByCode(code)` | Single country by ISO alpha-2 |
| `getCountriesByRegion(region)` | Countries for a region |
| `selectCandidates(cities, max)` | Evenly-spaced city sample |
| `formatPopulation(n)` | "1.4B" / "67.2M" / "50K" / "500" |

## Test Coverage (163 tests)
- `getWeatherInfo`, `getDayName`, `getFormattedDate`, `getLastYearDate`
- `getWeatherRating`, `describeUV`, `tempDiffDescription`
- `formatHour`, `scoreHour`, `getHourlyAnalysis`, `getDayHourlyData`
- `findBestGeoMatch`, `getWeatherAnimClass`, `getWeatherFact`
- `getWeatherAlert`, `getWindDirection`, `getWindArrow`
- `getOutdoorSummary`, `getDressCode`, `validateCoord`
- `getDaylightInfo`, `getWeatherScore`, `countryCodeToFlag`, `getFeelsLikeExplanation`
- `formatPopulation`, `normalizeCountryName`, `selectCandidates`
