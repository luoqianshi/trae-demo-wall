import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";

import { PythonKernel } from "./runCode.js";
import { runAgent } from "./agent.js";
import { testConfig } from "./llm.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const PUBLIC_DIR = path.join(ROOT, "public");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(PUBLIC_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".xlsx";
    cb(null, `${nanoid()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const sessions = new Map();

const PREVIEW_CODE = `
try:
    _sheets = pd.read_excel(DATA_FILE, sheet_name=None)
except Exception as _e:
    print("读取失败:", _e)
    _sheets = {}

_lines = []
_lines.append(f"工作表数量: {len(_sheets)}")
for _name, _df in _sheets.items():
    _lines.append(f"\\n=== 工作表: {_name} ===")
    _lines.append(f"形状: {_df.shape[0]} 行 x {_df.shape[1]} 列")
    _lines.append("字段与类型:")
    for _c in _df.columns:
        _lines.append(f"  - {_c} ({_df[_c].dtype})")
    _lines.append("前 5 行预览:")
    _lines.append(_df.head(5).to_string(max_cols=30))
print("\\n".join(_lines))
`;

app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "未收到文件" });
  }
  const sessionId = nanoid();
  const filePath = req.file.path;
  const kernel = new PythonKernel();

  try {
    await kernel.start();
    await kernel.setContext(filePath);
    const preview = await kernel.runCode(PREVIEW_CODE);
    const fileInfo =
      `文件名: ${req.file.originalname}\n` +
      `路径(DATA_FILE): ${filePath}\n\n` +
      (preview.ok ? preview.stdout : `预览失败: ${preview.error || preview.stderr}`);

    sessions.set(sessionId, {
      kernel,
      filePath,
      originalName: req.file.originalname,
      fileInfo,
      messages: [],
      abortController: null,
    });

    res.json({
      sessionId,
      originalName: req.file.originalname,
      preview: preview.ok ? preview.stdout : preview.error || preview.stderr,
    });
  } catch (err) {
    kernel.stop();
    res.status(500).json({ error: `初始化失败: ${err.message}` });
  }
});

app.post("/api/test-config", async (req, res) => {
  const { config } = req.body || {};
  if (!config?.model || !config?.apiKey) {
    return res.status(400).json({ error: "缺少 model 或 apiKey" });
  }
  try {
    const reply = await testConfig(config);
    res.json({ ok: true, reply });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post("/api/analyze", async (req, res) => {
  const { sessionId, prompt, config, isFollowup = false } = req.body || {};
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(400).json({ error: "会话不存在，请重新上传文件" });
  }
  if (!config?.model || !config?.apiKey) {
    return res.status(400).json({ error: "请先完成大模型配置（model / api-key）" });
  }

  session.abortController?.abort();
  const controller = new AbortController();
  session.abortController = controller;

  res.writeHead(200, {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const emit = (event) => {
    try { res.write(JSON.stringify(event) + "\n"); } catch { /* ignore */ }
  };

  let closed = false;
  res.on("close", () => {
    closed = true;
    controller.abort();
  });

  try {
    await runAgent({
      session,
      config,
      userPrompt: prompt || "请根据数据完成一份完整的复盘分析报告。",
      emit: (e) => { if (!closed) emit(e); },
      signal: controller.signal,
      isFollowup,
    });
  } catch (err) {
    emit({ type: "error", message: err.message });
    emit({ type: "done" });
  } finally {
    session.abortController = null;
    res.end();
  }
});

app.post("/api/stop", (req, res) => {
  const { sessionId } = req.body || {};
  const session = sessions.get(sessionId);
  if (session?.abortController) {
    session.abortController.abort();
  }
  res.json({ ok: true });
});

app.post("/api/reset", (req, res) => {
  const { sessionId } = req.body || {};
  const session = sessions.get(sessionId);
  if (session) {
    session.abortController?.abort();
    session.kernel.stop();
    sessions.delete(sessionId);
  }
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n数据复盘分析 Agent 已启动: http://localhost:${PORT}\n`);
});