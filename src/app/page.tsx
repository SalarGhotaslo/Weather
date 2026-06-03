import Link from "next/link";
import {
  geocodeLocation,
  buildForecastUrl,
  getWeatherInfo,
  getDayName,
  type WeatherResponse,
} from "@/lib/weather";
import SearchForm from "@/app/components/SearchForm";

async function getWeather(lat: number, lon: number): Promise<WeatherResponse> {
  const res = await fetch(buildForecastUrl(lat, lon), {
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error("Failed to fetch weather data");
  return res.json();
}

function buildDayHref(index: number, lat: number, lon: number, name: string) {
  return `/day/${index}?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  if (!q) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 text-6xl">⛅</div>
          <h1 className="mb-2 text-4xl font-bold text-white tracking-tight">
            Weather Forecast
          </h1>
          <p className="mb-8 text-sky-100">
            Search for any city to see the 5-day forecast.
          </p>
          <SearchForm large />
        </div>
      </div>
    );
  }

  const location = await geocodeLocation(q);

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 text-5xl">🔍</div>
          <h2 className="mb-2 text-2xl font-bold text-white">
            Location not found
          </h2>
          <p className="mb-8 text-sky-100">
            No results for &ldquo;{q}&rdquo;. Try a different city name.
          </p>
          <SearchForm defaultValue={q} />
        </div>
      </div>
    );
  }

  let weather: WeatherResponse;
  try {
    weather = await getWeather(location.latitude, location.longitude);
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-white text-lg">
          Failed to load weather data. Please try again later.
        </p>
      </div>
    );
  }

  const { current, daily } = weather;
  const todayInfo = getWeatherInfo(current.weather_code);
  const locationLabel = location.admin1
    ? `${location.name}, ${location.admin1}, ${location.country}`
    : `${location.name}, ${location.country}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <SearchForm defaultValue={q} />
        </div>

        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {locationLabel}
          </h1>
          <p className="text-sky-100">5-Day Weather Forecast</p>
        </header>

        <Link
          href={buildDayHref(0, location.latitude, location.longitude, locationLabel)}
          className="mb-8 block rounded-2xl bg-white/15 p-8 text-center text-white shadow-lg backdrop-blur-md transition hover:bg-white/25"
        >
          <div className="text-7xl">{todayInfo.emoji}</div>
          <div className="mt-2 text-6xl font-light tracking-tight">
            {Math.round(current.temperature_2m)}°
          </div>
          <div className="mt-1 text-xl font-medium text-sky-100">
            {todayInfo.label}
          </div>
          <div className="mt-1 text-sm text-sky-200">
            Feels like {Math.round(current.apparent_temperature)}°
          </div>
          <div className="mt-4 flex justify-center gap-6 text-sm text-sky-100">
            <span>💧 {current.relative_humidity_2m}%</span>
            <span>💨 {Math.round(current.wind_speed_10m)} km/h</span>
          </div>
        </Link>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {daily.time.slice(0, 5).map((dateStr, i) => {
            const info = getWeatherInfo(daily.weather_code[i]);
            return (
              <Link
                key={dateStr}
                href={buildDayHref(i, location.latitude, location.longitude, locationLabel)}
                className="rounded-xl bg-white/15 p-4 text-center text-white shadow-sm backdrop-blur-md transition hover:bg-white/25"
              >
                <div className="text-sm font-medium text-sky-100">
                  {getDayName(dateStr)}
                </div>
                <div className="my-2 text-3xl">{info.emoji}</div>
                <div className="text-xs text-sky-200">{info.label}</div>
                <div className="mt-2 text-sm font-semibold">
                  {Math.round(daily.temperature_2m_max[i])}° /{" "}
                  {Math.round(daily.temperature_2m_min[i])}°
                </div>
                <div className="mt-1 text-xs text-sky-200">
                  💨 {Math.round(daily.wind_speed_10m_max[i])} km/h
                </div>
              </Link>
            );
          })}
        </section>

        <footer className="mt-8 text-center text-xs text-sky-200/60">
          Data from Open-Meteo
        </footer>
      </div>
    </div>
  );
}
