// ====== Agent 编排器 ======
// 编排6个Agent的执行顺序，收集所有AgentStep用于可视化
// 执行流程：调度 → 检索 → 释义 → 应用 → 溯源 → 审校
import type {
  AgentStep,
  AskResult,
  SceneType,
  RetrievalResult,
  InterpretationResult,
  ApplicationAdvice,
  SourceTrace,
  ReviewResult,
} from '@/lib/types';
import { runOrchestrator } from './orchestrator';
import { runRetriever } from './retriever';
import { runInterpreter } from './interpreter';
import { runApplier } from './applier';
import { runSourcer } from './sourcer';
import { runReviewer } from './reviewer';

/** 步骤回调类型（用于流式更新） */
export type StepCallback = (step: AgentStep) => void;

/**
 * 生成结果摘要
 */
function generateSummary(
  passages: RetrievalResult[],
  interpretations: InterpretationResult[],
  advices: ApplicationAdvice[],
  review: ReviewResult,
): string {
  const books = new Set(passages.map((p) => p.passage.book));
  const bookList = Array.from(books).join('、');
  const passageCount = passages.length;
  const adviceCount = advices.length;
  const status = review.passed ? '审校通过' : '审校有待改进';

  if (passageCount === 0) {
    return '未能从古籍库中检索到高度相关的内容，建议换个角度提问。';
  }

  return `已从《${bookList}》等${books.size}部典籍中检索到${passageCount}条相关智慧，` +
    `为您生成${adviceCount}条现代生活建议，${status}。` +
    `古智今用，愿典籍智慧助您解今之忧。`;
}

/**
 * 创建错误步骤
 */
function createErrorStep(agent: AgentStep['agent'], agentName: string, error: unknown): AgentStep {
  const now = Date.now();
  return {
    agent,
    agentName,
    status: 'error',
    input: '',
    output: `执行失败: ${error instanceof Error ? error.message : String(error)}`,
    startTime: now,
    endTime: now,
    detail: String(error),
  };
}

/**
 * 运行 Agent 流水线
 *
 * 编排6个Agent按序执行：
 * 1. 调度Agent → 理解意图，确定检索方向
 * 2. 检索Agent → 从古籍库检索相关段落
 * 3. 释义Agent → 古文翻译和智慧提炼
 * 4. 应用Agent → 古智今用，生成现代建议
 * 5. 溯源Agent → 核实出处
 * 6. 审校Agent → 质量把关
 *
 * @param query 用户问题
 * @param scene 可选场景类型
 * @param onStep 步骤回调，每完成一个Agent时触发（用于流式更新）
 * @returns 完整的问答结果
 */
export async function runAgentPipeline(
  query: string,
  scene?: SceneType,
  onStep?: StepCallback,
): Promise<AskResult> {
  const agentSteps: AgentStep[] = [];

  // ===== 1. 调度 Agent =====
  let orchestratorResult;
  try {
    orchestratorResult = await runOrchestrator(query, scene);
    agentSteps.push(orchestratorResult.step);
    onStep?.(orchestratorResult.step);
  } catch (error) {
    const step = createErrorStep('orchestrator', '调度Agent', error);
    agentSteps.push(step);
    onStep?.(step);
    throw error;
  }

  // ===== 2. 检索 Agent =====
  let retrieverResult;
  try {
    retrieverResult = await runRetriever(query, orchestratorResult.direction);
    agentSteps.push(retrieverResult.step);
    onStep?.(retrieverResult.step);
  } catch (error) {
    const step = createErrorStep('retriever', '检索Agent', error);
    agentSteps.push(step);
    onStep?.(step);
    throw error;
  }

  const passages = retrieverResult.results.map((r) => r.passage);

  // ===== 3. 释义 Agent =====
  let interpreterResult;
  try {
    interpreterResult = await runInterpreter(passages, query);
    agentSteps.push(interpreterResult.step);
    onStep?.(interpreterResult.step);
  } catch (error) {
    const step = createErrorStep('interpreter', '释义Agent', error);
    agentSteps.push(step);
    onStep?.(step);
    interpreterResult = { results: [], step };
  }

  // ===== 4. 应用 Agent（核心差异化模块）=====
  let applierResult;
  try {
    applierResult = await runApplier(interpreterResult.results, query);
    agentSteps.push(applierResult.step);
    onStep?.(applierResult.step);
  } catch (error) {
    const step = createErrorStep('applier', '应用Agent', error);
    agentSteps.push(step);
    onStep?.(step);
    applierResult = { results: [], step };
  }

  // ===== 5. 溯源 Agent =====
  let sourcerResult;
  try {
    sourcerResult = await runSourcer(passages);
    agentSteps.push(sourcerResult.step);
    onStep?.(sourcerResult.step);
  } catch (error) {
    const step = createErrorStep('sourcer', '溯源Agent', error);
    agentSteps.push(step);
    onStep?.(step);
    sourcerResult = { results: [], step };
  }

  // ===== 6. 审校 Agent =====
  let reviewerResult;
  try {
    reviewerResult = await runReviewer(applierResult.results, sourcerResult.results);
    agentSteps.push(reviewerResult.step);
    onStep?.(reviewerResult.step);
  } catch (error) {
    const step = createErrorStep('reviewer', '审校Agent', error);
    agentSteps.push(step);
    onStep?.(step);
    reviewerResult = {
      result: { passed: false, issues: ['审校Agent执行失败'], suggestions: [], safetyCheck: false },
      step,
    };
  }

  // ===== 生成摘要 =====
  const summary = generateSummary(
    retrieverResult.results,
    interpreterResult.results,
    applierResult.results,
    reviewerResult.result,
  );

  // ===== 组装最终结果 =====
  const result: AskResult = {
    query,
    scene: orchestratorResult.scene,
    retrievedPassages: retrieverResult.results,
    interpretations: interpreterResult.results,
    advices: applierResult.results,
    sources: sourcerResult.results,
    review: reviewerResult.result,
    agentSteps,
    summary,
    timestamp: Date.now(),
  };

  return result;
}
