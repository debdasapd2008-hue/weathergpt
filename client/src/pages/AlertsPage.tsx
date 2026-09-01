import { AlertTriangle, CloudSun, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n";
import { useWeatherData } from "@/stores/weatherData";
import { Card, PageHeader } from "@/components/Page";
import { EditorialLabel } from "@/components/Editorial";

interface Advisory {
  severity: "blue" | "amber" | "red";
  title: string;
  detail: string;
}

function computeAdvisories(hourly: { precipitationProbability: number }[], daily: { high: number; precipitationProbability: number }[]): Advisory[] {
  const advice: Advisory[] = [];
  let maxPop = 0;
  for (const hour of hourly) maxPop = Math.max(maxPop, hour.precipitationProbability);
  if (maxPop >= 80) {
    advice.push({ severity: "red", title: "Heavy rain expected", detail: `Rain chance peaks at ${maxPop}% in the next 24 hours.` });
  } else if (maxPop >= 40) {
    advice.push({ severity: "amber", title: "Rain likely", detail: `Rain chance peaks at ${maxPop}% in the next 24 hours.` });
  }
  if (daily.length > 0) {
    const hottest = Math.max(...daily.map((day) => day.high));
    if (hottest >= 35) {
      advice.push({ severity: "amber", title: "Very hot daytime peak", detail: `Daytime temperatures will reach ${Math.round(hottest)}°C.` });
    }
  }
  if (advice.length === 0) {
    advice.push({ severity: "blue", title: "All clear", detail: "No notable conditions in the current forecast." });
  }
  return advice;
}

const SEVERITY_LABEL = {
  blue: "INFO",
  amber: "MODERATE",
  red: "SEVERE",
} as const;

const SEVERITY_CLASS = {
  blue: "border-teal-300/60 bg-teal-500/5 text-teal-700 dark:text-teal-200",
  amber: "border-amber-300/70 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  red: "border-rose-300/70 bg-rose-500/10 text-rose-700 dark:text-rose-300",
} as const;

export function AlertsPage() {
  const { t } = useI18n();
  const { state } = useWeatherData();

  const official = state.status === "success" ? state.data.alerts : [];
  const advisories = state.status === "success" ? computeAdvisories(state.data.hourly, state.data.daily) : [];

  return (
    <div>
      <PageHeader
        icon={ShieldCheck}
        title={t("nav.alerts", "Alerts & Local")}
        intro={t("alerts.officialNote", "Only warnings published by the weather provider appear here.")}
        index="06"
      />

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle size={14} aria-hidden="true" className="text-ink-3 dark:text-white/45" />
          <EditorialLabel index="A">{t("alerts.active", "Active alerts")}</EditorialLabel>
        </div>
        {state.status !== "success" ? (
          <p className="text-sm text-ink-3 dark:text-white/40">{t("common.loading", "Loading…")}</p>
        ) : official.length === 0 ? (
          <div className="flex flex-col items-start gap-2 rounded-2xl border border-emerald-300/70 bg-emerald-500/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck size={16} aria-hidden="true" /> {t("alerts.none", "No official alerts right now.")}
            </p>
            <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70">
              {t("alerts.neverInvented", "No alerts are invented — if none are shown, none are active.")}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {official.map((alert, index) => (
              <li
                key={`${alert.event}-${index}`}
                className="rounded-2xl border border-amber-300/70 bg-amber-500/10 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                    SEVERE
                  </span>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    {alert.event}
                  </p>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-amber-700/80 dark:text-amber-300/80">
                  {alert.description}
                </p>
                <p className="mt-2 text-xs text-amber-700/60 dark:text-amber-300/60">
                  {alert.source} · {t("alerts.from", "From")}{" "}
                  {new Date(alert.start).toLocaleString()} {t("alerts.to", "to")}{" "}
                  {new Date(alert.end).toLocaleString()}
                  {alert.tags.length > 0 ? ` · ${alert.tags.join(", ")}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-5">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <CloudSun size={14} aria-hidden="true" className="text-ink-3 dark:text-white/45" />
            <EditorialLabel index="B">
              {t("alerts.title", "Alerts & Local")} — {t("common.today", "Today")}
            </EditorialLabel>
          </div>
          <ul className="space-y-3">
            {advisories.map((item) => (
              <li
                key={item.title}
                className={`flex items-start gap-3 rounded-2xl border p-4 ${SEVERITY_CLASS[item.severity]}`}
              >
                <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
                        item.severity === "red"
                          ? "bg-rose-500/15"
                          : item.severity === "amber"
                            ? "bg-amber-500/15"
                            : "bg-teal-500/15"
                      }`}
                    >
                      {SEVERITY_LABEL[item.severity]}
                    </span>
                    <p className="text-sm font-semibold">{item.title}</p>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] opacity-60">
                    WeatherGPT advisory — not official
                  </p>
                  <p className="mt-1 text-xs opacity-80">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-3 dark:text-white/40">
            Computed locally from the current forecast. Always follow official warnings first.
          </p>
        </Card>
      </div>
    </div>
  );
}