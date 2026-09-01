/** Deterministic classification of an icon/condition into a visual treatment. */

export type WeatherGroup = "clear" | "partly" | "cloudy" | "rain" | "storm" | "snow" | "fog";

export function weatherGroup(icon: string, condition?: string): WeatherGroup {
  if (icon.length === 3) {
    switch (icon.slice(0, 2)) {
      case "01":
        return "clear";
      case "02":
        return "partly";
      case "03":
      case "04":
        return "cloudy";
      case "09":
      case "10":
        return "rain";
      case "11":
        return "storm";
      case "13":
        return "snow";
      case "50":
        return "fog";
      default:
        break;
    }
  }
  const text = (condition ?? icon).toLowerCase();
  if (text.includes("thunder") || text.includes("squall") || text.includes("tornado")) return "storm";
  if (text.includes("snow") || text.includes("sleet") || text.includes("ice")) return "snow";
  if (text.includes("rain") || text.includes("drizzle") || text.includes("shower")) return "rain";
  if (text.includes("fog") || text.includes("mist") || text.includes("haze") || text.includes("smoke")) return "fog";
  if (text.includes("cloud") || text.includes("overcast")) return "cloudy";
  if (text.includes("clear") || text.includes("sun")) return "clear";
  return "cloudy";
}

export function isNight(icon: string): boolean {
  return icon.endsWith("n");
}