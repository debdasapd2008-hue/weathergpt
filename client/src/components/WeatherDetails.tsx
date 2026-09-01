import { Droplets, Eye, Gauge, LayoutGrid, Sun, Sunrise, Sunset, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CurrentWeather } from "@weathergpt/shared";
import { EditorialLabel } from "@/components/Editorial";
import { useI18n } from "@/i18n";
import { compassDirection, uvIndexLabel } from "@/lib/format";
import { formatVisibilityDistance, formatWindSpeed, type UnitSystem } from "@/lib/units";

function Detail({
  icon: Icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/60 px-3 py-3.5 dark:border-white/5 dark:bg-navy-night/40">
      <span className={`shrink-0 rounded-xl bg-white/60 p-2 dark:bg-white/5 ${tint}`}>
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-3 dark:text-white/40">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
        {sub && <p className="truncate text-xs text-ink-3 dark:text-white/40">{sub}</p>}
      </div>
    </div>
  );
}

export function WeatherDetails({
  data,
  units = "metric",
  index,
}: {
  data: CurrentWeather;
  units?: UnitSystem;
  index?: string;
}) {
  const { t } = useI18n();
  return (
    <section aria-label="Weather details" className="panel animate-fade-up p-5">
      <div className="mb-4 flex items-center gap-2">
        <LayoutGrid size={14} aria-hidden="true" className="text-ink-3 dark:text-white/45" />
        <EditorialLabel index={index}>{t("home.details", "In Detail")}</EditorialLabel>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Detail icon={Sunrise} label={t("common.sunrise", "Sunrise")} value={data.sunrise} tint="text-orange-600" />
        <Detail icon={Sunset} label={t("common.sunset", "Sunset")} value={data.sunset} tint="text-peach" />
        <Detail icon={Droplets} label={t("common.humidity", "Humidity")} value={`${data.humidity}%`} tint="text-teal-600" />
        <Detail
          icon={Wind}
          label={t("common.wind", "Wind")}
          value={formatWindSpeed(data.windSpeed, units)}
          sub={`from the ${compassDirection(data.windDirection)}`}
          tint="text-azure"
        />
        <Detail icon={Gauge} label={t("common.pressure", "Pressure")} value={`${Math.round(data.pressure)} hPa`} tint="text-peach" />
        <Detail icon={Eye} label={t("common.visibility", "Visibility")} value={formatVisibilityDistance(data.visibility, units)} tint="text-emerald-600" />
        <Detail icon={Sun} label={t("common.uvIndex", "UV index")} value={uvIndexLabel(data.uvIndex)} tint="text-amber-600" />
      </div>
    </section>
  );
}