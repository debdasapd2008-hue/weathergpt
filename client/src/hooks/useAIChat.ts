import type { AiStatus, WeatherResponse } from "@weathergpt/shared";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/i18n";
import { useSettings } from "@/stores/settings";
import { detectChatStyle } from "@/lib/chatStyle";

export interface ChatAttachment {
  id: string;
  kind: "image" | "pdf" | "text" | "other";
  name: string;
  /** Present for images so they can be sent to the vision endpoint. */
  dataUrl: string | null;
}

export interface ChatMessageView {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  attachments?: ChatAttachment[];
}

export interface UseAIChatOptions {
  /** Which section this chat belongs to (drives prompt behaviour/context). */
  mode?: "ai" | "general" | "education" | "health" | "farmers" | "travellers";
  /** Location label to give the model. */
  activeLabel?: string | null;
  /** Destination label for travel mode. */
  destinationLabel?: string | null;
}

export const SUGGESTED_QUESTIONS = [
  "Will it rain today?",
  "Should I carry an umbrella?",
  "How will the weather change tonight?",
  "Explain today's weather simply.",
  "What should I wear for this weather?",
];

export interface UseAIChatResult {
  status: AiStatus;
  statusChecked: boolean;
  messages: ChatMessageView[];
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  error: string | null;
  send: (question: string, weather: WeatherResponse | null, attachments?: ChatAttachment[]) => void;
  clear: () => void;
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as { randomUUID: () => string }).randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

const EMPTY_STATUS: AiStatus = { configured: false, provider: "", model: "" };

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatResult {
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

  const send = useCallback(
    (question: string, weather: WeatherResponse | null, attachments?: ChatAttachment[]) => {
      const text = question.trim();
      if ((!text && (!attachments || attachments.length === 0)) || !weather || loading) return;
      setError(null);
      setInput("");
      setMessages((previous) => [
        ...previous,
        { id: newId(), role: "user", content: text, createdAt: Date.now(), attachments },
      ]);
      setLoading(true);

      // An explicit style wins; otherwise auto-detect from the message.
      const effectiveStyle = chatStyle === "auto" ? detectChatStyle(text) : chatStyle;

      void api
        .askAI({
          question: text || t("ai.seeImage", "Tell me about this."),
          current: weather.current,
          hourly: weather.hourly,
          daily: weather.daily,
          location: weather.location,
          language,
          chatStyle: effectiveStyle,
          chatContext: {
            mode: options.mode ?? "ai",
            activeLabel: options.activeLabel ?? weather.current.city,
            destinationLabel: options.destinationLabel ?? undefined,
            units,
          },
          imageAttachment: attachments?.find((a) => a.kind === "image" && a.dataUrl)
            ? {
                dataUrl: attachments.find((a) => a.kind === "image" && a.dataUrl)!.dataUrl!,
                mime: "image/jpeg",
              }
            : undefined,
        })
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
    [loading, language, chatStyle, units, options.mode, options.activeLabel, options.destinationLabel, t],
  );

  return { status, statusChecked, messages, input, setInput, loading, error, send, clear };
}
