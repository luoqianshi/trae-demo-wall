import { describe, expect, it } from "vitest";
import { generateOutfitRecommendation } from "./outfit-generator";
import type { WardrobeItem, WardrobeItemAttributes, WardrobeCategory } from "@/types/wardrobe";

const baseAttributes: WardrobeItemAttributes = {
  category: "top",
  primaryColor: "白色",
  material: "棉",
  seasons: ["multi"],
  scenarios: ["casual"],
  formality: "casual",
  styles: ["minimal"],
  warmth: "medium"
};

const item = (id: string, category: WardrobeCategory, attributes: Partial<WardrobeItemAttributes> = {}): WardrobeItem => ({
  id,
  imagePath: `/api/uploads/${id}.png`,
  status: "confirmed",
  recognitionStatus: "success",
  createdAt: "2026-06-14T00:00:00.000Z",
  updatedAt: "2026-06-14T00:00:00.000Z",
  ...baseAttributes,
  ...attributes,
  category
});

describe("generateOutfitRecommendation", () => {
  it("creates a complete outfit with required categories and weather additions", () => {
    const result = generateOutfitRecommendation(
      [
        item("top-1", "top", { primaryColor: "白色" }),
        item("pants-1", "pants", { primaryColor: "黑色" }),
        item("shoes-1", "shoes", { primaryColor: "棕色" }),
        item("outerwear-1", "outerwear", { warmth: "heavy" }),
        item("hat-1", "hat", { scenarios: ["outdoor"] })
      ],
      {
        scenario: "outdoor",
        weather: { temperature: 12, condition: "cloudy" }
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.itemIds).toEqual(["top-1", "pants-1", "shoes-1", "outerwear-1", "hat-1"]);
      expect(result.title).toBe("户外穿搭");
      expect(result.reason).toContain("12°C");
    }
  });

  it("reports missing required categories", () => {
    const result = generateOutfitRecommendation([item("top-1", "top"), item("pants-1", "pants")], {
      scenario: "casual"
    });

    expect(result).toEqual({
      ok: false,
      missingCategories: ["shoes"],
      message: "还缺少鞋，暂时不能生成完整穿搭。"
    });
  });

  it("prioritizes season and warmth matches when alternatives exist", () => {
    const result = generateOutfitRecommendation(
      [
        item("summer-top", "top", { seasons: ["summer"], warmth: "light" }),
        item("winter-top", "top", { seasons: ["winter"], warmth: "heavy" }),
        item("summer-pants", "pants", { seasons: ["summer"], warmth: "light" }),
        item("winter-pants", "pants", { seasons: ["winter"], warmth: "heavy" }),
        item("summer-shoes", "shoes", { seasons: ["summer"], warmth: "light" }),
        item("winter-shoes", "shoes", { seasons: ["winter"], warmth: "heavy" })
      ],
      {
        season: "winter",
        weather: { temperature: 8, warmth: "heavy" }
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.itemIds).toEqual(["winter-top", "winter-pants", "winter-shoes"]);
    }
  });

  it("prioritizes formality and color preference matches", () => {
    const result = generateOutfitRecommendation(
      [
        item("casual-top", "top", { formality: "casual", primaryColor: "白色" }),
        item("formal-top", "top", { formality: "formal", primaryColor: "黑色" }),
        item("casual-pants", "pants", { formality: "casual", primaryColor: "卡其色" }),
        item("formal-pants", "pants", { formality: "formal", primaryColor: "黑色" }),
        item("casual-shoes", "shoes", { formality: "casual", primaryColor: "棕色" }),
        item("formal-shoes", "shoes", { formality: "formal", primaryColor: "黑色" })
      ],
      {
        formality: "formal",
        colorPreference: "黑"
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.itemIds).toEqual(["formal-top", "formal-pants", "formal-shoes"]);
    }
  });

  it("prioritizes material preference matches", () => {
    const result = generateOutfitRecommendation(
      [
        item("cotton-top", "top", { material: "棉" }),
        item("wool-top", "top", { material: "羊毛" }),
        item("cotton-pants", "pants", { material: "棉" }),
        item("wool-pants", "pants", { material: "羊毛" }),
        item("canvas-shoes", "shoes", { material: "帆布" }),
        item("leather-shoes", "shoes", { material: "皮革" })
      ],
      {
        materialPreference: "羊毛"
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.itemIds).toEqual(["wool-top", "wool-pants", "canvas-shoes"]);
    }
  });

  it("uses historical item weights when sorting alternatives", () => {
    const result = generateOutfitRecommendation(
      [
        item("new-top", "top"),
        item("liked-top", "top"),
        item("new-pants", "pants"),
        item("liked-pants", "pants"),
        item("new-shoes", "shoes"),
        item("liked-shoes", "shoes")
      ],
      {
        itemWeights: {
          "liked-top": 10,
          "liked-pants": 10,
          "liked-shoes": 10
        }
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.itemIds).toEqual(["liked-top", "liked-pants", "liked-shoes"]);
    }
  });
});
