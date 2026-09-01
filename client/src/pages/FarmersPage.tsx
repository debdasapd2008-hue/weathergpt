import { Sprout, Sun, Droplets, Wind } from "lucide-react";
import { useGeneralChat } from "@/hooks/useGeneralChat";
import { useI18n } from "@/i18n";
import { Card, CardGrid, PageHeader } from "@/components/Page";
import { ChatWindow } from "@/components/ChatWindow";
import { useWeatherData } from "@/stores/weatherData";
import { useSettings } from "@/stores/settings";
import { formatTemp, formatWindSpeed } from "@/lib/units";

const FARMER_QUESTIONS = [
  "Is it a good day to spray or harvest?",
  "Should I water my crops today?",
  "What does the wind mean for the fields this week?",
  "Give me a 3-day weather plan for a vegetable garden.",
];

export function FarmersPage() {
  const { t } = useI18n();
  const { units } = useSettings();
  const { state } = useWeatherData();
  const chat = useGeneralChat({
    mode: "farmers",
    weather: state.status === "success" ? state.data : null,
    activeLabel: state.status === "success" ? state.data.current.city : null,
  });

  const stats =
    state.status === "success"
      ? [
          { icon: Sun, label: "Temperature now", value: formatTemp(state.data.current.temperature, units) },
          { icon: Droplets, label: "Rain chance (7d)", value: `${Math.max(...state.data.daily.map((day) => day.precipitationProbability))}%` },
          { icon: Wind, label: "Wind", value: formatWindSpeed(state.data.current.windSpeed, units) },
        ]
      : [];

  return (
    <div>
      <PageHeader
        icon={Sprout}
        title={t("nav.farmers", "Future of Agriculture")}
        intro={t("farmers.intro", "Practical, weather-aware guidance for farmers and growers.")}
        index="09"
      />
      {stats.length > 0 && (
        <CardGrid>
          {stats.map((stat) => (
            <Card key={stat.label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/15 text-teal-700 dark:text-teal-300">
                <stat.icon size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-3 dark:text-white/40">{stat.label}</p>
                <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
              </div>
            </Card>
          ))}
        </CardGrid>
      )}
      <div className="mt-5">
        <ChatWindow
          messages={chat.messages}
          input={chat.input}
          setInput={chat.setInput}
          loading={chat.loading}
          error={chat.error}
          onSend={chat.send}
          onRegenerate={chat.regenerateLast}
          placeholder="Ask about crops, irrigation, sowing…"
          suggested={FARMER_QUESTIONS}
          disabled={!chat.configured || state.status !== "success"}
          disabledHint={
            state.status !== "success"
              ? "Search for a location first so answers can use your real forecast."
              : t("ai.notConfiguredHint", "Ask an administrator to set AI_PROVIDER and AI_API_KEY.")
          }
          onClear={chat.clear}
        />
        <p className="mt-2 text-xs text-ink-3 dark:text-white/40">
          General weather-based guidance, not professional agricultural advice. Verify critical
          decisions with reliable local sources.
        </p>
      </div>
    </div>
  );
}