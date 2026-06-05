import Header from "./Header";

// Shared fallback shown when the forecast fetch fails on the home or day pages.
export default function WeatherError({ defaultSearch }: { defaultSearch?: string }) {
  return (
    <div className="min-h-screen bg-[#0e1723] flex flex-col">
      <Header defaultSearch={defaultSearch} />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4">
        <p className="text-[var(--text-muted)] text-lg text-center">
          Failed to load weather data. Please try again later.
        </p>
      </main>
    </div>
  );
}
