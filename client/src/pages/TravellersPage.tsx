import { Plane, Sun, Umbrella, Luggage } from "lucide-react";
import { useGeneralChat } from "@/hooks/useGeneralChat";
import { useI18n } from "@/i18n";
import { Card, CardGrid, PageHeader } from "@/components/Page";
import { ChatWindow } from "@/components/ChatWindow";
import { useWeatherData } from "@/stores/weatherData";
import { formatTemp, formatVisibilityDistance, formatWindSpeed } from "@/lib/units";

const TRAVELLER_QUESTIONS = [
  "What should I pack for this weather?",
  "Is the visibility good for driving or flying?",
  "When is the best time to go out today?",
  "Should I carry an umbrella?",
  "Is tomorrow good for travelling?",
];

export function TravellersPage() {
  const { t } = useI18n();
  const { state } = useWeatherData();
  const chat = useGeneralChat({
    mode: "travellers",
    weather: state.status === "success" ? state.data : null,
    activeLabel: state.status === "success" ? state.data.current.city : null,
    destinationLabel: state.status === "success" ? state.data.current.city : null,
  });

  const stats =
    state.status === "success"
      ? [
          { icon: Sun, label: "Now", value: formatTemp(state.data.current.temperature, "metric") },
          { icon: Umbrella, label: "Rain today", value: `${Math.max(...state.data.hourly.map((hour) => hour.precipitationProbability))}%` },
          { icon: Luggage, label: "Visibility", value: formatVisibilityDistance(state.data.current.visibility, "metric") },
        ]
      : [];

  return (
    <div>
      <PageHeader
        icon={Plane}
        title={t("nav.travellers", "Travellers")}
        intro={t("travellers.intro", "Trip planning and travel advice grounded in the current forecast.")}
        index="10"
      />
      {stats.length > 0 && (
        <CardGrid>
          {stats.map((stat) => (
            <Card key={stat.label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-azure/20 text-azure dark:text-azure">
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
          placeholder="Ask about packing, trips, driving…"
          suggested={TRAVELLER_QUESTIONS}
          disabled={!chat.configured || state.status !== "success"}
          disabledHint={
            state.status !== "success"
              ? "Search for your destination first so answers use its real weather."
              : t("ai.notConfiguredHint", "Ask an administrator to set AI_PROVIDER and AI_API_KEY.")
          }
          onClear={chat.clear}
        />
        <p className="mt-2 text-xs text-ink-3 dark:text-white/40">
          Advice is based on the current forecast for the selected location. Always check live
          conditions before travelling.
        </p>
      </div>
    </div>
  );
}