export type WeatherThemeType =
  | "clear"
  | "partly-cloudy"
  | "overcast"
  | "foggy"
  | "rainy"
  | "snowy"
  | "thunderstorm";

export interface WeatherTheme {
  type: WeatherThemeType;
  bgGradient: string;
}

export function getWeatherTheme(weatherCode: number): WeatherTheme {
  if (weatherCode === 0) {
    return {
      type: "clear",
      bgGradient:
        "radial-gradient(ellipse at 70% -10%, rgba(255, 180, 30, 0.45) 0%, rgba(255, 120, 20, 0.15) 30%, transparent 55%), radial-gradient(ellipse at 30% 5%, rgba(255, 200, 60, 0.2) 0%, transparent 40%), linear-gradient(180deg, #1a0e08 0%, #120d0a 30%, #0d0a08 100%)",
    };
  }
  if (weatherCode <= 2) {
    return {
      type: "partly-cloudy",
      bgGradient:
        "radial-gradient(ellipse at 60% -10%, rgba(200, 180, 140, 0.25) 0%, rgba(140, 130, 120, 0.1) 40%, transparent 55%), linear-gradient(180deg, #1a1a1c 0%, #121416 50%, #0e1012 100%)",
    };
  }
  if (weatherCode === 3) {
    return {
      type: "overcast",
      bgGradient:
        "linear-gradient(180deg, #1e2024 0%, #16181c 40%, #101214 100%)",
    };
  }
  if (weatherCode === 45 || weatherCode === 48) {
    return {
      type: "foggy",
      bgGradient:
        "linear-gradient(180deg, #222628 0%, #1c1f22 40%, #15181c 100%)",
    };
  }
  if (weatherCode >= 96) {
    return {
      type: "thunderstorm",
      bgGradient:
        "radial-gradient(ellipse at 50% -5%, rgba(60, 20, 100, 0.7) 0%, rgba(30, 10, 60, 0.35) 40%, transparent 60%), linear-gradient(180deg, #0c0814 0%, #080612 50%, #05040e 100%)",
    };
  }
  if (weatherCode === 95) {
    return {
      type: "thunderstorm",
      bgGradient:
        "radial-gradient(ellipse at 50% -5%, rgba(50, 25, 90, 0.6) 0%, rgba(25, 12, 50, 0.3) 40%, transparent 60%), linear-gradient(180deg, #0e0a18 0%, #0a0814 50%, #060510 100%)",
    };
  }
  if (weatherCode >= 71 && weatherCode <= 77) {
    return {
      type: "snowy",
      bgGradient:
        "radial-gradient(ellipse at 50% 0%, rgba(210, 225, 245, 0.2) 0%, rgba(180, 200, 225, 0.08) 40%, transparent 55%), linear-gradient(180deg, #1c2838 0%, #141e2c 50%, #101824 100%)",
    };
  }
  if (weatherCode >= 85 && weatherCode <= 86) {
    return {
      type: "snowy",
      bgGradient:
        "radial-gradient(ellipse at 40% 0%, rgba(200, 220, 240, 0.25) 0%, rgba(160, 185, 215, 0.1) 40%, transparent 55%), linear-gradient(180deg, #1e2c3e 0%, #162234 50%, #121c2a 100%)",
    };
  }
  if (
    (weatherCode >= 51 && weatherCode <= 57) ||
    (weatherCode >= 61 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82)
  ) {
    return {
      type: "rainy",
      bgGradient:
        "linear-gradient(180deg, #0e1a2e 0%, #0a1422 40%, #07101a 100%)",
    };
  }
  return { type: "overcast", bgGradient: "#14181c" };
}
