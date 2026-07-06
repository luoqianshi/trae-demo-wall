// ====== 检索 Agent ======
// 从古籍知识库中检索与用户问题相关的段落
// MVP 阶段使用关键词匹配 + 主题标签匹配，后续可替换为向量检索
import type { AgentStep, RetrievalResult, ClassicPassage } from '@/lib/types';
import { classics } from '@/data/classics';
import { buildRetrieverPrompt } from '@/app/api/lib/prompt-templates';

/** 检索 Agent 输出 */
export interface RetrieverOutput {
  results: RetrievalResult[];
  step: AgentStep;
}

/** 场景对应的主题标签权重 */
const THEME_PRIORITY: Record<string, string[]> = {
  health: ['养生', '健康', '心境', '饮食', '作息'],
  social: ['处世', '人际', '和谐', '修身', '交友'],
  parenting: ['育儿', '教育', '教子', '学习'],
  career: ['事业', '谋略', '决策', '修身', '学习'],
  season: ['节气', '时令', '养生', '饮食'],
  wisdom: ['智慧', '心境', '修身', '决策', '处世'],
};

/**
 * 计算单条古籍与查询的相关度评分
 * 评分维度：关键词匹配 + 主题匹配 + 智慧文本匹配
 */
function scorePassage(
  passage: ClassicPassage,
  keywords: string[],
  priorityThemes: string[],
): { score: number; reason: string } {
  let score = 0;
  const matchReasons: string[] = [];

  // 1. 关键词匹配（权重最高）
  const fullText = `${passage.originalText} ${passage.translation} ${passage.wisdom} ${passage.themes.join(' ')}`;
  for (const kw of keywords) {
    if (fullText.includes(kw)) {
      score += 0.15;
      matchReasons.push(`关键词「${kw}」命中`);
    }
  }

  // 2. 主题标签匹配
  for (const theme of passage.themes) {
    if (priorityThemes.includes(theme)) {
      score += 0.12;
      matchReasons.push(`主题「${theme}」匹配`);
    }
  }

  // 3. 智慧文本模糊匹配（检查是否有语义重叠）
  for (const kw of keywords) {
    if (passage.wisdom.includes(kw)) {
      score += 0.08;
    }
  }

  // 4. 书籍加权（经典典籍略加权重）
  const importantBooks = ['论语', '黄帝内经', '道德经', '中庸'];
  if (importantBooks.includes(passage.book)) {
    score += 0.03;
  }

  // 限制分数范围 0-1
  score = Math.min(score, 1);

  const reason = matchReasons.length > 0
    ? matchReasons.slice(0, 3).join('；')
    : '一般相关';

  return { score, reason };
}

/**
 * 从检索方向中解析场景类型
 */
function extractSceneFromDirection(direction: string): string {
  for (const [scene, themes] of Object.entries(THEME_PRIORITY)) {
    for (const theme of themes) {
      if (direction.includes(theme)) return scene;
    }
  }
  return 'wisdom';
}

/**
 * 从检索方向中提取关键词
 */
function extractKeywordsFromDirection(direction: string): string[] {
  // 提取「」中的内容
  const matches = direction.match(/[\u300c\u300d]([^[\u300c\u300d]+)[\u300c\u300d]/g);
  const keywords: string[] = [];
  if (matches) {
    for (const m of matches) {
      keywords.push(m.replace(/[\u300c\u300d]/g, ''));
    }
  }
  // 也尝试从方向文本中提取已知主题词
  for (const themes of Object.values(THEME_PRIORITY)) {
    for (const theme of themes) {
      if (direction.includes(theme) && !keywords.includes(theme)) {
        keywords.push(theme);
      }
    }
  }
  return keywords;
}

/** 模拟异步延迟 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 返回结果数量上限 */
const MAX_RESULTS = 5;
/** 最低相关度阈值 */
const MIN_SCORE = 0.1;

/**
 * 运行检索 Agent
 * 从古籍知识库中检索相关段落，返回排序后的检索结果
 */
export async function runRetriever(
  query: string,
  direction: string,
): Promise<RetrieverOutput> {
  const startTime = Date.now();

  // 解析检索方向
  const scene = extractSceneFromDirection(direction);
  const priorityThemes = THEME_PRIORITY[scene] || THEME_PRIORITY.wisdom;

  // 提取关键词：从查询 + 方向
  const directionKeywords = extractKeywordsFromDirection(direction);
  const queryKeywords = query.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
  const allKeywords = [...new Set([...directionKeywords, ...queryKeywords])];

  // 构建 prompt（用于记录和后续 LLM 接入）
  const prompt = buildRetrieverPrompt(query, direction);

  // 对每条古籍评分
  const scored = classics.map((passage) => {
    const { score, reason } = scorePassage(passage, allKeywords, priorityThemes);
    return { passage, score, reason };
  });

  // 过滤并排序
  const filtered = scored
    .filter((item) => item.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);

  // 如果结果不足，补充主题最相关的
  if (filtered.length < 3) {
    const existingIds = new Set(filtered.map((f) => f.passage.id));
    const fallback = classics
      .filter((c) => !existingIds.has(c.id))
      .map((passage) => {
        const { score, reason } = scorePassage(passage, priorityThemes, priorityThemes);
        return { passage, score, reason };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3 - filtered.length);
    filtered.push(...fallback);
  }

  const results: RetrievalResult[] = filtered.map((item) => ({
    passage: item.passage,
    score: Math.round(item.score * 100) / 100,
    reason: item.reason,
  }));

  // MVP 本地逻辑，后续可替换为：
  // const llmResult = await callLLMForJSON<{ results: ... }>({ prompt, model: 'glm' })
  await delay(150 + Math.random() * 100);

  const endTime = Date.now();
  const step: AgentStep = {
    agent: 'retriever',
    agentName: '检索Agent',
    status: 'completed',
    input: `查询:"${query.slice(0, 30)}" 方向:${direction.slice(0, 30)}`,
    output: `检索到${results.length}条古籍，最高分${results[0]?.score || 0}`,
    startTime,
    endTime,
    detail: `关键词:${allKeywords.slice(0, 5).join('、')}\n优先主题:${priorityThemes.join('、')}\n\n[Prompt]\n${prompt.slice(0, 200)}...`,
  };

  return { results, step };
}
