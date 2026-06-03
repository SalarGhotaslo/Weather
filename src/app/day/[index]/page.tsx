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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-white text-lg">
          Failed to load weather data. Please try again later.
        </p>
      </div>
    );
  }

  const { current, daily } = weather;
  const dateStr = daily.time[dayIndex];
  if (!dateStr) notFound();

  const [historical, yesterdayHistorical] = await Promise.all([
    getHistorical(dateStr, lat, lon),
    getHistorical(daily.time[Math.max(0, dayIndex - 1)], lat, lon),
  ]);

  const info = getWeatherInfo(daily.weather_code[dayIndex]);
  const isToday = dayIndex === 0;
  const todayTemp = isToday ? current.temperature_2m : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href={`/?q=${encodeURIComponent(locationName)}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-sky-100 hover:text-white transition-colors"
        >
          ← Back to {locationName}
        </Link>

        <div className="rounded-2xl bg-white/15 p-6 text-white shadow-lg backdrop-blur-md sm:p-8">
          <div className="text-center">
            <div className="text-sm text-sky-100">
              {getDayName(dateStr)}
            </div>
            <div className="text-xs text-sky-200/70">
              {getFormattedDate(dateStr)}
            </div>
            <div className="my-4 text-7xl">{info.emoji}</div>
            <div className="text-5xl font-light tracking-tight">
              {Math.round(daily.temperature_2m_max[dayIndex])}°
            </div>
            <div className="mt-1 text-lg text-sky-100">{info.label}</div>
            <div className="mt-1 text-sm text-sky-200">
              Low: {Math.round(daily.temperature_2m_min[dayIndex])}°
              {isToday && todayTemp !== null
                ? ` · Currently ${Math.round(todayTemp)}°`
                : ""}
            </div>
          </div>

          <hr className="my-6 border-white/10" />

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <DetailBox
              label="Feels Like"
              value={`${Math.round(current.apparent_temperature)}°`}
              icon="🌡️"
            />
            <DetailBox
              label="Humidity"
              value={`${current.relative_humidity_2m}%`}
              icon="💧"
            />
            <DetailBox
              label="Wind"
              value={`${Math.round(daily.wind_speed_10m_max[dayIndex])} km/h`}
              icon="💨"
            />
            <DetailBox
              label="Precipitation"
              value={`${daily.precipitation_sum[dayIndex]} mm`}
              icon="🌧️"
            />
            <DetailBox
              label="UV Index"
              value={`${daily.uv_index_max[dayIndex]} ${describeUV(daily.uv_index_max[dayIndex]).label}`}
              icon="☀️"
            />
            <DetailBox
              label="Sunrise / Sunset"
              value={`${daily.sunrise[dayIndex].split("T")[1]} / ${daily.sunset[dayIndex].split("T")[1]}`}
              icon="🌅"
            />
          </div>

          <hr className="my-6 border-white/10" />

          <div className="space-y-3 text-sm">
            <h3 className="text-base font-semibold text-sky-100">
              Day Overview
            </h3>
            <OverviewRow
              label="UV Advice"
              value={describeUV(daily.uv_index_max[dayIndex]).tip}
            />
            <OverviewRow
              label="Rating"
              value={
                getWeatherRating(
                  daily.weather_code[dayIndex],
                  daily.temperature_2m_max[dayIndex],
                ).rating
              }
            />
            <OverviewRow
              label="Suggestion"
              value={
                getWeatherRating(
                  daily.weather_code[dayIndex],
                  daily.temperature_2m_max[dayIndex],
                ).suggestion
              }
            />
          </div>

          <hr className="my-6 border-white/10" />

          <div className="space-y-3 text-sm">
            <h3 className="text-base font-semibold text-sky-100">
              📊 Compared to Last Year
            </h3>
            {historical ? (
              <>
                <OverviewRow
                  label="Max Temp"
                  value={`${Math.round(daily.temperature_2m_max[dayIndex])}° (forecast) vs ${Math.round(historical.temperature_2m_max)}° (last year)`}
                />
                <OverviewRow
                  label="Min Temp"
                  value={`${Math.round(daily.temperature_2m_min[dayIndex])}° (forecast) vs ${Math.round(historical.temperature_2m_min)}° (last year)`}
                />
                <OverviewRow
                  label="Precipitation"
                  value={`${daily.precipitation_sum[dayIndex]} mm (forecast) vs ${historical.precipitation_sum} mm (last year)`}
                />
                <OverviewRow
                  label="Temperature Verdict"
                  value={tempDiffDescription(
                    daily.temperature_2m_max[dayIndex],
                    historical.temperature_2m_max,
                  )}
                />
              </>
            ) : (
              <p className="text-sky-200">
                Historical data unavailable for this date.
              </p>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-sky-200/60">
          Data from Open-Meteo
        </footer>
      </div>
    </div>
  );
}

function DetailBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <div className="text-sky-200 text-xs mb-1">
        {icon} {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function OverviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 rounded-lg bg-white/10 px-3 py-2">
      <span className="text-sky-200">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
