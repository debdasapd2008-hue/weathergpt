import { HeartPulse, Activity, Sun, ThermometerSun, Waves, Wind, MessageCircleHeart } from "lucide-react";
import { useEffect, useState } from "react";
import type { AirQuality } from "@weathergpt/shared";
import { useI18n } from "@/i18n";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  comfortDescription,
  formatTemp,
  heatIndexCelsius,
  uvAdvice,
  windChillCelsius,
  type UnitSystem,
} from "@/lib/units";
import { useSettings } from "@/stores/settings";
import { useWeatherData } from "@/stores/weatherData";
import { Card, CardGrid, PageHeader } from "@/components/Page";
import { ChatWindow } from "@/components/ChatWindow";
import { useGeneralChat } from "@/hooks/useGeneralChat";

const AQI_BANDS = [
  { min: 1, label: "good", color: "text-emerald-600", bar: "bg-emerald-500" },
  { min: 2, label: "fair", color: "text-azure", bar: "bg-azure" },
  { min: 3, label: "moderate", color: "text-amber-600", bar: "bg-amber-500" },
  { min: 4, label: "poor", color: "text-orange-600", bar: "bg-orange-500" },
  { min: 5, label: "veryPoor", color: "text-rose-600", bar: "bg-rose-500" },
];

function aqiBand(aqi: number) {
  return AQI_BANDS.find((band) => aqi >= band.min) ?? AQI_BANDS[AQI_BANDS.length - 1];
}

function StatTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-ink/[0.04] px-3 py-2 dark:bg-white/5">
      <p className="text-xs uppercase tracking-wide text-ink-3 dark:text-white/40">{label}</p>
      <div className="font-semibold tabular-nums">{children}</div>
    </div>
  );
}

