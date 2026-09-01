export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type AIProviderErrorCode = "UNAUTHORIZED" | "RATE_LIMITED" | "UPSTREAM_REQUEST_FAILED";

export class AIProviderError extends Error {
  readonly code: AIProviderErrorCode;

  constructor(code: AIProviderErrorCode, message: string) {
    super(message);
    this.name = "AIProviderError";
    this.code = code;
  }
}

/**
 * Abstraction over an LLM chat API. Called only from the server so API keys
 * are never exposed to the browser.
 */
export interface AIProvider {
  readonly name: string;
  readonly model: string;
  chat(messages: ChatMessage[]): Promise<string>;
}

/** Optional capability: understand an image via a vision-capable model. */
export interface AIImageProvider {
  readonly name: string;
  readonly model: string;
  analyzeImage(dataUrl: string, question: string): Promise<string>;
}

export function mapUpstreamStatus(status: number): AIProviderErrorCode {
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 429) return "RATE_LIMITED";
  return "UPSTREAM_REQUEST_FAILED";
}