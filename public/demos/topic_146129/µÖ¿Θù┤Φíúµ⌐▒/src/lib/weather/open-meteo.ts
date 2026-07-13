import type { WarmthLevel } from "@/types/wardrobe";

export type WeatherLocation = {
  latitude: number;
  longitude: number;
  locationName: string;
};

export type WeatherSnapshot = {
  source: "open-meteo" | "fallback";
  locationName: string;
  latitude: number;
  longitude: number;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  condition: string;
  warmth: WarmthLevel;
  observedAt: string;
};

type OpenMeteoResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    precipitation?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
};

type Fetcher = typeof fetch;

type FetchOpenMeteoWeatherSnapshotOptions = {
  latitude: number;
  longitude: number;
  locationName?: string;
  fetcher?: Fetcher;
};

const conditionByCode = (code: number) => {
  if (code === 0) return "晴";
  if ([1, 2, 3].includes(code)) return "多云";
  if ([45, 48].includes(code)) return "雾";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "雨";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "雪";
  if ([95, 96, 99].includes(code)) return "雷雨";

  return "未知";
};

export const deriveWarmthFromTemperature = (temperature: number): WarmthLevel => {
  if (temperature >= 26) return "light";
  if (temperature <= 12) return "heavy";

  return "medium";
};

export const fetchOpenMeteoWeatherSnapshot = async ({
  latitude,
  longitude,
  locationName = getDefaultWeatherLocation().locationName,
  fetcher = fetch
}: FetchOpenMeteoWeatherSnapshotOptions): Promise<WeatherSnapshot> => {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,precipitation,wind_speed_10m,weather_code");
  url.searchParams.set("timezone", "Asia/Shanghai");

  const response = await fetcher(url);

  if (!response.ok) {
    throw new Error(`Open-Meteo 请求失败：${response.status}`);
  }

  const payload = (await response.json()) as OpenMeteoResponse;
  const current = payload.current;

  if (
    typeof current?.temperature_2m !== "number" ||
    typeof current.precipitation !== "number" ||
    typeof current.wind_speed_10m !== "number" ||
    typeof current.weather_code !== "number" ||
    !current.time
  ) {
    throw new Error("Open-Meteo 返回缺少当前天气字段");
  }

  return {
    source: "open-meteo",
    locationName,
    latitude,
    longitude,
    temperature: current.temperature_2m,
    precipitation: current.precipitation,
    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,
    condition: conditionByCode(current.weather_code),
    warmth: deriveWarmthFromTemperature(current.temperature_2m),
    observedAt: current.time
  };
};

export const getDefaultWeatherLocation = (): WeatherLocation => ({
  latitude: Number(process.env.DEFAULT_LATITUDE ?? "31.2304"),
  longitude: Number(process.env.DEFAULT_LONGITUDE ?? "121.4737"),
  locationName: process.env.DEFAULT_LOCATION_NAME ?? "上海"
});

export const getDefaultCoordinates = () => {
  const { latitude, longitude } = getDefaultWeatherLocation();

  return { latitude, longitude };
};

export const fallbackWeatherSnapshot = (location: WeatherLocation = getDefaultWeatherLocation()): WeatherSnapshot => ({
  source: "fallback",
  locationName: location.locationName,
  latitude: location.latitude,
  longitude: location.longitude,
  temperature: 24,
  precipitation: 0,
  windSpeed: 0,
  weatherCode: 0,
  condition: "未知",
  warmth: deriveWarmthFromTemperature(24),
  observedAt: new Date().toISOString()
});

export const getWeatherSnapshot = async (location: Partial<WeatherLocation> & { fetcher?: Fetcher } = {}) => {
  const defaultLocation = getDefaultWeatherLocation();
  const weatherLocation = {
    latitude: location.latitude ?? defaultLocation.latitude,
    longitude: location.longitude ?? defaultLocation.longitude,
    locationName: location.locationName ?? defaultLocation.locationName
  };

  try {
    return await fetchOpenMeteoWeatherSnapshot({ ...weatherLocation, fetcher: location.fetcher });
  } catch {
    return fallbackWeatherSnapshot(weatherLocation);
  }
};
