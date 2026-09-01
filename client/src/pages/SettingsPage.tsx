import { CheckCircle2, DatabaseZap, Globe, Palette, Ruler, Settings, HeartPulse, MessagesSquare } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/cn";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/stores/settings";
import { useWeatherData } from "@/stores/weatherData";
import { Card, PageHeader } from "@/components/Page";
import { ChatStylePicker } from "@/components/ChatStylePicker";
import { LanguageSelect } from "@/components/LanguageSelect";

function RadioOption({
  selected,
  onSelect,
  label,
  sub,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-4 text-left transition",
        selected
          ? "border-teal-500/60 bg-teal-600/10"
          : "panel-hover border-line bg-white/60",
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-teal-600 bg-teal-600 text-white" : "border-line dark:border-white/25",
        )}
      >
        {selected && <CheckCircle2 size={13} aria-hidden="true" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink dark:text-white">{label}</span>
        <span className="block text-xs text-ink-3 dark:text-white/40">{sub}</span>
      </span>
    </button>
  );
}

export function SettingsPage() {
  const { t } = useI18n();
  const { units, setUnits, showAirQuality, setShowAirQuality, chatStyle, setChatStyle } = useSettings();
  const { mode, setMode } = useTheme();
  const { clearCache, refresh } = useWeatherData();
  const [cleared, setCleared] = useState(false);

  return (
    <div>
      <PageHeader
        icon={Settings}
        title={t("nav.settings", "Settings")}
        intro={t("appName", "WeatherGPT")}
        index="16"
      />

      <div className="space-y-5">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3 dark:text-white/45">
            <Ruler size={14} aria-hidden="true" /> {t("settings.units", "Units")}
          </h2>
          <p className="mb-3 text-xs text-ink-3 dark:text-white/40">
            {t("settings.unitsHint", "Choose how temperature, wind, visibility and rain are shown.")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("settings.unitSystem", "Unit system")}>
            <RadioOption
              selected={units === "metric"}
              onSelect={() => setUnits("metric")}
              label="Metric (°C)"
              sub="Celsius, m/s, km, mm"
            />
            <RadioOption
              selected={units === "imperial"}
              onSelect={() => setUnits("imperial")}
              label="Imperial (°F)"
              sub="Fahrenheit, mph, mi, in"
            />
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3 dark:text-white/45">
            <HeartPulse size={14} aria-hidden="true" /> {t("settings.airQuality", "Air quality")}
          </h2>
          <button
            type="button"
            role="switch"
            aria-checked={showAirQuality}
            onClick={() => setShowAirQuality(!showAirQuality)}
            className="panel flex w-full items-center justify-between gap-3 p-4 text-left"
          >
            <span>
              <span className="block text-sm font-semibold text-ink dark:text-white">
                {t("settings.showAirQuality", "Show the air quality card")}
              </span>
              <span className="block text-xs text-ink-3 dark:text-white/40">
                {t("health.airQuality", "Air quality")} (AQI, PM2.5, PM10)
              </span>
            </span>
            <span
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition",
                showAirQuality ? "bg-teal-600" : "bg-line dark:bg-white/20",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                  showAirQuality ? "left-[22px]" : "left-0.5",
                )}
              />
            </span>
          </button>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3 dark:text-white/45">
            <Globe size={14} aria-hidden="true" /> {t("settings.language", "Language")}
          </h2>
          <p className="mb-3 text-xs text-ink-3 dark:text-white/40">
            {t("settings.interfaceLanguage", "Interface & AI language")}
          </p>
          <LanguageSelect />
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3 dark:text-white/45">
            <MessagesSquare size={14} aria-hidden="true" /> {t("settings.chatLanguage", "Chat language & style")}
          </h2>
          <p className="mb-3 text-xs text-ink-3 dark:text-white/40">
            {t("settings.chatLanguageHint", "Choose how WeatherGPT replies. This is independent from the interface language — for example, you can keep the app in English and chat in Hinglish.")}
          </p>
          <ChatStylePicker value={chatStyle} onChange={setChatStyle} />
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3 dark:text-white/45">
            <Palette size={14} aria-hidden="true" /> {t("settings.theme", "Theme")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label={t("settings.theme", "Theme")}>
            <RadioOption
              selected={mode === "light"}
              onSelect={() => setMode("light")}
              label={t("settings.themeLight", "Light")}
              sub="Warm paper"
            />
            <RadioOption
              selected={mode === "dark"}
              onSelect={() => setMode("dark")}
              label={t("settings.themeDark", "Dark")}
              sub="Night sky"
            />
            <RadioOption
              selected={mode === "system"}
              onSelect={() => setMode("system")}
              label={t("settings.themeSystem", "System")}
              sub="Follow the device"
            />
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3 dark:text-white/45">
            <DatabaseZap size={14} aria-hidden="true" /> {t("settings.data", "Data")}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                clearCache();
                setCleared(true);
                window.setTimeout(() => setCleared(false), 2500);
              }}
              className="btn-ghost"
            >
              <DatabaseZap size={15} aria-hidden="true" /> {t("settings.clearCache", "Clear cached weather")}
            </button>
            <button type="button" onClick={refresh} className="btn-ghost">
              {t("common.retry", "Try again")}
            </button>
          </div>
          {cleared && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-500">
              <CheckCircle2 size={15} aria-hidden="true" /> {t("settings.cacheCleared", "Cached weather cleared.")}
            </p>
          )}
          <p className="mt-4 text-xs text-ink-3 dark:text-white/40">
            {t("settings.savedPlacesManaged", "Saved places are managed on the Saved Places page.")}
          </p>
        </Card>
      </div>
    </div>
  );
}