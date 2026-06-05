import { type WeatherResponse } from "@/lib/forecast";
import { countryCodeToFlag, type GeocodingResult } from "@/lib/geocoding";
import {
  getWeatherInfo,
  getFormattedDate,
  describeUV,
  getWeatherAnimClass,
  getWeatherFact,
  getWeatherAlert,
  getWeatherScore,
  getFeelsLikeExplanation,
  getCityHour,
  formatCityTime,
  isNightHour,
  getTimeOfDayLabel,
} from "@/lib/weather";
import { getWeatherTheme } from "@/lib/weatherTheme";

// Derives every value the home forecast view renders. Keeping it here leaves the
// page component as a thin geocode → branch → render orchestrator.
export function buildHomeView(weather: WeatherResponse, location: GeocodingResult) {
  const { current, daily } = weather;

  const locationLabel = location.admin1
    ? `${location.name}, ${location.admin1}, ${location.country}`
    : `${location.name}, ${location.country}`;

  const overallMin = Math.min(...daily.temperature_2m_min.slice(0, 5));
  const overallMax = Math.max(...daily.temperature_2m_max.slice(0, 5));

  const cityHour = getCityHour(location.timezone);
  const sunriseHour = parseInt(daily.sunrise[0]?.split("T")[1]?.split(":")[0] ?? "6", 10);
  const sunsetHour = parseInt(daily.sunset[0]?.split("T")[1]?.split(":")[0] ?? "21", 10);
  const isNight = isNightHour(cityHour, sunriseHour, sunsetHour);

  // Days that are excellent or good for going out (score ≥ 3)
  const bestDayIndices = daily.time.slice(0, 5).reduce<number[]>((acc, _, i) => {
    if (getWeatherScore(daily.weather_code[i], daily.temperature_2m_max[i]) >= 3) acc.push(i);
    return acc;
  }, []);

  return {
    current, daily, locationLabel,
    overallMin, overallMax,
    tempRange: overallMax - overallMin || 1,
    todayInfo: getWeatherInfo(current.weather_code),
    animClass: getWeatherAnimClass(current.weather_code),
    // At night, a clear/partly-cloudy sky should read as a moon, not a sun.
    isClearish: current.weather_code <= 2,
    todayFormatted: getFormattedDate(daily.time[0]),
    uvToday: describeUV(daily.uv_index_max[0]),
    weatherFact: getWeatherFact(current.weather_code, current.temperature_2m),
    countryFlag: countryCodeToFlag(location.countryCode ?? ""),
    feelsLikeExplanation: getFeelsLikeExplanation(
      current.temperature_2m,
      current.apparent_temperature,
      current.relative_humidity_2m,
      current.wind_speed_10m,
    ),
    cityHour,
    cityTimeInitial: formatCityTime(location.timezone),
    isNight,
    timeOfDay: getTimeOfDayLabel(cityHour),
    theme: getWeatherTheme(current.weather_code, isNight),
    alert: getWeatherAlert(
      daily.weather_code[0],
      daily.wind_speed_10m_max[0],
      daily.uv_index_max[0],
      daily.precipitation_sum[0],
    ),
    bestDayIndices,
  };
}

// Shared day-detail link builder used by the hero + 5-day cards.
export function buildDayHref(
  index: number, lat: number, lon: number, name: string, code?: string, tz?: string,
) {
  const c = code ? `&code=${encodeURIComponent(code)}` : "";
  const t = tz ? `&tz=${encodeURIComponent(tz)}` : "";
  return `/day/${index}?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}${c}${t}`;
}
