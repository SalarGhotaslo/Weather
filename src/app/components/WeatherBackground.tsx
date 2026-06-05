"use client";

import { getWeatherThemeType } from "@/lib/weatherTheme";
import { PartlyCloudyEffect, OvercastEffect } from "./weather-effects/CloudEffect";
import RainEffect from "./weather-effects/RainEffect";
import ThunderEffect from "./weather-effects/ThunderEffect";
import SnowEffect from "./weather-effects/SnowEffect";
import SunEffect from "./weather-effects/SunEffect";
import StarsEffect from "./weather-effects/StarsEffect";
import FogEffect from "./weather-effects/FogEffect";

// Decorative animated weather backdrop. Each weather type maps to a self-
// contained effect under ./weather-effects (all aria-hidden, pointer-none).
const overlayMap: Record<string, React.FC> = {
  clear: SunEffect,
  "partly-cloudy": PartlyCloudyEffect,
  overcast: OvercastEffect,
  foggy: FogEffect,
  rainy: RainEffect,
  snowy: SnowEffect,
  thunderstorm: ThunderEffect,
};

export default function WeatherBackground({
  weatherCode,
  isNight = false,
}: {
  weatherCode: number;
  isNight?: boolean;
}) {
  const type = getWeatherThemeType(weatherCode);
  // At night, swap the sun for a moon-and-stars sky on clear / partly-cloudy.
  if (isNight && (type === "clear" || type === "partly-cloudy")) {
    return <StarsEffect />;
  }
  const Overlay = overlayMap[type];
  return Overlay ? <Overlay /> : null;
}
