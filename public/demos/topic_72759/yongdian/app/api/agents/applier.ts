// ====== 应用 Agent（核心差异化模块）======
// 把古籍智慧转化为现代可执行建议
// 这是「用典」与「识典」「读典籍」的根本区别——让古籍为人所用
import type { AgentStep, InterpretationResult, ApplicationAdvice, ClassicPassage } from '@/lib/types';
import { classics } from '@/data/classics';
import { buildApplierPrompt } from '@/app/api/lib/prompt-templates';
import { matchAdviceTemplates } from '@/app/api/lib/advice-templates';

/** 应用 Agent 输出 */
export interface ApplierOutput {
  results: ApplicationAdvice[];
  step: AgentStep;
}

/** 模拟异步延迟 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 根据 passageId 从知识库查找古籍条目
 */
function findPassage(passageId: string): ClassicPassage | undefined {
  return classics.find((c) => c.id === passageId);
}

/**
 * 运行应用 Agent（核心差异化模块）
 * 把古籍智慧转化为现代可执行建议
 *
 * MVP 阶段使用模板匹配生成建议，后续接入 GLM 后可替换为 LLM 生成：
 * 1. 从释义结果中获取核心智慧和白话翻译
 * 2. 查找原始古籍条目获取主题标签
 * 3. 通过关键词+主题匹配建议模板
 * 4. 将模板转化为结构化应用建议
 */
export async function runApplier(
  interpretations: InterpretationResult[],
  query: string,
): Promise<ApplierOutput> {
  const startTime = Date.now();
  const results: ApplicationAdvice[] = [];

  for (const interp of interpretations) {
    // 查找原始古籍条目以获取主题标签
    const passage = findPassage(interp.passageId);
    const themes = passage?.themes || [];

    // 匹配建议模板
    const templates = matchAdviceTemplates(
      interp.coreWisdom,
      interp.modernTranslation,
      themes,
    );

    // 构建 prompt（用于记录和后续 LLM 接入）
    const prompt = buildApplierPrompt(
      interp.coreWisdom,
      interp.modernTranslation,
      query,
    );

    // MVP 本地逻辑：从模板生成建议
    // 后续可替换为：const result = await callLLMForJSON({ prompt, model: 'glm' })
    await delay(80 + Math.random() * 60);

    for (const template of templates) {
      results.push({
        title: template.title,
        description: template.description,
        actionSteps: template.actionSteps,
        relatedWisdom: interp.coreWisdom,
      });
    }
  }

  // 去重：相同标题的建议只保留一个
  const seen = new Set<string>();
  const unique = results.filter((r) => {
    if (seen.has(r.title)) return false;
    seen.add(r.title);
    return true;
  });

  const endTime = Date.now();
  const step: AgentStep = {
    agent: 'applier',
    agentName: '应用Agent',
    status: 'completed',
    input: `${interpretations.length}条释义，查询:"${query.slice(0, 30)}"`,
    output: `生成${unique.length}条现代应用建议`,
    startTime,
    endTime,
    detail: unique.map((a) => `【${a.title}】${a.actionSteps.length}个步骤`).join('\n'),
  };

  return { results: unique, step };
}
