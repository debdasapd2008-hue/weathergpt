import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ChatStyle } from "@weathergpt/shared";
import { CHAT_STYLE_OPTIONS } from "@/lib/chatStyle";
import type { UnitSystem } from "@/lib/units";

const STORAGE_KEY = "weathergpt-settings";

interface PersistedSettings {
  units: UnitSystem;
  showAirQuality: boolean;
  /** Chat reply language/style, independent of the UI language. */
  chatStyle: ChatStyle;
}

const DEFAULTS: PersistedSettings = {
  units: "metric",
  showAirQuality: true,
  chatStyle: "auto",
};

interface SettingsContextValue extends PersistedSettings {
  setUnits: (units: UnitSystem) => void;
  setShowAirQuality: (show: boolean) => void;
  setChatStyle: (style: ChatStyle) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function readSettings(): PersistedSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return {
      units: parsed.units === "imperial" ? "imperial" : "metric",
      showAirQuality:
        typeof parsed.showAirQuality === "boolean"
          ? parsed.showAirQuality
          : DEFAULTS.showAirQuality,
      chatStyle:
        parsed.chatStyle && CHAT_STYLE_OPTIONS.includes(parsed.chatStyle)
          ? parsed.chatStyle
          : DEFAULTS.chatStyle,
    };
  } catch {
    return DEFAULTS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PersistedSettings>(readSettings);
  const hydrated = useRef(false);
  const hydrating = useRef(false);
  const pushTimer = useRef<number | null>(null);
  const latest = useRef<PersistedSettings>(settings);

  const persist = useCallback(
    (next: PersistedSettings) => {
      latest.current = next;
      setSettings(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // best effort
      }
    },
    [],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      units: settings.units,
      showAirQuality: settings.showAirQuality,
      chatStyle: settings.chatStyle,
      setUnits: (units) => persist({ ...latest.current, units }),
      setShowAirQuality: (show) => persist({ ...latest.current, showAirQuality: show }),
      setChatStyle: (chatStyle) => persist({ ...latest.current, chatStyle }),
    }),
    [settings, persist],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside a SettingsProvider");
  }
  return context;
}