"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home" },
  { href: "/countries", label: "Countries" },
  { href: "/map", label: "Map" },
  { href: "/about", label: "About" },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/"
            ? pathname === "/" || pathname.startsWith("/day")
            : pathname.startsWith(tab.href);


        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              isActive
                ? "text-white border-[#3b87d6]"
                : "text-[#7ea8c2] border-transparent hover:text-white hover:border-[#2a4055]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
