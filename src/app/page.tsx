import type { Metadata } from "next";
import { geocodeLocation } from "@/lib/geocoding";
import { fetchForecast, type WeatherResponse } from "@/lib/forecast";
import WeatherError from "@/app/components/WeatherError";
import HomeLanding from "./home/HomeLanding";
import LocationNotFound from "./home/LocationNotFound";
import ForecastView from "./home/ForecastView";

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

  if (!q) return <HomeLanding />;

  const location = await geocodeLocation(q);
  if (!location) return <LocationNotFound query={q} />;

  let weather: WeatherResponse;
  try {
    weather = await fetchForecast(location.latitude, location.longitude, location.timezone);
  } catch {
    return <WeatherError defaultSearch={q} />;
  }

  return <ForecastView query={q} weather={weather} location={location} />;
}
