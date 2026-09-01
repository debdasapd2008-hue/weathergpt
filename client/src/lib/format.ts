export function formatTemperature(celsius: number): string {
  return `${Math.round(celsius)}°`;
}

export function formatWind(speedMetersPerSecond: number): string {
  return `${speedMetersPerSecond.toFixed(1)} m/s`;
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function compassDirection(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return COMPASS[index] ?? "N";
}

export function formatVisibility(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${Number.isInteger(km) ? km.toFixed(0) : km.toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatPercent(probability: number): string {
  const clamped = Math.min(100, Math.max(0, Math.round(probability)));
  return `${clamped}%`;
}

export function uvIndexLabel(uvIndex: number): string {
  const value = Math.max(0, Math.round(uvIndex));
  if (value <= 2) return `${value} · Low`;
  if (value <= 5) return `${value} · Moderate`;
  if (value <= 7) return `${value} · High`;
  if (value <= 10) return `${value} · Very high`;
  return `${value} · Extreme`;
}

export function capitalize(value: string): string {
  if (!value) return value;
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}