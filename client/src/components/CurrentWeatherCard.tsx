import { Droplets, Eye, Gauge, MapPin, Sparkles, Sun, Umbrella, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CurrentWeather } from "@weathergpt/shared";
import { WeatherVisual } from "@/components/Editorial";
import { useI18n } from "@/i18n";
import { uvIndexLabel } from "@/lib/format";
import { heroCopy } from "@/lib/headline";
import { formatTemp, formatVisibilityDistance, formatWindSpeed, type UnitSystem } from "@/lib/units";
import { WeatherIcon } from "./WeatherIcon";

interface Metric {
  label: string;
  value: string;
  icon: LucideIcon;
  tint: string;
}

function metrics(current: CurrentWeather, units: UnitSystem, label: (key: string, fallback?: string) => string): Metric[] {
  return [
    { label: label("common.humidity", "Humidity"), value: `${current.humidity}%`, icon: Droplets, tint: "text-teal-600" },
    { label: label("common.wind", "Wind"), value: formatWindSpeed(current.windSpeed, units), icon: Wind, tint: "text-azure" },
    { label: label("common.pressure", "Pressure"), value: `${Math.round(current.pressure)} hPa`, icon: Gauge, tint: "text-peach" },
    { label: label("common.visibility", "Visibility"), value: formatVisibilityDistance(current.visibility, units), icon: Eye, tint: "text-emerald-600" },
    { label: label("common.uvIndex", "UV index"), value: uvIndexLabel(current.uvIndex), icon: Sun, tint: "text-amber-600" },
    { label: label("common.precipitation", "Precipitation"), value: `${Math.max(0, current.precipitation).toFixed(1)} mm`, icon: Umbrella, tint: "text-azure" },
  ];
}

function metricAskQuestion(metric: Metric, city: string): string {
  return `What does ${metric.label.toLowerCase()} (${metric.value}) mean for today's weather in ${city}? Explain it simply.`;
}

export function CurrentWeatherCard({
  data,
  units = "metric",
  onAskMetric,
}: {
  data: CurrentWeather;
  units?: UnitSystem;
  onAskMetric?: (question: string) => void;
}) {
  const { t } = useI18n();
  const hero = heroCopy(data);

  return (
    <section
      aria-label="Current weather"
      className="panel relative animate-fade-up overflow-hidden p-6 sm:p-8"
    >
      <WeatherVisual icon={data.icon} condition={data.condition} />

      <div className="relative z-10">
        <p className="editorial-label">
          <span className="index">01</span>
          <span aria-hidden="true" className="h-px w-6 bg-ink-3/40 dark:bg-white/25" />
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} aria-hidden="true" />
            {data.city}
            {data.country ? `, ${data.country}` : ""}
          </span>
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-8">
          <div className="min-w-[200px]">
            <p className="font-display text-xl italic text-ink-2 dark:text-white/60">
              {hero.pre}
            </p>
            <h2 className="mt-1 font-display text-4xl font-medium leading-[1.02] tracking-tight text-ink dark:text-white sm:text-[3.4rem]">
              {hero.accent}
            </h2>
            <p className="mt-3 text-sm text-ink-2 dark:text-white/70">
              {t("common.feelsLike", "Feels like")} {formatTemp(data.feelsLike, units)} ·{" "}
              <span className="capitalize">{data.description}</span>
            </p>
          </div>

          <div className="flex items-center gap-5">
            <WeatherIcon
              icon={data.icon}
              condition={data.condition}
              size={110}
              className="text-ink/85 drop-shadow-md dark:text-teal-200/90"
            />
            <span className="font-display text-[4.6rem] font-medium leading-none tracking-tight text-ink dark:text-white sm:text-[6rem]">
              {formatTemp(data.temperature, units)}
            </span>
          </div>
        </div>

        <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink-2 dark:text-white/60">
          {hero.context}
        </p>

        <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {metrics(data, units, t).map(({ label, value, icon: Icon, tint }) => {
            const interactive = Boolean(onAskMetric);
            const inner = (
              <>
                <span className={`shrink-0 rounded-xl bg-white/60 p-2 dark:bg-white/5 ${tint}`}>
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span className="min-w-0 text-left">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-3 dark:text-white/40">{label}</dt>
                  <dd className="truncate text-sm font-semibold">{value}</dd>
                </span>
              </>
            );
            const baseClass =
              "flex items-center gap-2.5 rounded-2xl border border-line bg-white/70 px-3 py-3 dark:border-white/5 dark:bg-navy-night/40";
            if (!interactive) {
              return (
                <div key={label} className={`${baseClass} transition hover:-translate-y-0.5`}>
                  {inner}
                </div>
              );
            }
            return (
              <button
                key={label}
                type="button"
                onClick={() => onAskMetric?.(metricAskQuestion({ label, value, icon: Icon, tint }, data.city))}
                title={`Ask WeatherGPT about ${label}`}
                aria-label={`Ask WeatherGPT about ${label} (${value})`}
                className={`${baseClass} cursor-pointer transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 dark:hover:border-teal-400/30`}
              >
                {inner}
              </button>
            );
          })}
        </dl>
        {onAskMetric && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-3 dark:text-white/40">
            <Sparkles size={12} aria-hidden="true" /> {t("home.tapMetric", "Tap any metric to ask WeatherGPT about it.")}
          </p>
        )}
      </div>
    </section>
  );
}