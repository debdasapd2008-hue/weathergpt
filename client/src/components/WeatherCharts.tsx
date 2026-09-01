import { useId } from "react";
import { useI18n } from "@/i18n";
import { areaPath, barGeometry, linePoints } from "@/lib/charts";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";
import { formatTemp, type UnitSystem } from "@/lib/units";

interface HourPoint {
  time: string;
  temperature: number;
  precipitationProbability: number;
}

const WIDTH = 640;
const HEIGHT = 190;

export function TemperatureTrend({
  hours,
  units,
  className,
}: {
  hours: HourPoint[];
  units?: UnitSystem;
  className?: string;
}) {
  const gradientId = useId().replace(/[:]/g, "");
  const { t } = useI18n();
  if (hours.length === 0) return null;

  const dims = { width: WIDTH, height: HEIGHT, padX: 28, padY: 16 };
  const values = hours.map((h) => h.temperature);
  const line = linePoints(values, dims);
  const area = areaPath(values, dims);
  const shown = hours.filter((_, i) => i % Math.ceil(hours.length / 8) === 0);

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={t("common.temperatureTrend", "Temperature trend")}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-teal-500)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-teal-500)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={dims.padX}
            x2={WIDTH - dims.padX}
            y1={HEIGHT * frac}
            y2={HEIGHT * frac}
            stroke="var(--color-line)"
            strokeDasharray="3 5"
            className="dark:stroke-white/10"
          />
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--color-teal-600)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {shown.map((h, i) => (
          <g key={i}>
            <circle
              cx={dims.padX + (i / (shown.length - 1 || 1)) * (WIDTH - dims.padX * 2)}
              cy={HEIGHT - dims.padY}
              r={2}
              fill="currentColor"
              className="text-teal-600 dark:text-teal-300"
            />
          </g>
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-ink-3 dark:text-white/40">
        {(() => {
          const first = shown[0];
          const last = shown[shown.length - 1];
          return (
            <>
              <span>{first?.time.slice(0, 5) ?? ""}</span>
              <span className="font-semibold text-teal-700 dark:text-teal-300">
                {formatTemp(hours[0]!.temperature, units ?? "metric")}
              </span>
              <span>{last?.time.slice(0, 5) ?? ""}</span>
            </>
          );
        })()}
      </div>
    </div>
  );
}

export function RainBars({
  hours,
  className,
}: {
  hours: HourPoint[];
  className?: string;
}) {
  const { t } = useI18n();
  if (hours.length === 0) return null;

  const dims = { width: WIDTH, height: 120, padX: 28, padY: 12 };
  const bars = barGeometry(
    hours.map((h) => h.precipitationProbability),
    dims,
  );
  const max = Math.max(...hours.map((h) => h.precipitationProbability), 30);

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${WIDTH} 120`} className="w-full" role="img" aria-label={t("common.rainChance", "Rain chance")}>
        <line
          x1={dims.padX}
          x2={WIDTH - dims.padX}
          y1={dims.padY}
          y2={dims.padY}
          stroke="var(--color-line)"
          strokeDasharray="3 5"
          className="dark:stroke-white/10"
        />
        {bars.map((bar, i) => {
          const value = hours[i]!.precipitationProbability;
          const heavy = value >= 60;
          return (
            <rect
              key={i}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              rx={3}
              className={heavy ? "fill-teal-500" : "fill-aqua"}
              opacity={heavy ? 1 : 0.65 + (value / 100) * 0.35}
            >
              <title>{`${hours[i]!.time} — ${formatPercent(value)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-ink-3 dark:text-white/40">
        <span>{hours[0]!.time.slice(0, 5)}</span>
        <span className="font-semibold uppercase tracking-wide text-azure">max {formatPercent(max)}</span>
        <span>{hours[hours.length - 1]!.time.slice(0, 5)}</span>
      </div>
    </div>
  );
}