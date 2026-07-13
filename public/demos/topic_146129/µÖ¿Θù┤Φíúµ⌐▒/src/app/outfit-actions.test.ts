// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  autoReplaceRecommendationItem,
  changeOutfitRecommendation,
  createCustomRequestRecommendations,
  manualReplaceRecommendationItem,
  toggleLikeRecommendation,
  wearRecommendationToday
} from "./outfit-actions";

const {
  autoReplaceRecommendationItemService,
  createCustomRequestOutfitRecommendations,
  deriveSeasonFromShanghaiDate,
  getShanghaiDate,
  getWeatherSnapshot,
  getWardrobeRepository,
  manualReplaceRecommendationItemService,
  recordChangeOutfit,
  recordLike,
  recordWearToday,
  replaceDailyOutfitRecommendation,
  revalidatePath,
  redirect
} = vi.hoisted(() => ({
  autoReplaceRecommendationItemService: vi.fn(),
  createCustomRequestOutfitRecommendations: vi.fn(),
  deriveSeasonFromShanghaiDate: vi.fn(),
  getShanghaiDate: vi.fn(),
  getWeatherSnapshot: vi.fn(),
  getWardrobeRepository: vi.fn(),
  manualReplaceRecommendationItemService: vi.fn(),
  recordChangeOutfit: vi.fn(),
  recordLike: vi.fn(),
  recordWearToday: vi.fn(),
  replaceDailyOutfitRecommendation: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  })
}));

vi.mock("@/lib/dates/shanghai-date", () => ({
  deriveSeasonFromShanghaiDate,
  getShanghaiDate
}));

vi.mock("@/lib/weather/open-meteo", () => ({
  getWeatherSnapshot
}));

vi.mock("@/lib/recommendations/recommendation-service", () => ({
  autoReplaceRecommendationItem: autoReplaceRecommendationItemService,
  createCustomRequestOutfitRecommendations,
  manualReplaceRecommendationItem: manualReplaceRecommendationItemService,
  replaceDailyOutfitRecommendation
}));

vi.mock("@/lib/wardrobe/repository-instance", () => ({
  getWardrobeRepository
}));

vi.mock("next/cache", () => ({
  revalidatePath
}));

vi.mock("next/navigation", () => ({
  redirect
}));

const weatherSnapshot = {
  condition: "多云",
  temperature: 22,
  warmth: "medium"
};

const formDataFor = (recommendationId: string) => {
  const formData = new FormData();
  formData.set("recommendationId", recommendationId);

  return formData;
};

