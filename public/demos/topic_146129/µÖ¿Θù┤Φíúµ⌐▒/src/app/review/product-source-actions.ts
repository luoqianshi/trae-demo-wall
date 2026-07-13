"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseProductDetailText,
  PRODUCT_SOURCE_PLACEHOLDER_IMAGE_PATH
} from "@/lib/product-sources/product-detail-parser";
import { getWardrobeRepository } from "@/lib/wardrobe/repository-instance";

const textValueFromForm = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
};

const productUrlPattern = /https?:\/\/[^\s<>"']+/i;

const normalizeProductUrl = (value: string) => {
  try {
    const trimmedValue = value.trim().replace(/[，。；;、）)\]}】》>.]+$/u, "");
    const url = new URL(trimmedValue);

    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const parseProductUrl = (value: string) => {
  const directUrl = normalizeProductUrl(value);

  if (directUrl) {
    return directUrl;
  }

  const match = value.match(productUrlPattern);

  return match ? normalizeProductUrl(match[0]) : undefined;
};

export async function createWardrobeItemFromProductDetail(formData: FormData) {
  const productDetailText = textValueFromForm(formData, "productDetailText");

  if (!productDetailText) {
    redirect("/review?error=empty-product-detail");
  }

  const repository = getWardrobeRepository();
  const productUrl = parseProductUrl(productDetailText);

  if (productUrl) {
    const item = repository.createWardrobeItem({
      imagePath: PRODUCT_SOURCE_PLACEHOLDER_IMAGE_PATH,
      originalFilename: "商品链接",
      sourceType: "product_url",
      productUrl,
      recognitionSource: "product_url",
      fieldConfidence: {
        productUrl: "high"
      }
    });

    repository.saveRecognitionFailure({
      itemId: item.id,
      provider: "local-product-url",
      model: "url-intake-v1",
      rawResult: {
        source: "product_url",
        productUrl
      },
      errorMessage: "链接已保存，当前还没有自动读取商品页。"
    });

    revalidatePath("/review");
    revalidatePath("/wardrobe");
    redirect("/review");
  }

  const parsed = parseProductDetailText(productDetailText);
  const item = repository.createWardrobeItem({
    imagePath: PRODUCT_SOURCE_PLACEHOLDER_IMAGE_PATH,
    originalFilename: "商品详情文本",
    sourceType: "product_detail_text",
    productDetailText,
    recognitionSource: "product_detail_text",
    fieldConfidence: parsed.fieldConfidence
  });

  repository.saveRecognitionDraft({
    itemId: item.id,
    provider: "local-product-detail",
    model: "rules-v1",
    rawResult: {
      source: "product_detail_text",
      productDetailText,
      fieldConfidence: parsed.fieldConfidence
    },
    attributes: parsed.attributes
  });

  revalidatePath("/review");
  revalidatePath("/wardrobe");
  redirect("/review");
}
