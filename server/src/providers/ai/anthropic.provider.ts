import {
  AIProviderError,
  mapUpstreamStatus,
  type AIProvider,
  type ChatMessage,
} from "./ai.provider";

export interface AnthropicConfig {
  apiKey: string;
  /** Base URL of the Anthropic Messages API (e.g. https://api.anthropic.com/v1). */
  baseUrl: string;
  model: string;
}

/**
 * Anthropic Claude provider using the Messages API.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  constructor(private readonly config: AnthropicConfig) {}

  get model(): string {
    return this.config.model;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const system = messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n\n");
    const turns = messages
      .filter((message) => message.role !== "system")
      .map(({ role, content }) => ({ role, content }));

    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 1024,
          system: system || undefined,
          messages: turns,
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new AIProviderError("UPSTREAM_REQUEST_FAILED", "The AI service could not be reached.");
    }

    if (!response.ok) {
      const code = mapUpstreamStatus(response.status);
      throw new AIProviderError(code, `The AI service returned HTTP ${response.status}.`);
    }

    const data = (await response.json()) as {
      content?: Array<{ text?: string }>;
    };
    const text = data.content?.[0]?.text;
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new AIProviderError("UPSTREAM_REQUEST_FAILED", "The AI service returned an empty response.");
    }
    return text.trim();
  }
}