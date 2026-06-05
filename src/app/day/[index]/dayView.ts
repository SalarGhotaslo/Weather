import { type WeatherResponse, type HourlyEntry } from "@/lib/forecast";
import { countryCodeToFlag } from "@/lib/geocoding";
import {
  getWeatherInfo,
  getDayName,
  getFormattedDate,
  describeUV,
  getWeatherAnimClass,
  getWeatherAlert,
  getWeatherFact,
  getWindArrow,
  getWindDirection,
  getDressCode,
  getDaylightInfo,
  getFeelsLikeExplanation,
  getCityHour,
  formatCityTime,
  isNightHour,
  getTimeOfDayLabel,
} from "@/lib/weather";
import { getWeatherTheme } from "@/lib/weatherTheme";

interface BuildDayViewArgs {
  weather: WeatherResponse;
  dayIndex: number;
  dateStr: string;
  lat: number;
  lon: number;
  locationName: string;
  code?: string;
  tz?: string;
  hourlyEntries: HourlyEntry[];
  dayAverages: { humidity: number | null; pressure: number | null };
}

// Derives every presentation value the day page renders from the fetched
// forecast. Keeping this out of the page component leaves page.tsx as a thin
// data-fetch + layout orchestrator.
export function buildDayView({
  weather, dayIndex, dateStr, lat, lon, locationName, code, tz, hourlyEntries, dayAverages,
}: BuildDayViewArgs) {
  const { current, daily } = weather;
  const isToday = dayIndex === 0;

  // For today, use the current conditions (actual weather now) rather than
  // the daily aggregate (which takes the most severe condition of the day
  // and can show "Rain Showers" for a brief 4pm shower on an otherwise
  // overcast day).  Future days fall back to the daily code.
  const weatherCode = isToday ? current.weather_code : daily.weather_code[dayIndex];
  const maxTemp = daily.temperature_2m_max[dayIndex];
  const minTemp = daily.temperature_2m_min[dayIndex];
  const precip = daily.precipitation_sum[dayIndex];
  const uvIndex = daily.uv_index_max[dayIndex];
  const windMax = daily.wind_speed_10m_max[dayIndex];

  // Per-day stat values so every day shows the same cards. "Today" uses live
  // current conditions; other days use daily aggregates / hourly-mean fallbacks.
  const feelsLike = Math.round(isToday ? current.apparent_temperature : daily.apparent_temperature_max[dayIndex]);
  const humidity = isToday ? current.relative_humidity_2m : dayAverages.humidity;
  const pressure = isToday ? Math.round(current.surface_pressure) : dayAverages.pressure;
  const windDegrees = isToday ? current.wind_direction_10m : daily.wind_direction_10m_dominant[dayIndex];

  const sunriseHour = parseInt(daily.sunrise[dayIndex]?.split("T")[1]?.split(":")[0] ?? "6", 10);
  const sunsetHour = parseInt(daily.sunset[dayIndex]?.split("T")[1]?.split(":")[0] ?? "21", 10);

  const cityHour = getCityHour(tz);
  // Night styling only applies to "today" — future days show their day theme.
  const isNight = isToday && isNightHour(cityHour, sunriseHour, sunsetHour);
  const currentHourEntry = isToday
    ? hourlyEntries.find((e) => e.hour === cityHour) ?? null
    : null;

  const codeParam = code ? `&code=${encodeURIComponent(code)}` : "";
  const tzParam = tz ? `&tz=${encodeURIComponent(tz)}` : "";
  const baseParams = `lat=${lat}&lon=${lon}&name=${encodeURIComponent(locationName)}${codeParam}${tzParam}`;

  return {
    current, daily,
    weatherCode, maxTemp, minTemp, precip, uvIndex, windMax,
    feelsLike, humidity, pressure,
    sunriseHour, sunsetHour, cityHour, isToday, isNight,
    timeOfDay: getTimeOfDayLabel(cityHour),
    currentHourEntry,
    countryFlag: countryCodeToFlag(code ?? ""),
    info: getWeatherInfo(weatherCode, precip),
    animClass: getWeatherAnimClass(weatherCode),
    uv: describeUV(uvIndex),
    theme: getWeatherTheme(weatherCode, isNight, precip),
    dayName: getDayName(dateStr),
    formattedDate: getFormattedDate(dateStr),
    dayLabels: daily.time.slice(0, 7).map(getDayName),
    weatherFact: getWeatherFact(weatherCode, maxTemp),
    windArrow: getWindArrow(windDegrees),
    windDirection: getWindDirection(windDegrees),
    dressCode: getDressCode(weatherCode, maxTemp, windMax),
    daylight: getDaylightInfo(daily.sunrise[dayIndex], daily.sunset[dayIndex]),
    alert: getWeatherAlert(weatherCode, windMax, uvIndex, precip),
    cityTimeInitial: formatCityTime(tz),
    feelsLikeExplanation: isToday
      ? getFeelsLikeExplanation(
          current.temperature_2m,
          current.apparent_temperature,
          current.relative_humidity_2m,
          current.wind_speed_10m,
        )
      : "",
    baseParams,
  };
}
