// ====== 调度 Agent ======
// 理解用户意图，确定检索方向，提取关键词
import type { AgentStep, SceneType } from '@/lib/types';
import { buildOrchestratorPrompt } from '@/app/api/lib/prompt-templates';

/** 场景关键词映射 */
const SCENE_KEYWORDS: Record<SceneType, string[]> = {
  health: ['失眠', '焦虑', '身体', '养生', '健康', '作息', '疲劳', '睡眠', '压力', '亚健康', '生病', '调理'],
  social: ['人际', '朋友', '冲突', '沟通', '处世', '交往', '矛盾', '社交', '关系', '同事', '邻居'],
  parenting: ['孩子', '教育', '育儿', '叛逆', '学习', '教子', '亲子', '父母', '家长', '管教'],
  career: ['工作', '职场', '事业', '同事', '领导', '升职', '跳槽', '创业', '项目', '团队', '竞争'],
  season: ['节气', '时令', '春', '夏', '秋', '冬', '立春', '冬至', '饮食', '当令', '季节'],
  wisdom: ['选择', '困惑', '人生', '意义', '烦恼', '决策', '迷茫', '境界', '成长', '修身'],
};

/** 场景对应检索主题 */
const SCENE_THEMES: Record<SceneType, string[]> = {
  health: ['养生', '健康', '心境', '饮食', '作息'],
  social: ['处世', '人际', '和谐', '修身', '交友'],
  parenting: ['育儿', '教育', '教子', '学习'],
  career: ['事业', '谋略', '决策', '修身', '学习'],
  season: ['节气', '时令', '养生', '饮食'],
  wisdom: ['智慧', '心境', '修身', '决策', '处世'],
};

/** 场景中文名 */
const SCENE_NAMES: Record<SceneType, string> = {
  health: '养生',
  social: '处世',
  parenting: '育儿',
  career: '职场',
  season: '节气',
  wisdom: '解惑',
};

/** 调度 Agent 输出 */
export interface OrchestratorOutput {
  scene: SceneType;
  intent: string;
  direction: string;
  keywords: string[];
  step: AgentStep;
}

/** 停用词，不作为关键词 */
const STOP_WORDS = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '怎么', '什么', '为什么', '如何', '能', '可以', '吗', '呢', '吧',
]);

/**
 * 检测用户问题所属场景
 */
function detectScene(query: string): SceneType {
  let bestScene: SceneType = 'wisdom';
  let maxScore = 0;

  for (const [scene, keywords] of Object.entries(SCENE_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (query.includes(kw)) score += 1;
    }
    if (score > maxScore) {
      maxScore = score;
      bestScene = scene as SceneType;
    }
  }

  return bestScene;
}

/**
 * 从用户问题中提取关键词
 */
function extractKeywords(query: string): string[] {
  const keywords = new Set<string>();

  // 匹配所有场景关键词
  for (const sceneKeywords of Object.values(SCENE_KEYWORDS)) {
    for (const kw of sceneKeywords) {
      if (query.includes(kw)) keywords.add(kw);
    }
  }

  // 提取2-4字的中文词组（简单分词）
  const chineseWords = query.match(/[\u4e00-\u9fa5]{2,4}/g);
  if (chineseWords) {
    for (const word of chineseWords) {
      if (!STOP_WORDS.has(word) && word.length >= 2) {
        keywords.add(word);
      }
    }
  }

  // 最多返回8个关键词
  return Array.from(keywords).slice(0, 8);
}

/**
 * 构建检索方向描述
 */
function buildDirection(scene: SceneType, keywords: string[]): string {
  const themes = SCENE_THEMES[scene];
  const themeStr = themes.join('、');
  const kwStr = keywords.length > 0 ? keywords.slice(0, 3).join('、') : '通用';
  return `围绕「${SCENE_NAMES[scene]}」场景，优先检索主题：${themeStr}；关注关键词：${kwStr}`;
}

/**
 * 构建意图描述
 */
function buildIntent(query: string, scene: SceneType): string {
  const sceneName = SCENE_NAMES[scene];
  return `用户寻求${sceneName}方面的古籍智慧指导，核心诉求：「${query.slice(0, 40)}」`;
}

/** 模拟异步延迟 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 运行调度 Agent
 * 分析用户问题，返回检索方向和意图理解结果
 */
export async function runOrchestrator(
  query: string,
  scene?: SceneType,
): Promise<OrchestratorOutput> {
  const startTime = Date.now();

  // 检测场景（若未指定）
  const detectedScene = scene ?? detectScene(query);

  // 提取关键词
  const keywords = extractKeywords(query);

  // 确定检索方向
  const direction = buildDirection(detectedScene, keywords);

  // 构建意图描述
  const intent = buildIntent(query, detectedScene);

  // 构建 prompt（用于记录和后续 LLM 接入）
  const prompt = buildOrchestratorPrompt(query, SCENE_NAMES[detectedScene]);

  // MVP 阶段使用本地逻辑，后续可替换为：
  // const result = await callLLMForJSON<OrchestratorOutput>(...)
  await delay(100 + Math.random() * 50);

  const endTime = Date.now();
  const step: AgentStep = {
    agent: 'orchestrator',
    agentName: '调度Agent',
    status: 'completed',
    input: query,
    output: `场景:${SCENE_NAMES[detectedScene]}，关键词:${keywords.slice(0, 3).join('、')}`,
    startTime,
    endTime,
    detail: `意图:${intent}\n方向:${direction}\n\n[Prompt]\n${prompt.slice(0, 200)}...`,
  };

  return { scene: detectedScene, intent, direction, keywords, step };
}
