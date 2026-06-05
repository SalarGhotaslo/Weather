import Link from "next/link";
import SearchAutocomplete from "@/app/components/SearchAutocomplete";
import Header from "@/app/components/Header";
import RecentSearches from "@/app/components/RecentSearches";
import GeolocateButton from "@/app/components/GeolocateButton";
import styles from "./HomeLanding.module.css";

const POPULAR_CITIES = [
  "London, UK",
  "New York, US",
  "Tokyo, Japan",
  "Paris, France",
  "Sydney, Australia",
  "Dubai, UAE",
  "Barcelona, Spain",
  "Toronto, Canada",
];

// Empty-state landing shown at "/" with no ?q — search box, geolocation,
// recent searches and popular-city shortcuts.
export default function HomeLanding() {
  return (
    <div className={styles.shell}>
      <Header />
      <main id="main-content" className={styles.main}>
        <div className={styles.inner}>
          <div className={styles.hero}>
            <div className={`${styles.heroEmoji} weather-sunny-glow`}>⛅</div>
            <h1 className={styles.title}>Salar Weather</h1>
            <p className={styles.subtitle}>Search for a city, town or postcode</p>
          </div>

          <SearchAutocomplete large />
          <GeolocateButton />
          <RecentSearches />

          <div className={styles.popular}>
            <p className={styles.popularLabel}>Popular cities</p>
            <div className={styles.popularGrid}>
              {POPULAR_CITIES.map((city) => (
                <Link key={city} href={`/?q=${encodeURIComponent(city)}`} className={styles.cityLink}>
                  {city.split(",")[0]}
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.links}>
            <Link href="/countries" className={styles.link}>🌍 Browse countries</Link>
            <Link href="/map" className={styles.link}>🗺️ World map</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
