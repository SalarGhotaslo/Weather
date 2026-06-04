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
  /** Page background — strongly weather- and time-of-day-tinted. */
  bgGradient: string;
  /** Whether the night variant is in use (lets callers swap sun↔moon effects). */
  isNight: boolean;
}

// Map a raw Open-Meteo weather code to a coarse theme type.
export function getWeatherThemeType(weatherCode: number): WeatherThemeType {
  if (weatherCode === 0) return "clear";
  if (weatherCode <= 2) return "partly-cloudy";
  if (weatherCode === 3) return "overcast";
  if (weatherCode === 45 || weatherCode === 48) return "foggy";
  if (weatherCode >= 95) return "thunderstorm";
  if (weatherCode >= 71 && weatherCode <= 77) return "snowy";
  if (weatherCode >= 85 && weatherCode <= 86) return "snowy";
  if (
    (weatherCode >= 51 && weatherCode <= 57) ||
    (weatherCode >= 61 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82)
  ) {
    return "rainy";
  }
  return "overcast";
}

// Day / night gradient pairs. Each background pairs a strongly weather-coloured
// glow at the top with a darker base toward the bottom so dark cards and white
// text stay readable on top.
const GRADIENTS: Record<WeatherThemeType, { day: string; night: string }> = {
  clear: {
    // Warm golden-orange sunny sky.
    day:
      "radial-gradient(125% 85% at 50% -25%, #ffb43a 0%, #f7892a 17%, #c25d18 33%, #6e3712 49%, transparent 66%), linear-gradient(180deg, #2b1a0e 0%, #1d130b 50%, #120d08 100%)",
    // Deep, clear starlit night with a cool moon glow.
    night:
      "radial-gradient(120% 80% at 50% -20%, #2f3f72 0%, #1d2a54 30%, #131c3c 50%, transparent 70%), linear-gradient(180deg, #0c1126 0%, #0a0e1f 50%, #070912 100%)",
  },
  "partly-cloudy": {
    // Blue sky with a warm sun hint behind the clouds.
    day:
      "radial-gradient(125% 85% at 62% -22%, #74b8e8 0%, #4a82b0 24%, #c7873c 46%, transparent 64%), linear-gradient(180deg, #1a2230 0%, #141a25 50%, #0f141d 100%)",
    night:
      "radial-gradient(110% 72% at 56% -18%, #36426e 0%, #232c4c 34%, transparent 60%), linear-gradient(180deg, #121723 0%, #0e131d 50%, #0b0f17 100%)",
  },
  overcast: {
    // Flat, soft grey daylight.
    day:
      "radial-gradient(125% 85% at 50% -25%, #71808e 0%, #515c69 30%, transparent 58%), linear-gradient(180deg, #20262d 0%, #181d23 50%, #11151a 100%)",
    night:
      "radial-gradient(120% 80% at 50% -22%, #3a444f 0%, #272e36 32%, transparent 58%), linear-gradient(180deg, #181d24 0%, #12161c 50%, #0d1116 100%)",
  },
  foggy: {
    day:
      "radial-gradient(135% 95% at 50% 2%, #93a1ad 0%, #616c78 34%, transparent 60%), linear-gradient(180deg, #232a31 0%, #1b2127 50%, #151a20 100%)",
    night:
      "radial-gradient(135% 95% at 50% 2%, #4b5560 0%, #333b44 34%, transparent 58%), linear-gradient(180deg, #1a1f25 0%, #14181e 50%, #0f1318 100%)",
  },
  rainy: {
    // Cool, deep rain-soaked blue.
    day:
      "radial-gradient(125% 85% at 50% -20%, #4076a4 0%, #2a5273 28%, transparent 58%), linear-gradient(180deg, #122435 0%, #0d1b29 50%, #09131d 100%)",
    night:
      "radial-gradient(120% 80% at 50% -18%, #29435d 0%, #1b3146 32%, transparent 58%), linear-gradient(180deg, #0e1c2b 0%, #0a1521 50%, #070f18 100%)",
  },
  snowy: {
    // Bright, icy blue-white.
    day:
      "radial-gradient(135% 95% at 50% -15%, #d2e5f6 0%, #9ec0db 27%, #6189a9 47%, transparent 66%), linear-gradient(180deg, #223347 0%, #1a2738 50%, #141d2b 100%)",
    night:
      "radial-gradient(125% 85% at 50% -15%, #6d8da9 0%, #47637e 34%, transparent 60%), linear-gradient(180deg, #16222f 0%, #111a26 50%, #0d141f 100%)",
  },
  thunderstorm: {
    // Charged, stormy purple.
    day:
      "radial-gradient(125% 85% at 50% -12%, #5e3ea2 0%, #38236e 30%, transparent 58%), linear-gradient(180deg, #120b22 0%, #0c0819 50%, #070512 100%)",
    night:
      "radial-gradient(120% 80% at 50% -10%, #4a2f86 0%, #2c1a58 32%, transparent 56%), linear-gradient(180deg, #0d0719 0%, #090514 50%, #05040e 100%)",
  },
};

/**
 * Resolve the page theme for a weather code, optionally using the night variant
 * (e.g. when it is currently after sunset / before sunrise in the viewed city).
 */
export function getWeatherTheme(weatherCode: number, isNight = false): WeatherTheme {
  const type = getWeatherThemeType(weatherCode);
  return {
    type,
    bgGradient: isNight ? GRADIENTS[type].night : GRADIENTS[type].day,
    isNight,
  };
}
