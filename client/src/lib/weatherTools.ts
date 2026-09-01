import type { CurrentWeather, DailyForecast, HourlyForecast } from "@weathergpt/shared";

/**
 * Pure, deterministic forecast tools. Everything here is derived only from the
 * supplied weather data — no AI, no invented values, no unsupported claims.
 */

const RAIN_LIKE = new Set(["Rain", "Drizzle", "Thunderstorm", "Snow", "Squall"]);

function skyWord(condition: string, description: string): string {
  const c = condition.toLowerCase();
  if (c.includes("thunder") || c.includes("squall")) return "stormy, unsettled";
  if (c.includes("snow")) return "cold, snowy";
  if (c.includes("rain") || c.includes("drizzle")) return "rainy";
  if (c.includes("cloud")) return "cloudy";
  if (c.includes("clear") || c.includes("sunny")) return "clear and sunny";
  if (description.trim()) return `${description.toLowerCase()}`;
  return "grey";
}

/** A short atmospheric description of the current conditions (Weather Mood). */
export function weatherMood(current: CurrentWeather): string {
  const temp = current.temperature;
  const sky = skyWord(current.condition, current.description);
  const calm = current.windSpeed < 3;
  const humid = current.humidity >= 70;

  let tempWord: string;
  if (temp <= 10) tempWord = "Cold";
  else if (temp <= 18) tempWord = "Cool";
  else if (temp <= 26) tempWord = "Mild";
  else if (temp <= 33) tempWord = "Warm";
  else tempWord = "Hot";

  let vibe: string;
  if (temp >= 30 && humid) vibe = "keep it slow and stay in the shade";
  else if (temp >= 30) vibe = "a shade-and-lotion kind of day";
  else if (temp <= 10 && current.windSpeed > 5) vibe = "wrap up warm against the wind";
  else if (RAIN_LIKE.has(current.condition)) vibe = "a day for a warm drink by the window";
  else if (calm && temp <= 22) vibe = "perfect for a quiet walk";
  else if (temp <= 28) vibe = "a pleasant day to be outdoors";
  else vibe = "best enjoyed early or late in the day";

  return `${tempWord} and ${sky} — ${vibe}.`;
}

/** Quick outdoor comfort verdict ("Should I go out?"). */
export function outdoorComfort(current: CurrentWeather): string {
  const temp = current.temperature;
  const humid = current.humidity >= 70;

  if (RAIN_LIKE.has(current.condition) && current.precipitation > 0) {
    return "Rain at the moment — plan for wet conditions or wait it out.";
  }
  if (temp >= 33 || (temp >= 28 && humid)) {
    return "Hot and sticky — limit heavy activity and keep water with you.";
  }
  if (temp >= 28) {
    return "Warm — fine to go out, but stay hydrated in the sun.";
  }
  if (temp <= 10 && current.windSpeed > 5) {
    return "Cold and breezy — dress warmly in layers.";
  }
  if (temp <= 10) {
    return "Cold — a coat and warm layers are a good idea outside.";
  }
  if (temp >= 22 && current.windSpeed <= 6 && !humid) {
    return "Comfortable — a good time to go out.";
  }
  return "Acceptable — conditions are fine for most outdoor plans.";
}

/** Precipitation-based recommendation (Umbrella Check). */
export function umbrellaCheck(
  current: CurrentWeather,
  hourly: HourlyForecast[],
): { needed: "yes" | "maybe" | "no"; text: string } {
  const maxProb = hourly.reduce((max, hour) => Math.max(max, hour.precipitationProbability), 0);
  const precipNow = RAIN_LIKE.has(current.condition) && current.precipitation > 0;
  const overall = Math.max(current.precipitation > 0 ? 50 : 0, maxProb);

  if (precipNow || overall >= 50) {
    return { needed: "yes", text: "Rain is likely — take an umbrella (or a rain jacket)." };
  }
  if (overall >= 30) {
    return {
      needed: "maybe",
      text: "Showers are possible — a compact umbrella is worth carrying.",
    };
  }
  return { needed: "no", text: "Little or no rain expected — no umbrella needed today." };
}

interface BestWindow {
  start: string;
  end: string;
  averageTemp: number;
  maxRain: number;
}

/** The most pleasant consecutive outdoor window today from the hourly data. */
export function bestTimeToday(hourly: HourlyForecast[]): BestWindow | null {
  if (hourly.length === 0) return null;
  const windowSize = Math.min(3, hourly.length);

  let best: { index: number; score: number } | null = null;
  for (let i = 0; i <= hourly.length - windowSize; i++) {
    let totalRain = 0;
    let totalPenalty = 0;
    let totalTemp = 0;
    for (let j = i; j < i + windowSize; j++) {
      const hour = hourly[j] as HourlyForecast;
      totalRain += hour.precipitationProbability;
      totalTemp += hour.temperature;
      if (hour.temperature <= 8) totalPenalty += 12;
      if (hour.temperature >= 32) totalPenalty += 10;
    }
    const score = totalRain + totalPenalty;
    if (best === null || score < best.score) {
      best = { index: i, score };
    }
  }
  if (!best) return null;

  const window = hourly.slice(best.index, best.index + windowSize) as HourlyForecast[];
  const start = window[0]?.time ?? "";
  const end = window[window.length - 1]?.time ?? "";
  const averageTemp = window.reduce((sum, hour) => sum + hour.temperature, 0) / window.length;
  const maxRain = Math.max(...window.map((hour) => hour.precipitationProbability));
  return { start, end, averageTemp, maxRain };
}

/** Weather-based clothing suggestions (What to Wear). */
export function whatToWear(
  current: CurrentWeather,
  daily: DailyForecast[],
): string[] {
  const today = daily[0];
  const high = today?.high ?? current.temperature;
  const low = today?.low ?? current.temperature;
  const rainProb =
    today?.precipitationProbability ?? (current.precipitation > 0 ? 50 : 0);
  const items: string[] = [];

  if (high >= 30) {
    items.push("Light, loose clothing in breathable fabric");
  } else if (high >= 24) {
    items.push("Light t-shirt or top");
  } else if (high >= 17) {
    items.push("T-shirt plus a light layer");
  } else {
    items.push("Warm layers and a jacket");
  }

  if (high - low >= 10) {
    items.push("Something for the warmer afternoon vs the cooler evening");
  }
  if (low <= 14) {
    items.push(`A jacket for the cooler part of the day (down to ${Math.round(low)}°C)`);
  }
  if (RAIN_LIKE.has(current.condition) || rainProb >= 40) {
    items.push("Umbrella or a waterproof layer");
  }
  if (current.windSpeed >= 8) {
    items.push("A windbreaker or wind-resistant layer");
  }
  if (current.uvIndex >= 6) {
    items.push("Sun hat and sunscreen");
  }

  return items.slice(0, 4);
}