// @vitest-environment node

import { describe, expect, it } from "vitest";
import { createMockRecognitionProvider } from "./mock-recognition-provider";

describe("mock recognition provider", () => {
  it("creates editable clothing attributes from filename hints", async () => {
    const provider = createMockRecognitionProvider();

    const result = await provider.recognize({
      imagePath: "/api/uploads/black-shoes-leather.png",
      originalFilename: "black-shoes-leather.png"
    });

    expect(result).toMatchObject({
      provider: "mock",
      model: "filename-hints-v1",
      attributes: {
        category: "shoes",
        primaryColor: "黑色",
        material: "皮革",
        seasons: ["multi"],
        scenarios: ["casual"],
        formality: "casual",
        styles: ["minimal"],
        warmth: "medium"
      }
    });
  });
});
