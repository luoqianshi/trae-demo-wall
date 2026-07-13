import type { RecognitionProvider } from "./types";
import type { WardrobeItemAttributes, WardrobeCategory, Season, Scenario, Formality, Style, WarmthLevel } from "@/types/wardrobe";
import { join } from "node:path";

const CATEGORY_MAP: Record<string, WardrobeCategory> = {
  "上衣": "top",
  "T恤": "top",
  "衬衫": "top",
  "毛衣": "top",
  "卫衣": "top",
  "背心": "top",
  "吊带": "top",
  "裤子": "pants",
  "牛仔裤": "pants",
  "休闲裤": "pants",
  "西裤": "pants",
  "短裤": "pants",
  "裙子": "pants",
  "半身裙": "pants",
  "连衣裙": "pants",
  "鞋子": "shoes",
  "运动鞋": "shoes",
  "皮鞋": "shoes",
  "靴子": "shoes",
  "凉鞋": "shoes",
  "拖鞋": "shoes",
  "外套": "outerwear",
  "夹克": "outerwear",
  "大衣": "outerwear",
  "风衣": "outerwear",
  "羽绒服": "outerwear",
  "棉服": "outerwear",
  "包包": "bag",
  "手提包": "bag",
  "背包": "bag",
  "钱包": "bag",
  "帽子": "hat",
  "棒球帽": "hat",
  "贝雷帽": "hat",
  "围巾": "scarf",
  "腰带": "belt"
};

const SEASON_MAP: Record<string, Season> = {
  "春": "spring",
  "春季": "spring",
  "夏": "summer",
  "夏季": "summer",
  "秋": "autumn",
  "秋季": "autumn",
  "冬": "winter",
  "冬季": "winter",
  "四季": "multi",
  "全年": "multi",
  "通用": "multi"
};

const SCENARIO_MAP: Record<string, Scenario> = {
  "通勤": "commute",
  "工作": "commute",
  "日常": "casual",
  "休闲": "casual",
  "约会": "date",
  "正式": "formal",
  "商务": "formal",
  "运动": "sport",
  "户外": "outdoor"
};

const FORMALITY_MAP: Record<string, Formality> = {
  "休闲": "casual",
  "日常": "casual",
  "半正式": "semi_formal",
  "正式": "formal",
  "商务": "formal"
};

const STYLE_MAP: Record<string, Style> = {
  "简约": "minimal",
  "极简": "minimal",
  "商务": "business",
  "街头": "street",
  "户外": "outdoor",
  "复古": "retro",
  "运动": "sport"
};

const WARMTH_MAP: Record<string, WarmthLevel> = {
  "轻薄": "light",
  "轻薄款": "light",
  "薄": "light",
  "中等": "medium",
  "适中": "medium",
  "厚": "heavy",
  "厚重": "heavy"
};

const COLORS = ["黑色", "白色", "灰色", "蓝色", "棕色", "红色", "绿色", "黄色", "紫色", "粉色", "橙色", "米色", "藏蓝", "卡其"];

const MATERIALS = ["棉", "棉麻", "羊毛", "羊绒", "皮革", "牛仔", "涤纶", "锦纶", "氨纶", "真丝", "亚麻", "混纺"];

const mapCategory = (text: string): WardrobeCategory => {
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(key)) return value;
  }
  return "top";
};

const mapSeasons = (text: string): Season[] => {
  const result: Season[] = [];
  for (const [key, value] of Object.entries(SEASON_MAP)) {
    if (text.includes(key)) {
      if (!result.includes(value)) result.push(value);
    }
  }
  return result.length > 0 ? result : ["multi"];
};

const mapScenarios = (text: string): Scenario[] => {
  const result: Scenario[] = [];
  for (const [key, value] of Object.entries(SCENARIO_MAP)) {
    if (text.includes(key)) {
      if (!result.includes(value)) result.push(value);
    }
  }
  return result.length > 0 ? result : ["casual"];
};

const mapFormality = (text: string): Formality => {
  for (const [key, value] of Object.entries(FORMALITY_MAP)) {
    if (text.includes(key)) return value;
  }
  return "casual";
};

const mapStyles = (text: string): Style[] => {
  const result: Style[] = [];
  for (const [key, value] of Object.entries(STYLE_MAP)) {
    if (text.includes(key)) {
      if (!result.includes(value)) result.push(value);
    }
  }
  return result.length > 0 ? result : ["minimal"];
};

