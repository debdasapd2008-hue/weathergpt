import { CalendarClock, Droplets, Sun } from "lucide-react";
import { useI18n } from "@/i18n";
import { formatPercent } from "@/lib/format";
import { useSettings } from "@/stores/settings";
import { useWeatherData } from "@/stores/weatherData";
import { formatTemp, formatWindSpeed, type UnitSystem } from "@/lib/units";
import { Card, PageHeader } from "@/components/Page";
import { ErrorState, GeoAlert, SearchPrompt } from "@/components/States";
import { WeatherSkeleton } from "@/components/Skeleton";
import { WeatherCompare } from "@/components/WeatherCompare";
import { WeatherIcon } from "@/components/WeatherIcon";
import { DailyForecast } from "@/components/DailyForecast";
import { RainBars, TemperatureTrend } from "@/components/WeatherCharts";
import { EditorialLabel } from "@/components/Editorial";

export function ForecastPage() {
  const { state, geoError, locate } = useWeatherData();
  const { units } = useSettings();
  const { t } = useI18n();

  return (
    <div>
      <PageHeader
        icon={CalendarClock}
        title={t("nav.forecast", "Detailed Forecast")}
        intro={t("travellers.intro", "What to expect hour by hour and day by day.")}
        index="02"
      />
      {geoError && <GeoAlert message={geoError} onRetry={locate} />}
      {state.status === "idle" && <SearchPrompt onSearch={locate} />}
      {state.status === "loading" && <WeatherSkeleton />}
      {state.status === "error" && (
        <ErrorState code={state.code} message={state.message} onRetry={state.retry} />
      )}
      {state.status === "success" && (
        <div className="space-y-5">
          <HourlyTable units={units} index="03" />
          <DailyForecast data={state.data} units={units} index="04" />
          <LongRangeSummary units={units} index="05" />
          <WeatherCompare base={state.data} units={units} index="06" />
        </div>
      )}
    </div>
  );
}

function HourlyTable({ units, index }: { units: UnitSystem; index: string }) {
  const { state } = useWeatherData();
  const { t } = useI18n();
  if (state.status !== "success") return null;

  const hours = state.data.hourly.map((h) => ({
    time: h.time,
    temperature: h.temperature,
    precipitationProbability: h.precipitationProbability,
  }));

  return (
    <Card>
      <div className="mb-4">
        <EditorialLabel index={index}>{t("common.hourly", "Hourly")}</EditorialLabel>
      </div>
      <TemperatureTrend hours={hours} units={units} className="mb-6" />
      <RainBars hours={hours} className="mb-6" />
      <div className="no-scrollbar overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-3 dark:border-white/10 dark:text-white/40">
              <th scope="col" className="pb-2 pr-4 font-medium">{t("common.localTime", "Local time")}</th>
              <th scope="col" className="pb-2 pr-4 font-medium">{t("common.temperature", "Temperature")}</th>
              <th scope="col" className="pb-2 pr-4 font-medium">{t("common.chanceOfRain", "Chance of rain")}</th>
              <th scope="col" className="pb-2 font-medium">Conditions</th>
            </tr>
          </thead>
          <tbody>
            {state.data.hourly.map((hour, rowIndex) => (
              <tr
                key={`${hour.time}-${rowIndex}`}
                className="border-b border-line-2 last:border-0 dark:border-white/5"
              >
                <td className="py-2 pr-4 font-medium">{hour.time}</td>
                <td className="py-2 pr-4 tabular-nums">{formatTemp(hour.temperature, units)}</td>
                <td className="py-2 pr-4 tabular-nums">{formatPercent(hour.precipitationProbability)}</td>
                <td className="py-2">
                  <WeatherIcon
                    icon={hour.icon}
                    condition={state.data.current.condition}
                    size={20}
                    className="text-ink/75 dark:text-teal-100/75"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function LongRangeSummary({ units, index }: { units: UnitSystem; index: string }) {
  const { state } = useWeatherData();
  const { t } = useI18n();
  if (state.status !== "success") return null;

  const days = state.data.daily;
  if (days.length === 0) return null;

  const avgHigh = Math.round(days.reduce((sum, day) => sum + day.high, 0) / days.length);
  const avgLow = Math.round(days.reduce((sum, day) => sum + day.low, 0) / days.length);
  const maxPrecip = Math.max(...days.map((day) => day.precipitationProbability));

  return (
    <Card>
      <div className="mb-4">
        <EditorialLabel index={index}>Outlook</EditorialLabel>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel flex items-center gap-3 p-4">
          <Sun size={20} aria-hidden="true" className="text-teal-600 dark:text-teal-300" />
          <div>
            <p className="text-xs text-ink-3 dark:text-white/40">{t("common.high", "High")}</p>
            <p className="text-lg font-semibold tabular-nums">{formatTemp(avgHigh, units)}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <Sun size={20} aria-hidden="true" className="text-peach" />
          <div>
            <p className="text-xs text-ink-3 dark:text-white/40">{t("common.low", "Low")}</p>
            <p className="text-lg font-semibold tabular-nums">{formatTemp(avgLow, units)}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <Droplets size={20} aria-hidden="true" className="text-azure" />
          <div>
            <p className="text-xs text-ink-3 dark:text-white/40">{t("home.chanceOfRainHome", "Rain chance")}</p>
            <p className="text-lg font-semibold tabular-nums">{formatPercent(maxPrecip)}</p>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-3 dark:text-white/40">
        {formatWindSpeed(state.data.current.windSpeed, units)} ·{" "}
        {t("common.pressure", "Pressure")} {state.data.current.pressure.toFixed(0)} hPa
      </p>
    </Card>
  );
}