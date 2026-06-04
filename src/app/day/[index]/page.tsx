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
  getHourWeatherInfo,
  getHourAnimClass,
  getWeatherFact,
  getWeatherAlert,
  getWindDirection,
  getWindArrow,
  getOutdoorSummary,
  getDressCode,
  validateCoord,
  getDaylightInfo,
  countryCodeToFlag,
  getFeelsLikeExplanation,
  getCityHour,
  formatCityTime,
  isNightHour,
  getTimeOfDayLabel,
  type WeatherResponse,
  type HistoricalDay,
  type HourlyForecastResponse,
} from "@/lib/weather";
import Header from "@/app/components/Header";
import AppFooter from "@/app/components/AppFooter";
import ShareButton from "@/app/components/ShareButton";
import LocalTime from "@/app/components/LocalTime";
import { getWeatherTheme } from "@/lib/weatherTheme";
import WeatherBackground from "@/app/components/WeatherBackground";

const LONDON_LAT = 51.5074;
const LONDON_LON = -0.1278;

type PageProps = {
  params: Promise<{ index: string }>;
  searchParams: Promise<{ lat?: string; lon?: string; name?: string; code?: string; tz?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ index }, { name }] = await Promise.all([params, searchParams]);
  const dayIndex = parseInt(index, 10);
  const locationName = name ?? "London";
  if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) return {};
  const dayLabel = dayIndex === 0 ? "Today" : dayIndex === 1 ? "Tomorrow" : `Day ${dayIndex + 1}`;
  return {
    title: `${dayLabel} — ${locationName}`,
    description: `Detailed ${dayLabel.toLowerCase()} forecast for ${locationName}: hourly breakdown, best outdoor times, and historical comparison.`,
  };
}

