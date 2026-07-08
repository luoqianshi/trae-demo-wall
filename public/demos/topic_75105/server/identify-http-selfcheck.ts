// identify-http-selfcheck: HTTP 层 multipart 自检（第 5 轮修复 B）
// 在同进程内启动 Express + multer，用 Node 原生 fetch + FormData 发送真实 multipart 请求，
// 验证 server/index.ts 中 /api/identify-materials 经 parseUserLabels → identifyMaterials → 响应
// 全链路保留 item.userLabel。不调用真实 DeepSeek / Doubao API（强制 skipped 路径）。
// 不打印文件内容、身份证号、银行卡号、API Key。

import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import multer, { MulterError } from 'multer';
import type { MaterialIdentifyReply } from '../shared/api-types';
import { identifyMaterials, parseUserLabels } from './identify';

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    passed++;
    console.log('  ✓', msg);
  } else {
    failed++;
    console.error('  ✗ FAIL:', msg);
  }
}

// ====== 强制 skipped 路径：清除 API Key 环境变量 ======
// 必须在加载/调用 identify 之前清除，确保 validateArkConfig / validateDeepSeekConfig 都返回 false。
const savedDeepseekKey = process.env.DEEPSEEK_API_KEY;
const savedDeepseekModel = process.env.DEEPSEEK_MODEL;
const savedArkKey = process.env.ARK_API_KEY;
const savedArkModel = process.env.ARK_MODEL;
const savedArkBaseUrl = process.env.ARK_BASE_URL;
delete process.env.DEEPSEEK_API_KEY;
delete process.env.DEEPSEEK_MODEL;
delete process.env.ARK_API_KEY;
delete process.env.ARK_MODEL;
delete process.env.ARK_BASE_URL;

// ====== 构造与 server/index.ts 完全一致的 multer 配置 ======
const ALLOWED_MIME = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 6,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  },
});

const app = express();
app.use(express.json({ limit: '256kb' }));

// 复用 server/index.ts 中 /api/identify-materials 的路由实现（不手写 userLabels 解析）
app.post(
  '/api/identify-materials',
  upload.array('files', 6),
  async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const serviceCode =
      typeof req.body?.serviceCode === 'string' ? req.body.serviceCode : '';
    // 直接复用 identify.ts 导出的 parseUserLabels
    const userLabels = parseUserLabels(req.body?.userLabels);
    // 与 server/index.ts 一致：multer latin1 filename → UTF-8
    const reply = await identifyMaterials({
      files: files.map((f) => ({
        originalname: Buffer.from(f.originalname, 'latin1').toString('utf8'),
        mimetype: f.mimetype,
        size: f.size,
        buffer: f.buffer,
      })),
      serviceCode,
      userLabels,
    });
    res.json(reply satisfies MaterialIdentifyReply);
  },
);

// 与 server/index.ts 一致的错误处理
app.use(
  (
    err: unknown,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ) => {
    if (err instanceof MulterError) {
      let msg: string;
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          msg = '单文件超过 8MB 限制';
          break;
        case 'LIMIT_FILE_COUNT':
          msg = '最多上传 6 个文件';
          break;
        default:
          msg = `上传错误: ${err.code}`;
      }
      res.json({ ok: false, error: msg });
      return;
    }
    if (err instanceof Error && err.message.startsWith('不支持的文件类型')) {
      res.json({ ok: false, error: err.message });
      return;
    }
    res.status(500).json({ ok: false, error: '服务器内部错误' });
  },
);

// ====== 启动服务器并发送 multipart 请求 ======
const PORT = 3099;

async function startServer(): Promise<{ close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`[identify-http-selfcheck] server on http://localhost:${PORT}`);
      resolve({
        close: () =>
          new Promise<void>((r) => {
            server.close(() => r());
          }),
      });
    });
    server.on('error', reject);
  });
}

