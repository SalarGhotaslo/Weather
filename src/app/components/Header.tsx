import Link from "next/link";
import SearchAutocomplete from "./SearchAutocomplete";
import NavTabs from "./NavTabs";

export default function Header({ defaultSearch = "" }: { defaultSearch?: string }) {
  return (
    <header className="bg-[#121f2f] border-b border-[#1e3347]">
      <div className="mx-auto max-w-5xl px-4 flex items-center gap-4">
        <Link href="/" className="shrink-0 group py-3">
          <span className="text-white font-semibold text-sm tracking-wide group-hover:text-[#7ea8c2] transition-colors">
            Salar Weather
          </span>
        </Link>
        <NavTabs />
        <div className="flex-1 py-2 flex">
          <SearchAutocomplete defaultValue={defaultSearch} />
        </div>
      </div>
    </header>
  );
}