async function getWeather(lat: number, lon: number, tz?: string): Promise<WeatherResponse> {
  const res = await fetch(buildForecastUrl(lat, lon, tz), {
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error("Failed to fetch weather data");
  return res.json();
}

async function getHourlyWeather(lat: number, lon: number, tz?: string): Promise<HourlyForecastResponse | null> {
  try {
    const res = await fetch(buildHourlyForecastUrl(lat, lon, tz), {
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

// ── UV index colour meter ─────────────────────────────────────────────

function uvColor(uv: number): string {
  if (uv <= 2) return "#22c55e";
  if (uv <= 5) return "#eab308";
  if (uv <= 7) return "#f97316";
  if (uv <= 10) return "#ef4444";
  return "#a855f7";
}

function UvMeter({ uv }: { uv: number }) {
  const pct = Math.min((uv / 12) * 100, 100);
  return (
    <div className="mt-2" aria-label={`UV index ${uv} of 12`}>
      <div className="h-1.5 bg-[#1e3347] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: uvColor(uv) }} />
      </div>
      <div className="flex justify-between text-[8px] text-[var(--text-faint)] mt-0.5">
        {["0", "3", "6", "8", "11+"].map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

// ── Daylight 24-hour bar ──────────────────────────────────────────────

function DaylightBar({ risePercent, lightPercent, hours, minutes }: {
  risePercent: number;
  lightPercent: number;
  hours: number;
  minutes: number;
}) {
  return (
    <div className="mt-3 pt-3 border-t border-[#1e3347]">
      <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5">
        <span>☀️ Daylight</span>
        <span>{hours}h {minutes}m</span>
      </div>
      <div className="relative h-2.5 bg-[#0e1723] rounded-full overflow-hidden">
        <div
          className="absolute h-full rounded-full"
          style={{
            left: `${risePercent}%`,
            width: `${lightPercent}%`,
            background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #f97316 100%)",
          }}
          aria-hidden="true"
        />
      </div>
      <div className="flex justify-between text-[9px] text-[var(--text-faint)] mt-0.5">
        {["12am", "6am", "12pm", "6pm", "12am"].map((l, i) => <span key={`${l}-${i}`}>{l}</span>)}
      </div>
    </div>
  );
}

// ── Year-over-year stat tile ──────────────────────────────────────────

function YoyStat({
  label,
  icon,
  current,
  historical,
  unit,
  higherWarmer,
}: {
  label: string;
  icon: string;
  current: number;
  historical: number;
  unit: string;
  higherWarmer: boolean; // true for temp (up=orange), false for rain (up=blue)
}) {
  const diff = +(current - historical).toFixed(1);
  const isUp = diff > 0.05;
  const isDown = diff < -0.05;
  const deltaColor = !isUp && !isDown
    ? "text-[var(--text-muted)]"
    : higherWarmer
      ? isUp ? "text-orange-400" : "text-sky-400"
      : isUp ? "text-blue-400" : "text-emerald-400";
  const arrow = isUp ? "▲" : isDown ? "▼" : "—";
  const diffStr = isUp ? `+${diff}` : isDown ? `${diff}` : "±0";

  return (
    <div className="bg-[var(--card-bg-alt)] rounded-xl p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px] uppercase tracking-wider">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-white font-bold text-2xl leading-none">
        {current % 1 === 0 ? Math.round(current) : current.toFixed(1)}{unit}
      </div>
      <div className={`flex items-center gap-1 text-sm font-semibold ${deltaColor}`}>
        <span>{arrow}</span>
        <span>{!isUp && !isDown ? "same" : `${diffStr}${unit}`}</span>
      </div>
      <div className="text-[var(--text-faint)] text-[10px]">
        {historical % 1 === 0 ? Math.round(historical) : historical.toFixed(1)}{unit} last year
      </div>
    </div>
  );
}

const STAT_TOOLTIPS: Record<string, string> = {
  "Feels Like": "How the temperature actually feels when wind chill and humidity are factored in.",
  "Humidity": "The amount of water vapour in the air. Higher humidity can make the air feel warmer and more oppressive.",
  "Wind": "Air movement speed. Stronger wind increases wind chill, making it feel colder than the actual temperature.",
  "Precipitation": "The total amount of rain or snow expected to fall from the sky over this period.",
  "UV Index": "A measure of ultraviolet radiation from the sun. Higher values mean greater risk of sunburn and skin damage.",
  "Pressure": "Atmospheric pressure — high pressure usually means stable, clear weather, while low pressure brings clouds and rain.",
  "Sunrise / Sunset": "The times when the sun appears and disappears over the horizon each day.",
};

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
  const tooltip = STAT_TOOLTIPS[label];
  return (
    <div className="bg-[var(--card-bg-alt)] rounded-lg px-4 py-3 group relative">
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#0e1723] border border-[#2a4055] text-[#c8dae7] text-[10px] leading-relaxed px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2a4055]" />
        </div>
      )}
      <div className="text-[var(--text-muted)] text-xs mb-2 flex items-center gap-1">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-white font-semibold text-sm">{value}</div>
      {sub && <div className="text-[var(--text-muted)] text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

export default async function DayPage({ params, searchParams }: PageProps) {
  const [{ index }, { lat: latStr, lon: lonStr, name, code, tz }] = await Promise.all([
    params,
    searchParams,
  ]);
  const dayIndex = parseInt(index, 10);
  const lat = validateCoord(latStr, -90, 90, LONDON_LAT);
  const lon = validateCoord(lonStr, -180, 180, LONDON_LON);
  const locationName = name ? name.slice(0, 200) : "London"; // cap length
  const countryFlag = countryCodeToFlag(code ?? "");

  if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) notFound();

  let weather: WeatherResponse;
  try {
    weather = await getWeather(lat, lon, tz);
  } catch {
    return (
      <div className="min-h-screen bg-[#0e1723] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--text-muted)] text-lg">
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
    getHourlyWeather(lat, lon, tz),
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

  // ── Current local time in the viewed city ──────────────────────────
  const cityHour = getCityHour(tz);
  const cityTimeInitial = formatCityTime(tz);
  const isToday = dayIndex === 0;
  // Night styling only applies to "today" — future days show their day theme.
  const isNight = isToday && isNightHour(cityHour, sunriseHour, sunsetHour);
  const timeOfDay = getTimeOfDayLabel(cityHour);

  // The hourly entry matching the city's current hour (today only) — drives the
  // "right now" current-conditions card so it reflects the time in that city.
  const currentHourEntry = isToday
    ? hourlyEntries.find((e) => e.hour === cityHour) ?? null
    : null;

  const info = getWeatherInfo(daily.weather_code[dayIndex]);
  const animClass = getWeatherAnimClass(daily.weather_code[dayIndex]);
  const todayTemp = isToday ? current.temperature_2m : null;
  const rating = getWeatherRating(
    daily.weather_code[dayIndex],
    daily.temperature_2m_max[dayIndex],
  );
  const uv = describeUV(daily.uv_index_max[dayIndex]);
  const theme = getWeatherTheme(daily.weather_code[dayIndex], isNight);
  const searchQuery = encodeURIComponent(locationName);
  const weatherFact = getWeatherFact(
    daily.weather_code[dayIndex],
    daily.temperature_2m_max[dayIndex],
  );

  const dressCode = getDressCode(
    daily.weather_code[dayIndex],
    daily.temperature_2m_max[dayIndex],
    daily.wind_speed_10m_max[dayIndex],
  );

  const daylightInfo = getDaylightInfo(daily.sunrise[dayIndex], daily.sunset[dayIndex]);

  const feelsLikeExplanation = isToday
    ? getFeelsLikeExplanation(
        current.temperature_2m,
        current.apparent_temperature,
        current.relative_humidity_2m,
        current.wind_speed_10m,
      )
    : "";

  const weatherAlert = getWeatherAlert(
    daily.weather_code[dayIndex],
    daily.wind_speed_10m_max[dayIndex],
    daily.uv_index_max[dayIndex],
    daily.precipitation_sum[dayIndex],
  );

  const dayName = getDayName(dateStr);

  // Build day-picker links for sibling days
  const codeParam = code ? `&code=${encodeURIComponent(code)}` : "";
  const tzParam = tz ? `&tz=${encodeURIComponent(tz)}` : "";
  const baseParams = `lat=${lat}&lon=${lon}&name=${encodeURIComponent(locationName)}${codeParam}${tzParam}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: theme.bgGradient }} data-weather={theme.type}>
      <WeatherBackground weatherCode={daily.weather_code[dayIndex]} isNight={isNight} />
      <Header defaultSearch={locationName} />

      <main id="main-content" className="mx-auto w-full max-w-4xl px-4 py-6 flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-4 flex-wrap">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/?q=${searchQuery}`} className="hover:text-white transition-colors truncate max-w-[160px]">
            {locationName}
          </Link>
          <span>/</span>
          <span aria-current="page" className="text-[var(--text-muted)]">{dayName}</span>
        </nav>

        {/* Day header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            {countryFlag && <span className="text-xl" aria-hidden="true">{countryFlag}</span>}
            <h1 className="text-xl font-bold text-white">{locationName}</h1>
            <div className="ml-auto">
              <ShareButton
                url={`/day/${dayIndex}?${baseParams}`}
                title={`${dayName} weather in ${locationName}`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-sm mt-0.5">
            <p className="text-[var(--text-muted)]">{getFormattedDate(dateStr)}</p>
            {isToday && (
              <>
                <span className="text-[var(--text-faint)]" aria-hidden="true">·</span>
                <LocalTime
                  timezone={tz}
                  initial={cityTimeInitial}
                  withSeconds
                  label={`Local time in ${locationName}`}
                  className="text-[var(--text-accent)] font-medium tabular-nums"
                />
                <span className="text-[var(--text-muted)]">local time · {timeOfDay}</span>
              </>
            )}
          </div>
        </div>

        {/* Day picker strip with prev/next arrows */}
        <div className="flex items-center gap-2 mb-4">
          {dayIndex > 0 ? (
            <Link
              href={`/day/${dayIndex - 1}?${baseParams}`}
              className="shrink-0 p-1.5 text-[var(--text-muted)] hover:text-white transition-colors"
              aria-label="Previous day"
            >
              ←
            </Link>
          ) : (
            <span className="shrink-0 p-1.5 text-[#1e3347]" aria-hidden="true">←</span>
          )}
          <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1">
            {daily.time.slice(0, 7).map((d, i) => (
              <Link
                key={d}
                href={`/day/${i}?${baseParams}`}
                aria-current={i === dayIndex ? "page" : undefined}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  i === dayIndex
                    ? "bg-[var(--accent-color)] text-white"
                    : "bg-[var(--card-bg)] text-[var(--text-muted)] hover:bg-[var(--card-bg-alt)] hover:text-white"
                }`}
              >
                {getDayName(d)}
              </Link>
            ))}
          </div>
          {dayIndex < 6 ? (
            <Link
              href={`/day/${dayIndex + 1}?${baseParams}`}
              className="shrink-0 p-1.5 text-[var(--text-muted)] hover:text-white transition-colors"
              aria-label="Next day"
            >
              →
            </Link>
          ) : (
            <span className="shrink-0 p-1.5 text-[#1e3347]" aria-hidden="true">→</span>
          )}
        </div>

        {/* Main weather card */}
        <div className="bg-[var(--card-bg)] rounded-xl p-6 mb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[68px] font-light text-white leading-none tracking-tight">
                {isToday && todayTemp !== null
                  ? `${Math.round(todayTemp)}°C`
                  : `${Math.round(daily.temperature_2m_max[dayIndex])}°C`}
              </div>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-lg text-white font-medium">
                  {dayName} · {info.label}
                </span>
              </div>
              <div className="text-[var(--text-muted)] text-sm mt-1">
                <span className="text-white font-semibold">{Math.round(daily.temperature_2m_max[dayIndex])}°</span>
                {" / "}
                <span>{Math.round(daily.temperature_2m_min[dayIndex])}°</span>
                {isToday && todayTemp !== null
                  ? ` · High / Low`
                  : ""}
              </div>
            </div>
            <span className={`text-[72px] leading-none ${animClass}`} aria-hidden="true">{info.emoji}</span>
          </div>

          {/* Right now — reflects the current hour in the city */}
          {isToday && (
            <div className="mt-4 pt-4 border-t border-[#1e3347]">
              <div className="flex items-center gap-2 mb-2">
                <span aria-hidden="true">
                  {currentHourEntry
                    ? (isNight ? "🌙" : getHourWeatherInfo(currentHourEntry.weatherCode, currentHourEntry.precipProb, currentHourEntry.precip).emoji)
                    : (isNight ? "🌙" : "🌤️")}
                </span>
                <span className="text-white text-sm font-medium">
                  Right now in {locationName.split(",")[0]}
                </span>
                <span className="text-[var(--text-muted)] text-xs">· {timeOfDay}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                <span className="text-white font-semibold text-lg">
                  {Math.round(todayTemp ?? daily.temperature_2m_max[dayIndex])}°C
                </span>
                {currentHourEntry && (
                  <>
                    <span className="text-[var(--text-muted)]" aria-hidden="true">
                      {isNight ? "🌙" : getWeatherInfo(currentHourEntry.weatherCode).emoji}{" "}
                      <span className="text-white">{getWeatherInfo(currentHourEntry.weatherCode).label}</span>
                    </span>
                    <span className="text-[var(--text-muted)]">
                      <span aria-hidden="true">💧</span> {currentHourEntry.precipProb}% rain
                    </span>
                    <span className="text-[var(--text-muted)]">
                      <span aria-hidden="true">💨</span> {currentHourEntry.windSpeed} km/h
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Rating bar */}
          <div className="mt-4 pt-4 border-t border-[#1e3347] flex items-center justify-between">
            <span className="text-white text-sm font-medium">{rating.rating}</span>
            <span className="text-[var(--text-muted)] text-sm">{rating.suggestion}</span>
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
              sub={feelsLikeExplanation || undefined}
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
            sub={isToday
              ? `${getWindArrow(current.wind_direction_10m)} ${getWindDirection(current.wind_direction_10m)}`
              : "max speed"}
          />
          <DetailCard
            icon="🌧️"
            label="Precipitation"
            value={`${daily.precipitation_sum[dayIndex]} mm`}
          />
          <div className="bg-[var(--card-bg-alt)] rounded-lg px-4 py-3 group relative">
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#0e1723] border border-[#2a4055] text-[#c8dae7] text-[10px] leading-relaxed px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
              A measure of ultraviolet radiation from the sun. Higher values mean greater risk of sunburn and skin damage.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2a4055]" />
            </div>
            <div className="text-[var(--text-muted)] text-xs mb-2 flex items-center gap-1">
              <span aria-hidden="true">☀️</span>
              <span>UV Index</span>
            </div>
            <div className="text-white font-semibold text-sm">{daily.uv_index_max[dayIndex]} · {uv.label}</div>
            <div className="text-[var(--text-muted)] text-xs mt-0.5">{uv.tip}</div>
            <UvMeter uv={daily.uv_index_max[dayIndex]} />
          </div>
          <div className="bg-[var(--card-bg-alt)] rounded-lg px-4 py-3 group relative">
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#0e1723] border border-[#2a4055] text-[#c8dae7] text-[10px] leading-relaxed px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
              The times when the sun appears and disappears over the horizon. Daylight length changes throughout the year based on your latitude.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2a4055]" />
            </div>
            <div className="text-[var(--text-muted)] text-xs mb-2 flex items-center gap-1">
              <span aria-hidden="true">🌅</span>
              <span>Sunrise / Sunset</span>
            </div>
            <div className="text-white font-semibold text-sm">{daily.sunrise[dayIndex].split("T")[1]}</div>
            <div className="text-[var(--text-muted)] text-xs mt-0.5">Sunset {daily.sunset[dayIndex].split("T")[1]}</div>
            <DaylightBar {...daylightInfo} />
          </div>
          {isToday && (
            <DetailCard
              icon="🔵"
              label="Pressure"
              value={`${Math.round(current.surface_pressure)} hPa`}
              sub={current.surface_pressure > 1013 ? "High pressure" : current.surface_pressure < 1000 ? "Low pressure" : "Normal"}
            />
          )}
        </div>

        {/* Hourly forecast */}
        {hourlyEntries.length > 0 && (
          <div className="bg-[var(--card-bg)] rounded-xl p-5 mb-3">
            <h2 className="text-white font-semibold mb-4 text-lg">Hourly Forecast</h2>
            <div
              tabIndex={0}
              role="group"
              aria-label="Hourly forecast — scroll horizontally for more hours"
              className="overflow-x-auto -mx-1 px-1 scroll-fade-right"
            >
              <div className="flex gap-2 min-w-max">
                {hourlyEntries.map((entry) => {
                  const hourIsNight =
                    entry.hour < sunriseHour || entry.hour >= sunsetHour;
                  const isCurrentHour = isToday && entry.hour === cityHour;
                  return (
                    <div
                      key={entry.hour}
                      aria-current={isCurrentHour ? "time" : undefined}
                      className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-xl min-w-[72px] ${
                        isCurrentHour
                          ? "bg-[var(--card-bg-secondary)] ring-2 ring-[var(--accent-color)]"
                          : hourIsNight
                            ? "bg-[#0e1723]/70"
                            : "bg-[var(--card-bg-alt)]"
                      }`}
                    >
                      <span
                        className={`text-[11px] font-semibold whitespace-nowrap ${
                          isCurrentHour ? "text-[var(--text-accent)]" : hourIsNight ? "text-[var(--text-faint)]" : "text-[var(--text-muted)]"
                        }`}
                      >
                        {isCurrentHour ? "Now" : entry.label}
                      </span>
                      <span className={`text-2xl leading-none ${!hourIsNight ? getHourAnimClass(entry.weatherCode, entry.precipProb, entry.precip) : ""}`} aria-hidden="true">
                        {hourIsNight ? "🌙" : getHourWeatherInfo(entry.weatherCode, entry.precipProb, entry.precip).emoji}
                      </span>
                      <span
                        className={`text-base font-bold ${hourIsNight && !isCurrentHour ? "text-[var(--text-faint)]" : "text-white"}`}
                      >
                        {entry.temp}°
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`relative group text-[11px] font-medium ${
                            entry.precipProb >= 60
                              ? "text-blue-400"
                              : entry.precipProb >= 30
                                ? "text-sky-400"
                                : isCurrentHour
                                  ? "text-[var(--text-muted)]"
                                  : "text-[var(--text-faint)]"
                          }`}
                        >
                          💧 {entry.precipProb}%
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1c2f3f] text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                            {entry.precip.toFixed(1)}mm
                          </span>
                        </span>
                      </div>
                      <span className={`text-[10px] ${isCurrentHour ? "text-[var(--text-muted)]" : "text-[var(--text-faint)]"}`}>
                        💨 {entry.windSpeed}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[var(--text-muted)] text-[10px]">
              <span>🌙 Night hours dimmed</span>
              <span>💧 Rain probability</span>
              <span>💨 Wind (km/h)</span>
            </div>
          </div>
        )}

        {/* Best Times Outside — enhanced */}
        {outdoorAnalysis && (
          <div className="bg-[var(--card-bg)] rounded-xl p-5 mb-3">
            <h2 className="text-white font-semibold mb-1">Best Times Outside</h2>
            {/* Summary sentence */}
            <p className="text-[#c8dae7] text-sm mb-3 leading-relaxed">
              {getOutdoorSummary(outdoorAnalysis.bestWindows, outdoorAnalysis.badWindows)}
            </p>
            <p className="text-[var(--text-muted)] text-xs mb-4">
              Best options scored within typical hours out (6am–10pm) by
              temperature, rain chance, expected amount and wind
            </p>

            {/* 24-hour colour strip — a visual summary of the textual best/worst
                windows below, so it's marked decorative for screen readers. */}
            <div
              aria-hidden="true"
              className="grid gap-px mb-1"
              style={{ gridTemplateColumns: "repeat(24, 1fr)" }}
            >
              {outdoorAnalysis.hours.map((h) => {
                const isCurrentHour = isToday && h.hour === cityHour;
                return (
                  <div
                    key={h.hour}
                    aria-current={isCurrentHour ? "time" : undefined}
                    title={`${h.label}${isCurrentHour ? " (now)" : ""}: ${h.temp}°C · ${h.precipProb}% rain · ${h.windSpeed} km/h wind`}
                    className={`h-8 rounded-sm ${
                      isCurrentHour ? "ring-2 ring-white relative z-10" : ""
                    } ${
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
                );
              })}
            </div>

            {/* Hour labels every 6 h */}
            <div
              aria-hidden="true"
              className="grid mb-4"
              style={{ gridTemplateColumns: "repeat(24, 1fr)" }}
            >
              {outdoorAnalysis.hours.map((h) => (
                <div key={h.hour} className="text-[9px] text-[var(--text-muted)] overflow-hidden whitespace-nowrap">
                  {h.hour % 6 === 0 ? formatHour(h.hour) : ""}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1 mb-5 text-xs text-[var(--text-muted)]">
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
                <p className="text-[var(--text-accent)] text-xs font-semibold uppercase tracking-wider mb-2">
                  Best times to go out{outdoorAnalysis.bestWindows.length > 1 ? ` · ${outdoorAnalysis.bestWindows.length} options` : ""}
                </p>
                {outdoorAnalysis.bestWindows.map((w, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-[#0e1f2f] p-4 mb-2 border border-[#1a3347]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          w.rating === "Excellent" ? "bg-green-500/20 text-green-400"
                          : w.rating === "Good" ? "bg-blue-500/20 text-blue-400"
                          : "bg-amber-500/20 text-amber-400"
                        }`}>{w.rating}</span>
                        <span className="text-white font-semibold">{w.timeLabel}</span>
                      </div>
                      {w.peakHour && (
                        <span className="text-[var(--text-muted)] text-xs">peak {w.peakHour}</span>
                      )}
                    </div>
                    <p className="text-[#c8dae7] text-sm mb-3 leading-snug">{w.reason}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {w.tempRange && (
                        <span className="text-[10px] bg-[var(--card-bg)] border border-[#2a4055] text-[#c8dae7] px-2.5 py-1 rounded-full">
                          🌡️ {w.tempRange}
                        </span>
                      )}
                      {w.conditions.split(", ").slice(1).map((c, ci) => (
                        <span key={ci} className="text-[10px] bg-[var(--card-bg)] border border-[#2a4055] text-[#c8dae7] px-2.5 py-1 rounded-full">
                          {c.includes("rain") ? "🌧️ " : c.includes("wind") || c.includes("breeze") ? "💨 " : ""}{c}
                        </span>
                      ))}
                    </div>
                    {w.activities && w.activities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {w.activities.map((act) => (
                          <span key={act} className="text-[10px] text-[var(--text-accent)] bg-[#0d1d2e] border border-[#1a3347] px-2.5 py-1 rounded-full font-medium">
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
                <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Times to avoid
                </p>
                {outdoorAnalysis.badWindows.map((w, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-4 mb-2 border ${
                      w.severity === "worst"
                        ? "bg-[#2a0a0a] border-[#5a1a1a]"
                        : "bg-[#1f0e0e] border-[#3a1a1a]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          w.severity === "worst"
                            ? "bg-red-600/30 text-red-300"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {w.severity === "worst" ? "Worst period" : "Also avoid"}
                        </span>
                        <span className="text-white font-semibold">{w.timeLabel}</span>
                      </div>
                    </div>
                    <p className={`text-sm mb-3 leading-snug ${
                      w.severity === "worst" ? "text-red-200" : "text-red-300"
                    }`}>{w.reason}</p>
                    <div className="flex flex-wrap gap-2">
                      {w.tempRange && (
                        <span className="text-[10px] bg-red-950/40 border border-red-900/40 text-red-300 px-2.5 py-1 rounded-full">
                          🌡️ {w.tempRange}
                        </span>
                      )}
                      {w.conditions.split(", ").map((c, ci) => (
                        <span key={ci} className="text-[10px] bg-red-950/40 border border-red-900/40 text-red-300 px-2.5 py-1 rounded-full">
                          {c.includes("rain") ? "🌧️ " : c.includes("wind") || c.includes("breeze") ? "💨 " : c.includes("°C") ? "🌡️ " : ""}{c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {outdoorAnalysis.bestWindows.length === 0 && outdoorAnalysis.badWindows.length === 0 && (
              <p className="text-[var(--text-muted)] text-sm border-t border-[#1e3347] pt-3">
                No significant outdoor windows identified today.
              </p>
            )}
          </div>
        )}

        {/* Historical comparison */}
        <div className="bg-[var(--card-bg)] rounded-xl p-5 mb-3">
          <h2 className="text-white font-semibold mb-1">Compared to Last Year</h2>
          <p className="text-[var(--text-muted)] text-xs mb-4">Same date, one year ago</p>

          {historical ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <YoyStat
                  label="Max Temp"
                  icon="🌡️"
                  current={daily.temperature_2m_max[dayIndex]}
                  historical={historical.temperature_2m_max}
                  unit="°C"
                  higherWarmer={true}
                />
                <YoyStat
                  label="Min Temp"
                  icon="❄️"
                  current={daily.temperature_2m_min[dayIndex]}
                  historical={historical.temperature_2m_min}
                  unit="°C"
                  higherWarmer={true}
                />
                <YoyStat
                  label="Rainfall"
                  icon="🌧️"
                  current={daily.precipitation_sum[dayIndex]}
                  historical={historical.precipitation_sum}
                  unit="mm"
                  higherWarmer={false}
                />
              </div>
              <div className="pt-3 border-t border-[#1e3347] flex items-center gap-2">
                <span className="text-[var(--text-muted)] text-sm">Verdict:</span>
                <span className="text-white text-sm font-medium">
                  {tempDiffDescription(
                    daily.temperature_2m_max[dayIndex],
                    historical.temperature_2m_max,
                  )}
                </span>
              </div>
            </>
          ) : (
            <p className="text-[var(--text-muted)] text-sm">
              Historical data unavailable for this date.
            </p>
          )}
        </div>

        {/* What to wear */}
        <div className="bg-[var(--card-bg)] rounded-xl p-5 mb-3">
          <h2 className="text-white font-semibold mb-1">What to Wear</h2>
          <p className="text-[var(--text-muted)] text-sm mb-3">{dressCode.summary}</p>
          <div className="flex flex-wrap gap-2">
            {dressCode.items.map((item) => (
              <span
                key={item}
                className="bg-[var(--card-bg-alt)] border border-[#2a4055] text-[#c8dae7] text-xs px-3 py-1.5 rounded-full"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Fun weather fact */}
        <div className="bg-[var(--card-bg)] rounded-xl p-4 mb-3 flex items-start gap-3">
          <span className="text-2xl shrink-0">💡</span>
          <div>
            <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">Did you know?</p>
            <p className="text-[#c8dae7] text-sm leading-relaxed">{weatherFact}</p>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