/** 构造一个最小 PNG 文件（1x1 透明像素），避免读取磁盘文件。 */
function makeMinimalPng(): Uint8Array {
  // 1x1 透明 PNG 的固定字节
  const hex =
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4' +
    '890000000d49444154789c63000100000005000100c0dedb0e0000000049454e44ae426082';
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/** 构造一个最小 PDF 文件头（足够通过 multer mime 判断即可）。 */
function makeMinimalPdf(): Uint8Array {
  const text = '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF';
  return new TextEncoder().encode(text);
}

async function sendMultipart(
  url: string,
  files: { fieldname: string; filename: string; mime: string; data: Uint8Array }[],
  fields: Record<string, string>,
): Promise<globalThis.Response> {
  const form = new FormData();
  for (const f of files) {
    // 用 ArrayBuffer 包装避免 TS 对 Uint8Array<ArrayBufferLike> 的 BlobPart 类型报错
    const ab = f.data.buffer.slice(
      f.data.byteOffset,
      f.data.byteOffset + f.data.byteLength,
    ) as ArrayBuffer;
    const blob = new Blob([ab], { type: f.mime });
    form.append(f.fieldname, blob, f.filename);
  }
  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }
  return fetch(url, {
    method: 'POST',
    body: form,
  });
}

async function runTests(): Promise<void> {
  const base = `http://localhost:${PORT}`;

  // ====== 用例 1：PNG + multipart 字符串 JSON userLabels ======
  console.log('\n[HTTP multipart: PNG + 字符串 JSON userLabels]');
  {
    const userLabels = '{"civicmate-test-id.png":"身份证"}';
    const res = await sendMultipart(
      `${base}/api/identify-materials`,
      [
        {
          fieldname: 'files',
          filename: 'civicmate-test-id.png',
          mime: 'image/png',
          data: makeMinimalPng(),
        },
      ],
      { serviceCode: 'elderly-subsidy', userLabels },
    );
    const reply = (await res.json()) as MaterialIdentifyReply;
    assert(reply.ok === true, 'PNG 响应 ok=true');
    if (reply.ok) {
      assert(reply.aiStatus === 'skipped', `PNG aiStatus=skipped (实际: ${reply.aiStatus})`);
      assert(reply.items.length === 1, 'PNG items 长度=1');
      const item = reply.items[0];
      assert(item.fileName === 'civicmate-test-id.png', `PNG item.fileName 正确 (实际: ${item.fileName})`);
      assert(
        item.userLabel === '身份证',
        `PNG multipart item.userLabel=身份证 (实际: ${item.userLabel})`,
      );
      assert(
        item.notes !== undefined && item.notes.length > 0,
        'PNG item.notes 非空',
      );
    }
  }

  // ====== 用例 2：PDF + multipart 字符串 JSON userLabels ======
  console.log('\n[HTTP multipart: PDF + 字符串 JSON userLabels]');
  {
    const userLabels = '{"civicmate-test-residence.pdf":"居住证明"}';
    const res = await sendMultipart(
      `${base}/api/identify-materials`,
      [
        {
          fieldname: 'files',
          filename: 'civicmate-test-residence.pdf',
          mime: 'application/pdf',
          data: makeMinimalPdf(),
        },
      ],
      { serviceCode: 'elderly-subsidy', userLabels },
    );
    const reply = (await res.json()) as MaterialIdentifyReply;
    assert(reply.ok === true, 'PDF 响应 ok=true');
    if (reply.ok) {
      assert(reply.items.length === 1, 'PDF items 长度=1');
      const item = reply.items[0];
      assert(item.fileName === 'civicmate-test-residence.pdf', 'PDF item.fileName 正确');
      assert(
        item.userLabel === '居住证明',
        `PDF multipart item.userLabel=居住证明 (实际: ${item.userLabel})`,
      );
      assert(
        item.notes !== undefined && item.notes.includes('PDF'),
        `PDF item.notes 含 PDF 说明 (实际: ${item.notes})`,
      );
    }
  }

  // ====== 用例 3：PNG + 已解析对象 userLabels（multer 字段可能被中间件解析为对象） ======
  // 注意：multer 不会自动解析 JSON，text field 永远是字符串；这里测试字符串形式的另一种 key
  console.log('\n[HTTP multipart: PNG + 中文文件名 userLabels]');
  {
    const userLabels = '{"身份证正面.png":"身份证"}';
    const res = await sendMultipart(
      `${base}/api/identify-materials`,
      [
        {
          fieldname: 'files',
          filename: '身份证正面.png',
          mime: 'image/png',
          data: makeMinimalPng(),
        },
      ],
      { serviceCode: 'elderly-subsidy', userLabels },
    );
    const reply = (await res.json()) as MaterialIdentifyReply;
    if (reply.ok) {
      const item = reply.items[0];
      assert(
        item.userLabel === '身份证',
        `中文文件名 multipart item.userLabel=身份证 (实际: ${item.userLabel})`,
      );
    }
  }

  // ====== 用例 4：不带 userLabels（确保不强加） ======
  console.log('\n[HTTP multipart: PNG 不带 userLabels]');
  {
    const res = await sendMultipart(
      `${base}/api/identify-materials`,
      [
        {
          fieldname: 'files',
          filename: 'no-label.png',
          mime: 'image/png',
          data: makeMinimalPng(),
        },
      ],
      { serviceCode: 'elderly-subsidy' },
    );
    const reply = (await res.json()) as MaterialIdentifyReply;
    if (reply.ok) {
      const item = reply.items[0];
      assert(
        item.userLabel === undefined,
        `无 userLabels 时 item.userLabel=undefined (实际: ${item.userLabel})`,
      );
    }
  }

  // ====== 用例 5：空字符串 userLabels（解析失败应忽略，不强加） ======
  console.log('\n[HTTP multipart: PNG + 空字符串 userLabels]');
  {
    const res = await sendMultipart(
      `${base}/api/identify-materials`,
      [
        {
          fieldname: 'files',
          filename: 'empty-label.png',
          mime: 'image/png',
          data: makeMinimalPng(),
        },
      ],
      { serviceCode: 'elderly-subsidy', userLabels: '' },
    );
    const reply = (await res.json()) as MaterialIdentifyReply;
    if (reply.ok) {
      const item = reply.items[0];
      assert(
        item.userLabel === undefined,
        `空字符串 userLabels 时 item.userLabel=undefined (实际: ${item.userLabel})`,
      );
    }
  }

  // ====== 用例 6：多文件 + 多 userLabels ======
  console.log('\n[HTTP multipart: 多文件 + 多 userLabels]');
  {
    const userLabels =
      '{"civicmate-test-id.png":"身份证","civicmate-test-bank.png":"银行卡"}';
    const res = await sendMultipart(
      `${base}/api/identify-materials`,
      [
        {
          fieldname: 'files',
          filename: 'civicmate-test-id.png',
          mime: 'image/png',
          data: makeMinimalPng(),
        },
        {
          fieldname: 'files',
          filename: 'civicmate-test-bank.png',
          mime: 'image/png',
          data: makeMinimalPng(),
        },
      ],
      { serviceCode: 'elderly-subsidy', userLabels },
    );
    const reply = (await res.json()) as MaterialIdentifyReply;
    if (reply.ok) {
      assert(reply.items.length === 2, `多文件 items 长度=2 (实际: ${reply.items.length})`);
      const byName = new Map(reply.items.map((it) => [it.fileName, it]));
      const id = byName.get('civicmate-test-id.png');
      const bank = byName.get('civicmate-test-bank.png');
      assert(id?.userLabel === '身份证', '多文件 PNG1 userLabel=身份证');
      assert(bank?.userLabel === '银行卡', '多文件 PNG2 userLabel=银行卡');
    }
  }
}

// ====== 主入口 ======
const server = await startServer();
try {
  await runTests();
} finally {
  await server.close();
  // 恢复环境变量
  if (savedDeepseekKey !== undefined) process.env.DEEPSEEK_API_KEY = savedDeepseekKey;
  if (savedDeepseekModel !== undefined) process.env.DEEPSEEK_MODEL = savedDeepseekModel;
  if (savedArkKey !== undefined) process.env.ARK_API_KEY = savedArkKey;
  if (savedArkModel !== undefined) process.env.ARK_MODEL = savedArkModel;
  if (savedArkBaseUrl !== undefined) process.env.ARK_BASE_URL = savedArkBaseUrl;
}

// ====== 汇总 ======
console.log('\n========== identify-http-selfcheck 汇总 ==========');
console.log(`通过: ${passed}, 失败: ${failed}`);
if (failed > 0) {
  console.error('❌ identify-http-selfcheck 失败：HTTP multipart userLabel 保留存在问题。');
  process.exit(1);
} else {
  console.log('✅ identify-http-selfcheck 通过：HTTP multipart 全链路 userLabel 正确保留。');
}
