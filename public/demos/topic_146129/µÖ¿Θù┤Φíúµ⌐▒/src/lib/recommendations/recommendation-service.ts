import { randomUUID } from "node:crypto";
import type { OutfitRecommendation, WardrobeCategory, WardrobeItem } from "@/types/wardrobe";
import type { WardrobeRepository } from "@/lib/wardrobe/local-repository";
import {
  generateOutfitRecommendation,
  type OutfitRecommendationInput
} from "@/lib/recommendations/outfit-generator";
import { categoryLabels } from "@/lib/wardrobe/options";

export type SavedOutfitRecommendationResult =
  | {
      ok: true;
      recommendation: OutfitRecommendation;
    }
  | {
      ok: false;
      missingCategories: WardrobeCategory[];
      message: string;
    };

export const DAILY_RECOMMENDATION_TIME = "08:15";

type SnapshotValue = string | number | boolean | null | undefined;

type SnapshotInput = Record<string, SnapshotValue | Record<string, unknown>>;

type CustomRequestInput = OutfitRecommendationInput & {
  requestText: string;
  requestGroupId?: string;
};

type CustomRequestOutfitRecommendationsResult =
  | {
      ok: true;
      requestGroupId: string;
      recommendations: OutfitRecommendation[];
    }
  | Extract<SavedOutfitRecommendationResult, { ok: false }>;

type ReplaceRecommendationItemInput = OutfitRecommendationInput & {
  recommendationId: string;
  itemId: string;
  eventDate: string;
};

type ManualReplaceRecommendationItemInput = ReplaceRecommendationItemInput & {
  replacementItemId: string;
};

const getSnapshotString = (snapshot: Record<string, unknown> | undefined, key: string) => {
  const value = snapshot?.[key];

  return typeof value === "string" ? value : undefined;
};

const getSnapshotNumber = (snapshot: Record<string, unknown> | undefined, key: string) => {
  const value = snapshot?.[key];

  return typeof value === "number" ? value : undefined;
};

const primaryOutfitCategories: WardrobeCategory[] = ["hat", "top", "pants", "shoes"];

const sortItemsForReason = (items: WardrobeItem[]) => {
  const primaryItems = primaryOutfitCategories
    .map((category) => items.find((item) => item.category === category))
    .filter((item): item is WardrobeItem => Boolean(item));
  const fallbackItems = items.filter((item) => !primaryItems.some((primaryItem) => primaryItem.id === item.id));

  return [...primaryItems, ...fallbackItems];
};

const describeWardrobeItem = (item: WardrobeItem) => {
  const categoryLabel = item.category ? categoryLabels[item.category] : "单品";
  const colorAndMaterial = [item.primaryColor, item.material].filter(Boolean).join("");

  return `${colorAndMaterial || "这件"}${categoryLabel}`;
};

const buildReplacementReason = (items: WardrobeItem[], replacementItem: WardrobeItem) => {
  const outfitSummary = sortItemsForReason(items).map(describeWardrobeItem).join("、");

  return `调整后以${outfitSummary}组成。${describeWardrobeItem(replacementItem)}让整套在原有方向上更贴合当前选择。`;
};

const structuredInputSnapshot = (input: OutfitRecommendationInput): SnapshotInput => ({
  scenario: input.scenario,
  season: input.season,
  formality: input.formality,
  colorPreference: input.colorPreference,
  materialPreference: input.materialPreference
});

const getHistoricalItemWeights = (repository: WardrobeRepository) =>
  repository.listBehaviorEvents().reduce<Record<string, number>>((weights, event) => {
    const weight =
      event.eventType === "wear_today"
        ? 6
        : event.eventType === "like" && event.isLiked
          ? 4
          : event.eventType === "like"
            ? -2
            : event.eventType === "change_outfit"
              ? -1
              : 0;

    event.itemIds.forEach((itemId) => {
      weights[itemId] = (weights[itemId] ?? 0) + weight;
    });

    return weights;
  }, {});

export const createSavedOutfitRecommendation = (
  repository: WardrobeRepository,
  input: OutfitRecommendationInput = {},
  options: { dailyRecommendationId?: string; inputSnapshot?: SnapshotInput } = {}
): SavedOutfitRecommendationResult => {
  const historicalWeights = getHistoricalItemWeights(repository);
  const itemWeights = {
    ...historicalWeights,
    ...input.itemWeights
  };
  const generated = generateOutfitRecommendation(repository.listConfirmedWardrobeItems(), {
    ...input,
    itemWeights
  });

  if (!generated.ok) {
    return generated;
  }

  return {
    ok: true,
    recommendation: repository.createOutfitRecommendation({
      title: generated.title,
      scenario: generated.scenario,
      reason: generated.reason,
      itemIds: generated.itemIds,
      weatherSnapshot: input.weather,
      inputSnapshot: {
        ...structuredInputSnapshot(input),
        ...options.inputSnapshot
      },
      dailyRecommendationId: options.dailyRecommendationId
    })
  };
};

