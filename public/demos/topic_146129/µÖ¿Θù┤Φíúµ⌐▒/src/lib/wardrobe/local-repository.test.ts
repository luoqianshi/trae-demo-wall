// @vitest-environment node

import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { createInMemoryWardrobeRepository, createWardrobeRepository } from "./local-repository";

const confirmedTop = {
  category: "top" as const,
  primaryColor: "白色",
  secondaryColor: "蓝色",
  material: "棉",
  seasons: ["summer" as const],
  scenarios: ["casual" as const],
  formality: "casual" as const,
  styles: ["minimal" as const],
  warmth: "light" as const
};

describe("local wardrobe repository", () => {
  it("stores product detail text on draft items for source-based intake", () => {
    const repository = createInMemoryWardrobeRepository();
    const productDetailText = "男士黑色牛仔裤，材质：棉98% 氨纶2%，适合春秋通勤。";

    const item = repository.createWardrobeItem({
      imagePath: "/product-source-placeholder.svg",
      originalFilename: "商品详情文本",
      sourceType: "product_detail_text",
      productDetailText,
      recognitionSource: "product_detail_text",
      fieldConfidence: {
        material: "high",
        primaryColor: "high"
      }
    });

    expect(item).toMatchObject({
      imagePath: "/product-source-placeholder.svg",
      originalFilename: "商品详情文本",
      sourceType: "product_detail_text",
      productDetailText,
      recognitionSource: "product_detail_text",
      fieldConfidence: {
        material: "high",
        primaryColor: "high"
      }
    });
  });

  it("stores product URLs on draft items for source-based intake", () => {
    const repository = createInMemoryWardrobeRepository();
    const productUrl = "https://example.com/item/123";

    const item = repository.createWardrobeItem({
      imagePath: "/product-source-placeholder.svg",
      originalFilename: "商品链接",
      sourceType: "product_url",
      productUrl,
      recognitionSource: "product_url",
      fieldConfidence: {
        productUrl: "high"
      }
    });

    expect(item).toMatchObject({
      imagePath: "/product-source-placeholder.svg",
      originalFilename: "商品链接",
      sourceType: "product_url",
      productUrl,
      recognitionSource: "product_url",
      fieldConfidence: {
        productUrl: "high"
      }
    });
  });

  it("saves recognition drafts and confirmed corrections for recognition quality checks", () => {
    const repository = createInMemoryWardrobeRepository();
    const item = repository.createWardrobeItem({
      imagePath: "/uploads/black-shoes.jpg",
      originalFilename: "black-shoes.jpg"
    });

    repository.saveRecognitionDraft({
      itemId: item.id,
      provider: "mock",
      model: "filename-hints-v1",
      rawResult: { confidence: "mock" },
      attributes: { ...confirmedTop, category: "shoes", primaryColor: "黑色", material: "皮革" }
    });

    expect(repository.listDraftWardrobeItems()[0]).toMatchObject({
      id: item.id,
      recognitionStatus: "success",
      category: "shoes",
      primaryColor: "黑色",
      material: "皮革"
    });

    repository.confirmWardrobeItem(item.id, { ...confirmedTop, category: "shoes", primaryColor: "棕色", material: "皮革" });

    expect(repository.listRecognitionRuns(item.id)[0]).toMatchObject({
      itemId: item.id,
      provider: "mock",
      recognitionStatus: "success",
      confirmedFields: expect.objectContaining({
        primaryColor: "棕色"
      })
    });
  });

  it("stores recognition failures without removing the draft item", () => {
    const repository = createInMemoryWardrobeRepository();
    const item = repository.createWardrobeItem({
      imagePath: "/uploads/unknown.jpg",
      originalFilename: "unknown.jpg"
    });

    const failedRun = repository.saveRecognitionFailure({
      itemId: item.id,
      provider: "mock",
      model: "filename-hints-v1",
      rawResult: { source: "upload" },
      errorMessage: "识别服务暂时不可用"
    });

    expect(failedRun).toMatchObject({
      itemId: item.id,
      provider: "mock",
      recognitionStatus: "failed",
      errorMessage: "识别服务暂时不可用"
    });
    expect(repository.listDraftWardrobeItems()[0]).toMatchObject({
      id: item.id,
      status: "draft",
      recognitionStatus: "failed"
    });
    expect(repository.listRecognitionRuns(item.id)[0]).toMatchObject({
      recognitionStatus: "failed",
      errorMessage: "识别服务暂时不可用"
    });
  });

  it("creates draft items with pending recognition and only confirmed items enter recommendation inventory", () => {
    const repository = createInMemoryWardrobeRepository();

    const item = repository.createWardrobeItem({
      imagePath: "/uploads/top.jpg",
      originalFilename: "top.jpg"
    });

    expect(item.status).toBe("draft");
    expect(item.recognitionStatus).toBe("pending");
    expect(repository.listDraftWardrobeItems()).toHaveLength(1);
    expect(repository.listConfirmedWardrobeItems()).toEqual([]);

    const confirmed = repository.confirmWardrobeItem(item.id, confirmedTop);

    expect(confirmed.status).toBe("confirmed");
    expect(repository.listDraftWardrobeItems()).toEqual([]);
    expect(repository.listConfirmedWardrobeItems()).toHaveLength(1);
    expect(repository.listConfirmedWardrobeItems()[0]).toMatchObject({
      id: item.id,
      category: "top",
      primaryColor: "白色",
      material: "棉"
    });
  });

  it("saves outfit recommendation item links and reports item usage counts", () => {
    const repository = createInMemoryWardrobeRepository();
    const top = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/top.jpg" }).id,
      confirmedTop
    );
    const pants = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/pants.jpg" }).id,
      { ...confirmedTop, category: "pants", primaryColor: "黑色" }
    );
    const shoes = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/shoes.jpg" }).id,
      { ...confirmedTop, category: "shoes", primaryColor: "棕色", material: "皮革" }
    );

    repository.createOutfitRecommendation({
      title: "清爽通勤",
      scenario: "casual",
      reason: "白色上衣和黑色裤子搭配稳妥，棕色鞋子增加层次。",
      itemIds: [top.id, pants.id, shoes.id, top.id],
      weatherSnapshot: { temperature: 26, condition: "clear" },
      inputSnapshot: { text: "轻便一点" }
    });

    const usageStats = repository.getWardrobeItemUsageStats();

    expect(repository.listOutfitRecommendations()).toHaveLength(1);
    expect(usageStats).toEqual([
      expect.objectContaining({ itemId: top.id, referencedOutfitCount: 1 }),
      expect.objectContaining({ itemId: pants.id, referencedOutfitCount: 1 }),
      expect.objectContaining({ itemId: shoes.id, referencedOutfitCount: 1 })
    ]);
  });

  it("records like, wear-today and change-outfit events with context while deduplicating daily wear records", () => {
    const repository = createInMemoryWardrobeRepository();
    const top = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/top.jpg" }).id,
      confirmedTop
    );
    const pants = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/pants.jpg" }).id,
      { ...confirmedTop, category: "pants", primaryColor: "黑色" }
    );
    const shoes = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/shoes.jpg" }).id,
      { ...confirmedTop, category: "shoes", primaryColor: "棕色" }
    );
    const recommendation = repository.createOutfitRecommendation({
      title: "周末轻装",
      scenario: "casual",
      reason: "轻薄材质适合今天的温度。",
      itemIds: [top.id, pants.id, shoes.id],
      weatherSnapshot: { temperature: 29, condition: "sunny" },
      inputSnapshot: { scene: "休闲" }
    });

    repository.recordLike({
      recommendationId: recommendation.id,
      liked: true,
      eventDate: "2026-06-14",
      weatherSnapshot: { temperature: 29 },
      inputSnapshot: { scene: "休闲" },
      aiReason: recommendation.reason
    });
    const firstWear = repository.recordWearToday({
      recommendationId: recommendation.id,
      eventDate: "2026-06-14"
    });
    const duplicateWear = repository.recordWearToday({
      recommendationId: recommendation.id,
      eventDate: "2026-06-14"
    });
    repository.recordChangeOutfit({
      recommendationId: recommendation.id,
      eventDate: "2026-06-14",
      weatherSnapshot: { temperature: 29 },
      inputSnapshot: { scene: "休闲" },
      aiReason: recommendation.reason
    });

    expect(repository.getOutfitRecommendation(recommendation.id)?.isLiked).toBe(true);
    expect(duplicateWear.id).toBe(firstWear.id);
    expect(repository.listBehaviorEvents()).toEqual([
      expect.objectContaining({
        eventType: "like",
        recommendationId: recommendation.id,
        isLiked: true,
        itemIds: [top.id, pants.id, shoes.id]
      }),
      expect.objectContaining({
        eventType: "wear_today",
        recommendationId: recommendation.id,
        isWorn: true
      }),
      expect.objectContaining({
        eventType: "change_outfit",
        recommendationId: recommendation.id,
        isSkipped: true
      })
    ]);
  });

  it("records automatic and manual item replacement events with replacement context", () => {
    const repository = createInMemoryWardrobeRepository();
    const firstTop = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/top-1.jpg" }).id,
      confirmedTop
    );
    const secondTop = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/top-2.jpg" }).id,
      { ...confirmedTop, primaryColor: "蓝色" }
    );
    const pants = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/pants.jpg" }).id,
      { ...confirmedTop, category: "pants", primaryColor: "黑色" }
    );
    const shoes = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/shoes.jpg" }).id,
      { ...confirmedTop, category: "shoes", primaryColor: "棕色" }
    );
    const baseRecommendation = repository.createOutfitRecommendation({
      title: "原始组合",
      reason: "白色上衣更清爽。",
      itemIds: [firstTop.id, pants.id, shoes.id],
      inputSnapshot: {
        source: "custom_request",
        requestText: "今天想轻便一点",
        requestGroupId: "request-group-1"
      }
    });
    const adjustedRecommendation = repository.createOutfitRecommendation({
      title: "调整后组合",
      reason: "换成蓝色上衣。",
      itemIds: [secondTop.id, pants.id, shoes.id],
      inputSnapshot: {
        source: "item_replace",
        requestText: "今天想轻便一点",
        requestGroupId: "request-group-1",
        baseRecommendationId: baseRecommendation.id,
        replacedItemId: firstTop.id,
        replacementItemId: secondTop.id,
        replacedCategory: "top",
        replaceMode: "auto"
      }
    });

    repository.recordAutoReplaceItem({
      recommendationId: adjustedRecommendation.id,
      eventDate: "2026-06-14",
      weatherSnapshot: { temperature: 26 },
      inputSnapshot: {
        baseRecommendationId: baseRecommendation.id,
        replacedItemId: firstTop.id,
        replacementItemId: secondTop.id,
        replacedCategory: "top",
        replaceMode: "auto"
      }
    });
    repository.recordManualReplaceItem({
      recommendationId: adjustedRecommendation.id,
      eventDate: "2026-06-14",
      weatherSnapshot: { temperature: 26 },
      inputSnapshot: {
        baseRecommendationId: baseRecommendation.id,
        replacedItemId: firstTop.id,
        replacementItemId: secondTop.id,
        replacedCategory: "top",
        replaceMode: "manual"
      }
    });

    expect(repository.listBehaviorEvents()).toEqual([
      expect.objectContaining({
        eventType: "auto_replace_item",
        recommendationId: adjustedRecommendation.id,
        itemIds: [secondTop.id, pants.id, shoes.id],
        inputSnapshot: expect.objectContaining({
          baseRecommendationId: baseRecommendation.id,
          replacedItemId: firstTop.id,
          replacementItemId: secondTop.id,
          replacedCategory: "top",
          replaceMode: "auto"
        })
      }),
      expect.objectContaining({
        eventType: "manual_replace_item",
        recommendationId: adjustedRecommendation.id,
        itemIds: [secondTop.id, pants.id, shoes.id],
        inputSnapshot: expect.objectContaining({
          baseRecommendationId: baseRecommendation.id,
          replacedItemId: firstTop.id,
          replacementItemId: secondTop.id,
          replacedCategory: "top",
          replaceMode: "manual"
        })
      })
    ]);
  });

  it("stores one daily recommendation record per Shanghai date and can update its linked outfit", () => {
    const repository = createInMemoryWardrobeRepository();
    const firstDaily = repository.ensureDailyRecommendationForDate("2026-06-14");
    const secondDaily = repository.ensureDailyRecommendationForDate("2026-06-14");
    const top = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/top.jpg" }).id,
      confirmedTop
    );
    const pants = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/pants.jpg" }).id,
      { ...confirmedTop, category: "pants", primaryColor: "黑色" }
    );
    const shoes = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/shoes.jpg" }).id,
      { ...confirmedTop, category: "shoes", primaryColor: "棕色" }
    );
    const recommendation = repository.createOutfitRecommendation({
      title: "今日穿搭",
      reason: "适合今天。",
      itemIds: [top.id, pants.id, shoes.id],
      dailyRecommendationId: firstDaily.id
    });

    const updatedDaily = repository.attachRecommendationToDaily(firstDaily.id, recommendation.id);

    expect(secondDaily.id).toBe(firstDaily.id);
    expect(repository.getDailyRecommendationForDate("2026-06-14")).toMatchObject({
      id: firstDaily.id,
      recommendationDate: "2026-06-14",
      recommendationId: recommendation.id
    });
    expect(updatedDaily.recommendationId).toBe(recommendation.id);
  });

  it("migrates an existing recommendation table before saving daily recommendation links", () => {
    const db = new Database(":memory:");
    db.exec(`
      CREATE TABLE outfit_recommendations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        scenario TEXT,
        reason TEXT NOT NULL,
        weather_snapshot_json TEXT,
        input_snapshot_json TEXT,
        is_liked INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);
    const repository = createWardrobeRepository(db);
    const daily = repository.ensureDailyRecommendationForDate("2026-06-14");
    const top = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/top.jpg" }).id,
      confirmedTop
    );
    const pants = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/pants.jpg" }).id,
      { ...confirmedTop, category: "pants", primaryColor: "黑色" }
    );
    const shoes = repository.confirmWardrobeItem(
      repository.createWardrobeItem({ imagePath: "/uploads/shoes.jpg" }).id,
      { ...confirmedTop, category: "shoes", primaryColor: "棕色" }
    );

    const recommendation = repository.createOutfitRecommendation({
      title: "今日穿搭",
      reason: "适合今天。",
      itemIds: [top.id, pants.id, shoes.id],
      dailyRecommendationId: daily.id
    });

    expect(recommendation.dailyRecommendationId).toBe(daily.id);
  });
});
