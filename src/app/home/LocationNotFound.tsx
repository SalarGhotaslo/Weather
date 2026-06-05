import Link from "next/link";
import Header from "@/app/components/Header";
import styles from "./LocationNotFound.module.css";

// Shown when geocoding returns no match for the searched query.
export default function LocationNotFound({ query }: { query: string }) {
  return (
    <div className={styles.shell}>
      <Header defaultSearch={query} />
      <main id="main-content" className={styles.main}>
        <div className={styles.inner}>
          <div className={styles.emoji}>🔍</div>
          <h2 className={styles.title}>Location not found</h2>
          <p className={styles.message}>
            No results for &ldquo;{query}&rdquo;. Try a different city name.
          </p>
          <div className={styles.links}>
            <Link href="/countries" className={styles.link}>Browse countries →</Link>
            <Link href="/map" className={styles.link}>Open map →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
