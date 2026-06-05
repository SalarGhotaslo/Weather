"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./NavTabs.module.css";

const tabs = [
  { href: "/", label: "Home" },
  { href: "/countries", label: "Countries" },
  { href: "/map", label: "Map" },
  { href: "/about", label: "About" },
] as const;

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/"
            ? pathname === "/" || pathname.startsWith("/day")
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab} ${isActive ? styles.tabActive : styles.tabInactive}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
