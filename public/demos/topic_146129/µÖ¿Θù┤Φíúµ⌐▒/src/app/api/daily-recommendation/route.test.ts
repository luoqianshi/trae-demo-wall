import { describe, expect, it, vi, beforeEach } from "vitest";
import type { OutfitRecommendation } from "@/types/wardrobe";
import { GET, POST } from "./route";

const { deriveSeasonFromShanghaiDate, getOrCreateDailyOutfitRecommendation, getShanghaiDate, getWardrobeRepository, getWeatherSnapshot } = vi.hoisted(() => ({
  deriveSeasonFromShanghaiDate: vi.fn(),
  getOrCreateDailyOutfitRecommendation: vi.fn(),
  getShanghaiDate: vi.fn(),
  getWardrobeRepository: vi.fn(),
  getWeatherSnapshot: vi.fn()
}));

vi.mock("@/lib/recommendations/recommendation-service", () => ({
  DAILY_RECOMMENDATION_TIME: "08:15",
  getOrCreateDailyOutfitRecommendation
}));

vi.mock("@/lib/dates/shanghai-date", () => ({
  deriveSeasonFromShanghaiDate,
  getShanghaiDate
}));

vi.mock("@/lib/wardrobe/repository-instance", () => ({
  getWardrobeRepository
}));

vi.mock("@/lib/weather/open-meteo", () => ({
  getWeatherSnapshot
}));

const recommendation: OutfitRecommendation = {
  id: "recommendation-1",
  title: "休闲穿搭",
  reason: "适合今天的天气。",
  scenario: "casual",
  itemIds: ["top-1", "pants-1", "shoes-1"],
  isLiked: false,
  createdAt: "2026-06-14T00:15:00.000Z"
};

describe("/api/daily-recommendation", () => {
  beforeEach(() => {
    getOrCreateDailyOutfitRecommendation.mockReset();
    deriveSeasonFromShanghaiDate.mockReset();
    getShanghaiDate.mockReset();
    getWardrobeRepository.mockReset();
    getWeatherSnapshot.mockReset();
  });

  it("generates or reuses today's recommendation through GET", async () => {
    const repository = { name: "repository" };
    const weather = { temperature: 24, condition: "多云", warmth: "medium" };

    getShanghaiDate.mockReturnValue("2026-06-14");
    deriveSeasonFromShanghaiDate.mockReturnValue("summer");
    getWardrobeRepository.mockReturnValue(repository);
    getWeatherSnapshot.mockResolvedValue(weather);
    getOrCreateDailyOutfitRecommendation.mockReturnValue({
      ok: true,
      recommendation
    });

    const response = await GET(new Request("http://localhost/api/daily-recommendation"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getOrCreateDailyOutfitRecommendation).toHaveBeenCalledWith(repository, "2026-06-14", {
      scenario: "casual",
      season: "summer",
      weather
    });
    expect(payload).toEqual({
      ok: true,
      recommendationDate: "2026-06-14",
      scheduledTime: "08:15",
      recommendation
    });
  });

  it("lets the scheduled POST pass an explicit recommendation date", async () => {
    getWardrobeRepository.mockReturnValue({});
    getWeatherSnapshot.mockResolvedValue({ temperature: 18, condition: "雨", warmth: "medium" });
    deriveSeasonFromShanghaiDate.mockReturnValue("summer");
    getOrCreateDailyOutfitRecommendation.mockReturnValue({
      ok: false,
      missingCategories: ["shoes"],
      message: "还缺少鞋，暂时不能生成完整穿搭。"
    });

    const response = await POST(new Request("http://localhost/api/daily-recommendation", {
      body: JSON.stringify({ recommendationDate: "2026-06-15" }),
      method: "POST"
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: false,
      recommendationDate: "2026-06-15",
      scheduledTime: "08:15",
      missingCategories: ["shoes"],
      message: "还缺少鞋，暂时不能生成完整穿搭。"
    });
  });
});
