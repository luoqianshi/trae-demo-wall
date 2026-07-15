import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

const GLM_CHAT_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const GLM_OCR_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/layout_parsing";

// 两段流水线：GLM-OCR（layout_parsing 接口）提取图中全部文字 → glm-4.5-flash（免费）整理成单词+释义 JSON
const EXTRACT_PROMPT = `下面是从学生的单词表/课本页 OCR 出来的文字。请提取其中所有英文单词或词组：
1. 保持它们在原文中出现的顺序。
2. 忽略中文句子、音标、页码、序号、标题等非单词内容。
3. 如果单词旁有中文释义，直接使用；否则给出简短中文释义（不超过10个字）。
4. 只输出 JSON 数组，不要输出任何其他文字或代码块标记。格式：
[{"word":"apple","meaning":"苹果"},{"word":"give up","meaning":"放弃"}]

OCR 文字：
`;

type WordItem = { word: string; meaning: string };

function parseWords(text: string): WordItem[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return [];
  try {
    const arr = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.word === "string" && x.word.trim())
      .map((x) => ({
        word: String(x.word).trim(),
        meaning: typeof x.meaning === "string" ? x.meaning.trim() : "",
      }));
  } catch {
    return [];
  }
}

async function chat(
  apiKey: string,
  model: string,
  content: unknown
): Promise<string> {
  const res = await fetch(GLM_CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      // GLM-4.5 默认开"思考"，对这种简单抽取任务会慢到 60~70s；关掉后约 5s
      thinking: { type: "disabled" },
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GLM ${model} ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

async function ocrImage(apiKey: string, model: string, dataUrl: string) {
  const res = await fetch(GLM_OCR_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, file: dataUrl }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GLM ${model} ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  // md_results 可能是字符串（整篇 markdown）或分页数组
  const md = json?.md_results;
  if (typeof md === "string") return md;
  if (Array.isArray(md)) {
    return md
      .map((p) => (typeof p === "string" ? p : (p?.content ?? p?.md ?? "")))
      .join("\n\n");
  }
  return "";
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "服务端未配置 GLM_API_KEY" }, { status: 500 });
  }
  const ocrModel = process.env.GLM_OCR_MODEL || "glm-ocr";
  const textModel = process.env.GLM_TEXT_MODEL || "glm-4.5-flash";

  let images: string[];
  try {
    const body = await req.json();
    images = body.images;
    if (!Array.isArray(images) || images.length === 0) throw new Error();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  if (images.length > 6) {
    return NextResponse.json({ error: "一次最多识别 6 张图片" }, { status: 400 });
  }

  try {
    // 逐张 OCR，保证单词顺序与拍摄顺序一致
    const texts: string[] = [];
    for (const img of images) {
      texts.push(await ocrImage(apiKey, ocrModel, img));
    }
    const merged = texts.join("\n\n");
    if (!merged.trim()) {
      return NextResponse.json({ error: "图片中没有识别到文字" }, { status: 422 });
    }

    const extracted = await chat(apiKey, textModel, EXTRACT_PROMPT + merged);
    const words = parseWords(extracted);

    // 去重（不区分大小写），保留首次出现的顺序
    const seen = new Set<string>();
    const deduped = words.filter((w) => {
      const key = w.word.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return NextResponse.json({ words: deduped });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "识别失败";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
