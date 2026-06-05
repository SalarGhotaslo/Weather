import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountryByCode, getCitiesForCountry, getCountriesByRegion, formatPopulation } from "@/lib/countries";
import Header from "@/app/components/Header";
import AppFooter from "@/app/components/AppFooter";
import CitiesFilter from "./CitiesFilter";
import styles from "./page.module.css";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const country = await getCountryByCode(code);
  if (!country) return {};
  return {
    title: `${country.name.common} — Cities & Weather`,
    description: `Browse cities in ${country.name.common} and get weather forecasts. Capital: ${country.capital?.[0] ?? "N/A"}.`,
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const country = await getCountryByCode(code);
  if (!country) notFound();

  const [cities, regionCountries] = await Promise.all([
    getCitiesForCountry(country.name.common),
    getCountriesByRegion(country.region),
  ]);

  const sameRegion = regionCountries
    .filter((c) => c.cca2 !== country.cca2)
    .slice(0, 6);

  const capital = country.capital?.[0];

  return (
    <div className={styles.shell}>
      <Header />

      <main id="main-content" className={styles.main}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/" className={styles.crumbLink}>Home</Link>
          <span>/</span>
          <Link href="/countries" className={styles.crumbLink}>Countries</Link>
          <span>/</span>
          <span className={styles.crumbCurrent}>{country.name.common}</span>
        </nav>

        <div className={styles.hero}>
          <div className={styles.heroRow}>
            <span className={styles.heroFlag}>{country.flag}</span>
            <div className={styles.heroBody}>
              <h1 className={styles.title}>{country.name.common}</h1>
              <p className={styles.official}>{country.name.official}</p>
              <div className={styles.metaRow}>
                {capital && <span className={styles.metaSm}>📍 Capital: {capital}</span>}
                <span className={styles.metaXs}>{country.subregion ?? country.region}</span>
                {country.population != null && country.population > 0 && (
                  <span className={styles.metaXs}>👥 {formatPopulation(country.population)} people</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.quickLinks}>
            {capital && (
              <Link
                href={`/?q=${encodeURIComponent(`${capital}, ${country.name.common}`)}`}
                className={styles.primaryBtn}
              >
                ⛅ Weather in {capital}
              </Link>
            )}
            <Link href={`/map`} className={styles.secondaryBtn}>🗺️ View on map</Link>
          </div>
        </div>

        <div>
          <h2 className={styles.sectionTitle}>Cities</h2>
          <p className={styles.sectionSub}>Click any city to see its weather forecast</p>

          {cities.length > 0 ? (
            <CitiesFilter cities={cities} countryName={country.name.common} />
          ) : (
            <div className={styles.emptyCities}>
              <p className={styles.emptyCitiesText}>City data unavailable for {country.name.common}.</p>
              <p className={styles.emptyCitiesHint}>Use the search bar above to find a specific city.</p>
            </div>
          )}
        </div>

        {sameRegion.length > 0 && (
          <div className={styles.region}>
            <h2 className={styles.regionTitle}>More in {country.subregion ?? country.region}</h2>
            <div className={styles.regionGrid}>
              {sameRegion.map((c) => (
                <Link key={c.cca2} href={`/countries/${c.cca2}`} className={`${styles.regionLink} group`}>
                  <span className={styles.regionFlag}>{c.flag}</span>
                  <div className="min-w-0">
                    <p className={styles.regionName}>{c.name.common}</p>
                    {c.capital?.[0] && <p className={styles.regionCapital}>{c.capital[0]}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
