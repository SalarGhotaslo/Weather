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
        "radial-gradient(ellipse at 50% 0%, rgba(59, 135, 214, 0.4) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(255, 200, 50, 0.25) 0%, transparent 45%), #081221",
    };
  }
  if (weatherCode <= 2) {
    return {
      type: "partly-cloudy",
      bgGradient:
        "radial-gradient(ellipse at 50% 0%, rgba(59, 135, 214, 0.3) 0%, transparent 55%), #0e1723",
    };
  }
  if (weatherCode === 3) {
    return {
      type: "overcast",
      bgGradient:
        "linear-gradient(180deg, rgba(50, 70, 90, 0.45) 0%, rgba(25, 35, 50, 0.2) 100%), #141c26",
    };
  }
  if (weatherCode === 45 || weatherCode === 48) {
    return {
      type: "foggy",
      bgGradient:
        "linear-gradient(180deg, rgba(70, 90, 110, 0.5) 0%, rgba(40, 55, 70, 0.15) 100%), #18222e",
    };
  }
  if (weatherCode >= 95) {
    return {
      type: "thunderstorm",
      bgGradient:
        "radial-gradient(ellipse at 50% 0%, rgba(60, 30, 90, 0.55) 0%, transparent 55%), #090714",
    };
  }
  if (weatherCode >= 71 && weatherCode <= 77) {
    return {
      type: "snowy",
      bgGradient:
        "radial-gradient(ellipse at 50% 0%, rgba(180, 200, 220, 0.25) 0%, transparent 55%), #162230",
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
        "linear-gradient(180deg, rgba(25, 55, 90, 0.5) 0%, rgba(10, 25, 40, 0.2) 100%), #0a1624",
    };
  }
  return { type: "overcast", bgGradient: "#141c26" };
}
