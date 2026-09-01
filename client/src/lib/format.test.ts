import { describe, expect, it } from "vitest";
import {
  capitalize,
  compassDirection,
  formatPercent,
  formatTemperature,
  formatVisibility,
  formatWind,
  uvIndexLabel,
} from "./format";

describe("formatTemperature", () => {
  it("rounds to whole degrees", () => {
    expect(formatTemperature(22.6)).toBe("23°");
    expect(formatTemperature(10.4)).toBe("10°");
    expect(formatTemperature(-2.6)).toBe("-3°");
  });
});

describe("formatWind", () => {
  it("formats m/s with one decimal", () => {
    expect(formatWind(3)).toBe("3.0 m/s");
    expect(formatWind(7.25)).toBe("7.3 m/s");
  });
});

describe("compassDirection", () => {
  it("maps degrees to compass points", () => {
    expect(compassDirection(0)).toBe("N");
    expect(compassDirection(90)).toBe("E");
    expect(compassDirection(180)).toBe("S");
    expect(compassDirection(270)).toBe("W");
    expect(compassDirection(45)).toBe("NE");
    expect(compassDirection(315)).toBe("NW");
    expect(compassDirection(400)).toBe("NE");
    expect(compassDirection(-90)).toBe("W");
  });
});

describe("formatVisibility", () => {
  it("formats meters in km", () => {
    expect(formatVisibility(10000)).toBe("10 km");
    expect(formatVisibility(8500)).toBe("8.5 km");
    expect(formatVisibility(400)).toBe("400 m");
  });
});

describe("formatPercent", () => {
  it("clamps and rounds", () => {
    expect(formatPercent(0.55)).toBe("1%");
    expect(formatPercent(45)).toBe("45%");
    expect(formatPercent(150)).toBe("100%");
    expect(formatPercent(-5)).toBe("0%");
  });
});

describe("uvIndexLabel", () => {
  it("labels UV categories", () => {
    expect(uvIndexLabel(1)).toBe("1 · Low");
    expect(uvIndexLabel(4)).toBe("4 · Moderate");
    expect(uvIndexLabel(6)).toBe("6 · High");
    expect(uvIndexLabel(9)).toBe("9 · Very high");
    expect(uvIndexLabel(11)).toBe("11 · Extreme");
  });
});

describe("capitalize", () => {
  it("uppercases the first letter", () => {
    expect(capitalize("clear sky")).toBe("Clear sky");
    expect(capitalize("")).toBe("");
  });
});