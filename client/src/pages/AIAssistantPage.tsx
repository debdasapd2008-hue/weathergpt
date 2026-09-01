import { Sparkles } from "lucide-react";
import { useGeneralChat } from "@/hooks/useGeneralChat";
import { useI18n } from "@/i18n";
import { ChatWindow } from "@/components/ChatWindow";
import { PageHeader } from "@/components/Page";
import { GeoAlert, ErrorState, SearchPrompt } from "@/components/States";
import { useWeatherData } from "@/stores/weatherData";

export function AIAssistantPage() {
  const { state, geoError, locate } = useWeatherData();
  const { t } = useI18n();
  const weather = state.status === "success" ? state.data : null;
  const chat = useGeneralChat({
    mode: "ai",
    weather,
    activeLabel: weather?.current.city ?? null,
  });

  return (
    <div>
      <PageHeader
        icon={Sparkles}
        title={t("nav.ai", "AI WeatherGPT")}
        intro={t("ai.intro", "Ask anything about the current forecast in your own language.")}
        index="03"
      />
      {geoError && <GeoAlert message={geoError} onRetry={locate} />}
      {state.status === "idle" && <SearchPrompt onSearch={locate} />}
      {state.status === "loading" && <p className="text-sm text-ink-3 dark:text-white/40">{t("common.loading", "Loading…")}</p>}
      {state.status === "error" && (
        <ErrorState code={state.code} message={state.message} onRetry={state.retry} />
      )}

      <ChatWindow
        messages={chat.messages}
        input={chat.input}
        setInput={chat.setInput}
        loading={chat.loading}
        error={chat.error}
        onSend={chat.send}
        onRegenerate={chat.regenerateLast}
        onClear={chat.clear}
        placeholder={t("ai.placeholder", "Will it rain later? Should I carry an umbrella?")}
        suggested={[
          "Will it rain today?",
          "Should I carry an umbrella?",
          "How will the weather change tonight?",
          "Explain today's weather simply.",
          "What should I wear for this weather?",
        ]}
        disabled={!chat.configured || !weather}
        disabledHint={
          !weather
            ? "Search for a location first so answers can use your real weather."
            : t("ai.notConfiguredHint", "Ask an administrator to set AI_PROVIDER and AI_API_KEY.")
        }
        headerNote={t("ai.answerTime", "Answer")}
      />

      {chat.status.configured && (
        <p className="mt-4 text-center text-xs text-ink-3 dark:text-white/40">
          {t("ai.provider", "Provider")}: {chat.status.provider} · {t("ai.model", "Model")}: {chat.status.model} ·{" "}
          {t("ai.languageNote", "Answers follow the interface language you have chosen.")}
        </p>
      )}
    </div>
  );
}