import { MessageSquare } from "lucide-react";
import { useGeneralChat } from "@/hooks/useGeneralChat";
import { useI18n } from "@/i18n";
import { ChatWindow } from "@/components/ChatWindow";
import { Card, PageHeader } from "@/components/Page";

const STARTERS = [
  "Give me a fun weather fact",
  "Suggest a recipe for a rainy day",
  "Tell me a short story for today's weather",
  "What's a good indoor activity today?",
];

export function GeneralChatPage() {
  const { t } = useI18n();
  const chat = useGeneralChat();

  return (
    <div>
      <PageHeader
        icon={MessageSquare}
        title={t("nav.chat", "General Chat")}
        intro={t("chat.intro", "Chat about anything — tips, ideas, facts — in your own language.")}
        index="13"
      />
      <ChatWindow
        messages={chat.messages}
        input={chat.input}
        setInput={chat.setInput}
        loading={chat.loading}
        error={chat.error}
        onSend={chat.send}
        onRegenerate={chat.regenerateLast}
        placeholder={t("chat.placeholder", "Ask me anything…")}
        suggested={STARTERS}
        disabled={!chat.configured}
        disabledHint={t("ai.notConfiguredHint", "Ask an administrator to set AI_PROVIDER and AI_API_KEY.")}
        onClear={chat.clear}
      />
      {chat.status.configured && (
        <p className="mt-4 text-center text-xs text-ink-3 dark:text-white/40">
          {t("ai.provider", "Provider")}: {chat.status.provider} · {t("ai.model", "Model")}:{" "}
          {chat.status.model} · {t("ai.languageNote", "Answers follow the interface language you have chosen.")}
        </p>
      )}
      <div className="mt-8">
        <Card>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3 dark:text-white/45">
            {t("health.tip", "Health tips")}
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-ink-2 dark:text-white/60">
            <li>{t("health.stayHydrated", "Hydrate often, especially on warm or active days.")}</li>
            <li>{t("health.limitSun", "Limit direct sun between 11:00 and 15:00 and use sunscreen.")}</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}