export const createCustomRequestOutfitRecommendations = (
  repository: WardrobeRepository,
  input: CustomRequestInput
): CustomRequestOutfitRecommendationsResult => {
  const requestGroupId = input.requestGroupId ?? `request-${randomUUID()}`;
  const recommendations: OutfitRecommendation[] = [];
  const usedItemIds: string[] = [];

  for (let index = 1; index <= 3; index += 1) {
    const result = createSavedOutfitRecommendation(
      repository,
      {
        ...input,
        avoidItemIds: [...(input.avoidItemIds ?? []), ...usedItemIds]
      },
      {
        inputSnapshot: {
          source: "custom_request",
          requestText: input.requestText,
          requestGroupId,
          requestIndex: index
        }
      }
    );

    if (!result.ok) {
      return result;
    }

    recommendations.push(result.recommendation);
    usedItemIds.push(...result.recommendation.itemIds);
  }

  return {
    ok: true,
    requestGroupId,
    recommendations
  };
};

const scoreReplacementItem = (item: NonNullable<ReturnType<WardrobeRepository["listConfirmedWardrobeItems"]>[number]>, input: OutfitRecommendationInput) => {
  let score = input.itemWeights?.[item.id] ?? 0;

  if (input.scenario && item.scenarios?.includes(input.scenario)) {
    score += 3;
  }

  if (input.season) {
    score += item.seasons?.includes(input.season) ? 3 : item.seasons?.includes("multi") ? 1 : 0;
  }

  if (input.formality && item.formality === input.formality) {
    score += 3;
  }

  if (
    input.colorPreference &&
    [item.primaryColor, item.secondaryColor].filter(Boolean).some((color) => color?.includes(input.colorPreference ?? ""))
  ) {
    score += 2;
  }

  if (input.materialPreference && item.material?.includes(input.materialPreference)) {
    score += 2;
  }

  return score;
};

const replacementUnavailable = (category: WardrobeCategory): SavedOutfitRecommendationResult => ({
  ok: false,
  missingCategories: [category],
  message: `没有可替换的${categoryLabels[category]}，可以先去衣橱录入。`
});

const createReplacementRecommendation = (
  repository: WardrobeRepository,
  input: ReplaceRecommendationItemInput,
  replacementItemId: string,
  replaceMode: "auto" | "manual"
): SavedOutfitRecommendationResult => {
  const baseRecommendation = repository.getOutfitRecommendation(input.recommendationId);

  if (!baseRecommendation) {
    throw new Error(`Outfit recommendation ${input.recommendationId} does not exist.`);
  }

  const confirmedItems = repository.listConfirmedWardrobeItems();
  const replacedItem = confirmedItems.find((item) => item.id === input.itemId);
  const replacementItem = confirmedItems.find((item) => item.id === replacementItemId);

  if (!replacedItem?.category || !replacementItem?.category) {
    throw new Error("替换单品不存在或缺少品类");
  }

  if (replacementItem.category !== replacedItem.category) {
    throw new Error("只能选择同品类单品进行替换");
  }

  const replacementContext = {
    source: "item_replace",
    requestText: getSnapshotString(baseRecommendation.inputSnapshot, "requestText"),
    requestGroupId: getSnapshotString(baseRecommendation.inputSnapshot, "requestGroupId"),
    requestIndex: getSnapshotNumber(baseRecommendation.inputSnapshot, "requestIndex"),
    baseRecommendationId: baseRecommendation.id,
    replacedItemId: replacedItem.id,
    replacementItemId: replacementItem.id,
    replacedCategory: replacedItem.category,
    replaceMode
  };
  const itemIds = baseRecommendation.itemIds.map((itemId) => (itemId === replacedItem.id ? replacementItem.id : itemId));
  const itemsById = new Map(confirmedItems.map((item) => [item.id, item]));
  const adjustedItems = itemIds.map((itemId) => itemsById.get(itemId)).filter((item): item is WardrobeItem => Boolean(item));
  const reason = buildReplacementReason(adjustedItems, replacementItem);
  const recommendation = repository.createOutfitRecommendation({
    title: `${baseRecommendation.title}调整`,
    scenario: baseRecommendation.scenario ?? input.scenario,
    reason,
    itemIds,
    weatherSnapshot: input.weather ?? baseRecommendation.weatherSnapshot,
    inputSnapshot: {
      ...structuredInputSnapshot(input),
      ...replacementContext
    }
  });
  const behaviorInput = {
    recommendationId: recommendation.id,
    eventDate: input.eventDate,
    weatherSnapshot: input.weather ?? baseRecommendation.weatherSnapshot,
    inputSnapshot: {
      ...structuredInputSnapshot(input),
      ...replacementContext
    },
    aiReason: reason
  };

  if (replaceMode === "auto") {
    repository.recordAutoReplaceItem(behaviorInput);
  } else {
    repository.recordManualReplaceItem(behaviorInput);
  }

  return {
    ok: true,
    recommendation
  };
};

