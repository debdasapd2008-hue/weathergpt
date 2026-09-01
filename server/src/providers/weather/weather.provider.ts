import type { AirQuality, GeocodeMatch, WeatherResponse } from "@weathergpt/shared";

export type WeatherProviderErrorCode =
  | "NOT_FOUND" // 404 (unknown city)
  | "UNAUTHORIZED" // 401/403 (bad API key)
  | "RATE_LIMITED" // 429
  | "UPSTREAM_REQUEST_FAILED"; // network failure or upstream 5xx

export class WeatherProviderError extends Error {
  readonly code: WeatherProviderErrorCode;

  constructor(code: WeatherProviderErrorCode, message: string) {
    super(message);
    this.name = "WeatherProviderError";
    this.code = code;
  }
}

export type WeatherQuery = { city: string } | { lat: number; lon: number };

/** Raised when a provider has no air-quality data for a location. */
export class AirQualityNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AirQualityNotFound";
  }
}

/**
 * Abstraction over a weather data source. Only the server talks to it.
 */
export interface WeatherProvider {
  readonly name: string;
  getWeather(query: WeatherQuery): Promise<WeatherResponse>;
  /** Resolve a free-text search into selectable, coordinate-backed matches. */
  geocode(queryText: string): Promise<GeocodeMatch[]>;
  /** Air quality for a coordinate; null when the provider has no AQI data. */
  airQuality?(lat: number, lon: number): Promise<AirQuality | null>;
}