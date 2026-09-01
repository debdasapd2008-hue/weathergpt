import express, { type Express } from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { corsOrigins, type ServerConfig } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { OpenWeatherMapProvider } from "./providers/weather/openweathermap";
import type { WeatherProvider } from "./providers/weather/weather.provider";
import { createAIProvider, createAIImageProvider, type AIProvider } from "./providers/ai";
import type { AIImageProvider } from "./providers/ai";
import { createWeatherRouter } from "./routes/weather.routes";
import { createAIRouter } from "./routes/ai.routes";

export interface AppDeps {
  weatherProvider?: WeatherProvider | null;
  aiProvider?: AIProvider | null;
  aiImageProvider?: AIImageProvider | null;
}

function corsOptions(origins: (string | RegExp)[]) {
  return {
    origin: (_origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!_origin) {
        callback(null, true);
        return;
      }
      if (origins.length === 0) {
        callback(null, false);
        return;
      }
      const allowed = origins.some((o) =>
        typeof o === "string" ? o === _origin : o.test(_origin)
      );
      callback(null, allowed);
    },
  };
}

export function createApp(config: ServerConfig, deps: AppDeps = {}): Express {
  const app = express();
  app.disable("x-powered-by");

  const weatherProvider: WeatherProvider | null =
    deps.weatherProvider !== undefined
      ? deps.weatherProvider
      : config.WEATHER_API_KEY
        ? new OpenWeatherMapProvider({
            apiKey: config.WEATHER_API_KEY,
            baseUrl: config.WEATHER_API_BASE_URL,
            geoBaseUrl: config.WEATHER_GEO_BASE_URL,
          })
        : null;

  const aiProvider: AIProvider | null =
    deps.aiProvider !== undefined ? deps.aiProvider : createAIProvider(config);

  const aiImageProvider: AIImageProvider | null =
    deps.aiImageProvider !== undefined ? deps.aiImageProvider : createAIImageProvider(config);

  app.use(cors(corsOptions(corsOrigins(config))));
  app.use(express.json({ limit: "256kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/weather", createWeatherRouter({ provider: weatherProvider }));
  app.use("/api/ai", createAIRouter({ provider: aiProvider, imageProvider: aiImageProvider }));

  // Serve the built client from the same process whenever it exists (after
  // `npm run build`), regardless of NODE_ENV, so `npm start` works on any host.
  const clientDist = fileURLToPath(new URL("../../client/dist", import.meta.url));
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // SPA fallback for client-side routes (skip /api).
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}