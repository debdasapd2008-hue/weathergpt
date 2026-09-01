import { describe, expect, it } from "vitest";
import {
  comfortDescription,
  formatTemp,
  formatVisibilityDistance,
  formatWindSpeed,
  heatIndexCelsius,
  toFahrenheit,
  uvAdvice,
  windChillCelsius,
} from "./units";

describe("units", () => {
  it("converts Celsius to Fahrenheit", () => {
    expect(toFahrenheit(0)).toBe(32);
    expect(toFahrenheit(25)).toBe(77);
    expect(toFahrenheit(-40)).toBe(-40);
  });

  it("formats temperatures for both systems", () => {
    expect(formatTemp(25, "metric")).toBe("25°C");
    expect(formatTemp(25, "imperial")).toBe("77°F");
  });

  it("formats wind speed", () => {
    expect(formatWindSpeed(3, "metric")).toBe("3.0 m/s");
    expect(formatWindSpeed(3, "imperial")).toBe("7 mph");
  });

  it("formats visibility with sensible rounding", () => {
    expect(formatVisibilityDistance(500, "metric")).toBe("500 m");
    expect(formatVisibilityDistance(2000, "metric")).toBe("2 km");
    expect(formatVisibilityDistance(2500, "metric")).toBe("2.5 km");
    expect(formatVisibilityDistance(2000, "imperial")).toBe("1.2 mi");
  });

  it("computes heat index only when the formula applies", () => {
    expect(heatIndexCelsius(25, 60)).toBeNull();
    const warm = heatIndexCelsius(30, 70);
    expect(warm).not.toBeNull();
    if (warm !== null) {
      expect(warm).toBeGreaterThan(30);
    }
  });

  it("computes wind chill only when it is cold and windy enough", () => {
    expect(windChillCelsius(20, 3)).toBeNull();
    const chill = windChillCelsius(0, 5);
    expect(chill).not.toBeNull();
    if (chill !== null) {
      expect(chill).toBeLessThan(0);
    }
  });

  it("describes comfort by heat, then humidity", () => {
    expect(comfortDescription(0, 50, 2)).toContain("Cold");
    expect(comfortDescription(25, 40, 2)).toContain("Warm");
    expect(comfortDescription(32, 80, 2)).toContain("humid");
  });

  it("maps the UV index to WHO guidance bands", () => {
    expect(uvAdvice(1)).toContain("Low");
    expect(uvAdvice(6)).toContain("High");
    expect(uvAdvice(11)).toContain("Extreme");
  });
});