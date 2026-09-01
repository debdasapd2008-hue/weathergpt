import { Droplets } from "lucide-react";
import type { WeatherResponse } from "@weathergpt/shared";
import { EditorialLabel } from "@/components/Editorial";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";
import { formatTemp, type UnitSystem } from "@/lib/units";
import { WeatherIcon } from "./WeatherIcon";

export function DailyForecast({
  data,
  units = "metric",
  index,
}: {
  data: WeatherResponse;
  units?: UnitSystem;
  index?: string;
}) {
  const { t } = useI18n();
  const lows = data.daily.map((day) => day.low);
  const highs = data.daily.map((day) => day.high);
  const lowMin = Math.min(...lows);
  const highMax = Math.max(...highs);
  const span = highMax - lowMin || 1;

  return (
    <section aria-label="Daily forecast" className="panel animate-fade-up p-5">
      <EditorialLabel index={index}>{t("home.daily", "Next 7 Days")}</EditorialLabel>
      <ul className="mt-1 divide-y divide-line-2 dark:divide-white/5">
        {data.daily.map((day, index) => {
          const left = ((day.low - lowMin) / span) * 100;
          const width = ((day.high - day.low) / span) * 100;
          const rainy = day.precipitationProbability > 20;
          return (
            <li key={`${day.day}-${index}`} className="flex items-center gap-3 py-3">
              <span
                className={cn(
                  "w-12 shrink-0 text-sm",
                  index === 0 ? "font-semibold text-teal-700 dark:text-teal-300" : "font-medium",
                )}
              >
                {index === 0 ? t("common.today", "Today") : day.day}
              </span>
              <span className="w-7 shrink-0">
                <WeatherIcon
                  icon={day.icon}
                  condition={data.current.condition}
                  size={24}
                  className="text-ink/75 dark:text-teal-100/75"
                />
              </span>
              <span
                className={cn(
                  "flex w-11 shrink-0 items-center gap-1 text-xs tabular-nums",
                  rainy ? "font-medium text-azure" : "text-ink-3 dark:text-white/35",
                )}
              >
                <Droplets size={11} aria-hidden="true" />
                {formatPercent(day.precipitationProbability)}
              </span>

              <span
                className="relative hidden h-1.5 flex-1 rounded-full bg-line-2 sm:block dark:bg-white/10"
                aria-label={`${t("common.low", "Low")} ${formatTemp(day.low, units)}, ${t("common.high", "High")} ${formatTemp(day.high, units)}`}
              >
                <span
                  className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-aqua to-teal-500"
                  style={{ left: `${left}%`, width: `${Math.max(width, 4)}%` }}
                />
              </span>

              <span className="w-20 shrink-0 text-right text-sm tabular-nums">
                <span className="font-semibold">{formatTemp(day.high, units)}</span>
                <span className="ml-1.5 text-ink-3 dark:text-white/45">{formatTemp(day.low, units)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}