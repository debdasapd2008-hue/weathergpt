import { ArrowRightLeft, Loader2, MapPin, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { CurrentWeather, WeatherResponse } from "@weathergpt/shared";
import { EditorialLabel } from "@/components/Editorial";
import { useI18n } from "@/i18n";
import { api, ApiError } from "@/lib/api";
import { formatPercent } from "@/lib/format";
import { formatTemp, formatWindSpeed, type UnitSystem } from "@/lib/units";

interface CompareRow {
  label: string;
  base: string;
  other: string;
  better?: "left" | "right";
}

function compareRows(base: WeatherResponse, other: WeatherResponse, units: UnitSystem): CompareRow[] {
  const baseHourly = base.hourly;
  const otherHourly = other.hourly;
  const baseRain = baseHourly.length
    ? Math.max(...baseHourly.map((h) => h.precipitationProbability))
    : base.current.precipitation > 0
      ? 100
      : 0;
  const otherRain = otherHourly.length
    ? Math.max(...otherHourly.map((h) => h.precipitationProbability))
    : other.current.precipitation > 0
      ? 100
      : 0;
  const todayHigh = (w: WeatherResponse) => w.daily[0]?.high ?? w.current.temperature;
  const todayLow = (w: WeatherResponse) => w.daily[0]?.low ?? w.current.temperature;

  return [
    { label: "Temperature", base: formatTemp(base.current.temperature, units), other: formatTemp(other.current.temperature, units) },
    { label: "Feels like", base: formatTemp(base.current.feelsLike, units), other: formatTemp(other.current.feelsLike, units) },
    { label: "High / Low", base: `${formatTemp(todayHigh(base), units)} / ${formatTemp(todayLow(base), units)}`, other: `${formatTemp(todayHigh(other), units)} / ${formatTemp(todayLow(other), units)}` },
    { label: "Rain chance today", base: formatPercent(baseRain), other: formatPercent(otherRain), better: baseRain <= otherRain ? "left" : "right" },
    { label: "Humidity", base: `${base.current.humidity}%`, other: `${other.current.humidity}%` },
    { label: "Wind", base: formatWindSpeed(base.current.windSpeed, units), other: formatWindSpeed(other.current.windSpeed, units) },
    { label: "Pressure", base: `${Math.round(base.current.pressure)} hPa`, other: `${Math.round(other.current.pressure)} hPa` },
    { label: "UV index", base: `${Math.round(base.current.uvIndex)}`, other: `${Math.round(other.current.uvIndex)}` },
    { label: "Visibility", base: `${base.current.visibility.toLocaleString()} m`, other: `${other.current.visibility.toLocaleString()} m` },
    { label: "Conditions", base: base.current.condition, other: other.current.condition },
  ];
}

function cityLabel(current: CurrentWeather): string {
  return current.country ? `${current.city}, ${current.country}` : current.city;
}

export function WeatherCompare({
  base,
  units,
  index,
}: {
  base: WeatherResponse;
  units: UnitSystem;
  index?: string;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [other, setOther] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const city = query.trim();
    if (!city || loading) return;
    setLoading(true);
    setError(null);
    setOther(null);
    void api
      .getWeatherByCity(city)
      .then(setOther)
      .catch((requestError: unknown) => {
        const apiError = requestError instanceof ApiError ? requestError : null;
        setError(apiError?.message ?? "Could not load that city.");
      })
      .finally(() => setLoading(false));
  }

  const rows = other ? compareRows(base, other, units) : [];

  return (
    <section
      aria-label={t("tools.compare", "Weather compare")}
      className="panel animate-fade-up p-5"
    >
      <div className="mb-2 flex items-center gap-2">
        <ArrowRightLeft size={14} aria-hidden="true" className="text-ink-3 dark:text-white/45" />
        <EditorialLabel index={index}>{t("tools.compare", "Weather compare")}</EditorialLabel>
      </div>
      <p className="text-xs text-ink-3 dark:text-white/40">{t("tools.compareHint", "Pick a second city to compare current conditions side by side.")}</p>

      <form onSubmit={handleSubmit} className="mt-3 flex max-w-md items-center gap-2">
        <label className="sr-only" htmlFor="compare-city">
          {t("tools.comparePlaceholder", "Other city, e.g. Mumbai")}
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-line bg-white/80 pl-3 pr-1.5 transition focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/25 dark:border-white/10 dark:bg-white/[0.06]">
          <MapPin size={15} className="shrink-0 text-ink-3 dark:text-white/35" aria-hidden="true" />
          <input
            id="compare-city"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("tools.comparePlaceholder", "Other city, e.g. Mumbai")}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-ink-3 dark:placeholder:text-white/35"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-primary h-11 w-11 !px-0"
          aria-label={t("tools.compareButton", "Compare")}
        >
          {loading ? (
            <Loader2 size={17} aria-hidden="true" className="animate-spin" />
          ) : (
            <Search size={17} aria-hidden="true" />
          )}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2.5 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}

      {other && rows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-3 dark:border-white/10 dark:text-white/40">
                <th scope="col" className="pb-2 pr-4 font-medium">Metric</th>
                <th scope="col" className="pb-2 pr-4 font-semibold text-teal-700 dark:text-teal-300">
                  {cityLabel(base.current)}
                </th>
                <th scope="col" className="pb-2 font-semibold text-azure">
                  {cityLabel(other.current)} ({t("tools.comparedAt", "Compared with")})
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-line-2 last:border-0 dark:border-white/5">
                  <td className="py-2 pr-4 text-ink-2 dark:text-white/60">{row.label}</td>
                  <td className={`py-2 pr-4 tabular-nums ${row.better === "left" ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}`}>
                    {row.base}
                    {row.better === "left" && " ✓"}
                  </td>
                  <td className={`py-2 tabular-nums ${row.better === "right" ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}`}>
                    {row.other}
                    {row.better === "right" && " ✓"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-ink-3 dark:text-white/40">
            ✓ marks the lower rain chance. All values come from the OpenWeatherMap forecast.
          </p>
        </div>
      )}
    </section>
  );
}