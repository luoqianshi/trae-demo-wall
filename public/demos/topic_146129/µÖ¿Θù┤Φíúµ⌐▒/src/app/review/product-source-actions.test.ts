// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createWardrobeItemFromProductDetail } from "./product-source-actions";

const { createWardrobeItem, redirect, revalidatePath, saveRecognitionDraft, saveRecognitionFailure } = vi.hoisted(() => ({
  createWardrobeItem: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  revalidatePath: vi.fn(),
  saveRecognitionDraft: vi.fn(),
  saveRecognitionFailure: vi.fn()
}));

vi.mock("@/lib/wardrobe/repository-instance", () => ({
  getWardrobeRepository: () => ({
    createWardrobeItem,
    saveRecognitionDraft,
    saveRecognitionFailure
  })
}));

vi.mock("next/cache", () => ({
  revalidatePath
}));

vi.mock("next/navigation", () => ({
  redirect
}));

describe("createWardrobeItemFromProductDetail", () => {
  beforeEach(() => {
    createWardrobeItem.mockReset();
    redirect.mockClear();
    revalidatePath.mockReset();
    saveRecognitionDraft.mockReset();
    saveRecognitionFailure.mockReset();
  });

  it("creates a draft item from pasted product detail text", async () => {
    const formData = new FormData();
    formData.set("productDetailText", "商品名称：黑色牛仔裤\n材质成分：棉98% 氨纶2%\n季节：春秋");
    createWardrobeItem.mockReturnValue({ id: "item-1" });

    await expect(createWardrobeItemFromProductDetail(formData)).rejects.toThrow("redirect:/review");

    expect(createWardrobeItem).toHaveBeenCalledWith(
      expect.objectContaining({
        imagePath: "/product-source-placeholder.svg",
        originalFilename: "商品详情文本",
        sourceType: "product_detail_text",
        productDetailText: expect.stringContaining("黑色牛仔裤"),
        recognitionSource: "product_detail_text"
      })
    );
    expect(saveRecognitionDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-1",
        provider: "local-product-detail",
        model: "rules-v1",
        attributes: expect.objectContaining({
          category: "pants",
          primaryColor: "黑色",
          material: "棉98% / 氨纶2%"
        }),
        rawResult: expect.objectContaining({
          source: "product_detail_text",
          productDetailText: expect.stringContaining("黑色牛仔裤")
        })
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/review");
    expect(revalidatePath).toHaveBeenCalledWith("/wardrobe");
  });

  it("creates a source draft when the pasted content is a product URL", async () => {
    const formData = new FormData();
    formData.set("productDetailText", "https://example.com/item/123?sku=black");
    createWardrobeItem.mockReturnValue({ id: "item-url-1" });

    await expect(createWardrobeItemFromProductDetail(formData)).rejects.toThrow("redirect:/review");

    expect(createWardrobeItem).toHaveBeenCalledWith(
      expect.objectContaining({
        imagePath: "/product-source-placeholder.svg",
        originalFilename: "商品链接",
        sourceType: "product_url",
        productUrl: "https://example.com/item/123?sku=black",
        recognitionSource: "product_url",
        fieldConfidence: {
          productUrl: "high"
        }
      })
    );
    expect(saveRecognitionDraft).not.toHaveBeenCalled();
    expect(saveRecognitionFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-url-1",
        provider: "local-product-url",
        model: "url-intake-v1",
        rawResult: {
          source: "product_url",
          productUrl: "https://example.com/item/123?sku=black"
        },
        errorMessage: "链接已保存，当前还没有自动读取商品页。"
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/review");
    expect(revalidatePath).toHaveBeenCalledWith("/wardrobe");
  });

  it("creates a source draft when mobile share text contains a product URL", async () => {
    const formData = new FormData();
    formData.set("productDetailText", "我在看这件外套 https://example.com/item/456?sku=camel 觉得适合秋天");
    createWardrobeItem.mockReturnValue({ id: "item-url-2" });

    await expect(createWardrobeItemFromProductDetail(formData)).rejects.toThrow("redirect:/review");

    expect(createWardrobeItem).toHaveBeenCalledWith(
      expect.objectContaining({
        originalFilename: "商品链接",
        sourceType: "product_url",
        productUrl: "https://example.com/item/456?sku=camel",
        recognitionSource: "product_url"
      })
    );
    expect(saveRecognitionFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-url-2",
        provider: "local-product-url",
        rawResult: expect.objectContaining({
          productUrl: "https://example.com/item/456?sku=camel"
        })
      })
    );
  });

  it("returns an error when product detail text is empty", async () => {
    const formData = new FormData();

    await expect(createWardrobeItemFromProductDetail(formData)).rejects.toThrow("redirect:/review?error=empty-product-detail");
    expect(redirect).toHaveBeenCalledWith("/review?error=empty-product-detail");
  });
});
