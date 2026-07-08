import type { CostMeta, TaskStatus } from '../types';

export interface CostMetrics {
  totalTokens: number;
  outputRatio: number;
  cacheRatio: number;
  costPerMinute: number;
}

export function calculateCostMetrics(cost: CostMeta, durationMinutes: number): CostMetrics {
  const totalTokens = cost.inputTokens + cost.outputTokens + cost.cacheHitTokens;
  const outputRatio = totalTokens > 0 ? cost.outputTokens / totalTokens : 0;
  const cacheRatio = totalTokens > 0 ? cost.cacheHitTokens / totalTokens : 0;
  const costPerMinute = durationMinutes > 0 ? cost.totalCost / durationMinutes : 0;

  return {
    totalTokens,
    outputRatio,
    cacheRatio,
    costPerMinute,
  };
}

export function calculateModelScore(
  cost: CostMeta,
  status: TaskStatus
): number {
  let score = 100;
  score -= cost.retries * 8;
  score -= cost.interruptions * 12;
  
  if (status === 'partial') score -= 15;
  if (status === 'failed') score -= 35;
  if (status === 'blocked') score -= 45;
  
  return Math.max(0, Math.min(100, score));
}

export function getScoreLevel(score: number): { level: string; color: string; description: string } {
  if (score >= 85) {
    return { level: '优秀', color: '#7c9885', description: '模型表现出色，任务完成质量高' };
  }
  if (score >= 70) {
    return { level: '良好', color: '#8fa5b3', description: '整体表现不错，有少量重试或中断' };
  }
  if (score >= 50) {
    return { level: '一般', color: '#c4a77d', description: '存在一定问题，建议优化提示词' };
  }
  return { level: '较差', color: '#c17f72', description: '问题较多，需要重新规划任务' };
}

export function formatCostAnalysis(
  cost: CostMeta,
  metrics: CostMetrics,
  durationMinutes: number
): string {
  const currencySymbol = cost.currency === 'USD' ? '$' : '¥';
  const hasData = cost.inputTokens > 0 || cost.outputTokens > 0 || cost.totalCost > 0;

  if (!hasData) {
    return '未提供完整成本数据，无法进行详细分析。建议下次记录 token 使用量和费用信息。';
  }

  return `本次任务共使用 ${metrics.totalTokens.toLocaleString()} tokens，耗时 ${durationMinutes} 分钟，总费用 ${currencySymbol}${cost.totalCost.toFixed(4)}。
- 输入 tokens: ${cost.inputTokens.toLocaleString()}
- 输出 tokens: ${cost.outputTokens.toLocaleString()} (${(metrics.outputRatio * 100).toFixed(1)}%)
- 缓存命中: ${cost.cacheHitTokens.toLocaleString()} (${(metrics.cacheRatio * 100).toFixed(1)}%)
- 每分钟成本: ${currencySymbol}${metrics.costPerMinute.toFixed(4)}
- 重试次数: ${cost.retries} 次
- 中断次数: ${cost.interruptions} 次`;
}

export function formatModelEvaluation(
  modelName: string,
  score: number,
  scoreInfo: { level: string; description: string }
): string {
  return `模型 ${modelName} 本次表现评分：${score} 分（${scoreInfo.level}）
${scoreInfo.description}

${getModelSuggestions(score)}`;
}

function getModelSuggestions(score: number): string {
  if (score >= 85) {
    return '建议：保持当前使用方式，可以继续使用该模型处理类似任务。';
  }
  if (score >= 70) {
    return '建议：适当优化提示词结构，减少不必要的重试，可以进一步提升效率。';
  }
  if (score >= 50) {
    return '建议：将任务拆分为更小的子任务，提供更清晰的上下文说明，考虑使用更强的模型。';
  }
  return '建议：重新梳理任务需求，检查环境配置，必要时人工介入关键步骤。';
}
