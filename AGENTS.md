<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# London Weather App

## Project overview
A weather forecast app for London using Open-Meteo API (free, no key). Built with Next.js 16 App Router + Tailwind CSS v4.

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build (also runs type check)
- `npm run test` — run Vitest unit tests
- `npm run test:watch` — run tests in watch mode
- `npm run lint` — run ESLint

## Code conventions
- Server Components by default; only add `'use client'` when interactivity (state, effects, browser APIs) is required
- Fetch data in Server Components using native `fetch` with `next: { revalidate: N }` for ISR
- Utility/helper functions go in `src/lib/`
- Types used across modules go in `src/lib/` alongside their functions
- Use `@/` path alias for imports from `src/`
- Always add/extend tests in `src/lib/*.test.ts` when adding utility functions

## Open-Meteo API docs
Base: `https://api.open-meteo.com/v1/forecast`
Forecast endpoint params:
- `latitude`, `longitude` — coordinates
- `current` — comma-separated current weather variables
- `daily` — comma-separated daily forecast variables
- `timezone` — e.g. `Europe/London`
Weather codes follow WMO standard (0=clear, 1-2=partly cloudy, 3=overcast, 45/48=fog, 51-57=drizzle, 61-67=rain, 71-77=snow, 80-82=showers, 95+=thunderstorm)
