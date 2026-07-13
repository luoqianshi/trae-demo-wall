import { deriveSeasonFromShanghaiDate, getShanghaiDate } from "@/lib/dates/shanghai-date";
import { DAILY_RECOMMENDATION_TIME, getOrCreateDailyOutfitRecommendation } from "@/lib/recommendations/recommendation-service";
import { getWardrobeRepository } from "@/lib/wardrobe/repository-instance";
import { getWeatherSnapshot } from "@/lib/weather/open-meteo";

export const runtime = "nodejs";

type DailyRecommendationRequestBody = {
  recommendationDate?: string;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const readPostDate = async (request: Request) => {
  try {
    const body = (await request.json()) as DailyRecommendationRequestBody;
    const recommendationDate = body.recommendationDate?.trim();

    return recommendationDate && datePattern.test(recommendationDate) ? recommendationDate : undefined;
  } catch {
    return undefined;
  }
};

const buildDailyRecommendationResponse = async (recommendationDate: string) => {
  const repository = getWardrobeRepository();
  const weather = await getWeatherSnapshot();
  const result = getOrCreateDailyOutfitRecommendation(repository, recommendationDate, {
    scenario: "casual",
    season: deriveSeasonFromShanghaiDate(recommendationDate),
    weather
  });

  if (result.ok) {
    return Response.json({
      ok: true,
      recommendationDate,
      scheduledTime: DAILY_RECOMMENDATION_TIME,
      recommendation: result.recommendation
    });
  }

  return Response.json({
    ok: false,
    recommendationDate,
    scheduledTime: DAILY_RECOMMENDATION_TIME,
    missingCategories: result.missingCategories,
    message: result.message
  });
};

export async function GET() {
  return buildDailyRecommendationResponse(getShanghaiDate());
}

export async function POST(request: Request) {
  return buildDailyRecommendationResponse((await readPostDate(request)) ?? getShanghaiDate());
}
