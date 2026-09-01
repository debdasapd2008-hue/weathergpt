import path from "node:path";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

// npm workspace scripts run with cwd = the workspace folder, so look for
// .env in both the workspace root and the repository root.
loadEnv({
  path: [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
  ],
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),

  WEATHER_API_KEY: z.string().default(""),
  WEATHER_API_BASE_URL: z
    .string()
    .url()
    .default("https://api.openweathermap.org/data"),
  WEATHER_GEO_BASE_URL: z.string().url().default("https://api.openweathermap.org/geo"),

  AI_PROVIDER: z
    .enum(["", "openai-compatible", "anthropic"])
    .default(""),
  AI_API_KEY: z.string().default(""),
  AI_MODEL: z.string().default(""),
  AI_BASE_URL: z.string().default(""),
  AI_IMAGE_MODEL: z.string().default(""),

  CLIENT_ORIGIN: z.string().default(""),
});

export type ServerConfig = z.infer<typeof envSchema>;

function makeCorsOrigins(config: ServerConfig): (string | RegExp)[] {
  const fromEnv = config.CLIENT_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (fromEnv.length > 0) {
    return fromEnv;
  }

  // Same-origin in production (the server serves client/dist). In development
  // allow any localhost origin since the Vite dev server port can vary.
  if (config.NODE_ENV === "production") {
    return [];
  }
  return [/^http:\/\/localhost:\d+$/];
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
}

export function corsOrigins(config: ServerConfig): (string | RegExp)[] {
  return makeCorsOrigins(config);
}

/**
 * Public base URL of THIS server (used for absolute links).
 * Prefer APP_URL when set, fall back to localhost:PORT.
 */
export function serverBaseUrl(config: ServerConfig): string {
  return `http://localhost:${config.PORT}`;
}

/** Base URL of the SPA. */
export function clientBaseUrl(config: ServerConfig): string {
  if (config.CLIENT_ORIGIN) return config.CLIENT_ORIGIN;
  return `http://localhost:${config.PORT}`;
}