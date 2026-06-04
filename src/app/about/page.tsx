import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/components/Header";
import AppFooter from "@/app/components/AppFooter";

export const metadata: Metadata = {
  title: "About",
  description: "About Salar Weather — data sources, how it works, and the team behind it.",
};

const DATA_SOURCES = [
  {
    name: "Open-Meteo",
    url: "https://open-meteo.com",
    description: "Current conditions, 5-day daily forecast, 6-day hourly forecast, UV index, wind, precipitation.",
    badge: "Free & Open Source",
  },
  {
    name: "Open-Meteo Archive",
    url: "https://open-meteo.com",
    description: "Historical weather for the same calendar date last year, used for the year-on-year comparison.",
    badge: "Free & Open Source",
  },
  {
    name: "Open-Meteo Geocoding",
    url: "https://open-meteo.com/en/docs/geocoding-api",
    description: "City search autocomplete and coordinate lookup. Returns population data for smart result ranking.",
    badge: "Free & Open Source",
  },
  {
    name: "REST Countries",
    url: "https://restcountries.com",
    description: "All 250 countries — name, flag emoji, capital, region, subregion, and population.",
    badge: "Public API",
  },
  {
    name: "CountriesNow",
    url: "https://countriesnow.space",
    description: "City lists per country. Used in the countries browser and the interactive world map panel.",
    badge: "Public API",
  },
  {
    name: "Natural Earth / world-atlas",
    url: "https://github.com/topojson/world-atlas",
    description: "TopoJSON world map geometry at 110m resolution, rendered with react-simple-maps.",
    badge: "Public Domain",
  },
];

const FEATURES = [
  { icon: "🔍", title: "City search", desc: "Autocomplete powered by Open-Meteo geocoding. Smart country-hint ranking chooses the right city when multiple share a name." },
  { icon: "📅", title: "5-day forecast", desc: "Temperature range bars, precipitation probability, weather icon, and a temperature trend sparkline across the week." },
  { icon: "🕐", title: "Hourly detail", desc: "SVG temperature curve with night shading and sunrise/sunset markers, rain probability bars, and hour-by-hour emoji strip." },
  { icon: "🏆", title: "Best times outside", desc: "Each hour is scored by temperature, rain chance, and wind. Continuous windows are found and ranked, with activity suggestions and a natural-language summary." },
  { icon: "👔", title: "What to wear", desc: "Clothing suggestions tailored to the forecast temperature, weather code, and wind speed." },
  { icon: "📜", title: "Year-on-year comparison", desc: "The same calendar date last year, fetched from the Open-Meteo archive and compared side-by-side." },
  { icon: "🌍", title: "Countries browser", desc: "All 250 countries A–Z with flag, capital, population, and subregion. Live search + region filter. Alphabet jump navigation." },
  { icon: "🗺️", title: "Interactive world map", desc: "SVG map with hover city preview, click-to-zoom, geocoded city markers with labels, and deep links to the countries browser." },
  { icon: "⚠️", title: "Weather alerts", desc: "Contextual banners for thunderstorms, heavy snow, high wind, heavy rain, and extreme UV." },
  { icon: "💡", title: "Weather facts", desc: "A fun weather fact tuned to the current conditions shown on every forecast page." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0e1723] flex flex-col">
      <Header />

      <main id="main-content" className="mx-auto w-full max-w-4xl px-4 py-8 flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#5a7d99] mb-6">
          <Link href="/" className="hover:text-[#7ea8c2] transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#7ea8c2]">About</span>
        </nav>

        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl weather-sunny-glow inline-block" aria-hidden="true">⛅</span>
            <div>
              <h1 className="text-3xl font-bold text-white">Salar Weather</h1>
              <p className="text-[#7ea8c2] mt-1">Global city weather, beautifully presented.</p>
            </div>
          </div>
          <p className="text-[#c8dae7] leading-relaxed max-w-2xl">
            A fast, accessible weather app built with Next.js 16. Search any city on earth,
            explore an interactive world map, browse all 250 countries and their cities,
            and get detailed daily forecasts with hourly breakdowns, outdoor activity scores,
            and year-on-year comparisons — all from fully free, open APIs.
          </p>
        </div>

        {/* Features */}
        <section className="mb-10">
          <h2 className="text-white font-semibold text-lg mb-4">Features</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-[#162535] rounded-lg p-4 flex gap-3">
                <span className="text-xl shrink-0" aria-hidden="true">{f.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold mb-0.5">{f.title}</p>
                  <p className="text-[#7ea8c2] text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Data sources */}
        <section className="mb-10">
          <h2 className="text-white font-semibold text-lg mb-4">Data Sources</h2>
          <div className="space-y-3">
            {DATA_SOURCES.map((src) => (
              <div key={src.name} className="bg-[#162535] rounded-lg p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white text-sm font-semibold">{src.name}</span>
                    <span className="text-[10px] bg-[#1c3450] text-[#3b87d6] px-2 py-0.5 rounded-full">
                      {src.badge}
                    </span>
                  </div>
                  <p className="text-[#7ea8c2] text-xs leading-relaxed">{src.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[#5a7d99] text-xs mt-4">
            No API keys are required. All data is fetched server-side with ISR caching (weather: 30 min, country/city data: 24 h).
          </p>
        </section>

        {/* Tech stack */}
        <section className="mb-10">
          <h2 className="text-white font-semibold text-lg mb-4">Built with</h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Next.js 16 App Router",
              "TypeScript",
              "Tailwind CSS v4",
              "react-simple-maps",
              "d3-geo",
              "Vitest",
              "Geist Font",
            ].map((tech) => (
              <span key={tech} className="bg-[#162535] border border-[#2a4055] text-[#c8dae7] text-xs px-3 py-1.5 rounded-full">
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Security note */}
        <section className="mb-10">
          <h2 className="text-white font-semibold text-lg mb-3">Security</h2>
          <div className="bg-[#162535] rounded-lg p-4 text-[#7ea8c2] text-sm leading-relaxed">
            <p>All API route inputs are validated and sanitised. HTTP security headers are set on every response (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Recent city searches are stored only in your browser&apos;s <code className="bg-[#1c2f3f] px-1 rounded text-xs">localStorage</code> — no data leaves your device.</p>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-[#1e3347]">
          <Link href="/" className="bg-[#3b87d6] hover:bg-[#2d6fb8] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Search weather
          </Link>
          <Link href="/countries" className="bg-[#162535] hover:bg-[#1c2f3f] text-[#7ea8c2] hover:text-white px-5 py-2.5 rounded-lg text-sm transition-colors">
            Browse countries
          </Link>
          <Link href="/map" className="bg-[#162535] hover:bg-[#1c2f3f] text-[#7ea8c2] hover:text-white px-5 py-2.5 rounded-lg text-sm transition-colors">
            World map
          </Link>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
