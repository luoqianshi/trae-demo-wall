import type { WardrobeFieldConfidence, WardrobeItemAttributes } from "@/types/wardrobe";

export const PRODUCT_SOURCE_PLACEHOLDER_IMAGE_PATH = "/product-source-placeholder.svg";

type ParsedProductDetail = {
  attributes: WardrobeItemAttributes;
  fieldConfidence: WardrobeFieldConfidence;
};

const includesAny = (text: string, hints: string[]) => hints.some((hint) => text.includes(hint));

const detectCategory = (text: string): Pick<WardrobeItemAttributes, "category"> & { confidence: "high" | "low" } => {
  const rules: Array<{ category: WardrobeItemAttributes["category"]; hints: string[] }> = [
    { category: "pants", hints: ["裤", "牛仔裤", "西裤", "休闲裤", "短裤"] },
    { category: "shoes", hints: ["鞋", "靴", "板鞋", "皮鞋", "运动鞋"] },
    { category: "outerwear", hints: ["外套", "夹克", "大衣", "风衣", "羽绒服", "西装"] },
    { category: "hat", hints: ["帽"] },
    { category: "bag", hints: ["包"] },
    { category: "scarf", hints: ["围巾"] },
    { category: "belt", hints: ["腰带", "皮带"] },
    { category: "top", hints: ["上衣", "衬衫", "T恤", "卫衣", "毛衣", "针织衫", "POLO"] }
  ];
  const matched = rules.find((rule) => includesAny(text, rule.hints));

  return {
    category: matched?.category ?? "top",
    confidence: matched ? "high" : "low"
  };
};

const detectColor = (text: string) => {
  const colors = ["黑色", "白色", "灰色", "蓝色", "藏青", "棕色", "咖色", "米色", "绿色", "红色", "粉色", "黄色", "卡其"];
  const color = colors.find((entry) => text.includes(entry));

  return {
    primaryColor: color ?? "未标注",
    confidence: color ? ("high" as const) : ("low" as const)
  };
};

const detectMaterial = (text: string) => {
  const matches = Array.from(text.matchAll(/(棉|氨纶|聚酯纤维|涤纶|锦纶|尼龙|羊毛|羊绒|亚麻|真丝|桑蚕丝|皮革|牛皮|牛仔|帆布)\s*([0-9]+(?:\.[0-9]+)?%?)/g));

  if (matches.length > 0) {
    return {
      material: matches.map((match) => `${match[1]}${match[2]}`).join(" / "),
      confidence: "high" as const
    };
  }

  const keywords = ["棉", "氨纶", "聚酯纤维", "涤纶", "锦纶", "尼龙", "羊毛", "羊绒", "亚麻", "真丝", "桑蚕丝", "皮革", "牛皮", "牛仔", "帆布"];
  const material = keywords.find((entry) => text.includes(entry));

  return {
    material: material ?? "未标注",
    confidence: material ? ("medium" as const) : ("low" as const)
  };
};

const detectSeasons = (text: string) => {
  const seasons: WardrobeItemAttributes["seasons"] = [];

  if (text.includes("春")) seasons.push("spring");
  if (text.includes("夏")) seasons.push("summer");
  if (text.includes("秋")) seasons.push("autumn");
  if (text.includes("冬")) seasons.push("winter");

  return {
    seasons: seasons.length > 0 ? seasons : (["multi"] as WardrobeItemAttributes["seasons"]),
    confidence: seasons.length > 0 ? ("high" as const) : ("low" as const)
  };
};

const detectScenarios = (text: string) => {
  const scenarios: WardrobeItemAttributes["scenarios"] = [];

  if (includesAny(text, ["通勤", "上班", "商务"])) scenarios.push("commute");
  if (includesAny(text, ["休闲", "日常"])) scenarios.push("casual");
  if (text.includes("约会")) scenarios.push("date");
  if (includesAny(text, ["正式", "会议"])) scenarios.push("formal");
  if (text.includes("运动")) scenarios.push("sport");
  if (text.includes("户外")) scenarios.push("outdoor");

  return scenarios.length > 0 ? scenarios : (["casual"] as WardrobeItemAttributes["scenarios"]);
};

const detectFormality = (text: string): WardrobeItemAttributes["formality"] => {
  if (includesAny(text, ["正式", "正装", "会议", "西装"])) return "formal";
  if (includesAny(text, ["通勤", "商务"])) return "semi_formal";

  return "casual";
};

const detectStyles = (text: string) => {
  const styles: WardrobeItemAttributes["styles"] = [];

  if (includesAny(text, ["简约", "基础"])) styles.push("minimal");
  if (text.includes("商务")) styles.push("business");
  if (text.includes("街头")) styles.push("street");
  if (text.includes("户外")) styles.push("outdoor");
  if (text.includes("复古")) styles.push("retro");
  if (text.includes("运动")) styles.push("sport");

  return styles.length > 0 ? styles : (["minimal"] as WardrobeItemAttributes["styles"]);
};

const detectWarmth = (text: string): WardrobeItemAttributes["warmth"] => {
  if (includesAny(text, ["中等", "适中"])) return "medium";
  if (includesAny(text, ["轻薄", "薄款", "夏"])) return "light";
  if (includesAny(text, ["厚", "加绒", "冬"])) return "heavy";

  return "medium";
};

export const parseProductDetailText = (productDetailText: string): ParsedProductDetail => {
  const normalizedText = productDetailText.replace(/\s+/g, " ").trim();
  const category = detectCategory(normalizedText);
  const color = detectColor(normalizedText);
  const material = detectMaterial(normalizedText);
  const seasons = detectSeasons(normalizedText);

  return {
    attributes: {
      category: category.category,
      primaryColor: color.primaryColor,
      material: material.material,
      seasons: seasons.seasons,
      scenarios: detectScenarios(normalizedText),
      formality: detectFormality(normalizedText),
      styles: detectStyles(normalizedText),
      warmth: detectWarmth(normalizedText)
    },
    fieldConfidence: {
      category: category.confidence,
      primaryColor: color.confidence,
      material: material.confidence,
      seasons: seasons.confidence,
      scenarios: "medium",
      formality: "medium",
      styles: "medium",
      warmth: normalizedText.includes("厚薄") ? "high" : "medium",
      productDetailText: "high"
    }
  };
};
