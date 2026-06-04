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
        "radial-gradient(ellipse at 50% -20%, rgba(59, 135, 214, 0.5) 0%, rgba(30, 80, 160, 0.2) 35%, transparent 55%), radial-gradient(ellipse at 80% 15%, rgba(255, 200, 50, 0.35) 0%, rgba(255, 160, 30, 0.12) 30%, transparent 50%), radial-gradient(ellipse at 20% 10%, rgba(100, 180, 255, 0.15) 0%, transparent 40%), linear-gradient(180deg, #0c2240 0%, #09162a 40%, #0a1825 100%)",
    };
  }
  if (weatherCode <= 2) {
    return {
      type: "partly-cloudy",
      bgGradient:
        "radial-gradient(ellipse at 60% -10%, rgba(59, 135, 214, 0.3) 0%, rgba(40, 90, 150, 0.1) 45%, transparent 60%), radial-gradient(ellipse at 30% 40%, rgba(140, 160, 180, 0.2) 0%, rgba(100, 120, 140, 0.08) 35%, transparent 55%), linear-gradient(180deg, #111e2e 0%, #0e1723 50%, #0b141e 100%)",
    };
  }
  if (weatherCode === 3) {
    return {
      type: "overcast",
      bgGradient:
        "linear-gradient(180deg, rgba(60, 80, 100, 0.45) 0%, rgba(40, 55, 70, 0.25) 35%, rgba(25, 35, 50, 0.1) 100%), linear-gradient(180deg, #18222f 0%, #141c26 50%, #0f171f 100%)",
    };
  }
  if (weatherCode === 45 || weatherCode === 48) {
    return {
      type: "foggy",
      bgGradient:
        "linear-gradient(180deg, rgba(100, 120, 140, 0.35) 0%, rgba(70, 90, 110, 0.2) 35%, rgba(50, 65, 80, 0.08) 100%), linear-gradient(180deg, #1e2c3a 0%, #1a2633 50%, #151f29 100%)",
    };
  }
  if (weatherCode >= 96) {
    return {
      type: "thunderstorm",
      bgGradient:
        "radial-gradient(ellipse at 50% -10%, rgba(80, 30, 120, 0.65) 0%, rgba(50, 15, 80, 0.35) 35%, transparent 55%), radial-gradient(ellipse at 80% 60%, rgba(40, 60, 120, 0.15) 0%, transparent 45%), linear-gradient(180deg, #0e0b1e 0%, #090714 50%, #060410 100%)",
    };
  }
  if (weatherCode === 95) {
    return {
      type: "thunderstorm",
      bgGradient:
        "radial-gradient(ellipse at 50% -10%, rgba(65, 35, 110, 0.55) 0%, rgba(40, 20, 70, 0.3) 35%, transparent 55%), radial-gradient(ellipse at 20% 50%, rgba(30, 50, 100, 0.12) 0%, transparent 40%), linear-gradient(180deg, #100d20 0%, #090714 50%, #070411 100%)",
    };
  }
  if (weatherCode >= 71 && weatherCode <= 77) {
    return {
      type: "snowy",
      bgGradient:
        "radial-gradient(ellipse at 50% 0%, rgba(200, 220, 240, 0.3) 0%, rgba(160, 190, 215, 0.12) 40%, transparent 55%), radial-gradient(ellipse at 30% 80%, rgba(180, 200, 225, 0.08) 0%, transparent 40%), linear-gradient(180deg, #1c3040 0%, #162230 50%, #111b26 100%)",
    };
  }
  if (weatherCode >= 85 && weatherCode <= 86) {
    return {
      type: "snowy",
      bgGradient:
        "radial-gradient(ellipse at 40% 0%, rgba(190, 215, 235, 0.35) 0%, rgba(150, 180, 210, 0.15) 40%, transparent 55%), linear-gradient(180deg, #1f3448 0%, #182838 50%, #121f2e 100%)",
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
        "radial-gradient(ellipse at 50% -10%, rgba(40, 80, 130, 0.5) 0%, rgba(25, 55, 95, 0.25) 35%, transparent 55%), linear-gradient(180deg, #0e1e30 0%, #0a1624 50%, #07121e 100%)",
    };
  }
  return { type: "overcast", bgGradient: "#141c26" };
}
