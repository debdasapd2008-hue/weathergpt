import { AIProviderError, type AIImageProvider } from "./ai.provider";

export interface OpenAICompatibleImageConfig {
  apiKey: string;
  /** Base URL of a Chat Completions-compatible API (e.g. https://api.groq.com/openai/v1). */
  baseUrl: string;
  model: string; // must be a vision-capable model, e.g. llama-3.2-11b-vision-preview
}

/**
 * Vision provider for OpenAl-style "image_url" content parts. Used for the
 * Camera / Files features. It is only constructed when the administrator has
 * explicitly configured AI_IMAGE_MODEL, so text-only deployments simply report
 * the feature as unsupported (the UI explains why) instead of failing.
 */
export class OpenAICompatibleImageProvider implements AIImageProvider {
  readonly name = "openai-compatible-image";

  constructor(private readonly config: OpenAICompatibleImageConfig) {}

  get model(): string {
    return this.config.model;
  }

  async analyzeImage(dataUrl: string, question: string): Promise<string> {
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
          temperature: 0.3,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: question,
                },
                {
                  type: "image_url",
                  image_url: { url: dataUrl },
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new AIProviderError("UPSTREAM_REQUEST_FAILED", "The AI service could not be reached.");
    }

    if (!response.ok) {
      throw new AIProviderError("UPSTREAM_REQUEST_FAILED", `The AI service returned HTTP ${response.status}.`);
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