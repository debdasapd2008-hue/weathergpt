import { describe, expect, it } from "vitest";
import { Cloud, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun } from "lucide-react";
import { weatherIcon } from "./icons";

describe("weatherIcon", () => {
  it("maps OWM day codes", () => {
    expect(weatherIcon("01d")).toBe(Sun);
    expect(weatherIcon("02d")).toBe(CloudSun);
    expect(weatherIcon("10d")).toBe(CloudRain);
    expect(weatherIcon("13d")).toBe(CloudSnow);
    expect(weatherIcon("11d")).toBe(CloudLightning);
    expect(weatherIcon("50d")).toBe(CloudFog);
  });

  it("maps OWM night codes", () => {
    expect(weatherIcon("01n")).toBe(Moon);
    expect(weatherIcon("02n")).toBe(CloudMoon);
    expect(weatherIcon("10n")).toBe(CloudRain);
  });

  it("maps cloud variants to the cloud icon", () => {
    expect(weatherIcon("03d")).toBe(Cloud);
    expect(weatherIcon("04n")).toBe(Cloud);
  });

  it("falls back to condition text when no code is available", () => {
    expect(weatherIcon("", "Light drizzle")).toBe(CloudRain);
    expect(weatherIcon("", "Snow showers")).toBe(CloudSnow);
    expect(weatherIcon("", "Thunderstorm")).toBe(CloudLightning);
    expect(weatherIcon("", "Mist")).toBe(CloudFog);
    expect(weatherIcon("", "Partly cloudy")).toBe(Cloud);
  });

  it("falls back to a generic cloud for unknown input", () => {
    expect(weatherIcon("")).toBe(Cloud);
  });
});