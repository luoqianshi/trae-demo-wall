// CivicMate Demo 后端入口
// 第 4 轮：POST /api/review，接入 DeepSeek V4，本地规则预审作为 AI 输入与失败兜底。
// 第 5 轮：POST /api/identify-materials，材料类型辅助识别入口（multer memoryStorage，不落盘）。

import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import multer, { MulterError } from 'multer';
import type {
  MaterialIdentifyReply,
  ReviewApiError,
  ReviewApiReply,
  ReviewApiRequest,
  ReviewApiResponse,
} from '../shared/api-types';
import {
  aiReviewMaterials,
  validateDeepSeekConfig,
} from './deepseek';
import { identifyMaterials, parseUserLabels } from './identify';
import { buildAiStatusResponse } from './ai-status';
import {
  findServiceRule,
  reviewMaterials,
  type ReviewInput,
} from './review';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(express.json({ limit: '256kb' }));

// ====== multer 配置（第 5 轮材料识别，memoryStorage 不落盘） ======
const ALLOWED_MIME = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 单文件最大 8MB
    files: 6, // 最多 6 个文件
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      // multer 2.x 的 ErrorCode 枚举不含"文件类型不允许"，这里用普通 Error，
      // 由下方错误处理中间件识别 message 前缀并返回结构化错误。
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  },
});

// 健康检查接口
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'civicmate-demo' });
});

// AI 配置状态接口（第 6 轮）
// 只返回是否配置、模型名、baseUrl；绝不返回 API Key 或其任何片段。
// 响应构造逻辑复用 server/ai-status.ts，便于自检。
app.get('/api/ai-status', (_req: Request, res: Response) => {
  res.json(buildAiStatusResponse());
});

// 材料预审接口：本地规则预审 + DeepSeek V4
app.post('/api/review', async (req: Request, res: Response) => {
  const body = req.body as ReviewApiRequest;

  // 基础校验
  if (!body || typeof body.serviceCode !== 'string' || !body.serviceCode) {
    const err: ReviewApiError = { ok: false, error: '缺少 serviceCode' };
    res.json(err);
    return;
  }

  const rule = findServiceRule(body.serviceCode);
  if (!rule) {
    const err: ReviewApiError = {
      ok: false,
      error: `未找到事项规则: ${body.serviceCode}`,
    };
    res.json(err);
    return;
  }

  // 1. 先跑本地规则预审
  const localInput: ReviewInput = {
    serviceCode: body.serviceCode,
    county: body.region?.countyName,
    applicantType: body.applicantType,
    age: body.age,
    livingInGD: body.livingInGD,
    materials: body.materials ?? [],
  };
  const localReview = await reviewMaterials(localInput);

  // 2. 无 API Key：返回本地结果（skipped）
  const configValidation = validateDeepSeekConfig();
  if (!configValidation.ok) {
    const reply: ReviewApiResponse = {
      ok: true,
      aiStatus: 'skipped',
      aiMessage: '未配置 DEEPSEEK_API_KEY，已返回本地规则预审结果。',
      result: localReview,
    };
    res.json(reply satisfies ReviewApiReply);
    return;
  }

  // 3. 有 API Key：调用 DeepSeek，失败则兜底（fallback）
  const aiOutcome = await aiReviewMaterials(
    {
      serviceCode: rule.serviceCode,
      serviceName: rule.serviceName,
      region: body.region ?? {},
      applicantType: body.applicantType,
      age: body.age,
      livingInGD: body.livingInGD,
      materials: body.materials ?? [],
    },
    localReview,
  );

  if (aiOutcome.ok) {
    const reply: ReviewApiResponse = {
      ok: true,
      aiStatus: 'success',
      aiMessage: 'AI 已参与预审。',
      result: aiOutcome.result,
    };
    res.json(reply);
    return;
  }

  // 兜底：AI 失败，返回本地结果
  const fallback: ReviewApiResponse = {
    ok: true,
    aiStatus: 'fallback',
    aiMessage: 'AI 预审失败，已返回本地规则预审结果。',
    result: localReview,
  };
  res.json(fallback);
});

// 材料类型辅助识别接口（第 5 轮）
// 请求：multipart/form-data
//   - files: 文件数组（image/jpeg、image/png、image/webp、application/pdf），单文件≤8MB，最多 6 个
//   - serviceCode: 当前事项（字符串）
//   - userLabels: 可选，JSON 字符串，fileName -> materialName
app.post(
  '/api/identify-materials',
  upload.array('files', 6),
  async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const serviceCode =
      typeof req.body?.serviceCode === 'string' ? req.body.serviceCode : '';

    // 解析 userLabels：支持 JSON 字符串或已解析对象（multer text field 为字符串）
    const userLabels = parseUserLabels(req.body?.userLabels);

    // 注意：不打印文件内容、文件名以外的元数据、API Key
    // multer 默认用 latin1 解析 filename，中文文件名需要转回 UTF-8（multer 官方推荐做法）
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

// multer 错误处理：超限 / 类型不允许等，返回结构化错误（不暴露堆栈）
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
    // fileFilter 抛出的"不支持的文件类型"普通 Error
    if (err instanceof Error && err.message.startsWith('不支持的文件类型')) {
      res.json({ ok: false, error: err.message });
      return;
    }
    res.status(500).json({ ok: false, error: '服务器内部错误' });
  },
);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[civicmate-demo] server listening on http://localhost:${PORT}`);
});
