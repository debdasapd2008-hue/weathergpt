import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { isNight, weatherGroup, type WeatherGroup } from "@/lib/weatherVisual";

/**
 * Editorial label with an index — e.g. "01 / CURRENT CONDITIONS".
 */
export function EditorialLabel({
  index,
  children,
  className,
}: {
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("editorial-label", className)}>
      {index && (
        <span aria-hidden="true" className="index">
          {index}
        </span>
      )}
      {index && <span aria-hidden="true" className="h-px w-6 bg-ink-3/40 dark:bg-white/25" />}
      <span>{children}</span>
    </p>
  );
}

/** Layered, animated weather atmosphere — always behind content. */
export function WeatherVisual({
  icon,
  condition,
  className,
}: {
  icon: string;
  condition?: string;
  className?: string;
}) {
  const group: WeatherGroup = weatherGroup(icon, condition);
  const night = isNight(icon);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        "transition-colors duration-700",
        night ? "bg-navy-night/95 dark:bg-black/60" : bgForGroup(group),
        className,
      )}
    >
      {/* Geometric atmosphere: translucent rounded shapes behind content. */}
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-aqua/50 blur-3xl dark:bg-teal-500/10" />
      <div className="absolute left-[8%] top-[16%] h-24 w-24 rounded-[2rem] rotate-12 border border-peach/50 bg-peach/15 dark:border-peach-2/10 dark:bg-peach/5" />
      <div className="absolute bottom-[-3rem] right-[18%] h-44 w-44 rounded-full bg-azure/30 blur-2xl dark:bg-white/5" />
      <div className="absolute left-[44%] top-[6%] h-16 w-16 rounded-full border border-white/40 dark:border-white/10" />

      {group === "clear" && !night && <SunGlow />}
      {group === "partly" && !night && (
        <>
          <SunGlow small />
          <CloudLayer drift />
        </>
      )}
      {group === "cloudy" && <CloudLayer drift />}
      {group === "rain" && (
        <>
          <CloudLayer drift />
          <RainLayer />
        </>
      )}
      {group === "storm" && (
        <>
          <StormLayer />
          <RainLayer dense />
        </>
      )}
      {group === "snow" && (
        <>
          <CloudLayer drift />
          <SnowLayer />
        </>
      )}
      {group === "fog" && <FogLayer />}
      {night && <NightLayer />}
    </div>
  );
}

function bgForGroup(group: WeatherGroup): string {
  switch (group) {
    case "clear":
      return "bg-[#e9f2e2] dark:bg-transparent";
    case "partly":
      return "bg-[#ddeee9] dark:bg-transparent";
    case "cloudy":
      return "bg-[#d7e2e2] dark:bg-transparent";
    case "rain":
      return "bg-[#cddfe6] dark:bg-transparent";
    case "storm":
      return "bg-[#b9c8d4] dark:bg-transparent";
    case "snow":
      return "bg-[#e6f0f3] dark:bg-transparent";
    case "fog":
      return "bg-[#dfe3df] dark:bg-transparent";
  }
}

function SunGlow({ small = false }: { small?: boolean }) {
  return (
    <div className="absolute right-[14%] top-[10%]">
      <div
        className={cn(
          "animate-sun-glow rounded-full bg-gradient-to-br from-[#ffd88a] to-[#f7b968] dark:from-[#cdb26a] dark:to-[#a9864a]",
          small ? "h-24 w-24 opacity-70" : "h-40 w-40 opacity-80",
        )}
      />
      <div
        className={cn(
          "absolute inset-0 rounded-full border border-peach/60 dark:border-peach-2/20",
          small ? "h-24 w-24" : "h-40 w-40",
        )}
        style={{ inset: "-12px" }}
      />
    </div>
  );
}

function CloudLayer({ drift = false }: { drift?: boolean }) {
  return (
    <div className={cn("absolute inset-x-0 top-[6%]", drift && "animate-drift")}>
      <svg className="w-[46%] max-w-xl text-white/80 dark:text-white/10" viewBox="0 0 200 60" fill="currentColor">
        <path d="M30 52 C16 52 8 44 8 34 C8 25 15 19 24 19 C27 9 38 4 48 7 C58 2 70 5 73 14 C86 14 96 24 94 35 C93 44 85 52 74 52 Z" />
      </svg>
      <svg
        className="absolute left-[38%] top-[-10px] w-[36%] max-w-md text-white/70 dark:text-white/8"
        viewBox="0 0 200 60"
        fill="currentColor"
      >
        <path d="M30 52 C16 52 8 44 8 34 C8 25 15 19 24 19 C27 9 38 4 48 7 C58 2 70 5 73 14 C86 14 96 24 94 35 C93 44 85 52 74 52 Z" />
      </svg>
    </div>
  );
}

