import { describe, expect, it } from "vitest";
import type { CurrentWeather, DailyForecast, HourlyForecast } from "@weathergpt/shared";
import {
  bestTimeToday,
  outdoorComfort,
  umbrellaCheck,
  weatherMood,
  whatToWear,
} from "./weatherTools";
import { weatherFactOfTheDay, WEATHER_FACTS } from "./weatherFacts";

function current(partial: Partial<CurrentWeather>): CurrentWeather {
  return {
    city: "Testville",
    country: "IN",
    condition: "Clear",
    description: "clear sky",
    temperature: 24,
    feelsLike: 24,
    humidity: 50,
    windSpeed: 2,
    windDirection: 180,
    pressure: 1013,
    visibility: 10000,
    precipitation: 0,
    uvIndex: 3,
    sunrise: "06:00",
    sunset: "18:30",
    icon: "01d",
    ...partial,
  };
}

function hourly(spec: [string, number, number][]): HourlyForecast[] {
  return spec.map(([time, temperature, precipitationProbability]) => ({
    time: `${time}:00`,
    icon: "10d",
    temperature,
    precipitationProbability,
  }));
}

const daily: DailyForecast[] = [
  { day: "Mon 1", icon: "01d", high: 30, low: 18, precipitationProbability: 10 },
];

describe("weatherMood", () => {
  it("describes a calm mild day as pleasant for a walk", () => {
    expect(weatherMood(current({ temperature: 20, condition: "Clouds" }))).toMatch(/quiet walk/i);
  });

  it("flags very hot and humid conditions", () => {
    expect(weatherMood(current({ temperature: 34, humidity: 80, condition: "Clear" }))).toMatch(/stay in the shade/);
  });

  it("mentions rain for rainy conditions", () => {
    expect(weatherMood(current({ condition: "Rain", precipitation: 1 }))).toMatch(/rainy/);
  });
});

describe("outdoorComfort", () => {
  it("says hot for hot and humid weather", () => {
    expect(outdoorComfort(current({ temperature: 34, humidity: 80 }))).toMatch(/hot/i);
  });

  it("says comfortable for mild calm weather", () => {
    expect(outdoorComfort(current({ temperature: 24, humidity: 45 }))).toMatch(/comfortable/i);
  });

  it("warns about rain when it is raining", () => {
    expect(outdoorComfort(current({ condition: "Rain", precipitation: 2 }))).toMatch(/rain/i);
  });
});

describe("umbrellaCheck", () => {
  it("says yes when rain probability is high", () => {
    const hours = hourly([["12", 22, 80], ["13", 22, 90]]);
    expect(umbrellaCheck(current({}), hours).needed).toBe("yes");
  });

  it("says maybe for moderate rain probability", () => {
    const hours = hourly([["12", 22, 35], ["13", 22, 40]]);
    expect(umbrellaCheck(current({}), hours).needed).toBe("maybe");
  });

  it("says no when rain is unlikely", () => {
    const hours = hourly([["12", 22, 5], ["13", 22, 10]]);
    expect(umbrellaCheck(current({}), hours).needed).toBe("no");
  });

  it("says yes when precipitation is happening now", () => {
    expect(umbrellaCheck(current({ condition: "Drizzle", precipitation: 0.4 }), []).needed).toBe("yes");
  });
});

describe("bestTimeToday", () => {
  it("finds the window with least rain and moderate temps", () => {
    const hours = hourly([
      ["09", 25, 10],
      ["10", 26, 20],
      ["11", 27, 30],
      ["15", 30, 5],
      ["16", 31, 5],
      ["17", 30, 5],
    ]);
    const best = bestTimeToday(hours);
    expect(best).not.toBeNull();
    expect(best?.start).toBe("15:00");
    expect(best?.end).toBe("17:00");
  });

  it("returns null when there is no hourly data", () => {
    expect(bestTimeToday([])).toBeNull();
  });
});

describe("whatToWear", () => {
  it("suggests light clothing for hot weather", () => {
    const items = whatToWear(current({ temperature: 32, uvIndex: 8 }), daily);
    expect(items[0]).toMatch(/light, loose/i);
    expect(items.join(" ")).toMatch(/sun hat/i);
  });

  it("suggests warm layers for cold weather", () => {
    const cold = current({ temperature: 5, windSpeed: 4 });
    const items = whatToWear(cold, [{ ...daily[0]!, high: 10, low: 2 }]);
    expect(items[0]).toMatch(/warm layers/i);
  });

  it("adds an umbrella on rainy days", () => {
    const items = whatToWear(
      current({ condition: "Rain", precipitation: 1 }),
      [{ ...daily[0]!, precipitationProbability: 60 }],
    );
    expect(items.join(" ")).toMatch(/umbrella/i);
  });
});

describe("weatherFactOfTheDay", () => {
  it("returns a non-empty fact for any date", () => {
    expect(weatherFactOfTheDay(new Date("2024-01-01"))).toBeTruthy();
    expect(weatherFactOfTheDay(new Date("2024-12-31"))).toBeTruthy();
    expect(WEATHER_FACTS.length).toBeGreaterThan(5);
  });

  it("returns deterministic values for the same date", () => {
    const day = new Date("2024-06-15");
    expect(weatherFactOfTheDay(day)).toBe(weatherFactOfTheDay(day));
  });
});