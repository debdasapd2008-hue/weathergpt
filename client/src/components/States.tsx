import { AlertTriangle, CloudCog, RefreshCw, Search } from "lucide-react";
import { useId } from "react";

const QUICK_CITIES = ["London", "Tokyo", "New York", "Sydney", "Paris"];

export function SearchPrompt({ onSearch }: { onSearch: (city: string) => void }) {
  return (
    <section
      className="panel animate-fade-up flex flex-col items-center gap-4 p-10 text-center"
      aria-label="Search for a city"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg">
        <Search size={28} aria-hidden="true" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-medium tracking-tight">Welcome to WeatherGPT</h1>
        <p className="mt-1 text-sm text-ink-2 dark:text-white/55">
          Search for any city, or use the location button to get the current forecast.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_CITIES.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => onSearch(city)}
            className="chip"
          >
            {city}
          </button>
        ))}
      </div>
    </section>
  );
}

export function ErrorState({
  code,
  message,
  onRetry,
}: {
  code: string;
  message: string;
  onRetry?: () => void;
}) {
  const titleId = useId();
  const isConfig = code === "WEATHER_NOT_CONFIGURED" || code === "AI_NOT_CONFIGURED";

  return (
    <section
      role="alert"
      aria-labelledby={titleId}
      className="animate-fade-up rounded-3xl border border-amber-300/60 bg-amber-50/80 p-6 shadow-sm dark:border-amber-500/25 dark:bg-amber-500/10"
    >
      <div className="flex items-start gap-3">
        {isConfig ? (
          <CloudCog className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={22} aria-hidden="true" />
        ) : (
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={22} aria-hidden="true" />
        )}
        <div className="min-w-0">
          <h2 id={titleId} className="font-semibold text-ink dark:text-white">
            {isConfig ? "Configuration required" : "Couldn't load the weather"}
          </h2>
          <p className="mt-1 text-sm text-ink-2 dark:text-white/60">{message}</p>
          {isConfig && (
            <p className="mt-3 rounded-xl border border-dashed border-amber-500/40 bg-white/60 p-3 font-mono text-xs leading-relaxed text-ink-2 dark:bg-navy-night/40 dark:text-white/60">
              {code === "WEATHER_NOT_CONFIGURED"
                ? "Set WEATHER_API_KEY (and optionally WEATHER_API_BASE_URL) in the server environment, then restart the server."
                : "Set AI_PROVIDER, AI_API_KEY (and optionally AI_MODEL) in the server environment, then restart the server."}
            </p>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="btn-primary mt-4"
            >
              <RefreshCw size={15} aria-hidden="true" /> Try again
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export function GeoAlert({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="status"
      className="animate-fade-in flex items-center justify-between gap-3 rounded-2xl border border-teal-300/60 bg-teal-50/80 px-4 py-3 text-sm text-teal-800 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-200"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="btn-primary shrink-0 !px-3 !py-1 text-xs"
      >
        Try again
      </button>
    </div>
  );
}