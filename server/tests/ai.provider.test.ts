import { afterEach, describe, expect, it, vi } from "vitest";
import { AnthropicProvider } from "../src/providers/ai/anthropic.provider";
import { OpenAICompatibleProvider } from "../src/providers/ai/openai-compatible.provider";
import { AIProviderError } from "../src/providers/ai/ai.provider";
import { createAIProvider } from "../src/providers/ai";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface FetchedInit {
  headers?: Record<string, string>;
  body?: string;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OpenAICompatibleProvider", () => {
  it("returns the assistant message content", async () => {
    const fetchMock = vi.fn(async (_url: string, _init: FetchedInit) =>
      jsonResponse({ choices: [{ message: { content: "Mostly sunny." } }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAICompatibleProvider({
      apiKey: "sk-test",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
    });
    const result = await provider.chat([
      { role: "system", content: "be brief" },
      { role: "user", content: "hello" },
    ]);

    expect(result).toBe("Mostly sunny.");

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init?.headers?.["Authorization"]).toBe("Bearer sk-test");
    expect(init?.body).toContain("gpt-4o-mini");
  });

  it("maps 401 to UNAUTHORIZED", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "bad key" }, 401)));
    const provider = new OpenAICompatibleProvider({
      apiKey: "sk-test",
      baseUrl: "https://api.openai.com/v1",
      model: "x",
    });
    await expect(provider.chat([{ role: "user", content: "hi" }])).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("maps 429 to RATE_LIMITED", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "slow down" }, 429)));
    const provider = new OpenAICompatibleProvider({
      apiKey: "sk-test",
      baseUrl: "https://api.openai.com/v1",
      model: "x",
    });
    await expect(provider.chat([{ role: "user", content: "hi" }])).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
  });

  it("throws an upstream error for an empty completion", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ choices: [] })));
    const provider = new OpenAICompatibleProvider({
      apiKey: "sk-test",
      baseUrl: "https://api.openai.com/v1",
      model: "x",
    });
    await expect(provider.chat([{ role: "user", content: "hi" }])).rejects.toBeInstanceOf(
      AIProviderError,
    );
  });

  it("throws an upstream error on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("down");
    }));
    const provider = new OpenAICompatibleProvider({
      apiKey: "sk-test",
      baseUrl: "https://api.openai.com/v1",
      model: "x",
    });
    await expect(provider.chat([{ role: "user", content: "hi" }])).rejects.toMatchObject({
      code: "UPSTREAM_REQUEST_FAILED",
    });
  });
});

describe("AnthropicProvider", () => {
  it("sends a system prompt and returns the text content", async () => {
    const fetchMock = vi.fn(async (_url: string, _init: FetchedInit) =>
      jsonResponse({ content: [{ type: "text", text: "Chance of rain: 20%." }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new AnthropicProvider({
      apiKey: "ant-test",
      baseUrl: "https://api.anthropic.com/v1",
      model: "claude-3-5-haiku-latest",
    });
    const result = await provider.chat([
      { role: "system", content: "be brief" },
      { role: "user", content: "will it rain?" },
    ]);

    expect(result).toBe("Chance of rain: 20%.");

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(init?.headers?.["x-api-key"]).toBe("ant-test");
    expect(init?.headers?.["anthropic-version"]).toBe("2023-06-01");
    expect(JSON.parse(init?.body ?? "{}")).toEqual({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1024,
      system: "be brief",
      messages: [{ role: "user", content: "will it rain?" }],
    });
  });
});

describe("createAIProvider", () => {
  const base = {
    AI_PROVIDER: "openai-compatible",
    AI_API_KEY: "secret",
    AI_BASE_URL: "",
    AI_MODEL: "",
    AI_IMAGE_MODEL: "",
  };

  it("returns an openai-compatible provider with defaults", () => {
    const provider = createAIProvider(base);
    expect(provider?.name).toBe("openai-compatible");
    expect(provider?.model).toBe("gpt-4o-mini");
  });

  it("returns an anthropic provider when configured", () => {
    const provider = createAIProvider({ ...base, AI_PROVIDER: "anthropic", AI_BASE_URL: "https://api.anthropic.com/v1" });
    expect(provider?.name).toBe("anthropic");
    expect(provider?.model).toBe("claude-3-5-haiku-latest");
  });

  it("returns null when no key is set", () => {
    expect(createAIProvider({ ...base, AI_API_KEY: "" })).toBeNull();
  });

  it("returns null when no provider is chosen", () => {
    expect(createAIProvider({ ...base, AI_PROVIDER: "", AI_API_KEY: "x" })).toBeNull();
  });

  it("returns null for an unknown provider without crashing", () => {
    expect(createAIProvider({ ...base, AI_PROVIDER: "wat", AI_API_KEY: "x" })).toBeNull();
  });
});