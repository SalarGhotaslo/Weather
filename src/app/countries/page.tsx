import type { Metadata } from "next";
import Link from "next/link";
import { getAllCountries, type Country } from "@/lib/countries";
import Header from "@/app/components/Header";
import AppFooter from "@/app/components/AppFooter";
import CountriesFilter from "./CountriesFilter";
import styles from "./page.module.css";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "All Countries",
  description: "Browse weather for all 250 countries — click any country to explore its cities and get a forecast.",
};

export default async function CountriesPage() {
  let countries: Country[];
  try {
    countries = await getAllCountries();
  } catch {
    return (
      <div className={styles.shell}>
        <Header />
        <main id="main-content" className={styles.errorMain}>
          <p className={styles.errorText}>Failed to load countries. Please try again later.</p>
        </main>
      </div>
    );
  }

  // Group alphabetically
  const grouped = countries.reduce<Record<string, Country[]>>((acc, country) => {
    const letter = country.name.common[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(country);
    return acc;
  }, {});
  const letters = Object.keys(grouped).sort();

  return (
    <div className={styles.shell}>
      <Header />

      <main id="main-content" className={styles.main}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/" className={styles.crumbLink}>Home</Link>
          <span aria-hidden="true">/</span>
          <span className={styles.crumbCurrent}>Countries</span>
        </nav>

        <div className={styles.headerBlock}>
          <h1 className={styles.title}>All Countries</h1>
          <p className={styles.subtitle}>
            {countries.length} countries · search, filter by region, or click to browse cities
          </p>
        </div>

        <CountriesFilter countries={countries} grouped={grouped} letters={letters} />
      </main>

      <AppFooter />
    </div>
  );
}
