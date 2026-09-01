import { Moon, Sun } from "lucide-react";
import type { Theme } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-line bg-white/80 text-ink-2 shadow-sm transition hover:border-teal-400 hover:text-teal-700 active:scale-90 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70 dark:hover:border-teal-400/50 dark:hover:text-teal-300"
    >
      <Sun
        size={17}
        aria-hidden="true"
        className={cn("absolute transition-all duration-300", dark ? "translate-y-6 rotate-90 opacity-0" : "translate-y-0 rotate-0 opacity-100")}
      />
      <Moon
        size={17}
        aria-hidden="true"
        className={cn("absolute transition-all duration-300", dark ? "translate-y-0 rotate-0 opacity-100" : "-translate-y-6 -rotate-90 opacity-0")}
      />
    </button>
  );
}