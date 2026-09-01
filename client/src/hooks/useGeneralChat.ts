import type { AiStatus, WeatherResponse } from "@weathergpt/shared";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/i18n";
import { useSettings } from "@/stores/settings";
import { detectChatStyle } from "@/lib/chatStyle";
import type { ChatAttachment, ChatMessageView } from "./useAIChat";

export type ChatMode = "ai" | "general" | "education" | "health" | "farmers" | "travellers";

export interface UseGeneralChatOptions {
  mode?: ChatMode;
  activeLabel?: string | null;
  /** Destination label for travel mode. */
  destinationLabel?: string | null;
  /** Current weather (for weather-aware sections like Health/Farmers/Travellers). */
  weather?: WeatherResponse | null;
}

/** Compact, token-efficient summary of the current weather for prompt context. */
export function buildWeatherSummary(weather: WeatherResponse): string {
  const c = weather.current;
  const lines = [
    `Now: ${c.city}, ${c.condition} (${c.description}), ${c.temperature}°C, feels ${c.feelsLike}°C, humidity ${c.humidity}%, wind ${c.windSpeed} m/s, pressure ${c.pressure} hPa, UV ${c.uvIndex}`,
  ];
  if (weather.daily.length > 0) {
    lines.push(
      `Daily: ${weather.daily
        .slice(0, 5)
        .map((d) => `${d.day} ${d.low}–${d.high}°C, rain ${d.precipitationProbability}%`)
        .join(" | ")}`,
    );
  }
  if (weather.alerts.length > 0) {
    lines.push(`Alerts: ${weather.alerts.map((a) => a.event).join("; ")}`);
  }
  return lines.join("\n");
}

/** A session-style chat (open questions, keeps history, language-aware). */
export interface UseGeneralChatResult {
  status: AiStatus;
  statusChecked: boolean;
  messages: ChatMessageView[];
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  error: string | null;
  send: (question: string, attachments?: ChatAttachment[]) => void;
  regenerateLast: () => void;
  clear: () => void;
  configured: boolean;
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as { randomUUID: () => string }).randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

const EMPTY_STATUS: AiStatus = { configured: false, provider: "", model: "" };
const MAX_HISTORY_TURNS = 12;

export function useGeneralChat(options: UseGeneralChatOptions = {}): UseGeneralChatResult {
  const { t, language } = useI18n();
  const { chatStyle, units } = useSettings();
  const [status, setStatus] = useState<AiStatus>(EMPTY_STATUS);
  const [statusChecked, setStatusChecked] = useState(false);
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getAIStatus()
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch(() => {
        if (!cancelled) setStatus(EMPTY_STATUS);
      })
      .finally(() => {
        if (!cancelled) setStatusChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
    setInput("");
  }, []);

  const runRequest = useCallback(
    (questionText: string, history: ChatMessageView[], attachments?: ChatAttachment[]) => {
      const text = questionText.trim();
      setLoading(true);
      setError(null);

      const effectiveStyle = chatStyle === "auto" ? detectChatStyle(text) : chatStyle;

      const historyTurns = history
        .slice(-MAX_HISTORY_TURNS)
        .map((message) => ({ role: message.role, content: message.content }));

      const weatherSummary = options.weather
        ? buildWeatherSummary(options.weather)
        : undefined;

      const promise = api.askGeneral({
        question: text || t("ai.seeImage", "Tell me about this."),
        history: historyTurns,
        language,
        chatStyle: effectiveStyle,
        chatContext: {
          mode: options.mode,
          activeLabel: options.activeLabel ?? options.weather?.current.city,
          destinationLabel: options.destinationLabel ?? undefined,
          units,
        },
        imageAttachment: attachments?.find((a) => a.kind === "image" && a.dataUrl)
          ? {
              dataUrl: attachments.find((a) => a.kind === "image" && a.dataUrl)!.dataUrl!,
              mime: "image/jpeg",
            }
          : undefined,
        weatherSummary,
      });

      return promise
        .then((response) => {
          setMessages((previous) => [
            ...previous,
            {
              id: newId(),
              role: "assistant",
              content: response.answer,
              createdAt: Date.now(),
            },
          ]);
        })
        .catch((requestError: unknown) => {
          const apiError = requestError instanceof ApiError ? requestError : null;
          setError(apiError?.message ?? "The AI assistant could not answer right now.");
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [chatStyle, language, options.weather, options.mode, options.activeLabel, units, t],
  );

  const send = useCallback(
    (question: string, attachments?: ChatAttachment[]) => {
      const text = question.trim();
      if ((!text && (!attachments || attachments.length === 0)) || loading) return;
      setInput("");
      setMessages((previous) => [
        ...previous,
        { id: newId(), role: "user", content: text, createdAt: Date.now(), attachments },
      ]);
      void runRequest(text, [...messages, {
        id: newId(), role: "user", content: text, createdAt: Date.now(), attachments,
      }], attachments);
    },
    [loading, messages, runRequest],
  );

  const regenerateLast = useCallback(() => {
    const lastUser = [...messages].reverse().find((message) => message.role === "user");
    if (!lastUser || loading) return;
    const upTo = messages.findIndex((message) => message.id === lastUser.id);
    const history = messages.slice(0, upTo);
    setMessages(history);
    void runRequest(lastUser.content, history, lastUser.attachments);
  }, [messages, loading, runRequest]);

  return {
    status,
    statusChecked,
    messages,
    input,
    setInput,
    loading,
    error,
    send,
    regenerateLast,
    clear,
    configured: status.configured,
  };
}
