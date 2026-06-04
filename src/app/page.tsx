import type { Metadata } from "next";
import Link from "next/link";
import {
  geocodeLocation,
  buildForecastUrl,
  getWeatherInfo,
  getDayName,
  getFormattedDate,
  describeUV,
  getWeatherAnimClass,
  getWeatherFact,
  getWindDirection,
  getWindArrow,
  type WeatherResponse,
} from "@/lib/weather";
import SearchAutocomplete from "@/app/components/SearchAutocomplete";
import Header from "@/app/components/Header";
import RecentSearches from "@/app/components/RecentSearches";
import SearchTracker from "@/app/components/SearchTracker";

const POPULAR_CITIES = [
  "London, UK",
  "New York, US",
  "Tokyo, Japan",
  "Paris, France",
  "Sydney, Australia",
  "Dubai, UAE",
  "Barcelona, Spain",
  "Toronto, Canada",
];

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

function getBarColor(avgTemp: number): string {
  if (avgTemp <= 2) return "#60a5fa";
  if (avgTemp <= 10) return "#38bdf8";
  if (avgTemp <= 18) return "#86efac";
  if (avgTemp <= 26) return "#fbbf24";
  return "#f97316";
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#162535] rounded-lg px-4 py-3">
      <div className="text-[#5a7d99] text-xs mb-1">{label}</div>
      <div className="flex items-center gap-1.5">
        <span className="text-base" aria-hidden="true">{icon}</span>
        <span className="text-white font-semibold text-sm">{value}</span>
      </div>
      {sub && <div className="text-[#5a7d99] text-[10px] mt-0.5">{sub}</div>}
    </div>
  );
}

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  if (!q) return {};
  const location = await geocodeLocation(q);
  if (!location) return { title: `Search: ${q}` };
  const name = location.admin1
    ? `${location.name}, ${location.admin1}, ${location.country}`
    : `${location.name}, ${location.country}`;
  return {
    title: `Weather in ${location.name}, ${location.country}`,
    description: `Current weather and 5-day forecast for ${name}.`,
  };
}

