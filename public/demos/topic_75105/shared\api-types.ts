// 前后端共享的 API 类型定义（仅类型，无运行时代码）
// 用于 POST /api/review 接口契约，确保前后端结构一致。

/** 预审条目（材料 / 待确认事项） */
export interface ReviewItem {
  name: string;
  description?: string;
}

/** 预审结果结构（本地规则与 AI 统一） */
export interface ReviewResult {
  /** 已具备的材料 */
  ready: ReviewItem[];
  /** 缺失的材料 */
  missing: ReviewItem[];
  /** 待确认事项 */
  uncertain: ReviewItem[];
  /** 老人友好清单（大字、口语化） */
  plainChecklist: string[];
  /** 风险提示 */
  riskNotes: string[];
  /** 免责声明 */
  disclaimer: string;
}

/** AI 参与状态 */
export type AiStatus = 'success' | 'skipped' | 'fallback';

/** 地区信息（请求体中 region 字段） */
export interface RegionInfo {
  provinceName?: string;
  cityName?: string;
  countyName?: string;
}

/** POST /api/review 请求体 */
export interface ReviewApiRequest {
  serviceCode: string;
  region?: RegionInfo;
  applicantType?: 'self' | 'family';
  age?: number;
  livingInGD?: 'yes' | 'no';
  materials?: string[];
}

/** POST /api/review 成功响应 */
export interface ReviewApiResponse {
  ok: true;
  aiStatus: AiStatus;
  aiMessage: string;
  result: ReviewResult;
}

/** POST /api/review 错误响应 */
export interface ReviewApiError {
  ok: false;
  error: string;
}

/** 后端响应联合类型 */
export type ReviewApiReply = ReviewApiResponse | ReviewApiError;

// ====== 第 5 轮：材料上传与识别 ======

/** 前端文件识别展示状态（仅前端用，不参与后端契约） */
export type MaterialIdentifyStatus =
  | 'pending'
  | 'identifying'
  | 'identified'
  | 'failed';

/** 单个文件的材料识别结果条目 */
export interface MaterialIdentifyItem {
  /** 文件名（前端原始名） */
  fileName: string;
  /** 用户手动标注的材料类型 */
  userLabel?: string;
  /** AI 建议的材料类型（无 Key 或失败时为空） */
  suggestedMaterial?: string;
  /** AI 置信度：unknown 表示未调用 AI */
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  /** 说明（含未配置 Key / 识别失败原因等） */
  notes?: string;
}

/** POST /api/identify-materials 成功响应 */
export interface MaterialIdentifyResponse {
  ok: true;
  aiStatus: AiStatus;
  items: MaterialIdentifyItem[];
  /** 隐私提示文案，前端需展示 */
  privacyNotice: string;
}

/** POST /api/identify-materials 错误响应 */
export interface MaterialIdentifyError {
  ok: false;
  error: string;
}

export type MaterialIdentifyReply =
  | MaterialIdentifyResponse
  | MaterialIdentifyError;

// ====== 第 6 轮：AI 配置状态 ======

/** GET /api/ai-status 响应（只返回是否配置/模型名/baseUrl，绝不含 API Key） */
export interface AiStatusResponse {
  ok: true;
  deepseek: {
    configured: boolean;
    model: string;
  };
  ark: {
    configured: boolean;
    model: string;
    baseUrl: string;
  };
}
