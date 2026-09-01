import { describe, expect, it } from "vitest";
import {
  aiWeatherRequestSchema,
  weatherQuerySchema,
  weatherResponseSchema,
} from "@weathergpt/shared";

describe("weatherQuerySchema", () => {
  it("accepts a city", () => {
    expect(weatherQuerySchema.safeParse({ city: "London" }).success).toBe(true);
  });

  it("accepts coordinates", () => {
    expect(weatherQuerySchema.safeParse({ lat: "51.5", lon: "-0.12" }).success).toBe(true);
  });

  it("rejects an empty query", () => {
    expect(weatherQuerySchema.safeParse({}).success).toBe(false);
  });

  it("rejects a lone latitude", () => {
    expect(weatherQuerySchema.safeParse({ lat: "51.5" }).success).toBe(false);
  });

  it("rejects a city with only whitespace", () => {
    expect(weatherQuerySchema.safeParse({ city: "   " }).success).toBe(false);
  });

  it("rejects out-of-range coordinates", () => {
    expect(weatherQuerySchema.safeParse({ lat: "200", lon: "0" }).success).toBe(false);
  });

  it("rejects non-numeric coordinates", () => {
    expect(weatherQuerySchema.safeParse({ lat: "abc", lon: "0" }).success).toBe(false);
  });
});

describe("aiWeatherRequestSchema", () => {
  const valid = {
    question: "Should I carry an umbrella?",
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
  };

  it("accepts a valid request", () => {
    expect(aiWeatherRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a bare question (weather optional)", () => {
    expect(aiWeatherRequestSchema.safeParse({ question: "How is it?" }).success).toBe(true);
  });

  it("rejects a missing question", () => {
    expect(aiWeatherRequestSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an over-long question", () => {
    expect(aiWeatherRequestSchema.safeParse({ question: "x".repeat(2001) }).success).toBe(false);
  });

  it("rejects malformed weather data", () => {
    expect(
      aiWeatherRequestSchema.safeParse({ question: "hi", current: { city: 42 } }).success,
    ).toBe(false);
  });
});

describe("weatherResponseSchema", () => {
  const valid = {
    location: { lat: 51.5, lon: -0.12 },
    current: {
      city: "London",
      country: "GB",
      condition: "Clear",
      description: "clear sky",
      temperature: 21,
      feelsLike: 20,
      humidity: 55,
      windSpeed: 3.5,
      windDirection: 270,
      pressure: 1013,
      visibility: 10000,
      precipitation: 0,
      uvIndex: 2,
      sunrise: "05:30",
      sunset: "20:10",
      icon: "01d",
    },
    hourly: [
      { time: "14:00", icon: "01d", temperature: 22, precipitationProbability: 10 },
    ],
    daily: [
      { day: "Thu 1", icon: "01d", high: 24, low: 15, precipitationProbability: 10 },
    ],
    alerts: [],
  };

  it("accepts a valid weather payload", () => {
    expect(weatherResponseSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects wrong-typed fields", () => {
    expect(weatherResponseSchema.safeParse({ ...valid, current: { ...valid.current, temperature: "hot" } }).success).toBe(false);
  });

  it("rejects NaN temperatures", () => {
    expect(
      weatherResponseSchema.safeParse({ ...valid, current: { ...valid.current, temperature: Number.NaN } }).success,
    ).toBe(false);
  });

  it("rejects out-of-range humidity", () => {
    expect(
      weatherResponseSchema.safeParse({ ...valid, current: { ...valid.current, humidity: 150 } }).success,
    ).toBe(false);
  });
});