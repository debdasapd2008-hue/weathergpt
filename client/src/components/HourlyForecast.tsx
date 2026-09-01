import { Droplets } from "lucide-react";
import type { WeatherResponse } from "@weathergpt/shared";
import { EditorialLabel } from "@/components/Editorial";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";
import { formatTemp, type UnitSystem } from "@/lib/units";
import { isNight, weatherGroup } from "@/lib/weatherVisual";
import { WeatherIcon } from "./WeatherIcon";

export function HourlyForecast({
  data,
  units = "metric",
  index,
}: {
  data: WeatherResponse;
  units?: UnitSystem;
  index?: string;
}) {
  const { t } = useI18n();
  return (
    <section aria-label="24-hour forecast" className="panel animate-fade-up p-5">
      <div className="mb-4 flex items-center justify-between">
        <EditorialLabel index={index}>{t("home.hourly", "24-Hour Outlook")}</EditorialLabel>
      </div>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {data.hourly.map((hour, index) => {
          const rainy = hour.precipitationProbability > 20;
          const visual = (
            <WeatherIcon
              icon={hour.icon}
              condition={data.current.condition}
              size={34}
              className={cn(
                "drop-shadow-sm",
                isNight(hour.icon) || weatherGroup(hour.icon) === "clear"
                  ? "text-ink/80 dark:text-teal-100/80"
                  : "text-ink/70 dark:text-teal-100/70",
              )}
            />
          );
          const clickableIcon = (
            <span
              className="relative flex items-center justify-center"
              title={t("common.condition", "Condition")}
            >
              {visual}
              {hour.precipitationProbability >= 50 && (
                <span className="absolute -bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-azure/85 text-[9px] font-bold text-white">
                  <Droplets size={9} aria-hidden="true" />
                </span>
              )}
            </span>
          );
          return (
            <div
              key={`${hour.time}-${index}`}
              className={cn(
                "flex min-w-[80px] flex-col items-center gap-2 rounded-2xl border border-transparent px-2 py-3 transition",
                index === 0
                  ? "border-teal-500/30 bg-teal-600/5 dark:bg-teal-400/10"
                  : "hover:border-line-2 hover:bg-white/80 dark:hover:border-white/10 dark:hover:bg-white/[0.04]",
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium",
                  index === 0 ? "text-teal-700 dark:text-teal-300" : "text-ink-3 dark:text-white/40",
                )}
              >
                {index === 0 ? t("home.now", "Now") : hour.time.slice(0, 5)}
              </span>
              {clickableIcon}
              <span className="text-sm font-semibold tabular-nums">
                {formatTemp(hour.temperature, units)}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 text-[11px] tabular-nums",
                  rainy ? "font-medium text-azure" : "text-ink-3 dark:text-white/35",
                )}
              >
                <Droplets size={11} aria-hidden="true" />
                {formatPercent(hour.precipitationProbability)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}