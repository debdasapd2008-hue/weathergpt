import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { weatherResponseSchema } from "@weathergpt/shared";
import { createApp } from "../src/app";
import { testConfig } from "./helpers";

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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function stubUpstream() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const href = String(url);
      if (href.includes("3.0/onecall")) return jsonResponse({ message: "not subscribed" }, 401);
      if (href.includes("2.5/forecast")) return jsonResponse({ list: FORECAST_LIST });
      if (href.includes("2.5/uvi")) return jsonResponse({ value: 2.1 });
      return jsonResponse(CITY);
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/weather", () => {
  it("returns validated weather for a city query", async () => {
    stubUpstream();
    const app = createApp(testConfig());
    const res = await request(app).get("/api/weather?city=London").expect(200);

    expect(weatherResponseSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.current.city).toBe("London");
    expect(res.body.current.country).toBe("GB");
    expect(res.body.hourly.length).toBeGreaterThan(0);
  });

  it("supports coordinate queries", async () => {
    stubUpstream();
    const app = createApp(testConfig());
    const res = await request(app).get("/api/weather?lat=51.5&lon=-0.12").expect(200);
    expect(res.body.location).toEqual({ lat: 51.5, lon: -0.12 });
  });

  it("returns 400 when no location is provided", async () => {
    const app = createApp(testConfig());
    const res = await request(app).get("/api/weather").expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for out-of-range coordinates", async () => {
    const app = createApp(testConfig());
    const res = await request(app).get("/api/weather?lat=999&lon=0").expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 503 WEATHER_NOT_CONFIGURED without a key", async () => {
    const app = createApp(testConfig({ WEATHER_API_KEY: "" }));
    const res = await request(app).get("/api/weather?city=London").expect(503);
    expect(res.body.error.code).toBe("WEATHER_NOT_CONFIGURED");
  });

  it("maps an unknown city to 404", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "city not found" }, 404)));
    const app = createApp(testConfig());
    const res = await request(app).get("/api/weather?city=atlantis").expect(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("maps upstream rate-limiting to 429", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "slow down" }, 429)));
    const app = createApp(testConfig());
    const res = await request(app).get("/api/weather?city=London").expect(429);
    expect(res.body.error.code).toBe("RATE_LIMITED");
  });

  it("does not leak upstream internals on failures", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "opaque upstream detail" }, 500)));
    const app = createApp(testConfig());
    const res = await request(app).get("/api/weather?city=London").expect(502);
    expect(JSON.stringify(res.body)).not.toContain("opaque");
  });
});

describe("GET /api/health", () => {
  it("reports ok", async () => {
    const app = createApp(testConfig());
    const res = await request(app).get("/api/health").expect(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
