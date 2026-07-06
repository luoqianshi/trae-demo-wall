// ====== 审校 Agent ======
// 质量把关，安全检查，过滤迷信和不科学内容
import type { AgentStep, ApplicationAdvice, SourceTrace, ReviewResult } from '@/lib/types';
import { buildReviewerPrompt } from '@/app/api/lib/prompt-templates';

/** 审校 Agent 输出 */
export interface ReviewerOutput {
  result: ReviewResult;
  step: AgentStep;
}

/** 安全敏感词：触发这些词的建议需要标记问题 */
const SAFETY_KEYWORDS = [
  '处方', '药方', ' dosage', '剂量', '服用', '禁食',
  '迷信', '风水', '算命', '占卜', '诅咒',
  '包治', '根治', '万灵', '神效',
];

/**
 * 检查建议是否包含安全风险
 */
function checkSafety(advices: ApplicationAdvice[]): string[] {
  const issues: string[] = [];

  for (const advice of advices) {
    const fullText = `${advice.title} ${advice.description} ${advice.actionSteps.join(' ')}`;

    for (const keyword of SAFETY_KEYWORDS) {
      if (fullText.includes(keyword)) {
        issues.push(`建议「${advice.title}」包含敏感词「${keyword}」，需人工复核`);
      }
    }
  }

  return issues;
}

/**
 * 检查建议质量
 */
function checkAdviceQuality(advices: ApplicationAdvice[]): string[] {
  const issues: string[] = [];

  for (const advice of advices) {
    // 检查是否有可执行步骤
    if (!advice.actionSteps || advice.actionSteps.length === 0) {
      issues.push(`建议「${advice.title}」缺少可执行步骤`);
    }

    // 检查步骤是否过于笼统（少于5个字）
    const vagueSteps = advice.actionSteps.filter((s) => s.length < 5);
    if (vagueSteps.length > 0) {
      issues.push(`建议「${advice.title}」存在过于笼统的步骤`);
    }

    // 检查标题是否为空
    if (!advice.title || advice.title.trim().length === 0) {
      issues.push('存在标题为空的建议');
    }

    // 检查描述是否过短
    if (!advice.description || advice.description.length < 10) {
      issues.push(`建议「${advice.title}」描述过于简短`);
    }
  }

  return issues;
}

/**
 * 检查溯源信息完整性
 */
function checkSources(sources: SourceTrace[]): string[] {
  const issues: string[] = [];

  for (const source of sources) {
    if (!source.verified) {
      issues.push(`溯源《${source.book}·${source.chapter}》尚未核实`);
    }

    if (!source.originalText || source.originalText.length === 0) {
      issues.push(`溯源《${source.book}·${source.chapter}》缺少原文`);
    }
  }

  return issues;
}

/**
 * 生成改进建议
 */
function generateSuggestions(
  advices: ApplicationAdvice[],
  sources: SourceTrace[],
  issues: string[],
): string[] {
  const suggestions: string[] = [];

  // 如果建议数量偏少
  if (advices.length < 2) {
    suggestions.push('建议增加更多维度的应用建议，丰富用户选择');
  }

  // 如果建议数量偏多
  if (advices.length > 6) {
    suggestions.push('建议精简至3-5条核心建议，避免信息过载');
  }

  // 如果有溯源未核实
  const unverifiedCount = sources.filter((s) => !s.verified).length;
  if (unverifiedCount > 0) {
    suggestions.push(`有${unverifiedCount}条溯源未核实，建议人工校对后再展示`);
  }

  // 如果有安全问题
  const safetyIssues = issues.filter((i) => i.includes('敏感词'));
  if (safetyIssues.length > 0) {
    suggestions.push('检测到潜在安全风险，建议人工复核后再发布');
  }

  // 通用建议
  if (issues.length === 0) {
    suggestions.push('内容质量良好，可以正常展示');
  }

  return suggestions;
}

/** 模拟异步延迟 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 运行审校 Agent
 * 质量把关，安全检查
 */
export async function runReviewer(
  advices: ApplicationAdvice[],
  sources: SourceTrace[],
): Promise<ReviewerOutput> {
  const startTime = Date.now();

  // 构建 prompt（用于记录和后续 LLM 接入）
  const prompt = buildReviewerPrompt(advices, sources);

  // MVP 本地逻辑：规则检查
  // 后续可替换为：const result = await callLLMForJSON({ prompt, model: 'doubao' })
  await delay(80 + Math.random() * 50);

  // 执行各项检查
  const safetyIssues = checkSafety(advices);
  const qualityIssues = checkAdviceQuality(advices);
  const sourceIssues = checkSources(sources);
  const allIssues = [...safetyIssues, ...qualityIssues, ...sourceIssues];

  // 生成改进建议
  const suggestions = generateSuggestions(advices, sources, allIssues);

  // 安全检查通过 = 无安全敏感词
  const safetyCheck = safetyIssues.length === 0;

  // 总体通过 = 无严重问题（安全问题视为严重，质量问题视为警告）
  const passed = safetyCheck && qualityIssues.filter((i) => i.includes('缺少') || i.includes('为空')).length === 0;

  const result: ReviewResult = {
    passed,
    issues: allIssues,
    suggestions,
    safetyCheck,
  };

  const endTime = Date.now();
  const step: AgentStep = {
    agent: 'reviewer',
    agentName: '审校Agent',
    status: 'completed',
    input: `${advices.length}条建议，${sources.length}条溯源`,
    output: passed ? '审校通过' : `审校发现${allIssues.length}个问题`,
    startTime,
    endTime,
    detail: `安全检查:${safetyCheck ? '通过' : '未通过'}\n问题:${allIssues.length > 0 ? allIssues.join('；') : '无'}\n建议:${suggestions.join('；')}`,
  };

  return { result, step };
}
