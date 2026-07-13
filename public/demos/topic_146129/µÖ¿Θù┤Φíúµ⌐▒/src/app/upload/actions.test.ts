// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadWardrobeItems } from "./actions";

const {
  createRecognitionProvider,
  createWardrobeItem,
  redirect,
  revalidatePath,
  saveRecognitionDraft,
  saveRecognitionFailure,
  saveUploadedWardrobeFiles
} = vi.hoisted(() => ({
  createRecognitionProvider: vi.fn(),
  createWardrobeItem: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  revalidatePath: vi.fn(),
  saveRecognitionDraft: vi.fn(),
  saveRecognitionFailure: vi.fn(),
  saveUploadedWardrobeFiles: vi.fn()
}));

vi.mock("@/lib/recognition/provider-factory", () => ({
  createRecognitionProvider
}));

vi.mock("@/lib/uploads/local-upload", () => ({
  saveUploadedWardrobeFiles
}));

vi.mock("@/lib/wardrobe/repository-instance", () => ({
  getWardrobeRepository: () => ({
    createWardrobeItem,
    saveRecognitionDraft,
    saveRecognitionFailure
  })
}));

vi.mock("next/cache", () => ({
  revalidatePath
}));

vi.mock("next/navigation", () => ({
  redirect
}));

const recognitionAttributes = {
  category: "top" as const,
  primaryColor: "白色",
  material: "棉",
  seasons: ["multi" as const],
  scenarios: ["casual" as const],
  formality: "casual" as const,
  styles: ["minimal" as const],
  warmth: "medium" as const
};

const addFile = (formData: FormData, name: string) => {
  formData.append("photos", new File([new Uint8Array([1])], name, { type: "image/png" }));
};

describe("uploadWardrobeItems", () => {
  beforeEach(() => {
    createRecognitionProvider.mockReset();
    createWardrobeItem.mockReset();
    redirect.mockClear();
    revalidatePath.mockReset();
    saveRecognitionDraft.mockReset();
    saveRecognitionFailure.mockReset();
    saveUploadedWardrobeFiles.mockReset();
  });

  it("continues batch upload when one photo recognition fails", async () => {
    const formData = new FormData();
    addFile(formData, "white-shirt.png");
    addFile(formData, "broken-photo.png");
    addFile(formData, "black-shoes.png");
    const savedFiles = [
      { imagePath: "/api/uploads/white-shirt.png", originalFilename: "white-shirt.png" },
      { imagePath: "/api/uploads/broken-photo.png", originalFilename: "broken-photo.png" },
      { imagePath: "/api/uploads/black-shoes.png", originalFilename: "black-shoes.png" }
    ];
    const provider = {
      recognize: vi.fn(async ({ originalFilename }: { originalFilename?: string }) => {
        if (originalFilename === "broken-photo.png") {
          throw new Error("识别服务暂时不可用");
        }

        return {
          provider: "mock",
          model: "filename-hints-v1",
          rawResult: { source: "filename" },
          attributes: recognitionAttributes
        };
      })
    };

    saveUploadedWardrobeFiles.mockResolvedValue(savedFiles);
    createRecognitionProvider.mockReturnValue(provider);
    createWardrobeItem
      .mockReturnValueOnce({ id: "item-1" })
      .mockReturnValueOnce({ id: "item-2" })
      .mockReturnValueOnce({ id: "item-3" });

    await expect(uploadWardrobeItems(formData)).rejects.toThrow("redirect:/review");

    expect(createWardrobeItem).toHaveBeenCalledTimes(3);
    expect(saveRecognitionDraft).toHaveBeenCalledTimes(2);
    expect(saveRecognitionFailure).toHaveBeenCalledWith({
      itemId: "item-2",
      provider: "mock",
      rawResult: {
        imagePath: "/api/uploads/broken-photo.png",
        originalFilename: "broken-photo.png"
      },
      errorMessage: "识别服务暂时不可用"
    });
    expect(revalidatePath).toHaveBeenCalledWith("/review");
    expect(revalidatePath).toHaveBeenCalledWith("/wardrobe");
  });

  it("returns empty upload errors to the review module", async () => {
    const formData = new FormData();

    await expect(uploadWardrobeItems(formData)).rejects.toThrow("redirect:/review?error=empty");
    expect(redirect).toHaveBeenCalledWith("/review?error=empty");
  });
});
