import type { Formality, Scenario, Season, Style, WardrobeCategory, WarmthLevel } from "@/types/wardrobe";

export const categoryOptions: Array<{ value: WardrobeCategory; label: string }> = [
  { value: "top", label: "上衣" },
  { value: "pants", label: "裤子" },
  { value: "shoes", label: "鞋" },
  { value: "outerwear", label: "外套" },
  { value: "bag", label: "包" },
  { value: "hat", label: "帽子" },
  { value: "scarf", label: "围巾" },
  { value: "belt", label: "腰带" }
];

export const seasonOptions: Array<{ value: Season; label: string }> = [
  { value: "spring", label: "春" },
  { value: "summer", label: "夏" },
  { value: "autumn", label: "秋" },
  { value: "winter", label: "冬" },
  { value: "multi", label: "多季" }
];

export const scenarioOptions: Array<{ value: Scenario; label: string }> = [
  { value: "commute", label: "通勤" },
  { value: "casual", label: "休闲" },
  { value: "date", label: "约会" },
  { value: "formal", label: "正式" },
  { value: "sport", label: "运动" },
  { value: "outdoor", label: "户外" }
];

export const formalityOptions: Array<{ value: Formality; label: string }> = [
  { value: "casual", label: "休闲" },
  { value: "semi_formal", label: "半正式" },
  { value: "formal", label: "正式" }
];

export const styleOptions: Array<{ value: Style; label: string }> = [
  { value: "minimal", label: "简约" },
  { value: "business", label: "商务" },
  { value: "street", label: "街头" },
  { value: "outdoor", label: "户外" },
  { value: "retro", label: "复古" },
  { value: "sport", label: "运动" }
];

export const warmthOptions: Array<{ value: WarmthLevel; label: string }> = [
  { value: "light", label: "轻薄" },
  { value: "medium", label: "中等" },
  { value: "heavy", label: "厚重" }
];

export const categoryLabels = Object.fromEntries(categoryOptions.map((option) => [option.value, option.label])) as Record<
  WardrobeCategory,
  string
>;
