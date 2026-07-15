// 创意领域类型
export type Domain =
  | '消费硬件'
  | 'AI SaaS'
  | '社交产品'
  | '内容产品'
  | '工具产品'
  | '品牌营销'
  | '教育产品'
  | '金融产品'
  | '游戏产品'
  | '其他';

// 专家：真人方法论载体（保留不动）
export interface Expert {
  id: string;
  name: string;              // 显示名（≤8字短标签，如"硬件系统专家"）
  title: string;             // 团队角色
  background?: string;       // 长背景描述（UI 小字显示）
  focusArea: string;         // 关注范围
  judgmentCriteria: string;  // 判断标准（基于其公开方法论）
  commonObjections: string;  // 常见质疑点
  methodologySource: string; // 方法论来源
  personaCard?: string;      // 人物卡（蒸馏产物，自由文本）
}

// 用户配置：每个服务商一份独立档案（Cherry Studio 风格）
export type ProviderId = 'deepseek' | 'openai' | 'kimi' | 'custom';

export interface ProviderConfig {
  apiKey: string;
  apiBaseUrl: string;
  modelName: string;
}

export interface UserConfig {
  activeProvider: ProviderId;
  providers: Record<ProviderId, ProviderConfig>;
  tavilyApiKey?: string;     // 可选，Tavily 搜索 API key
}

// PRD 8 章节（纯数据结构，嵌入 Report）
export interface PRD {
  problem: string;
  targetUser: string;
  solution: string;
  coreFeatures: string;
  technicalFeasibility: string;
  businessModel: string;
  futureEvolution: string;
  nextStep: string;
}

// ========== 新增：任务/群消息/卡片/汇报 ==========

// 任务类型
export type TaskType = 'research' | 'analysis';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// 任务执行过程的活动记录（时间线，用于工作卡/抽屉可视化）
export interface TaskActivity {
  id: string;
  type: 'thinking' | 'plan' | 'search' | 'read' | 'summarize' | 'analyze';
  label: string;        // 主文本（搜索词/网站标题/想法内容）
  detail?: string;      // 补充（"命中5条"/"提炼出4条发现"）
  url?: string;         // type='read' 时的链接
  status: 'running' | 'done';
  at: Date;
}

// 调研发现
export interface ResearchFinding {
  point: string;            // 一句话要点
  detail: string;           // 展开说明
  sourceIndex?: number;     // 对应 sources 的下标（1-based）
}
export interface ResearchResult {
  summary: string;               // 一段话总述
  findings: ResearchFinding[];   // 3-5 条结构化发现
  dataPoints: string[];          // 带数字的事实清单
  sources: { title: string; url: string; snippet: string }[];
}

// 分析结论
export interface AnalysisResult {
  verdict: 'pass' | 'conditional' | 'fail';  // 我这关：过 / 带条件过 / 过不了
  oneLiner: string;        // 成员自己的一句话结论，≤15字，如"成本是硬伤"
  confidence: number;       // 0-100，仅内部用（重查变化检测），UI 不显示
  findings: string[];       // 最多3条
  biggestRisk: string;
  needBossDecision: string; // 空表示没有
  preconditions?: string[];   // conditional 时的前提（2-3条可验证前提）
  evidenceDelta?: string[];   // 仅重查结果用：这次新获得的证据（空数组=无新证据）
}

// 结论修订记录（点对点追问后重查产生的版本）
export interface ConclusionRevision {
  version: number;          // 1, 2, 3...
  result: AnalysisResult;   // 这一版的结论
  reason: string;           // 为什么改（如"老板提供的 XX 芯片方案成立"）
  revisedAt: Date;
}

// 任务结果联合
export type TaskResult = ResearchResult | AnalysisResult;

// 任务卡
export interface TaskCard {
  id: string;
  expertId: string;
  type: TaskType;
  title: string;
  description: string;
  status: TaskStatus;
  result?: TaskResult;
  searchQueries?: string[];      // 调研任务的搜索词
  searchProgress?: { query: string; resultCount: number }[];
  activities?: TaskActivity[];   // 执行过程时间线（新事实来源，searchProgress 保留给老 UI）
  isModelKnowledge?: boolean;    // 降级标注
  degradeReason?: string;        // 降级原因（未配置key / 搜索失败 / CORS被挡）
  conclusionHistory?: ConclusionRevision[]; // 结论修订历史（仅 analysis 任务有意义）
  revised?: boolean;             // 是否已修订过结论
  rechecked?: boolean;           // 已复查但维持原判
}

// 工作群消息
export interface GroupMessage {
  id: string;
  authorId: string;         // 专家id 或 'boss'
  content: string;          // 短句
  createdAt: Date;
  mentionTargetId?: string; // @了谁，空=对全组
  kind?: 'text' | 'plan' | 'brief' | 'report-notice' | 'work' | 'decision' | 'report-cover';  // 缺省 text
  replyToId?: string;       // 回复哪条消息
  quotedContext?: string;   // 老板质疑时引用的原文片段
  taskId?: string;          // kind='work' 时关联的任务
  decisionData?: DecisionMessageData;   // kind='decision' 时的决策卡数据
  reportCoverData?: ReportCoverData;    // kind='report-cover' 时的报告封面数据
}

// 决策卡消息数据（需要老板做选择时发到聊天流）
export interface DecisionMessageData {
  question: string;              // 一句话说清在决定什么
  options: DecisionOption[];     // 2-3 个选项
  expertName: string;            // 谁提的问题
  answered?: string;             // 老板选的选项 text 或自由输入的话
}

