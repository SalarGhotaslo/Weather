import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getHourlyAnalysis,
  getDayHourlyData,
  getDayAverages,
  fetchForecast,
  validateCoord,
  type WeatherResponse,
} from "@/lib/weather";
import Header from "@/app/components/Header";
import AppFooter from "@/app/components/AppFooter";
import WeatherBackground from "@/app/components/WeatherBackground";
import WeatherFactCard from "@/app/components/WeatherFactCard";
import WeatherError from "@/app/components/WeatherError";
import HourlyForecast from "./HourlyForecast";
import OutdoorTimes from "./OutdoorTimes";
import YearComparison from "./YearComparison";
import DayHeader from "./DayHeader";
import CurrentWeatherCard from "./CurrentWeatherCard";
import WeatherAlertBanner from "./WeatherAlertBanner";
import DetailGrid from "./DetailGrid";
import WhatToWear from "./WhatToWear";
import { getHourlyWeather, getHistorical, getAirQuality } from "./dayData";
import { buildDayView } from "./dayView";
import styles from "./page.module.css";

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

export default async function DayPage({ params, searchParams }: PageProps) {
  const [{ index }, { lat: latStr, lon: lonStr, name, code, tz }] = await Promise.all([
    params,
    searchParams,
  ]);
  const dayIndex = parseInt(index, 10);
  const lat = validateCoord(latStr, -90, 90, LONDON_LAT);
  const lon = validateCoord(lonStr, -180, 180, LONDON_LON);
  const locationName = name ? name.slice(0, 200) : "London"; // cap length

  if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) notFound();

  let weather: WeatherResponse;
  try {
    weather = await fetchForecast(lat, lon, tz);
  } catch {
    return <WeatherError defaultSearch={locationName} />;
  }

  const dateStr = weather.daily.time[dayIndex];
  if (!dateStr) notFound();

  const [historical, hourlyWeather, airQuality] = await Promise.all([
    getHistorical(dateStr, lat, lon),
    getHourlyWeather(lat, lon, tz),
    getAirQuality(dateStr, lat, lon, tz),
  ]);

  const outdoorAnalysis = hourlyWeather
    ? getHourlyAnalysis(hourlyWeather.hourly, dateStr, weather.daily.sunrise[dayIndex], weather.daily.sunset[dayIndex])
    : null;
  const hourlyEntries = hourlyWeather ? getDayHourlyData(hourlyWeather.hourly, dateStr) : [];
  const dayAverages = hourlyWeather
    ? getDayAverages(hourlyWeather.hourly, dateStr)
    : { humidity: null, pressure: null };

  const vm = buildDayView({ weather, dayIndex, dateStr, lat, lon, locationName, code, tz, hourlyEntries, dayAverages });

  return (
    <div className={styles.shell} style={{ background: vm.theme.bgGradient }} data-weather={vm.theme.type}>
      <WeatherBackground weatherCode={vm.weatherCode} isNight={vm.isNight} />
      <Header defaultSearch={locationName} />

      <main id="main-content" className={styles.main}>
        <DayHeader
          locationName={locationName}
          searchQuery={encodeURIComponent(locationName)}
          dayName={vm.dayName}
          formattedDate={vm.formattedDate}
          countryFlag={vm.countryFlag}
          dayIndex={dayIndex}
          baseParams={vm.baseParams}
          isToday={vm.isToday}
          tz={tz}
          cityTimeInitial={vm.cityTimeInitial}
          timeOfDay={vm.timeOfDay}
          dayLabels={vm.dayLabels}
          shareUrl={`/day/${dayIndex}?${vm.baseParams}`}
          shareTitle={`${vm.dayName} weather in ${locationName}`}
        />

        <CurrentWeatherCard
          isToday={vm.isToday}
          todayTemp={vm.isToday ? vm.current.temperature_2m : null}
          maxTemp={vm.maxTemp}
          minTemp={vm.minTemp}
          dayName={vm.dayName}
          infoLabel={vm.info.label}
          infoEmoji={vm.info.emoji}
          animClass={vm.animClass}
          locationName={locationName}
          timeOfDay={vm.timeOfDay}
          isNight={vm.isNight}
          currentHourEntry={vm.currentHourEntry}
        />

        {vm.alert && <WeatherAlertBanner alert={vm.alert} />}

        <DetailGrid
          feelsLike={vm.feelsLike}
          feelsLikeExplanation={vm.feelsLikeExplanation || undefined}
          humidity={vm.humidity}
          windMax={Math.round(vm.windMax)}
          windArrow={vm.windArrow}
          windDirection={vm.windDirection}
          precip={vm.precip}
          uvIndex={vm.uvIndex}
          uvLabel={vm.uv.label}
          uvTip={vm.uv.tip}
          sunrise={vm.daily.sunrise[dayIndex].split("T")[1]}
          sunset={vm.daily.sunset[dayIndex].split("T")[1]}
          daylight={vm.daylight}
          pressure={vm.pressure}
          aqi={airQuality.aqi}
          pollen={airQuality.pollen}
        />

        <HourlyForecast
          entries={hourlyEntries}
          sunriseHour={vm.sunriseHour}
          sunsetHour={vm.sunsetHour}
          isToday={vm.isToday}
          cityHour={vm.cityHour}
        />

        {outdoorAnalysis && (
          <OutdoorTimes analysis={outdoorAnalysis} isToday={vm.isToday} cityHour={vm.cityHour} />
        )}

        <YearComparison maxTemp={vm.maxTemp} minTemp={vm.minTemp} precip={vm.precip} historical={historical} />

        <WhatToWear summary={vm.dressCode.summary} items={vm.dressCode.items} />

        <WeatherFactCard fact={vm.weatherFact} className="mb-3" />
      </main>
      <AppFooter />
    </div>
  );
}