export default async function Home({ searchParams }: Props) {
  const { q } = await searchParams;

  if (!q) {
    return (
      <div className="min-h-screen bg-[#0e1723] flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4 weather-sunny-glow inline-block">⛅</div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Salar Weather
              </h1>
              <p className="text-[#7ea8c2]">Search for a city, town or postcode</p>
            </div>

            <SearchAutocomplete large />

            {/* Recent searches (client-side from localStorage) */}
            <RecentSearches />

            {/* Popular cities */}
            <div className="mt-8">
              <p className="text-[#5a7d99] text-xs font-semibold uppercase tracking-wider mb-3">
                Popular cities
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {POPULAR_CITIES.map((city) => (
                  <Link
                    key={city}
                    href={`/?q=${encodeURIComponent(city)}`}
                    className="bg-[#162535] hover:bg-[#1c2f3f] rounded-lg px-3 py-2 text-center text-[#7ea8c2] hover:text-white text-xs transition-colors"
                  >
                    {city.split(",")[0]}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-6 text-sm text-[#5a7d99]">
              <Link href="/countries" className="hover:text-[#7ea8c2] transition-colors">
                🌍 Browse countries
              </Link>
              <Link href="/map" className="hover:text-[#7ea8c2] transition-colors">
                🗺️ World map
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const location = await geocodeLocation(q);

  if (!location) {
    return (
      <div className="min-h-screen bg-[#0e1723] flex flex-col">
        <Header defaultSearch={q} />
        <main id="main-content" className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-lg text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">Location not found</h2>
            <p className="text-[#7ea8c2] mb-6">
              No results for &ldquo;{q}&rdquo;. Try a different city name.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <Link href="/countries" className="text-[#3b87d6] hover:text-white transition-colors">
                Browse countries →
              </Link>
              <Link href="/map" className="text-[#3b87d6] hover:text-white transition-colors">
                Open map →
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  let weather: WeatherResponse;
  try {
    weather = await getWeather(location.latitude, location.longitude);
  } catch {
    return (
      <div className="min-h-screen bg-[#0e1723] flex flex-col">
        <Header defaultSearch={q} />
        <main id="main-content" className="flex-1 flex items-center justify-center">
          <p className="text-[#7ea8c2] text-lg">
            Failed to load weather data. Please try again later.
          </p>
        </main>
      </div>
    );
  }

  const { current, daily } = weather;
  const todayInfo = getWeatherInfo(current.weather_code);
  const animClass = getWeatherAnimClass(current.weather_code);
  const locationLabel = location.admin1
    ? `${location.name}, ${location.admin1}, ${location.country}`
    : `${location.name}, ${location.country}`;

  const overallMin = Math.min(...daily.temperature_2m_min.slice(0, 5));
  const overallMax = Math.max(...daily.temperature_2m_max.slice(0, 5));
  const tempRange = overallMax - overallMin || 1;

  const todayFormatted = getFormattedDate(daily.time[0]);
  const uvToday = describeUV(daily.uv_index_max[0]);
  const weatherFact = getWeatherFact(current.weather_code, current.temperature_2m);

  return (
    <div className="min-h-screen bg-[#0e1723] flex flex-col">
      <Header defaultSearch={q} />

      {/* Track this search in localStorage */}
      <SearchTracker cityLabel={locationLabel} />

      <main id="main-content" className="mx-auto w-full max-w-4xl px-4 py-6 flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#5a7d99] mb-4">
          <Link href="/" className="hover:text-[#7ea8c2] transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#7ea8c2] truncate max-w-[200px]">{location.name}</span>
        </nav>

        {/* Location */}
        <div className="mb-5">
          <div className="flex items-baseline gap-2">
            <span aria-hidden="true" className="text-[#7ea8c2] text-sm">📍</span>
            <h1 className="text-xl font-bold text-white">{locationLabel}</h1>
          </div>
          <p className="text-[#5a7d99] text-sm mt-0.5 pl-5">{todayFormatted}</p>
        </div>

        {/* Current weather hero */}
        <Link
          href={buildDayHref(0, location.latitude, location.longitude, locationLabel)}
          className="block bg-[#162535] hover:bg-[#1c2f3f] rounded-xl p-6 mb-3 transition-colors"
          aria-label={`Today: ${todayInfo.label}, ${Math.round(current.temperature_2m)}°C. View details.`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[68px] font-light text-white leading-none tracking-tight" aria-hidden="true">
                {Math.round(current.temperature_2m)}°C
              </div>
              <div className="text-lg text-white mt-2 font-medium">{todayInfo.label}</div>
              <div className="text-[#7ea8c2] text-sm mt-1">
                Feels like {Math.round(current.apparent_temperature)}°C
              </div>
            </div>
            <span className={`text-[72px] leading-none ${animClass}`} aria-hidden="true">{todayInfo.emoji}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e3347] flex items-center justify-between">
            <span className="text-[#7ea8c2] text-xs">
              High {Math.round(daily.temperature_2m_max[0])}°C · Low {Math.round(daily.temperature_2m_min[0])}°C
            </span>
            <span className="text-[#3b87d6] text-xs font-medium">View details →</span>
          </div>
        </Link>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-2 mb-6 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon="💧" label="Humidity" value={`${current.relative_humidity_2m}%`} />
          <StatCard
            icon="💨"
            label="Wind"
            value={`${Math.round(current.wind_speed_10m)} km/h`}
            sub={`${getWindArrow(current.wind_direction_10m)} ${getWindDirection(current.wind_direction_10m)}`}
          />
          <StatCard icon="🌧️" label="Precipitation" value={`${daily.precipitation_sum[0]} mm`} />
          <StatCard icon="☀️" label="UV Index" value={`${daily.uv_index_max[0]} · ${uvToday.label}`} />
          <StatCard icon="🌡️" label="Pressure" value={`${Math.round(current.surface_pressure)} hPa`} />
          <StatCard icon="🌅" label="Sunrise" value={daily.sunrise[0].split("T")[1]} sub={`Sunset ${daily.sunset[0].split("T")[1]}`} />
        </div>

        {/* 5-day forecast */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#5a7d99] text-xs font-semibold uppercase tracking-widest">
              5-Day Forecast
            </h2>
            {/* Trend indicator */}
            {(() => {
              const temps = daily.temperature_2m_max.slice(0, 5);
              const diff = Math.round(temps[4] - temps[0]);
              if (diff > 2) return <span className="text-[10px] text-orange-400">↑ warming {diff}°</span>;
              if (diff < -2) return <span className="text-[10px] text-blue-400">↓ cooling {Math.abs(diff)}°</span>;
              return <span className="text-[10px] text-[#5a7d99]">→ steady</span>;
            })()}
          </div>
          <div className="grid grid-cols-5 gap-2" role="list">
            {daily.time.slice(0, 5).map((dateStr, i) => {
              const info = getWeatherInfo(daily.weather_code[i]);
              const maxTemp = Math.round(daily.temperature_2m_max[i]);
              const minTemp = Math.round(daily.temperature_2m_min[i]);
              const avgTemp = (daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2;
              const barLeft = ((daily.temperature_2m_min[i] - overallMin) / tempRange) * 100;
              const barWidth = Math.max(
                ((daily.temperature_2m_max[i] - daily.temperature_2m_min[i]) / tempRange) * 100,
                8,
              );
              const barColor = getBarColor(avgTemp);
              const isToday = i === 0;

              return (
                <Link
                  key={dateStr}
                  href={buildDayHref(i, location.latitude, location.longitude, locationLabel)}
                  role="listitem"
                  aria-label={`${getDayName(dateStr)}: ${info.label}, high ${maxTemp}°C, low ${minTemp}°C`}
                  className={`rounded-lg p-3 text-center flex flex-col items-center transition-colors ${
                    isToday ? "bg-[#1c3450] hover:bg-[#22405f]" : "bg-[#162535] hover:bg-[#1c2f3f]"
                  }`}
                >
                  <div className={`text-xs font-semibold mb-2 ${isToday ? "text-[#3b87d6]" : "text-[#7ea8c2]"}`}>
                    {getDayName(dateStr)}
                  </div>
                  <div className="text-2xl mb-2" aria-hidden="true">{info.emoji}</div>
                  <div className="text-white text-sm font-semibold">{maxTemp}°</div>
                  <div className="relative h-1 bg-[#1e3347] rounded-full w-full my-2" role="presentation">
                    <div
                      className="absolute h-full rounded-full"
                      style={{ left: `${barLeft}%`, width: `${barWidth}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <div className="text-[#7ea8c2] text-xs">{minTemp}°</div>
                </Link>
              );
            })}
          </div>

          {/* 5-day temperature sparkline */}
          {(() => {
            const maxTemps = daily.temperature_2m_max.slice(0, 5);
            const minT = Math.min(...maxTemps);
            const maxT = Math.max(...maxTemps);
            const range = maxT - minT || 1;
            const W = 100; const H = 20; const PAD = 3;
            const px = (i: number) => (i / 4) * W;
            const py = (t: number) => PAD + (1 - (t - minT) / range) * (H - PAD * 2);
            const pts = maxTemps.map((t, i) => `${px(i).toFixed(1)},${py(t).toFixed(1)}`);
            const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p}`).join(" ");
            return (
              <div className="mt-3 bg-[#162535] rounded-lg px-3 py-2 flex items-center gap-3">
                <span className="text-[#5a7d99] text-[10px] shrink-0">Temp trend</span>
                <svg viewBox={`0 0 ${W} ${H}`} className="flex-1 h-5" aria-hidden="true" preserveAspectRatio="none">
                  <path d={d} fill="none" stroke="#3b87d6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  {maxTemps.map((t, i) => (
                    <circle key={i} cx={px(i)} cy={py(t)} r="2" fill="#3b87d6" />
                  ))}
                </svg>
                <span className="text-[#5a7d99] text-[10px] shrink-0">
                  {Math.round(maxTemps[0])}° → {Math.round(maxTemps[4])}°
                </span>
              </div>
            );
          })()}
        </div>

        {/* Fun weather fact */}
        <div className="bg-[#162535] rounded-xl p-4 mb-6 flex items-start gap-3" role="note">
          <span className="text-2xl shrink-0" aria-hidden="true">💡</span>
          <div>
            <p className="text-[#5a7d99] text-xs font-semibold uppercase tracking-wider mb-1">Did you know?</p>
            <p className="text-[#c8dae7] text-sm leading-relaxed">{weatherFact}</p>
          </div>
        </div>

        <footer className="mt-4 text-center text-xs text-[#2a4055]">
          Weather data from <span className="text-[#3a5a72]">Open-Meteo</span>
          {" · "}
          <Link href="/countries" className="text-[#3a5a72] hover:text-[#5a7d99] transition-colors">Browse countries</Link>
          {" · "}
          <Link href="/map" className="text-[#3a5a72] hover:text-[#5a7d99] transition-colors">World map</Link>
        </footer>
      </main>
    </div>
  );
}
