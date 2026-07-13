import type { Formality, Scenario, Season, WardrobeCategory, WardrobeItem, WarmthLevel } from "@/types/wardrobe";
import { categoryLabels } from "@/lib/wardrobe/options";
import { deriveWarmthFromTemperature } from "@/lib/weather/open-meteo";

type WeatherInput = {
  temperature?: number;
  condition?: string;
  warmth?: WarmthLevel;
};

export type OutfitRecommendationInput = {
  scenario?: Scenario;
  season?: Season;
  formality?: Formality;
  colorPreference?: string;
  materialPreference?: string;
  weather?: WeatherInput;
  avoidItemIds?: string[];
  itemWeights?: Record<string, number>;
};

export type GeneratedOutfitRecommendation =
  | {
      ok: true;
      title: string;
      scenario?: Scenario;
      reason: string;
      itemIds: string[];
    }
  | {
      ok: false;
      missingCategories: WardrobeCategory[];
      message: string;
    };

const requiredCategories: WardrobeCategory[] = ["top", "pants", "shoes"];
const accessoryCategories: WardrobeCategory[] = ["bag", "scarf", "belt"];

const scenarioLabels: Partial<Record<Scenario, string>> = {
  commute: "通勤",
  casual: "休闲",
  date: "约会",
  formal: "正式",
  sport: "运动",
  outdoor: "户外"
};

const byCategory = (items: WardrobeItem[], category: WardrobeCategory) => items.filter((item) => item.category === category);

const scoreItem = (item: WardrobeItem, input: OutfitRecommendationInput) => {
  let score = input.itemWeights?.[item.id] ?? 0;

  if (input.scenario && item.scenarios?.includes(input.scenario)) {
    score += 3;
  }

  if (input.season) {
    if (item.seasons?.includes(input.season)) {
      score += 3;
    } else if (item.seasons?.includes("multi")) {
      score += 1;
    }
  }

  if (input.formality && item.formality === input.formality) {
    score += 3;
  }

  const preferredWarmth =
    input.weather?.warmth ?? (typeof input.weather?.temperature === "number" ? deriveWarmthFromTemperature(input.weather.temperature) : undefined);

  if (preferredWarmth && item.warmth === preferredWarmth) {
    score += 2;
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

const pickItem = (items: WardrobeItem[], category: WardrobeCategory, input: OutfitRecommendationInput) => {
  const avoidItemIds = new Set(input.avoidItemIds ?? []);
  const candidates = byCategory(items, category).sort((left, right) => scoreItem(right, input) - scoreItem(left, input));

  return candidates.find((item) => !avoidItemIds.has(item.id)) ?? candidates[0];
};

const shouldAddOuterwear = (input: OutfitRecommendationInput) => {
  const temperature = input.weather?.temperature;

  return typeof temperature === "number" && temperature <= 18;
};

const shouldAddHat = (input: OutfitRecommendationInput) => {
  const temperature = input.weather?.temperature;

  return input.scenario === "outdoor" || (typeof temperature === "number" && temperature <= 12);
};

const formatMissingMessage = (categories: WardrobeCategory[]) => {
  const labels = categories.map((category) => categoryLabels[category]).join("、");

  return `还缺少${labels}，暂时不能生成完整穿搭。`;
};

const buildReason = (items: WardrobeItem[], input: OutfitRecommendationInput) => {
  const colors = items
    .map((item) => item.primaryColor)
    .filter(Boolean)
    .join("、");
  const materials = Array.from(new Set(items.map((item) => item.material).filter(Boolean))).join("、");
  const temperatureText =
    typeof input.weather?.temperature === "number" ? `${input.weather.temperature}°C` : "当前天气";

  return `${temperatureText}下，这套用${colors || "基础色"}形成主色关系，${materials || "常规材质"}适合当前场景。`;
};

export const generateOutfitRecommendation = (
  wardrobeItems: WardrobeItem[],
  input: OutfitRecommendationInput = {}
): GeneratedOutfitRecommendation => {
  const confirmedItems = wardrobeItems.filter((item) => item.status === "confirmed");
  const missingCategories = requiredCategories.filter((category) => byCategory(confirmedItems, category).length === 0);

  if (missingCategories.length > 0) {
    return {
      ok: false,
      missingCategories,
      message: formatMissingMessage(missingCategories)
    };
  }

  const selectedItems = requiredCategories.map((category) => pickItem(confirmedItems, category, input)).filter(Boolean);
  const outerwear = shouldAddOuterwear(input) ? pickItem(confirmedItems, "outerwear", input) : undefined;
  const hat = shouldAddHat(input) ? pickItem(confirmedItems, "hat", input) : undefined;
  const accessory = accessoryCategories.map((category) => pickItem(confirmedItems, category, input)).find(Boolean);
  const itemIds = [...selectedItems, outerwear, hat, accessory]
    .filter((item): item is WardrobeItem => Boolean(item))
    .map((item) => item.id);

  const scenarioLabel = input.scenario ? scenarioLabels[input.scenario] : "今日";

  return {
    ok: true,
    title: `${scenarioLabel}穿搭`,
    scenario: input.scenario,
    reason: buildReason(
      itemIds.map((id) => confirmedItems.find((item) => item.id === id)).filter((item): item is WardrobeItem => Boolean(item)),
      input
    ),
    itemIds
  };
};
