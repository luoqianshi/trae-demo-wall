import { describe, expect, it } from "vitest";
import { buildConfirmationAttributes } from "./confirmation-parser";

const appendItemFields = (formData: FormData, itemId: string) => {
  formData.set(`${itemId}:category`, "top");
  formData.set(`${itemId}:primaryColor`, "白色");
  formData.set(`${itemId}:secondaryColor`, "");
  formData.set(`${itemId}:material`, "棉");
  formData.set(`${itemId}:season`, "summer");
  formData.set(`${itemId}:scenario`, "casual");
  formData.set(`${itemId}:formality`, "casual");
  formData.set(`${itemId}:style`, "minimal");
  formData.set(`${itemId}:warmth`, "light");
};

describe("buildConfirmationAttributes", () => {
  it("applies batch fields only to selected draft items", () => {
    const formData = new FormData();
    appendItemFields(formData, "item-1");
    appendItemFields(formData, "item-2");
    formData.append("batchItemId", "item-1");
    formData.set("batch:season", "winter");
    formData.set("batch:scenario", "formal");
    formData.set("batch:formality", "formal");
    formData.set("batch:style", "business");
    formData.set("batch:warmth", "heavy");

    expect(buildConfirmationAttributes(formData, "item-1")).toMatchObject({
      seasons: ["winter"],
      scenarios: ["formal"],
      formality: "formal",
      styles: ["business"],
      warmth: "heavy"
    });
    expect(buildConfirmationAttributes(formData, "item-2")).toMatchObject({
      seasons: ["summer"],
      scenarios: ["casual"],
      formality: "casual",
      styles: ["minimal"],
      warmth: "light"
    });
  });
});
