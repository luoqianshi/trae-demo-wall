// @vitest-environment node

import { describe, expect, it } from "vitest";
import { parseProductDetailText } from "./product-detail-parser";

describe("parseProductDetailText", () => {
  it("extracts wardrobe attributes and confidence from pasted product details", () => {
    const result = parseProductDetailText(`
      商品名称：男士黑色修身牛仔裤
      颜色：黑色
      材质成分：棉98% 氨纶2%
      适合季节：春秋
      场景：通勤 休闲
      风格：简约
      厚薄：中等
    `);

    expect(result.attributes).toMatchObject({
      category: "pants",
      primaryColor: "黑色",
      material: "棉98% / 氨纶2%",
      seasons: ["spring", "autumn"],
      scenarios: ["commute", "casual"],
      formality: "semi_formal",
      styles: ["minimal"],
      warmth: "medium"
    });
    expect(result.fieldConfidence).toMatchObject({
      category: "high",
      primaryColor: "high",
      material: "high",
      seasons: "high"
    });
  });
});
