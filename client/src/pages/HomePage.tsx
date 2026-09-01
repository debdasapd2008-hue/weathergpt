import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useGeneralChat } from "@/hooks/useGeneralChat";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { useSettings } from "@/stores/settings";
import { useWeatherData } from "@/stores/weatherData";
import { ChatWindow } from "@/components/ChatWindow";
import { CurrentWeatherCard } from "@/components/CurrentWeatherCard";
import { DailyForecast } from "@/components/DailyForecast";
import { ForecastTools } from "@/components/ForecastTools";
import { HourlyForecast } from "@/components/HourlyForecast";
import { GeoAlert, ErrorState, SearchPrompt } from "@/components/States";
import { WeatherDetails } from "@/components/WeatherDetails";
import { WeatherSkeleton } from "@/components/Skeleton";
import { useEffect, useRef, useState } from "react";

export function HomePage() {
  const { state, geoError, locate, setActive } = useWeatherData();
  const { units } = useSettings();
  const { t } = useI18n();
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const weather = state.status === "success" ? state.data : null;
  const chat = useGeneralChat({
    mode: "ai",
    weather,
    activeLabel: weather?.current.city ?? null,
  });
  const chatRef = useRef<HTMLDivElement | null>(null);

  const chatDisabled = !chat.configured || !weather;

  useEffect(() => {
    if (state.status === "success") {
      setLastUpdated(Date.now());
    }
  }, [state]);

  function askWeatherGPT(question: string) {
    chat.setInput(question);
    chatRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <div className="space-y-5">
      {geoError && <GeoAlert message={geoError} onRetry={locate} />}

      {state.status === "idle" && (
        <SearchPrompt
          onSearch={(city) => {
            void api.getWeatherByCity(city).then((data) => {
              setActive({ label: data.current.city, lat: data.location.lat, lon: data.location.lon });
            });
          }}
        />
      )}
      {state.status === "loading" && <WeatherSkeleton />}
      {state.status === "error" && (
        <ErrorState code={state.code} message={state.message} onRetry={state.retry} />
      )}
      {state.status === "success" && weather && (
        <>
          <CurrentWeatherCard data={weather.current} units={units} onAskMetric={askWeatherGPT} />

          {weather.alerts.length > 0 && (
            <section
              aria-label={t("home.officialAlerts", "Official alerts")}
              className="panel animate-fade-up flex items-center justify-between gap-3 border-amber-400/50 bg-amber-50/60 p-5 dark:border-amber-400/25 dark:bg-amber-400/10"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    {t("home.officialAlerts", "Official alerts")}
                  </p>
                  <p className="text-sm text-amber-600/90 dark:text-amber-300/70">
                    {weather.alerts[0]?.event ?? ""}
                    {weather.alerts.length > 1 ? ` · +${weather.alerts.length - 1} more` : ""}
                  </p>
                </div>
              </div>
              <Link
                to="/alerts"
                className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-500/25 dark:text-amber-300"
              >
                {t("home.viewAll", "View all")} <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </section>
          )}

          {weather.hourly.length > 0 && <HourlyForecast data={weather} units={units} index="02" />}
          {weather.daily.length > 0 && <DailyForecast data={weather} units={units} index="03" />}
          <WeatherDetails data={weather.current} units={units} index="04" />
          <ForecastTools
            index="05"
            weather={weather}
            units={units}
            onExplainForecast={() =>
              chat.send("Explain my forecast for today in simple words. Include what to watch for.")
            }
          />
          <p className="text-center text-xs text-ink-3 dark:text-white/40">
            {t("common.updatedAt", "Updated")} {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : ""}
          </p>
        </>
      )}

      <div ref={chatRef} className="scroll-mt-24">
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
            t("tools.explainForecast", "Explain my forecast in simple words."),
            "Will it rain today?",
            "Should I carry an umbrella?",
            "What should I wear for this weather?",
            "How will the weather change tonight?",
          ]}
          disabled={chatDisabled}
          disabledHint={
            !weather
              ? "Search for a location first so answers can use your real weather."
              : t("ai.notConfiguredHint", "Ask an administrator to set AI_PROVIDER and AI_API_KEY.")
          }
          headerNote={t("ai.answerTime", "WeatherGPT")}
        />
      </div>
      {chat.status.configured && (
        <p className="text-center text-xs text-ink-3 dark:text-white/40">
          {t("ai.provider", "Provider")}: {chat.status.provider} · {t("ai.model", "Model")}:{" "}
          {chat.status.model} · {t("ai.languageNote", "Answers follow the interface language you have chosen.")}
        </p>
      )}
    </div>
  );
}