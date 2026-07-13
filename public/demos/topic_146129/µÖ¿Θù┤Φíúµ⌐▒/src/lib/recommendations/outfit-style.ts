import { scenarioOptions, styleOptions } from "@/lib/wardrobe/options";
import type { OutfitRecommendation, Style, WardrobeItem } from "@/types/wardrobe";

const styleLabels = Object.fromEntries(styleOptions.map((option) => [option.value, option.label])) as Record<Style, string>;
const scenarioLabels = Object.fromEntries(scenarioOptions.map((option) => [option.value, option.label]));

export const getOutfitStyleLabel = (items: WardrobeItem[], recommendation: OutfitRecommendation) => {
  const styleCounts = new Map<Style, number>();

  for (const item of items) {
    for (const style of item.styles ?? []) {
      styleCounts.set(style, (styleCounts.get(style) ?? 0) + 1);
    }
  }

  const dominantStyle = [...styleCounts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }

    return styleOptions.findIndex((option) => option.value === a[0]) - styleOptions.findIndex((option) => option.value === b[0]);
  })[0]?.[0];

  if (dominantStyle) {
    return `${styleLabels[dominantStyle]}风格`;
  }

  if (recommendation.scenario) {
    return `${scenarioLabels[recommendation.scenario]}风格`;
  }

  return "日常风格";
};
