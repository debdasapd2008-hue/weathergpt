import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenWeatherMapProvider } from "../src/providers/weather/openweathermap";
import { WeatherProviderError } from "../src/providers/weather/weather.provider";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const CITY = {
  coord: { lat: 51.5, lon: -0.12 },
  weather: [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }],
  main: { temp: 21, feels_like: 20, pressure: 1013, humidity: 61 },
  visibility: 10000,
  wind: { speed: 4.2, deg: 315 },
  dt: 1700000000,
  sys: { country: "GB", sunrise: 1700001268, sunset: 1700042235 },
  name: "London",
};

const FORECAST_LIST = Array.from({ length: 40 }, (_, i) => ({
  dt: 1700000000 + i * 10800,
  main: { temp: 18 + (i % 8) },
  weather: [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }],
  pop: 0.1,
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

function provider(): OpenWeatherMapProvider {
return new OpenWeatherMapProvider({
    apiKey: "test-key",
    baseUrl: "https://api.openweathermap.org/data",
    geoBaseUrl: "https://api.openweathermap.org/geo",
  });
}

describe("OpenWeatherMapProvider", () => {
  it("uses the One Call API when subscribed (7-day forecast, real UV)", async () => {
    const oneCall = {
      timezone_offset: 0,
      current: { dt: 1700000000, temp: 22, feels_like: 21, pressure: 1010, humidity: 50, uvi: 6, visibility: 20000, wind_speed: 5, wind_deg: 200, weather: [{ id: 800, main: "Clear", description: "", icon: "01d" }] },
      hourly: Array.from({ length: 24 }, (_, i) => ({ dt: 1700000000 + i * 3600, temp: 20, weather: [{ id: 800, main: "Clear", description: "", icon: "01d" }], pop: 0 })),
      daily: Array.from({ length: 7 }, (_, i) => ({ dt: 1700000000 + (i + 1) * 86400, temp: { day: 22 + i, min: 14, max: 26 }, weather: [{ id: 800, main: "Clear", description: "", icon: "01d" }], pop: 0.2 })),
    };

    const fetchMock = vi.fn(async (url: string) => {
      const href = String(url);
      if (href.includes("3.0/onecall")) return jsonResponse(oneCall);
      return jsonResponse(CITY);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await provider().getWeather({ city: "London" });

    expect(result.daily).toHaveLength(7);
    expect(result.hourly).toHaveLength(24);
    expect(result.current.uvIndex).toBe(6);
    // One Call succeeds, so no legacy endpoints are hit.
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("2.5/forecast"));
  });

  it("falls back to free endpoints when One Call is unavailable", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const href = String(url);
      if (href.includes("3.0/onecall")) return jsonResponse({ message: "invalid api key" }, 401);
      if (href.includes("2.5/forecast")) return jsonResponse({ list: FORECAST_LIST });
      if (href.includes("2.5/uvi")) return jsonResponse({ value: 3.2 });
      return jsonResponse(CITY);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await provider().getWeather({ lat: 51.5, lon: -0.12 });

expect(result.current.city).toBe("London");
    expect(result.current.uvIndex).toBe(3.2);
    expect(result.hourly).toHaveLength(8);
    expect(result.daily.length).toBeGreaterThan(0);
    expect(result.daily.length).toBeLessThanOrEqual(7);
  });

  it("handles UV endpoint failure gracefully", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const href = String(url);
      if (href.includes("3.0/onecall")) return jsonResponse({ message: "nope" }, 401);
      if (href.includes("2.5/forecast")) return jsonResponse({ list: FORECAST_LIST });
      if (href.includes("2.5/uvi")) return jsonResponse({ message: "boom" }, 500);
      return jsonResponse(CITY);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await provider().getWeather({ city: "london" });
    expect(result.current.uvIndex).toBe(0);
  });

  it("throws NOT_FOUND for an unknown city", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ message: "city not found" }, 404)),
    );
    await expect(provider().getWeather({ city: "atlantis-xyz" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("throws UNAUTHORIZED for an invalid key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ message: "Invalid API key" }, 401)),
    );
    await expect(provider().getWeather({ city: "London" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("throws RATE_LIMITED on 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ message: "rate limited" }, 429)),
    );
    await expect(provider().getWeather({ city: "London" })).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
  });

  it("throws UPSTREAM_REQUEST_FAILED when the network is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("fetch failed");
    }));
    await expect(provider().getWeather({ city: "London" })).rejects.toBeInstanceOf(
      WeatherProviderError,
    );
  });
});
