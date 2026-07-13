import { getWeatherSnapshot } from "@/lib/weather/open-meteo";

export const runtime = "nodejs";

const numberParam = (value: string | null) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = numberParam(url.searchParams.get("latitude"));
  const longitude = numberParam(url.searchParams.get("longitude"));
  const locationName = url.searchParams.get("locationName")?.trim() || undefined;

  const weather = await getWeatherSnapshot({
    latitude,
    longitude,
    locationName
  });

  return Response.json(weather);
}
