import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";

function iconForOWMCode(code: string): LucideIcon {
  switch (code) {
    case "01d":
      return Sun;
    case "01n":
      return Moon;
    case "02d":
      return CloudSun;
    case "02n":
      return CloudMoon;
    case "03d":
    case "03n":
    case "04d":
    case "04n":
      return Cloud;
    case "09d":
    case "09n":
      return CloudDrizzle;
    case "10d":
    case "10n":
      return CloudRain;
    case "11d":
    case "11n":
      return CloudLightning;
    case "13d":
    case "13n":
      return CloudSnow;
    case "50d":
    case "50n":
      return CloudFog;
    default:
      return Cloud;
  }
}

function iconForCondition(condition: string): LucideIcon {
  const text = condition.toLowerCase();
  if (text.includes("clear") || text.includes("sun")) return Sun;
  if (text.includes("thunder") || text.includes("storm")) return CloudLightning;
  if (text.includes("snow") || text.includes("sleet")) return CloudSnow;
  if (text.includes("rain") || text.includes("drizzle") || text.includes("shower")) return CloudRain;
  if (text.includes("fog") || text.includes("mist") || text.includes("haze")) return CloudFog;
  return Cloud;
}

/**
 * OpenWeatherMap icon codes are exactly 3 characters (e.g. "01d"); fall back
 * to matching the condition text when a code is not available.
 */
export function weatherIcon(icon: string, condition?: string): LucideIcon {
  if (icon.length === 3) return iconForOWMCode(icon);
  return iconForCondition(condition ?? icon);
}