import Link from "next/link";
import MapWeatherCard from "./MapWeatherCard";
import type { CurrentWeather } from "@/app/api/current/route";
import styles from "./CitiesPanel.module.css";

type Card = CurrentWeather & { country: string };

export interface CitiesPanelProps {
  panelCountry: string | null;
  panelCities: string[];
  panelLoading: boolean;
  cityFilter: string;
  setCityFilter: (v: string) => void;
  displayedCities: string[];
  cardLoading: boolean;
  cardError: boolean;
  card: Card | null;
  onCityClick: (city: string) => void;
  majorCities?: string[];
}

// The map's right-hand cities panel: country header, inline weather card, city
// filter + list, footer deep link — or the "explore the world" empty state.
export default function CitiesPanel({
  panelCountry, panelCities, panelLoading, cityFilter, setCityFilter,
  displayedCities, cardLoading, cardError, card, onCityClick, majorCities,
}: CitiesPanelProps) {
  return (
    <div className={styles.panel}>
      {panelCountry ? (
        <>
          <div className={styles.header}>
            <h2 className={styles.title}>{panelCountry}</h2>
            {!panelLoading && (
              <p className={styles.count}>
                {panelCities.length.toLocaleString()} cities · click one for its weather
              </p>
            )}
          </div>

          <MapWeatherCard loading={cardLoading} error={cardError} card={card} />

          <div className={styles.filterWrap}>
            <input
              type="search"
              value={cityFilter}
              aria-label="Filter cities"
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Filter cities…"
              className={styles.input}
            />
          </div>

          {!cityFilter && majorCities && majorCities.length > 0 && (
            <div className={styles.popular}>
              <div className={styles.popularHeader}>
                <span className={styles.popularTitle}>Popular</span>
              </div>
              <div className={styles.popularGrid}>
                {majorCities.map((city) => (
                  <button key={city} type="button" onClick={() => onCityClick(city)} className={styles.popularBtn}>
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.list}>
            {panelLoading ? (
              <div className={styles.skeletonWrap}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={styles.skelItem} style={{ width: `${60 + (i % 3) * 15}%` }} />
                ))}
              </div>
            ) : displayedCities.length > 0 ? (
              <>
                {displayedCities.map((city) => (
                  <button key={city} type="button" onClick={() => onCityClick(city)} className={styles.cityBtn}>
                    {city}
                  </button>
                ))}
                {!cityFilter && panelCities.length > 60 && (
                  <p className={styles.note}>
                    Showing 60 of {panelCities.length.toLocaleString()}. Search to filter.
                  </p>
                )}
                {cityFilter && displayedCities.length === 0 && (
                  <p className={styles.message}>No cities match.</p>
                )}
              </>
            ) : (
              <p className={styles.message}>No city data available.</p>
            )}
          </div>

          <div className={styles.footer}>
            <a href={`/countries?search=${encodeURIComponent(panelCountry ?? "")}`} className={styles.footerLink}>
              Browse all cities in {panelCountry} →
            </a>
          </div>
        </>
      ) : (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyInner}>
            <div className={styles.emptyEmoji}>🌍</div>
            <p className={styles.emptyTitle}>Explore the world</p>
            <p className={styles.emptyLineTight}>Hover a country to see its cities</p>
            <p className={styles.emptyLine}>Click to zoom in</p>
            <p className={styles.emptyLineTighter}>Triple-click to zoom out</p>
            <Link href="/countries" className={styles.emptyLink}>Or browse all countries →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
