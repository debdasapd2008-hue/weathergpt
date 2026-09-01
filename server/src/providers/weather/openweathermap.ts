import type {
  AirQuality,
  GeocodeMatch,
  WeatherResponse,
} from "@weathergpt/shared";
import { AirQualityNotFound, WeatherProviderError, type WeatherProvider, type WeatherQuery } from "./weather.provider";
import {
  buildAlerts,
  buildCurrent,
  buildDaily,
  buildFromOneCall,
  buildHourly,
  estimateOffsetSeconds,
  type OWMCityWeather,
  type OWMForecast,
  type OWMOneCall,
  type OWMUV,
} from "./openweathermap.mapper";

export interface OpenWeatherMapConfig {
  apiKey: string;
  /** e.g. https://api.openweathermap.org/data */
  baseUrl: string;
  /** e.g. https://api.openweathermap.org/geo */
  geoBaseUrl: string;
}

type UpstreamCode = "NOT_FOUND" | "UNAUTHORIZED" | "RATE_LIMITED" | "UPSTREAM_REQUEST_FAILED";

function statusToErrorCode(status: number): UpstreamCode {
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 404) return "NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  return "UPSTREAM_REQUEST_FAILED";
}

interface OWMGeocodeResult {
  name?: string;
  lat?: number;
  lon?: number;
  country?: string;
  state?: string;
  local_names?: Record<string, string>;
}

interface OWMAirPollution {
  list?: Array<{ main?: { aqi?: number }; components?: { pm2_5?: number; pm10?: number } }>;
}

/**
 * OpenWeatherMap provider. Tries the paid "One Call 3.0" API first (real 7-day
 * forecast, exact timezone, native UV index and official alerts) and
 * transparently falls back to the free current + 5-day/3-hour forecast
 * endpoints. Search is coordinate-first via the free Geocoding API.
 */
export class OpenWeatherMapProvider implements WeatherProvider {
  readonly name = "openweathermap";

  constructor(private readonly config: OpenWeatherMapConfig) {}

  async getWeather(query: WeatherQuery): Promise<WeatherResponse> {
    const city =
      "city" in query
        ? await this.#fetchCityWeather({ q: query.city })
        : await this.#fetchCityWeather({ lat: query.lat, lon: query.lon });

    let oneCall: OWMOneCall | null = null;
    if (city.coord) {
      oneCall = await this.#tryOneCall(city.coord.lat, city.coord.lon);
    }

    if (oneCall) {
      const result = buildFromOneCall(oneCall, city, null);
      if (result) return result;
    }

    return this.#buildLegacy(city);
  }

  async geocode(queryText: string): Promise<GeocodeMatch[]> {
    const results = await this.#request<OWMGeocodeResult[]>(
      this.config.geoBaseUrl,
      "/1.0/direct",
      { q: queryText, limit: 6 },
    );

    if (!results || results.length === 0) {
      throw new WeatherProviderError(
        "NOT_FOUND",
        `No locations matched “${queryText}”. Try a town, district or landmark, or check the spelling.`,
      );
    }

    return results
      .filter((result) => typeof result.name === "string" && typeof result.lat === "number" && typeof result.lon === "number")
      .map((result) => {
        const name = result.name as string;
        const state = result.state ?? "";
        const country = result.country ?? "";
        const locals = result.local_names ?? {};
        const localName =
          locals.en ?? Object.values(locals)[0] ?? name;
        const locality = [localName, state, country].filter(Boolean).join(", ");
        return {
          name,
          lat: result.lat as number,
          lon: result.lon as number,
          country,
          state,
          localName,
          locality,
        };
      });
  }

  async airQuality(lat: number, lon: number): Promise<AirQuality | null> {
    const data = await this.#request<OWMAirPollution>(this.config.baseUrl, "/2.5/air_pollution", {
      lat,
      lon,
    });
    const first = data?.list?.[0];
    const aqi = first?.main?.aqi;
    if (!first || typeof aqi !== "number" || aqi < 1 || aqi > 5) {
      throw new AirQualityNotFound("Air quality data is not available for this location.");
    }
    return {
      aqi,
      pollutant: first.components && typeof first.components.pm2_5 === "number" && first.components.pm2_5 > 0
        ? "pm2.5"
        : "unknown",
      pm25: first.components?.pm2_5 ?? 0,
      pm10: first.components?.pm10 ?? 0,
    };
  }

  async #buildLegacy(city: OWMCityWeather): Promise<WeatherResponse> {
    const lat = city.coord?.lat;
    const lon = city.coord?.lon;
    if (typeof lat !== "number" || typeof lon !== "number") {
      throw new WeatherProviderError(
        "UPSTREAM_REQUEST_FAILED",
        "The weather service did not return coordinates for this location.",
      );
    }
    const offset = estimateOffsetSeconds(city);

    const [forecast, uv] = await Promise.all([
      this.#request<OWMForecast>(this.config.baseUrl, "/2.5/forecast", { lat, lon }),
      this.#request<OWMUV>(this.config.baseUrl, "/2.5/uvi", { lat, lon }).catch(() => null),
    ]);

    return {
      location: { lat, lon },
      current: buildCurrent(city, uv?.value ?? null, offset),
      hourly: buildHourly(forecast.list, offset),
      daily: buildDaily(forecast.list, offset),
      // The free endpoints carry no official alerts; advisories are computed
      // client-side from the forecast data and clearly labelled as such.
      alerts: [],
    };
  }

  async #tryOneCall(lat: number, lon: number): Promise<OWMOneCall | null> {
    try {
      return await this.#request<OWMOneCall>(this.config.baseUrl, "/3.0/onecall", {
        lat,
        lon,
        exclude: "minutely",
      });
    } catch (error) {
      if (error instanceof Error) return null;
      return null;
    }
  }

  async #fetchCityWeather(params: { q: string } | { lat: number; lon: number }): Promise<OWMCityWeather> {
    return this.#request<OWMCityWeather>(this.config.baseUrl, "/2.5/weather", params);
  }

  async #request<T>(
    baseUrl: string,
    path: string,
    params: Record<string, string | number>,
  ): Promise<T> {
    const search = new URLSearchParams({
      appid: this.config.apiKey,
      units: "metric",
    });
    for (const [key, value] of Object.entries(params)) {
      search.set(key, String(value));
    }

    let response: Response;
    try {
      response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}?${search.toString()}`, {
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new WeatherProviderError(
        "UPSTREAM_REQUEST_FAILED",
        "The weather service could not be reached.",
      );
    }

    if (!response.ok) {
      const code = statusToErrorCode(response.status);
      const message =
        code === "NOT_FOUND"
          ? "Location not found."
          : code === "UNAUTHORIZED"
            ? "The weather API key is invalid or expired."
            : code === "RATE_LIMITED"
              ? "The weather service is rate-limiting requests."
              : "The weather service returned an error.";
      throw new WeatherProviderError(code, message);
    }

    return (await response.json()) as T;
  }
}

// Re-exported so buildAlerts can be unit-tested in isolation.
export { buildAlerts };