import { type WeatherResponse, type GeocodingResult, type HourlyEntry } from "@/lib/weather";

// Shared test fixtures. Lives outside src/lib + src/app so it isn't counted by
// the coverage gate.

export function makeWeather(overrides: Partial<WeatherResponse> = {}): WeatherResponse {
  return {
    current: {
      temperature_2m: 18,
      relative_humidity_2m: 60,
      apparent_temperature: 17,
      weather_code: 1,
      wind_speed_10m: 12,
      wind_direction_10m: 200,
      surface_pressure: 1015,
      ...overrides.current,
    },
    daily: {
      time: ["2026-06-05", "2026-06-06", "2026-06-07", "2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11"],
      temperature_2m_max: [22, 24, 21, 19, 25, 23, 20],
      temperature_2m_min: [12, 13, 11, 10, 14, 13, 9],
      apparent_temperature_max: [21, 23, 20, 18, 24, 22, 19],
      apparent_temperature_min: [10, 11, 9, 8, 12, 11, 7],
      weather_code: [1, 2, 3, 61, 0, 45, 80],
      precipitation_sum: [0, 1.2, 4.5, 8, 0, 0.3, 12],
      precipitation_probability_max: [10, 20, 55, 80, 5, 30, 90],
      wind_speed_10m_max: [15, 18, 22, 30, 12, 20, 35],
      wind_direction_10m_dominant: [200, 210, 180, 250, 190, 220, 240],
      uv_index_max: [5, 6, 4, 3, 7, 2, 1],
      sunrise: [
        "2026-06-05T04:45", "2026-06-06T04:44", "2026-06-07T04:44", "2026-06-08T04:43",
        "2026-06-09T04:43", "2026-06-10T04:43", "2026-06-11T04:42",
      ],
      sunset: [
        "2026-06-05T21:15", "2026-06-06T21:16", "2026-06-07T21:17", "2026-06-08T21:18",
        "2026-06-09T21:19", "2026-06-10T21:20", "2026-06-11T21:21",
      ],
      ...overrides.daily,
    },
  };
}

export function makeLocation(overrides: Partial<GeocodingResult> = {}): GeocodingResult {
  return {
    name: "London",
    latitude: 51.5074,
    longitude: -0.1278,
    country: "United Kingdom",
    countryCode: "GB",
    admin1: "England",
    timezone: "Europe/London",
    ...overrides,
  };
}

export function makeHourlyEntry(overrides: Partial<HourlyEntry> = {}): HourlyEntry {
  return {
    hour: 12,
    label: "12pm",
    temp: 18,
    weatherCode: 1,
    precipProb: 10,
    precip: 0,
    windSpeed: 12,
    ...overrides,
  };
}
