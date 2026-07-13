import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cookies } from "next/headers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "../../../../..");

const mimeTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif"
};

export async function GET(request: Request) {
  const accessCode = process.env.APP_ACCESS_CODE;
  
  if (accessCode && accessCode !== "change-me") {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("wardrobe_session")?.value;
    const expectedToken = process.env.WARDROBE_SESSION_TOKEN;
    
    if (!sessionToken || sessionToken !== expectedToken) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
  }

  const url = new URL(request.url);
  const filename = url.pathname.split("/").pop();

  if (!filename) {
    return NextResponse.json({ error: "文件名不能为空" }, { status: 400 });
  }

  if (/[^a-zA-Z0-9\-_.]/.test(filename)) {
    return NextResponse.json({ error: "文件名包含非法字符" }, { status: 400 });
  }

  const uploadDir = process.env.UPLOAD_DIR ?? join(projectRoot, "uploads");
  const filePath = join(uploadDir, filename);

  try {
    const fileBuffer = await readFile(filePath);
    const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
}