export interface DecisionOption {
  text: string;                  // 选项
  pros: string;                  // 一句话利
  cons: string;                  // 一句话弊
}

// 报告封面卡数据（报告生成后发到聊天流）
export interface ReportCoverData {
  decision: '做' | '不做' | '换个做法';
  coreJudgment: string;          // 核心结论
  keyNumbers: string[];          // 三个关键数字
}

// 拍板卡 / 请示卡
export interface DecisionQuestion {
  question: string;
  options: string[];        // 2-3个选项
  teamPreference: string;   // 团队倾向+理由
}

export interface DecisionCard {
  questions: DecisionQuestion[];
  answers: Record<string, string>; // question → 老板选的选项或自己输入的话
}

// 汇报
export interface Report {
  conclusion: {
    decision: '做' | '不做' | '换个做法';
    confidence: number;     // 0-100
    coreJudgment: string;   // 一句话核心判断
    whyNot?: string;            // 为什么能做/不能做/换做法，2-3句，必须引用具体调研发现或成员结论
    inspiredDirections?: string[]; // 被启发的新方向 2-3条（毙掉或换做法时给）
  };
  teamDisagreement: string;
  researchFindings: {
    competitors: string;
    userPainPoints: string;
    sources: { title: string; url: string }[];
  };
  prd: PRD;
  futureEvolution: {
    threeMonths: string;
    sixMonths: string;
    twelveMonths: string;
  };
  validationChecklist: string[];
}

// 汇报版本（追问重查后结论变化传导到汇报，产生新版本）
export interface ReportVersion {
  version: string;          // "1.0", "1.1"
  report: Report;
  createdAt: Date;
  changeSummary?: string;   // 这一版改了什么
}

// 老板插话
export interface BossInterruption {
  content: string;
  consumed: boolean;
  createdAt: Date;
  mentionTargetId?: string; // @了某成员，点对点追问（done 状态时立即处理，working 状态时走队列）
  quotedContext?: string;   // 老板质疑时引用的原文片段
  bossMsgId?: string;       // 老板群消息 id，供回执/答复带 replyToId
}

// ========== 调度模型 + 工具集（v2） ==========

export type SchedulerTool =
  | 'proceed'
  | 'update_plan'
  | 'update_premise'
  | 'assign_research'
  | 'reexamine'
  | 'pause_work'
  | 'resume_work'
  | 'refresh_report';

export interface ToolCall {
  tool: SchedulerTool;
  args: Record<string, unknown>;
}

export interface ScheduleSpeech {
  expertId: string;
  content: string;
}

// 路由器返回：只决定"谁接话"和"调什么工具"，不再替成员说话
export interface ScheduleResult {
  routeTo: string[];         // 该谁接话（成员 id 数组，串行调用）
  reason: string;            // 为什么让他接
  toolCalls: ToolCall[];
}

// 工具执行结果（工具执行函数返回给 scheduleLoop）
export interface ToolResult {
  feedBack: boolean;               // 是否需要喂回调度模型（如 reexamine 有新结论→模型可决定调 refresh_report）
  speechAlreadyGenerated: boolean; // 工具自己已生成群消息（如 handleReinvestigate 内部 streamGroupMessage）
  summary?: string;                // 喂回模型时的摘要
  error?: string;                  // 失败时喂回模型
}

// 调度日志条目（持久化在 session.scheduleHistory 里）
export interface ScheduleLogEntry {
  round: number;
  bossInput: string;
  routeTo: string[];
  reason: string;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  at: Date;
}

// ========== 成员 agent 记忆（per-member 上下文，跨调用携带） ==========

export interface MemberMessage {
  role: 'user' | 'assistant';     // user=老板/系统喂入的原话, assistant=成员自己说的
  content: string;
  at: Date;
}

export interface MemberMemory {
  messages: MemberMessage[];      // 该成员的对话历史
  summary?: string;               // 滚动摘要（超过 20 条触发，压缩老消息）
}

// ========== 项目会话（替代 DiscussionSession） ==========

export interface ProjectSession {
  id: string;
  ideaId: string;
  idea: string;
  domain: Domain;
  risks: string[];
  experts: Expert[];
  decisionCard?: DecisionCard;    // 拍板卡
  tasks: TaskCard[];
  groupMessages: GroupMessage[];
  bossInterruptions: BossInterruption[];
  askCard?: DecisionCard;         // 请示卡
  report?: Report;
  reportVersions: ReportVersion[]; // 汇报版本历史
  reportStale?: boolean;          // 汇报已过期（成员结论变化但还没更新汇报）
  parentSessionId?: string;       // 再次交办时关联上一版
  stage: ProjectStatus;           // 持久化流水线进度（断点恢复用）
  workPaused?: boolean;           // 干活暂停标志（pause_work / resume_work）
  peerReviewDone?: boolean;       // 互审轮已跑完（断点恢复用，避免重跑）
  scheduleHistory?: ScheduleLogEntry[]; // 调度日志（每轮调度判断）
  memberMemories: Record<string, MemberMemory>; // per-member 记忆（key=expertId）
  createdAt: Date;
}

// ========== 状态机（替代 DiscussionStatus） ==========

export type ProjectStatus =
  | 'idle'
  | 'clarifying'        // PM 接活判断
  | 'planning'          // 立项分工（含领域识别+组专家+蒸馏）
  | 'plan_approval'     // 分工方案已就绪，等老板批示
  | 'working'           // 干活现场
  | 'briefing'          // 调研完组长发简报，等老板发话
  | 'pre_report'        // 分析全跑完，老板可先看结论/点名追问，再点要汇报
  | 'reporting'         // 汇报
  | 'done'
  | 'error';
