import Link from "next/link";
import { type WeatherResponse } from "@/lib/forecast";
import { type GeocodingResult } from "@/lib/geocoding";
import { getWindDirection, getWindArrow } from "@/lib/weather";
import Header from "@/app/components/Header";
import AppFooter from "@/app/components/AppFooter";
import SearchTracker from "@/app/components/SearchTracker";
import LocalTime from "@/app/components/LocalTime";
import WeatherBackground from "@/app/components/WeatherBackground";
import WeatherFactCard from "@/app/components/WeatherFactCard";
import CurrentHero from "./CurrentHero";
import StatsStrip from "./StatsStrip";
import FiveDayForecast from "./FiveDayForecast";
import { buildHomeView, buildDayHref } from "./homeView";
import styles from "./ForecastView.module.css";

// The full home forecast view for a resolved location.
export default function ForecastView({
  query,
  weather,
  location,
}: {
  query: string;
  weather: WeatherResponse;
  location: GeocodingResult;
}) {
  const vm = buildHomeView(weather, location);
  const { current, daily } = vm;
  const hrefFor = (i: number) =>
    buildDayHref(i, location.latitude, location.longitude, vm.locationLabel, location.countryCode, location.timezone);

  return (
    <div className={styles.shell} style={{ background: vm.theme.bgGradient }} data-weather={vm.theme.type}>
      <WeatherBackground weatherCode={current.weather_code} isNight={vm.isNight} />
      <Header defaultSearch={query} />
      <SearchTracker cityLabel={vm.locationLabel} />

      <main id="main-content" className={styles.main}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/" className={styles.crumbLink}>Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className={styles.crumbCurrent}>{location.name}</span>
        </nav>

        <div className={styles.locationBlock}>
          <div className={styles.locationRow}>
            {vm.countryFlag && <span className={styles.flag} aria-hidden="true">{vm.countryFlag}</span>}
            <h1 className={styles.locationName}>{vm.locationLabel}</h1>
          </div>
          <div className={styles.metaRow}>
            <p className={styles.date}>{vm.todayFormatted}</p>
            <span className={styles.dot} aria-hidden="true">·</span>
            <LocalTime
              timezone={location.timezone}
              initial={vm.cityTimeInitial}
              label={`Local time in ${location.name}`}
              className={styles.localTime}
            />
            <span className={styles.timeOfDay}>local time · {vm.timeOfDay}</span>
          </div>
        </div>

        <CurrentHero
          href={hrefFor(0)}
          timezone={location.timezone}
          temp={current.temperature_2m}
          label={vm.todayInfo.label}
          emoji={vm.todayInfo.emoji}
          animClass={vm.animClass}
          isNight={vm.isNight}
          isClearish={vm.isClearish}
          feelsLike={current.apparent_temperature}
          feelsLikeExplanation={vm.feelsLikeExplanation}
          high={daily.temperature_2m_max[0]}
          low={daily.temperature_2m_min[0]}
        />

        {vm.alert && (
          <div role="alert" className={`${styles.alert} ${vm.alert.level === "warning" ? styles.alertWarning : styles.alertAdvisory}`}>
            <span className={styles.alertIcon} aria-hidden="true">
              {vm.alert.level === "warning" ? "🚨" : "⚠️"}
            </span>
            <div>
              <p className={vm.alert.level === "warning" ? styles.alertTitleWarning : styles.alertTitleAdvisory}>
                {vm.alert.title}
              </p>
              <p className={styles.alertMessage}>{vm.alert.message}</p>
            </div>
          </div>
        )}

        <StatsStrip
          humidity={current.relative_humidity_2m}
          windSpeed={Math.round(current.wind_speed_10m)}
          windArrow={getWindArrow(current.wind_direction_10m)}
          windDirection={getWindDirection(current.wind_direction_10m)}
          precip={daily.precipitation_sum[0]}
          uvIndex={daily.uv_index_max[0]}
          uvLabel={vm.uvToday.label}
          pressure={Math.round(current.surface_pressure)}
          sunrise={daily.sunrise[0].split("T")[1]}
          sunset={daily.sunset[0].split("T")[1]}
        />

        <FiveDayForecast
          dates={daily.time.slice(0, 5)}
          weatherCodes={daily.weather_code.slice(0, 5)}
          maxTemps={daily.temperature_2m_max.slice(0, 5)}
          minTemps={daily.temperature_2m_min.slice(0, 5)}
          precipProbs={daily.precipitation_probability_max.slice(0, 5)}
          overallMin={vm.overallMin}
          tempRange={vm.tempRange}
          bestDayIndices={vm.bestDayIndices}
          hrefFor={hrefFor}
        />

        <WeatherFactCard fact={vm.weatherFact} className="mb-6" />
      </main>
      <AppFooter />
    </div>
  );
}
