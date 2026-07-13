import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatWeatherLine, WeatherCard } from "./weather-card";
import type { WeatherSnapshot } from "@/lib/weather/open-meteo";

const weather = (overrides: Partial<WeatherSnapshot> = {}): WeatherSnapshot => ({
  source: "fallback",
  locationName: "上海",
  latitude: 31.2304,
  longitude: 121.4737,
  temperature: 24,
  precipitation: 0,
  windSpeed: 3,
  weatherCode: 0,
  condition: "未知",
  warmth: "medium",
  observedAt: "2026-06-14T08:15:00.000Z",
  ...overrides
});

describe("WeatherCard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("formats the one-line weather summary", () => {
    expect(formatWeatherLine(weather({ condition: "晴", temperature: 26.6, precipitation: 0.2, windSpeed: 8.7 }))).toBe(
      "上海 · 27°C · 晴 · 降水 0.2mm · 风速 9 km/h"
    );
  });

  it("updates to browser current-location weather when geolocation succeeds", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: {
          latitude: 30,
          longitude: 120,
          accuracy: 1,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: 0
      });
    });
    const fetchWeather = vi.fn(async () => new Response(JSON.stringify(weather({ locationName: "当前位置", temperature: 11, warmth: "heavy" }))));

    vi.stubGlobal("fetch", fetchWeather);
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition
      }
    });

    render(<WeatherCard weather={weather()} />);

    expect(screen.getByText(/^上海 ·/)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText(/^当前位置 ·/)).toBeInTheDocument());
    expect(getCurrentPosition).toHaveBeenCalled();
    expect(String(fetchWeather.mock.calls[0][0])).toContain("latitude=30");
    expect(String(fetchWeather.mock.calls[0][0])).toContain("longitude=120");
  });
});
