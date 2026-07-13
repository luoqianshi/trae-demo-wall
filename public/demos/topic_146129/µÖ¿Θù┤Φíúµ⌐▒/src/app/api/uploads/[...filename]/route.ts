import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { getLocalUploadDir } from "@/lib/uploads/local-upload";

export const runtime = "nodejs";

const contentTypesByExtension = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".gif", "image/gif"]
]);

export async function GET(_request: Request, context: { params: Promise<{ filename: string[] }> }) {
  const { filename } = await context.params;
  const uploadDir = resolve(getLocalUploadDir());
  const requestedPath = resolve(join(uploadDir, ...filename));

  if (!requestedPath.startsWith(uploadDir)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(requestedPath);
    const contentType = contentTypesByExtension.get(extname(requestedPath).toLowerCase()) ?? "application/octet-stream";

    return new Response(new Uint8Array(file), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType
      }
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
