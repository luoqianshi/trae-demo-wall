// ====== 溯源 Agent ======
// 核实每条古文的出处，生成规范引用
import type { AgentStep, ClassicPassage, SourceTrace } from '@/lib/types';
import { buildSourcerPrompt } from '@/app/api/lib/prompt-templates';

/** 溯源 Agent 输出 */
export interface SourcerOutput {
  results: SourceTrace[];
  step: AgentStep;
}

/**
 * 生成规范引用格式
 * 格式：〔时代〕书名·篇章
 */
function generateCitation(passage: ClassicPassage): string {
  return `〔${passage.era}〕${passage.book}·${passage.chapter}`;
}

/**
 * 核实古籍条目
 * MVP 阶段：知识库中的条目均为人工校对，直接标记为已核实
 * 后续可接入 CTEXT API 进行原文比对验证
 */
function verifyPassage(passage: ClassicPassage): boolean {
  // MVP 阶段：检查必要字段是否完整
  const hasRequiredFields =
    passage.book.length > 0 &&
    passage.chapter.length > 0 &&
    passage.originalText.length > 0 &&
    passage.era.length > 0;

  // TODO: 后续接入 CTEXT API 进行原文比对
  // const ctextResult = await fetchFromCTEXT(passage.book, passage.chapter);
  // return ctextResult.text === passage.originalText;

  return hasRequiredFields;
}

/**
 * 为单条古籍生成溯源信息
 */
function createSourceTrace(passage: ClassicPassage): SourceTrace {
  const verified = verifyPassage(passage);
  const citation = generateCitation(passage);

  // 调试日志
  if (!verified) {
    console.warn(`[Sourcer] 古籍条目核实失败: ${passage.id}`);
  }

  return {
    book: passage.book,
    chapter: passage.chapter,
    originalText: passage.originalText,
    translation: passage.translation,
    era: passage.era,
    verified,
  };
}

/** 模拟异步延迟 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 运行溯源 Agent
 * 核实每条古文的出处，生成规范引用
 */
export async function runSourcer(
  passages: ClassicPassage[],
): Promise<SourcerOutput> {
  const startTime = Date.now();

  const results: SourceTrace[] = [];

  for (const passage of passages) {
    // 构建 prompt（用于记录和后续 LLM 接入）
    const prompt = buildSourcerPrompt(passage);

    // MVP 本地逻辑：基于知识库校对状态核实
    // 后续可替换为：const result = await callLLMForJSON({ prompt, model: 'glm' })
    await delay(30 + Math.random() * 30);

    results.push(createSourceTrace(passage));
  }

  const verifiedCount = results.filter((r) => r.verified).length;
  const endTime = Date.now();
  const step: AgentStep = {
    agent: 'sourcer',
    agentName: '溯源Agent',
    status: 'completed',
    input: `${passages.length}条古籍待核实`,
    output: `核实完成，${verifiedCount}/${results.length}条已确认`,
    startTime,
    endTime,
    detail: results
      .map((r) => `〔${r.era}〕${r.book}·${r.chapter} ${r.verified ? '✓' : '✗'}`)
      .join('\n'),
  };

  return { results, step };
}
