import type {
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  WeatherResponse,
} from "@weathergpt/shared";

/**
 * Raw shapes returned by the OpenWeatherMap API (subset of fields used).
 * Types are intentionally loose because upstream payloads are untyped.
 */

export interface OWMWeatherEntry {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface OWMCityWeather {
  coord?: { lat: number; lon: number };
  weather?: OWMWeatherEntry[];
  main?: { temp?: number; feels_like?: number; pressure?: number; humidity?: number };
  visibility?: number;
  wind?: { speed?: number; deg?: number };
  rain?: { "1h"?: number; "3h"?: number };
  snow?: { "1h"?: number; "3h"?: number };
  clouds?: { all?: number };
  dt?: number;
  sys?: { country?: string; sunrise?: number; sunset?: number };
  name?: string;
}

export interface OWMForecastEntry {
  dt?: number;
  main?: { temp?: number };
  weather?: OWMWeatherEntry[];
  pop?: number;
}

export interface OWMForecast {
  list?: OWMForecastEntry[];
}

export interface OWMUV {
  value?: number;
}

export interface OWMOneCall {
  timezone_offset?: number;
  current?: {
    dt?: number;
    sunrise?: number;
    sunset?: number;
    temp?: number;
    feels_like?: number;
    pressure?: number;
    humidity?: number;
    uvi?: number;
    visibility?: number;
    wind_speed?: number;
    wind_deg?: number;
    clouds?: number;
    weather?: OWMWeatherEntry[];
  };
  hourly?: Array<{
    dt?: number;
    temp?: number;
    weather?: OWMWeatherEntry[];
    pop?: number;
  }>;
  daily?: Array<{
    dt?: number;
    temp?: { day?: number; min?: number; max?: number };
    weather?: OWMWeatherEntry[];
    pop?: number;
  }>;
  alerts?: Array<{
    event?: string;
    description?: string;
    sender_name?: string;
    start?: number;
    end?: number;
    tags?: string[];
  }>;
}

export const HOURLY_HOURS = 24;
export const DAILY_DAYS = 7;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Convert a unix timestamp to the local wall-clock of the city. */
function toLocalDate(epochSeconds: number | undefined, offsetSeconds: number): Date {
  const seconds = typeof epochSeconds === "number" ? epochSeconds : 0;
  return new Date((seconds + offsetSeconds) * 1000);
}

export function formatClock(epochSeconds: number | undefined, offsetSeconds: number): string {
  const date = toLocalDate(epochSeconds, offsetSeconds);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatShortDay(epochSeconds: number | undefined, offsetSeconds: number): string {
  const date = toLocalDate(epochSeconds, offsetSeconds);
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()}`;
}

/**
 * Estimate a city's UTC offset from its sunrise/sunset. The midpoint between
 * sunrise and sunset is local solar noon (~12:00 local time), so the offset is
 * the difference between 12:00 local and the time-of-day of that midpoint.
 * Rounded to 15 minutes to stay stable. This is approximate (±~15 min); exact
 * offsets are used when the One Call API is available.
 */
export function estimateOffsetSeconds(city: OWMCityWeather): number {
  const sunrise = city.sys?.sunrise;
  const sunset = city.sys?.sunset;
  if (typeof sunrise !== "number" || typeof sunset !== "number" || sunset <= sunrise) {
    return 0;
  }
  const solarNoonSecondsOfDay = (sunrise + (sunset - sunrise) / 2) % 86_400;
  return Math.round((12 * 60 * 60 - solarNoonSecondsOfDay) / 900) * 900;
}

function firstWeather(weather?: OWMWeatherEntry[]): OWMWeatherEntry {
  return weather?.[0] ?? { id: 800, main: "Unknown", description: "", icon: "01d" };
}

function precipitationNow(city: OWMCityWeather): number {
  const rainNow = city.rain?.["1h"] ?? city.rain?.["3h"] ?? 0;
  const snowNow = city.snow?.["1h"] ?? city.snow?.["3h"] ?? 0;
  return (rainNow ?? 0) + (snowNow ?? 0);
}

export function buildCurrent(
  city: OWMCityWeather,
  uvIndex: number | null,
  offsetSeconds: number,
): CurrentWeather {
  const weather = firstWeather(city.weather);
  return {
    city: city.name?.trim() || "Unknown location",
    country: city.sys?.country ?? "",
    condition: weather.main,
    description: weather.description,
    icon: weather.icon,
    temperature: city.main?.temp ?? 0,
    feelsLike: city.main?.feels_like ?? 0,
    humidity: Math.round(Math.max(0, Math.min(100, city.main?.humidity ?? 0))),
    windSpeed: city.wind?.speed ?? 0,
    windDirection: city.wind?.deg ?? 0,
    pressure: Math.round(city.main?.pressure ?? 0),
    visibility: city.visibility ?? 10000,
    precipitation: precipitationNow(city),
    uvIndex: uvIndex ?? 0,
    sunrise: formatClock(city.sys?.sunrise, offsetSeconds),
    sunset: formatClock(city.sys?.sunset, offsetSeconds),
    clouds: typeof city.clouds?.all === "number" ? city.clouds.all : undefined,
    localTime: formatClock(city.dt, offsetSeconds),
  };
}

export function buildHourly(list: OWMForecastEntry[] | undefined, offsetSeconds: number): HourlyForecast[] {
  if (!list) return [];
  return list.slice(0, HOURLY_HOURS / 3).map((entry) => {
    const weather = firstWeather(entry.weather);
    return {
      time: formatClock(entry.dt, offsetSeconds),
      icon: weather.icon,
      temperature: Math.round(entry.main?.temp ?? 0),
      precipitationProbability: Math.round((entry.pop ?? 0) * 100),
    };
  });
}

export function buildDaily(list: OWMForecastEntry[] | undefined, offsetSeconds: number): DailyForecast[] {
  if (!list) return [];

  // The free 3-hour forecast covers 5 days; aggregate into per-day buckets
  // keyed by the city-local calendar date. This is the fallback when the One
  // Call API is not subscribed on the key.
  const days = new Map<
    string,
    { epoch: number; highs: number[]; lows: number[]; pop: number; counts: Map<string, OWMWeatherEntry> }
  >();

  for (const entry of list) {
    if (typeof entry.dt !== "number") continue;
    const key = toLocalDate(entry.dt, offsetSeconds).toISOString().slice(0, 10);
    let bucket = days.get(key);
    if (!bucket) {
      bucket = { epoch: entry.dt, highs: [], lows: [], pop: 0, counts: new Map() };
      days.set(key, bucket);
    }
    bucket.highs.push(entry.main?.temp ?? 0);
    bucket.lows.push(entry.main?.temp ?? 0);
    bucket.pop = Math.max(bucket.pop, entry.pop ?? 0);
    const weather = firstWeather(entry.weather);
    const existing = bucket.counts.get(weather.main);
    bucket.counts.set(weather.main, existing ?? weather);
  }

  return [...days.values()].slice(0, DAILY_DAYS).map((bucket) => {
    const dominant = [...bucket.counts.values()][0] ?? firstWeather(undefined);
    return {
      day: formatShortDay(bucket.epoch, offsetSeconds),
      icon: dominant.icon,
      high: Math.round(Math.max(...bucket.highs)),
      low: Math.round(Math.min(...bucket.lows)),
      precipitationProbability: Math.round(bucket.pop * 100),
    };
  });
}

export function buildAlerts(alerts: OWMOneCall["alerts"]): WeatherResponse["alerts"] {
  if (!alerts) return [];
  return alerts
    .filter((alert) => alert.event || alert.description)
    .slice(0, 10)
    .map((alert) => ({
      event: alert.event ?? "Weather alert",
      description: alert.description ?? "",
      source: alert.sender_name ?? "OpenWeatherMap",
      start: alert.start ?? 0,
      end: alert.end ?? 0,
      tags: alert.tags ?? [],
    }));
}

export function buildFromOneCall(
  oneCall: OWMOneCall,
  fallbackCity: OWMCityWeather,
  uvIndex: number | null,
): WeatherResponse | null {
  const offset = oneCall.timezone_offset ?? 0;
  const current = oneCall.current;
  if (!current || !oneCall.hourly || !oneCall.daily) return null;

  return {
    location: {
      lat: fallbackCity.coord?.lat ?? 0,
      lon: fallbackCity.coord?.lon ?? 0,
    },
    current: {
      city: fallbackCity.name?.trim() || "Unknown location",
      country: fallbackCity.sys?.country ?? "",
      condition: firstWeather(current.weather).main,
      description: firstWeather(current.weather).description,
      icon: firstWeather(current.weather).icon,
      temperature: current.temp ?? 0,
      feelsLike: current.feels_like ?? 0,
      humidity: Math.round(Math.max(0, Math.min(100, current.humidity ?? 0))),
      windSpeed: current.wind_speed ?? 0,
      windDirection: current.wind_deg ?? 0,
      pressure: Math.round(current.pressure ?? 0),
      visibility: current.visibility ?? 10000,
      precipitation: precipitationNow(fallbackCity),
      uvIndex: uvIndex ?? current.uvi ?? 0,
      sunrise: formatClock(current.sunrise ?? current.dt, offset),
      sunset: formatClock(current.sunset ?? current.dt, offset),
      clouds: typeof current.clouds === "number" ? current.clouds : undefined,
      localTime: formatClock(current.dt, offset),
    },
    hourly: oneCall.hourly.slice(0, HOURLY_HOURS).map((entry) => ({
      time: formatClock(entry.dt, offset),
      icon: firstWeather(entry.weather).icon,
      temperature: Math.round(entry.temp ?? 0),
      precipitationProbability: Math.round((entry.pop ?? 0) * 100),
    })),
    daily: oneCall.daily.slice(0, DAILY_DAYS).map((entry) => ({
      day: formatShortDay(entry.dt, offset),
      icon: firstWeather(entry.weather).icon,
      high: Math.round(entry.temp?.max ?? entry.temp?.day ?? 0),
      low: Math.round(entry.temp?.min ?? entry.temp?.day ?? 0),
      precipitationProbability: Math.round((entry.pop ?? 0) * 100),
    })),
    alerts: buildAlerts(oneCall.alerts),
  };
}