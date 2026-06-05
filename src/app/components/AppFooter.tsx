import Link from "next/link";
import styles from "./AppFooter.module.css";

export default function AppFooter({ note }: { note?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.cols}>
          <div>
            <p className={styles.colTitle}>Weather</p>
            <ul className={styles.list}>
              <li><Link href="/" className={styles.link}>Search a city</Link></li>
              <li className={styles.faint}>5-day forecast</li>
              <li className={styles.faint}>Hourly detail</li>
            </ul>
          </div>
          <div>
            <p className={styles.colTitle}>Explore</p>
            <ul className={styles.list}>
              <li><Link href="/countries" className={styles.link}>All countries</Link></li>
              <li><Link href="/map" className={styles.link}>World map</Link></li>
            </ul>
          </div>
          <div>
            <p className={styles.colTitle}>App</p>
            <ul className={styles.list}>
              <li><Link href="/about" className={styles.link}>About</Link></li>
              <li className={styles.faint}>No account needed</li>
              <li className={styles.faint}>Free & open data</li>
            </ul>
          </div>
          <div>
            <p className={styles.colTitle}>Data</p>
            <ul className={styles.listFaint}>
              <li>Open-Meteo</li>
              <li>REST Countries</li>
              <li>CountriesNow</li>
            </ul>
          </div>
        </div>
        <div className={styles.bottom}>
          <p className={styles.copyright}>© {year} Salar Weather · No API keys · No tracking</p>
          {note && <p className={styles.copyright}>{note}</p>}
        </div>
      </div>
    </footer>
  );
}
