import Link from "next/link";
import SearchAutocomplete from "./SearchAutocomplete";
import NavTabs from "./NavTabs";
import styles from "./Header.module.css";

export default function Header({ defaultSearch = "", hideSearch }: { defaultSearch?: string; hideSearch?: boolean }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandText}>Salar Weather</span>
        </Link>
        <NavTabs />
        {!hideSearch && (
          <div className={styles.searchWrap}>
            <SearchAutocomplete defaultValue={defaultSearch} />
          </div>
        )}
      </div>
    </header>
  );
}
