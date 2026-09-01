import type { ServerConfig } from "../src/config";
import type { AIProvider } from "../src/providers/ai";
import type { WeatherProvider } from "../src/providers/weather/weather.provider";

export function testConfig(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    NODE_ENV: "test",
    PORT: 3001,
    WEATHER_API_KEY: "test-key",
    WEATHER_API_BASE_URL: "https://api.openweathermap.org/data",
    WEATHER_GEO_BASE_URL: "https://api.openweathermap.org/geo",
    AI_PROVIDER: "openai-compatible",
    AI_API_KEY: "test-ai-key",
    AI_MODEL: "",
    AI_BASE_URL: "",
    AI_IMAGE_MODEL: "",
    CLIENT_ORIGIN: "",
    ...overrides,
  };
}

export function fakeWeatherProvider(result: unknown, error?: Error): WeatherProvider {
  return {
    name: "fake-weather",
    async getWeather() {
      if (error) throw error;
      return result as never;
    },
    async geocode() {
      return [];
    },
  };
}

export function fakeAIProvider(result: string, error?: Error): AIProvider {
  return {
    name: "fake-ai",
    model: "fake-model",
    async chat() {
      if (error) throw error;
      return result;
    },
  };
}