const mapWarmth = (text: string): WarmthLevel => {
  for (const [key, value] of Object.entries(WARMTH_MAP)) {
    if (text.includes(key)) return value;
  }
  return "medium";
};

const extractColor = (text: string): string => {
  for (const color of COLORS) {
    if (text.includes(color)) return color;
  }
  return "未标注";
};

const extractMaterial = (text: string): string => {
  for (const material of MATERIALS) {
    if (text.includes(material)) return material;
  }
  return "未标注";
};

const getAbsoluteFilePath = (imagePath: string): string => {
  if (imagePath.startsWith("/api/uploads/")) {
    const filename = imagePath.replace("/api/uploads/", "");
    const uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads");
    return join(uploadDir, filename);
  }
  
  if (imagePath.startsWith("/")) {
    return join(process.cwd(), imagePath.slice(1));
  }
  
  return imagePath;
};

const encodeImageToBase64 = async (imagePath: string): Promise<string> => {
  const fs = await import("fs");
  const absolutePath = getAbsoluteFilePath(imagePath);
  const buffer = await fs.promises.readFile(absolutePath);
  return buffer.toString("base64");
};

export const createQwenRecognitionProvider = (): RecognitionProvider => ({
  async recognize(input) {
    const apiKey = process.env.QWEN_API_KEY;
    const apiBaseUrl = process.env.QWEN_API_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1";
    const model = process.env.QWEN_MODEL_NAME ?? "qwen3-vl-flash";

    if (!apiKey) {
      throw new Error("QWEN_API_KEY 环境变量未设置");
    }

    const imageBase64 = await encodeImageToBase64(input.imagePath);

    const systemPrompt = `你是一个专业的衣物识别助手。请分析图片中的衣物并返回以下属性的结构化 JSON：
- category: 品类（上衣/裤子/鞋子/外套/包包/帽子/围巾/腰带）
- primaryColor: 主色调（黑色/白色/灰色/蓝色/棕色/红色/绿色等）
- secondaryColor: 次要颜色（可选）
- material: 材质（棉/羊毛/皮革/牛仔等）
- seasons: 适用季节数组（春/夏/秋/冬/四季）
- scenarios: 适用场景数组（通勤/日常/约会/正式/运动/户外）
- formality: 正式程度（休闲/半正式/正式）
- styles: 风格数组（简约/商务/街头/户外/复古/运动）
- warmth: 厚薄程度（轻薄/中等/厚重）

请直接返回 JSON 格式，不要包含其他文字。`;

    const userPrompt = `请识别图片中的衣物并返回结构化 JSON。`;

    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Qwen API 请求失败：${response.status} ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Qwen API 返回空内容");
    }

    let jsonResult: Record<string, unknown>;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResult = JSON.parse(jsonMatch[0]);
      } else {
        jsonResult = JSON.parse(content);
      }
    } catch {
      jsonResult = { rawContent: content };
    }

    const textContent = typeof jsonResult === "object" ? JSON.stringify(jsonResult) : content;

    const attributes: WardrobeItemAttributes = {
      category: typeof jsonResult.category === "string" ? mapCategory(jsonResult.category) : mapCategory(textContent),
      primaryColor: typeof jsonResult.primaryColor === "string" && jsonResult.primaryColor ? String(jsonResult.primaryColor) : extractColor(textContent),
      secondaryColor: typeof jsonResult.secondaryColor === "string" && jsonResult.secondaryColor ? String(jsonResult.secondaryColor) : undefined,
      material: typeof jsonResult.material === "string" && jsonResult.material ? String(jsonResult.material) : extractMaterial(textContent),
      seasons: Array.isArray(jsonResult.seasons) ? jsonResult.seasons.map((s: string) => SEASON_MAP[s] || "multi") : mapSeasons(textContent),
      scenarios: Array.isArray(jsonResult.scenarios) ? jsonResult.scenarios.map((s: string) => SCENARIO_MAP[s] || "casual") : mapScenarios(textContent),
      formality: typeof jsonResult.formality === "string" ? FORMALITY_MAP[jsonResult.formality] || "casual" : mapFormality(textContent),
      styles: Array.isArray(jsonResult.styles) ? jsonResult.styles.map((s: string) => STYLE_MAP[s] || "minimal") : mapStyles(textContent),
      warmth: typeof jsonResult.warmth === "string" ? WARMTH_MAP[jsonResult.warmth] || "medium" : mapWarmth(textContent)
    };

    return {
      provider: "qwen",
      model,
      attributes,
      rawResult: {
        apiResponse: result,
        parsedContent: jsonResult
      }
    };
  }
});