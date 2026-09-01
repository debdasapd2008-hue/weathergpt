import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/cn";
import { useWeatherData } from "@/stores/weatherData";
import { Card, CardGrid, PageHeader } from "@/components/Page";

export function SavedPlacesPage() {
  const { t } = useI18n();
  const { savedPlaces, removePlace, setActive, active, state, savePlace, refresh } = useWeatherData();

  const current: { lat: number; lon: number } | null =
    state.status === "success" ? state.data.location : null;
  const currentSaved = current
    ? savedPlaces.some(
        (place) =>
          Math.abs(place.lat - current.lat) < 0.001 && Math.abs(place.lon - current.lon) < 0.001,
      )
    : false;

  return (
    <div>
      <PageHeader
        icon={Star}
        title={t("nav.places", "Saved Places")}
        intro={t("places.intro", "Pin places you check often and jump back to them instantly.")}
        index="07"
      />
      <div className="space-y-5">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600/15 text-teal-700 dark:text-teal-300">
                <MapPin size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink dark:text-white">
                  {active?.label ?? t("common.currentLocation", "Your location")}
                </p>
                <p className="text-xs tabular-nums text-ink-3 dark:text-white/40">
                  {current ? `${current.lat.toFixed(3)}, ${current.lon.toFixed(3)}` : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={refresh}
                className="btn-ghost px-3 py-1.5 text-xs"
              >
                {t("common.retry", "Try again")}
              </button>
              {active && !currentSaved && (
                <button
                  type="button"
                  onClick={() => active && savePlace(active)}
                  className="btn-primary px-3 py-1.5 text-xs"
                >
                  <Plus size={13} aria-hidden="true" /> {t("places.save", "Save")}
                </button>
              )}
            </div>
          </div>
        </Card>

        {savedPlaces.length === 0 ? (
          <Card>
            <p className="text-sm text-ink-2 dark:text-white/55">
              {t("places.empty", "No saved places yet. Search and press “Save” to pin one.")}
            </p>
          </Card>
        ) : (
          <CardGrid>
            {savedPlaces.map((place) => {
              const isActive =
                state.status === "success" &&
                Math.abs(state.data.location.lat - place.lat) < 0.001 &&
                Math.abs(state.data.location.lon - place.lon) < 0.001;
              return (
                <div
                  key={place.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-2xl border p-4 transition",
                    isActive
                      ? "border-teal-500/50 bg-teal-600/5"
                      : "panel-hover border-line bg-white/60 dark:border-white/5 dark:bg-navy-night/40",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActive({ label: place.label, lat: place.lat, lon: place.lon })}
                    className="text-left"
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
                      <Star
                        size={14}
                        aria-hidden="true"
                        className={cn(
                          isActive ? "fill-teal-500 text-teal-500" : "text-ink-3 dark:text-white/30",
                        )}
                      />
                      {place.label}
                    </p>
                    <p className="mt-1 text-xs tabular-nums text-ink-3 dark:text-white/40">
                      {place.lat.toFixed(3)}, {place.lon.toFixed(3)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => removePlace(place.id)}
                    className="flex items-center gap-1 self-start text-xs font-medium text-ink-3 transition hover:text-rose-500 dark:text-white/40"
                  >
                    <Trash2 size={12} aria-hidden="true" /> {t("places.remove", "Remove")}
                  </button>
                </div>
              );
            })}
          </CardGrid>
        )}
      </div>
    </div>
  );
}