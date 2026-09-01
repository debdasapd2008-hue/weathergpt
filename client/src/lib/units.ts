import { compassDirection } from "./format";

export type UnitSystem = "metric" | "imperial";

export const UNIT_LABELS: Record<UnitSystem, string> = {
  metric: "Metric (°C)",
  imperial: "Imperial (°F)",
};

const FAHRENHEIT_OFFSET = 32;

export function toFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + FAHRENHEIT_OFFSET;
}

export function formatTemp(celsius: number, units: UnitSystem): string {
  const value = units === "metric" ? celsius : toFahrenheit(celsius);
  return `${Math.round(value)}°${units === "metric" ? "C" : "F"}`;
}

export function formatTempUnit(units: UnitSystem): string {
  return units === "metric" ? "°C" : "°F";
}

export function formatWindSpeed(metersPerSecond: number, units: UnitSystem): string {
  if (units === "imperial") {
    // 1 m/s ≈ 2.23694 mph
    return `${Math.round(metersPerSecond * 2.23694)} mph`;
  }
  return `${metersPerSecond.toFixed(1)} m/s`;
}

export function formatVisibilityDistance(meters: number, units: UnitSystem): string {
  if (units === "imperial") {
    // 1 km ≈ 0.621371 mi
    const miles = (meters / 1000) * 0.621371;
    return `${miles >= 10 ? miles.toFixed(0) : miles.toFixed(1)} mi`;
  }
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${Number.isInteger(km) ? km.toFixed(0) : km.toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatPrecipitation(mm: number, units: UnitSystem): string {
  // 1 mm ≈ 0.0393701 in
  const value = units === "imperial" ? mm * 0.0393701 : mm;
  return `${value.toFixed(2)} ${units === "imperial" ? "in" : "mm"}`;
}

export function formatPressure(hPa: number): string {
  return `${Math.round(hPa)} hPa`;
}

export function formatCompass(degrees: number): string {
  return compassDirection(degrees);
}

/**
 * Body-tuned (~40-line) description of how the current air feels, used by the
 * Health and Home sections. Pure function, easy to unit test.
 */
export function comfortDescription(
  tempC: number,
  humidity: number,
  windMps: number,
): string {
  const feels = toFahrenheit(tempC);
  if (feels <= 32) return "Cold — dress warmly with layers.";
  if (feels <= 50) return "Chilly — a jacket and a light layer are a good idea.";
  if (feels <= 68) return "Mild — comfortable in light clothing.";
  if (feels <= 77) return "Warm — comfortable, ideal for outdoor activity.";
  if (humidity >= 70) return "Hot and humid — hydrate often and limit midday exertion.";
  return "Hot — stay hydrated and wear light, loose clothing.";
}

/** UV guidance text aligned to the standard WHO index bands. */
export function uvAdvice(uvIndex: number): string {
  const value = Math.max(0, Math.round(uvIndex));
  if (value <= 2) return "Low — no protection needed for most people.";
  if (value <= 5) return "Moderate — wear sunscreen and a hat outdoors.";
  if (value <= 7) return "High — cover up, wear sunscreen, seek shade at midday.";
  if (value <= 10) return "Very high — extra protection required; avoid the midday sun.";
  return "Extreme — take every precaution; avoid the sun outdoors.";
}

/**
 * Wind chill (Celsius) per the standard JAG/TI formula, valid below 10°C and
 * with wind > 1.34 m/s. Returns null when the formula does not apply.
 */
export function windChillCelsius(tempC: number, windMps: number): number | null {
  const v = windMps * 3.6; // km/h
  if (tempC > 10 || v <= 4.8) return null;
  return (
    13.12 +
    0.6215 * tempC -
    11.37 * Math.pow(v, 0.16) +
    0.3965 * tempC * Math.pow(v, 0.16)
  );
}

/**
 * Heat index approximation (Celsius) using the standard NOAA "simple" formula
 * (computed in Fahrenheit, then converted back). Returns null below the 27°C
 * threshold where the model does not apply.
 */
export function heatIndexCelsius(tempC: number, humidity: number): number | null {
  if (tempC < 27) return null;
  const tempF = toFahrenheit(tempC);
  // HI = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + RH * 0.094), all in °F.
  const indexF = 0.5 * (tempF + 61.0 + (tempF - 68.0) * 1.2 + humidity * 0.094);
  const indexC = ((indexF - FAHRENHEIT_OFFSET) * 5) / 9;
  return Number.isFinite(indexC) ? indexC : null;
}