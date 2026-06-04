import { describe, it, expect } from "vitest";
import { getWeatherTheme, getWeatherThemeType } from "./weatherTheme";

describe("getWeatherTheme", () => {
  it("returns clear type for code 0", () => {
    const theme = getWeatherTheme(0);
    expect(theme.type).toBe("clear");
    expect(theme.bgGradient).toContain("radial-gradient");
    expect(theme.bgGradient).toContain("#");
  });

  it("returns partly-cloudy for codes 1-2", () => {
    expect(getWeatherTheme(1).type).toBe("partly-cloudy");
    expect(getWeatherTheme(2).type).toBe("partly-cloudy");
  });

  it("returns overcast for code 3", () => {
    expect(getWeatherTheme(3).type).toBe("overcast");
  });

  it("returns foggy for codes 45 and 48", () => {
    expect(getWeatherTheme(45).type).toBe("foggy");
    expect(getWeatherTheme(48).type).toBe("foggy");
  });

  it("returns rainy for drizzle codes 51-57", () => {
    expect(getWeatherTheme(51).type).toBe("rainy");
    expect(getWeatherTheme(55).type).toBe("rainy");
    expect(getWeatherTheme(57).type).toBe("rainy");
  });

  it("returns rainy for rain codes 61-67", () => {
    expect(getWeatherTheme(61).type).toBe("rainy");
    expect(getWeatherTheme(65).type).toBe("rainy");
    expect(getWeatherTheme(67).type).toBe("rainy");
  });

  it("returns snowy for snow codes 71-77", () => {
    expect(getWeatherTheme(71).type).toBe("snowy");
    expect(getWeatherTheme(75).type).toBe("snowy");
    expect(getWeatherTheme(77).type).toBe("snowy");
  });

  it("returns rainy for showers codes 80-82", () => {
    expect(getWeatherTheme(80).type).toBe("rainy");
    expect(getWeatherTheme(82).type).toBe("rainy");
  });

  it("returns snowy for snow showers codes 85-86", () => {
    expect(getWeatherTheme(85).type).toBe("snowy");
    expect(getWeatherTheme(86).type).toBe("snowy");
  });

  it("returns thunderstorm for thunderstorm codes 95+", () => {
    expect(getWeatherTheme(95).type).toBe("thunderstorm");
    expect(getWeatherTheme(96).type).toBe("thunderstorm");
    expect(getWeatherTheme(99).type).toBe("thunderstorm");
  });

  it("falls back to overcast for unknown codes", () => {
    expect(getWeatherTheme(4).type).toBe("overcast");
    expect(getWeatherTheme(47).type).toBe("overcast");
    expect(getWeatherTheme(83).type).toBe("overcast");
    expect(getWeatherTheme(87).type).toBe("overcast");
  });

  it("defaults to the day variant", () => {
    const theme = getWeatherTheme(0);
    expect(theme.isNight).toBe(false);
  });

  it("returns a distinct night gradient when isNight is true", () => {
    const day = getWeatherTheme(0, false);
    const night = getWeatherTheme(0, true);
    expect(night.isNight).toBe(true);
    expect(night.bgGradient).not.toBe(day.bgGradient);
    // Night clear sky should lean blue, not the warm orange of day.
    expect(night.bgGradient).toContain("#0c1126");
  });

  it("provides night variants for every theme type", () => {
    for (const code of [0, 1, 3, 45, 61, 71, 95]) {
      const day = getWeatherTheme(code, false);
      const night = getWeatherTheme(code, true);
      expect(night.bgGradient).not.toBe(day.bgGradient);
      expect(night.bgGradient.length).toBeGreaterThan(0);
    }
  });
});

describe("getWeatherThemeType", () => {
  it("maps codes to coarse theme types", () => {
    expect(getWeatherThemeType(0)).toBe("clear");
    expect(getWeatherThemeType(2)).toBe("partly-cloudy");
    expect(getWeatherThemeType(3)).toBe("overcast");
    expect(getWeatherThemeType(48)).toBe("foggy");
    expect(getWeatherThemeType(65)).toBe("rainy");
    expect(getWeatherThemeType(82)).toBe("rainy");
    expect(getWeatherThemeType(75)).toBe("snowy");
    expect(getWeatherThemeType(86)).toBe("snowy");
    expect(getWeatherThemeType(95)).toBe("thunderstorm");
    expect(getWeatherThemeType(99)).toBe("thunderstorm");
  });
});
