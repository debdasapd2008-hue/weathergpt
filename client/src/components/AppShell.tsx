import {
  AlertTriangle,
  BookOpen,
  Camera,
  CloudSun,
  FileImage,
  Home,
  Loader2,
  MapPin,
  Menu,
  MessageSquare,
  MessageSquareText,
  Plane,
  Settings,
  Sprout,
  Star,
  HeartPulse,
  CalendarClock,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/cn";
import { useWeatherData } from "@/stores/weatherData";
import { useTheme } from "@/hooks/useTheme";
import { LocationSearch } from "./LocationSearch";
import { LanguageSelect } from "./LanguageSelect";
import { ThemeToggle } from "./ThemeToggle";

interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", labelKey: "nav.home", icon: Home, end: true },
  { to: "/forecast", labelKey: "nav.forecast", icon: CalendarClock },
  { to: "/ai", labelKey: "nav.ai", icon: MessageSquareText },
  { to: "/places", labelKey: "nav.places", icon: Star },
  { to: "/alerts", labelKey: "nav.alerts", icon: AlertTriangle },
  { to: "/education", labelKey: "nav.education", icon: BookOpen },
  { to: "/farmers", labelKey: "nav.farmers", icon: Sprout },
  { to: "/travellers", labelKey: "nav.travellers", icon: Plane },
  { to: "/health", labelKey: "nav.health", icon: HeartPulse },
  { to: "/chat", labelKey: "nav.chat", icon: MessageSquare },
  { to: "/camera", labelKey: "nav.camera", icon: Camera },
  { to: "/files", labelKey: "nav.files", icon: FileImage },
  { to: "/settings", labelKey: "nav.settings", icon: Settings, end: true },
];

const PRIMARY_MOBILE: NavItem[] = [
  { to: "/", labelKey: "nav.home", icon: Home, end: true },
  { to: "/forecast", labelKey: "nav.forecast", icon: CalendarClock },
  { to: "/ai", labelKey: "nav.ai", icon: MessageSquareText },
  { to: "/places", labelKey: "nav.places", icon: Star },
  { to: "/settings", labelKey: "nav.settings", icon: Settings, end: true },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
        <CloudSun size={17} aria-hidden="true" />
      </span>
      <span className="font-display text-[1.15rem] font-medium leading-none tracking-tight">
        Weather<span className="text-teal-600 dark:text-teal-300">GPT</span>
      </span>
    </div>
  );
}

function NavList({
  items,
  onNavigate,
  t,
}: {
  items: NavItem[];
  onNavigate?: () => void;
  t: (key: string, fallback?: string) => string;
}) {
  return (
    <nav aria-label="Sections" className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
              isActive
                ? "bg-teal-600/10 text-teal-700 dark:bg-teal-400/10 dark:text-teal-200"
                : "text-ink-2 hover:bg-teal-600/5 hover:text-ink dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white/90",
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon
                size={18}
                aria-hidden="true"
                className={cn(isActive ? "text-teal-600 dark:text-teal-300" : "text-ink-3 dark:text-white/40")}
              />
              <span className="truncate">{t(item.labelKey)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function LocateButton({
  onClick,
  locating,
  active,
}: {
  onClick: () => void;
  locating: boolean;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locating}
      aria-label="Use my current location"
      title="Use my current location"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white/80 text-ink-2 shadow-sm transition hover:border-teal-400 hover:text-teal-600 active:scale-90 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70 dark:hover:border-teal-400/50 dark:hover:text-teal-300",
        active && "border-teal-500 text-teal-600 dark:border-teal-400",
      )}
    >
      {locating ? (
        <Loader2 size={17} aria-hidden="true" className="animate-spin" />
      ) : (
        <MapPin size={17} aria-hidden="true" />
      )}
    </button>
  );
}

export function AppShell() {
  const { state, locate, locating, usingMyLocation, geoError } = useWeatherData();
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white/75 backdrop-blur-md dark:border-white/10 dark:bg-navy-night/80 lg:flex">
        <div className="px-5 pt-6">
          <Brand />
        </div>
        <div className="mt-6 flex-1 overflow-y-auto px-3 pb-4">
          <NavList items={NAV_ITEMS} t={t} />
        </div>
        <div className="border-t border-line px-5 py-4 dark:border-white/10">
          <p className="text-xs text-ink-3 dark:text-white/40">
            {state.status === "success"
              ? `${t("common.updatedAt", "Updated")} · ${state.data.current.city}`
              : t("tagline", "Forecasts and AI answers")}
          </p>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-navy-night/80 lg:hidden">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-2 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink-2 shadow-sm transition active:scale-90 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70"
          >
            <Menu size={17} aria-hidden="true" />
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <Brand />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 pb-3 sm:px-6">
          <LocationSearch className="min-w-0 flex-1" />
          <LocateButton onClick={locate} locating={locating} active={usingMyLocation && !geoError} />
        </div>
      </header>

      {/* Desktop search header */}
      <header className="sticky top-0 z-20 hidden items-center gap-3 border-b border-line bg-white/80 px-6 py-4 backdrop-blur-md dark:border-white/10 dark:bg-navy-night/80 lg:flex lg:pl-64">
        <LocationSearch className="min-w-0 flex-1" />
        <LocateButton onClick={locate} locating={locating} active={usingMyLocation && !geoError} />
        <LanguageSelect />
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:pb-16">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-white/10 dark:bg-navy-night/85 lg:hidden"
      >
        <div className="mx-auto flex max-w-5xl items-stretch justify-around px-2">
          {PRIMARY_MOBILE.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex w-16 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition",
                  isActive
                    ? "text-teal-600 dark:text-teal-300"
                    : "text-ink-3 dark:text-white/40",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} aria-hidden="true" />
                  <span className="truncate">{t(item.labelKey)}</span>
                  {isActive && <span className="h-1 w-1 rounded-full bg-teal-500" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm dark:bg-black/50"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-paper/95 shadow-2xl backdrop-blur-md dark:bg-navy-night/95">
            <div className="flex items-center justify-between px-5 pt-6">
              <Brand />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition hover:bg-white dark:border-white/10 dark:text-white/60 dark:hover:bg-white/10"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 flex-1 overflow-y-auto px-3 pb-6">
              <NavList items={NAV_ITEMS} onNavigate={() => setDrawerOpen(false)} t={t} />
            </div>
            <div className="flex items-center gap-2 border-t border-line px-5 py-4 dark:border-white/10">
              <p className="text-xs text-ink-3 dark:text-white/40">
                {t("tagline", "Forecasts and AI answers")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}