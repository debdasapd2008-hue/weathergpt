import type { AiStatus } from "@weathergpt/shared";
import { AnthropicProvider } from "./anthropic.provider";
import { OpenAICompatibleProvider } from "./openai-compatible.provider";
import { OpenAICompatibleImageProvider } from "./openai-image.provider";
import type { AIImageProvider, AIProvider } from "./ai.provider";

export interface AIProviderOptions {
  AI_PROVIDER: string;
  AI_API_KEY: string;
  AI_BASE_URL: string;
  AI_MODEL: string;
  AI_IMAGE_MODEL: string;
}

const DEFAULTS = {
  "openai-compatible": {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-3-5-haiku-latest",
  },
} as const;

/**
 * Returns a configured AI provider, or null when AI is disabled or missing a
 * key. Never throws for missing credentials — the app runs (and the UI shows a
 * configuration hint) instead.
 */
export function createAIProvider(options: AIProviderOptions): AIProvider | null {
  const provider = options.AI_PROVIDER;
  const apiKey = options.AI_API_KEY.trim();

  if (!provider || !apiKey) return null;

  if (provider === "openai-compatible") {
    return new OpenAICompatibleProvider({
      apiKey,
      baseUrl: options.AI_BASE_URL || DEFAULTS["openai-compatible"].baseUrl,
      model: options.AI_MODEL || DEFAULTS["openai-compatible"].model,
    });
  }

  if (provider === "anthropic") {
    return new AnthropicProvider({
      apiKey,
      baseUrl: options.AI_BASE_URL || DEFAULTS.anthropic.baseUrl,
      model: options.AI_MODEL || DEFAULTS.anthropic.model,
    });
  }

  return null;
}

/**
 * Visual chat capability. Only enabled when AI_IMAGE_MODEL is configured to an
 * OpenAl-compatible vision model; otherwise returns null and the UI shows a
 * graceful "not supported" message instead of an error.
 */
export function createAIImageProvider(options: AIProviderOptions): AIImageProvider | null {
  const apiKey = options.AI_API_KEY.trim();
  const model = options.AI_IMAGE_MODEL.trim();
  if (!options.AI_PROVIDER || !apiKey || !model) return null;
  if (options.AI_PROVIDER !== "openai-compatible") return null;

  return new OpenAICompatibleImageProvider({
    apiKey,
    baseUrl: options.AI_BASE_URL || DEFAULTS["openai-compatible"].baseUrl,
    model,
  });
}

export function describeAI(options: AIProviderOptions): AiStatus {
  const provider = createAIProvider(options);
  const imageProvider = createAIImageProvider(options);
  return {
    configured: provider !== null,
    provider: provider?.name ?? "",
    model: provider?.model ?? "",
    imageSupported: imageProvider !== null,
  };
}

export { AIProviderError } from "./ai.provider";
export type { AIImageProvider, AIProvider, ChatMessage } from "./ai.provider";