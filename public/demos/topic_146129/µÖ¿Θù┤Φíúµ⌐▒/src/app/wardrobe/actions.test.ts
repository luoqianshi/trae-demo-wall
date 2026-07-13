// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateWardrobeItem } from "./actions";

const { confirmWardrobeItem, redirect, revalidatePath } = vi.hoisted(() => ({
  confirmWardrobeItem: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  revalidatePath: vi.fn()
}));

vi.mock("@/lib/wardrobe/repository-instance", () => ({
  getWardrobeRepository: () => ({
    confirmWardrobeItem
  })
}));

vi.mock("next/cache", () => ({
  revalidatePath
}));

vi.mock("next/navigation", () => ({
  redirect
}));

describe("updateWardrobeItem", () => {
  beforeEach(() => {
    confirmWardrobeItem.mockReset();
    revalidatePath.mockClear();
    redirect.mockClear();
  });

  it("updates one confirmed wardrobe item and refreshes recommendation surfaces", async () => {
    const formData = new FormData();
    formData.set("itemId", "item-1");
    formData.set("item-1:category", "shoes");
    formData.set("item-1:primaryColor", "黑色");
    formData.set("item-1:secondaryColor", "");
    formData.set("item-1:material", "皮革");
    formData.set("item-1:season", "winter");
    formData.set("item-1:scenario", "commute");
    formData.set("item-1:formality", "semi_formal");
    formData.set("item-1:style", "business");
    formData.set("item-1:warmth", "heavy");

    await expect(updateWardrobeItem(formData)).rejects.toThrow("redirect:/wardrobe");

    expect(confirmWardrobeItem).toHaveBeenCalledWith("item-1", {
      category: "shoes",
      primaryColor: "黑色",
      secondaryColor: undefined,
      material: "皮革",
      seasons: ["winter"],
      scenarios: ["commute"],
      formality: "semi_formal",
      styles: ["business"],
      warmth: "heavy"
    });
    expect(revalidatePath).toHaveBeenCalledWith("/wardrobe");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/outfits");
  });
});
