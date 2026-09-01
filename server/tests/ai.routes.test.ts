import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AIProviderError } from "../src/providers/ai";
import { createApp } from "../src/app";
import { fakeAIProvider, testConfig } from "./helpers";

const VALID_BODY = {
  question: "Will it rain today?",
  location: { lat: 51.5, lon: -0.12 },
  current: {
    city: "London",
    country: "GB",
    condition: "Rain",
    description: "light rain",
    temperature: 18,
    feelsLike: 17,
    humidity: 80,
    windSpeed: 5,
    windDirection: 200,
    pressure: 1008,
    visibility: 8000,
    precipitation: 1.2,
    uvIndex: 1,
    sunrise: "06:00",
    sunset: "20:00",
    icon: "10d",
  },
  hourly: [
    { time: "13:00", icon: "10d", temperature: 18, precipitationProbability: 55 },
  ],
  daily: [
    { day: "Thu 1", icon: "10d", high: 20, low: 12, precipitationProbability: 55 },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AI configuration status", () => {
  it("reports configured=true when a provider is available", async () => {
    const app = createApp(
      testConfig(),
      { aiProvider: fakeAIProvider("ok") },
    );
    const res = await request(app).get("/api/ai/status").expect(200);
    expect(res.body).toEqual({
      configured: true,
      provider: "fake-ai",
      model: "fake-model",
      imageSupported: false,
    });
  });

  it("reports configured=false when credentials are missing", async () => {
    const app = createApp(testConfig({ AI_API_KEY: "" }));
    const res = await request(app).get("/api/ai/status").expect(200);
    expect(res.body.configured).toBe(false);
  });
});

describe("POST /api/ai/weather", () => {
  it("returns an AI-generated answer", async () => {
    const app = createApp(
      testConfig(),
      { aiProvider: fakeAIProvider("Yes - expect rain across most of the day.") },
    );
    const res = await request(app)
      .post("/api/ai/weather")
      .send(VALID_BODY)
      .expect(200);

    expect(res.body.answer).toContain("rain");
    expect(res.body.provider).toBe("fake-ai");
  });

  it("accepts a request with just a question (weather optional)", async () => {
    const app = createApp(
      testConfig(),
      { aiProvider: fakeAIProvider("fine") },
    );
    await request(app).post("/api/ai/weather").send({ question: "How is it?" }).expect(200);
  });

  it("returns 400 for a missing question", async () => {
    const app = createApp(
      testConfig(),
      { aiProvider: fakeAIProvider("ok") },
    );
    const res = await request(app).post("/api/ai/weather").send({}).expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for an empty question", async () => {
    const app = createApp(
      testConfig(),
      { aiProvider: fakeAIProvider("ok") },
    );
    const res = await request(app)
      .post("/api/ai/weather")
      .send({ question: "   " })
      .expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 503 AI_NOT_CONFIGURED when AI is not set up", async () => {
    const app = createApp(testConfig({ AI_API_KEY: "", AI_PROVIDER: "" }));
    const res = await request(app).post("/api/ai/weather").send(VALID_BODY).expect(503);
    expect(res.body.error.code).toBe("AI_NOT_CONFIGURED");
    expect(res.body.error.message).toContain("AI_PROVIDER");
  });

  it("returns 502 on upstream AI failures", async () => {
    const app = createApp(
      testConfig(),
      { aiProvider: fakeAIProvider("", new AIProviderError("UPSTREAM_REQUEST_FAILED", "slow upstream")) },
    );
    const res = await request(app).post("/api/ai/weather").send(VALID_BODY).expect(502);
    expect(res.body.error.code).toBe("AI_UPSTREAM");
  });

  it("does not expose raw AI provider responses on errors", async () => {
    const app = createApp(
      testConfig(),
      { aiProvider: fakeAIProvider("", new AIProviderError("UNAUTHORIZED", "bad key for user-secret-abc")) },
    );
    const res = await request(app).post("/api/ai/weather").send(VALID_BODY).expect(503);
    expect(JSON.stringify(res.body)).not.toContain("user-secret-abc");
  });
});