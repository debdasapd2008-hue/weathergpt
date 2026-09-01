import { Router } from "express";
import { z } from "zod";
import { weatherQuerySchema } from "@weathergpt/shared";
import {
  AirQualityNotFound,
  WeatherProviderError,
  type WeatherProvider,
} from "../providers/weather/weather.provider";

export interface WeatherRouterDeps {
  provider: WeatherProvider | null;
}

const HTTP_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  UNAUTHORIZED: 503,
  RATE_LIMITED: 429,
  UPSTREAM_REQUEST_FAILED: 502,
};

function weatherErrorToHttp(error: WeatherProviderError) {
  const status = HTTP_STATUS[error.code] ?? 500;
  const code = error.code as string;
  return { status, code, message: error.message };
}

const geocodeQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
});

const airQualityQuerySchema = z.object({
  lat: z.coerce.number().finite().min(-90).max(90),
  lon: z.coerce.number().finite().min(-180).max(180),
});

export function createWeatherRouter(deps: WeatherRouterDeps): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    if (!deps.provider) {
      res.status(503).json({
        error: {
          code: "WEATHER_NOT_CONFIGURED",
          message:
            "Weather data is not configured. Set WEATHER_API_KEY (and optionally WEATHER_API_BASE_URL) in the server environment.",
        },
      });
      return;
    }

    const parsed = weatherQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((issue) => issue.message).join(" "),
        },
      });
      return;
    }

    try {
      const query = parsed.data;
      let data;
      if (query.city) {
        data = await deps.provider.getWeather({ city: query.city });
      } else if (query.lat !== undefined && query.lon !== undefined) {
        data = await deps.provider.getWeather({ lat: query.lat, lon: query.lon });
      } else {
        res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Provide either city or latitude/longitude." } });
        return;
      }
      res.json(data);
    } catch (error) {
      if (error instanceof WeatherProviderError) {
        const { status, code, message } = weatherErrorToHttp(error);
        res.status(status).json({ error: { code, message } });
        return;
      }
      next(error);
    }
  });

  // Coordinates-first location search. Multiple selectable matches are
  // returned so users can pick the exact town/district/neighbourhood.
  router.get("/geocode", async (req, res, next) => {
    if (!deps.provider) {
      res.status(503).json({
        error: {
          code: "WEATHER_NOT_CONFIGURED",
          message:
            "Weather data is not configured. Set WEATHER_API_KEY in the server environment.",
        },
      });
      return;
    }

    const parsed = geocodeQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Provide a q= search term." },
      });
      return;
    }

    try {
      const matches = await deps.provider.geocode(parsed.data.q);
      res.json(matches);
    } catch (error) {
      if (error instanceof WeatherProviderError) {
        const { status, code, message } = weatherErrorToHttp(error);
        res.status(status).json({ error: { code, message } });
        return;
      }
      next(error);
    }
  });

  // Optional air quality. Returns 503 AIR_QUALITY_UNAVAILABLE when the
  // provider has no data; the UI degrades gracefully.
  router.get("/air", async (req, res, next) => {
    if (!deps.provider) {
      res.status(503).json({
        error: { code: "WEATHER_NOT_CONFIGURED", message: "Weather data is not configured." },
      });
      return;
    }

    const parsed = airQualityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Provide lat= and lon=." },
      });
      return;
    }

    if (!deps.provider.airQuality) {
      res.status(503).json({
        error: { code: "AIR_QUALITY_UNAVAILABLE", message: "Air quality data is not available from the current provider." },
      });
      return;
    }

    try {
      const { lat, lon } = parsed.data;
      const air = await deps.provider.airQuality(lat, lon);
      res.json(air);
    } catch (error) {
      if (error instanceof AirQualityNotFound) {
        res.status(503).json({ error: { code: "AIR_QUALITY_UNAVAILABLE", message: error.message } });
        return;
      }
      if (error instanceof WeatherProviderError) {
        const { status, code, message } = weatherErrorToHttp(error);
        res.status(status).json({ error: { code, message } });
        return;
      }
      next(error);
    }
  });

  return router;
}