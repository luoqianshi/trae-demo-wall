import { create } from 'zustand';
import type {
  UserConfig,
  ProviderId,
  ProviderConfig,
  ProjectSession,
  ProjectStatus,
  Expert,
  TaskCard,
  TaskActivity,
  ResearchResult,
  AnalysisResult,
  GroupMessage,
  ConclusionRevision,
  ReportVersion,
  Report,
  PRD,
  ScheduleLogEntry,
  ScheduleResult,
  ToolCall,
  ToolResult,
  MemberMemory,
  MemberMessage,
} from '../lib/types';
import {
  getSchedulePrompt,
  parseScheduleResult,
  type ScheduleContext,
} from '../lib/scheduler';
import {
  loadConfig, saveConfig, loadSessions, addSession, updateSession,
  loadPersonaCard, savePersonaCard, clearPersonaCache, createDefaultUserConfig,
} from '../lib/storage';
import { callLLM, callLLMStream, callLLMMessages, callLLMStreamMessages, hasActiveProviderConfig, type ChatMessage } from '../lib/llm';
import { tavilySearch, type TavilySearchResult } from '../lib/tavily';
import { log } from '../lib/logger';
import {
  getDomainIdentificationPrompt,
  getExpertGenerationPrompt,
  getPersonaDistillationPrompt,
  getPlanningPrompt,
  getResearchQueriesPrompt,
  getResearchSummaryPrompt,
  getAnalysisPrompt,
  getConflictDebatePrompt,
  getReportCorePrompt,
  getReportPRDPrompt,
  parseDomainResult,
  parseExpertResult,
  parsePlanningResult,
  parseResearchQueriesResult,
  parseResearchSummaryResult,
  parseAnalysisResult,
  parseConflictDebateResult,
  parseReportCoreResult,
  parseReportPRDResult,
  getExplainPrompt,
  getReinvestigateQueriesPrompt,
  getReinvestigateAnalysisPrompt,
  getRevisionMessagePrompt,
  getPeerReviewPrompt,
  parseReinvestigateQueriesResult,
  parseReinvestigateAnalysisResult,
  getColleagueReactionPrompt,
  getDecisionCardPrompt,
  parseDecisionCardResult,
} from '../lib/prompts';

// ========== Store 类型 ==========

interface ProjectState {
  config: UserConfig;
  configLoaded: boolean;

  currentSession: ProjectSession | null;
  status: ProjectStatus;
  error: string;
  currentExpertName: string | null;
  currentDistillingExpert: string | null;
  distillProgress: { current: number; total: number } | null;
  currentTaskTitle: string | null;
  typing: { expertId: string; hint: string } | null;  // 打字指示器：某成员正在思考/搜索/回复
  scheduling: boolean;  // 调度模型互斥锁：true 表示 scheduleLoop 正在跑

  sessions: ProjectSession[];

  loadConfigFromStorage: () => void;
  updateProviderConfig: (providerId: ProviderId, patch: Partial<ProviderConfig>) => void;
  switchProvider: (providerId: ProviderId) => void;
  updateTavilyKey: (key: string) => void;
  loadSessionsFromStorage: () => void;

  // 调度模型统一入口：老板任何输入（含点按钮=预填一句话）都走这里
  schedule: (content: string, quotedContext?: string, mentionTargetId?: string) => void;

  // 决策卡答题：把答案写进消息的 decisionData.answered 并持久化，再走调度
  answerDecision: (messageId: string, answer: string) => void;

  startProject: (idea: string) => Promise<void>;
  restartProject: (parentId: string) => Promise<void>;
  retryStep: () => Promise<void>;
  resumeSession: (sessionId: string) => void;
  resetProject: () => void;
}

type StoreSet = (partial: Partial<ProjectState> | ((state: ProjectState) => Partial<ProjectState>)) => void;
type StoreGet = () => ProjectState;

// 全局 generation 计数器：每次 startProject/resetProject/resumeSession/restartProject 时递增，
// 所有异步流程在关键 await 后校验自己的 generation 是否仍有效，无效直接终止——防重入与幽灵异步
let sessionGeneration = 0;

// ========== 辅助函数 ==========

// 统一的 session 修改入口：用函数式 updater 合并，避免过期快照覆盖并行写入
function patchSession(set: StoreSet, get: StoreGet, updater: (s: ProjectSession) => ProjectSession): void {
  let updated: ProjectSession | null = null;
  set(state => {
    if (!state.currentSession) return {};
    updated = updater(state.currentSession);
    return { currentSession: updated };
  });
  if (updated) updateSession(updated);
}

// 仅更新内存不落盘（高频流式更新用，由调用方在流结束后调 updateSession 落盘一次）
function patchSessionMemory(set: StoreSet, get: StoreGet, updater: (s: ProjectSession) => ProjectSession): void {
  set(state => {
    if (!state.currentSession) return {};
    return { currentSession: updater(state.currentSession) };
  });
}

function updateTask(set: StoreSet, get: StoreGet, taskId: string, patch: Partial<TaskCard>): void {
  patchSession(set, get, s => ({
    ...s,
    tasks: s.tasks.map(t => (t.id === taskId ? { ...t, ...patch } : t)),
  }));
}

function addGroupMessage(set: StoreSet, get: StoreGet, msg: GroupMessage): void {
  patchSession(set, get, s => ({
    ...s,
    groupMessages: [...s.groupMessages, msg],
  }));
}

// 系统消息：authorId='system'，UI 层渲染为居中灰色小字
function addSystemMessage(set: StoreSet, get: StoreGet, content: string): void {
  addGroupMessage(set, get, {
    id: `msg-system-${Date.now()}-${Math.random()}`,
    authorId: 'system',
    content,
    createdAt: new Date(),
  });
}

// 打字指示器：设置/清除
function setTyping(set: StoreSet, expertId: string, hint: string): void {
  set({ typing: { expertId, hint } });
}
function clearTyping(set: StoreSet): void {
  set({ typing: null });
}

// 流式更新群消息 content（只 set 内存，不落盘——流结束后由调用方 updateSession 落盘一次）
// 用函数式 updater 合并，避免过期快照覆盖并行写入的任务状态
function patchMessageContent(set: StoreSet, get: StoreGet, msgId: string, content: string): void {
  patchSessionMemory(set, get, s => ({
    ...s,
    groupMessages: s.groupMessages.map(m =>
      m.id === msgId ? { ...m, content } : m
    ),
  }));
}

// 任务活动时间线：push 一条 running 的 activity，返回 id 供后续 finishActivity 用
function pushActivity(
  set: StoreSet,
  get: StoreGet,
  taskId: string,
  activity: Omit<TaskActivity, 'id' | 'at'>
): string {
  const id = `act-${taskId}-${Date.now()}-${Math.random()}`;
  const full: TaskActivity = { ...activity, id, at: new Date() };
  patchSession(set, get, s => ({
    ...s,
    tasks: s.tasks.map(t =>
      t.id === taskId
        ? { ...t, activities: [...(t.activities || []), full] }
        : t
    ),
  }));
  return id;
}

// 把 running 的 activity 标记为 done，可补 detail
function finishActivity(
  set: StoreSet,
  get: StoreGet,
  taskId: string,
  activityId: string,
  detail?: string
): void {
  patchSession(set, get, s => ({
    ...s,
    tasks: s.tasks.map(t =>
      t.id === taskId
        ? {
            ...t,
            activities: (t.activities || []).map(a =>
              a.id === activityId
                ? { ...a, status: 'done' as const, ...(detail !== undefined ? { detail } : {}) }
                : a
            ),
          }
        : t
    ),
  }));
}

// 同步 status 到 session.stage 并落盘（断点恢复用）
function setStage(set: StoreSet, get: StoreGet, stage: ProjectStatus): void {
  log('stage', `setStage: ${stage}`);
  set({ status: stage });
  patchSession(set, get, s => ({ ...s, stage }));
}

// ========== per-member 记忆管理（成员 agent 化核心） ==========

// 取某成员的记忆；不存在则返回空记忆
function getMemberMemory(session: ProjectSession, expertId: string): MemberMemory {
  return session.memberMemories?.[expertId] || { messages: [] };
}

// 往某成员记忆 push 一条；超过 20 条触发滚动摘要（老消息压成 summary，保留最近 6 条 + summary）
function appendMemberMemory(
  set: StoreSet,
  get: StoreGet,
  expertId: string,
  role: 'user' | 'assistant',
  content: string
): void {
  patchSession(set, get, s => {
    const prev = s.memberMemories?.[expertId] || { messages: [] };
    const newMsg: MemberMessage = { role, content, at: new Date() };
    const messages = [...prev.messages, newMsg];
    return {
      ...s,
      memberMemories: {
        ...s.memberMemories,
        [expertId]: { ...prev, messages },
      },
    };
  });
}

// 滚动摘要：超过阈值条数时，把老消息压缩成 summary，只保留最近 N 条 + summary
// 注意：此函数是异步的（需要调 LLM 做摘要），只在成员调用前调用一次
async function maybeCompactMemberMemory(
  set: StoreSet,
  get: StoreGet,
  config: UserConfig,
  expertId: string
): Promise<void> {
  const session = get().currentSession;
  if (!session) return;
  const mem = getMemberMemory(session, expertId);
  const MAX_MESSAGES = 20;
  const KEEP_RECENT = 6;
  if (mem.messages.length <= MAX_MESSAGES) return;

  const toCompact = mem.messages.slice(0, mem.messages.length - KEEP_RECENT);
  const recent = mem.messages.slice(mem.messages.length - KEEP_RECENT);

  const prevSummary = mem.summary ? `之前的摘要：${mem.summary}\n\n` : '';
  const compactText = toCompact.map(m => `${m.role === 'user' ? '老板' : '我'}：${m.content}`).join('\n');

  try {
    const summaryPrompt = `${prevSummary}以下是该成员与老板的对话历史，请压缩成一段 200 字以内的摘要，保留关键事实、结论和立场变化：\n\n${compactText}`;
    const summary = await callLLM(summaryPrompt, config, 0.2);

    patchSession(set, get, s => {
      const prev = s.memberMemories?.[expertId] || { messages: [] };
      return {
        ...s,
        memberMemories: {
          ...s.memberMemories,
          [expertId]: { messages: recent, summary },
        },
      };
    });
  } catch {
    // 摘要失败不影响主流程，保留原始消息
  }
}

// 组装某成员的完整上下文（system + 历史消息 + 最新老板原话）
// 老板原话一字不改进入该成员的上下文
// extraSystemPrompt: 可选的额外系统提示（如 PM onboarding 时的"接活先判断"职责）
function buildMemberContext(
  session: ProjectSession,
  expertId: string,
  bossInput?: string,
  quotedContext?: string,
  extraSystemPrompt?: string
): ChatMessage[] {
  const expert = session.experts.find(e => e.id === expertId);
  if (!expert) return [];

  const mem = getMemberMemory(session, expertId);

  // system：人设 + 判断框架 + 干过的活 + 群聊摘要
  const myTasks = session.tasks.filter(t => t.expertId === expertId);
  const taskSummary = myTasks.length > 0
    ? myTasks.map(t => {
        if (t.type === 'research' && t.result) {
          const r = t.result as ResearchResult;
          return `- ${t.title}（已完成）：${r.summary?.slice(0, 100) || '无摘要'}`;
        }
        if (t.type === 'analysis' && t.result) {
          const r = t.result as AnalysisResult;
          return `- ${t.title}（已完成）：结论"${r.oneLiner}"（${r.verdict}）`;
        }
        return `- ${t.title}（${t.status}）`;
      }).join('\n')
    : '（暂无分配给你的任务）';

  // 群聊摘要：最近 10 条其他人发言（老板 + 其他成员）
  const recentGroupMsgs = session.groupMessages
    .filter(m => m.authorId !== expertId && m.authorId !== 'system')
    .slice(-10);
  const groupSummary = recentGroupMsgs.length > 0
    ? recentGroupMsgs.map(m => {
        const author = m.authorId === 'boss' ? '老板' : session.experts.find(e => e.id === m.authorId)?.name || '成员';
        return `${author}：${m.content}`;
      }).join('\n')
    : '（群里暂无其他发言）';

  const systemContent = `你是${expert.name}，${expert.title}。你是项目组的一员，在群里和老板、同事协作。

【你的人物卡】
${expert.personaCard || `（无人物卡，按你的判断框架说话：${expert.methodologySource} — ${expert.judgmentCriteria}）`}

【你的判断框架】
${expert.judgmentCriteria}

【常见质疑点】
${expert.commonObjections}

【你干过的活】
${taskSummary}

【群里最近发生的】
${groupSummary}

【硬约束——极其重要】
1. 用你人物卡里的腔调说话，像这个人在群里回消息，不像 AI 助手
2. 基于你的判断框架回答，要有具体观点，不要正确的废话
3. 简短，像会议速记，不要分点列，不要"首先/其次"
4. 不要复述老板的问题，直接讲你的看法
5. 如果你知道或不该你回答，明说"这块不是我管的"或"我没有依据乱说"
6. 如果老板给了新线索和你之前的结论冲突，你要么给出新依据改结论，要么坚持原判并说明为什么——不要无脑迎合${extraSystemPrompt ? `\n\n${extraSystemPrompt}` : ''}`;

  const messages: ChatMessage[] = [{ role: 'system', content: systemContent }];

  // 历史摘要（如果有）
  if (mem.summary) {
    messages.push({ role: 'user', content: `【之前的对话摘要】\n${mem.summary}` });
  }

  // 历史消息
  for (const m of mem.messages) {
    messages.push({ role: m.role, content: m.content });
  }

  // 最新老板原话（一字不改）
  if (bossInput) {
    const quotedSection = quotedContext
      ? `\n【老板质疑的具体内容】\n${quotedContext}`
      : '';
    messages.push({ role: 'user', content: `${bossInput}${quotedSection}` });
  }

  return messages;
}

