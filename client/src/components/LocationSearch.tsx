import { Loader2, MapPin, Search, X } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/cn";
import { useWeatherData } from "@/stores/weatherData";

export function LocationSearch({ className }: { className?: string }) {
  const {
    search,
    searching,
    results,
    searchError,
    clearResults,
    setActive,
  } = useWeatherData();
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim().length >= 2) search(value);
      else clearResults();
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, search, clearResults]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) search(value);
  }

  const showDropdown = focused && (searching || searchError !== null || results.length > 0);

  return (
    <div className={cn("relative", className)}>
      <form role="search" onSubmit={handleSubmit} className="relative">
        <Search
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 dark:text-white/30"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 150);
          }}
          placeholder={t("common.searchPlaceholder", "Search city, district or landmark…")}
          aria-label={t("common.searchPlaceholder", "Search city, district or landmark…")}
          autoComplete="off"
          spellCheck={false}
          className="field-input"
        />
        {searching ? (
          <Loader2
            size={16}
            aria-hidden="true"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-teal-600 dark:text-teal-300"
          />
        ) : (
          value && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                clearResults();
              }}
              aria-label="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 transition hover:text-ink-2 dark:text-white/40 dark:hover:text-white/70"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )
        )}
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-white/95 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
          {searching && (
            <p className="px-4 py-3 text-sm text-ink-2 dark:text-white/50">
              {t("common.searching", "Searching…")}
            </p>
          )}
          {searchError && (
            <p role="alert" className="px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
              {searchError}
            </p>
          )}
          {results.length > 0 && (
            <ul>
              {results.map((match) => (
                <li key={`${match.lat},${match.lon}`}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setValue("");
                      clearResults();
                      setActive({ label: match.locality, lat: match.lat, lon: match.lon });
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-teal-600/10"
                  >
                    <MapPin size={15} aria-hidden="true" className="shrink-0 text-teal-600 dark:text-teal-300" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{match.localName}</span>
                      <span className="block truncate text-xs text-ink-3 dark:text-white/40">
                        {match.locality} · {match.lat.toFixed(3)}, {match.lon.toFixed(3)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}