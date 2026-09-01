import { Languages } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/i18n";
import { AVAILABLE_LANGUAGES } from "@/i18n/languages";

export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);

  const current =
    AVAILABLE_LANGUAGES.find((entry) => entry.code === language) ?? {
      code: "en",
      native: "English",
      flag: "🌐",
      region: "International",
      tier: "full" as const,
    };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={t("settings.language", "Language")}
        className="flex h-9 items-center gap-1.5 rounded-full border border-line bg-white/80 px-2.5 text-sm text-ink-2 shadow-sm transition hover:border-teal-400 hover:text-teal-700 active:scale-95 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70 dark:hover:border-teal-400/50 dark:hover:text-teal-300"
      >
        <Languages size={15} aria-hidden="true" />
        {!compact && (
          <span className="max-w-24 truncate">{current.flag} {current.native}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-50 mt-2 max-h-80 w-64 overflow-y-auto rounded-2xl border border-line bg-white/95 p-2 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-3 dark:text-white/40">
              {t("settings.language", "Language")}
            </p>
            <p className="px-3 pb-1 text-[11px] leading-snug text-ink-3 dark:text-white/40">
              {t("i18n.autoMatched", "Set to your device language automatically")}
            </p>
            <ul>
              {AVAILABLE_LANGUAGES.map((entry) => (
                <li key={entry.code}>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage(entry.code);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-teal-600/10"
                  >
                    <span aria-hidden="true">{entry.flag}</span>
                    <span className="flex-1">
                      <span className="block font-medium">{entry.native}</span>
                      <span className="block text-xs text-ink-3 dark:text-white/40">{entry.region}</span>
                    </span>
                    {entry.tier !== "full" && (
                      <span
                        className="rounded-full border border-line px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink-3 dark:border-white/15 dark:text-white/45"
                        title={t("i18n.fallbackNote", "Some interface text falls back to English while translations catch up.")}
                      >
                        {entry.tier === "core" ? t("i18n.tierCore", "Core") : t("i18n.tierBeta", "Beta")}
                      </span>
                    )}
                    {entry.code === language && (
                      <span className="h-2 w-2 rounded-full bg-teal-500" aria-label="Selected" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <p className="px-3 pb-1 pt-2 text-[11px] leading-snug text-ink-3 dark:text-white/40">
              {t("i18n.fallbackNote", "Some interface text falls back to English while translations catch up.")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}