// JSON 调用 + 解析，失败自动重试一次（prompt 末尾追加纯 JSON 提示）
async function callJsonLLM<T>(
  prompt: string,
  config: UserConfig,
  temperature: number,
  parser: (text: string) => T
): Promise<T> {
  const text1 = await callLLM(prompt, config, temperature);
  try {
    return parser(text1);
  } catch {
    const retryPrompt = prompt + '\n\n【重试提示】上次输出无法解析，这次只输出纯 JSON，不要有任何 JSON 以外的文字。';
    const text2 = await callLLM(retryPrompt, config, temperature);
    return parser(text2);
  }
}

// 蒸馏后从原型卡里提取短显示名，兜底截断到 8 字
function shortenDisplayName(rawName: string, card: string, fallback: string): string {
  let name = rawName;
  if (card.startsWith('【原型卡】')) {
    const match = card.match(/原型身份[：:]\s*(.+)/);
    if (match) {
      name = match[1].trim();
    }
  }
  if (name.length > 12) {
    name = fallback.length > 0 && fallback.length <= 8 ? fallback : name.slice(0, 8);
  }
  return name;
}

// 汇报版本号自增：小数部分 +1（"1.0" → "1.1"，"1.1" → "1.2"）
function bumpVersion(version: string): string {
  const parts = version.split('.');
  if (parts.length !== 2) return '1.0';
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  if (isNaN(major) || isNaN(minor)) return '1.0';
  return `${major}.${minor + 1}`;
}

// 从群消息里聚合已答决策卡（kind='decision' 且 decisionData.answered 已填）
// 供汇报/分析/调研 prompt 引用老板的拍板结果
function buildDecisionContext(session: ProjectSession): string {
  const answered = session.groupMessages.filter(
    m => m.kind === 'decision' && m.decisionData && m.decisionData.answered
  );
  if (answered.length === 0) return '';
  return answered.map(m => {
    const d = m.decisionData!;
    return `${d.question} → ${d.answered}`;
  }).join('\n');
}

function collectNeedBossDecisions(session: ProjectSession): { expertName: string; question: string }[] {
  const questions: { expertName: string; question: string }[] = [];
  for (const task of session.tasks) {
    if (task.type === 'analysis' && task.result) {
      const r = task.result as AnalysisResult;
      if (r.needBossDecision && r.needBossDecision.trim()) {
        const expert = session.experts.find(e => e.id === task.expertId);
        questions.push({
          expertName: expert?.name || '成员',
          question: r.needBossDecision,
        });
      }
    }
  }
  return questions;
}

// ========== 调研任务执行 ==========

