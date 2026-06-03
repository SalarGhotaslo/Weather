# London Weather App — Plan

## Overview
A Next.js 16 app displaying today's weather and a 5-day forecast for London, UK.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **API**: Open-Meteo (free, no API key required)
- **Testing**: Vitest

## Requirements

### Functional
- Show current temperature, "feels like", humidity, wind speed for London
- Show a 5-day forecast (today + next 4 days) with daily max/min temps, weather conditions, wind
- Gracefully handle API errors with a fallback UI
- Data refreshes every 30 minutes (ISR)
- Click any day card to open a detail page with:
  - Expanded weather data (UV index, sunrise/sunset, feels-like, humidity, precipitation)
  - Historical comparison: how today's forecast compares to the same calendar date last year
  - Fun extras: weather rating, activity suggestions

### Non-Functional
- Server-side rendered (static generation with revalidation)
- Mobile-responsive layout
- Dark-themed gradient design

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Tailwind base + theme
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page — fetches & renders weather
│   └── day/
│       └── [index]/
│           └── page.tsx     # Day detail page (dynamic route)
├── lib/
│   ├── weather.ts           # Utility functions + types
│   └── weather.test.ts      # Unit tests
```

## APIs
- **Open-Meteo Forecast API** (`GET https://api.open-meteo.com/v1/forecast`)
  - Free for non-commercial and commercial use (CC-0 license)
  - No API key or rate-limiting for moderate usage
- **Open-Meteo Historical API** (`GET https://archive-api.open-meteo.com/v1/archive`)
  - Used on the detail page to compare with the same calendar date last year

## Build & Run

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm run test       # Run tests
```

## Future Enhancements (not implemented)
- Search for any city
- Hourly breakdown
- Weather alerts
- Location-based auto-detection
- Dark/light theme toggle
