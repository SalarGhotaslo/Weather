"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import styles from "./NavTabs.module.css";

const tabs = [
  { href: "/", key: "home" },
  { href: "/countries", key: "countries" },
  { href: "/map", key: "map" },
  { href: "/about", key: "about" },
] as const;

export default function NavTabs() {
  const pathname = usePathname();
  const t = useTranslations("nav");

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
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
