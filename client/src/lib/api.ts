import { z } from "zod";
import {
  aiGeneralResponseSchema,
  aiImageResponseSchema,
  aiStatusSchema,
  aiWeatherResponseSchema,
  airQualitySchema,
  geocodeMatchSchema,
  weatherResponseSchema,
  type AiGeneralRequest,
  type AiImageRequest,
  type AiImageResponse,
  type AiStatus,
  type AiWeatherRequest,
  type AirQuality,
  type Coordinates,
  type GeocodeMatch,
  type WeatherResponse,
} from "@weathergpt/shared";

// In development Vite proxies /api to the server; in production the server
// serves the client from the same origin. VITE_API_BASE_URL overrides both.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const errorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

async function request<T>(path: string, init: RequestInit, schema: z.ZodType<T>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(30_000),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server. Is it running?");
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const parsed = errorSchema.safeParse(body);
    if (parsed.success) {
      throw new ApiError(response.status, parsed.data.error.code, parsed.data.error.message);
    }
    throw new ApiError(response.status, "UNKNOWN_ERROR", `Request failed (HTTP ${response.status}).`);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(response.status, "INVALID_RESPONSE", "The server returned an unexpected response.");
  }
  return parsed.data;
}

export const api = {
  getWeatherByCity(city: string): Promise<WeatherResponse> {
    return request(`/api/weather?city=${encodeURIComponent(city)}`, {}, weatherResponseSchema);
  },
  getWeatherByCoords(coords: Coordinates): Promise<WeatherResponse> {
    return request(`/api/weather?lat=${coords.lat}&lon=${coords.lon}`, {}, weatherResponseSchema);
  },
  geocode(query: string): Promise<GeocodeMatch[]> {
    return request(
      `/api/weather/geocode?q=${encodeURIComponent(query)}`,
      {},
      z.array(geocodeMatchSchema),
    );
  },
  getAirQuality(coords: Coordinates): Promise<AirQuality> {
    return request(`/api/weather/air?lat=${coords.lat}&lon=${coords.lon}`, {}, airQualitySchema);
  },
  getAIStatus(): Promise<AiStatus> {
    return request("/api/ai/status", {}, aiStatusSchema);
  },
  askAI(body: AiWeatherRequest): Promise<{ answer: string; provider: string; model: string }> {
    return request(
      "/api/ai/weather",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      aiWeatherResponseSchema,
    );
  },
  askGeneral(body: AiGeneralRequest): Promise<{ answer: string; provider: string; model: string }> {
    return request(
      "/api/ai/general",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      aiGeneralResponseSchema,
    );
  },
  askImage(body: AiImageRequest): Promise<AiImageResponse> {
    return request(
      "/api/ai/image",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      aiImageResponseSchema,
    );
  },
};