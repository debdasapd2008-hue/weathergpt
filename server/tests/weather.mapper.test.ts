import { describe, expect, it } from "vitest";
import {
  buildCurrent,
  buildDaily,
  buildFromOneCall,
  buildHourly,
  estimateOffsetSeconds,
  formatClock,
  formatShortDay,
  type OWMCityWeather,
  type OWMForecastEntry,
  type OWMOneCall,
} from "../src/providers/weather/openweathermap.mapper";

describe("estimateOffsetSeconds", () => {
  it("returns 0 when sunrise/sunset are missing", () => {
    expect(estimateOffsetSeconds({})).toBe(0);
  });

  it("estimates a positive (east) offset from local solar noon", () => {
    // Solar noon at 08:00 UTC -> local (UTC+4) noon is 12:00.
    const city: OWMCityWeather = {
      sys: { sunrise: 3 * 3600, sunset: 13 * 3600 },
    };
    expect(estimateOffsetSeconds(city)).toBe(4 * 3600);
  });

  it("estimates a negative (west) offset", () => {
    // Solar noon at 17:00 UTC -> local (UTC-5) noon is 12:00.
    const city: OWMCityWeather = {
      sys: { sunrise: 12 * 3600, sunset: 22 * 3600 },
    };
    expect(estimateOffsetSeconds(city)).toBe(-5 * 3600);
  });
});

describe("formatClock / formatShortDay", () => {
  it("formats a clock string in the target offset", () => {
    expect(formatClock(13 * 3600, 2 * 3600)).toBe("15:00");
  });

  it("formats a short day label in the target offset", () => {
    // 1970-01-01 was a Thursday.
    expect(formatShortDay(0, 0)).toBe("Thu 1");
  });
});

describe("buildCurrent", () => {
  const city: OWMCityWeather = {
    name: "London",
    sys: { country: "GB", sunrise: 12 * 3600, sunset: 18 * 3600 },
    main: { temp: 21.4, feels_like: 20, pressure: 1013, humidity: 61 },
    weather: [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }],
    wind: { speed: 4.2, deg: 315 },
    visibility: 9000,
    rain: { "1h": 0.5 },
    coord: { lat: 51.5, lon: -0.12 },
  };

  it("maps the current weather payload", () => {
    const current = buildCurrent(city, 5, 0);
    expect(current.city).toBe("London");
    expect(current.country).toBe("GB");
    expect(current.temperature).toBe(21.4);
    expect(current.feelsLike).toBe(20);
    expect(current.humidity).toBe(61);
    expect(current.windSpeed).toBe(4.2);
    expect(current.windDirection).toBe(315);
    expect(current.pressure).toBe(1013);
    expect(current.visibility).toBe(9000);
    expect(current.precipitation).toBe(0.5);
    expect(current.uvIndex).toBe(5);
    expect(current.icon).toBe("01d");
    expect(current.sunrise).toBe("12:00");
    expect(current.sunset).toBe("18:00");
  });

  it("falls back safely for missing data", () => {
    const current = buildCurrent({ name: "" } as OWMCityWeather, null, 0);
    expect(current.city).toBe("Unknown location");
    expect(current.condition).toBe("Unknown");
    expect(current.uvIndex).toBe(0);
    expect(current.visibility).toBe(10000);
  });
});

describe("buildHourly", () => {
  it("takes the next 8 three-hour entries and scales pop", () => {
    const list: OWMForecastEntry[] = Array.from({ length: 12 }, (_, i) => ({
      dt: i * 3 * 3600,
      main: { temp: 20 + i },
      weather: [{ id: 800, main: "Clear", description: "", icon: "01d" }],
      pop: i === 0 ? 1 : 0.25,
    }));
    const hourly = buildHourly(list, 0);
    expect(hourly).toHaveLength(8);
    expect(hourly[0]?.precipitationProbability).toBe(100);
    expect(hourly[0]?.time).toBe("00:00");
    expect(hourly[1]?.temperature).toBe(21);
  });
});

describe("buildDaily", () => {
  it("aggregates entries per calendar day with high/low/max-pop", () => {
    const list: OWMForecastEntry[] = [
      { dt: 0, main: { temp: 10 }, weather: [{ id: 500, main: "Rain", description: "", icon: "10d" }], pop: 0.8 },
      { dt: 0 + 3 * 3600, main: { temp: 15 }, weather: [{ id: 500, main: "Rain", description: "", icon: "10d" }], pop: 0.9 },
      { dt: 0 + 6 * 3600, main: { temp: 12 }, weather: [{ id: 800, main: "Clear", description: "", icon: "01d" }], pop: 0 },
      { dt: 24 * 3600, main: { temp: 22 }, weather: [{ id: 800, main: "Clear", description: "", icon: "01d" }], pop: 0.2 },
      { dt: 48 * 3600, main: { temp: 30 }, weather: [{ id: 800, main: "Clear", description: "", icon: "01d" }], pop: 0 },
    ];
    const daily = buildDaily(list, 0);
    expect(daily).toHaveLength(3);
    const first = daily[0];
    expect(first?.high).toBe(15);
    expect(first?.low).toBe(10);
    expect(first?.precipitationProbability).toBe(90);
    expect(first?.icon).toBe("10d");
    expect(first?.day).toBe("Thu 1");
  });
});

describe("buildFromOneCall", () => {
  const oneCall: OWMOneCall = {
    timezone_offset: 3600,
    current: {
      dt: 10 * 3600,
      sunrise: 6 * 3600,
      sunset: 18 * 3600,
      temp: 18,
      feels_like: 17,
      pressure: 1012,
      humidity: 70,
      uvi: 4,
      visibility: 12000,
      wind_speed: 3.1,
      wind_deg: 90,
      weather: [{ id: 802, main: "Clouds", description: "scattered clouds", icon: "03d" }],
    },
    hourly: Array.from({ length: 30 }, (_, i) => ({
      dt: i * 3600,
      temp: 15 + i,
      weather: [{ id: 802, main: "Clouds", description: "", icon: "03d" }],
      pop: i % 3 === 0 ? 0.5 : 0,
    })),
    daily: Array.from({ length: 10 }, (_, i) => ({
      dt: (i + 1) * 86400,
      temp: { day: 20 + i, min: 12 + i, max: 25 + i },
      weather: [{ id: 802, main: "Clouds", description: "", icon: "03d" }],
      pop: 0.3,
    })),
  };

  it("restricts hourly to 24h and daily to 7 days and uses the real offset", () => {
    const fallback: OWMCityWeather = { name: "Zurich", sys: { country: "CH" } };
    const result = buildFromOneCall(oneCall, fallback, 4);
    expect(result).not.toBeNull();
    expect(result?.current.city).toBe("Zurich");
    expect(result?.current.country).toBe("CH");
    expect(result?.current.uvIndex).toBe(4);
    expect(result?.current.sunrise).toBe("07:00"); // 06:00 UTC + 1h offset
    expect(result?.hourly).toHaveLength(24);
    expect(result?.daily).toHaveLength(7);
    expect(result?.daily[0]?.high).toBe(25);
    expect(result?.daily[0]?.low).toBe(12);
  });

  it("returns null when required parts are missing", () => {
    expect(buildFromOneCall({ timezone_offset: 0 }, {}, null)).toBeNull();
  });
});