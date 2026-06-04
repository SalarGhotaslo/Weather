import type { Metadata } from "next";
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
  buildHourlyForecastUrl,
  getHourlyAnalysis,
  getDayHourlyData,
  formatHour,
  getWeatherAnimClass,
  getWeatherFact,
  getWeatherAlert,
  type WeatherResponse,
  type HistoricalDay,
  type HourlyForecastResponse,
} from "@/lib/weather";
import Header from "@/app/components/Header";

const LONDON_LAT = 51.5074;
const LONDON_LON = -0.1278;

type PageProps = {
  params: Promise<{ index: string }>;
  searchParams: Promise<{ lat?: string; lon?: string; name?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ index }, { name }] = await Promise.all([params, searchParams]);
  const dayIndex = parseInt(index, 10);
  const locationName = name ?? "London";
  if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 4) return {};
  const dayLabel = dayIndex === 0 ? "Today" : dayIndex === 1 ? "Tomorrow" : `Day ${dayIndex + 1}`;
  return {
    title: `${dayLabel} — ${locationName}`,
    description: `Detailed ${dayLabel.toLowerCase()} forecast for ${locationName}: hourly breakdown, best outdoor times, and historical comparison.`,
  };
}

async function getWeather(lat: number, lon: number): Promise<WeatherResponse> {
  const res = await fetch(buildForecastUrl(lat, lon), {
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error("Failed to fetch weather data");
  return res.json();
}

async function getHourlyWeather(lat: number, lon: number): Promise<HourlyForecastResponse | null> {
  try {
    const res = await fetch(buildHourlyForecastUrl(lat, lon), {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
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
}: {
  label: string;
  forecast: string;
  lastYear: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1e3347] last:border-0">
      <span className="text-[#7ea8c2] text-sm">{label}</span>
      <div className="text-right">
        <span className="text-white text-sm font-medium">{forecast}</span>
        <span className="text-[#5a7d99] text-xs ml-2">vs {lastYear} last year</span>
      </div>
    </div>
  );
}

export default async function DayPage({ params, searchParams }: PageProps) {
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

  const [historical, hourlyWeather] = await Promise.all([
    getHistorical(dateStr, lat, lon),
    getHourlyWeather(lat, lon),
  ]);

  const outdoorAnalysis =
    hourlyWeather
      ? getHourlyAnalysis(
          hourlyWeather.hourly,
          dateStr,
          daily.sunrise[dayIndex],
          daily.sunset[dayIndex],
        )
      : null;

  const hourlyEntries = hourlyWeather
    ? getDayHourlyData(hourlyWeather.hourly, dateStr)
    : [];

  const sunriseHour = parseInt(
    daily.sunrise[dayIndex]?.split("T")[1]?.split(":")[0] ?? "6",
    10,
  );
  const sunsetHour = parseInt(
    daily.sunset[dayIndex]?.split("T")[1]?.split(":")[0] ?? "21",
    10,
  );

  const info = getWeatherInfo(daily.weather_code[dayIndex]);
  const animClass = getWeatherAnimClass(daily.weather_code[dayIndex]);
  const isToday = dayIndex === 0;
  const todayTemp = isToday ? current.temperature_2m : null;
  const rating = getWeatherRating(
    daily.weather_code[dayIndex],
    daily.temperature_2m_max[dayIndex],
  );
  const uv = describeUV(daily.uv_index_max[dayIndex]);
  const searchQuery = encodeURIComponent(locationName);
  const weatherFact = getWeatherFact(
    daily.weather_code[dayIndex],
    daily.temperature_2m_max[dayIndex],
  );

  const weatherAlert = getWeatherAlert(
    daily.weather_code[dayIndex],
    daily.wind_speed_10m_max[dayIndex],
    daily.uv_index_max[dayIndex],
    daily.precipitation_sum[dayIndex],
  );

  const dayName = getDayName(dateStr);

  // Build day-picker links for sibling days
  const baseParams = `lat=${lat}&lon=${lon}&name=${encodeURIComponent(locationName)}`;

  return (
    <div className="min-h-screen bg-[#0e1723] flex flex-col">
      <Header defaultSearch={locationName} />

      <main id="main-content" className="mx-auto w-full max-w-4xl px-4 py-6 flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#5a7d99] mb-4 flex-wrap">
          <Link href="/" className="hover:text-[#7ea8c2] transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/?q=${searchQuery}`} className="hover:text-[#7ea8c2] transition-colors truncate max-w-[160px]">
            {locationName}
          </Link>
          <span>/</span>
          <span className="text-[#7ea8c2]">{dayName}</span>
        </nav>

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

        {/* Day picker strip */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {daily.time.slice(0, 5).map((d, i) => (
            <Link
              key={d}
              href={`/day/${i}?${baseParams}`}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                i === dayIndex
                  ? "bg-[#3b87d6] text-white"
                  : "bg-[#162535] text-[#7ea8c2] hover:bg-[#1c2f3f] hover:text-white"
              }`}
            >
              {getDayName(d)}
            </Link>
          ))}
        </div>

        {/* Main weather card */}
        <div className="bg-[#162535] rounded-xl p-6 mb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[68px] font-light text-white leading-none tracking-tight">
                {Math.round(daily.temperature_2m_max[dayIndex])}°C
              </div>
              <div className="text-lg text-white mt-2 font-medium">
                {dayName} · {info.label}
              </div>
              <div className="text-[#7ea8c2] text-sm mt-1">
                Low {Math.round(daily.temperature_2m_min[dayIndex])}°C
                {isToday && todayTemp !== null
                  ? ` · Currently ${Math.round(todayTemp)}°C`
                  : ""}
              </div>
            </div>
            <span className={`text-[72px] leading-none ${animClass}`}>{info.emoji}</span>
          </div>

          {/* Rating bar */}
          <div className="mt-4 pt-4 border-t border-[#1e3347] flex items-center justify-between">
            <span className="text-white text-sm font-medium">{rating.rating}</span>
            <span className="text-[#7ea8c2] text-sm">{rating.suggestion}</span>
          </div>
        </div>

        {/* Weather alert banner */}
        {weatherAlert && (
          <div
            role="alert"
            className={`rounded-xl p-4 mb-3 flex items-start gap-3 ${
              weatherAlert.level === "warning"
                ? "bg-red-900/30 border border-red-500/40"
                : "bg-amber-900/20 border border-amber-500/30"
            }`}
          >
            <span className="text-2xl shrink-0" aria-hidden="true">
              {weatherAlert.level === "warning" ? "🚨" : "⚠️"}
            </span>
            <div>
              <p className={`text-sm font-semibold mb-0.5 ${weatherAlert.level === "warning" ? "text-red-300" : "text-amber-300"}`}>
                {weatherAlert.title}
              </p>
              <p className="text-[#c8dae7] text-xs leading-relaxed">{weatherAlert.message}</p>
            </div>
          </div>
        )}

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

        {/* Hourly forecast */}
        {hourlyEntries.length > 0 && (
          <div className="bg-[#162535] rounded-xl p-5 mb-3">
            <h2 className="text-white font-semibold mb-4">Hourly Forecast</h2>
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="flex gap-1 min-w-max">
                {hourlyEntries.map((entry) => {
                  const isNight =
                    entry.hour < sunriseHour || entry.hour >= sunsetHour;
                  return (
                    <div
                      key={entry.hour}
                      className={`flex flex-col items-center gap-1.5 py-2.5 px-1.5 rounded-lg min-w-[42px] ${
                        isNight ? "bg-[#0e1723]/70" : "bg-[#1c2f3f]"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-medium whitespace-nowrap ${isNight ? "text-[#3a5a72]" : "text-[#7ea8c2]"}`}
                      >
                        {entry.label}
                      </span>
                      <span className="text-lg leading-none">
                        {isNight ? "🌙" : getWeatherInfo(entry.weatherCode).emoji}
                      </span>
                      <span
                        className={`text-sm font-semibold ${isNight ? "text-[#3a5a72]" : "text-white"}`}
                      >
                        {entry.temp}°
                      </span>
                      <span
                        className={`text-[10px] ${
                          entry.precipProb >= 60
                            ? "text-blue-400"
                            : entry.precipProb >= 30
                              ? "text-sky-500"
                              : isNight
                                ? "text-[#2a4055]"
                                : "text-[#5a7d99]"
                        }`}
                      >
                        {entry.precipProb}%
                      </span>
                      <span
                        className={`text-[9px] ${isNight ? "text-[#1e3347]" : "text-[#5a7d99]"}`}
                      >
                        {entry.windSpeed}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[#5a7d99] text-[10px]">
              <span>🌙 Night hours dimmed</span>
              <span>💧 Rain probability</span>
              <span>💨 Wind (km/h, bottom row)</span>
            </div>
          </div>
        )}

        {/* Best Times Outside — enhanced */}
        {outdoorAnalysis && (
          <div className="bg-[#162535] rounded-xl p-5 mb-3">
            <h2 className="text-white font-semibold mb-1">Best Times Outside</h2>
            <p className="text-[#5a7d99] text-xs mb-4">
              Scored by temperature, rain chance and wind
            </p>

            {/* 24-hour colour strip */}
            <div
              className="grid gap-px mb-1"
              style={{ gridTemplateColumns: "repeat(24, 1fr)" }}
            >
              {outdoorAnalysis.hours.map((h) => (
                <div
                  key={h.hour}
                  title={`${h.label}: ${h.temp}°C · ${h.precipProb}% rain · ${h.windSpeed} km/h wind`}
                  className={`h-8 rounded-sm ${
                    h.score === -1
                      ? "bg-[#1a2d3e] border border-[#1e3347]"
                      : h.score === 0
                        ? "bg-red-500/60"
                        : h.score === 1
                          ? "bg-amber-500/60"
                          : h.score === 2
                            ? "bg-blue-500/60"
                            : "bg-green-500/70"
                  }`}
                />
              ))}
            </div>

            {/* Hour labels every 6 h */}
            <div
              className="grid mb-4"
              style={{ gridTemplateColumns: "repeat(24, 1fr)" }}
            >
              {outdoorAnalysis.hours.map((h) => (
                <div key={h.hour} className="text-[9px] text-[#5a7d99] overflow-hidden whitespace-nowrap">
                  {h.hour % 6 === 0 ? formatHour(h.hour) : ""}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-5 text-xs text-[#7ea8c2]">
              {[
                { cls: "bg-green-500/70", label: "Excellent" },
                { cls: "bg-blue-500/60", label: "Good" },
                { cls: "bg-amber-500/60", label: "Fair" },
                { cls: "bg-red-500/60", label: "Bad" },
                { cls: "bg-[#1a2d3e] border border-[#1e3347]", label: "Night" },
              ].map(({ cls, label }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-sm inline-block ${cls}`} />
                  {label}
                </span>
              ))}
            </div>

            {/* Best windows */}
            {outdoorAnalysis.bestWindows.length > 0 && (
              <div className="mb-4">
                <p className="text-[#3b87d6] text-xs font-semibold uppercase tracking-wider mb-2">
                  Go outside
                </p>
                {outdoorAnalysis.bestWindows.map((w, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-[#0e1f2f] p-3 mb-2 border border-[#1a3347]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 text-base">✓</span>
                        <div>
                          <span className="text-white text-sm font-semibold">{w.timeLabel}</span>
                          {w.peakHour && (
                            <span className="text-[#5a7d99] text-xs ml-2">peak: {w.peakHour}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full ${
                        w.rating === "Excellent" ? "bg-green-500/20 text-green-400"
                        : w.rating === "Good" ? "bg-blue-500/20 text-blue-400"
                        : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {w.rating}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] text-[#7ea8c2] mb-2">
                      {w.tempRange && <span className="bg-[#162535] px-2 py-0.5 rounded">🌡️ {w.tempRange}</span>}
                      <span className="bg-[#162535] px-2 py-0.5 rounded">{w.conditions.split(", ").slice(1).join(", ")}</span>
                    </div>
                    {w.activities && w.activities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {w.activities.map((act) => (
                          <span key={act} className="text-[10px] text-[#3b87d6] bg-[#0d1d2e] border border-[#1a3347] px-2 py-0.5 rounded-full">
                            {act}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bad windows */}
            {outdoorAnalysis.badWindows.length > 0 && (
              <div>
                <p className="text-red-400/70 text-xs font-semibold uppercase tracking-wider mb-2">
                  Avoid going out
                </p>
                {outdoorAnalysis.badWindows.map((w, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-[#1f0e0e] p-3 mb-2 border border-[#3a1a1a]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <div>
                          <span className="text-white text-sm font-semibold">{w.timeLabel}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                        Avoid
                      </span>
                    </div>
                    <p className="text-[#7ea8c2] text-xs mt-2 ml-6">{w.conditions}</p>
                    {w.tempRange && (
                      <p className="text-[#5a7d99] text-[10px] mt-1 ml-6">
                        Temperature range: {w.tempRange}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {outdoorAnalysis.bestWindows.length === 0 && outdoorAnalysis.badWindows.length === 0 && (
              <p className="text-[#5a7d99] text-sm border-t border-[#1e3347] pt-3">
                No significant outdoor windows identified today.
              </p>
            )}
          </div>
        )}

        {/* Historical comparison */}
        <div className="bg-[#162535] rounded-xl p-5 mb-3">
          <h2 className="text-white font-semibold mb-1">Compared to Last Year</h2>
          <p className="text-[#5a7d99] text-xs mb-4">Same date, one year ago</p>

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

        {/* Fun weather fact */}
        <div className="bg-[#162535] rounded-xl p-4 mb-3 flex items-start gap-3">
          <span className="text-2xl shrink-0">💡</span>
          <div>
            <p className="text-[#5a7d99] text-xs font-semibold uppercase tracking-wider mb-1">Did you know?</p>
            <p className="text-[#c8dae7] text-sm leading-relaxed">{weatherFact}</p>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-[#2a4055] py-4">
        Weather data from <span className="text-[#3a5a72]">Open-Meteo</span>
        {" · "}
        <Link href={`/?q=${searchQuery}`} className="text-[#3a5a72] hover:text-[#5a7d99] transition-colors">
          Back to forecast
        </Link>
      </footer>
    </div>
  );
}
