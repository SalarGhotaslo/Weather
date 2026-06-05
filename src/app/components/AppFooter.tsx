import Link from "next/link";
import { getTranslations } from "next-intl/server";
import styles from "./AppFooter.module.css";

export default async function AppFooter({ note }: { note?: string }) {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.cols}>
          <div>
            <p className={styles.colTitle}>{t("weather")}</p>
            <ul className={styles.list}>
              <li><Link href="/" className={styles.link}>{t("searchCity")}</Link></li>
              <li className={styles.faint}>{t("fiveDay")}</li>
              <li className={styles.faint}>{t("hourly")}</li>
            </ul>
          </div>
          <div>
            <p className={styles.colTitle}>{t("explore")}</p>
            <ul className={styles.list}>
              <li><Link href="/countries" className={styles.link}>{t("allCountries")}</Link></li>
              <li><Link href="/map" className={styles.link}>{t("worldMap")}</Link></li>
            </ul>
          </div>
          <div>
            <p className={styles.colTitle}>{t("app")}</p>
            <ul className={styles.list}>
              <li><Link href="/about" className={styles.link}>{t("about")}</Link></li>
              <li className={styles.faint}>{t("noAccount")}</li>
              <li className={styles.faint}>{t("freeData")}</li>
            </ul>
          </div>
          <div>
            <p className={styles.colTitle}>{t("data")}</p>
            <ul className={styles.listFaint}>
              <li>Open-Meteo</li>
              <li>REST Countries</li>
              <li>CountriesNow</li>
            </ul>
          </div>
        </div>
        <div className={styles.bottom}>
          <p className={styles.copyright}>{t("copyright", { year: String(year) })}</p>
          {note && <p className={styles.copyright}>{note}</p>}
        </div>
      </div>
    </footer>
  );
}
