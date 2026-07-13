import type { WardrobeCategory } from "@/types/wardrobe";
import type { RecognitionProvider } from "./types";

const categoryHints: Array<{ category: WardrobeCategory; hints: string[] }> = [
  { category: "shoes", hints: ["shoe", "shoes", "sneaker", "boot", "鞋", "靴"] },
  { category: "pants", hints: ["pants", "trousers", "jeans", "裤", "牛仔裤"] },
  { category: "outerwear", hints: ["coat", "jacket", "outerwear", "外套", "夹克", "大衣"] },
  { category: "bag", hints: ["bag", "包"] },
  { category: "hat", hints: ["hat", "cap", "帽"] },
  { category: "scarf", hints: ["scarf", "围巾"] },
  { category: "belt", hints: ["belt", "腰带"] },
  { category: "top", hints: ["shirt", "tee", "top", "sweater", "上衣", "衬衫", "毛衣", "短袖"] }
];

const colorHints = [
  { color: "黑色", hints: ["black", "黑"] },
  { color: "白色", hints: ["white", "白"] },
  { color: "灰色", hints: ["gray", "grey", "灰"] },
  { color: "蓝色", hints: ["blue", "蓝"] },
  { color: "棕色", hints: ["brown", "棕", "咖"] },
  { color: "红色", hints: ["red", "红"] },
  { color: "绿色", hints: ["green", "绿"] }
];

const materialHints = [
  { material: "皮革", hints: ["leather", "皮"] },
  { material: "牛仔", hints: ["denim", "jeans", "牛仔"] },
  { material: "羊毛", hints: ["wool", "羊毛"] },
  { material: "棉", hints: ["cotton", "棉"] }
];

const includesAnyHint = (text: string, hints: string[]) => hints.some((hint) => text.includes(hint));

export const createMockRecognitionProvider = (): RecognitionProvider => ({
  async recognize(input) {
    const hintText = `${input.originalFilename ?? ""} ${input.imagePath}`.toLowerCase();
    const category = categoryHints.find((entry) => includesAnyHint(hintText, entry.hints))?.category ?? "top";
    const primaryColor = colorHints.find((entry) => includesAnyHint(hintText, entry.hints))?.color ?? "未标注";
    const material = materialHints.find((entry) => includesAnyHint(hintText, entry.hints))?.material ?? "未标注";

    return {
      provider: "mock",
      model: "filename-hints-v1",
      attributes: {
        category,
        primaryColor,
        material,
        seasons: ["multi"],
        scenarios: ["casual"],
        formality: "casual",
        styles: ["minimal"],
        warmth: "medium"
      },
      rawResult: {
        hintText,
        source: "filename"
      }
    };
  }
});
