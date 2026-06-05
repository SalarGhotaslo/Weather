import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/components/Header";
import AppFooter from "@/app/components/AppFooter";
import ParticleField from "@/app/components/weather-effects/ParticleField";
import styles from "./page.module.css";

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
    <div className={styles.shell}>
      <ParticleField />
      <Header />

      <main id="main-content" className={styles.main}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/" className={styles.crumbLink}>Home</Link>
          <span aria-hidden="true">/</span>
          <span className={styles.crumbCurrent}>About</span>
        </nav>

        <div className={styles.hero}>
          <div className={styles.heroRow}>
            <span className={`${styles.heroEmoji} weather-sunny-glow`} aria-hidden="true">⛅</span>
            <div>
              <h1 className={styles.title}>Salar Weather</h1>
              <p className={styles.tagline}>Global city weather, beautifully presented.</p>
            </div>
          </div>
          <p className={styles.lead}>
            A fast, accessible weather app built with Next.js 16. Search any city on earth,
            explore an interactive world map, browse all 250 countries and their cities,
            and get detailed daily forecasts with hourly breakdowns, outdoor activity scores,
            and year-on-year comparisons — all from fully free, open APIs.
          </p>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Features</h2>
          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <span className={styles.featureIcon} aria-hidden="true">{f.icon}</span>
                <div>
                  <p className={styles.featureTitle}>{f.title}</p>
                  <p className={styles.featureDesc}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Data Sources</h2>
          <div className={styles.sourceList}>
            {DATA_SOURCES.map((src) => (
              <div key={src.name} className={styles.sourceCard}>
                <div className={styles.sourceBody}>
                  <div className={styles.sourceHead}>
                    <span className={styles.sourceName}>{src.name}</span>
                    <span className={styles.sourceBadge}>{src.badge}</span>
                  </div>
                  <p className={styles.sourceDesc}>{src.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className={styles.note}>
            No API keys are required. All data is fetched server-side with ISR caching (weather: 30 min, country/city data: 24 h).
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Built with</h2>
          <div className={styles.techRow}>
            {[
              "Next.js 16 App Router",
              "TypeScript",
              "Tailwind CSS v4",
              "react-simple-maps",
              "d3-geo",
              "Vitest",
              "Bricolage Grotesque",
            ].map((tech) => (
              <span key={tech} className={styles.techChip}>{tech}</span>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitleTight}>Security</h2>
          <div className={styles.securityBox}>
            <p>All API route inputs are validated and sanitised. HTTP security headers are set on every response (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Recent city searches are stored only in your browser&apos;s <code className={styles.code}>localStorage</code> — no data leaves your device.</p>
          </div>
        </section>

        <div className={styles.nav}>
          <Link href="/" className={styles.navPrimary}>Search weather</Link>
          <Link href="/countries" className={styles.navSecondary}>Browse countries</Link>
          <Link href="/map" className={styles.navSecondary}>World map</Link>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
