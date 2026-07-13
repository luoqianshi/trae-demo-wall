"use client";

import { useEffect, useState } from "react";
import type { WeatherSnapshot } from "@/lib/weather/open-meteo";

export const formatWeatherLine = (weather: WeatherSnapshot) =>
  `${weather.locationName} · ${Math.round(weather.temperature)}°C · ${weather.condition} · 降水 ${weather.precipitation}mm · 风速 ${Math.round(
    weather.windSpeed
  )} km/h`;

function useCurrentWeather(weather: WeatherSnapshot) {
  const [currentWeather, setCurrentWeather] = useState(weather);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    let isMounted = true;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const params = new URLSearchParams({
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
          locationName: "当前位置"
        });

        try {
          const response = await fetch(`/api/weather?${params.toString()}`, { cache: "no-store" });

          if (!response.ok) {
            return;
          }

          const nextWeather = (await response.json()) as WeatherSnapshot;

          if (isMounted) {
            setCurrentWeather(nextWeather);
          }
        } catch {
          // Keep the server-rendered default city weather when browser location cannot be used.
        }
      },
      () => undefined,
      {
        enableHighAccuracy: false,
        maximumAge: 30 * 60 * 1000,
        timeout: 3000
      }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  return currentWeather;
}

export function WeatherLine({ className = "", weather }: { className?: string; weather: WeatherSnapshot }) {
  const currentWeather = useCurrentWeather(weather);

  return (
    <p
      aria-label="天气"
      className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-stone-700 ${className}`}
    >
      {formatWeatherLine(currentWeather)}
    </p>
  );
}

export function WeatherCard({ weather }: { weather: WeatherSnapshot }) {
  return (
    <section aria-label="天气" className="flex items-center rounded-lg border border-stone-200 bg-white px-4 py-2 shadow-sm">
      <WeatherLine className="text-stone-800" weather={weather} />
    </section>
  );
}