function AirQualityCard() {
  const { t } = useI18n();
  const { state } = useWeatherData();
  const { showAirQuality } = useSettings();
  const [air, setAir] = useState<AirQuality | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showAirQuality) return;
    if (state.status !== "success") return;
    const { lat, lon } = state.data.location;
    let cancelled = false;
    setLoading(true);
    setAir(null);
    setUnavailable(false);
    void api
      .getAirQuality({ lat, lon })
      .then((result) => {
        if (!cancelled) setAir(result);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.code === "AIR_QUALITY_UNAVAILABLE") {
          setUnavailable(true);
        } else {
          setUnavailable(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [state, showAirQuality]);

  if (!showAirQuality) return null;

  const band = air ? aqiBand(air.aqi) : null;

  return (
    <Card className="flex flex-col">
      <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3 dark:text-white/45">
        <Wind size={14} aria-hidden="true" /> {t("health.airQuality", "Air quality")}
      </h2>
      {loading ? (
        <p className="text-sm text-ink-3 dark:text-white/40">{t("common.loading", "Loading…")}</p>
      ) : unavailable || !air || !band ? (
        <p className="text-sm text-ink-2 dark:text-white/55">
          {t("health.notAvailable", "Air quality data is not available.")}
        </p>
      ) : (
        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-extralight">
                <span className={band.color}>{air.aqi}</span>
                <span className="ml-2 text-sm font-medium uppercase text-ink-3 dark:text-white/40">
                  {t("health.aqiLabel", "AQI")}
                </span>
              </p>
              <p className={cn("text-sm font-semibold", band.color)}>
                {t(`health.aqiBand.${band.label}`, band.label)}
              </p>
            </div>
            <div className="flex items-end gap-1">
              {AQI_BANDS.map((step) => (
                <span
                  key={step.label}
                  className={cn(
                    "h-3 w-2 rounded-sm",
                    air.aqi >= step.min ? step.bar : "bg-line-2 dark:bg-white/10",
                  )}
                />
              ))}
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <StatTile label="PM2.5">{air.pm25.toFixed(1)} µg/m³</StatTile>
            <StatTile label="PM10">{air.pm10.toFixed(1)} µg/m³</StatTile>
          </dl>
          <p className="mt-3 text-xs text-ink-3 dark:text-white/40">{air.pollutant}</p>
        </div>
      )}
    </Card>
  );
}

function ComfortCard({ units }: { units: UnitSystem }) {
  const { t } = useI18n();
  const { state } = useWeatherData();
  if (state.status !== "success") return null;
  const current = state.data.current;
  const windChill = windChillCelsius(current.temperature, current.windSpeed);
  const heatIndex = heatIndexCelsius(current.temperature, current.humidity);

  return (
    <Card className="flex flex-col">
      <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3 dark:text-white/45">
        <ThermometerSun size={14} aria-hidden="true" /> {t("health.comfort", "Comfort")}
      </h2>
      <p className="text-sm leading-relaxed text-ink-2 dark:text-white/60">
        {comfortDescription(current.temperature, current.humidity, current.windSpeed)}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {windChill !== null && (
          <StatTile label={t("health.windChill", "Wind chill")}>
            {formatTemp(windChill, units)}
          </StatTile>
        )}
        {heatIndex !== null && (
          <StatTile label={t("health.heatIndex", "Heat index")}>
            {formatTemp(heatIndex, units)}
          </StatTile>
        )}
        <StatTile label="Feels-like">{formatTemp(current.feelsLike, units)}</StatTile>
        <StatTile label={t("common.humidity", "Humidity")}>{current.humidity}%</StatTile>
      </div>
    </Card>
  );
}

function UvCard() {
  const { t } = useI18n();
  const { state } = useWeatherData();
  if (state.status !== "success") return null;
  const uv = Math.max(0, Math.round(state.data.current.uvIndex));
  const pct = Math.min(100, (uv / 11) * 100);
  const level =
    uv <= 2 ? "text-emerald-600" : uv <= 5 ? "text-azure" : uv <= 7 ? "text-amber-600" : uv <= 10 ? "text-orange-600" : "text-rose-600";

  return (
    <Card className="flex flex-col">
      <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3 dark:text-white/45">
        <Sun size={14} aria-hidden="true" /> {t("health.uvRisk", "UV risk")}
      </h2>
      <p className={cn("text-4xl font-extralight", level)}>{uv}</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line-2 dark:bg-white/10">
        <div
          className={cn("h-full rounded-full bg-teal-500 transition-all", uv <= 5 && "bg-azure", uv >= 8 && "bg-rose-500")}
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-2 dark:text-white/60">{uvAdvice(uv)}</p>
    </Card>
  );
}

const HEALTH_QUESTIONS = [
  "Is it very hot today?",
  "How can I stay comfortable in this weather?",
  "What should I consider before exercising outside?",
  "Is the humidity high?",
  "How can I stay hydrated during hot weather?",
];

export function HealthPage() {
  const { t } = useI18n();
  const { units } = useSettings();
  const { state } = useWeatherData();
  const chat = useGeneralChat({
    mode: "health",
    weather: state.status === "success" ? state.data : null,
    activeLabel: state.status === "success" ? state.data.current.city : null,
  });

  return (
    <div>
      <PageHeader
        icon={HeartPulse}
        title={t("nav.health", "Health & Wellness")}
        intro={t("health.tip", "Health tips")}
        index="11"
      />
      <CardGrid>
        <AirQualityCard />
        <ComfortCard units={units} />
        <UvCard />
      </CardGrid>
      <div className="mt-5">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3 dark:text-white/45">
            <Activity size={14} aria-hidden="true" /> {t("health.tip", "Health tips")}
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-ink-2 dark:text-white/60">
            <li>{t("health.stayHydrated", "Hydrate often, especially on warm or active days.")}</li>
            <li>{t("health.limitSun", "Limit direct sun between 11:00 and 15:00 and use sunscreen.")}</li>
          </ul>
        </Card>
      </div>

      <div className="panel mt-6 p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
            <MessageCircleHeart size={17} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink dark:text-white">WeatherGPT Wellness</h2>
            <p className="text-xs text-ink-3 dark:text-white/40">Weather-aware comfort guidance for your location</p>
          </div>
        </div>
        <p className="mb-3 flex items-start gap-2 rounded-xl border border-teal-300/60 bg-teal-500/5 px-3 py-2 text-xs leading-relaxed text-teal-700 dark:border-teal-400/25 dark:text-teal-200">
          <Waves size={13} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            General wellness information only — not medical advice. This assistant does not diagnose
            conditions or prescribe treatment. For health concerns, please consult a qualified
            healthcare professional.
          </span>
        </p>
        <ChatWindow
          messages={chat.messages}
          input={chat.input}
          setInput={chat.setInput}
          loading={chat.loading}
          error={chat.error}
          onSend={chat.send}
          onRegenerate={chat.regenerateLast}
          placeholder="Ask about comfort, hydration, staying cool…"
          suggested={HEALTH_QUESTIONS}
          disabled={!chat.configured || state.status !== "success"}
          disabledHint={
            state.status !== "success"
              ? "Search for a location first so answers can use your real weather."
              : t("ai.notConfiguredHint", "Ask an administrator to set AI_PROVIDER and AI_API_KEY.")
          }
          onClear={chat.clear}
        />
      </div>
    </div>
  );
}