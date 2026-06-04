import Link from "next/link";
import SearchForm from "./SearchForm";

export default function Header({ defaultSearch = "" }: { defaultSearch?: string }) {
  return (
    <header className="bg-[#121f2f] border-b border-[#1e3347]">
      <div className="mx-auto max-w-4xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="text-white font-semibold text-sm tracking-wide group-hover:text-[#7ea8c2] transition-colors">
            Salar Weather
          </span>
        </Link>
        <SearchForm defaultValue={defaultSearch} />
      </div>
    </header>
  );
}
