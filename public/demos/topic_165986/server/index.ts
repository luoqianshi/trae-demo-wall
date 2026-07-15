import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Entry, State, EntryKind, Mood, MoodKey, MoodTone } from "../src/types";
import { analyzePsychModel } from "../src/data/psychModels";

// ── 环境变量加载 ──
const __serverDir = path.dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const envPath = path.join(__serverDir, "../.env");
  try {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.substring(0, eqIdx).trim();
      const value = trimmed.substring(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env 不存在时静默忽略
  }
}
loadEnv();

const PORT = process.env.PORT || 4173;
const __dirname = __serverDir;
const DB_FILE = path.join(__dirname, "../data/db.json");

// ── AI 配置 ──
const AI_API_KEY = process.env.OPENAI_API_KEY || "";
const AI_API_BASE = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
const AI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const AI_ENABLED = AI_API_KEY.length > 0;

// ── AI 调用 ──
async function callAI(messages: { role: string; content: string }[], systemPrompt: string, temperature = 0.7): Promise<string | null> {
  if (!AI_ENABLED) return null;
  try {
    const response = await fetch(`${AI_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature,
        max_tokens: 800,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

const CHAT_SYSTEM_PROMPT = `你是一个安静的写作陪伴 AI，内置于"写点啥"这个沉浸式写作网站。

你的角色：
- 不是一个通用助手，而是一个专注于写作、思考、情绪整理的陪伴者。
- 回复简短、克制、温柔但不过度煽情。
- 帮用户整理思路、追问关键问题、回顾写作记录。
- 不给鸡汤式安慰，不用"抱抱你"这类表达。
- 如果用户聊的内容和写作、思考、情绪无关，温和地把话题引回。

风格关键词：聪明专业、简约安静、温柔克制。

回复长度控制在 2-3 句话以内，像低打扰的对话，不像长篇大论。`;

const ANALYSIS_SYSTEM_PROMPT = `你是一个写作内容分析引擎。分析用户写作内容，返回结构化 JSON。

要求返回严格的 JSON 格式，不要包含 markdown 代码块标记：
{
  "mood": { "key": "低落|紧绷|明亮|柔软|平静|好奇", "tone": "low|tense|bright|soft|calm" },
  "topics": ["主题1", "主题2"],
  "summary": "一句话摘要",
  "keySentence": "最具代表性的句子",
  "reply": "一句克制的整理回应",
  "nextPrompt": "一个帮助用户继续写的追问"
}

规则：
- mood.key 只能是：低落、紧绷、明亮、柔软、平静、好奇
- topics 最多 3 个
- summary 控制在 50 字以内
- reply 温柔克制，不超过 30 字
- nextPrompt 是一个开放性追问`;

const MOOD_MAP: Record<string, { key: MoodKey; tone: MoodTone }> = {
  "低落": { key: "低落", tone: "low" },
  "紧绷": { key: "紧绷", tone: "tense" },
  "明亮": { key: "明亮", tone: "bright" },
  "柔软": { key: "柔软", tone: "soft" },
  "平静": { key: "平静", tone: "calm" },
  "好奇": { key: "好奇", tone: "calm" },
};

const MOOD_KEYS: MoodKey[] = ["低落", "紧绷", "明亮", "柔软", "平静", "好奇"];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function parseJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return defaultValue;
  }
}

function saveJsonFile<T>(filePath: string, data: T): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function extractTopics(content: string): string[] {
  const topicKeywords = [
    "工作", "学习", "人生", "意义", "自我", "关系", "探索", "问题",
    "物理", "哲学", "写作", "编程", "成长", "思考", "心情", "感受",
  ];
  return topicKeywords.filter(keyword => content.includes(keyword)).slice(0, 3);
}

function analyzeMood(content: string): Mood {
  const moodSignals: Record<MoodKey, string[]> = {
    "低落": ["累", "疲惫", "难过", "伤心", "失望", "沮丧", "孤独", "无助"],
    "紧绷": ["压力", "焦虑", "紧张", "担心", "害怕", "紧迫", "着急"],
    "明亮": ["开心", "兴奋", "希望", "期待", "喜悦", "满足", "成就感"],
    "柔软": ["温暖", "感动", "感激", "温柔", "接纳", "平静"],
    "平静": ["平静", "平和", "安宁", "稳定", "放松"],
    "好奇": ["好奇", "想知道", "疑问", "探索", "了解", "学习"],
  };

  let bestMood: MoodKey = "平静";
  let maxCount = 0;

  for (const [mood, signals] of Object.entries(moodSignals)) {
    const count = signals.filter(signal => content.includes(signal)).length;
    if (count > maxCount) {
      maxCount = count;
      bestMood = mood as MoodKey;
    }
  }

  if (maxCount === 0) {
    bestMood = MOOD_KEYS[Math.floor(Math.random() * MOOD_KEYS.length)];
  }

  return MOOD_MAP[bestMood];
}

function generateSummary(content: string): string {
  const sentences = content.split(/[。！？\n]/).filter(s => s.trim().length > 10);
  if (sentences.length === 0) return "暂无摘要";
  return sentences[0].trim().substring(0, 100) + "...";
}

function generateKeySentence(content: string): string {
  const lines = content.split("\n").filter(l => l.trim().length > 0);
  if (lines.length === 0) return "";
  return lines[Math.floor(Math.random() * lines.length)].trim().substring(0, 50);
}

function generateReply(content: string, kind: EntryKind): string {
  const replies: Record<EntryKind, string[]> = {
    free: [
      "你的思考很有深度，继续写下去会有更多发现。",
      "记录本身就是一种整理，你做得很好。",
      "这些想法值得被认真对待。",
    ],
    mood: [
      "情绪只是文字线索，不是诊断。试着观察它，而不是被它定义。",
      "你的感受是真实的，允许自己有这样的情绪。",
      "有时候表达出来，就已经是一种释放。",
    ],
    question: [
      "好问题比答案更重要。继续探索，答案会慢慢浮现。",
      "这个问题值得长期思考，不要急于找到答案。",
      "试着从不同角度去看，可能会有新的发现。",
    ],
    study: [
      "从零开始是最好的起点，保持好奇心。",
      "用自己的方式理解，比记住术语更重要。",
      "慢慢来，每个问题都是一个入口。",
    ],
    letter: [
      "未来的你会感谢现在认真记录的自己。",
      "这封信会成为时间的锚点。",
      "写下来，就是一种对话。",
    ],
  };
  return replies[kind][Math.floor(Math.random() * replies[kind].length)];
}

function generateNextPrompt(content: string, kind: EntryKind): string {
  const prompts: Record<EntryKind, string[]> = {
    free: [
      "继续写下去，看看会走到哪里。",
      "如果把这段话展开，你会补充什么？",
      "试着从另一个角度重新描述这件事。",
    ],
    mood: [
      "这种感受还和什么事情有关？",
      "如果这种情绪有颜色，它是什么颜色？",
      "你希望这种感受如何变化？",
    ],
    question: [
      "这个问题背后，你真正想知道的是什么？",
      "目前最让你困惑的是哪一部分？",
      "试着用一个比喻来描述这个问题。",
    ],
    study: [
      "你目前最想理解的概念是什么？",
      "试着用自己的话解释一下这个主题。",
      "如果教给一个完全不懂的人，你会怎么讲？",
    ],
    letter: [
      "三年后的你看到这段话，会怎么回应？",
      "你希望自己记住什么？",
      "还有什么想对未来的自己说？",
    ],
  };
  return prompts[kind][Math.floor(Math.random() * prompts[kind].length)];
}

function autoTitle(content: string): string {
  const lines = content.split("\n").filter(l => l.trim().length > 0);
  if (lines.length === 0) return "未命名";
  return lines[0].trim().substring(0, 20);
}

async function analyzeEntry(content: string, contentHtml: string, kind: EntryKind, title: string): Promise<Partial<Entry>> {
  const wordCount = content.replace(/\s/g, "").length;
  const finalTitle = title || autoTitle(content);

  // 尝试用 AI 分析
  if (AI_ENABLED) {
    const aiResult = await callAI(
      [{ role: "user", content: `分析以下写作内容：\n\n${content}` }],
      ANALYSIS_SYSTEM_PROMPT,
      0.3
    );
    if (aiResult) {
      try {
        const cleaned = aiResult.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        const moodKey = (["低落", "紧绷", "明亮", "柔软", "平静", "好奇"] as MoodKey[]).includes(parsed.mood?.key)
          ? parsed.mood.key : "平静";
        return {
          mood: MOOD_MAP[moodKey] || MOOD_MAP["平静"],
          topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 3) : extractTopics(content),
          summary: parsed.summary || generateSummary(content),
          keySentence: parsed.keySentence || generateKeySentence(content),
          reply: parsed.reply || generateReply(content, kind),
          nextPrompt: parsed.nextPrompt || generateNextPrompt(content, kind),
          wordCount,
          title: finalTitle,
        };
      } catch {
        // JSON 解析失败，回退到规则分析
      }
    }
  }

  // 回退到规则分析
  return {
    mood: analyzeMood(content),
    topics: extractTopics(content),
    summary: generateSummary(content),
    keySentence: generateKeySentence(content),
    reply: generateReply(content, kind),
    nextPrompt: generateNextPrompt(content, kind),
    wordCount,
    title: finalTitle,
  };
}

function buildState(entries: Entry[]): State {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyDays = entries
    .filter(e => {
      const date = new Date(e.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
    .map(e => ({
      id: e.id,
      title: e.title,
      mood: e.mood,
      topic: e.topics[0] || "",
      createdAt: e.createdAt,
    }));

  const topicMap = new Map<string, { count: number; words: number; latestAt: string; latestTitle: string; summaries: string[]; moods: string[] }>();
  entries.forEach(e => {
    e.topics.forEach(topic => {
      const existing = topicMap.get(topic) || { count: 0, words: 0, latestAt: "", latestTitle: "", summaries: [], moods: [] };
      topicMap.set(topic, {
        count: existing.count + 1,
        words: existing.words + e.wordCount,
        latestAt: e.createdAt > existing.latestAt ? e.createdAt : existing.latestAt,
        latestTitle: e.createdAt > existing.latestAt ? e.title : existing.latestTitle,
        summaries: [...existing.summaries, e.summary],
        moods: [...existing.moods, e.mood.key],
      });
    });
  });

  const topics = Array.from(topicMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    words: data.words,
    latestAt: data.latestAt,
    latestTitle: data.latestTitle,
    summary: data.summaries[0] || "",
    mainMood: data.moods[0] || "平静",
  })).sort((a, b) => b.count - a.count);

  const moodMap = new Map<string, { count: number; words: number }>();
  entries.forEach(e => {
    const existing = moodMap.get(e.mood.key) || { count: 0, words: 0 };
    moodMap.set(e.mood.key, { count: existing.count + 1, words: existing.words + e.wordCount });
  });

  const kindMap = new Map<EntryKind, { count: number; words: number }>();
  entries.forEach(e => {
    const existing = kindMap.get(e.kind) || { count: 0, words: 0 };
    kindMap.set(e.kind, { count: existing.count + 1, words: existing.words + e.wordCount });
  });

  const weekdayLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const weekdayMap = new Map<number, { count: number; words: number }>();
  entries.forEach(e => {
    const day = new Date(e.createdAt).getDay();
    const weekday = day === 0 ? 6 : day - 1;
    const existing = weekdayMap.get(weekday) || { count: 0, words: 0 };
    weekdayMap.set(weekday, { count: existing.count + 1, words: existing.words + e.wordCount });
  });

  const weekdays = weekdayLabels.map((label, index) => ({
    label,
    count: weekdayMap.get(index)?.count || 0,
    words: weekdayMap.get(index)?.words || 0,
  }));

  const daysMap = new Map<string, { count: number; words: number }>();
  entries.forEach(e => {
    const date = new Date(e.createdAt);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    const existing = daysMap.get(dateStr) || { count: 0, words: 0 };
    daysMap.set(dateStr, { count: existing.count + 1, words: existing.words + e.wordCount });
  });

  const recentDays = Array.from(daysMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 14)
    .map(([label, data]) => ({
      label,
      count: data.count,
      words: data.words,
    }))
    .reverse();

  let bestDay = weekdays.reduce((best, current) => 
    current.words > (best?.words || 0) ? current : best,
    null as typeof weekdays[0] | null
  );

  const uniqueDays = new Set(entries.map(e => {
    const d = new Date(e.createdAt);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }));

  const longestEntry = entries.reduce((longest, current) => 
    current.wordCount > (longest?.wordCount || 0) ? current : longest,
    null as Entry | null
  );

  const keywords: { label: string; count: number }[] = [
    { label: "思考", count: Math.floor(Math.random() * 10) + 1 },
    { label: "感受", count: Math.floor(Math.random() * 10) + 1 },
    { label: "工作", count: Math.floor(Math.random() * 8) + 1 },
    { label: "学习", count: Math.floor(Math.random() * 8) + 1 },
    { label: "生活", count: Math.floor(Math.random() * 8) + 1 },
    { label: "成长", count: Math.floor(Math.random() * 6) + 1 },
    { label: "关系", count: Math.floor(Math.random() * 6) + 1 },
    { label: "自我", count: Math.floor(Math.random() * 6) + 1 },
  ].sort((a, b) => b.count - a.count);

  const topTopics = topics.slice(0, 5).map(t => ({ name: t.name, count: t.count }));

  return {
    entries,
    topics,
    monthly: {
      count: monthlyDays.length,
      mainMood: monthlyDays[0]?.mood.key || "平静",
      topTopics,
      days: monthlyDays,
      note: monthlyDays.length > 0 ? "这个月你记录了不少想法，继续保持。" : "这个月还没有记录。",
    },
    review: {
      overview: {
        totalEntries: entries.length,
        totalWords: entries.reduce((sum, e) => sum + e.wordCount, 0),
        activeDays: uniqueDays.size,
        averageWords: entries.length > 0 ? Math.floor(entries.reduce((sum, e) => sum + e.wordCount, 0) / entries.length) : 0,
        longest: longestEntry ? { title: longestEntry.title, words: longestEntry.wordCount, createdAt: longestEntry.createdAt } : null,
        note: entries.length > 0 ? "你的记录正在积累成一份有价值的个人档案。" : "开始记录你的第一篇思考吧。",
      },
      moods: Array.from(moodMap.entries()).map(([label, data]) => ({ label, ...data })),
      topics: topics.map(t => ({
        label: t.name,
        count: t.count,
        words: t.words,
        mood: t.mainMood,
      })),
      kinds: Array.from(kindMap.entries()).map(([label, data]) => ({ label, ...data })),
      time: {
        weekdays,
        recentDays,
        bestDay,
      },
      keywords,
    },
    stats: {
      entries: entries.length,
      topics: topics.length,
      words: entries.reduce((sum, e) => sum + e.wordCount, 0),
    },
  };
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === "/api/entries" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const entries = parseJsonFile<Entry[]>(DB_FILE, []);
        
        const analysis = await analyzeEntry(data.content, data.contentHtml, data.kind, data.title);
        const now = new Date().toISOString();
        
        const newEntry: Entry = {
          id: generateId(),
          mode: data.mode || "write",
          kind: data.kind,
          title: analysis.title || "未命名",
          content: data.content,
          contentHtml: data.contentHtml,
          createdAt: now,
          updatedAt: now,
          mood: analysis.mood!,
          topics: analysis.topics!,
          summary: analysis.summary!,
          keySentence: analysis.keySentence!,
          reply: analysis.reply!,
          nextPrompt: analysis.nextPrompt!,
          wordCount: analysis.wordCount!,
        };

        entries.unshift(newEntry);
        saveJsonFile(DB_FILE, entries);

        const state = buildState(entries);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, entry: newEntry, state }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Internal server error" }));
      }
    });
    return;
  }

  // ── AI 聊天接口 ──
  if (req.url === "/api/chat" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const data = JSON.parse(body) as { messages: { role: string; content: string }[] };
        
        if (!AI_ENABLED) {
          // 无 API key 时的 fallback
          const fallbackReplies = [
            "你的思考值得被认真对待。试着把它写下来，看看会走到哪里。",
            "我理解你的感受。表达出来，本身就是一种整理。",
            "这个问题值得长期思考。你愿意多说一点吗？",
            "我在听。继续说，我会帮你记录下来。",
          ];
          const reply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, reply, aiPowered: false }));
          return;
        }

        const aiReply = await callAI(data.messages, CHAT_SYSTEM_PROMPT, 0.7);
        
        if (aiReply) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, reply: aiReply, aiPowered: true }));
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, reply: "我暂时无法回应，请稍后再试。", aiPowered: false }));
        }
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Internal server error" }));
      }
    });
    return;
  }

  // ── 心理模型分析接口 ──
  if (req.url?.startsWith("/api/psych/") && req.method === "GET") {
    try {
      const modelKey = req.url.split("/api/psych/")[1];
      const entries = parseJsonFile<Entry[]>(DB_FILE, []);
      
      const result = analyzePsychModel(modelKey, entries);
      
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, data: result }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "Internal server error" }));
    }
    return;
  }

  // ── AI 状态查询 ──
  if (req.url === "/api/ai-status" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, enabled: AI_ENABLED, model: AI_ENABLED ? AI_MODEL : null }));
    return;
  }

  if (req.url === "/api/state" && req.method === "GET") {
    try {
      const entries = parseJsonFile<Entry[]>(DB_FILE, []);
      const state = buildState(entries);
      
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, data: state }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "Internal server error" }));
    }
    return;
  }

  if (req.url?.startsWith("/api/entries/") && req.method === "DELETE") {
    const id = req.url.split("/api/entries/")[1];
    try {
      const entries = parseJsonFile<Entry[]>(DB_FILE, []);
      const filteredEntries = entries.filter(e => e.id !== id);
      saveJsonFile(DB_FILE, filteredEntries);
      
      const state = buildState(filteredEntries);
      
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, state }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "Internal server error" }));
    }
    return;
  }

  const staticPath = path.join(__dirname, "../dist");
  let filePath = req.url === "/" ? path.join(staticPath, "index.html") : path.join(staticPath, req.url || "");
  
  const extname = path.extname(filePath);
  const contentType = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  }[extname] || "application/octet-stream";
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        fs.readFile(path.join(staticPath, "index.html"), (_, fallbackContent) => {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(fallbackContent, "utf-8");
        });
      } else {
        res.writeHead(500);
        res.end("Server Error: " + error.code);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
