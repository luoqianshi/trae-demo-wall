// ====== 释义 Agent ======
// 对每条古文进行现代白话翻译和智慧提炼
// MVP 阶段使用知识库中已有的译文+注解规则，后续接入 Doubao 长文本模型
import type { AgentStep, ClassicPassage, InterpretationResult } from '@/lib/types';
import { buildInterpreterPrompt } from '@/app/api/lib/prompt-templates';

/** 释义 Agent 输出 */
export interface InterpreterOutput {
  results: InterpretationResult[];
  step: AgentStep;
}

/** 书籍背景注解 */
const BOOK_CONTEXTS: Record<string, string> = {
  '论语': '孔子及其弟子言行录，儒家核心经典，成书于春秋战国时期，体现了儒家修身齐家治国平天下的思想体系。',
  '黄帝内经': '中医理论奠基之作，以黄帝与岐伯问答形式论述医学理论，强调天人合一、阴阳平衡的养生哲学。',
  '颜氏家训': '北齐颜之推所著家训，被誉为「家训之祖」，涵盖教子、勉学、处世等篇章，注重家庭教育与个人修养。',
  '中庸': '儒家经典，原为《礼记》篇章，后独立成书，核心思想是「执两用中」，强调不偏不倚、恰到好处的处世智慧。',
  '菜根谭': '明代洪应明所著，融儒释道三家思想，以对联箴言形式阐述处世修身之道，文辞隽永、意境深远。',
  '道德经': '春秋老子所著，道家根本经典，以「道」为核心，主张自然无为、柔弱胜刚强，影响深远。',
  '孙子兵法': '春秋孙武所著，世界最早军事理论著作，其战略思想超越军事领域，广泛应用于现代商业与管理。',
  '孟子': '战国孟子及其弟子所著，儒家重要经典，主张性善论、仁政，强调「养浩然之气」的人格修养。',
  '本草纲目': '明代李时珍所著药学巨著，系统总结药物知识，也包含丰富的食疗养生思想。',
};

/**
 * 生成注解说明
 * 结合书籍背景、篇章信息、时代背景
 */
function generateAnnotation(passage: ClassicPassage): string {
  const parts: string[] = [];

  // 书籍背景
  const bookContext = BOOK_CONTEXTS[passage.book];
  if (bookContext) {
    parts.push(bookContext);
  }

  // 篇章信息
  parts.push(`本段出自《${passage.book}·${passage.chapter}》，成书于${passage.era}时期。`);

  // 主题标签
  if (passage.themes.length > 0) {
    parts.push(`涉及主题：${passage.themes.join('、')}。`);
  }

  return parts.join(' ');
}

/**
 * 增强核心智慧提炼
 * 在原有智慧基础上，结合查询语境进行增强
 */
function enhanceWisdom(passage: ClassicPassage, query: string): string {
  const baseWisdom = passage.wisdom;

  // 根据主题标签添加语境关联
  const themeEnhancements: Record<string, string> = {
    '养生': '于健康管理有所启发',
    '处世': '于人际交往有所启发',
    '育儿': '于教育子女有所启发',
    '事业': '于职业发展有所启发',
    '节气': '于顺时生活有所启发',
    '智慧': '于人生抉择有所启发',
    '心境': '于心性修养有所启发',
    '决策': '于决策思考有所启发',
  };

  const enhancements = passage.themes
    .map((t) => themeEnhancements[t])
    .filter(Boolean);

  if (enhancements.length > 0) {
    return `${baseWisdom}，${enhancements[0]}`;
  }

  return baseWisdom;
}

/**
 * 增强翻译（在现有译文基础上，增加语境理解）
 */
function enhanceTranslation(passage: ClassicPassage): string {
  // MVP 阶段直接使用知识库中已校对的译文
  // 后续接入 Doubao 后可进行更细致的语境翻译
  return passage.translation;
}

/** 模拟异步延迟 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 运行释义 Agent
 * 对每条古文进行现代白话翻译和智慧提炼
 */
export async function runInterpreter(
  passages: ClassicPassage[],
  query: string,
): Promise<InterpreterOutput> {
  const startTime = Date.now();

  const results: InterpretationResult[] = [];

  for (const passage of passages) {
    // 构建 prompt（用于记录和后续 LLM 接入）
    const prompt = buildInterpreterPrompt(passage, query);

    // MVP 本地逻辑：使用知识库译文 + 规则生成注解
    // 后续可替换为：const result = await callLLMForJSON({ prompt, model: 'doubao' })
    await delay(50 + Math.random() * 50);

    results.push({
      passageId: passage.id,
      modernTranslation: enhanceTranslation(passage),
      annotation: generateAnnotation(passage),
      coreWisdom: enhanceWisdom(passage, query),
    });
  }

  const endTime = Date.now();
  const step: AgentStep = {
    agent: 'interpreter',
    agentName: '释义Agent',
    status: 'completed',
    input: `${passages.length}条古文，查询:"${query.slice(0, 30)}"`,
    output: `完成${results.length}条释义，涉及${new Set(passages.map((p) => p.book)).size}部典籍`,
    startTime,
    endTime,
    detail: results
      .map((r) => `【${r.passageId}】${r.coreWisdom}`)
      .join('\n'),
  };

  return { results, step };
}
