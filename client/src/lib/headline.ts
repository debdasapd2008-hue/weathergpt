import type { CurrentWeather } from "@weathergpt/shared";

/**
 * Pure, deterministic copy helpers for the editorial hero and weather summary.
 * Everything here is derived only from real weather numbers — nothing is invented.
 */

export type SkyWord =
  | "clear and sunny"
  | "a little cloudy"
  | "mostly cloudy"
  | "rainy"
  | "stormy and unsettled"
  | "cold and snowy"
  | "misty";

export function skyWord(condition: string, description: string): SkyWord {
  const c = condition.toLowerCase();
  if (c.includes("thunder") || c.includes("squall") || c.includes("storm")) return "stormy and unsettled";
  if (c.includes("snow") || c.includes("sleet")) return "cold and snowy";
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return "rainy";
  if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return "misty";
  if (c.includes("cloud")) return "mostly cloudy";
  if (c.includes("clear") || c.includes("sunny")) return "clear and sunny";
  if (description.trim()) {
    const text = description.toLowerCase();
    if (text.includes("few")) return "a little cloudy";
    if (text.includes("scattered")) return "a little cloudy";
    if (text.includes("overcast")) return "mostly cloudy";
  }
  return "a little cloudy";
}

export function temperatureWord(tempC: number): string {
  if (tempC <= 5) return "Cold";
  if (tempC <= 13) return "Cool";
  if (tempC <= 21) return "Mild";
  if (tempC <= 28) return "Warm";
  if (tempC <= 34) return "Hot";
  return "Very hot";
}

export function humidityWord(humidity: number): string {
  if (humidity >= 70) return "high";
  if (humidity >= 45) return "moderate";
  return "low";
}

export function windWord(speedMps: number): string {
  if (speedMps < 2) return "calm";
  if (speedMps < 5) return "light";
  if (speedMps < 8) return "moderate";
  if (speedMps < 12) return "strong";
  return "very strong";
}

export interface HeroCopy {
  /** Leading words, e.g. "Warm and" */
  pre: string;
  /** Emphasised phrase, e.g. "mostly cloudy" */
  accent: string;
  /** One factual, useful context sentence. */
  context: string;
}

/** Editorial headline + context for the current conditions. */
export function heroCopy(current: CurrentWeather): HeroCopy {
  const sky = skyWord(current.condition, current.description);
  const temp = temperatureWord(current.temperature);

  const parts = sky.split(" ");
  // Emphasise the second half of the sky phrase when possible ("mostly cloudy",
  // "clear and sunny"), otherwise keep the whole phrase as the accent.
  const accent: string =
    parts.length > 1 && (parts[0] === "mostly" || parts[0] === "a" || parts[0] === "little")
      ? parts.slice(1).join(" ")
      : sky;

  const tempLower = temp.toLowerCase();
  const pre = `${temp} and`;

  const humidity = humidityWord(current.humidity);
  const wind = windWord(current.windSpeed);

  let context =
    `Humidity is ${humidity} and winds are ${wind}.`;
  if (current.precipitation > 0 && (current.condition === "Rain" || current.condition === "Drizzle")) {
    context += " Light precipitation is falling right now.";
  } else if (current.precipitation > 0.5) {
    context += ` About ${Math.round(current.precipitation)} mm of precipitation is on the ground.`;
  }
  if (current.uvIndex >= 6) {
    context += " UV is strong — shade and sunscreen help.";
  }

  return { pre, accent, context };
}

/** City-aware hero headline fragment: "in Mumbai" or "right here". */
export function heroPlace(word: string): string {
  return word.trim() ? word : "here";
}