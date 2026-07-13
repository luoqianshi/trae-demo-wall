// @vitest-environment node

import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { saveUploadedWardrobeFiles } from "./local-upload";

let uploadDir: string | undefined;

afterEach(() => {
  if (uploadDir) {
    rmSync(uploadDir, { recursive: true, force: true });
    uploadDir = undefined;
  }
});

describe("local upload storage", () => {
  it("saves image files with stable public paths", async () => {
    uploadDir = mkdtempSync(join(tmpdir(), "wardrobe-upload-"));
    const file = new File([new Uint8Array([1, 2, 3])], "白衬衫.png", { type: "image/png" });

    const savedFiles = await saveUploadedWardrobeFiles([file], {
      uploadDir,
      publicBasePath: "/api/uploads"
    });

    expect(savedFiles).toHaveLength(1);
    expect(savedFiles[0]).toMatchObject({
      originalFilename: "白衬衫.png",
      mimeType: "image/png",
      size: 3
    });
    expect(savedFiles[0].imagePath).toMatch(/^\/api\/uploads\/\d+-[a-f0-9-]+\.png$/);
    expect(readFileSync(savedFiles[0].absolutePath)).toEqual(Buffer.from([1, 2, 3]));
  });

  it("rejects non-image files", async () => {
    uploadDir = mkdtempSync(join(tmpdir(), "wardrobe-upload-"));
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });

    await expect(
      saveUploadedWardrobeFiles([file], {
        uploadDir,
        publicBasePath: "/api/uploads"
      })
    ).rejects.toThrow("只支持上传图片文件");
  });
});