export const autoReplaceRecommendationItem = (
  repository: WardrobeRepository,
  input: ReplaceRecommendationItemInput
): SavedOutfitRecommendationResult => {
  const baseRecommendation = repository.getOutfitRecommendation(input.recommendationId);

  if (!baseRecommendation) {
    throw new Error(`Outfit recommendation ${input.recommendationId} does not exist.`);
  }

  const confirmedItems = repository.listConfirmedWardrobeItems();
  const replacedItem = confirmedItems.find((item) => item.id === input.itemId);

  if (!replacedItem?.category) {
    throw new Error("替换单品不存在或缺少品类");
  }

  const currentItemIds = new Set(baseRecommendation.itemIds);
  const candidates = confirmedItems
    .filter((item) => item.category === replacedItem.category && item.id !== replacedItem.id && !currentItemIds.has(item.id))
    .sort((left, right) => scoreReplacementItem(right, input) - scoreReplacementItem(left, input));
  const replacementItem = candidates[0];

  if (!replacementItem) {
    return replacementUnavailable(replacedItem.category);
  }

  return createReplacementRecommendation(repository, input, replacementItem.id, "auto");
};

export const manualReplaceRecommendationItem = (
  repository: WardrobeRepository,
  input: ManualReplaceRecommendationItemInput
): SavedOutfitRecommendationResult =>
  createReplacementRecommendation(repository, input, input.replacementItemId, "manual");

const createAndAttachDailyRecommendation = (
  repository: WardrobeRepository,
  recommendationDate: string,
  input: OutfitRecommendationInput
): SavedOutfitRecommendationResult => {
  const dailyRecommendation = repository.ensureDailyRecommendationForDate(recommendationDate);
  const result = createSavedOutfitRecommendation(repository, input, {
    dailyRecommendationId: dailyRecommendation.id
  });

  if (!result.ok) {
    return result;
  }

  const updatedDailyRecommendation = repository.attachRecommendationToDaily(dailyRecommendation.id, result.recommendation.id);
  const linkedRecommendation = updatedDailyRecommendation.recommendationId
    ? repository.getOutfitRecommendation(updatedDailyRecommendation.recommendationId)
    : undefined;

  return {
    ok: true,
    recommendation: linkedRecommendation ?? result.recommendation
  };
};

export const getOrCreateDailyOutfitRecommendation = (
  repository: WardrobeRepository,
  recommendationDate: string,
  input: OutfitRecommendationInput = {}
): SavedOutfitRecommendationResult => {
  const dailyRecommendation = repository.ensureDailyRecommendationForDate(recommendationDate);

  if (dailyRecommendation.recommendationId) {
    const existingRecommendation = repository.getOutfitRecommendation(dailyRecommendation.recommendationId);

    if (existingRecommendation) {
      return {
        ok: true,
        recommendation: existingRecommendation
      };
    }
  }

  return createAndAttachDailyRecommendation(repository, recommendationDate, input);
};

export const replaceDailyOutfitRecommendation = (
  repository: WardrobeRepository,
  recommendationDate: string,
  input: OutfitRecommendationInput = {}
): SavedOutfitRecommendationResult => {
  const dailyRecommendation = repository.getDailyRecommendationForDate(recommendationDate);
  const existingRecommendation = dailyRecommendation?.recommendationId
    ? repository.getOutfitRecommendation(dailyRecommendation.recommendationId)
    : undefined;
  const avoidItemIds = Array.from(new Set([...(input.avoidItemIds ?? []), ...(existingRecommendation?.itemIds ?? [])]));

  return createAndAttachDailyRecommendation(repository, recommendationDate, {
    ...input,
    avoidItemIds
  });
};
