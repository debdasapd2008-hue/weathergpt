/** Lightweight SVG chart math — pure functions, no chart library. */

export interface ChartRange {
  min: number;
  max: number;
}

export interface ChartDims {
  width: number;
  height: number;
  padX?: number;
  padY?: number;
}

export function rangeOf(values: number[]): ChartRange {
  if (values.length === 0) return { min: 0, max: 1 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max - min < 0.0001) return { min: min - 1, max: max + 1 };
  return { min, max };
}

function fit(value: number, range: ChartRange, dims: ChartDims): [number, number] {
  const padX = dims.padX ?? 8;
  const padY = dims.padY ?? 8;
  const usableW = Math.max(1, dims.width - padX * 2);
  const usableH = Math.max(1, dims.height - padY * 2);
  const span = range.max - range.min || 1;
  const x = padX + ((value - range.min) / span) * usableW;
  const y = padY + (1 - (value - range.min) / span) * usableH;
  return [x, y];
}

/** Polyline points for a value series. */
export function linePoints(values: number[], dims: ChartDims): string {
  const range = rangeOf(values);
  return values
    .map((value, i) => {
      const [x, y] = fit(value, range, { ...dims, padY: (dims.padY ?? 8) + 6 });
      const label = `${i === 0 ? "" : "L "}${round(x)},${round(y)}`;
      return label;
    })
    .join(" ");
}

/** Closed area path (line + baseline) for the same series. */
export function areaPath(values: number[], dims: ChartDims): string {
  if (values.length === 0) return "";
  const range = rangeOf(values);
  const points = values.map((value, i) => {
    const [x, y] = fit(value, range, { ...dims, padY: (dims.padY ?? 8) + 6 });
    return `${i === 0 ? "M" : "L"} ${round(x)},${round(y)}`;
  });
  const [left] = fit(values[0]!, range, { ...dims, padY: (dims.padY ?? 8) + 6 });
  const [right] = fit(values[values.length - 1]!, range, { ...dims, padY: (dims.padY ?? 8) + 6 });
  const baseline = dims.height - (dims.padY ?? 8);
  return `${points.join(" ")} L ${round(right)},${round(baseline)} L ${round(left)},${round(baseline)} Z`;
}

/** Bar geometry (x, y, width, height) for a value series. */
export function barGeometry(
  values: number[],
  dims: ChartDims,
): { x: number; y: number; width: number; height: number }[] {
  const range = rangeOf(values);
  const padX = dims.padX ?? 8;
  const baseline = dims.height - (dims.padY ?? 8);
  const usableW = Math.max(1, dims.width - padX * 2);
  const slot = usableW / Math.max(1, values.length);
  const width = Math.max(2, slot * 0.55);
  return values.map((value, i) => {
    const [, y] = fit(value, range, dims);
    const x = padX + slot * i + (slot - width) / 2;
    return { x: round(x), y: round(Math.min(y, baseline - 1)), width: round(width), height: round(Math.max(1, baseline - y)) };
  });
}

export function round(value: number): number {
  return Math.round(value * 10) / 10;
}