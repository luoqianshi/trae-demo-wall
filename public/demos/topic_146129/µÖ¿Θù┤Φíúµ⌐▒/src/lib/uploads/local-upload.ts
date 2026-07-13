import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const imageExtensionsByMimeType = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"]
]);

export type SavedWardrobeFile = {
  originalFilename: string;
  mimeType: string;
  size: number;
  imagePath: string;
  absolutePath: string;
};

type SaveUploadedWardrobeFilesOptions = {
  uploadDir?: string;
  publicBasePath?: string;
};

const normalizeBasePath = (path: string) => path.replace(/\/+$/, "");

export const getLocalUploadDir = () => process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads");

export const saveUploadedWardrobeFiles = async (
  files: File[],
  options: SaveUploadedWardrobeFilesOptions = {}
): Promise<SavedWardrobeFile[]> => {
  const uploadDir = options.uploadDir ?? getLocalUploadDir();
  const publicBasePath = normalizeBasePath(options.publicBasePath ?? "/api/uploads");

  await mkdir(uploadDir, { recursive: true });

  const savedFiles = await Promise.all(
    files.map(async (file) => {
      const extension = imageExtensionsByMimeType.get(file.type);

      if (!extension) {
        throw new Error("只支持上传图片文件");
      }

      const storedFilename = `${Date.now()}-${randomUUID()}${extension}`;
      const absolutePath = join(uploadDir, storedFilename);
      const bytes = new Uint8Array(await file.arrayBuffer());

      await writeFile(absolutePath, bytes);

      return {
        originalFilename: file.name,
        mimeType: file.type,
        size: file.size,
        imagePath: `${publicBasePath}/${storedFilename}`,
        absolutePath
      };
    })
  );

  return savedFiles;
};