async function executeResearchTask(
  task: TaskCard,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<void> {
  const session = get().currentSession!;
  const expert = session.experts.find(e => e.id === task.expertId);
  if (!expert) return;

  const decisionContext = buildDecisionContext(session);

  updateTask(set, get, task.id, { status: 'in_progress' });
  set({ currentExpertName: expert.name, currentTaskTitle: task.title });

  try {
    let researchResult: ResearchResult;
    let isModelKnowledge = false;
    let degradeReason: string | undefined;

    if (config.tavilyApiKey) {
      // a. 拟定搜索方向（running → done）
      const planActId = pushActivity(set, get, task.id, { type: 'plan', label: '拟定搜索方向', status: 'running' });
      setTyping(set, expert.id, '在想搜什么');

      const { queries, thinking: queryThinking } = await callJsonLLM(
        getResearchQueriesPrompt(task, session.idea, decisionContext),
        config, 0.2,
        parseResearchQueriesResult
      );
      // 立刻落盘 searchQueries，否则任务卡三步进度条算不出总数（ResearchProgressSteps 靠它）
      updateTask(set, get, task.id, { searchQueries: queries });

      // b. plan 完成 + push thinking（想法行）
      finishActivity(set, get, task.id, planActId, `定了 ${queries.length} 个搜索词`);
      if (queryThinking) {
        pushActivity(set, get, task.id, { type: 'thinking', label: queryThinking, status: 'done' });
      }

      const allResults: { query: string; results: TavilySearchResult[] }[] = [];
      const searchProgress: { query: string; resultCount: number }[] = [];
      let corsBlocked = false;

      // c. 逐条搜索 + 逐条 read
      for (const query of queries) {
        const searchActId = pushActivity(set, get, task.id, { type: 'search', label: query, status: 'running' });
        setTyping(set, expert.id, `在搜：${query}`);
        try {
          const results = await tavilySearch(query, config.tavilyApiKey);
          allResults.push({ query, results });
          searchProgress.push({ query, resultCount: results.length });
          finishActivity(set, get, task.id, searchActId, `找到 ${results.length} 条`);
          // 每条结果 push read（最多前3条，避免刷屏）
          for (const r of results.slice(0, 3)) {
            pushActivity(set, get, task.id, { type: 'read', label: r.title, url: r.url, status: 'done' });
          }
        } catch (err) {
          searchProgress.push({ query, resultCount: 0 });
          finishActivity(set, get, task.id, searchActId, '搜索失败');
          const errMsg = err instanceof Error ? err.message : '';
          if (/Failed to fetch|NetworkError|CORS/i.test(errMsg)) {
            corsBlocked = true;
          }
        }
        updateTask(set, get, task.id, { searchProgress: [...searchProgress] });
      }

      // d. 提炼调研发现（running → done）
      const summarizeActId = pushActivity(set, get, task.id, { type: 'summarize', label: '提炼调研发现', status: 'running' });
      setTyping(set, expert.id, '在整理发现');

      let summaryWithThinking: ResearchResult & { thinking: string };
      if (allResults.length > 0) {
        summaryWithThinking = await callJsonLLM(
          getResearchSummaryPrompt(task, session.idea, allResults, false),
          config, 0.2,
          parseResearchSummaryResult
        );
      } else {
        isModelKnowledge = true;
        degradeReason = corsBlocked ? '搜索请求被浏览器拦截（CORS），基于模型知识' : '搜索全部失败，基于模型知识';
        summaryWithThinking = await callJsonLLM(
          getResearchSummaryPrompt(task, session.idea, [], true),
          config, 0.2,
          parseResearchSummaryResult
        );
      }

      // e. summarize 完成 + push thinking
      finishActivity(set, get, task.id, summarizeActId, `${summaryWithThinking.findings.length}条发现`);
      if (summaryWithThinking.thinking) {
        pushActivity(set, get, task.id, { type: 'thinking', label: summaryWithThinking.thinking, status: 'done' });
      }

      // thinking 字段不进 result（result 是 ResearchResult，没有 thinking）
      const { thinking: _summaryThinking, ...resultWithoutThinking } = summaryWithThinking;
      void _summaryThinking;
      researchResult = resultWithoutThinking;
    } else {
      // 未配置 Tavily：仍然 push plan + summarize 让时间线可见
      const planActId = pushActivity(set, get, task.id, { type: 'plan', label: '拟定搜索方向', status: 'running' });
      setTyping(set, expert.id, '没用搜索，靠经验整理');
      finishActivity(set, get, task.id, planActId, '没连搜索，用经验整理');

      const summarizeActId = pushActivity(set, get, task.id, { type: 'summarize', label: '提炼调研发现', status: 'running' });

      isModelKnowledge = true;
      degradeReason = '未配置 Tavily API Key，基于模型知识';
      const summaryWithThinking = await callJsonLLM(
        getResearchSummaryPrompt(task, session.idea, [], true),
        config, 0.2,
        parseResearchSummaryResult
      );

      finishActivity(set, get, task.id, summarizeActId, `${summaryWithThinking.findings.length}条发现`);
      if (summaryWithThinking.thinking) {
        pushActivity(set, get, task.id, { type: 'thinking', label: summaryWithThinking.thinking, status: 'done' });
      }

      const { thinking: _summaryThinking, ...resultWithoutThinking } = summaryWithThinking;
      void _summaryThinking;
      researchResult = resultWithoutThinking;
    }

    clearTyping(set);
    updateTask(set, get, task.id, {
      status: 'completed',
      result: researchResult,
      isModelKnowledge,
      degradeReason,
    });
    set({ currentExpertName: null, currentTaskTitle: null });

    await generateGroupMessage(expert, task, researchResult, config, set, get);
  } catch (err) {
    // P0-4：失败兜底，标 failed + clearTyping + 推失败活动，避免任务永远 in_progress
    clearTyping(set);
    const errMsg = err instanceof Error ? err.message : '未知错误';
    updateTask(set, get, task.id, { status: 'failed' });
    set({ currentExpertName: null, currentTaskTitle: null });
    pushActivity(set, get, task.id, { type: 'summarize', label: `任务失败：${errMsg.slice(0, 80)}`, status: 'done' });
    addSystemMessage(set, get, `${expert.name} 的调研没跑通：${errMsg.slice(0, 50)}，点重试此步骤再来一次`);
    log('error', `executeResearchTask 失败 (${expert.name}): ${errMsg}`);
    throw err;  // 让上层（runResearchPhase）决定是否继续下一个任务
  }
}

// ========== 分析任务执行 ==========

async function executeAnalysisTask(
  task: TaskCard,
  researchResults: ResearchResult[],
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<void> {
  const session = get().currentSession!;
  const expert = session.experts.find(e => e.id === task.expertId);
  if (!expert) return;

  const decisionContext = buildDecisionContext(session);

  updateTask(set, get, task.id, { status: 'in_progress' });
  set({ currentExpertName: expert.name, currentTaskTitle: task.title });

  try {
    // push analyze 活动并调用 LLM
    const analyzeActId = pushActivity(set, get, task.id, { type: 'analyze', label: '基于调研发现做判断', status: 'running' });
    setTyping(set, expert.id, '在分析判断');

    const resultWithThinking = await callJsonLLM(
      getAnalysisPrompt(expert, task, session.idea, decisionContext, researchResults),
      config, 0.2,
      parseAnalysisResult
    );

    // analyze 完成 + push thinking
    finishActivity(set, get, task.id, analyzeActId);
    if (resultWithThinking.thinking) {
      pushActivity(set, get, task.id, { type: 'thinking', label: resultWithThinking.thinking, status: 'done' });
    }

    clearTyping(set);

    // thinking 字段不进 result（result 是 AnalysisResult，没有 thinking）
    const { thinking: _analyzeThinking, ...result } = resultWithThinking;
    void _analyzeThinking;

    updateTask(set, get, task.id, { status: 'completed', result });
    set({ currentExpertName: null, currentTaskTitle: null });

    await generateGroupMessage(expert, task, result, config, set, get);
  } catch (err) {
    // P0-4：失败兜底，标 failed + clearTyping + 推失败活动
    clearTyping(set);
    const errMsg = err instanceof Error ? err.message : '未知错误';
    updateTask(set, get, task.id, { status: 'failed' });
    set({ currentExpertName: null, currentTaskTitle: null });
    pushActivity(set, get, task.id, { type: 'analyze', label: `任务失败：${errMsg.slice(0, 80)}`, status: 'done' });
    addSystemMessage(set, get, `${expert.name} 的分析没跑通：${errMsg.slice(0, 50)}，点重试此步骤再来一次`);
    log('error', `executeAnalysisTask 失败 (${expert.name}): ${errMsg}`);
    throw err;
  }
}

// ========== 群消息生成 ==========

// 流式群消息辅助函数：先插空消息，流式累积 content，流结束落盘一次。返回 msgId（空内容/失败返回 null）。
// 流式失败或空内容时自动清理空消息。hint 为打字指示器文案。
async function streamGroupMessage(
  set: StoreSet,
  get: StoreGet,
  expertId: string,
  promptOrMessages: string | ChatMessage[],
  config: UserConfig,
  temperature: number = 0.7,
  hint: string = '正在回复',
  options?: { kind?: GroupMessage['kind']; replyToId?: string }
): Promise<string | null> {
  const msgId = `msg-${expertId}-${Date.now()}-${Math.random()}`;
  addGroupMessage(set, get, {
    id: msgId,
    authorId: expertId,
    content: '',
    createdAt: new Date(),
    ...(options?.kind ? { kind: options.kind } : {}),
    ...(options?.replyToId ? { replyToId: options.replyToId } : {}),
  });
  setTyping(set, expertId, hint);
  let acc = '';
  try {
    const onChunk = (chunk: string) => {
      acc += chunk;
      patchMessageContent(set, get, msgId, acc);
    };
    if (typeof promptOrMessages === 'string') {
      await callLLMStream(promptOrMessages, config, onChunk, temperature);
    } else {
      await callLLMStreamMessages(promptOrMessages, config, onChunk, temperature);
    }
    clearTyping(set);
    if (!acc.trim()) {
      patchSession(set, get, s => ({ ...s, groupMessages: s.groupMessages.filter(m => m.id !== msgId) }));
      updateSession(get().currentSession!);
      return null;
    }
    updateSession(get().currentSession!);
    return msgId;
  } catch (err) {
    clearTyping(set);
    if (acc.trim()) {
      // 流式中断：保留已生成部分并标注"没说完"，不删消息
      patchMessageContent(set, get, msgId, `${acc}\n\n（没说完）`);
      updateSession(get().currentSession!);
    } else {
      // 一字未生成就失败：删掉空消息
      patchSession(set, get, s => ({ ...s, groupMessages: s.groupMessages.filter(m => m.id !== msgId) }));
      updateSession(get().currentSession!);
    }
    throw err;
  }
}

async function generateGroupMessage(
  expert: Expert,
  task: TaskCard,
  result: ResearchResult | AnalysisResult,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<void> {
  try {
    await maybeCompactMemberMemory(set, get, config, expert.id);
    const session = get().currentSession!;
    const messages = buildMemberContext(
      session, expert.id, undefined, undefined,
      '你刚完成一项任务，在群里用一两句话说你最关键的发现/结论，引导老板去右边面板你的名下看细节。像同事在群里报备"查完了，最要紧的是X"那样，简短人话，不要分点列。'
    );
    const msgId = await streamGroupMessage(set, get, expert.id, messages, config, 0.7, '正在群里总结');
    if (msgId) {
      const finalContent = get().currentSession!.groupMessages.find(m => m.id === msgId)?.content || '';
      if (finalContent) {
        appendMemberMemory(set, get, expert.id, 'assistant', finalContent);
      }
    }
  } catch {
    // 群消息失败不影响主流程
  }
}

// ========== 分歧处理 ==========

async function handleConflicts(
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<void> {
  const session = get().currentSession!;

  const analysisResults = session.tasks
    .filter(t => t.type === 'analysis' && t.result)
    .map(t => ({
      task: t,
      result: t.result as AnalysisResult,
      expert: session.experts.find(e => e.id === t.expertId)!,
    }))
    .filter(r => r.expert);

  if (analysisResults.length < 2) return;

  // verdict 三档赋分，便于量化差异
  const verdictScore: Record<AnalysisResult['verdict'], number> = {
    'pass': 2,
    'conditional': 1,
    'fail': 0,
  };

  // 挑差异最大的两人：verdict 不同 → 辩论；verdict 相同但 confidence 差距 ≥ 20 → 辩论
  // 优先 verdict 差异最大的；verdict 相同时挑 confidence 差距最大的
  let bestPair: {
    a: typeof analysisResults[0];
    b: typeof analysisResults[0];
    verdictDiff: number;
    confDiff: number;
  } | null = null;

  for (let i = 0; i < analysisResults.length; i++) {
    for (let j = i + 1; j < analysisResults.length; j++) {
      const a = analysisResults[i];
      const b = analysisResults[j];
      const verdictDiff = Math.abs(verdictScore[a.result.verdict] - verdictScore[b.result.verdict]);
      const confDiff = Math.abs(a.result.confidence - b.result.confidence);
      const needsDebate = verdictDiff > 0 || confDiff >= 20;
      if (!needsDebate) continue;
      if (
        !bestPair
        || verdictDiff > bestPair.verdictDiff
        || (verdictDiff === bestPair.verdictDiff && confDiff > bestPair.confDiff)
      ) {
        bestPair = { a, b, verdictDiff, confDiff };
      }
    }
  }

  if (!bestPair) return;

  const { a, b } = bestPair;
  log('stage', `handleConflicts 触发辩论: ${a.expert.name}(${a.result.verdict},${a.result.confidence}) vs ${b.expert.name}(${b.result.verdict},${b.result.confidence})`);

  try {
    const messages = await callJsonLLM(
      getConflictDebatePrompt(a.expert, a.result, b.expert, b.result, session.idea),
      config, 0.2,
      (text) => parseConflictDebateResult(text, a.expert.id, b.expert.id)
    );

    for (const msg of messages) {
      const expert = session.experts.find(e => e.id === msg.expertId);
      if (expert && msg.content) {
        addGroupMessage(set, get, {
          id: `msg-${expert.id}-${Date.now()}-${Math.random()}`,
          authorId: expert.id,
          content: msg.content,
          createdAt: new Date(),
        });
        // 辩论消息入成员记忆，事后被 @问到自己说过的话能认账
        appendMemberMemory(set, get, expert.id, 'assistant', msg.content);
      }
    }
  } catch {
    // 分歧处理失败不影响主流程
  }
}

// ========== 点对点追问：分类 + 分流 ==========

// 找到 expert 的 analysis 任务卡（汇报完成后追问的都是分析结论）
function findAnalysisTask(session: ProjectSession, expertId: string): TaskCard | undefined {
  return session.tasks.find(t => t.type === 'analysis' && t.expertId === expertId);
}

// 找到 expert 的 research 任务卡（无 analysis 任务卡时兜底）
function findResearchTask(session: ProjectSession, expertId: string): TaskCard | undefined {
  return session.tasks.find(t => t.type === 'research' && t.expertId === expertId);
}

// ========== 调研重查模式（无 analysis 任务卡，但有 research 任务卡） ==========
async function handleResearchReinvestigate(
  expert: Expert,
  task: TaskCard,
  question: string,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet,
  bossMsgId?: string,
  quotedContext?: string
): Promise<void> {
  const session = get().currentSession!;

  // a. 重查计划（running → done）
  const planActId = pushActivity(set, get, task.id, { type: 'plan', label: '基于老板线索拟定重查方向', status: 'running' });

  // 1. 生成搜索词（getReinvestigateQueriesPrompt 对 task 类型不敏感，只用 title/description）
  const { queries, thinking: queryThinking } = await callJsonLLM(
    getReinvestigateQueriesPrompt(task, session.idea, question, expert, quotedContext),
    config, 0.2,
    parseReinvestigateQueriesResult
  );

  finishActivity(set, get, task.id, planActId, `${queries.length}个搜索词`);
  if (queryThinking) {
    pushActivity(set, get, task.id, { type: 'thinking', label: queryThinking, status: 'done' });
  }

  // 2. 走 Tavily 搜索（复用降级逻辑）
  let newResearch: ResearchResult;
  let isModelKnowledge = false;
  let degradeReason: string | undefined;

  if (config.tavilyApiKey && queries.length > 0) {
    const allResults: { query: string; results: TavilySearchResult[] }[] = [];
    let corsBlocked = false;

    for (const query of queries) {
      const searchActId = pushActivity(set, get, task.id, { type: 'search', label: query, status: 'running' });
      try {
        const results = await tavilySearch(query, config.tavilyApiKey);
        allResults.push({ query, results });
        finishActivity(set, get, task.id, searchActId, `命中${results.length}条`);
        for (const r of results.slice(0, 3)) {
          pushActivity(set, get, task.id, { type: 'read', label: r.title, url: r.url, status: 'done' });
        }
      } catch (err) {
        finishActivity(set, get, task.id, searchActId, '搜索失败');
        const errMsg = err instanceof Error ? err.message : '';
        if (/Failed to fetch|NetworkError|CORS/i.test(errMsg)) {
          corsBlocked = true;
        }
      }
    }

    const summarizeActId = pushActivity(set, get, task.id, { type: 'summarize', label: '提炼重查发现', status: 'running' });
    let summaryWithThinking: ResearchResult & { thinking: string };
    if (allResults.length > 0) {
      summaryWithThinking = await callJsonLLM(
        getResearchSummaryPrompt(task, session.idea, allResults, false),
        config, 0.2,
        parseResearchSummaryResult
      );
    } else {
      isModelKnowledge = true;
      degradeReason = corsBlocked ? '搜索请求被浏览器拦截（CORS），基于模型知识' : '搜索全部失败，基于模型知识';
      summaryWithThinking = await callJsonLLM(
        getResearchSummaryPrompt(task, session.idea, [], true),
        config, 0.2,
        parseResearchSummaryResult
      );
    }
    finishActivity(set, get, task.id, summarizeActId, `${summaryWithThinking.findings.length}条发现`);
    if (summaryWithThinking.thinking) {
      pushActivity(set, get, task.id, { type: 'thinking', label: summaryWithThinking.thinking, status: 'done' });
    }
    const { thinking: _t, ...rest } = summaryWithThinking;
    void _t;
    newResearch = rest;
  } else {
    isModelKnowledge = true;
    degradeReason = config.tavilyApiKey ? '未生成有效搜索词，基于模型知识' : '未配置 Tavily API Key，基于模型知识';
    const summarizeActId = pushActivity(set, get, task.id, { type: 'summarize', label: '提炼重查发现', status: 'running' });
    const summaryWithThinking = await callJsonLLM(
      getResearchSummaryPrompt(task, session.idea, [], true),
      config, 0.2,
      parseResearchSummaryResult
    );
    finishActivity(set, get, task.id, summarizeActId, `${summaryWithThinking.findings.length}条发现`);
    if (summaryWithThinking.thinking) {
      pushActivity(set, get, task.id, { type: 'thinking', label: summaryWithThinking.thinking, status: 'done' });
    }
    const { thinking: _t, ...rest } = summaryWithThinking;
    void _t;
    newResearch = rest;
  }

  // 3. 更新 research 任务卡的 ResearchResult
  const oldResearch = task.result as ResearchResult | undefined;
  updateTask(set, get, task.id, {
    result: newResearch,
    isModelKnowledge: task.isModelKnowledge || isModelKnowledge,
    degradeReason: task.degradeReason || degradeReason,
  });

  // 4. 群消息：以该成员身份说"重查了，新发现是……"
  try {
    const msgPrompt = `你是${expert.name}，${expert.title}。老板在工作群里 @ 你追问，你刚基于老板的线索把调研任务重查了一遍。在群里发一条短消息同步结果。

【你的人物卡】
${expert.personaCard || `（无人物卡，按你的判断框架说话：${expert.judgmentCriteria}）`}

【老板的追问】
${question}

【你的调研任务】
${task.title}：${task.description}

【新调研发现】
${newResearch.summary}

【你的任务】
在群里发一条短消息：
- 说"查了"+基于新发现的关键结论
- 如果新发现和之前不同，说清楚变了什么
- 一句话说理由

【硬约束——极其重要】
1. 用你人物卡里的腔调说话，像这个人在群里回消息
2. 80 字以内，像会议速记，不像文章
3. 不要分点列，不要"首先/其次"
4. 不要复述老板的问题，直接讲依据

直接输出消息内容，不要 JSON，不要加"${expert.name}:"这种前缀。`;
    const msgId = await streamGroupMessage(set, get, expert.id, msgPrompt, config, 0.7, '正在回复老板', { replyToId: bossMsgId });
    if (msgId) {
      const finalContent = get().currentSession!.groupMessages.find(m => m.id === msgId)?.content || '';
      if (finalContent) {
        appendMemberMemory(set, get, expert.id, 'assistant', finalContent);
      }
    }
  } catch {
    // 群消息失败不影响主流程
  }

  // 5. research 结论实际变化时才标 reportStale（无条件置位会导致汇报误报过期）
  const findingsChanged = !oldResearch
    || oldResearch.summary !== newResearch.summary
    || JSON.stringify(oldResearch.findings) !== JSON.stringify(newResearch.findings);
  if (findingsChanged) {
    patchSession(set, get, s => ({ ...s, reportStale: true }));
  }
}

// ========== 无任务卡直接答复模式 ==========
async function handleExplainNoTask(
  expert: Expert,
  question: string,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet,
  bossMsgId?: string,
  quotedContext?: string
): Promise<void> {
  try {
    // 先压缩记忆（异步，超过阈值才触发）
    await maybeCompactMemberMemory(set, get, config, expert.id);
    // 老板原话先入记忆
    appendMemberMemory(set, get, expert.id, 'user', question);
    // 组装该成员的完整上下文（system+历史+老板原话）
    const session = get().currentSession!;
    const messages = buildMemberContext(session, expert.id, undefined, quotedContext);
    const msgId = await streamGroupMessage(set, get, expert.id, messages, config, 0.7, '正在回复老板', { replyToId: bossMsgId });
    if (!msgId) {
      addSystemMessage(set, get, `${expert.name} 暂未给出答复`);
      return;
    }
    // 成员的回复入记忆
    const finalContent = get().currentSession!.groupMessages.find(m => m.id === msgId)?.content || '';
    if (finalContent) {
      appendMemberMemory(set, get, expert.id, 'assistant', finalContent);
    }
  } catch (err) {
    addSystemMessage(set, get, `${expert.name} 答复失败：${err instanceof Error ? err.message : '未知错误'}`);
  }
}

// ========== 解释模式 ==========
async function handleExplain(
  expert: Expert,
  task: TaskCard,
  question: string,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet,
  bossMsgId?: string,
  quotedContext?: string
): Promise<void> {
  try {
    // 先压缩记忆
    await maybeCompactMemberMemory(set, get, config, expert.id);
    // 老板原话入记忆
    appendMemberMemory(set, get, expert.id, 'user', question);
    // 组装完整上下文（含任务结论）
    const session = get().currentSession!;
    const messages = buildMemberContext(session, expert.id, undefined, quotedContext);
    const msgId = await streamGroupMessage(
      set, get, expert.id, messages, config, 0.7,
      '正在回复老板',
      { replyToId: bossMsgId }
    );
    // 成员回复入记忆
    if (msgId) {
      const finalContent = get().currentSession!.groupMessages.find(m => m.id === msgId)?.content || '';
      if (finalContent) {
        appendMemberMemory(set, get, expert.id, 'assistant', finalContent);
      }
    }
  } catch (err) {
    addSystemMessage(set, get, `${expert.name} 答复失败：${err instanceof Error ? err.message : '未知错误'}`);
  }
  // 解释模式不改任务卡，不改结论
}

// ========== 重查模式 ==========
async function handleReinvestigate(
  expert: Expert,
  task: TaskCard,
  question: string,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet,
  bossMsgId?: string,
  quotedContext?: string
): Promise<void> {
  const session = get().currentSession!;
  const oldResult = task.result as AnalysisResult | undefined;
  if (!oldResult) {
    // 没有旧结论没法重查，降级到解释
    console.warn(`[handleReinvestigate] ${expert.name} 的任务卡没有旧结论，降级解释`);
    await handleExplain(expert, task, question, config, set, get, bossMsgId, quotedContext);
    return;
  }

  // a. 重查计划（running → done）
  const planActId = pushActivity(set, get, task.id, { type: 'plan', label: '基于老板线索拟定重查方向', status: 'running' });

  // 1. 生成搜索词
  const { queries, thinking: queryThinking } = await callJsonLLM(
    getReinvestigateQueriesPrompt(task, session.idea, question, expert, quotedContext),
    config, 0.2,
    parseReinvestigateQueriesResult
  );

  finishActivity(set, get, task.id, planActId, `${queries.length}个搜索词`);
  if (queryThinking) {
    pushActivity(set, get, task.id, { type: 'thinking', label: queryThinking, status: 'done' });
  }

  // 2. 走 Tavily 搜索（复用 executeResearchTask 的降级逻辑）
  let newResearch: ResearchResult;
  let isModelKnowledge = false;
  let degradeReason: string | undefined;

  if (config.tavilyApiKey && queries.length > 0) {
    const allResults: { query: string; results: TavilySearchResult[] }[] = [];
    let corsBlocked = false;

    for (const query of queries) {
      const searchActId = pushActivity(set, get, task.id, { type: 'search', label: query, status: 'running' });
      try {
        const results = await tavilySearch(query, config.tavilyApiKey);
        allResults.push({ query, results });
        finishActivity(set, get, task.id, searchActId, `命中${results.length}条`);
        for (const r of results.slice(0, 3)) {
          pushActivity(set, get, task.id, { type: 'read', label: r.title, url: r.url, status: 'done' });
        }
      } catch (err) {
        finishActivity(set, get, task.id, searchActId, '搜索失败');
        const errMsg = err instanceof Error ? err.message : '';
        if (/Failed to fetch|NetworkError|CORS/i.test(errMsg)) {
          corsBlocked = true;
        }
      }
    }

    const summarizeActId = pushActivity(set, get, task.id, { type: 'summarize', label: '提炼重查发现', status: 'running' });
    let summaryWithThinking: ResearchResult & { thinking: string };
    if (allResults.length > 0) {
      summaryWithThinking = await callJsonLLM(
        getResearchSummaryPrompt(task, session.idea, allResults, false),
        config, 0.2,
        parseResearchSummaryResult
      );
    } else {
      isModelKnowledge = true;
      degradeReason = corsBlocked ? '搜索请求被浏览器拦截（CORS），基于模型知识' : '搜索全部失败，基于模型知识';
      summaryWithThinking = await callJsonLLM(
        getResearchSummaryPrompt(task, session.idea, [], true),
        config, 0.2,
        parseResearchSummaryResult
      );
    }
    finishActivity(set, get, task.id, summarizeActId, `${summaryWithThinking.findings.length}条发现`);
    if (summaryWithThinking.thinking) {
      pushActivity(set, get, task.id, { type: 'thinking', label: summaryWithThinking.thinking, status: 'done' });
    }
    const { thinking: _t1, ...rest1 } = summaryWithThinking;
    void _t1;
    newResearch = rest1;
  } else {
    isModelKnowledge = true;
    degradeReason = config.tavilyApiKey ? '未生成有效搜索词，基于模型知识' : '未配置 Tavily API Key，基于模型知识';
    const summarizeActId = pushActivity(set, get, task.id, { type: 'summarize', label: '提炼重查发现', status: 'running' });
    const summaryWithThinking = await callJsonLLM(
      getResearchSummaryPrompt(task, session.idea, [], true),
      config, 0.2,
      parseResearchSummaryResult
    );
    finishActivity(set, get, task.id, summarizeActId, `${summaryWithThinking.findings.length}条发现`);
    if (summaryWithThinking.thinking) {
      pushActivity(set, get, task.id, { type: 'thinking', label: summaryWithThinking.thinking, status: 'done' });
    }
    const { thinking: _t1, ...rest1 } = summaryWithThinking;
    void _t1;
    newResearch = rest1;
  }

  // 3. 基于新调研重新分析
  const analyzeActId = pushActivity(set, get, task.id, { type: 'analyze', label: '基于重查发现重新判断', status: 'running' });
  const newResultWithThinking = await callJsonLLM(
    getReinvestigateAnalysisPrompt(expert, task, session.idea, question, newResearch, oldResult, quotedContext),
    config, 0.2,
    parseReinvestigateAnalysisResult
  );
  finishActivity(set, get, task.id, analyzeActId);
  if (newResultWithThinking.thinking) {
    pushActivity(set, get, task.id, { type: 'thinking', label: newResultWithThinking.thinking, status: 'done' });
  }
  // thinking 字段不进 result
  const { thinking: _t2, ...newResult } = newResultWithThinking;
  void _t2;

  // 4. 抗迎合硬校验：verdict 变了但拿不出 evidenceDelta → 无效翻转，不改结论
  const verdictChanged = newResult.verdict !== oldResult.verdict;
  const hasEvidence = Array.isArray(newResult.evidenceDelta) && newResult.evidenceDelta.length > 0;
  const invalidFlip = verdictChanged && !hasEvidence;
  const changed = verdictChanged && hasEvidence;

  // 5. 诚实修订
  if (changed) {
    // 有效改判：把 oldResult 存进 conclusionHistory，version 自增
    const existingHistory = task.conclusionHistory || [];
    const nextVersion = existingHistory.length > 0
      ? Math.max(...existingHistory.map(h => h.version)) + 1
      : 1;
    const evidenceSummary = newResult.evidenceDelta!.join('；');
    const revision: ConclusionRevision = {
      version: nextVersion,
      result: oldResult,
      reason: `改判依据：${evidenceSummary}`,
      revisedAt: new Date(),
    };
    updateTask(set, get, task.id, {
      result: newResult,
      revised: true,
      rechecked: false,
      conclusionHistory: [...existingHistory, revision],
      isModelKnowledge: task.isModelKnowledge || isModelKnowledge,
      degradeReason: task.degradeReason || degradeReason,
    });
  } else {
    // 维持原判（含无效翻转）：只标 rechecked，不改 result
    updateTask(set, get, task.id, {
      rechecked: true,
      isModelKnowledge: task.isModelKnowledge || isModelKnowledge,
      degradeReason: task.degradeReason || degradeReason,
    });
    if (invalidFlip) {
      log('question', `抗迎合: ${expert.name} 改了 verdict 但没给 evidenceDelta，视为无效翻转，维持原判`);
    }
  }

  // 6. 群消息：诚实表态（用成员 agent 上下文，老板原话+重查结果都进上下文）
  try {
    // 老板原话入记忆
    appendMemberMemory(set, get, expert.id, 'user', question);
    // 组装该成员的完整上下文
    const freshSession = get().currentSession!;
    const messages = buildMemberContext(freshSession, expert.id, undefined, quotedContext);

    // 附加重查结果说明（作为最新 user 消息，让成员基于此表态）
    const reinvestigateContext = invalidFlip
      ? `你重查了老板质疑的结论，但没有找到足以改变结论的新证据。维持原判：${oldResult.oneLiner}（${oldResult.verdict}）。依据：${oldResult.findings.slice(0, 2).join('；')}。在群里发一条短消息说"重查了，没找到新证据，维持原判"并说一句依据。`
      : changed
        ? `你重查后找到了新证据，改判了。新结论：${newResult.oneLiner}（${newResult.verdict}）。改判依据：${newResult.evidenceDelta?.join('；')}。在群里发一条短消息说你改判了、新结论是什么、依据是什么。`
        : `你重查后维持原判：${oldResult.oneLiner}（${oldResult.verdict}）。在群里发一条短消息说你重查了、维持原判。`;
    messages.push({ role: 'user', content: reinvestigateContext });

    const msgId = await streamGroupMessage(set, get, expert.id, messages, config, 0.7, '正在写修订表态', { replyToId: bossMsgId });
    // 成员表态入记忆
    if (msgId) {
      const finalContent = get().currentSession!.groupMessages.find(m => m.id === msgId)?.content || '';
      if (finalContent) {
        appendMemberMemory(set, get, expert.id, 'assistant', finalContent);
      }
    }
  } catch {
    // 群消息失败不影响主流程
  }

  // 7. 仅 changed 时：同行评议 + 设 reportStale
  if (changed) {
    await runPeerReview(expert, task, newResult, config, set, get);
    patchSession(set, get, s => ({ ...s, reportStale: true }));
  }
}

// ========== 同行评议 ==========
async function runPeerReview(
  revisedExpert: Expert,
  revisedTask: TaskCard,
  newResult: AnalysisResult,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<void> {
  const session = get().currentSession!;
  const otherExperts = session.experts.filter(e => e.id !== revisedExpert.id);
  if (otherExperts.length === 0) return;

  // 找最相关的另一个成员：有 analysis 任务且 verdict 和 newResult 相反/最不一致的
  // pass ↔ fail 优先；都没有就找 confidence 差最大的；都找不到用 otherExperts[0]
  const verdictOpposite: Record<AnalysisResult['verdict'], AnalysisResult['verdict']> = {
    'pass': 'fail',
    'fail': 'pass',
    'conditional': 'fail',
  };
  const desiredVerdict = verdictOpposite[newResult.verdict];

  let reviewer: Expert | undefined;
  let bestTask: TaskCard | undefined;

  // 第一优先：verdict 相反的
  for (const e of otherExperts) {
    const t = findAnalysisTask(session, e.id);
    if (t?.result && (t.result as AnalysisResult).verdict === desiredVerdict) {
      reviewer = e;
      bestTask = t;
      break;
    }
  }

  // 第二优先：任意有 analysis 任务的
  if (!reviewer) {
    for (const e of otherExperts) {
      const t = findAnalysisTask(session, e.id);
      if (t?.result) {
        reviewer = e;
        bestTask = t;
        break;
      }
    }
  }

  // 第三优先：第一个其他专家
  if (!reviewer) {
    reviewer = otherExperts[0];
  }

  // bestTask 仅用于排除被问者自身，评议 prompt 不需要它，但要确认 reviewer 不是 revisedExpert
  void bestTask;

  try {
    const msgId = await streamGroupMessage(
      set, get, reviewer.id,
      getPeerReviewPrompt(reviewer, revisedExpert, revisedTask, newResult, session.idea),
      config, 0.7,
      '正在写同行评议'
    );
    if (msgId) {
      const finalContent = get().currentSession!.groupMessages.find(m => m.id === msgId)?.content || '';
      if (finalContent) {
        appendMemberMemory(set, get, reviewer.id, 'assistant', finalContent);
      }
    }
  } catch {
    // 评议失败不影响主流程
  }
}

// ========== PM 接活判断（替代旧的 runClarifying 代码分支） ==========
// PM 作为第一个 agent 接收 idea，自己判断信息够不够：
// - 不够 → 在群里问老板真问题（对话方式，不是拍板卡）
// - 够 → 复述理解，等老板说"就这么干"触发 proceed → runPlanning
// 这是 PM 的人设判断，不是代码分支
async function runPMOnboarding(
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<void> {
  const session = get().currentSession!;
  setStage(set, get, 'clarifying');  // 复用 clarifying 状态，语义改为"PM 接活判断"

  // 找 PM（title 含"产品"的，找不到用 experts[0]）
  const pm = session.experts.find(e => e.title.includes('产品')) || session.experts[0];
  if (!pm) {
    // 极端情况：没有专家，直接立项
    await runFromPlanning(config, set, get);
    return;
  }

  // PM 的 onboarding 职责提示
  const onboardingPrompt = `【你的特别职责——接活先判断】
你是项目组长，老板刚把一个想法交办给你。你的第一反应是判断：这个想法够不够清楚到团队可以直接干活？

判断标准：
- 关键信息缺失（做给谁用、解决什么问题、形态偏好是软件/硬件/服务）→ 先在群里问老板真问题，一次最多两三个，不要开放式反问（不要问"您觉得呢"），要问具体的（如"目标是给孩子用还是给老人用？""是做 App 还是硬件设备？"）
- 信息够 → 用一句话复述你的理解，然后说"我开干了"，等老板确认后团队就立项分工

这是你的判断，不是代码规则。你觉得够就够，觉得不够就问。细节缺口（技术栈、定价）不算模糊，留给干活阶段自己查。`;

  try {
    // 先压缩 PM 的记忆
    await maybeCompactMemberMemory(set, get, config, pm.id);
    // 老板的 idea 原话入 PM 记忆
    appendMemberMemory(set, get, pm.id, 'user', session.idea);
    // 组装 PM 上下文（含 onboarding 职责）
    const freshSession = get().currentSession!;
    const messages = buildMemberContext(freshSession, pm.id, undefined, undefined, onboardingPrompt);
    // 流式输出 PM 的判断
    setTyping(set, pm.id, '正在判断想法');
    const msgId = await streamGroupMessage(set, get, pm.id, messages, config, 0.7, '正在判断想法');
    // PM 的回复入记忆
    if (msgId) {
      const finalContent = get().currentSession!.groupMessages.find(m => m.id === msgId)?.content || '';
      if (finalContent) {
        appendMemberMemory(set, get, pm.id, 'assistant', finalContent);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    addSystemMessage(set, get, `组长判断失败：${msg}`);
  }
}

// ========== 立项分工 + 干活 + 请示/汇报（拆三段，两个停顿点） ==========

// 入口：保留 runFromPlanning 作为兼容入口，实际只跑第一段（立项分工）
async function runFromPlanning(
  config: UserConfig,
  set: StoreSet,
  get: StoreGet,
  resume = false
): Promise<void> {
  await runPlanning(config, set, get, resume);
}

// 第一段：立项分工 → plan_approval（等老板批示）
async function runPlanning(
  config: UserConfig,
  set: StoreSet,
  get: StoreGet,
  resume = false
): Promise<void> {
  const session = get().currentSession!;
  setStage(set, get, 'planning');

  let tasks = session.tasks;
  const isResumeWithTasks = resume && tasks.length > 0;

  // 立项分工（resume 且已有 tasks 时跳过）
  if (!isResumeWithTasks) {
    const decisionContext = buildDecisionContext(session);
    const taskPlans = await callJsonLLM(
      getPlanningPrompt(session.idea, session.domain, session.risks, session.experts, decisionContext),
      config, 0.2,
      (text) => parsePlanningResult(text, session.experts)
    );

    tasks = taskPlans.map((p, i) => ({
      id: `task-${Date.now()}-${i}`,
      expertId: p.expertId,
      type: p.type,
      title: p.title,
      description: p.description,
      status: 'pending' as const,
    }));

    patchSession(set, get, s => ({ ...s, tasks }));
  }

  // 新生成 tasks 时组长在群里说一句人话 + 发结构化分工卡
  if (!isResumeWithTasks) {
    const leader = session.experts.find(e => e.title.includes('产品')) || session.experts[0];
    if (leader) {
      await maybeCompactMemberMemory(set, get, config, leader.id);
      const session2 = get().currentSession!;
      const messages = buildMemberContext(
        session2, leader.id, undefined, undefined,
        '你刚排完分工方案。在群里用一两句话说一下分工大意，告诉老板分工卡在上面，没问题就说一声。简短人话，不要列每个任务。'
      );
      const msgId = await streamGroupMessage(set, get, leader.id, messages, config, 0.7, '正在说分工');
      if (msgId) {
        const finalContent = get().currentSession!.groupMessages.find(m => m.id === msgId)?.content || '';
        if (finalContent) {
          appendMemberMemory(set, get, leader.id, 'assistant', finalContent);
        }
      }
    }

    // 发结构化分工卡（每人一行：谁/干什么/为什么是他），让老板在聊天流里直接看到方案
    const planContent = buildPlanCardContent(get().currentSession!);
    addGroupMessage(set, get, {
      id: `msg-plan-${Date.now()}-${Math.random()}`,
      authorId: leader?.id || 'system',
      content: planContent,
      createdAt: new Date(),
      kind: 'plan',
    });
  }
  setStage(set, get, 'plan_approval');
}

// 构建分工卡内容：每人一行（谁 / 干什么 / 为什么是他）
function buildPlanCardContent(session: ProjectSession): string {
  const lines = session.tasks.map(t => {
    const expert = session.experts.find(e => e.id === t.expertId);
    const name = expert?.name || '成员';
    const typeLabel = t.type === 'research' ? '调研' : '分析';
    return `${name}（${typeLabel}）：${t.title} —— ${t.description}`;
  });
  return lines.join('\n');
}

// 第二段：调研 → briefing（组长发简报，等老板发话）
async function runResearchPhase(
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<void> {
  setStage(set, get, 'working');

  const tasks = get().currentSession!.tasks;

  // 跑调研任务（串行，跳过已完成的——断点恢复）
  const researchTasks = tasks.filter(t => t.type === 'research');
  for (const task of researchTasks) {
    if (get().currentSession?.workPaused) return;
    const currentTask = get().currentSession!.tasks.find(t => t.id === task.id)!;
    if (currentTask.status === 'completed') continue;
    await executeResearchTask(currentTask, config, set, get);
    await processQueue(config, set, get);
  }

  // 调研全部完成，组长准备简报
  // 暂停检查：最后一个任务后到简报之间也要尊重 workPaused
  if (get().currentSession?.workPaused) return;
  // 找组长：experts 里 title 含"产品"的，找不到用 experts[0]
  const freshSession = get().currentSession!;
  const leader = freshSession.experts.find(e => e.title.includes('产品')) || freshSession.experts[0];

  if (leader) {
    try {
      await maybeCompactMemberMemory(set, get, config, leader.id);
      const session2 = get().currentSession!;
      const messages = buildMemberContext(
        session2, leader.id, undefined, undefined,
        '调研阶段全跑完了。你是组长，现在做合议——不要复述成员各自已经说过的发现（他们在群里都说过了），你要说的是他们发现之间的关系：哪里互相印证（共识）、哪里打架或矛盾（分歧）、接下来重点分析什么。两三句话，像同事在群里说话，不要分点列。'
      );
      const msgId = await streamGroupMessage(set, get, leader.id, messages, config, 0.7, '正在说简报');
      if (msgId) {
        const finalContent = get().currentSession!.groupMessages.find(m => m.id === msgId)?.content || '';
        if (finalContent) {
          appendMemberMemory(set, get, leader.id, 'assistant', finalContent);
        }
      }
    } catch {
      // 简报失败不影响主流程，群里至少有系统消息提示
    }
  }

  setStage(set, get, 'briefing');
}

// 同事反应：某成员分析任务完成后，挑立场差异最大的一个已结论同事跟一条 ≤2 句反应
async function maybeColleagueReaction(
  speakerTask: TaskCard,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<void> {
  try {
    const session = get().currentSession!;
    const speaker = session.experts.find(e => e.id === speakerTask.expertId);
    if (!speaker || !speakerTask.result) return;
    const speakerResult = speakerTask.result as AnalysisResult;

    // 找已完成的 analysis 任务，排除发言者自己
    const others = session.tasks
      .filter(t => t.type === 'analysis' && t.status === 'completed' && t.id !== speakerTask.id && t.result)
      .map(t => ({
        task: t,
        result: t.result as AnalysisResult,
        expert: session.experts.find(e => e.id === t.expertId)!,
      }))
      .filter(r => r.expert);

    if (others.length === 0) return;

    const verdictScore: Record<AnalysisResult['verdict'], number> = {
      'pass': 2,
      'conditional': 1,
      'fail': 0,
    };

    // 挑结论差异最大、置信度差异最大的一个同事
    let best = others[0];
    let bestVerdictDiff = Math.abs(verdictScore[speakerResult.verdict] - verdictScore[best.result.verdict]);
    let bestConfDiff = Math.abs(speakerResult.confidence - best.result.confidence);
    for (let i = 1; i < others.length; i++) {
      const o = others[i];
      const sDiff = Math.abs(verdictScore[speakerResult.verdict] - verdictScore[o.result.verdict]);
      const cDiff = Math.abs(speakerResult.confidence - o.result.confidence);
      if (sDiff > bestVerdictDiff || (sDiff === bestVerdictDiff && cDiff > bestConfDiff)) {
        best = o;
        bestVerdictDiff = sDiff;
        bestConfDiff = cDiff;
      }
    }

    // 只要不是完全附和，就发反应——讨论感比刷屏顾虑重要
    // 只有所有人结论和置信度完全一致时才跳过（极少见）
    if (bestVerdictDiff === 0 && bestConfDiff === 0) return;

    const prompt = getColleagueReactionPrompt(best.expert, speaker, speakerResult, session.idea);
    const msgId = await streamGroupMessage(set, get, best.expert.id, prompt, config, 0.7, '正在回复同事');
    if (msgId) {
      const finalContent = get().currentSession!.groupMessages.find(m => m.id === msgId)?.content || '';
      if (finalContent) {
        appendMemberMemory(set, get, best.expert.id, 'assistant', finalContent);
      }
    }
  } catch {
    // 同事反应失败不影响主流程
  }
}

// 互审轮：分析全跑完后，每个专家对其他人的结论开炮或补视角，禁止纯附和
// 这是步进条"互审"阶段的真正实现——之前只在 @质疑 改结论时才触发评议，正常跑全程专家零交流
async function runPeerReviewRound(
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<void> {
  const session = get().currentSession!;
  const analysisTasks = session.tasks.filter(t => t.type === 'analysis' && t.result);
  if (analysisTasks.length < 2) return; // 少于2人没法互审

  for (const task of analysisTasks) {
    if (get().currentSession?.workPaused) return;
    const expert = session.experts.find(e => e.id === task.expertId);
    if (!expert) continue;

    // 组装其他人的结论给该专家看
    const others = analysisTasks
      .filter(t => t.expertId !== expert.id)
      .map(t => {
        const e = session.experts.find(x => x.id === t.expertId)!;
        const r = t.result as AnalysisResult;
        return `${e.name}（${e.title}）：结论"${r.oneLiner}"（${r.verdict}），发现：${r.findings.join('；')}，最大风险：${r.biggestRisk}`;
      }).join('\n');

    await maybeCompactMemberMemory(set, get, config, expert.id);
    appendMemberMemory(set, get, expert.id, 'user', `【系统提示·互审】同事们的分析结论出来了，互审环节到你了。

【同事们的结论】
${others}

【你的任务】挑一条你最不同意的开炮——说清为什么不同意，要基于你自己的方法论和判断标尺。如果都同意，挑最关键的那条补一个别人没说到的视角。不许纯附和（"有道理""同意"禁止），必须指向具体某条结论。不超过120字，像同事在群里说话。

【说人话】用大白话，让老板听得懂。不要生造术语，不要用内行黑话。比如"他说的成本我没异议，但漏了一点——现在柔性屏产线只有三星和LG在投，产能卡在别人手里，我们排队都排不上"而不是"供应链产能约束导致交付风险"。`);

    const freshSession = get().currentSession!;
    const messages = buildMemberContext(
      freshSession, expert.id,
      undefined, undefined,
      '互审环节：挑一条同事结论开炮或补视角，用你的腔调说，不超过120字。禁止纯附和，禁止复述同事原话。说人话，用大白话，不要生造术语。'
    );
    const msgId = await streamGroupMessage(set, get, expert.id, messages, config, 0.7, '互审中');
    if (msgId) {
      const finalContent = get().currentSession!.groupMessages.find(m => m.id === msgId)?.content || '';
      if (finalContent) {
        appendMemberMemory(set, get, expert.id, 'assistant', finalContent);
      }
    }
    await processQueue(config, set, get);
  }

  // 标记互审完成（断点恢复跳过）
  patchSession(set, get, s => ({ ...s, peerReviewDone: true }));
}

// 第三段：分析 → 请示/汇报
async function runAnalysisPhase(
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<void> {
  setStage(set, get, 'working');

  const tasks = get().currentSession!.tasks;

  // 跑分析任务（串行，依赖调研发现，跳过已完成的）
  const researchResults: ResearchResult[] = get().currentSession!.tasks
    .filter(t => t.type === 'research' && t.result)
    .map(t => t.result as ResearchResult);

  const analysisTasks = tasks.filter(t => t.type === 'analysis');
  for (const task of analysisTasks) {
    if (get().currentSession?.workPaused) return;
    const currentTask = get().currentSession!.tasks.find(t => t.id === task.id)!;
    if (currentTask.status === 'completed') continue;
    try {
      await executeAnalysisTask(currentTask, researchResults, config, set, get);
      await processQueue(config, set, get);
      await maybeColleagueReaction(currentTask, config, set, get);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误';
      log('error', `分析任务失败但继续 (${currentTask.title}): ${msg}`);
      addSystemMessage(set, get, `${currentTask.title} 分析失败：${msg.slice(0, 50)}，其他成员继续`);
    }
  }

  // 分歧处理
  // 暂停检查：分析任务全跑完后，简报/互审/请示入口也要尊重 workPaused
  if (get().currentSession?.workPaused) return;
  await handleConflicts(config, set, get);

  // 互审轮：每个专家对其他人的结论开炮或补视角（只跑一次，断点恢复跳过）
  if (get().currentSession?.workPaused) return;
  if (!get().currentSession!.peerReviewDone) {
    await runPeerReviewRound(config, set, get);
  }

  // 检查 needBossDecision——生成决策卡发到聊天流（成员先说一句话引出，再出卡）
  if (get().currentSession?.workPaused) return;
  const needBossQuestions = collectNeedBossDecisions(get().currentSession!);
  if (needBossQuestions.length > 0) {
    for (const q of needBossQuestions) {
      const expert = get().currentSession!.experts.find(e => e.name === q.expertName);
      if (!expert) continue;

      // a. 成员在群里说一句话引出问题
      await maybeCompactMemberMemory(set, get, config, expert.id);
      appendMemberMemory(set, get, expert.id, 'user', `【系统提示】你的分析结论里有问题需要老板定夺：\n${q.question}\n请在群里简短说一句引出这个问题。`);
      const session = get().currentSession!;
      const messages = buildMemberContext(
        session, expert.id,
        undefined, undefined,
        '你有一个关键问题需要老板定夺。在群里用你的腔调简短说一句引出这个问题，不要列选项，就问他。'
      );
      const msgId = await streamGroupMessage(set, get, expert.id, messages, config, 0.7, '正在请示');
      if (msgId) {
        const finalContent = get().currentSession!.groupMessages.find(m => m.id === msgId)?.content || '';
        if (finalContent) {
          appendMemberMemory(set, get, expert.id, 'assistant', finalContent);
        }
      }

      // b. 生成决策卡选项（PM 基于问题和项目背景生成 2-3 个选项）
      try {
        const decisionData = await callJsonLLM(
          getDecisionCardPrompt(q.question, get().currentSession!.idea, expert.name),
          config, 0.2,
          parseDecisionCardResult
        );
        // c. 发 kind='decision' 群消息（UI 渲染为 radio 卡）
        addGroupMessage(set, get, {
          id: `msg-decision-${Date.now()}-${Math.random()}`,
          authorId: expert.id,
          content: decisionData.question,
          createdAt: new Date(),
          kind: 'decision',
          decisionData: {
            question: decisionData.question,
            options: decisionData.options,
            expertName: expert.name,
          },
        });
      } catch {
        // 决策卡生成失败：成员已经在群里问了，老板自由回答即可
      }
    }
    setStage(set, get, 'pre_report');
    return;
  }

  // 不直接 runReporting，先停住——让老板有机会看结论、@任何人提问
  setStage(set, get, 'pre_report');
  return;
}

// ========== 汇报生成 ==========

// 核心：基于当前 session 生成 Report（runReporting 和 refreshReport 都调它）
// 拆两次调用：A=核心部分（结论/分歧/调研发现/未来推演/验证清单），B=PRD 8字段
async function generateReport(
  session: ProjectSession,
  config: UserConfig,
  get: StoreGet
): Promise<Report> {
  const decisionContext = buildDecisionContext(session);
  const bossInterruptions = session.bossInterruptions.map(i => i.content);

  const parentReport = session.parentSessionId
    ? get().sessions.find(s => s.id === session.parentSessionId)?.report
    : undefined;

  const promptArgs: [string, string, Expert[], TaskCard[], string, string[], Report | undefined] = [
    session.idea,
    session.domain,
    session.experts,
    session.tasks,
    decisionContext,
    bossInterruptions,
    parentReport,
  ];

  // 调用A：核心部分
  let core = await callJsonLLM(
    getReportCorePrompt(...promptArgs),
    config, 0.2,
    parseReportCoreResult
  );
  // 空字段防御：coreJudgment 或 teamDisagreement 空 → 重试A一次
  if (!core.conclusion.coreJudgment.trim() || !core.teamDisagreement.trim()) {
    log('error', '[generateReport] 调用A核心字段为空，重试一次', {
      coreJudgmentEmpty: !core.conclusion.coreJudgment.trim(),
      teamDisagreementEmpty: !core.teamDisagreement.trim(),
    });
    core = await callJsonLLM(
      getReportCorePrompt(...promptArgs),
      config, 0.2,
      parseReportCoreResult
    );
  }
  if (!core.conclusion.coreJudgment.trim()) {
    log('error', '[generateReport] 调用A重试后 coreJudgment 仍空');
    core.conclusion.coreJudgment = '（生成失败，请点更新汇报重试）';
  }
  if (!core.teamDisagreement.trim()) {
    log('error', '[generateReport] 调用A重试后 teamDisagreement 仍空');
    core.teamDisagreement = '（生成失败，请点更新汇报重试）';
  }

  // 调用B：PRD
  let prd = await callJsonLLM(
    getReportPRDPrompt(...promptArgs),
    config, 0.2,
    parseReportPRDResult
  );
  // 空字段防御：PRD 任一字段空 → 重试B一次
  const prdFields: (keyof PRD)[] = [
    'problem', 'targetUser', 'solution', 'coreFeatures',
    'technicalFeasibility', 'businessModel', 'futureEvolution', 'nextStep',
  ];
  const hasEmptyPrdField = prdFields.some(f => !prd[f].trim());
  if (hasEmptyPrdField) {
    log('error', '[generateReport] 调用B PRD 有空字段，重试一次', {
      emptyFields: prdFields.filter(f => !prd[f].trim()),
    });
    prd = await callJsonLLM(
      getReportPRDPrompt(...promptArgs),
      config, 0.2,
      parseReportPRDResult
    );
  }
  prdFields.forEach(f => {
    if (!prd[f].trim()) {
      log('error', `[generateReport] 调用B重试后 PRD.${f} 仍空`);
      prd[f] = '（生成失败，请点更新汇报重试）';
    }
  });

  return { ...core, prd };
}

async function runReporting(
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<void> {
  setStage(set, get, 'reporting');

  const current = get().currentSession!;
  const report = await generateReport(current, config, get);

  patchSession(set, get, s => ({ ...s, report }));
  setStage(set, get, 'done');
  set({ currentExpertName: null, currentTaskTitle: null });

  // 组长在群里说核心结论 + 发报告封面卡
  const leader = current.experts.find(e => e.title.includes('产品')) || current.experts[0];
  if (leader) {
    try {
      await maybeCompactMemberMemory(set, get, config, leader.id);
      const session2 = get().currentSession!;
      const messages = buildMemberContext(
        session2, leader.id, undefined, undefined,
        `汇报写好了。你在群里用一两句话说核心结论（${report.conclusion.decision}：${report.conclusion.coreJudgment}）。简短人话，不要分点列。`
      );
      const msgId = await streamGroupMessage(set, get, leader.id, messages, config, 0.7, '正在说核心结论');
      if (msgId) {
        const finalContent = get().currentSession!.groupMessages.find(m => m.id === msgId)?.content || '';
        if (finalContent) {
          appendMemberMemory(set, get, leader.id, 'assistant', finalContent);
        }
      }
    } catch {
      // 通知失败不影响主流程
    }

    // 发报告封面卡（标题、判决徽章、三个关键数字），点卡开右侧报告抽屉
    const keyNumbers = [
      `${current.experts.length} 位评审`,
      `${report.researchFindings.sources.length} 条来源`,
      `${report.validationChecklist.length} 项待验证`,
    ];
    addGroupMessage(set, get, {
      id: `msg-report-cover-${Date.now()}`,
      authorId: leader.id,
      content: report.conclusion.coreJudgment,
      createdAt: new Date(),
      kind: 'report-cover',
      reportCoverData: {
        decision: report.conclusion.decision,
        coreJudgment: report.conclusion.coreJudgment,
        keyNumbers,
      },
    });
  }

  // 汇报期间老板说的话之前石沉大海，这里补一次队列消费
  await processQueue(config, set, get);
}

// ========== 调度模型 + 工具集（v2） ==========

// 工具阶段白名单：标注每个工具仅允许在哪些阶段执行
// update_plan / update_premise 限制在 plan_approval（含 clarifying）——
// 否则 briefing/pre_report/done 阶段老板一句"分工不合理"会覆盖已完成任务、阶段倒退、调研成果全丢
const TOOL_STAGE_WHITELIST: Record<string, ProjectStatus[]> = {
  update_plan: ['plan_approval', 'clarifying'],
  update_premise: ['plan_approval', 'clarifying'],
};

// 工具执行分发：根据工具名调对应实现
async function executeTool(
  call: ToolCall,
  ctx: ScheduleContext,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<ToolResult> {
  const allowed = TOOL_STAGE_WHITELIST[call.tool];
  if (allowed && !allowed.includes(ctx.stage as ProjectStatus)) {
    log('schedule', `executeTool 拒绝：${call.tool} 不允许在 ${ctx.stage} 阶段执行`);
    return {
      feedBack: false,
      speechAlreadyGenerated: false,
      error: `${call.tool} 只能在分工待批示阶段用，现在不是时候`,
    };
  }
  switch (call.tool) {
    case 'proceed':
      return await tool_proceed(ctx, config, set, get);
    case 'reexamine':
      return await tool_reexamine(call, ctx, config, set, get);
    case 'update_plan':
      return await tool_update_plan(call, ctx, config, set, get);
    case 'refresh_report':
      return await tool_refresh_report(ctx, config, set, get);
    case 'pause_work':
      return await tool_pause_work(ctx, config, set, get);
    case 'resume_work':
      return await tool_resume_work(ctx, config, set, get);
    case 'assign_research':
      return await tool_assign_research(call, ctx, config, set, get);
    case 'update_premise':
      return await tool_update_premise(call, ctx, config, set, get);
    default:
      log('schedule', `executeTool: 工具未实现 ${call.tool}`);
      return { feedBack: false, speechAlreadyGenerated: false, error: `工具未实现: ${call.tool}` };
  }
}

// proceed：放行当前停顿点，按 stage 分发到 runResearchPhase/runAnalysisPhase/runReporting
async function tool_proceed(
  ctx: ScheduleContext,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<ToolResult> {
  const stage = ctx.stage;
  log('schedule', `tool_proceed: stage=${stage}`);
  try {
    if (stage === 'clarifying') {
      await runFromPlanning(config, set, get);
      return { feedBack: false, speechAlreadyGenerated: false };
    }
    if (stage === 'plan_approval') {
      await runResearchPhase(config, set, get);
      return { feedBack: false, speechAlreadyGenerated: false };
    }
    if (stage === 'briefing') {
      await runAnalysisPhase(config, set, get);
      return { feedBack: false, speechAlreadyGenerated: false };
    }
    if (stage === 'pre_report') {
      await runReporting(config, set, get);
      return { feedBack: false, speechAlreadyGenerated: false };
    }
    return { feedBack: false, speechAlreadyGenerated: false, error: `proceed 在阶段 ${stage} 无意义` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { feedBack: false, speechAlreadyGenerated: false, error: `proceed 失败: ${msg}` };
  }
}

// handleMemberReply：路由器决定某成员接话后，调用此函数让成员用完整上下文回复
// 老板原话一字不改进入该成员的上下文，成员自己决定怎么反应
async function handleMemberReply(
  expertId: string,
  bossInput: string,
  quotedContext: string | undefined,
  bossMsgId: string | undefined,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<void> {
  const session = get().currentSession!;
  const expert = session.experts.find(e => e.id === expertId);
  if (!expert) {
    log('error', `handleMemberReply: 找不到成员 ${expertId}`);
    return;
  }

  log('schedule', `handleMemberReply: expert=${expert.name}, bossInput="${bossInput.slice(0, 30)}..."`);

  const analysisTask = session.tasks.find(t => t.expertId === expertId && t.type === 'analysis');
  const researchTask = !analysisTask ? session.tasks.find(t => t.expertId === expertId && t.type === 'research') : undefined;

  try {
    if (analysisTask) {
      await handleExplain(expert, analysisTask, bossInput, config, set, get, bossMsgId, quotedContext);
    } else if (researchTask) {
      await handleExplain(expert, researchTask, bossInput, config, set, get, bossMsgId, quotedContext);
    } else {
      await handleExplainNoTask(expert, bossInput, config, set, get, bossMsgId, quotedContext);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    addSystemMessage(set, get, `${expert.name} 回复失败：${msg}`);
  }
}

// reexamine：基于证据复核，有新证据才许改口（抗迎合硬校验在 handleReinvestigate/handleResearchReinvestigate 内部）
// 复用 handleReinvestigate（有 analysis 任务卡）/ handleResearchReinvestigate（只有 research 任务卡）
async function tool_reexamine(
  call: ToolCall,
  ctx: ScheduleContext,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<ToolResult> {
  const expertId = String(call.args.expertId || ctx.mentionTargetId || '');
  if (!expertId) {
    return { feedBack: false, speechAlreadyGenerated: false, error: 'reexamine 缺少 expertId' };
  }

  const session = get().currentSession!;
  const expert = session.experts.find(e => e.id === expertId);
  if (!expert) {
    return { feedBack: false, speechAlreadyGenerated: false, error: `reexamine: 找不到成员 ${expertId}` };
  }

  const challengedConclusion = String(call.args.challengedConclusion || '');
  const challengePoint = String(call.args.challengePoint || '');
  const question = challengePoint || challengedConclusion || ctx.bossInput;
  const quotedContext = ctx.quotedContext;

  const analysisTask = session.tasks.find(t => t.expertId === expertId && t.type === 'analysis');
  const researchTask = !analysisTask ? session.tasks.find(t => t.expertId === expertId && t.type === 'research') : undefined;

  log('schedule', `tool_reexamine: expert=${expert.name}, hasAnalysis=${!!analysisTask}, hasResearch=${!!researchTask}`);

  try {
    if (analysisTask) {
      await handleReinvestigate(expert, analysisTask, question, config, set, get, undefined, quotedContext);
    } else if (researchTask) {
      await handleResearchReinvestigate(expert, researchTask, question, config, set, get, undefined, quotedContext);
    } else {
      // 没任务卡，降级为直接答复
      await handleExplainNoTask(expert, question, config, set, get, undefined, quotedContext);
    }
    // feedBack=true：重查可能产生新结论，喂回模型让它决定是否调 refresh_report
    return { feedBack: true, speechAlreadyGenerated: true, summary: `${expert.name} 重查完成` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { feedBack: false, speechAlreadyGenerated: false, error: `reexamine 失败: ${msg}` };
  }
}

// update_plan：按老板意见重排分工，出新方案卡，回 plan_approval
// 复用 revisePlan 核心逻辑，去掉预写台词（调度模型已生成 speech）
async function tool_update_plan(
  call: ToolCall,
  ctx: ScheduleContext,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<ToolResult> {
  const feedback = String(call.args.feedback || ctx.bossInput || '');
  if (!feedback) {
    return { feedBack: false, speechAlreadyGenerated: false, error: 'update_plan 缺少 feedback' };
  }

  const current = get().currentSession!;
  const leader = current.experts.find(e => e.title.includes('产品')) || current.experts[0];

  // 调度模型已生成 speech（组长承接），不预写台词
  setTyping(set, leader?.id || 'system', '在改分工');
  setStage(set, get, 'planning');

  try {
    const decisionContext = buildDecisionContext(current);
    const taskPlans = await callJsonLLM(
      getPlanningPrompt(
        current.idea,
        current.domain,
        current.risks,
        current.experts,
        decisionContext,
        feedback
      ),
      config, 0.2,
      (text) => parsePlanningResult(text, current.experts)
    );

    const tasks: TaskCard[] = taskPlans.map((p, i) => ({
      id: `task-${Date.now()}-${i}`,
      expertId: p.expertId,
      type: p.type,
      title: p.title,
      description: p.description,
      status: 'pending' as const,
    }));

    patchSession(set, get, s => ({ ...s, tasks }));

    clearTyping(set);
    // 重新分工后组长在群里说一句人话 + 发结构化分工卡
    if (leader) {
      try {
        await maybeCompactMemberMemory(set, get, config, leader.id);
        const session2 = get().currentSession!;
        const messages = buildMemberContext(
          session2, leader.id, undefined, undefined,
          '你刚按老板的意见调了分工。在群里用一两句话说一下改了什么大意，告诉老板分工卡在上面，没问题就说一声。简短人话，不要列每个任务。'
        );
        const msgId = await streamGroupMessage(set, get, leader.id, messages, config, 0.7, '正在说调整后分工');
        if (msgId) {
          const finalContent = get().currentSession!.groupMessages.find(m => m.id === msgId)?.content || '';
          if (finalContent) {
            appendMemberMemory(set, get, leader.id, 'assistant', finalContent);
          }
        }
      } catch {
        // 说话失败不影响流程
      }
    }

    // 发结构化分工卡（每人一行：谁/干什么/为什么是他），让老板在聊天流里直接看到调整后的方案
    const planContent = buildPlanCardContent(get().currentSession!);
    addGroupMessage(set, get, {
      id: `msg-plan-${Date.now()}-${Math.random()}`,
      authorId: leader?.id || 'system',
      content: planContent,
      createdAt: new Date(),
      kind: 'plan',
    });
    setStage(set, get, 'plan_approval');
    return { feedBack: false, speechAlreadyGenerated: true };
  } catch (err) {
    clearTyping(set);
    const msg = err instanceof Error ? err.message : '未知错误';
    return { feedBack: false, speechAlreadyGenerated: false, error: `update_plan 失败: ${msg}` };
  }
}

// refresh_report：追问导致结论变化后，刷新报告版本
// 复用 refreshReport action 核心逻辑，去掉 setStage（scheduling 标志位已表示进行中）
async function tool_refresh_report(
  ctx: ScheduleContext,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<ToolResult> {
  void ctx;
  const current = get().currentSession!;
  if (!current.report) {
    return { feedBack: false, speechAlreadyGenerated: false, error: 'refresh_report: 当前没有 report' };
  }
  try {
    // 1. 旧版本归档
    const oldReport = current.report;
    const currentVersionNum = current.reportVersions.length > 0
      ? bumpVersion(current.reportVersions[current.reportVersions.length - 1].version)
      : '1.0';
    const revisedTasks = current.tasks.filter(t => t.revised);
    const changeSummary = revisedTasks.length > 0
      ? revisedTasks.map(t => {
          const expert = current.experts.find(e => e.id === t.expertId);
          const r = t.result as AnalysisResult;
          return `${expert?.name || '成员'}：${r.oneLiner}（${r.verdict}）`;
        }).join('；')
      : '结论未变化';
    const oldVersionEntry: ReportVersion = {
      version: currentVersionNum,
      report: oldReport,
      createdAt: new Date(),
      changeSummary,
    };
    // 2. 重新生成
    const freshSession = get().currentSession!;
    const newReport = await generateReport(freshSession, config, get);
    // 3. 写回
    patchSession(set, get, s => ({
      ...s,
      report: newReport,
      reportVersions: [...s.reportVersions, oldVersionEntry],
      reportStale: false,
    }));
    return { feedBack: false, speechAlreadyGenerated: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { feedBack: false, speechAlreadyGenerated: false, error: `refresh_report 失败: ${msg}` };
  }
}

// pause_work：当前步骤后暂停所有任务
async function tool_pause_work(
  ctx: ScheduleContext,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<ToolResult> {
  void ctx; void config;
  patchSession(set, get, s => ({ ...s, workPaused: true }));
  log('schedule', 'tool_pause_work: workPaused=true');
  return { feedBack: false, speechAlreadyGenerated: false };
}

// resume_work：恢复暂停的任务，有未完成则继续跑
async function tool_resume_work(
  ctx: ScheduleContext,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<ToolResult> {
  void ctx;
  patchSession(set, get, s => ({ ...s, workPaused: false }));
  log('schedule', 'tool_resume_work: workPaused=false');
  try {
    const session = get().currentSession!;
    if (session.stage === 'working') {
      const hasPendingResearch = session.tasks.some(t => t.type === 'research' && t.status !== 'completed');
      const hasPendingAnalysis = session.tasks.some(t => t.type === 'analysis' && t.status !== 'completed');
      if (hasPendingResearch) {
        await runResearchPhase(config, set, get);
      } else if (hasPendingAnalysis) {
        await runAnalysisPhase(config, set, get);
      } else if (!session.peerReviewDone) {
        // 分析全跑完但互审没跑完（暂停在互审环节）：续跑互审 + 后续请示
        await runPeerReviewRound(config, set, get);
        if (get().currentSession?.workPaused) return { feedBack: false, speechAlreadyGenerated: false };
        // 互审跑完后继续请示流程
        await runAnalysisPhase(config, set, get);
      }
    }
    return { feedBack: false, speechAlreadyGenerated: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { feedBack: false, speechAlreadyGenerated: false, error: `resume_work 失败: ${msg}` };
  }
}

// assign_research：给某成员派新调研任务
async function tool_assign_research(
  call: ToolCall,
  ctx: ScheduleContext,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<ToolResult> {
  const expertId = String(call.args.expertId || ctx.mentionTargetId || '');
  if (!expertId) {
    return { feedBack: false, speechAlreadyGenerated: false, error: 'assign_research 缺少 expertId' };
  }
  const direction = String(call.args.direction || ctx.bossInput || '');
  if (!direction) {
    return { feedBack: false, speechAlreadyGenerated: false, error: 'assign_research 缺少 direction' };
  }
  const session = get().currentSession!;
  const expert = session.experts.find(e => e.id === expertId);
  if (!expert) {
    return { feedBack: false, speechAlreadyGenerated: false, error: `assign_research: 找不到成员 ${expertId}` };
  }
  log('schedule', `tool_assign_research: expert=${expert.name}, direction=${direction.slice(0, 30)}`);
  try {
    const newTask: TaskCard = {
      id: `task-${Date.now()}-${Math.random()}`,
      expertId,
      type: 'research',
      title: direction.slice(0, 50),
      description: direction,
      status: 'pending' as const,
    };
    patchSession(set, get, s => ({ ...s, tasks: [...s.tasks, newTask] }));
    await executeResearchTask(newTask, config, set, get);
    return { feedBack: true, speechAlreadyGenerated: true, summary: `${expert.name} 调研完成` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { feedBack: false, speechAlreadyGenerated: false, error: `assign_research 失败: ${msg}` };
  }
}

// update_premise：老板纠正了想法本身，更新前提 + 标所有任务需复核
// 不重排分工——分工失效由调度模型接着调 update_plan 处理
async function tool_update_premise(
  call: ToolCall,
  ctx: ScheduleContext,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<ToolResult> {
  void config;
  // 参数名统一为 newPremise（与 scheduler.ts 工具描述一致），兼容旧调用读 newIdea
  const newPremise = String(call.args.newPremise || call.args.newIdea || ctx.bossInput || '');
  if (!newPremise) {
    return { feedBack: false, speechAlreadyGenerated: false, error: 'update_premise 缺少 newPremise' };
  }
  log('schedule', `tool_update_premise: newPremise=${newPremise.slice(0, 30)}`);
  try {
    patchSession(set, get, s => ({
      ...s,
      idea: newPremise,
      tasks: s.tasks.map(t => ({
        ...t,
        status: 'pending' as const,
        result: undefined,
        revised: false,
      })),
    }));
    setStage(set, get, 'plan_approval');
    return { feedBack: false, speechAlreadyGenerated: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { feedBack: false, speechAlreadyGenerated: false, error: `update_premise 失败: ${msg}` };
  }
}

// 调度循环主体：模型→工具→结果→模型，上限5轮
// 不持锁、不 drain —— 由 processQueue 持锁调用
// bossMsgId 一路传下去，routeTo 成员接话时用作 replyToId（修 P1-10 d 回复链错乱）
async function runScheduleRound(
  content: string,
  quotedContext: string | undefined,
  mentionTargetId: string | undefined,
  config: UserConfig,
  set: StoreSet,
  get: StoreGet,
  bossMsgId?: string
): Promise<void> {
  const current = get().currentSession;
  if (!current) return;

  const leader = current.experts.find(e => e.title.includes('产品')) || current.experts[0];

  try {
    setTyping(set, leader?.id || 'system', '在想你的话');

    let lastToolResults: ToolResult[] | undefined;
    let bossInput = content;
    let quoted = quotedContext;
    let mention = mentionTargetId;
    let replyToId = bossMsgId;

    for (let round = 1; round <= 5; round++) {
      const freshSession = get().currentSession!;
      const recentMessages = freshSession.groupMessages.slice(-20);

      const ctx: ScheduleContext = {
        idea: freshSession.idea,
        stage: String(freshSession.stage || get().status),
        experts: freshSession.experts,
        tasks: freshSession.tasks,
        recentMessages,
        bossInput,
        quotedContext: quoted,
        mentionTargetId: mention,
        lastToolResults,
        round,
      };

      log('schedule', `scheduleLoop round=${round}, bossInput="${bossInput.slice(0, 30)}"`);

      const result: ScheduleResult = await callJsonLLM(
        getSchedulePrompt(ctx),
        config, 0.2,
        parseScheduleResult
      );

      log('schedule', `scheduleLoop round=${round}, routeTo=${JSON.stringify(result.routeTo)}, reason=${result.reason}, tools=${result.toolCalls.length}`);

      // 记调度日志（落盘，设置页可查）—— 先记空 toolResults，执行后回填
      // scheduleHistory 环形上限 50 条，控制 localStorage 体积（P0-6）
      const logEntry: ScheduleLogEntry = {
        round,
        bossInput,
        routeTo: result.routeTo,
        reason: result.reason,
        toolCalls: result.toolCalls,
        toolResults: [],
        at: new Date(),
      };
      patchSession(set, get, s => ({
        ...s,
        scheduleHistory: [...(s.scheduleHistory || []), logEntry].slice(-50),
      }));

      // 执行工具调用（先执行工具，再让成员接话——因为工具可能改变状态）
      const toolResults: ToolResult[] = [];
      for (const tc of result.toolCalls) {
        log('schedule', `executeTool: ${tc.tool}, args=${JSON.stringify(tc.args).slice(0, 80)}`);
        const toolResult = await executeTool(tc, ctx, config, set, get);
        toolResults.push(toolResult);
      }

      // 回填日志的 toolResults
      patchSession(set, get, s => ({
        ...s,
        scheduleHistory: s.scheduleHistory!.map((e, i) =>
          i === s.scheduleHistory!.length - 1 ? { ...e, toolResults } : e
        ),
      }));

      // 让 routeTo 里的成员串行接话（老板原话直达，成员自己决定怎么反应）
      // replyToId 取本次老板消息 id（一路从队列项传下来），不是"最后一条消息"
      if (result.routeTo.length > 0 && bossInput) {
        clearTyping(set);
        for (const memberId of result.routeTo) {
          await handleMemberReply(memberId, bossInput, quoted, replyToId, config, set, get);
        }
      }

      // 没有需要喂回的工具结果：循环结束
      const hasFeedBack = toolResults.some(r => r.feedBack);
      if (!hasFeedBack) {
        break;
      }

      // 有 feedBack：喂回模型，进入下一轮
      lastToolResults = toolResults;
      bossInput = '';  // 下一轮没有新的老板输入
      quoted = undefined;
      mention = undefined;
      replyToId = undefined;  // 后续轮次不再带 replyToId

      // 第5轮还在调工具：强制结束，组长自然收尾
      if (round === 5) {
        const freshSession = get().currentSession!;
        const freshLeader = freshSession.experts.find(e => e.title.includes('产品')) || freshSession.experts[0];
        if (freshLeader) {
          try {
            const recentMsgs = freshSession.groupMessages
              .filter(m => m.authorId !== 'system')
              .slice(-6)
              .map(m => {
                const author = m.authorId === 'boss' ? '老板' : freshSession.experts.find(e => e.id === m.authorId)?.name || '成员';
                return `${author}：${m.content.slice(0, 80)}`;
              })
              .join('\n');
            const wrapUp = await callLLM(
              `你是项目组长${freshLeader.name}。团队刚讨论了几个来回，现在该自然收尾了。\n\n【群里最近说的】\n${recentMsgs}\n\n用一句话收尾，像在群里说话，不超过20字。不要说"老板您看"这种客套话。直接输出那句话。`,
              config, 0.6
            );
            addGroupMessage(set, get, {
              id: `msg-${freshLeader.id}-${Date.now()}-${Math.random()}`,
              authorId: freshLeader.id,
              content: wrapUp.trim().slice(0, 50),
              createdAt: new Date(),
            });
          } catch {
            // LLM 失败就不说了，不硬凑
          }
        }
        break;
      }
    }

    clearTyping(set);
  } catch (err) {
    clearTyping(set);
    const msg = err instanceof Error ? err.message : '未知错误';
    log('error', `scheduleLoop 失败: ${msg}`);
    throw err;  // 让 processQueue 决定标 consumed 和发系统消息
  }
}

// 持锁消费队列：循环消费直到队列空。支持嵌套（已持锁时直接消费）
// 消除三连丢消息：a) 停顿点不再直调，全入队；b) 处理成功才标 consumed；c) 锁覆盖消费全程
async function processQueue(
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<void> {
  if (get().scheduling) {
    // 已持锁（任务边界场景）：嵌套消费，不重新持锁
    await consumeQueueOnce(config, set, get);
    return;
  }
  set({ scheduling: true });
  try {
    await consumeQueueOnce(config, set, get);
  } finally {
    set({ scheduling: false });
  }
}

// 消费队列一轮：处理成功才标 consumed（失败也标，避免 poison queue 死循环，但发系统消息）
async function consumeQueueOnce(
  config: UserConfig,
  set: StoreSet,
  get: StoreGet
): Promise<void> {
  while (true) {
    const current = get().currentSession;
    if (!current) return;
    const pending = (current.bossInterruptions || []).filter(i => !i.consumed);
    if (pending.length === 0) return;
    const qi = pending[0];
    log('schedule', `consumeQueueOnce: 消费排队插话 "${qi.content.slice(0, 30)}"`);
    try {
      await runScheduleRound(qi.content, qi.quotedContext, qi.mentionTargetId, config, set, get, qi.bossMsgId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误';
      log('error', `consumeQueueOnce 失败: ${msg}`);
      addSystemMessage(set, get, `没接上你的话：${msg.slice(0, 50)}，再发一次`);
    }
    // 无论成功失败都标 consumed（失败时避免 poison queue 死循环）
    patchSession(set, get, s => ({
      ...s,
      bossInterruptions: s.bossInterruptions.map(i =>
        i === qi ? { ...i, consumed: true } : i
      ),
    }));
  }
}

// ========== Store ==========

export const useProjectStore = create<ProjectState>((set, get) => ({
  config: createDefaultUserConfig(),
  configLoaded: false,

  currentSession: null,
  status: 'idle',
  error: '',
  currentExpertName: null,
  currentDistillingExpert: null,
  distillProgress: null,
  currentTaskTitle: null,
  typing: null,
  scheduling: false,

  sessions: [],

  loadConfigFromStorage: () => {
    const config = loadConfig();
    set({ config, configLoaded: true });
  },

  // 更新某服务商档案的部分字段；改的是 activeProvider 且 modelName 变了则清人物卡缓存
  updateProviderConfig: (providerId: ProviderId, patch: Partial<ProviderConfig>) => {
    const { config } = get();
    const oldProvider = config.providers[providerId];
    const newProvider: ProviderConfig = { ...oldProvider, ...patch };
    const newConfig: UserConfig = {
      ...config,
      providers: { ...config.providers, [providerId]: newProvider },
    };
    saveConfig(newConfig);
    set({ config: newConfig });
    if (
      providerId === config.activeProvider &&
      patch.modelName !== undefined &&
      patch.modelName !== oldProvider.modelName
    ) {
      clearPersonaCache();
    }
  },

  // 切换激活服务商；换服务商模型肯定变了，清人物卡缓存
  switchProvider: (providerId: ProviderId) => {
    const { config } = get();
    if (providerId === config.activeProvider) return;
    const newConfig: UserConfig = { ...config, activeProvider: providerId };
    saveConfig(newConfig);
    set({ config: newConfig });
    clearPersonaCache();
  },

  // 更新 Tavily key（仍在 UserConfig 顶层）
  updateTavilyKey: (key: string) => {
    const { config } = get();
    const newConfig: UserConfig = { ...config, tavilyApiKey: key };
    saveConfig(newConfig);
    set({ config: newConfig });
  },

  loadSessionsFromStorage: () => {
    const sessions = loadSessions();
    set({ sessions });
  },

  resetProject: () => {
    // 递增 generation 作废所有在途异步（startProject/retryStep 等）
    ++sessionGeneration;
    set({
      currentSession: null,
      status: 'idle',
      error: '',
      currentExpertName: null,
      currentDistillingExpert: null,
      currentTaskTitle: null,
    });
  },

  startProject: async (idea: string) => {
    // 防重入：已在立项/PM 判断阶段时，忽略重复交办
    const curStatus = get().status;
    if (curStatus === 'planning' || curStatus === 'clarifying') {
      log('stage', `startProject 防重入：当前 status=${curStatus}，忽略重复调用`);
      return;
    }

    const { config } = get();
    if (!hasActiveProviderConfig(config)) {
      set({ error: '请先配置 API Key' });
      return;
    }

    // 登记 generation，所有 await 后校验它仍然有效
    const myGen = ++sessionGeneration;

    const sessionId = `session-${Date.now()}`;
    const ideaId = `idea-${Date.now()}`;

    const session: ProjectSession = {
      id: sessionId,
      ideaId,
      idea,
      domain: '其他',
      risks: [],
      experts: [],
      tasks: [],
      groupMessages: [],
      bossInterruptions: [],
      reportVersions: [],
      stage: 'planning',
      memberMemories: {},
      createdAt: new Date(),
    };

    set({
      currentSession: session,
      status: 'planning',
      error: '',
      currentExpertName: null,
      currentDistillingExpert: null,
      currentTaskTitle: null,
    });

    try {
      // === 领域识别 ===
      const { domain, risks } = await callJsonLLM(
        getDomainIdentificationPrompt(idea),
        config, 0.2,
        parseDomainResult
      );
      if (myGen !== sessionGeneration) return;  // 被新的 startProject/resetProject 作废
      patchSession(set, get, s => ({ ...s, domain, risks }));
      addSystemMessage(set, get, `认出来这是「${domain}」的活`);

      // === 组专家 ===
      const experts = await callJsonLLM(
        getExpertGenerationPrompt(idea, domain, risks),
        config, 0.2,
        parseExpertResult
      );
      if (myGen !== sessionGeneration) return;
      patchSession(set, get, s => ({ ...s, experts }));

      // === 蒸馏人物卡（串行，逐个显示进度 X/N；cache 命中瞬间跳过） ===
      const distilledExperts: Expert[] = [];
      for (let idx = 0; idx < experts.length; idx++) {
        const expert = experts[idx];
        set({
          currentDistillingExpert: expert.name,
          distillProgress: { current: idx + 1, total: experts.length },
        });

        let card = loadPersonaCard(expert.name);

        if (!card) {
          const distillPrompt = getPersonaDistillationPrompt(expert.name, expert.title);
          card = await callLLM(distillPrompt, config);
          if (myGen !== sessionGeneration) return;
          savePersonaCard(expert.name, card);
        }

        const displayName = shortenDisplayName(expert.name, card, expert.title);

        distilledExperts.push({
          ...expert,
          name: displayName,
          personaCard: card,
        });
      }

      // 全部蒸馏完后发一条合并的入职消息（不再逐人发）
      addSystemMessage(set, get, `${distilledExperts.map(e => e.name).join('、')} 到位，干活的看家本事备齐了`);

      patchSession(set, get, s => ({ ...s, experts: distilledExperts }));
      set({ currentDistillingExpert: null, distillProgress: null });

      // 保存初始 session
      const savedSessions = addSession(get().currentSession!);
      set({ sessions: savedSessions });

      if (myGen !== sessionGeneration) return;

      // 立项期间老板说的话之前石沉大海，这里补一次队列消费
      await processQueue(config, set, get);
      if (myGen !== sessionGeneration) return;

      // === PM 接活判断 ===
      await runPMOnboarding(config, set, get);
    } catch (err) {
      if (myGen !== sessionGeneration) return;  // 已被作废，错误也不必显示
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      set({ status: 'error', error: errorMsg });
    }
  },

  // 调度模型统一入口：老板任何输入（含点按钮=预填一句话）都走这里
  // 废除"停顿点直调+干活期入队"双轨制，所有输入一律进同一队列，由 processQueue 串行消费
  schedule: (content: string, quotedContext?: string, mentionTargetId?: string) => {
    const current = get().currentSession;
    if (!current) return;
    if (!content.trim()) return;  // 空输入不处理

    const { config } = get();
    const status = get().status;

    // 老板消息立即上屏（id 加随机后缀防同毫秒撞 React key —— P1-10 c）
    const msg: GroupMessage = {
      id: `msg-boss-${Date.now()}-${Math.random()}`,
      authorId: 'boss',
      content,
      createdAt: new Date(),
      ...(mentionTargetId ? { mentionTargetId } : {}),
      ...(quotedContext ? { quotedContext } : {}),
    };
    patchSession(set, get, s => ({
      ...s,
      groupMessages: [...s.groupMessages, msg],
    }));

    log('schedule', `schedule: status=${status}, content="${content.slice(0, 30)}", mention=${mentionTargetId || '无'}`);

    // idle/error 不处理
    if (status === 'idle' || status === 'error') {
      log('schedule', `schedule 不处理: status=${status}`);
      return;
    }

    // 统一入队（双轨制废除）
    const interruption = {
      content,
      consumed: false,
      createdAt: new Date(),
      bossMsgId: msg.id,
      ...(mentionTargetId ? { mentionTargetId } : {}),
      ...(quotedContext ? { quotedContext } : {}),
    };
    patchSession(set, get, s => ({
      ...s,
      bossInterruptions: [...s.bossInterruptions, interruption],
    }));

    // 触发消费（fire-and-forget，UI 不阻塞）
    (async () => {
      await processQueue(config, set, get);
    })();
  },

  // 决策卡答题：把答案写进消息的 decisionData.answered 并持久化，再走调度
  answerDecision: (messageId: string, answer: string) => {
    // 先把答案持久化到该消息的 decisionData.answered，刷新后仍显示已答
    patchSession(set, get, s => ({
      ...s,
      groupMessages: s.groupMessages.map(m =>
        m.id === messageId && m.decisionData
          ? { ...m, decisionData: { ...m.decisionData, answered: answer } }
          : m
      ),
    }));
    // 答案作为老板消息走调度
    get().schedule(answer);
  },

  restartProject: async (parentId: string) => {
    // 防重入
    const curStatus = get().status;
    if (curStatus === 'planning' || curStatus === 'clarifying') {
      log('stage', `restartProject 防重入：当前 status=${curStatus}，忽略重复调用`);
      return;
    }

    const { config, sessions } = get();
    if (!hasActiveProviderConfig(config)) {
      set({ error: '请先配置 API Key' });
      return;
    }

    const parentSession = sessions.find(s => s.id === parentId);
    if (!parentSession) {
      set({ error: '找不到原项目' });
      return;
    }

    // 登记 generation
    const myGen = ++sessionGeneration;

    const newSessionId = `session-${Date.now()}`;
    const newSession: ProjectSession = {
      id: newSessionId,
      ideaId: parentSession.ideaId,
      idea: parentSession.idea,
      domain: parentSession.domain,
      risks: parentSession.risks,
      experts: parentSession.experts,
      tasks: [],
      groupMessages: [],
      bossInterruptions: [],
      reportVersions: [],
      parentSessionId: parentId,
      stage: 'clarifying',
      memberMemories: {},
      createdAt: new Date(),
    };

    set({
      currentSession: newSession,
      status: 'clarifying',
      error: '',
      currentExpertName: null,
      currentDistillingExpert: null,
      currentTaskTitle: null,
    });

    addSession(newSession);
    set({ sessions: loadSessions() });

    try {
      if (myGen !== sessionGeneration) return;
      // 复用专家团，PM 接活判断
      await runPMOnboarding(config, set, get);
    } catch (err) {
      if (myGen !== sessionGeneration) return;
      set({ status: 'error', error: err instanceof Error ? err.message : '未知错误' });
    }
  },

  // 断点恢复：从失败的步骤继续，带着已有的调研发现和结论，绝不从头重跑
  retryStep: async () => {
    const { config, currentSession } = get();
    if (!currentSession) return;

    const stage = currentSession.stage;
    set({ error: '' });

    try {
      if (stage === 'clarifying') {
        await runPMOnboarding(config, set, get);
      } else if (stage === 'planning') {
        // 立项分工阶段失败：重新跑立项（resume=true 时若已有 tasks 则跳过生成），停在 plan_approval
        await runPlanning(config, set, get, true);
      } else if (stage === 'plan_approval') {
        // 分工已就绪，恢复到等批示状态，不用重跑
        setStage(set, get, 'plan_approval');
      } else if (stage === 'working') {
        // 干活阶段失败：判断在调研还是分析阶段，从断点继续
        const pendingResearch = currentSession.tasks.filter(
          t => t.type === 'research' && t.status !== 'completed'
        );
        if (pendingResearch.length > 0) {
          await runResearchPhase(config, set, get);
        } else {
          await runAnalysisPhase(config, set, get);
        }
      } else if (stage === 'briefing') {
        // 调研完简报已发，恢复到等老板发话状态，不用重跑
        setStage(set, get, 'briefing');
      } else if (stage === 'pre_report') {
        // 分析全跑完的停顿点：恢复到等待老板点要汇报
        setStage(set, get, 'pre_report');
      } else if (stage === 'reporting') {
        await runReporting(config, set, get);
      } else if (stage === 'done') {
        // 已完成：no-op，不回 idle（否则会话悬挂）
      } else {
        set({ status: 'idle' });
      }
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : '未知错误' });
    }
  },

  // 刷新恢复：从档案里加载未完成的 session 到当前
  // 若流水线死在 working/planning/reporting 且有未完成任务，自动续跑；同时把队列里未消费的插话立即调度
  resumeSession: (sessionId: string) => {
    const { sessions } = get();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    // 递增 generation 作废所有在途异步（防止首页"继续上次"时旧 startProject 还在写状态）
    ++sessionGeneration;

    set({
      currentSession: session,
      status: session.stage,
      error: '',
      currentExpertName: null,
      currentDistillingExpert: null,
      currentTaskTitle: null,
    });

    const stage = session.stage;
    const hasUnfinished = session.tasks.some(t => t.status !== 'completed');
    const hasQueued = (session.bossInterruptions || []).some(i => !i.consumed);

    if (stage === 'planning' || (['working', 'reporting'].includes(stage) && hasUnfinished)) {
      log('stage', `resumeSession: 续跑 ${stage} 阶段${hasUnfinished ? '未完成任务' : '（推进到下一阶段）'}`);
      (async () => {
        try {
          await get().retryStep();
          if (get().currentSession?.id !== session.id) return;  // 已被作废
          await processQueue(get().config, set, get);
        } catch (err) {
          if (get().currentSession?.id !== session.id) return;
          const msg = err instanceof Error ? err.message : '未知错误';
          addSystemMessage(set, get, `没接上班：${msg.slice(0, 50)}`);
        }
      })();
    } else if (hasQueued) {
      log('stage', `resumeSession: 消费未消费插话`);
      (async () => {
        await processQueue(get().config, set, get);
      })();
    }
  },
}));
