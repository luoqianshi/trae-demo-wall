// ====== 核心类型定义 ======

/** 场景类型 */
export type SceneType = 'health' | 'social' | 'parenting' | 'career' | 'season' | 'wisdom';

/** 古籍条目 */
export interface ClassicPassage {
  id: string;
  book: string;           // 书名，如"论语"
  chapter: string;        // 篇章，如"学而第一"
  originalText: string;   // 古文原文
  translation: string;    // 白话译文
  themes: string[];        // 主题标签
  wisdom: string;         // 智慧提炼（一句话）
  era: string;            // 时代，如"春秋"
}

/** Agent类型 */
export type AgentType = 'orchestrator' | 'retriever' | 'interpreter' | 'applier' | 'sourcer' | 'reviewer';

/** Agent执行状态 */
export type AgentStatus = 'idle' | 'running' | 'completed' | 'error';

/** Agent执行步骤记录 */
export interface AgentStep {
  agent: AgentType;
  agentName: string;       // 中文名
  status: AgentStatus;
  input?: string;          // 输入摘要
  output?: string;         // 输出摘要
  startTime?: number;
  endTime?: number;
  detail?: string;         // 详细信息
}

/** 检索结果 */
export interface RetrievalResult {
  passage: ClassicPassage;
  score: number;           // 相关度评分
  reason: string;          // 检索理由
}

/** 释义结果 */
export interface InterpretationResult {
  passageId: string;
  modernTranslation: string;    // 现代白话翻译
  annotation: string;           // 注解说明
  coreWisdom: string;           // 核心智慧提炼
}

/** 应用建议 */
export interface ApplicationAdvice {
  title: string;            // 建议标题
  description: string;      // 建议描述
  actionSteps: string[];    // 可执行步骤
  relatedWisdom: string;    // 对应的古文智慧
}

/** 溯源信息 */
export interface SourceTrace {
  book: string;
  chapter: string;
  originalText: string;
  translation: string;
  era: string;
  verified: boolean;        // 是否已核实
}

/** 审校结果 */
export interface ReviewResult {
  passed: boolean;
  issues: string[];         // 发现的问题
  suggestions: string[];    // 修改建议
  safetyCheck: boolean;     // 安全检查通过
}

/** 问答最终结果 */
export interface AskResult {
  query: string;                       // 用户问题
  scene: SceneType;                    // 场景类型
  retrievedPassages: RetrievalResult[];// 检索到的古籍
  interpretations: InterpretationResult[]; // 释义结果
  advices: ApplicationAdvice[];        // 应用建议
  sources: SourceTrace[];              // 溯源信息
  review: ReviewResult;                // 审校结果
  agentSteps: AgentStep[];             // Agent执行过程
  summary: string;                     // 总结
  timestamp: number;                   // 时间戳
}

/** 问答请求 */
export interface AskRequest {
  query: string;
  scene?: SceneType;
}

/** 场景配置 */
export interface SceneConfig {
  type: SceneType;
  name: string;           // 场景名称
  icon: string;           // 图标emoji
  description: string;    // 场景描述
  examples: string[];     // 示例问题
  color: string;          // 主题色
}

/** 缓存条目 */
export interface CacheEntry {
  key: string;
  result: AskResult;
  createdAt: number;
}

/** 智慧卡片数据 */
export interface WisdomCardData {
  query: string;
  originalText: string;
  translation: string;
  book: string;
  chapter: string;
  advice: string;
  era: string;
}