describe("outfit actions", () => {
  beforeEach(() => {
    getShanghaiDate.mockReturnValue("2026-06-14");
    deriveSeasonFromShanghaiDate.mockReturnValue("summer");
    getWeatherSnapshot.mockResolvedValue(weatherSnapshot);
    getWardrobeRepository.mockReturnValue({
      getOutfitRecommendation: vi.fn(() => ({
        id: "recommendation-1",
        isLiked: false
      })),
      recordChangeOutfit,
      recordLike,
      recordWearToday
    });
    recordChangeOutfit.mockReset();
    recordLike.mockReset();
    recordWearToday.mockReset();
    autoReplaceRecommendationItemService.mockReset();
    createCustomRequestOutfitRecommendations.mockReset();
    manualReplaceRecommendationItemService.mockReset();
    replaceDailyOutfitRecommendation.mockReset();
    revalidatePath.mockReset();
    redirect.mockClear();
  });

  it("records the current weather when liking a recommendation", async () => {
    await toggleLikeRecommendation(formDataFor("recommendation-1"));

    expect(recordLike).toHaveBeenCalledWith({
      recommendationId: "recommendation-1",
      liked: true,
      eventDate: "2026-06-14",
      weatherSnapshot
    });
  });

  it("records the current weather when wearing a recommendation today", async () => {
    await wearRecommendationToday(formDataFor("recommendation-1"));

    expect(recordWearToday).toHaveBeenCalledWith({
      recommendationId: "recommendation-1",
      eventDate: "2026-06-14",
      weatherSnapshot
    });
  });

  it("records the current weather when changing outfit and reuses it for the replacement", async () => {
    await expect(changeOutfitRecommendation(formDataFor("recommendation-1"))).rejects.toThrow("redirect:/");

    expect(recordChangeOutfit).toHaveBeenCalledWith({
      recommendationId: "recommendation-1",
      eventDate: "2026-06-14",
      weatherSnapshot
    });
    expect(replaceDailyOutfitRecommendation).toHaveBeenCalledWith(expect.anything(), "2026-06-14", {
      scenario: "casual",
      season: "summer",
      weather: weatherSnapshot
    });
  });

  it("creates a custom request recommendation batch and redirects to the batch result", async () => {
    const formData = new FormData();
    formData.set("requestText", "今天要见客户，想正式一点");
    formData.set("scenario", "formal");
    formData.set("season", "summer");
    formData.set("formality", "formal");
    formData.set("colorPreference", "黑");
    formData.set("materialPreference", "棉");
    createCustomRequestOutfitRecommendations.mockReturnValue({
      ok: true,
      requestGroupId: "request-group-1",
      recommendations: []
    });

    await expect(createCustomRequestRecommendations(formData)).rejects.toThrow("redirect:/request?requestGroupId=request-group-1");

    expect(createCustomRequestOutfitRecommendations).toHaveBeenCalledWith(expect.anything(), {
      requestText: "今天要见客户，想正式一点",
      scenario: "formal",
      season: "summer",
      formality: "formal",
      colorPreference: "黑",
      materialPreference: "棉",
      weather: weatherSnapshot
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/request");
  });

  it("uses the current season for custom requests when season is not selected", async () => {
    const formData = new FormData();
    formData.set("requestText", "今天想穿得轻一点");
    createCustomRequestOutfitRecommendations.mockReturnValue({
      ok: true,
      requestGroupId: "request-group-2",
      recommendations: []
    });

    await expect(createCustomRequestRecommendations(formData)).rejects.toThrow("redirect:/request?requestGroupId=request-group-2");

    expect(createCustomRequestOutfitRecommendations).toHaveBeenCalledWith(expect.anything(), {
      requestText: "今天想穿得轻一点",
      scenario: undefined,
      season: "summer",
      formality: undefined,
      colorPreference: undefined,
      materialPreference: undefined,
      weather: weatherSnapshot
    });
  });

  it("automatically replaces an item from a recommendation and keeps request context in the URL", async () => {
    const formData = new FormData();
    formData.set("recommendationId", "recommendation-1");
    formData.set("itemId", "top-1");
    formData.set("requestGroupId", "request-group-1");
    autoReplaceRecommendationItemService.mockReturnValue({
      ok: true,
      recommendation: {
        id: "recommendation-2"
      }
    });

    await expect(autoReplaceRecommendationItem(formData)).rejects.toThrow(
      "redirect:/request?requestGroupId=request-group-1&focusRecommendationId=recommendation-2"
    );

    expect(autoReplaceRecommendationItemService).toHaveBeenCalledWith(expect.anything(), {
      recommendationId: "recommendation-1",
      itemId: "top-1",
      eventDate: "2026-06-14",
      weather: weatherSnapshot
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/request");
    expect(revalidatePath).toHaveBeenCalledWith("/outfits");
  });

  it("redirects back with a visible message when automatic replacement has no candidate", async () => {
    const formData = new FormData();
    formData.set("recommendationId", "recommendation-1");
    formData.set("itemId", "top-1");
    autoReplaceRecommendationItemService.mockReturnValue({
      ok: false,
      missingCategories: ["top"],
      message: "没有可替换的上衣，可以先去衣橱录入。"
    });

    await expect(autoReplaceRecommendationItem(formData)).rejects.toThrow(
      "redirect:/?replaceMessage=%E6%B2%A1%E6%9C%89%E5%8F%AF%E6%9B%BF%E6%8D%A2%E7%9A%84%E4%B8%8A%E8%A1%A3%EF%BC%8C%E5%8F%AF%E4%BB%A5%E5%85%88%E5%8E%BB%E8%A1%A3%E6%A9%B1%E5%BD%95%E5%85%A5%E3%80%82"
    );
  });

  it("manually replaces an item with the selected wardrobe item", async () => {
    const formData = new FormData();
    formData.set("recommendationId", "recommendation-1");
    formData.set("itemId", "top-1");
    formData.set("replacementItemId", "top-2");
    manualReplaceRecommendationItemService.mockReturnValue({
      ok: true,
      recommendation: {
        id: "recommendation-3"
      }
    });

    await expect(manualReplaceRecommendationItem(formData)).rejects.toThrow("/?focusRecommendationId=recommendation-3");

    expect(manualReplaceRecommendationItemService).toHaveBeenCalledWith(expect.anything(), {
      recommendationId: "recommendation-1",
      itemId: "top-1",
      replacementItemId: "top-2",
      eventDate: "2026-06-14",
      weather: weatherSnapshot
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/outfits");
  });

  it("manually replaces an item from a custom request and keeps request context in the URL", async () => {
    const formData = new FormData();
    formData.set("recommendationId", "recommendation-1");
    formData.set("itemId", "top-1");
    formData.set("replacementItemId", "top-2");
    formData.set("requestGroupId", "request-group-1");
    manualReplaceRecommendationItemService.mockReturnValue({
      ok: true,
      recommendation: {
        id: "recommendation-4"
      }
    });

    await expect(manualReplaceRecommendationItem(formData)).rejects.toThrow(
      "/request?requestGroupId=request-group-1&focusRecommendationId=recommendation-4"
    );

    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/request");
    expect(revalidatePath).toHaveBeenCalledWith("/outfits");
  });
});
