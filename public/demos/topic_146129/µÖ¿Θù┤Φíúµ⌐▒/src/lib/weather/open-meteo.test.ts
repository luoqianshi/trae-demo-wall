// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deriveWarmthFromTemperature,
  fallbackWeatherSnapshot,
  fetchOpenMeteoWeatherSnapshot,
  getDefaultWeatherLocation,
  getWeatherSnapshot
} from "./open-meteo";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("fetchOpenMeteoWeatherSnapshot", () => {
  it("parses current weather from Open-Meteo response with location and warmth", async () => {
    const snapshot = await fetchOpenMeteoWeatherSnapshot({
      latitude: 31.23,
      longitude: 121.47,
      locationName: "上海",
      fetcher: async () =>
        new Response(
          JSON.stringify({
            current: {
              time: "2026-06-14T08:15",
              temperature_2m: 26.8,
              precipitation: 0.2,
              wind_speed_10m: 9.4,
              weather_code: 3
            }
          })
        )
    });

    expect(snapshot).toEqual({
      source: "open-meteo",
      locationName: "上海",
      latitude: 31.23,
      longitude: 121.47,
      temperature: 26.8,
      precipitation: 0.2,
      windSpeed: 9.4,
      weatherCode: 3,
      condition: "多云",
      warmth: "light",
      observedAt: "2026-06-14T08:15"
    });
  });
});

describe("weather location and fallback", () => {
  it("reads default weather location from environment variables", () => {
    vi.stubEnv("DEFAULT_LATITUDE", "30.25");
    vi.stubEnv("DEFAULT_LONGITUDE", "120.16");
    vi.stubEnv("DEFAULT_LOCATION_NAME", "杭州");

    expect(getDefaultWeatherLocation()).toEqual({
      latitude: 30.25,
      longitude: 120.16,
      locationName: "杭州"
    });
  });

  it("falls back to default weather with a medium warmth hint", () => {
    const snapshot = fallbackWeatherSnapshot({
      latitude: 31.23,
      longitude: 121.47,
      locationName: "上海"
    });

    expect(snapshot).toMatchObject({
      source: "fallback",
      locationName: "上海",
      temperature: 24,
      warmth: "medium"
    });
  });

  it("fetches weather for browser-provided current coordinates", async () => {
    const snapshot = await getWeatherSnapshot({
      latitude: 30,
      longitude: 120,
      locationName: "当前位置",
      fetcher: async () =>
        new Response(
          JSON.stringify({
            current: {
              time: "2026-06-14T08:20",
              temperature_2m: 11,
              precipitation: 0,
              wind_speed_10m: 4,
              weather_code: 0
            }
          })
        )
    });

    expect(snapshot).toMatchObject({
      source: "open-meteo",
      locationName: "当前位置",
      latitude: 30,
      longitude: 120,
      warmth: "heavy"
    });
  });
});

describe("deriveWarmthFromTemperature", () => {
  it("maps temperature to a light, medium or heavy warmth hint", () => {
    expect(deriveWarmthFromTemperature(28)).toBe("light");
    expect(deriveWarmthFromTemperature(20)).toBe("medium");
    expect(deriveWarmthFromTemperature(10)).toBe("heavy");
  });
});
