import {
  AIProviderError,
  mapUpstreamStatus,
  type AIProvider,
  type ChatMessage,
} from "./ai.provider";

export interface OpenAICompatibleConfig {
  apiKey: string;
  /** Base URL of a Chat Completions-compatible API (e.g. https://api.openai.com/v1). */
  baseUrl: string;
  model: string;
}

/**
 * OpenAI-compatible chat provider. Works with OpenAI, OpenRouter, Groq,
 * Together, Ollama, LM Studio, and any other Chat Completions clone.
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly name = "openai-compatible";

  constructor(private readonly config: OpenAICompatibleConfig) {}

  get model(): string {
    return this.config.model;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: 0.7,
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
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new AIProviderError("UPSTREAM_REQUEST_FAILED", "The AI service returned an empty response.");
    }
    return content.trim();
  }
}