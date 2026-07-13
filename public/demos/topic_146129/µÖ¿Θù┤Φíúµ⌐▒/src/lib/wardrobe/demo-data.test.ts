// @vitest-environment node

import { describe, expect, it } from "vitest";
import { getOutfitStyleLabel } from "@/lib/recommendations/outfit-style";
import { createInMemoryWardrobeRepository } from "./local-repository";
import { ensureDemoWardrobeData } from "./demo-data";

describe("demo wardrobe data", () => {
  it("seeds multiple style outfits and can run repeatedly without duplicates", () => {
    const repository = createInMemoryWardrobeRepository();

    ensureDemoWardrobeData(repository);

    const firstItems = repository.listConfirmedWardrobeItems();
    const firstRecommendations = repository.listOutfitRecommendations();
    const itemsById = new Map(firstItems.map((item) => [item.id, item]));
    const demoStyleLabels = firstRecommendations
      .filter((recommendation) => recommendation.inputSnapshot?.source === "demo_seed")
      .map((recommendation) =>
        getOutfitStyleLabel(
          recommendation.itemIds.map((itemId) => itemsById.get(itemId)).filter((item) => Boolean(item)),
          recommendation
        )
      );

    expect(demoStyleLabels).toEqual(expect.arrayContaining(["商务风格", "街头风格", "户外风格", "复古风格", "运动风格"]));

    ensureDemoWardrobeData(repository);

    expect(repository.listConfirmedWardrobeItems()).toHaveLength(firstItems.length);
    expect(repository.listOutfitRecommendations()).toHaveLength(firstRecommendations.length);
  });
});
