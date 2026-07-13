import type { Formality, Scenario, Season, Style, WardrobeCategory, WardrobeItemAttributes, WarmthLevel } from "@/types/wardrobe";

export const fieldName = (itemId: string, field: string) => `${itemId}:${field}`;

const textValue = (formData: FormData, name: string, fallback = "") => {
  const value = formData.get(name);

  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const selectedBatchItemIds = (formData: FormData) =>
  new Set(formData.getAll("batchItemId").filter((value): value is string => typeof value === "string"));

const batchValue = (formData: FormData, name: string) => {
  const value = formData.get(`batch:${name}`);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

export const buildConfirmationAttributes = (formData: FormData, itemId: string): WardrobeItemAttributes => {
  const isBatchSelected = selectedBatchItemIds(formData).has(itemId);

  return {
    category: textValue(formData, fieldName(itemId, "category"), "top") as WardrobeCategory,
    primaryColor: textValue(formData, fieldName(itemId, "primaryColor"), "未标注"),
    secondaryColor: textValue(formData, fieldName(itemId, "secondaryColor")) || undefined,
    material: textValue(formData, fieldName(itemId, "material"), "未标注"),
    seasons: [(isBatchSelected ? batchValue(formData, "season") : undefined) ?? textValue(formData, fieldName(itemId, "season"), "multi")] as Season[],
    scenarios: [
      (isBatchSelected ? batchValue(formData, "scenario") : undefined) ?? textValue(formData, fieldName(itemId, "scenario"), "casual")
    ] as Scenario[],
    formality: ((isBatchSelected ? batchValue(formData, "formality") : undefined) ?? textValue(formData, fieldName(itemId, "formality"), "casual")) as Formality,
    styles: [(isBatchSelected ? batchValue(formData, "style") : undefined) ?? textValue(formData, fieldName(itemId, "style"), "minimal")] as Style[],
    warmth: ((isBatchSelected ? batchValue(formData, "warmth") : undefined) ?? textValue(formData, fieldName(itemId, "warmth"), "medium")) as WarmthLevel
  };
};
