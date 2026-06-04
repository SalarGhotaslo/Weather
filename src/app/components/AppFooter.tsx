import Link from "next/link";

export default function AppFooter({ note }: { note?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0c1520] border-t border-[#1e3347] mt-auto">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 mb-6 text-xs">
          <div>
            <p className="text-[var(--text-accent)] font-semibold mb-2 uppercase tracking-wider">Weather</p>
            <ul className="space-y-1.5 text-[var(--text-muted)]">
              <li><Link href="/" className="hover:text-white transition-colors">Search a city</Link></li>
              <li className="text-[var(--text-faint)]">5-day forecast</li>
              <li className="text-[var(--text-faint)]">Hourly detail</li>
            </ul>
          </div>
          <div>
            <p className="text-[var(--text-accent)] font-semibold mb-2 uppercase tracking-wider">Explore</p>
            <ul className="space-y-1.5 text-[var(--text-muted)]">
              <li><Link href="/countries" className="hover:text-white transition-colors">All countries</Link></li>
              <li><Link href="/map" className="hover:text-white transition-colors">World map</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[var(--text-accent)] font-semibold mb-2 uppercase tracking-wider">App</p>
            <ul className="space-y-1.5 text-[var(--text-muted)]">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li className="text-[var(--text-faint)]">No account needed</li>
              <li className="text-[var(--text-faint)]">Free &amp; open data</li>
            </ul>
          </div>
          <div>
            <p className="text-[var(--text-accent)] font-semibold mb-2 uppercase tracking-wider">Data</p>
            <ul className="space-y-1.5 text-[var(--text-faint)]">
              <li>Open-Meteo</li>
              <li>REST Countries</li>
              <li>CountriesNow</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#1e3347] pt-4 flex items-center justify-between flex-wrap gap-2">
          <p className="text-[var(--text-faint)] text-xs">
            © {year} Salar Weather · No API keys · No tracking
          </p>
          {note && <p className="text-[var(--text-faint)] text-xs">{note}</p>}
        </div>
      </div>
    </footer>
  );
}
