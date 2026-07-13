// @vitest-environment node

import { describe, expect, it } from "vitest";
import { createInMemoryWardrobeRepository } from "@/lib/wardrobe/local-repository";
import {
  DAILY_RECOMMENDATION_TIME,
  autoReplaceRecommendationItem,
  createCustomRequestOutfitRecommendations,
  createSavedOutfitRecommendation,
  getOrCreateDailyOutfitRecommendation,
  manualReplaceRecommendationItem,
  replaceDailyOutfitRecommendation
} from "./recommendation-service";
import type { WardrobeItemAttributes } from "@/types/wardrobe";

const attributes: WardrobeItemAttributes = {
  category: "top",
  primaryColor: "白色",
  material: "棉",
  seasons: ["multi"],
  scenarios: ["casual"],
  formality: "casual",
  styles: ["minimal"],
  warmth: "medium"
};

describe("recommendation service", () => {
  it("creates and saves a recommendation from confirmed wardrobe items", () => {
    const repository = createInMemoryWardrobeRepository();
    const top = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/top.png" }).id, attributes);
    const pants = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/pants.png" }).id, {
      ...attributes,
      category: "pants",
      primaryColor: "黑色"
    });
    const shoes = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/shoes.png" }).id, {
      ...attributes,
      category: "shoes",
      primaryColor: "棕色"
    });

    const result = createSavedOutfitRecommendation(repository, {
      scenario: "casual",
      weather: { temperature: 24 }
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recommendation.itemIds).toEqual([top.id, pants.id, shoes.id]);
      expect(repository.listOutfitRecommendations()).toHaveLength(1);
    }
  });

  it("returns missing categories without saving a recommendation", () => {
    const repository = createInMemoryWardrobeRepository();
    repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/top.png" }).id, attributes);

    const result = createSavedOutfitRecommendation(repository, { scenario: "casual" });

    expect(result).toMatchObject({
      ok: false,
      missingCategories: ["pants", "shoes"]
    });
    expect(repository.listOutfitRecommendations()).toEqual([]);
  });

  it("creates one daily recommendation for a date and reuses it on later opens", () => {
    const repository = createInMemoryWardrobeRepository();
    const top = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/top.png" }).id, attributes);
    const pants = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/pants.png" }).id, {
      ...attributes,
      category: "pants",
      primaryColor: "黑色"
    });
    const shoes = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/shoes.png" }).id, {
      ...attributes,
      category: "shoes",
      primaryColor: "棕色"
    });

    const first = getOrCreateDailyOutfitRecommendation(repository, "2026-06-14", {
      scenario: "casual",
      weather: { temperature: 24 }
    });
    const second = getOrCreateDailyOutfitRecommendation(repository, "2026-06-14", {
      scenario: "casual",
      weather: { temperature: 24 }
    });
    const daily = repository.getDailyRecommendationForDate("2026-06-14");

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.recommendation.id).toBe(first.recommendation.id);
      expect(second.recommendation.itemIds).toEqual([top.id, pants.id, shoes.id]);
      expect(first.recommendation.dailyRecommendationId).toBe(daily?.id);
      expect(daily?.recommendationId).toBe(first.recommendation.id);
    }
    expect(repository.listOutfitRecommendations()).toHaveLength(1);
    expect(DAILY_RECOMMENDATION_TIME).toBe("08:15");
  });

  it("replaces the outfit linked to the same daily recommendation when changing outfit", () => {
    const repository = createInMemoryWardrobeRepository();
    repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/top.png" }).id, attributes);
    repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/pants.png" }).id, {
      ...attributes,
      category: "pants",
      primaryColor: "黑色"
    });
    repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/shoes.png" }).id, {
      ...attributes,
      category: "shoes",
      primaryColor: "棕色"
    });

    const first = getOrCreateDailyOutfitRecommendation(repository, "2026-06-14", { scenario: "casual" });
    const replacement = replaceDailyOutfitRecommendation(repository, "2026-06-14", { scenario: "casual" });
    const daily = repository.getDailyRecommendationForDate("2026-06-14");

    expect(first.ok).toBe(true);
    expect(replacement.ok).toBe(true);
    if (first.ok && replacement.ok) {
      expect(replacement.recommendation.id).not.toBe(first.recommendation.id);
      expect(replacement.recommendation.dailyRecommendationId).toBe(first.recommendation.dailyRecommendationId);
      expect(daily?.recommendationId).toBe(replacement.recommendation.id);
    }
    expect(repository.listOutfitRecommendations()).toHaveLength(2);
  });

  it("uses different wardrobe items when replacing a daily recommendation and alternatives exist", () => {
    const repository = createInMemoryWardrobeRepository();
    const firstTop = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/top-1.png" }).id, attributes);
    const firstPants = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/pants-1.png" }).id, {
      ...attributes,
      category: "pants",
      primaryColor: "黑色"
    });
    const firstShoes = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/shoes-1.png" }).id, {
      ...attributes,
      category: "shoes",
      primaryColor: "棕色"
    });
    const secondTop = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/top-2.png" }).id, {
      ...attributes,
      primaryColor: "蓝色"
    });
    const secondPants = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/pants-2.png" }).id, {
      ...attributes,
      category: "pants",
      primaryColor: "灰色"
    });
    const secondShoes = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/shoes-2.png" }).id, {
      ...attributes,
      category: "shoes",
      primaryColor: "白色"
    });

    const first = getOrCreateDailyOutfitRecommendation(repository, "2026-06-14", { scenario: "casual" });
    const replacement = replaceDailyOutfitRecommendation(repository, "2026-06-14", { scenario: "casual" });

    expect(first.ok).toBe(true);
    expect(replacement.ok).toBe(true);
    if (first.ok && replacement.ok) {
      expect(first.recommendation.itemIds).toEqual([firstTop.id, firstPants.id, firstShoes.id]);
      expect(replacement.recommendation.itemIds).toEqual([secondTop.id, secondPants.id, secondShoes.id]);
    }
  });

  it("keeps a daily record without an outfit when the wardrobe is still missing required items", () => {
    const repository = createInMemoryWardrobeRepository();
    repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/top.png" }).id, attributes);

    const result = getOrCreateDailyOutfitRecommendation(repository, "2026-06-14", { scenario: "casual" });
    const daily = repository.getDailyRecommendationForDate("2026-06-14");

    expect(result).toMatchObject({
      ok: false,
      missingCategories: ["pants", "shoes"]
    });
    expect(daily).toMatchObject({
      recommendationDate: "2026-06-14"
    });
    expect(daily?.recommendationId).toBeUndefined();
    expect(repository.listOutfitRecommendations()).toEqual([]);
  });

  it("uses liked and worn history to weight future recommendations", () => {
    const repository = createInMemoryWardrobeRepository();
    repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/new-top.png" }).id, attributes);
    repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/new-pants.png" }).id, {
      ...attributes,
      category: "pants"
    });
    repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/new-shoes.png" }).id, {
      ...attributes,
      category: "shoes"
    });
    const likedTop = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/liked-top.png" }).id, attributes);
    const likedPants = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/liked-pants.png" }).id, {
      ...attributes,
      category: "pants"
    });
    const likedShoes = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/liked-shoes.png" }).id, {
      ...attributes,
      category: "shoes"
    });
    const likedRecommendation = repository.createOutfitRecommendation({
      title: "喜欢的组合",
      reason: "历史正向反馈。",
      itemIds: [likedTop.id, likedPants.id, likedShoes.id]
    });

    repository.recordLike({
      recommendationId: likedRecommendation.id,
      liked: true,
      eventDate: "2026-06-13"
    });
    repository.recordWearToday({
      recommendationId: likedRecommendation.id,
      eventDate: "2026-06-13"
    });

    const result = createSavedOutfitRecommendation(repository, { scenario: "casual" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recommendation.itemIds).toEqual([likedTop.id, likedPants.id, likedShoes.id]);
    }
  });

  it("creates three differentiated recommendations for one custom request and stores the request snapshot", () => {
    const repository = createInMemoryWardrobeRepository();
    const tops = ["白色", "蓝色", "灰色"].map((primaryColor, index) =>
      repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: `/top-${index + 1}.png` }).id, {
        ...attributes,
        primaryColor
      })
    );
    const pants = ["黑色", "卡其色", "藏青色"].map((primaryColor, index) =>
      repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: `/pants-${index + 1}.png` }).id, {
        ...attributes,
        category: "pants",
        primaryColor
      })
    );
    const shoes = ["棕色", "白色", "黑色"].map((primaryColor, index) =>
      repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: `/shoes-${index + 1}.png` }).id, {
        ...attributes,
        category: "shoes",
        primaryColor
      })
    );

    const result = createCustomRequestOutfitRecommendations(repository, {
      requestText: "今天要见客户，想正式一点，但别太沉闷",
      scenario: "formal",
      formality: "formal",
      weather: { temperature: 22 }
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recommendations).toHaveLength(3);
      expect(result.requestGroupId).toMatch(/request-/);
      expect(result.recommendations.map((recommendation) => recommendation.itemIds)).toEqual([
        [tops[0].id, pants[0].id, shoes[0].id],
        [tops[1].id, pants[1].id, shoes[1].id],
        [tops[2].id, pants[2].id, shoes[2].id]
      ]);
      expect(result.recommendations.map((recommendation) => recommendation.inputSnapshot)).toEqual([
        expect.objectContaining({
          source: "custom_request",
          requestText: "今天要见客户，想正式一点，但别太沉闷",
          requestGroupId: result.requestGroupId,
          requestIndex: 1
        }),
        expect.objectContaining({
          source: "custom_request",
          requestText: "今天要见客户，想正式一点，但别太沉闷",
          requestGroupId: result.requestGroupId,
          requestIndex: 2
        }),
        expect.objectContaining({
          source: "custom_request",
          requestText: "今天要见客户，想正式一点，但别太沉闷",
          requestGroupId: result.requestGroupId,
          requestIndex: 3
        })
      ]);
    }
    expect(repository.listOutfitRecommendations()).toHaveLength(3);
  });

  it("automatically replaces only the selected item category and records replacement context", () => {
    const repository = createInMemoryWardrobeRepository();
    const firstTop = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/top-1.png" }).id, attributes);
    const secondTop = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/top-2.png" }).id, {
      ...attributes,
      primaryColor: "蓝色"
    });
    const pants = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/pants.png" }).id, {
      ...attributes,
      category: "pants"
    });
    const shoes = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/shoes.png" }).id, {
      ...attributes,
      category: "shoes"
    });
    const baseRecommendation = repository.createOutfitRecommendation({
      title: "诉求推荐 1",
      reason: "原始推荐理由。",
      itemIds: [firstTop.id, pants.id, shoes.id],
      inputSnapshot: {
        source: "custom_request",
        requestText: "今天想轻便一点",
        requestGroupId: "request-group-1"
      }
    });

    const result = autoReplaceRecommendationItem(repository, {
      recommendationId: baseRecommendation.id,
      itemId: firstTop.id,
      eventDate: "2026-06-14",
      weather: { temperature: 24 }
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recommendation.itemIds).toEqual([secondTop.id, pants.id, shoes.id]);
      expect(result.recommendation.reason).toContain("蓝色棉上衣");
      expect(result.recommendation.reason).toContain("白色棉裤子");
      expect(result.recommendation.reason).toContain("白色棉鞋");
      expect(result.recommendation.reason).not.toContain("将上衣调整为蓝色棉");
      expect(repository.getOutfitRecommendation(baseRecommendation.id)?.itemIds).toEqual([firstTop.id, pants.id, shoes.id]);
      expect(result.recommendation.inputSnapshot).toMatchObject({
        source: "item_replace",
        requestText: "今天想轻便一点",
        requestGroupId: "request-group-1",
        baseRecommendationId: baseRecommendation.id,
        replacedItemId: firstTop.id,
        replacementItemId: secondTop.id,
        replacedCategory: "top",
        replaceMode: "auto"
      });
      expect(repository.listBehaviorEvents()[0]).toMatchObject({
        eventType: "auto_replace_item",
        recommendationId: result.recommendation.id,
        inputSnapshot: expect.objectContaining({
          baseRecommendationId: baseRecommendation.id,
          replacedItemId: firstTop.id,
          replacementItemId: secondTop.id,
          replacedCategory: "top",
          replaceMode: "auto"
        })
      });
    }
  });

  it("manually replaces the selected item with the user-selected same-category item", () => {
    const repository = createInMemoryWardrobeRepository();
    const firstTop = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/top-1.png" }).id, attributes);
    const selectedTop = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/top-2.png" }).id, {
      ...attributes,
      primaryColor: "灰色"
    });
    const pants = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/pants.png" }).id, {
      ...attributes,
      category: "pants"
    });
    const shoes = repository.confirmWardrobeItem(repository.createWardrobeItem({ imagePath: "/shoes.png" }).id, {
      ...attributes,
      category: "shoes"
    });
    const baseRecommendation = repository.createOutfitRecommendation({
      title: "每日推荐",
      reason: "原始推荐理由。",
      itemIds: [firstTop.id, pants.id, shoes.id],
      inputSnapshot: {
        source: "daily"
      }
    });

    const result = manualReplaceRecommendationItem(repository, {
      recommendationId: baseRecommendation.id,
      itemId: firstTop.id,
      replacementItemId: selectedTop.id,
      eventDate: "2026-06-14",
      weather: { temperature: 24 }
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recommendation.itemIds).toEqual([selectedTop.id, pants.id, shoes.id]);
      expect(result.recommendation.reason).toContain("灰色棉上衣");
      expect(result.recommendation.reason).toContain("白色棉裤子");
      expect(result.recommendation.reason).toContain("白色棉鞋");
      expect(result.recommendation.inputSnapshot).toMatchObject({
        source: "item_replace",
        baseRecommendationId: baseRecommendation.id,
        replacedItemId: firstTop.id,
        replacementItemId: selectedTop.id,
        replacedCategory: "top",
        replaceMode: "manual"
      });
      expect(repository.listBehaviorEvents()[0]).toMatchObject({
        eventType: "manual_replace_item",
        recommendationId: result.recommendation.id
      });
    }
  });
});
