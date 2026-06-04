import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getWeatherInfo,
  getDayName,
  getFormattedDate,
  getHistoricalApiUrl,
  getWeatherRating,
  describeUV,
  tempDiffDescription,
  buildForecastUrl,
  type WeatherResponse,
  type HistoricalDay,
} from "@/lib/weather";
import Header from "@/app/components/Header";

const LONDON_LAT = 51.5074;
const LONDON_LON = -0.1278;

async function getWeather(lat: number, lon: number): Promise<WeatherResponse> {
  const res = await fetch(buildForecastUrl(lat, lon), {
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error("Failed to fetch weather data");
  return res.json();
}

async function getHistorical(
  dateStr: string,
  lat: number,
  lon: number,
): Promise<HistoricalDay | null> {
  const url = getHistoricalApiUrl(dateStr, lat, lon);
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      temperature_2m_max: data.daily.temperature_2m_max[0],
      temperature_2m_min: data.daily.temperature_2m_min[0],
      precipitation_sum: data.daily.precipitation_sum[0],
    };
  } catch {
    return null;
  }
}

function DetailCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-[#1c2f3f] rounded-lg px-4 py-3">
      <div className="text-[#5a7d99] text-xs mb-2 flex items-center gap-1">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-white font-semibold text-sm">{value}</div>
      {sub && <div className="text-[#5a7d99] text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

function CompareRow({
  label,
  forecast,
  lastYear,
  unit = "",
}: {
  label: string;
  forecast: string;
  lastYear: string;
  unit?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1e3347] last:border-0">
      <span className="text-[#7ea8c2] text-sm">{label}</span>
      <div className="text-right">
        <span className="text-white text-sm font-medium">
          {forecast}
          {unit}
        </span>
        <span className="text-[#5a7d99] text-xs ml-2">
          vs {lastYear}
          {unit} last year
        </span>
      </div>
    </div>
  );
}

export default async function DayPage({
  params,
  searchParams,
}: {
  params: Promise<{ index: string }>;
  searchParams: Promise<{ lat?: string; lon?: string; name?: string }>;
}) {
  const [{ index }, { lat: latStr, lon: lonStr, name }] = await Promise.all([
    params,
    searchParams,
  ]);
  const dayIndex = parseInt(index, 10);
  const lat = latStr ? parseFloat(latStr) : LONDON_LAT;
  const lon = lonStr ? parseFloat(lonStr) : LONDON_LON;
  const locationName = name ?? "London";

  if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 4) notFound();

  let weather: WeatherResponse;
  try {
    weather = await getWeather(lat, lon);
  } catch {
    return (
      <div className="min-h-screen bg-[#0e1723] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#7ea8c2] text-lg">
            Failed to load weather data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const { current, daily } = weather;
  const dateStr = daily.time[dayIndex];
  if (!dateStr) notFound();

  const [historical] = await Promise.all([
    getHistorical(dateStr, lat, lon),
  ]);

  const info = getWeatherInfo(daily.weather_code[dayIndex]);
  const isToday = dayIndex === 0;
  const todayTemp = isToday ? current.temperature_2m : null;
  const rating = getWeatherRating(
    daily.weather_code[dayIndex],
    daily.temperature_2m_max[dayIndex],
  );
  const uv = describeUV(daily.uv_index_max[dayIndex]);
  const searchQuery = encodeURIComponent(locationName);

  return (
    <div className="min-h-screen bg-[#0e1723] flex flex-col">
      <Header defaultSearch={locationName} />

      <main className="mx-auto w-full max-w-4xl px-4 py-6 flex-1">
        {/* Back link */}
        <Link
          href={`/?q=${searchQuery}`}
          className="inline-flex items-center gap-1.5 text-[#7ea8c2] hover:text-white text-sm mb-5 transition-colors"
        >
          ← {locationName}
        </Link>

        {/* Day header */}
        <div className="mb-5">
          <div className="flex items-baseline gap-2">
            <span className="text-[#7ea8c2] text-sm">📍</span>
            <h1 className="text-xl font-bold text-white">{locationName}</h1>
          </div>
          <p className="text-[#5a7d99] text-sm mt-0.5 pl-5">
            {getFormattedDate(dateStr)}
          </p>
        </div>

        {/* Main weather card */}
        <div className="bg-[#162535] rounded-xl p-6 mb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[68px] font-light text-white leading-none tracking-tight">
                {Math.round(daily.temperature_2m_max[dayIndex])}°C
              </div>
              <div className="text-lg text-white mt-2 font-medium">
                {getDayName(dateStr)} · {info.label}
              </div>
              <div className="text-[#7ea8c2] text-sm mt-1">
                Low {Math.round(daily.temperature_2m_min[dayIndex])}°C
                {isToday && todayTemp !== null
                  ? ` · Currently ${Math.round(todayTemp)}°C`
                  : ""}
              </div>
            </div>
            <div className="text-[72px] leading-none">{info.emoji}</div>
          </div>

          {/* Rating bar */}
          <div className="mt-4 pt-4 border-t border-[#1e3347] flex items-center justify-between">
            <span className="text-white text-sm font-medium">
              {rating.rating}
            </span>
            <span className="text-[#7ea8c2] text-sm">{rating.suggestion}</span>
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-2 gap-2 mb-6 sm:grid-cols-3">
          {isToday && (
            <DetailCard
              icon="🌡️"
              label="Feels Like"
              value={`${Math.round(current.apparent_temperature)}°C`}
            />
          )}
          <DetailCard
            icon="💧"
            label="Humidity"
            value={isToday ? `${current.relative_humidity_2m}%` : "—"}
          />
          <DetailCard
            icon="💨"
            label="Wind"
            value={`${Math.round(daily.wind_speed_10m_max[dayIndex])} km/h`}
            sub="max"
          />
          <DetailCard
            icon="🌧️"
            label="Precipitation"
            value={`${daily.precipitation_sum[dayIndex]} mm`}
          />
          <DetailCard
            icon="☀️"
            label="UV Index"
            value={`${daily.uv_index_max[dayIndex]} · ${uv.label}`}
            sub={uv.tip}
          />
          <DetailCard
            icon="🌅"
            label="Sunrise / Sunset"
            value={`${daily.sunrise[dayIndex].split("T")[1]}`}
            sub={`Sunset ${daily.sunset[dayIndex].split("T")[1]}`}
          />
        </div>

        {/* Historical comparison */}
        <div className="bg-[#162535] rounded-xl p-5 mb-3">
          <h2 className="text-white font-semibold mb-1">
            Compared to Last Year
          </h2>
          <p className="text-[#5a7d99] text-xs mb-4">
            Same date, one year ago
          </p>

          {historical ? (
            <div>
              <CompareRow
                label="Max temperature"
                forecast={`${Math.round(daily.temperature_2m_max[dayIndex])}°C`}
                lastYear={`${Math.round(historical.temperature_2m_max)}°C`}
              />
              <CompareRow
                label="Min temperature"
                forecast={`${Math.round(daily.temperature_2m_min[dayIndex])}°C`}
                lastYear={`${Math.round(historical.temperature_2m_min)}°C`}
              />
              <CompareRow
                label="Precipitation"
                forecast={`${daily.precipitation_sum[dayIndex]} mm`}
                lastYear={`${historical.precipitation_sum} mm`}
              />
              <div className="mt-3 pt-3 border-t border-[#1e3347]">
                <span className="text-[#7ea8c2] text-sm">Verdict: </span>
                <span className="text-white text-sm font-medium">
                  {tempDiffDescription(
                    daily.temperature_2m_max[dayIndex],
                    historical.temperature_2m_max,
                  )}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[#5a7d99] text-sm">
              Historical data unavailable for this date.
            </p>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-[#2a4055] py-4">
        Weather data from <span className="text-[#3a5a72]">Open-Meteo</span>
      </footer>
    </div>
  );
}
