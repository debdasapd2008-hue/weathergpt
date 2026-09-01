import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { AIProviderError } from "../src/providers/ai";
import {
  AirQualityNotFound,
  WeatherProviderError,
  type WeatherProvider,
} from "../src/providers/weather/weather.provider";
import type { AIImageProvider } from "../src/providers/ai";
import type { GeocodeMatch } from "@weathergpt/shared";
import { fakeAIProvider, testConfig } from "./helpers";

afterEach(() => {
  vi.unstubAllGlobals();
});

function fakeImageProvider(answer = "It is a tomato plant.", error?: Error): AIImageProvider {
  return {
    name: "fake-image-ai",
    model: "fake-vision",
    async analyzeImage() {
      if (error) throw error;
      return answer;
    },
  };
}

describe("GET /api/weather/geocode", () => {
  it("returns coordinate-backed matches", async () => {
    const matches: GeocodeMatch[] = [
      {
        name: "Nainital",
        lat: 29.38,
        lon: 79.45,
        country: "IN",
        state: "Uttarakhand",
        localName: "Nainital",
        locality: "Nainital",
      },
    ];

    const provider: WeatherProvider = {
      name: "fake",
      async getWeather() {
        return {} as never;
      },
      async geocode() {
        return matches;
      },
    };
    const app = createApp(testConfig({ AI_API_KEY: "" }), { weatherProvider: provider });
    const res = await request(app).get("/api/weather/geocode?q=Nainital").expect(200);
    expect(res.body).toEqual(matches);
  });

  it("reports 503 when the weather provider is missing", async () => {
    const app = createApp(testConfig({ AI_API_KEY: "", WEATHER_API_KEY: "" }));
    const res = await request(app).get("/api/weather/geocode?q=Nainital").expect(503);
    expect(res.body.error.code).toBe("WEATHER_NOT_CONFIGURED");
  });

  it("reports 400 without a q term", async () => {
    const provider: WeatherProvider = {
      name: "fake",
      async getWeather() {
        return {} as never;
      },
      async geocode() {
        return [];
      },
    };
    const app = createApp(testConfig({ AI_API_KEY: "" }), { weatherProvider: provider });
    const res = await request(app).get("/api/weather/geocode").expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("translates provider NOT_FOUND to a 404", async () => {
    const provider: WeatherProvider = {
      name: "fake",
      async getWeather() {
        return {} as never;
      },
      async geocode() {
        throw new WeatherProviderError("NOT_FOUND", "nothing");
      },
    };
    const app = createApp(testConfig({ AI_API_KEY: "" }), { weatherProvider: provider });
    const res = await request(app).get("/api/weather/geocode?q=zzzz").expect(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("GET /api/weather/air", () => {
  it("returns air quality data", async () => {
    const provider: WeatherProvider = {
      name: "fake",
      async getWeather() {
        return {} as never;
      },
      async geocode() {
        return [];
      },
      async airQuality() {
        return { aqi: 2, pollutant: "pm2.5", pm25: 12, pm10: 25 };
      },
    };
    const app = createApp(testConfig({ AI_API_KEY: "" }), { weatherProvider: provider });
    const res = await request(app)
      .get("/api/weather/air?lat=29.38&lon=79.45")
      .expect(200);
    expect(res.body.aqi).toBe(2);
  });

  it("reports 503 when air quality is unavailable", async () => {
    const provider: WeatherProvider = {
      name: "fake",
      async getWeather() {
        return {} as never;
      },
      async geocode() {
        return [];
      },
      async airQuality() {
        throw new AirQualityNotFound("not available");
      },
    };
    const app = createApp(testConfig({ AI_API_KEY: "" }), { weatherProvider: provider });
    const res = await request(app)
      .get("/api/weather/air?lat=29.38&lon=79.45")
      .expect(503);
    expect(res.body.error.code).toBe("AIR_QUALITY_UNAVAILABLE");
  });
});

describe("POST /api/ai/general", () => {
  it("answers an open-ended question", async () => {
    const app = createApp(
      testConfig(),
      { aiProvider: fakeAIProvider("Plant tomatoes after the last frost.") },
    );
    const res = await request(app)
      .post("/api/ai/general")
      .send({ question: "When should I plant tomatoes in Uttarakhand?" })
      .expect(200);
    expect(res.body.answer).toContain("tomatoes");
  });

  it("carries chat history and a target language", async () => {
    const app = createApp(
      testConfig(),
      { aiProvider: fakeAIProvider("पौधे लगाइए।") },
    );
    const res = await request(app)
      .post("/api/ai/general")
      .send({
        question: "एक सुझाव दें",
        history: [{ role: "user", content: "मैं किसान हूँ" }],
        language: "Hindi",
      })
      .expect(200);
    expect(res.body.answer).toContain("पौधे");
  });

  it("returns 503 when AI is not configured", async () => {
    const app = createApp(testConfig({ AI_API_KEY: "", AI_PROVIDER: "" }));
    const res = await request(app)
      .post("/api/ai/general")
      .send({ question: "hello" })
      .expect(503);
    expect(res.body.error.code).toBe("AI_NOT_CONFIGURED");
  });

  it("returns 400 for an empty question", async () => {
    const app = createApp(
      testConfig(),
      { aiProvider: fakeAIProvider("ok") },
    );
    const res = await request(app)
      .post("/api/ai/general")
      .send({ question: "   " })
      .expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/ai/image", () => {
  const IMAGE_BODY = {
    dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
    mime: "image/jpeg",
    question: "What is in this image?",
  };

  it("analyzes an image when a vision provider is configured", async () => {
    const app = createApp(
      testConfig(),
      { aiProvider: fakeAIProvider("ok"), aiImageProvider: fakeImageProvider("A cucumber field.") },
    );
    const res = await request(app)
      .post("/api/ai/image")
      .send(IMAGE_BODY)
      .expect(200);
    expect(res.body).toMatchObject({ supported: true, answer: "A cucumber field." });
  });

  it("reports supported=false gracefully when no vision model is configured", async () => {
    const app = createApp(
      testConfig(),
      { aiProvider: fakeAIProvider("ok") },
    );
    const res = await request(app)
      .post("/api/ai/image")
      .send(IMAGE_BODY)
      .expect(200);
    expect(res.body.supported).toBe(false);
    expect(res.body.reason).toBe("unsupported");
    expect(res.body.answer).toContain("AI_IMAGE_MODEL");
  });

  it("returns 400 for a body without an image", async () => {
    const app = createApp(
      testConfig(),
      { aiProvider: fakeAIProvider("ok"), aiImageProvider: fakeImageProvider("x") },
    );
    const res = await request(app).post("/api/ai/image").send({ question: "hi" }).expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 503 without a configured text AI provider", async () => {
    const app = createApp(testConfig({ AI_API_KEY: "", AI_PROVIDER: "" }));
    const res = await request(app).post("/api/ai/image").send(IMAGE_BODY).expect(503);
    expect(res.body.error.code).toBe("AI_NOT_CONFIGURED");
  });

  it("does not leak upstream error text", async () => {
    const app = createApp(
      testConfig(),
      {
        aiProvider: fakeAIProvider("ok"),
        aiImageProvider: fakeImageProvider(
          "",
          new AIProviderError("UPSTREAM_REQUEST_FAILED", "secret-visual-detail"),
        ),
      },
    );
    const res = await request(app).post("/api/ai/image").send(IMAGE_BODY).expect(502);
    expect(JSON.stringify(res.body)).not.toContain("secret-visual-detail");
  });
});