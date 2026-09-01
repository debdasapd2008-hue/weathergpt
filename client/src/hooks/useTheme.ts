import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
export type ThemeMode = Theme | "system";

const STORAGE_KEY = "weathergpt-theme";

function initialMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light" || stored === "system") return stored;
  return "system";
}

function systemPreference(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveMode(mode: ThemeMode): Theme {
  return mode === "system" ? systemPreference() : mode;
}

export function useTheme(): {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
} {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [resolved, setResolved] = useState<Theme>(() => resolveMode(initialMode()));

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (mode === "system") setResolved(media.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode]);

  useEffect(() => {
    const next = resolveMode(mode);
    setResolved(next);
  }, [mode]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [resolved, mode]);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);

  const toggleTheme = useCallback(() => {
    setModeState((current) => {
      const effective = current === "system" ? systemPreference() : current;
      return effective === "dark" ? "light" : "dark";
    });
  }, []);

  return { theme: resolved, mode, setMode, toggleTheme };
}