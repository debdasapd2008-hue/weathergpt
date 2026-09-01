import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { fakeWeatherProvider, testConfig } from "./helpers";

describe("error handling", () => {
  it("answers unknown routes with a JSON 404", async () => {
    const app = createApp(testConfig());
    const res = await request(app).get("/api/nope").expect(404);
    expect(res.body).toEqual({ error: { code: "NOT_FOUND", message: expect.any(String) } });
  });

  it("answers malformed JSON with a 400 validation error", async () => {
    const app = createApp(testConfig());
    const res = await request(app)
      .post("/api/ai/weather")
      .set("Content-Type", "application/json")
      .send('{"question": ')
      .expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("does not expose internals when a handler throws", async () => {
    const app = createApp(
      testConfig(),
      { weatherProvider: fakeWeatherProvider(null, new Error("secret-db-password")) },
    );
    const res = await request(app).get("/api/weather?city=London").expect(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(res.body)).not.toContain("secret-db-password");
  });
});