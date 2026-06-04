import Link from "next/link";
import {
  geocodeLocation,
  buildForecastUrl,
  getWeatherInfo,
  getDayName,
  getFormattedDate,
  describeUV,
  type WeatherResponse,
} from "@/lib/weather";
import SearchAutocomplete from "@/app/components/SearchAutocomplete";
import Header from "@/app/components/Header";

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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#162535] rounded-lg px-4 py-3">
      <div className="text-[#5a7d99] text-xs mb-1">{label}</div>
      <div className="flex items-center gap-1.5">
        <span className="text-base">{icon}</span>
        <span className="text-white font-semibold text-sm">{value}</span>
      </div>
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  if (!q) {
    return (
      <div className="min-h-screen bg-[#0e1723] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">⛅</div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Salar Weather
              </h1>
              <p className="text-[#7ea8c2]">
                Search for a city, town or postcode
              </p>
            </div>
            <SearchAutocomplete large />
          </div>
        </div>
      </div>
    );
  }

  const location = await geocodeLocation(q);

  if (!location) {
    return (
      <div className="min-h-screen bg-[#0e1723] flex flex-col">
        <Header defaultSearch={q} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-lg text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Location not found
            </h2>
            <p className="text-[#7ea8c2] mb-6">
              No results for &ldquo;{q}&rdquo;. Try a different city name.
            </p>
          </div>
        </div>
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
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#7ea8c2] text-lg">
            Failed to load weather data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const { current, daily } = weather;
  const todayInfo = getWeatherInfo(current.weather_code);
  const locationLabel = location.admin1
    ? `${location.name}, ${location.admin1}, ${location.country}`
    : `${location.name}, ${location.country}`;

  const overallMin = Math.min(...daily.temperature_2m_min.slice(0, 5));
  const overallMax = Math.max(...daily.temperature_2m_max.slice(0, 5));
  const tempRange = overallMax - overallMin || 1;

  const todayFormatted = getFormattedDate(daily.time[0]);
  const uvToday = describeUV(daily.uv_index_max[0]);

  return (
    <div className="min-h-screen bg-[#0e1723] flex flex-col">
      <Header defaultSearch={q} />

      <main className="mx-auto w-full max-w-4xl px-4 py-6 flex-1">
        {/* Location */}
        <div className="mb-5">
          <div className="flex items-baseline gap-2">
            <span className="text-[#7ea8c2] text-sm">📍</span>
            <h1 className="text-xl font-bold text-white">{locationLabel}</h1>
          </div>
          <p className="text-[#5a7d99] text-sm mt-0.5 pl-5">{todayFormatted}</p>
        </div>

        {/* Current weather hero */}
        <Link
          href={buildDayHref(0, location.latitude, location.longitude, locationLabel)}
          className="block bg-[#162535] hover:bg-[#1c2f3f] rounded-xl p-6 mb-3 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[68px] font-light text-white leading-none tracking-tight">
                {Math.round(current.temperature_2m)}°C
              </div>
              <div className="text-lg text-white mt-2 font-medium">
                {todayInfo.label}
              </div>
              <div className="text-[#7ea8c2] text-sm mt-1">
                Feels like {Math.round(current.apparent_temperature)}°C
              </div>
            </div>
            <div className="text-[72px] leading-none">{todayInfo.emoji}</div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e3347] flex items-center justify-between">
            <span className="text-[#7ea8c2] text-xs">
              High {Math.round(daily.temperature_2m_max[0])}°C · Low {Math.round(daily.temperature_2m_min[0])}°C
            </span>
            <span className="text-[#3b87d6] text-xs font-medium">
              View details →
            </span>
          </div>
        </Link>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-2 mb-6 sm:grid-cols-4">
          <StatCard icon="💧" label="Humidity" value={`${current.relative_humidity_2m}%`} />
          <StatCard icon="💨" label="Wind" value={`${Math.round(current.wind_speed_10m)} km/h`} />
          <StatCard icon="🌧️" label="Precipitation" value={`${daily.precipitation_sum[0]} mm`} />
          <StatCard icon="☀️" label="UV Index" value={`${daily.uv_index_max[0]} · ${uvToday.label}`} />
        </div>

        {/* 5-day forecast */}
        <div>
          <h2 className="text-[#5a7d99] text-xs font-semibold uppercase tracking-widest mb-3">
            5-Day Forecast
          </h2>
          <div className="grid grid-cols-5 gap-2">
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
                  className={`rounded-lg p-3 text-center flex flex-col items-center transition-colors ${
                    isToday
                      ? "bg-[#1c3450] hover:bg-[#22405f]"
                      : "bg-[#162535] hover:bg-[#1c2f3f]"
                  }`}
                >
                  <div
                    className={`text-xs font-semibold mb-2 ${isToday ? "text-[#3b87d6]" : "text-[#7ea8c2]"}`}
                  >
                    {getDayName(dateStr)}
                  </div>
                  <div className="text-2xl mb-2">{info.emoji}</div>
                  <div className="text-white text-sm font-semibold">{maxTemp}°</div>
                  <div className="relative h-1 bg-[#1e3347] rounded-full w-full my-2">
                    <div
                      className="absolute h-full rounded-full"
                      style={{
                        left: `${barLeft}%`,
                        width: `${barWidth}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                  <div className="text-[#7ea8c2] text-xs">{minTemp}°</div>
                </Link>
              );
            })}
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-[#2a4055]">
          Weather data from{" "}
          <span className="text-[#3a5a72]">Open-Meteo</span>
        </footer>
      </main>
    </div>
  );
}
