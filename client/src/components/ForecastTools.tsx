import {
  CloudMoon,
  CornerUpRight,
  Leaf,
  Lightbulb,
  Shirt,
  Sparkles,
  Sun,
  Timer,
  Umbrella,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { WeatherResponse } from "@weathergpt/shared";
import { EditorialLabel } from "@/components/Editorial";
import { useI18n } from "@/i18n";
import {
  bestTimeToday,
  outdoorComfort,
  umbrellaCheck,
  weatherMood,
  whatToWear,
} from "@/lib/weatherTools";
import { weatherFactOfTheDay } from "@/lib/weatherFacts";
import { formatPercent } from "@/lib/format";
import { formatTemp, type UnitSystem } from "@/lib/units";

interface ForecastToolsProps {
  weather?: WeatherResponse | null;
  units: UnitSystem;
  onExplainForecast?: () => void;
  index?: string;
}

function ToolCard({
  icon: Icon,
  title,
  sub,
  tint,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  tint: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel-hover panel flex flex-col gap-2 rounded-2xl p-4">
      <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600/10 ${tint}`}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-3 dark:text-white/45">{title}</p>
      <p className="-mt-2 text-xs text-ink-3 dark:text-white/40">{sub}</p>
      {children}
      {action && <div className="mt-auto pt-1">{action}</div>}
    </div>
  );
}

export function ForecastTools({ weather, units, onExplainForecast, index }: ForecastToolsProps) {
  const { t } = useI18n();
  if (!weather) return null;
  const { current, hourly, daily } = weather;

  const best = bestTimeToday(hourly);
  const umbrella = umbrellaCheck(current, hourly);

  return (
    <section
      aria-label={t("tools.title", "Forecast tools")}
      className="panel animate-fade-up p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={14} aria-hidden="true" className="text-ink-3 dark:text-white/45" />
        <div className="flex flex-1 items-center gap-3">
          <EditorialLabel index={index}>{t("tools.title", "Forecast tools")}</EditorialLabel>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ToolCard
          icon={CloudMoon}
          title={t("tools.mood", "Weather mood")}
          sub={t("tools.moodSub", "A short feel for the current conditions")}
          tint="text-teal-600"
        >
          <p className="text-sm leading-relaxed text-ink-2 dark:text-white/70">
            {weatherMood(current)}
          </p>
        </ToolCard>

        <ToolCard
          icon={Shirt}
          title={t("tools.wear", "What to wear")}
          sub={t("tools.wearSub", "Clothing ideas for today")}
          tint="text-peach"
        >
          <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed text-ink-2 dark:text-white/70">
            {whatToWear(current, daily).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ToolCard>

        <ToolCard
          icon={Umbrella}
          title={t("tools.umbrella", "Umbrella check")}
          sub={t("tools.umbrellaSub", "Rain recommendation")}
          tint="text-azure"
        >
          <p className="text-sm leading-relaxed text-ink-2 dark:text-white/70">{umbrella.text}</p>
        </ToolCard>

        <ToolCard
          icon={Sun}
          title={t("tools.goOut", "Should I go out?")}
          sub={t("tools.goOutSub", "Quick outdoor comfort check")}
          tint="text-amber-600"
        >
          <p className="text-sm leading-relaxed text-ink-2 dark:text-white/70">
            {outdoorComfort(current)}
          </p>
        </ToolCard>

        <ToolCard
          icon={Timer}
          title={t("tools.bestTime", "Best time today")}
          sub={t("tools.bestTimeSub", "The nicest outdoor window")}
          tint="text-emerald-600"
        >
          {best ? (
            <div>
              <p className="text-sm leading-relaxed text-ink-2 dark:text-white/70">
                {best.start}–{best.end}
              </p>
              <p className="mt-1 text-xs text-ink-3 dark:text-white/40">
                ≈ {formatTemp(best.averageTemp, units)} · up to {formatPercent(best.maxRain)} rain
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-3 dark:text-white/40">No hourly forecast available.</p>
          )}
        </ToolCard>

        <ToolCard
          icon={Lightbulb}
          title={t("tools.fact", "Weather fact of the day")}
          sub={t("tools.factSub", "A small, true weather idea")}
          tint="text-indigo-600"
        >
          <p className="text-sm leading-relaxed text-ink-2 dark:text-white/70">
            {weatherFactOfTheDay()}
          </p>
        </ToolCard>
      </div>

      {onExplainForecast && (
        <button
          type="button"
          onClick={onExplainForecast}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-teal-400/40 bg-teal-500/5 px-4 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-500/10 active:scale-[0.99] dark:border-teal-400/20 dark:text-teal-300"
        >
          <Leaf size={16} aria-hidden="true" />
          {t("tools.explainForecast", "Explain my forecast")}
          <CornerUpRight size={14} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}