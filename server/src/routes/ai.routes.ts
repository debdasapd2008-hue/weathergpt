import { Router } from "express";
import {
  aiGeneralRequestSchema,
  aiImageRequestSchema,
  aiWeatherRequestSchema,
  type AiWeatherRequest,
  type ChatContext,
} from "@weathergpt/shared";
import { buildGeneralPrompt, buildWeatherPrompt } from "../prompts/weather.prompt";
import { AIProviderError, type AIProvider } from "../providers/ai";
import type { AIImageProvider } from "../providers/ai";

export interface AIRouterDeps {
  provider: AIProvider | null;
  /** Vision-capable provider used by the Camera / Files features. */
  imageProvider: AIImageProvider | null;
}

function buildWeatherContextSummary(request: AiWeatherRequest): string {
  const lines: string[] = [];
  if (request.location) {
    lines.push(`Location: lat ${request.location.lat}, lon ${request.location.lon}`);
  }
  if (request.current) {
    const c = request.current;
    lines.push(
      `Now: ${c.condition}, ${c.temperature}°C, feels like ${c.feelsLike}°C, humidity ${c.humidity}%, ` +
        `wind ${c.windSpeed} m/s, pressure ${c.pressure} hPa, UV ${c.uvIndex}`,
    );
  }
  if (request.daily && request.daily.length > 0) {
    const next = request.daily.slice(0, 3);
    lines.push(
      `Forecast: ${next
        .map((d) => `${d.day} ${d.low}–${d.high}°C, rain ${d.precipitationProbability}%`)
        .join(" | ")}`,
    );
  }
  return lines.join("\n");
}

function buildChatContextLines(context: ChatContext | undefined): string {
  if (!context) return "";
  const lines: string[] = [];
  if (context.activeLabel) lines.push(`Active location: ${context.activeLabel}`);
  if (context.destinationLabel)
    lines.push(`Travel destination: ${context.destinationLabel}`);
  if (context.mode) lines.push(`Section: ${context.mode}`);
  if (context.units) lines.push(`Units: ${context.units}`);
  return lines.join("\n");
}

function buildImageQuestion(question: string, weatherSummary: string): string {
  const body = question.trim() || "Describe this image.";
  return weatherSummary
    ? `${body}\n\nCurrent weather context:\n${weatherSummary}`
    : body;
}

function aiErrorToHttp(error: AIProviderError) {
  switch (error.code) {
    case "UNAUTHORIZED":
      return { status: 503, code: "AI_UNAUTHORIZED", message: "The AI provider rejected the API key." };
    case "RATE_LIMITED":
      return { status: 429, code: "RATE_LIMITED", message: "The AI provider is rate-limiting requests. Try again shortly." };
    case "UPSTREAM_REQUEST_FAILED":
      return { status: 502, code: "AI_UPSTREAM", message: "The AI provider could not answer right now. Try again." };
  }
}

function sendError(res: { status: (code: number) => { json: (body: unknown) => void } }, error: unknown, next: (err: unknown) => void) {
  if (error instanceof AIProviderError) {
    const { status, code, message } = aiErrorToHttp(error);
    res.status(status).json({ error: { code, message } });
    return;
  }
  next(error);
}

export function createAIRouter(deps: AIRouterDeps): Router {
  const router = Router();

  router.get("/status", (_req, res) => {
    res.json({
      configured: deps.provider !== null,
      provider: deps.provider?.name ?? "",
      model: deps.provider?.model ?? "",
      imageSupported: deps.imageProvider !== null,
    });
  });

  router.post("/weather", async (req, res, next) => {
    const parsed = aiWeatherRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body: include a question and valid weather data.",
        },
      });
      return;
    }

    if (!deps.provider) {
      res.status(503).json({
        error: {
          code: "AI_NOT_CONFIGURED",
          message:
            "WeatherGPT AI is not configured. Set AI_PROVIDER, AI_API_KEY (and optionally AI_MODEL / AI_BASE_URL) in the server environment to enable it.",
        },
      });
      return;
    }

    try {
      const image = parsed.data.imageAttachment;
      if (image && deps.imageProvider) {
        // Multimodal: analyse the attached image in the context of the weather.
        const question = buildImageQuestion(
          parsed.data.question,
          buildWeatherContextSummary(parsed.data),
        );
        const answer = await deps.imageProvider.analyzeImage(image.dataUrl, question);
        res.json({ answer, provider: deps.imageProvider.name, model: deps.imageProvider.model });
        return;
      }
      const answer = await deps.provider.chat(buildWeatherPrompt(parsed.data));
      res.json({ answer, provider: deps.provider.name, model: deps.provider.model });
    } catch (error) {
      sendError(res, error, next);
    }
  });

  // Open-ended chat (Future of agriculture, travel planning, general chat).
  router.post("/general", async (req, res, next) => {
    const parsed = aiGeneralRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid request body: include a question." },
      });
      return;
    }

    if (!deps.provider) {
      res.status(503).json({
        error: {
          code: "AI_NOT_CONFIGURED",
          message:
            "WeatherGPT AI is not configured. Set AI_PROVIDER, AI_API_KEY (and optionally AI_MODEL / AI_BASE_URL) in the server environment to enable it.",
        },
      });
      return;
    }

    try {
      const image = parsed.data.imageAttachment;
      if (image && deps.imageProvider) {
        const contextLines = buildChatContextLines(parsed.data.chatContext);
        const historyText = (parsed.data.history ?? []).slice(-6)
          .map((turn) => `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`)
          .join("\n");
        const question = [
          parsed.data.question,
          contextLines ? `\n\nContext:\n${contextLines}` : "",
          historyText ? `\n\nPrevious conversation:\n${historyText}` : "",
        ].join("");
        const answer = await deps.imageProvider.analyzeImage(image.dataUrl, question);
        res.json({ answer, provider: deps.imageProvider.name, model: deps.imageProvider.model });
        return;
      }
      const answer = await deps.provider.chat(buildGeneralPrompt(parsed.data));
      res.json({ answer, provider: deps.provider.name, model: deps.provider.model });
    } catch (error) {
      sendError(res, error, next);
    }
  });

  // Camera / Files: analyse an image with a vision-capable model. When the
  // deployment has no AI_IMAGE_MODEL, returns 200 { supported:false } so the
  // UI can explain the limitation instead of showing an error.
  router.post("/image", async (req, res, next) => {
    const parsed = aiImageRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid request body: include an image and a question." },
      });
      return;
    }

    if (!deps.provider) {
      res.status(503).json({
        error: {
          code: "AI_NOT_CONFIGURED",
          message:
            "WeatherGPT AI is not configured. Set AI_PROVIDER, AI_API_KEY in the server environment to enable it.",
        },
      });
      return;
    }

    if (!deps.imageProvider) {
      res.status(200).json({
        supported: false,
        answer:
          "Image analysis is not enabled for this deployment. Ask an administrator to set AI_IMAGE_MODEL to a vision-capable model (for example llama-3.2-11b-vision-preview). Meanwhile, you can still describe the image in text.",
        reason: "unsupported",
      });
      return;
    }

    try {
      const answer = await deps.imageProvider.analyzeImage(parsed.data.dataUrl, parsed.data.question);
      res.json({
        supported: true,
        answer,
        provider: deps.imageProvider.name,
        model: deps.imageProvider.model,
      });
    } catch (error) {
      sendError(res, error, next);
    }
  });

  return router;
}