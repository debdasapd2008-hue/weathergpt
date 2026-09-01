import { useCallback } from "react";
import { useGeneralChat } from "./useGeneralChat";
import type { ChatAttachment, ChatMessageView } from "./useAIChat";

export type EducationDifficulty = "beginner" | "intermediate" | "advanced";
export type EducationActivity = "explain" | "quiz";

export interface UseEducationChatOptions {
  difficulty: EducationDifficulty;
  activity: EducationActivity;
}

const DIFFICULTY_HINT: Record<EducationDifficulty, string> = {
  beginner: "Explain like I am a Class 8 student: keep it simple, use everyday words and a short everyday example.",
  intermediate: "Explain at a high-school level: be clear and accurate, include the key scientific idea without heavy jargon.",
  advanced: "Explain at an advanced level: be precise, technically accurate, and cover the underlying physics/science where relevant.",
};

const ACTIVITY_HINT: Record<EducationActivity, string> = {
  explain: "Give a clear, correct explanation that can be followed easily.",
  quiz: "Give a short 3-question quiz about this with an answer key at the end. Be scientifically accurate.",
};

export interface UseEducationChatResult {
  statusChecked: boolean;
  configured: boolean;
  messages: ChatMessageView[];
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  error: string | null;
  send: (question: string, attachments?: ChatAttachment[]) => void;
  clear: () => void;
}

/**
 * Education section chat. Wraps the general chat but enriches every question
 * with an explicit difficulty + activity instruction so answers are
 * scientifically accurate and appropriately levelled.
 */
export function useEducationChat(options: UseEducationChatOptions): UseEducationChatResult {
  const general = useGeneralChat({ mode: "education" });

  const send = useCallback(
    (question: string, attachments?: ChatAttachment[]) => {
      const base = question.trim() || "Explain how weather works.";
      const enriched = `${base}\n\n(Educational instruction: ${DIFFICULTY_HINT[options.difficulty]} ${ACTIVITY_HINT[options.activity]})`;
      general.send(enriched, attachments);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [general, options.difficulty, options.activity],
  );

  return {
    statusChecked: general.statusChecked,
    configured: general.configured,
    messages: general.messages,
    input: general.input,
    setInput: general.setInput,
    loading: general.loading,
    error: general.error,
    send,
    clear: general.clear,
  };
}
