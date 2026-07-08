// AI 配置状态响应构造（第 6 轮收尾）
// 抽出到独立模块，供 server/index.ts 路由与 ai-status-selfcheck.ts 共同复用。
// 只返回是否配置、模型名、baseUrl；绝不返回 API Key 或其任何片段。

import type { AiStatusResponse } from '../shared/api-types';
import { loadDeepSeekConfig, validateDeepSeekConfig } from './deepseek';
import { loadArkConfig, validateArkConfig } from './doubao';

/**
 * 构造 /api/ai-status 响应。
 * 复用 loadDeepSeekConfig / loadArkConfig / validate* 配置读取函数。
 * 绝不包含 apiKey / key / secret / Authorization / Bearer 等敏感字段。
 */
export function buildAiStatusResponse(): AiStatusResponse {
  const ds = loadDeepSeekConfig();
  const ark = loadArkConfig();
  const dsValid = validateDeepSeekConfig();
  const arkValid = validateArkConfig();
  return {
    ok: true,
    deepseek: {
      configured: dsValid.ok,
      model: ds.model,
    },
    ark: {
      configured: arkValid.ok,
      model: ark.model,
      baseUrl: ark.baseUrl,
    },
  };
}
