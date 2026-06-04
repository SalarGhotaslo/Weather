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
  getWeatherAlert,
  getWeatherScore,
  countryCodeToFlag,
  getFeelsLikeExplanation,
  getCityHour,
  formatCityTime,
  isNightHour,
  getTimeOfDayLabel,
  type WeatherResponse,
} from "@/lib/weather";
import SearchAutocomplete from "@/app/components/SearchAutocomplete";
import Header from "@/app/components/Header";
import RecentSearches from "@/app/components/RecentSearches";
import SearchTracker from "@/app/components/SearchTracker";
import TimeGradient from "@/app/components/TimeGradient";
import LocalTime from "@/app/components/LocalTime";
import AppFooter from "@/app/components/AppFooter";
import GeolocateButton from "@/app/components/GeolocateButton";
import { getWeatherTheme } from "@/lib/weatherTheme";
import WeatherBackground from "@/app/components/WeatherBackground";

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

async function getWeather(lat: number, lon: number, tz?: string): Promise<WeatherResponse> {
  const res = await fetch(buildForecastUrl(lat, lon, tz), {
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error("Failed to fetch weather data");
  return res.json();
}

function buildDayHref(index: number, lat: number, lon: number, name: string, code?: string, tz?: string) {
  const c = code ? `&code=${encodeURIComponent(code)}` : "";
  const t = tz ? `&tz=${encodeURIComponent(tz)}` : "";
  return `/day/${index}?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}${c}${t}`;
}

function getBarColor(avgTemp: number): string {
  if (avgTemp <= 2) return "#60a5fa";
  if (avgTemp <= 10) return "#38bdf8";
  if (avgTemp <= 18) return "#86efac";
  if (avgTemp <= 26) return "#fbbf24";
  return "#f97316";
}

function TrendIndicator({ temps }: { temps: number[] }) {
  const diff = Math.round(temps[4] - temps[0]);
  if (diff > 2) return <span className="text-[10px] text-orange-400">↑ warming {diff}°</span>;
  if (diff < -2) return <span className="text-[10px] text-blue-400">↓ cooling {Math.abs(diff)}°</span>;
  return <span className="text-[10px] text-[var(--text-muted)]">→ steady</span>;
}

function TempSparkline({ maxTemps }: { maxTemps: number[] }) {
  const minT = Math.min(...maxTemps);
  const maxT = Math.max(...maxTemps);
  const range = maxT - minT || 1;
  const W = 100; const H = 20; const PAD = 3;
  const px = (i: number) => (i / 4) * W;
  const py = (t: number) => PAD + (1 - (t - minT) / range) * (H - PAD * 2);
  const pts = maxTemps.map((t, i) => `${px(i).toFixed(1)},${py(t).toFixed(1)}`);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p}`).join(" ");
  return (
    <div className="mt-3 bg-[var(--card-bg)] rounded-lg px-3 py-2 flex items-center gap-3">
      <span className="text-[var(--text-muted)] text-[10px] shrink-0">Temp trend</span>
      <svg viewBox={`0 0 ${W} ${H}`} className="flex-1 h-5" aria-hidden="true" preserveAspectRatio="none">
        <path d={d} fill="none" stroke="#3b87d6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {maxTemps.map((t, i) => (
          <circle key={i} cx={px(i)} cy={py(t)} r="2" fill="#3b87d6" />
        ))}
      </svg>
      <span className="text-[var(--text-muted)] text-[10px] shrink-0">
        {Math.round(maxTemps[0])}° → {Math.round(maxTemps[4])}°
      </span>
    </div>
  );
}

const STAT_TOOLTIPS: Record<string, string> = {
  "Humidity": "The amount of water vapour in the air. Higher humidity can make the air feel warmer and more oppressive.",
  "Wind": "Air movement speed. Stronger wind increases wind chill, making it feel colder than the actual temperature.",
  "Precipitation": "The total amount of rain or snow expected to fall from the sky over this period.",
  "UV Index": "A measure of ultraviolet radiation from the sun. Higher values mean greater risk of sunburn.",
  "Pressure": "Atmospheric pressure — high pressure usually means stable, clear weather, while low pressure brings clouds and rain.",
  "Sunrise": "The time when the sun appears over the horizon. Sunset is when it disappears for the day.",
};

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  const tooltip = STAT_TOOLTIPS[label];
  return (
    <div className="bg-[var(--card-bg)] rounded-lg px-4 py-3 group relative">
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#0e1723] border border-[#2a4055] text-[#c8dae7] text-[10px] leading-relaxed px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2a4055]" />
        </div>
      )}
      <div className="text-[var(--text-muted)] text-xs mb-1">{label}</div>
      <div className="flex items-center gap-1.5">
        <span className="text-base" aria-hidden="true">{icon}</span>
        <span className="text-white font-semibold text-sm">{value}</span>
      </div>
      {sub && <div className="text-[var(--text-muted)] text-[10px] mt-0.5">{sub}</div>}
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
              <p className="text-[var(--text-muted)]">Search for a city, town or postcode</p>
            </div>

            <SearchAutocomplete large />
            <GeolocateButton />

            {/* Recent searches (client-side from localStorage) */}
            <RecentSearches />

            {/* Popular cities */}
            <div className="mt-8">
              <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-3">
                Popular cities
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {POPULAR_CITIES.map((city) => (
                  <Link
                    key={city}
                    href={`/?q=${encodeURIComponent(city)}`}
                    className="bg-[var(--card-bg)] hover:bg-[var(--card-bg-alt)] rounded-lg px-3 py-2 text-center text-[var(--text-muted)] hover:text-white text-xs transition-colors"
                  >
                    {city.split(",")[0]}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-6 text-sm text-[var(--text-muted)]">
              <Link href="/countries" className="hover:text-white transition-colors">
                🌍 Browse countries
              </Link>
              <Link href="/map" className="hover:text-white transition-colors">
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
            <p className="text-[var(--text-muted)] mb-6">
              No results for &ldquo;{q}&rdquo;. Try a different city name.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <Link href="/countries" className="text-[var(--text-accent)] hover:text-white transition-colors">
                Browse countries →
              </Link>
              <Link href="/map" className="text-[var(--text-accent)] hover:text-white transition-colors">
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
    weather = await getWeather(location.latitude, location.longitude, location.timezone);
  } catch {
    return (
      <div className="min-h-screen bg-[#0e1723] flex flex-col">
        <Header defaultSearch={q} />
        <main id="main-content" className="flex-1 flex items-center justify-center">
          <p className="text-[var(--text-muted)] text-lg">
            Failed to load weather data. Please try again later.
          </p>
        </main>
      </div>
    );
  }

  const { current, daily } = weather;
  const todayInfo = getWeatherInfo(current.weather_code);
  const animClass = getWeatherAnimClass(current.weather_code);
  // At night, a clear/partly-cloudy sky should read as a moon, not a sun.
  const isClearish = current.weather_code <= 2;
  const locationLabel = location.admin1
    ? `${location.name}, ${location.admin1}, ${location.country}`
    : `${location.name}, ${location.country}`;

  const overallMin = Math.min(...daily.temperature_2m_min.slice(0, 5));
  const overallMax = Math.max(...daily.temperature_2m_max.slice(0, 5));
  const tempRange = overallMax - overallMin || 1;

  const todayFormatted = getFormattedDate(daily.time[0]);
  const uvToday = describeUV(daily.uv_index_max[0]);
  const weatherFact = getWeatherFact(current.weather_code, current.temperature_2m);
  const countryFlag = countryCodeToFlag(location.countryCode ?? "");
  const feelsLikeExplanation = getFeelsLikeExplanation(
    current.temperature_2m,
    current.apparent_temperature,
    current.relative_humidity_2m,
    current.wind_speed_10m,
  );

  // Current local time in the searched city, used to pick day/night styling.
  const cityHour = getCityHour(location.timezone);
  const cityTimeInitial = formatCityTime(location.timezone);
  const sunriseHour = parseInt(daily.sunrise[0]?.split("T")[1]?.split(":")[0] ?? "6", 10);
  const sunsetHour = parseInt(daily.sunset[0]?.split("T")[1]?.split(":")[0] ?? "21", 10);
  const isNight = isNightHour(cityHour, sunriseHour, sunsetHour);
  const timeOfDay = getTimeOfDayLabel(cityHour);

  const theme = getWeatherTheme(current.weather_code, isNight);

  const todayAlert = getWeatherAlert(
    daily.weather_code[0],
    daily.wind_speed_10m_max[0],
    daily.uv_index_max[0],
    daily.precipitation_sum[0],
  );

  // Days that are excellent or good for going out (score ≥ 3)
  const bestDayIndices = daily.time.slice(0, 5).reduce<number[]>((acc, _, i) => {
    const s = getWeatherScore(daily.weather_code[i], daily.temperature_2m_max[i]);
    if (s >= 3) acc.push(i);
    return acc;
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: theme.bgGradient }} data-weather={theme.type}>
      <WeatherBackground weatherCode={current.weather_code} isNight={isNight} />
      <Header defaultSearch={q} />

      {/* Track this search in localStorage */}
      <SearchTracker cityLabel={locationLabel} />

      <main id="main-content" className="mx-auto w-full max-w-4xl px-4 py-6 flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-4">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-[var(--text-muted)] truncate max-w-[200px]">{location.name}</span>
        </nav>

        {/* Location */}
        <div className="mb-5">
          <div className="flex items-baseline gap-2">
            {countryFlag && <span className="text-xl" aria-hidden="true">{countryFlag}</span>}
            <h1 className="text-xl font-bold text-white">{locationLabel}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-sm mt-0.5 pl-1">
            <p className="text-[var(--text-muted)]">{todayFormatted}</p>
            <span className="text-[var(--text-faint)]" aria-hidden="true">·</span>
            <LocalTime
              timezone={location.timezone}
              initial={cityTimeInitial}
              label={`Local time in ${location.name}`}
              className="text-[var(--text-accent)] font-medium tabular-nums"
            />
            <span className="text-[var(--text-muted)]">local time · {timeOfDay}</span>
          </div>
        </div>

        {/* Current weather hero */}
        <Link
          href={buildDayHref(0, location.latitude, location.longitude, locationLabel, location.countryCode, location.timezone)}
          className="relative block bg-[var(--card-bg)] hover:bg-[var(--card-bg-alt)] rounded-xl p-6 mb-3 transition-colors overflow-hidden"
          aria-label={`Today: ${todayInfo.label}, ${Math.round(current.temperature_2m)}°C. View details.`}
        >
          <TimeGradient timezone={location.timezone} />
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[68px] font-light text-white leading-none tracking-tight" aria-hidden="true">
                {Math.round(current.temperature_2m)}°C
              </div>
              <div className="text-lg text-white mt-2 font-medium">{todayInfo.label}</div>
              <div className="text-[var(--text-muted)] text-sm mt-1">
                Feels like {Math.round(current.apparent_temperature)}°C
                {feelsLikeExplanation && (
                  <span className="text-[var(--text-muted)] text-xs ml-2">· {feelsLikeExplanation}</span>
                )}
              </div>
            </div>
            <span className={`text-[72px] leading-none ${isNight && isClearish ? "" : animClass}`} aria-hidden="true">
              {isNight && isClearish ? "🌙" : todayInfo.emoji}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e3347] flex items-center justify-between">
            <span className="text-[var(--text-muted)] text-xs">
              High {Math.round(daily.temperature_2m_max[0])}°C · Low {Math.round(daily.temperature_2m_min[0])}°C
            </span>
            <span className="text-[var(--text-accent)] text-xs font-medium">View details →</span>
          </div>
        </Link>

        {/* Weather alert for today */}
        {todayAlert && (
          <div
            role="alert"
            className={`rounded-xl p-3 mb-3 flex items-start gap-3 ${
              todayAlert.level === "warning"
                ? "bg-red-900/30 border border-red-500/40"
                : "bg-amber-900/20 border border-amber-500/30"
            }`}
          >
            <span className="text-xl shrink-0" aria-hidden="true">
              {todayAlert.level === "warning" ? "🚨" : "⚠️"}
            </span>
            <div>
              <p className={`text-xs font-semibold ${todayAlert.level === "warning" ? "text-red-300" : "text-amber-300"}`}>
                {todayAlert.title}
              </p>
              <p className="text-[#c8dae7] text-xs mt-0.5 leading-relaxed">{todayAlert.message}</p>
            </div>
          </div>
        )}

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
            <h2 className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-widest">
              5-Day Forecast
            </h2>
            <TrendIndicator temps={daily.temperature_2m_max.slice(0, 5)} />
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
                  href={buildDayHref(i, location.latitude, location.longitude, locationLabel, location.countryCode, location.timezone)}
                  role="listitem"
                  aria-label={`${getDayName(dateStr)}: ${info.label}, high ${maxTemp}°C, low ${minTemp}°C`}
                  className={`rounded-lg p-3 text-center flex flex-col items-center transition-colors ${
                    isToday ? "bg-[var(--card-bg-secondary)] hover:bg-[#22405f]" : "bg-[var(--card-bg)] hover:bg-[var(--card-bg-alt)]"
                  }`}
                >
                  <div className={`text-xs font-semibold mb-1 ${isToday ? "text-[var(--text-accent)]" : "text-[var(--text-muted)]"}`}>
                    {getDayName(dateStr)}
                  </div>
                  {bestDayIndices.includes(i) && (
                    <div className="text-[9px] text-amber-400 mb-1">⭐ Best</div>
                  )}
                  <div className="text-2xl mb-2" aria-hidden="true">{info.emoji}</div>

                  <div className="text-white text-sm font-semibold">{maxTemp}°</div>
                  <div className="relative h-1 bg-[#1e3347] rounded-full w-full my-2" role="presentation">
                    <div
                      className="absolute h-full rounded-full"
                      style={{ left: `${barLeft}%`, width: `${barWidth}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <div className="text-[var(--text-muted)] text-xs mb-1.5">{minTemp}°</div>
                  {/* Precipitation probability */}
                  {(() => {
                    const prob = daily.precipitation_probability_max[i] ?? 0;
                    if (prob < 15) return null;
                    return (
                      <div className={`text-[10px] font-medium ${prob >= 60 ? "text-blue-400" : "text-sky-500"}`}>
                        💧{prob}%
                      </div>
                    );
                  })()}
                </Link>
              );
            })}
          </div>

          <TempSparkline maxTemps={daily.temperature_2m_max.slice(0, 5)} />
        </div>

        {/* Fun weather fact */}
        <div className="bg-[var(--card-bg)] rounded-xl p-4 mb-6 flex items-start gap-3" role="note">
          <span className="text-2xl shrink-0" aria-hidden="true">💡</span>
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