const RAIN_DROPS = [
  { left: "8%", delay: "0s" },
  { left: "18%", delay: "0.35s" },
  { left: "29%", delay: "0.15s" },
  { left: "43%", delay: "0.55s" },
  { left: "56%", delay: "0.25s" },
  { left: "68%", delay: "0.7s" },
  { left: "79%", delay: "0.45s" },
  { left: "90%", delay: "0.1s" },
];

function RainLayer({ dense = false }: { dense?: boolean }) {
  return (
    <div className="absolute inset-x-0 top-0 h-full opacity-70 dark:opacity-40">
      {RAIN_DROPS.map((drop, i) => (
        <span
          key={i}
          className="animate-drop-rain absolute top-0 h-10 w-px rounded-full bg-teal-500/70"
          style={{ left: drop.left, animationDelay: drop.delay, width: 1 }}
        />
      ))}
      {dense &&
        RAIN_DROPS.map((drop, i) => (
          <span
            key={`d${i}`}
            className="animate-drop-rain absolute top-0 h-8 w-px rounded-full bg-ink-2/40"
            style={{ left: `${(Number.parseFloat(drop.left) + 5) % 95}%`, animationDelay: `${(Number.parseFloat(drop.delay) + 0.4).toFixed(2)}s` }}
          />
        ))}
    </div>
  );
}

const SNOW_FLAKES = [
  { left: "6%", delay: "0s", size: 5 },
  { left: "16%", delay: "2.2s", size: 4 },
  { left: "28%", delay: "4.1s", size: 6 },
  { left: "40%", delay: "1.4s", size: 4 },
  { left: "52%", delay: "3.3s", size: 5 },
  { left: "64%", delay: "0.8s", size: 4 },
  { left: "76%", delay: "5.2s", size: 6 },
  { left: "88%", delay: "2.9s", size: 4 },
];

function SnowLayer() {
  return (
    <div className="absolute inset-x-0 top-0 h-full opacity-90 dark:opacity-50">
      {SNOW_FLAKES.map((flake, i) => (
        <span
          key={i}
          className="animate-drop-snow absolute top-0 rounded-full bg-white/90"
          style={{ left: flake.left, width: flake.size, height: flake.size, animationDelay: flake.delay }}
        />
      ))}
    </div>
  );
}

function StormLayer() {
  return (
    <div className="absolute right-[12%] top-[12%]">
      <svg width="90" height="90" viewBox="0 0 64 64" className="text-[#5c3b2e] opacity-70 dark:text-amber-200/60">
        <path
          d="M36 8 18 36h12l-6 20 22-30H33l12-18Z"
          fill="currentColor"
        />
      </svg>
      <div className="animate-pulse-soft mt-2 ml-2 h-24 w-24 rounded-full bg-ink-2/25 blur-2xl dark:bg-amber-300/10" />
    </div>
  );
}

const FOG_BANDS = [
  { top: "18%", opacity: "opacity-60" },
  { top: "34%", opacity: "opacity-40" },
  { top: "52%", opacity: "opacity-60" },
  { top: "70%", opacity: "opacity-35" },
];

function FogLayer() {
  return (
    <div className="absolute inset-x-0 top-0 h-full">
      {FOG_BANDS.map((band, i) => (
        <div
          key={i}
          className={cn(
            "animate-fog-flow absolute left-0 right-0 h-10 bg-white/70 blur-xl dark:bg-white/10",
            band.opacity,
          )}
          style={{ top: band.top, animationDelay: `${i * 1.4}s` }}
        />
      ))}
    </div>
  );
}

const STARS = [
  { left: "8%", top: "14%", size: 2 },
  { left: "24%", top: "8%", size: 1.5 },
  { left: "38%", top: "20%", size: 2 },
  { left: "55%", top: "10%", size: 1.5 },
  { left: "70%", top: "24%", size: 2 },
  { left: "84%", top: "12%", size: 1.5 },
  { left: "14%", top: "34%", size: 1.5 },
  { left: "64%", top: "36%", size: 2 },
];

function NightLayer() {
  return (
    <>
      <div className="absolute right-[16%] top-[12%]">
        <div className="h-20 w-20 rounded-full bg-[#e8e4d0] opacity-90 shadow-[0_0_60px_20px_rgba(232,228,208,0.35)] dark:opacity-70" />
        <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-[#18211f]" />
      </div>
      <div className="absolute inset-0">
        {STARS.map((star, i) => (
          <span
            key={i}
            className="animate-blink-soft absolute rounded-full bg-white/90"
            style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: `${i * 0.4}s` }}
          />
        ))}
      </div>
    </>
  );
}