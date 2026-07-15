import { useState, useEffect, useRef, useMemo } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { cn } from "@/lib/utils";
import {
  Send, AlertCircle, RotateCcw, KeyRound, Loader2,
  FileText, Users, MessageSquare,
  Search, TrendingUp, TrendingDown, MinusCircle, Copy, Check,
  Briefcase, AtSign, History, RefreshCw, ChevronDown, ChevronRight,
  X, ExternalLink, Quote, ClipboardList, Sparkles, Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type {
  TaskCard, Expert, GroupMessage, Report,
  ResearchResult, AnalysisResult, ProjectSession, ReportVersion,
  ProjectStatus, TaskActivity, DecisionMessageData, UserConfig,
} from "@/lib/types";
import { hasActiveProviderConfig, callLLM } from "@/lib/llm";
import { getSmartReplyPrompt, parseSmartReplyResult } from "@/lib/prompts";
import { useEscClose } from "@/hooks/useEscClose";

export default function ProjectPage() {
  const [input, setInput] = useState(() => {
    try { return sessionStorage.getItem('pm_draft_idea') || ''; } catch { return ''; }
  });
  const [bossInput, setBossInput] = useState("");
  const [mentionTargetId, setMentionTargetId] = useState<string | null>(null);
  const [mentionHint, setMentionHint] = useState<string | null>(null);
  const [quotedContext, setQuotedContext] = useState<string | null>(null);
  const [drawerMemberId, setDrawerMemberId] = useState<string | null>(null);
  const [showReportDrawer, setShowReportDrawer] = useState(false);
  const [ideaExpanded, setIdeaExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // 首页想法草稿持久化到 sessionStorage（关页/刷新不丢）
  useEffect(() => {
    try { sessionStorage.setItem('pm_draft_idea', input); } catch { /* ignore */ }
  }, [input]);

  // toast 自动消失
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const {
    currentSession, status, error, currentExpertName, currentDistillingExpert,
    distillProgress,
    currentTaskTitle, config, configLoaded, sessions, typing, scheduling,
    startProject, resetProject, loadConfigFromStorage, loadSessionsFromStorage,
    retryStep, resumeSession,
    schedule, answerDecision,
  } = useProjectStore();

  useEffect(() => {
    if (!configLoaded) loadConfigFromStorage();
    loadSessionsFromStorage();
  }, [configLoaded, loadConfigFromStorage, loadSessionsFromStorage]);

  // 监听 localStorage 写入失败（配额满 / 隐私模式），显示顶部提示条
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    const handler = () => setStorageError(true);
    window.addEventListener('storage-write-failed', handler);
    return () => window.removeEventListener('storage-write-failed', handler);
  }, []);

  const isIdle = status === "idle";

  const unfinishedSession = sessions.find(s =>
    s.stage !== 'done' && s.stage !== 'idle' && (!currentSession || s.id !== currentSession.id)
  );

  const handleSubmit = () => {
    if (!input.trim()) return;
    if (submitting) return;
    if (!hasActiveProviderConfig(config)) {
      navigate("/settings");
      return;
    }
    setSubmitting(true);
    startProject(input.trim()).finally(() => setSubmitting(false));
  };

  const parseMention = (content: string): string | undefined => {
    if (!content.startsWith("@")) return undefined;
    const spaceIdx = content.indexOf(" ");
    if (spaceIdx === -1) return undefined;
    const nameToken = content.slice(1, spaceIdx).trim();
    if (!nameToken) return undefined;
    const experts = currentSession?.experts || [];
    const exact = experts.find(e => e.name === nameToken || e.title === nameToken);
    if (exact) return exact.id;
    const fuzzy = experts.find(e =>
      e.name.includes(nameToken) || nameToken.includes(e.name) ||
      (e.title && (e.title.includes(nameToken) || nameToken.includes(e.title)))
    );
    return fuzzy?.id;
  };

  const handleMentionSelect = (expertId: string, expertName: string) => {
    setMentionTargetId(expertId);
    setBossInput(`@${expertName} `);
    setMentionHint(null);
    inputRef.current?.focus();
  };

  const handleOpenMemberDetail = (expertId: string) => {
    setDrawerMemberId(expertId);
  };

  const handleChallenge = (expertId: string, expertName: string, contextText: string) => {
    setMentionTargetId(expertId);
    setQuotedContext(contextText);
    setBossInput(`@${expertName} `);
    setMentionHint(null);
    inputRef.current?.focus();
  };

  const handleSubmitBoss = () => {
    if (!bossInput.trim()) return;
    const text = bossInput.trim();
    const ctx = quotedContext || undefined;

    let targetId: string | undefined;
    if (mentionTargetId) {
      targetId = mentionTargetId;
    } else if (text.startsWith("@")) {
      const parsed = parseMention(text);
      if (parsed) {
        targetId = parsed;
      } else {
        setMentionHint("@没匹配到成员，已作为普通消息发送");
        setTimeout(() => setMentionHint(null), 2500);
      }
    }

    schedule(text, ctx, targetId);
    setBossInput("");
    setMentionTargetId(null);
    setQuotedContext(null);
  };

  // 决策卡确认：持久化答案到消息 + 走调度
  const handleDecisionAnswer = (messageId: string, answer: string) => {
    answerDecision(messageId, answer);
  };

  const bossPlaceholder = "说点什么…";

  const { replies: smartReplies, generating: smartRepliesGenerating } = useSmartReplies(currentSession, status, config);

  if (isIdle) {
    return (
      <>
        <IdleView
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          configLoaded={configLoaded}
          hasApiKey={hasActiveProviderConfig(config)}
          navigate={navigate}
          unfinishedSession={unfinishedSession}
          onResume={resumeSession}
          submitting={submitting}
        />
        {toast && <Toast text={toast} />}
      </>
    );
  }

  if (!currentSession) return null;

  if (status === 'error' && currentSession.experts.length === 0) {
    return <ErrorView error={error} onRetry={retryStep} onReset={resetProject} />;
  }

  // 退出项目：reset 后给一个轻提示告诉老板进度已存档（仍可从档案页继续）
  const handleExit = () => {
    resetProject();
    setToast('进度已存档案，随时能从档案页继续');
  };

  const stageStep = deriveStageStep(status, currentSession);

  return (
    <div className="h-full flex flex-col">
      {/* localStorage 写入失败提示条 */}
      {storageError && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border-b border-red-500/30 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>本地存储写入失败，进度可能丢失</span>
          <button
            onClick={() => setStorageError(false)}
            className="ml-auto text-red-400/60 hover:text-red-400 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {/* 团队暂停提示条 */}
      {currentSession.workPaused && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/30 text-amber-400 text-xs">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>团队已暂停，说一声继续就恢复</span>
        </div>
      )}
      {/* 顶部信息栏 */}
      <div className="border-b border-zinc-800/80 px-6 py-2.5 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-xs text-zinc-500 shrink-0">项目部</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium shrink-0">
              {currentSession.domain}
            </span>
            {currentSession.parentSessionId && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs shrink-0">
                汇报 2.0
              </span>
            )}
            <div className="relative min-w-0 flex-1">
              <p
                className="text-zinc-300 text-sm truncate cursor-pointer hover:text-zinc-100"
                onClick={() => setIdeaExpanded(!ideaExpanded)}
              >
                {currentSession.idea}
              </p>
              {ideaExpanded && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIdeaExpanded(false)} />
                  <div className="absolute z-30 top-full mt-1 left-0 w-96 max-w-[90vw] rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl p-3">
                    <p className="text-sm text-zinc-300 leading-relaxed">{currentSession.idea}</p>
                  </div>
                </>
              )}
            </div>
          </div>
          <StageStepper
            currentStep={stageStep}
            hasReport={!!currentSession.report}
            reportStale={!!currentSession.reportStale}
            onOpenReport={() => setShowReportDrawer(true)}
          />
          <button
            onClick={handleExit}
            className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
            title="退出项目（进度存档）"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 主体：左侧评审团 + 中间聊天列吃满 */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        <MemberSidebar
          session={currentSession}
          status={status}
          currentDistillingExpert={currentDistillingExpert}
          distillProgress={distillProgress}
          currentExpertName={currentExpertName}
          onMentionSelect={handleMentionSelect}
          onOpenDetail={handleOpenMemberDetail}
        />

        <ChatArea
          session={currentSession}
          status={status}
          error={error}
          currentExpertName={currentExpertName}
          currentDistillingExpert={currentDistillingExpert}
          distillProgress={distillProgress}
          currentTaskTitle={currentTaskTitle}
          typing={typing}
          scheduling={scheduling}
          bossInput={bossInput}
          setBossInput={setBossInput}
          onSubmitBoss={handleSubmitBoss}
          inputRef={inputRef}
          placeholder={bossPlaceholder}
          mentionHint={mentionHint}
          mentionTargetId={mentionTargetId}
          setMentionTargetId={setMentionTargetId}
          quotedContext={quotedContext}
          setQuotedContext={setQuotedContext}
          onChallenge={handleChallenge}
          onRetry={retryStep}
          onMentionSelect={handleMentionSelect}
          onOpenMemberDetail={handleOpenMemberDetail}
          onOpenReport={() => setShowReportDrawer(true)}
          smartReplies={smartReplies}
          smartRepliesGenerating={smartRepliesGenerating}
          onSmartReply={(text) => schedule(text)}
          onDecisionAnswer={handleDecisionAnswer}
        />
      </div>

      {/* 成员详情抽屉（按需弹出） */}
      {drawerMemberId && (() => {
        const expert = currentSession.experts.find(e => e.id === drawerMemberId);
        if (!expert) return null;
        return (
          <MemberDetailDrawer
            expert={expert}
            session={currentSession}
            onClose={() => setDrawerMemberId(null)}
            onChallenge={handleChallenge}
            onMentionSelect={handleMentionSelect}
          />
        );
      })()}

      {/* 报告抽屉（按需弹出） */}
      {showReportDrawer && currentSession.report && (
        <ReportDrawer
          report={currentSession.report}
          reportVersions={currentSession.reportVersions}
          reportStale={currentSession.reportStale}
          onRefreshReport={() => schedule("更新一下汇报")}
          onReset={handleExit}
          onClose={() => setShowReportDrawer(false)}
          refreshing={scheduling}
        />
      )}

      {toast && <Toast text={toast} />}
    </div>
  );
}

// ========== 轻提示 Toast ==========

function Toast({ text }: { text: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs shadow-xl">
        {text}
      </div>
    </div>
  );
}

// ========== 共用徽章色值常量 ==========
// 三档结论色：绿=可做/做、红=不建议/不做、琥珀=有条件/换做法
const BADGE_COLORS = {
  green: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', bgSoft: 'bg-emerald-500/10', border: 'border-emerald-500/40', borderSoft: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  red: { color: 'text-red-400', bg: 'bg-red-500/15', bgSoft: 'bg-red-500/10', border: 'border-red-500/40', borderSoft: 'border-red-500/30', dot: 'bg-red-400' },
  amber: { color: 'text-amber-400', bg: 'bg-amber-500/15', bgSoft: 'bg-amber-500/10', border: 'border-amber-500/40', borderSoft: 'border-amber-500/30', dot: 'bg-amber-400' },
} as const;

// ========== 阶段步进条 ==========

function deriveStageStep(status: ProjectStatus, session: ProjectSession): number {
  if (status === 'clarifying' || status === 'planning') return 0;
  if (status === 'plan_approval') return 1;
  if (status === 'briefing') return 2;
  if (status === 'working') {
    const hasAnalysisStarted = session.tasks.some(t => t.type === 'analysis' && t.status !== 'pending');
    return hasAnalysisStarted ? 3 : 2;
  }
  if (status === 'pre_report') return 3;
  if (status === 'reporting' || status === 'done') return 4;
  return 0;
}

// 阶段枚举 → 老板看得懂的人话（用于档案页/未完成提示等 UI 显示）
function stageToHumanLabel(stage: ProjectStatus): string {
  const map: Record<ProjectStatus, string> = {
    idle: '空着',
    clarifying: '问清楚想法',
    planning: '排分工',
    plan_approval: '等批示分工',
    briefing: '调研中',
    working: '干活中',
    pre_report: '准备汇报',
    reporting: '写汇报',
    done: '已完成',
    error: '出错',
  };
  return map[stage] || stage;
}

function StageStepper({ currentStep, hasReport, reportStale, onOpenReport }: {
  currentStep: number;
  hasReport: boolean;
  reportStale: boolean;
  onOpenReport: () => void;
}) {
  const steps = ['组队', '分工', '调研', '互审', '汇报'];
  return (
    <div className="flex items-center gap-1 shrink-0">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1">
          {i > 0 && <span className="text-zinc-700 text-xs">›</span>}
          <button
            onClick={i === 4 && hasReport ? onOpenReport : undefined}
            className={cn(
              "text-xs px-1.5 py-0.5 rounded transition-colors inline-flex items-center gap-1",
              i === currentStep
                ? "text-amber-400 font-medium"
                : i < currentStep
                ? "text-zinc-500 hover:text-zinc-300"
                : "text-zinc-700",
              i === 4 && hasReport && "cursor-pointer hover:text-amber-400"
            )}
          >
            {label}
            {i === 4 && reportStale && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"
                title="汇报有新结论待更新"
              />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

// ========== 空状态 ==========

function IdleView({ input, setInput, onSubmit, configLoaded, hasApiKey, navigate, unfinishedSession, onResume, submitting }: {
  input: string;
  setInput: (v: string) => void;
  onSubmit: () => void;
  configLoaded: boolean;
  hasApiKey: boolean;
  navigate: (path: string) => void;
  unfinishedSession: ProjectSession | null;
  onResume: (sessionId: string) => void;
  submitting: boolean;
}) {
  return (
    <div className="max-w-3xl mx-auto w-full px-8 py-12">
      <div className="flex items-center gap-2 text-amber-500 mb-3">
        <Briefcase className="w-4 h-4" />
        <span className="text-sm font-medium">项目部</span>
      </div>
      <h1 className="font-serif text-4xl font-black leading-tight">
        把你的想法
        <br />
        <span className="text-gradient-gold">交办给团队</span>
      </h1>
      <p className="mt-3 text-zinc-400 text-sm leading-relaxed max-w-xl">
        像老板一样说一句话想法，底下的团队自己去调研、求证、算账、干活。
        过程对你透明，中间该请示的请示、该拍板的拍板，最后交上来一份正式汇报。
      </p>

      {unfinishedSession && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-amber-300 font-medium">有未完成的项目</p>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">
              {unfinishedSession.idea}（{stageToHumanLabel(unfinishedSession.stage)}中断）
            </p>
          </div>
          <button
            onClick={() => onResume(unfinishedSession.id)}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-xs font-medium hover:bg-amber-400 transition-colors"
          >
            继续上次
          </button>
        </div>
      )}

      <div className="mt-8 space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例如：我想做个AI教育设备，让孩子问百科问题，带拍照识英文单词"
          className="w-full h-40 px-5 py-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm leading-relaxed resize-none focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              onSubmit();
            }
          }}
        />

        {!hasApiKey && configLoaded && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
            <div className="flex items-center gap-2 text-amber-400 mb-3">
              <KeyRound className="w-4 h-4" />
              <span className="text-sm font-medium">3 步开始用</span>
            </div>
            <ol className="space-y-2.5 text-sm text-zinc-300">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-medium flex items-center justify-center">1</span>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-200">配 API Key</p>
                  <p className="text-xs text-zinc-500 mt-0.5">支持 DeepSeek / OpenAI / Kimi / 自定义</p>
                </div>
                <button
                  onClick={() => navigate("/settings")}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-xs font-medium hover:bg-amber-400 transition-colors"
                >
                  去配置 →
                </button>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs font-medium flex items-center justify-center">2</span>
                <p className="text-zinc-400 flex-1 min-w-0 pt-0.5">回来输入想法</p>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs font-medium flex items-center justify-center">3</span>
                <p className="text-zinc-400 flex-1 min-w-0 pt-0.5">点"交办"，团队自己干活</p>
              </li>
            </ol>
            <p className="mt-3 pt-3 border-t border-amber-500/20 text-xs text-zinc-500 leading-relaxed">
              密钥只存本机浏览器（Local Storage），不会上传到任何服务器
            </p>
          </div>
        )}

        <button
          onClick={() => {
            if (!hasApiKey && configLoaded) {
              navigate("/settings");
              return;
            }
            onSubmit();
          }}
          disabled={submitting || (!hasApiKey && configLoaded ? false : !input.trim())}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all",
            submitting
              ? "bg-zinc-800 text-zinc-500 cursor-wait"
              : (!hasApiKey && configLoaded)
              ? "bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20"
              : input.trim()
              ? "bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          )}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (!hasApiKey && configLoaded) ? <KeyRound className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {submitting ? "组队中…" : (!hasApiKey && configLoaded) ? "先去配置" : "交办"}
        </button>
      </div>
    </div>
  );
}

// ========== 错误视图（极早期失败：全屏） ==========

function ErrorView({ error, onRetry, onReset }: { error: string; onRetry: () => void; onReset: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center px-8">
      <div className="max-w-md w-full">
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">出错了</span>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed mb-4">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 text-sm font-medium hover:bg-amber-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重试此步骤
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
            >
              放弃，回首页
            </button>
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            重试会从失败的步骤继续，已完成的调研和分析不会重跑。
          </p>
        </div>
      </div>
    </div>
  );
}

// ========== 左侧评审团 ==========

function MemberSidebar({
  session, status, currentDistillingExpert, distillProgress, currentExpertName, onMentionSelect, onOpenDetail,
}: {
  session: ProjectSession;
  status: ProjectStatus;
  currentDistillingExpert: string | null;
  distillProgress: { current: number; total: number } | null;
  currentExpertName: string | null;
  onMentionSelect: (expertId: string, expertName: string) => void;
  onOpenDetail: (expertId: string) => void;
}) {
  if (session.experts.length === 0) {
    return (
      <div className="w-48 xl:w-56 shrink-0 border-r border-zinc-800/80 bg-zinc-950/50 flex flex-col items-center justify-center px-3">
        <Loader2 className="w-5 h-5 text-amber-500 animate-spin mb-2" />
        <p className="text-xs text-zinc-600 text-center">正在组建团队…</p>
      </div>
    );
  }

  return (
    <div className="w-48 xl:w-56 shrink-0 border-r border-zinc-800/80 bg-zinc-950/50 overflow-y-auto">
      <div className="p-3">
        <div className="flex items-center gap-2 text-zinc-500 mb-3 px-1">
          <Users className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">评审团（{session.experts.length}）</span>
        </div>

        <div className="space-y-2">
          {session.experts.map(expert => (
            <MemberCard
              key={expert.id}
              expert={expert}
              session={session}
              status={status}
              currentDistillingExpert={currentDistillingExpert}
              distillProgress={distillProgress}
              currentExpertName={currentExpertName}
              onMentionSelect={onMentionSelect}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// 成员实时状态推导
interface MemberState {
  label: string;
  kind: 'distilling' | 'working' | 'concluded' | 'idle';
  verdict?: AnalysisResult['verdict'];
  oneLiner?: string;
  progress?: { done: number; total: number };
}

function deriveMemberStatus(
  expert: Expert,
  session: ProjectSession,
  status: ProjectStatus,
  currentDistillingExpert: string | null,
  distillProgress: { current: number; total: number } | null,
  currentExpertName: string | null
): MemberState {
  if (currentDistillingExpert === expert.name) {
    const progressLabel = distillProgress
      ? `入职中（${distillProgress.current}/${distillProgress.total}）`
      : '入职中…';
    return { label: progressLabel, kind: 'distilling' };
  }

  const inProgressTask = session.tasks.find(t =>
    t.expertId === expert.id && t.status === 'in_progress'
  );
  if (inProgressTask) {
    if (
      inProgressTask.type === 'research' &&
      inProgressTask.searchProgress &&
      inProgressTask.searchProgress.length > 0
    ) {
      const lastSearch = inProgressTask.searchProgress[inProgressTask.searchProgress.length - 1];
      const total = inProgressTask.searchQueries?.length || 0;
      const done = inProgressTask.searchProgress.length;
      return {
        label: `查：${lastSearch.query}`,
        kind: 'working',
        progress: total > 0 ? { done, total } : undefined,
      };
    }
    return { label: `正在：${inProgressTask.title}`, kind: 'working' };
  }

  const analysisTask = session.tasks.find(t =>
    t.expertId === expert.id && t.type === 'analysis' && t.result && 'verdict' in t.result
  );
  if (analysisTask && analysisTask.result) {
    const r = analysisTask.result as AnalysisResult;
    return {
      label: r.oneLiner,
      kind: 'concluded',
      verdict: r.verdict,
      oneLiner: r.oneLiner,
    };
  }

  // 调研已完成但分析还没开始
  const doneResearch = session.tasks.find(t =>
    t.expertId === expert.id && t.type === 'research' && t.status === 'completed'
  );
  if (doneResearch) {
    const r = doneResearch.result as ResearchResult | undefined;
    return {
      label: r?.summary?.slice(0, 30) || '调研完成',
      kind: 'idle',
    };
  }

  return { label: '待命', kind: 'idle' };
}

function verdictBadgeConfig(verdict: AnalysisResult['verdict']) {
  switch (verdict) {
    case 'pass':
      return { label: '能做', ...BADGE_COLORS.green };
    case 'conditional':
      return { label: '有前提', ...BADGE_COLORS.amber };
    case 'fail':
      return { label: '不建议做', ...BADGE_COLORS.red };
  }
}

// verdict 枚举 → 人话（用于版本历史等纯文本场景）
function verdictLabel(verdict: AnalysisResult['verdict']): string {
  return verdictBadgeConfig(verdict)?.label || verdict;
}

function MemberCard({
  expert, session, status, currentDistillingExpert, distillProgress, currentExpertName,
  onMentionSelect, onOpenDetail,
}: {
  expert: Expert;
  session: ProjectSession;
  status: ProjectStatus;
  currentDistillingExpert: string | null;
  distillProgress: { current: number; total: number } | null;
  currentExpertName: string | null;
  onMentionSelect: (expertId: string, expertName: string) => void;
  onOpenDetail: (expertId: string) => void;
}) {
  const state = deriveMemberStatus(expert, session, status, currentDistillingExpert, distillProgress, currentExpertName);
  const isWorking = state.kind === 'working' || state.kind === 'distilling';
  const verdictConfig = state.verdict ? verdictBadgeConfig(state.verdict) : null;

  return (
    <div
      onClick={() => onOpenDetail(expert.id)}
      className="group rounded-lg border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700 p-2.5 cursor-pointer transition-colors"
    >
      {/* 头像 + 名字 + 头衔 */}
      <div className="flex items-start gap-2">
        <div className="shrink-0 relative">
          <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 text-sm font-medium">
            {expert.name?.[0] || '?'}
          </div>
          {isWorking && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse border border-zinc-950" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium text-zinc-200 truncate">{expert.name}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMentionSelect(expert.id, expert.name);
              }}
              className="text-zinc-600 hover:text-amber-400 shrink-0"
              title={`@${expert.name}`}
            >
              <AtSign className="w-3 h-3" />
            </button>
          </div>
          {expert.title && (
            <p className="text-[11px] text-zinc-500 truncate leading-tight">{expert.title}</p>
          )}
        </div>
      </div>

      {/* 一行动态 */}
      <div className="mt-2">
        {state.kind === 'working' && (
          <>
            <p className="text-[11px] text-amber-400/90 truncate flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0" />
              {state.label}
            </p>
            {state.progress && (
              <div className="mt-1 h-0.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400/80 transition-all duration-500"
                  style={{ width: `${(state.progress.done / state.progress.total) * 100}%` }}
                />
              </div>
            )}
          </>
        )}

        {state.kind === 'distilling' && (
          <p className="text-[11px] text-amber-400/90 truncate flex items-center gap-1">
            <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0" />
            {state.label}
          </p>
        )}

        {state.kind === 'concluded' && state.verdict && verdictConfig && (
          <>
            <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">{state.oneLiner}</p>
            <span className={cn(
              "inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] border",
              verdictConfig.bg, verdictConfig.color, verdictConfig.border
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", verdictConfig.dot)} />
              {verdictConfig.label}
            </span>
          </>
        )}

        {state.kind === 'idle' && (
          <p className="text-[11px] text-zinc-600 truncate">{state.label}</p>
        )}
      </div>
    </div>
  );
}

// ========== 中间聊天区（无 Tab、无黄色状态条） ==========

function ChatArea({
  session, status, error, currentExpertName, currentDistillingExpert, distillProgress, currentTaskTitle,
  typing, scheduling, bossInput, setBossInput, onSubmitBoss, inputRef, placeholder, mentionHint,
  mentionTargetId, setMentionTargetId, quotedContext, setQuotedContext,
  onRetry, onMentionSelect, onChallenge, onOpenMemberDetail, onOpenReport,
  smartReplies, smartRepliesGenerating, onSmartReply, onDecisionAnswer,
}: {
  session: ProjectSession;
  status: ProjectStatus;
  error: string;
  currentExpertName: string | null;
  currentDistillingExpert: string | null;
  distillProgress: { current: number; total: number } | null;
  currentTaskTitle: string | null;
  typing: { expertId: string; hint: string } | null;
  scheduling: boolean;
  bossInput: string;
  setBossInput: (v: string) => void;
  onSubmitBoss: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  placeholder: string;
  mentionHint: string | null;
  mentionTargetId: string | null;
  setMentionTargetId: (id: string | null) => void;
  quotedContext: string | null;
  setQuotedContext: (v: string | null) => void;
  onRetry: () => void;
  onMentionSelect: (expertId: string, expertName: string) => void;
  onChallenge: (expertId: string, expertName: string, contextText: string) => void;
  onOpenMemberDetail: (expertId: string) => void;
  onOpenReport: () => void;
  smartReplies: string[];
  smartRepliesGenerating: boolean;
  onSmartReply: (text: string) => void;
  onDecisionAnswer: (messageId: string, answer: string) => void;
}) {
  const queuedMsgIds = useMemo(() => {
    const ids = new Set<string>();
    for (const i of session.bossInterruptions || []) {
      if (!i.consumed && i.bossMsgId) ids.add(i.bossMsgId);
    }
    return ids;
  }, [session.bossInterruptions]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">
      {/* 错误条（红色，非极早期失败） */}
      {status === 'error' && error && (
        <div className="border-b border-red-500/30 bg-red-500/5 px-4 py-2 shrink-0 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-xs text-red-400 truncate flex-1">{error}</span>
          <button
            onClick={onRetry}
            className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 text-zinc-950 text-xs font-medium hover:bg-amber-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            重试此步骤
          </button>
        </div>
      )}

      <GroupChatView
        messages={session.groupMessages}
        experts={session.experts}
        tasks={session.tasks}
        status={status}
        currentExpertName={currentExpertName}
        currentDistillingExpert={currentDistillingExpert}
        distillProgress={distillProgress}
        currentTaskTitle={currentTaskTitle}
        typing={typing}
        scheduling={scheduling}
        onMentionSelect={onMentionSelect}
        onChallenge={onChallenge}
        onOpenReport={onOpenReport}
        onOpenMemberDetail={onOpenMemberDetail}
        onDecisionAnswer={onDecisionAnswer}
        smartReplies={smartReplies}
        smartRepliesGenerating={smartRepliesGenerating}
        onSmartReply={onSmartReply}
        queuedMsgIds={queuedMsgIds}
      />

      {/* BossInputBar 常驻（不再禁用，消息入队）。error 状态下禁用发送，先点上方重试 */}
      <BossInputBar
        input={bossInput}
        setInput={setBossInput}
        onSubmit={onSubmitBoss}
        inputRef={inputRef}
        placeholder={status === 'error' ? '出错了，先点上方"重试此步骤"' : placeholder}
        mentionHint={mentionHint}
        mentionTargetId={mentionTargetId}
        setMentionTargetId={setMentionTargetId}
        quotedContext={quotedContext}
        setQuotedContext={setQuotedContext}
        experts={session.experts}
        disabled={status === 'error'}
      />
    </div>
  );
}

// ========== 老板输入栏（全阶段常驻 + @选择器） ==========

function BossInputBar({
  input, setInput, onSubmit, inputRef, placeholder, mentionHint,
  mentionTargetId, setMentionTargetId, quotedContext, setQuotedContext, experts,
  disabled,
}: {
  input: string;
  setInput: (v: string) => void;
  onSubmit: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  placeholder: string;
  mentionHint: string | null;
  mentionTargetId: string | null;
  setMentionTargetId: (id: string | null) => void;
  quotedContext: string | null;
  setQuotedContext: (v: string | null) => void;
  experts: Expert[];
  disabled?: boolean;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const blurTimerRef = useRef<number | null>(null);

  const filtered = experts.filter(e =>
    !mentionQuery ||
    e.name.includes(mentionQuery) ||
    (e.title && e.title.includes(mentionQuery))
  );

  useEffect(() => {
    setActiveIdx(0);
  }, [mentionQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    const lastAtIdx = val.lastIndexOf('@');
    if (lastAtIdx !== -1) {
      const afterAt = val.slice(lastAtIdx + 1);
      if (!afterAt.includes(' ') && !afterAt.includes('@')) {
        setMentionQuery(afterAt);
        setShowDropdown(true);
        return;
      }
    }
    setShowDropdown(false);
  };

  const selectMention = (expert: Expert) => {
    const val = input;
    const lastAtIdx = val.lastIndexOf('@');
    const before = lastAtIdx !== -1 ? val.slice(0, lastAtIdx) : val;
    setInput(`${before}@${expert.name} `);
    setMentionTargetId(expert.id);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => (i + 1) % filtered.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => (i - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMention(filtered[activeIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleBlur = () => {
    blurTimerRef.current = window.setTimeout(() => setShowDropdown(false), 150);
  };

  const handleFocus = () => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  };

  const clearMention = () => {
    const val = input;
    const match = val.match(/^@\S+\s/);
    if (match) {
      setInput(val.slice(match[0].length));
    }
    setMentionTargetId(null);
    inputRef.current?.focus();
  };

  const mentionedExpert = mentionTargetId
    ? experts.find(e => e.id === mentionTargetId)
    : null;

  return (
    <div className="border-t border-zinc-800/80 px-4 py-3 shrink-0 relative">
      {mentionHint && (
        <p className="text-xs text-amber-400/80 mb-1.5 flex items-center gap-1">
          <AtSign className="w-3 h-3 shrink-0" />
          {mentionHint}
        </p>
      )}

      {mentionedExpert && (
        <div className="mb-1.5 flex items-center gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs">
            <AtSign className="w-2.5 h-2.5" />
            {mentionedExpert.name}
            <button
              onClick={clearMention}
              className="ml-0.5 hover:text-amber-100 transition-colors"
              title="取消点名"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {quotedContext && (
        <div className="mb-1.5 flex items-start gap-1">
          <span className="inline-flex items-start gap-1.5 px-2 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-xs max-w-md">
            <Quote className="w-3 h-3 mt-0.5 shrink-0 text-zinc-500" />
            <span className="line-clamp-2">{quotedContext.slice(0, 60)}{quotedContext.length > 60 ? '…' : ''}</span>
            <button
              onClick={() => setQuotedContext(null)}
              className="ml-0.5 hover:text-zinc-100 transition-colors shrink-0"
              title="取消引用"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          {showDropdown && filtered.length > 0 && (
            <div className="absolute bottom-full mb-1 left-0 right-0 max-h-60 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl z-20">
              {filtered.map((expert, i) => (
                <button
                  key={expert.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectMention(expert);
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                    i === activeIdx ? "bg-amber-500/10" : "hover:bg-zinc-800"
                  )}
                >
                  <div className="shrink-0 w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-xs font-medium">
                    {expert.name?.[0] || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-200 truncate">{expert.name}</p>
                    {expert.title && (
                      <p className="text-[11px] text-zinc-500 truncate">{expert.title}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <input
            ref={inputRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          onClick={onSubmit}
          disabled={disabled || !input.trim()}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl transition-all shrink-0",
            disabled || !input.trim()
              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              : "bg-amber-500 text-zinc-950 hover:bg-amber-400"
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ========== 智能建议回复（Smart Reply） ==========

function getSituationDescription(status: ProjectStatus): string {
  switch (status) {
    case 'clarifying': return '组长刚问了老板问题，等老板回答或直接放行开干';
    case 'plan_approval': return '组长刚发了分工方案，等老板批示';
    case 'briefing': return '组长刚发了中期简报，等老板回应';
    case 'pre_report': return '分析跑完了，组长问要不要出汇报';
    case 'done': return '汇报已交，等老板追问或开新项目';
    default: return '';
  }
}

function useSmartReplies(
  session: ProjectSession | null,
  status: ProjectStatus,
  config: UserConfig,
): { replies: string[]; generating: boolean } {
  const [replies, setReplies] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const lastGenKey = useRef<string>('');
  const requestIdRef = useRef(0);

  const waitingStates: ProjectStatus[] = ['clarifying', 'plan_approval', 'briefing', 'pre_report', 'done'];

  const lastMemberMsgId = useMemo(() => {
    const memberMsgs = (session?.groupMessages ?? []).filter(
      m => m.authorId !== 'boss' && m.authorId !== 'system'
    );
    return memberMsgs[memberMsgs.length - 1]?.id || null;
  }, [session?.groupMessages]);

  useEffect(() => {
    if (!session) {
      setReplies([]);
      lastGenKey.current = '';
      return;
    }

    if (!waitingStates.includes(status)) {
      setReplies([]);
      lastGenKey.current = '';
      return;
    }

    if (!lastMemberMsgId) {
      setReplies([]);
      return;
    }

    // config 未就绪时不写 genKey，等 config 加载后再触发生成
    if (!hasActiveProviderConfig(config)) {
      setReplies([]);
      return;
    }

    // 每个等待时刻只生成一次
    const genKey = `${status}-${lastMemberMsgId}`;
    if (genKey === lastGenKey.current) return;
    lastGenKey.current = genKey;

    // 异步生成，绝不阻塞、绝不报错
    const myRequestId = ++requestIdRef.current;
    setGenerating(true);
    const memberMsgs = session.groupMessages.filter(
      m => m.authorId !== 'boss' && m.authorId !== 'system'
    );
    const recentMsgs = memberMsgs.slice(-5).map(m => {
      const author = session.experts.find(e => e.id === m.authorId)?.name || '成员';
      return `${author}：${m.content.slice(0, 100)}`;
    }).join('\n');
    const situation = getSituationDescription(status);

    callLLM(getSmartReplyPrompt(recentMsgs, situation), config, 0.4)
      .then(text => {
        // 旧响应丢弃：阶段已变或已发起新一轮生成
        if (myRequestId !== requestIdRef.current) return;
        try {
          const parsed = parseSmartReplyResult(text);
          setReplies(parsed);
        } catch {
          setReplies([]);
        }
        setGenerating(false);
      })
      .catch(() => {
        if (myRequestId !== requestIdRef.current) return;
        setReplies([]);
        setGenerating(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, lastMemberMsgId, session, config]);

  return { replies, generating };
}

// ========== 工作群 ==========

function GroupChatView({
  messages, experts, tasks, status, currentExpertName, currentDistillingExpert, distillProgress,
  currentTaskTitle, typing, scheduling, onMentionSelect, onChallenge,
  onOpenReport, onOpenMemberDetail, onDecisionAnswer,
  smartReplies, smartRepliesGenerating, onSmartReply, queuedMsgIds,
}: {
  messages: GroupMessage[];
  experts: Expert[];
  tasks: TaskCard[];
  status: string;
  currentExpertName: string | null;
  currentDistillingExpert: string | null;
  distillProgress: { current: number; total: number } | null;
  currentTaskTitle: string | null;
  typing: { expertId: string; hint: string } | null;
  scheduling: boolean;
  onMentionSelect: (expertId: string, expertName: string) => void;
  onChallenge: (expertId: string, expertName: string, contextText: string) => void;
  onOpenReport: () => void;
  onOpenMemberDetail: (expertId: string) => void;
  onDecisionAnswer: (messageId: string, answer: string) => void;
  smartReplies: string[];
  smartRepliesGenerating: boolean;
  onSmartReply: (text: string) => void;
  queuedMsgIds: Set<string>;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentExpertName, currentTaskTitle, typing]);

  const showProcessing = status === 'planning'
    || status === 'reporting'
    || (status === 'clarifying' && !!typing);
  const typingExpert = typing ? experts.find(e => e.id === typing.expertId) : null;

  let planCount = 0;
  const planIndexMap = new Map<string, number>();
  for (const msg of messages) {
    if (msg.kind === 'plan') {
      planCount++;
      planIndexMap.set(msg.id, planCount);
    }
  }

  // smart reply 只在等老板说话且没有 typing/processing/scheduling 时显示
  const showSmartReplies = smartReplies.length > 0 && !typing && !showProcessing && !scheduling;
  // 生成中显示骨架 chip（同条件下，replies 还没回来时）
  const showSkeletonReplies = smartRepliesGenerating && smartReplies.length === 0 && !typing && !showProcessing && !scheduling;

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 && !showProcessing && !typing && (
          <div className="text-center py-12">
            <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-600 text-sm">工作群还没有消息</p>
            <p className="text-zinc-700 text-xs mt-1">团队干活时会在这里同步进度</p>
          </div>
        )}

        {messages.map(msg => {
          const repliedMessage = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : undefined;
          const planIndex = planIndexMap.get(msg.id);
          return (
            <GroupMessageItem
              key={msg.id}
              message={msg}
              experts={experts}
              tasks={tasks}
              onMentionSelect={onMentionSelect}
              onChallenge={onChallenge}
              onOpenReport={onOpenReport}
              onOpenMemberDetail={onOpenMemberDetail}
              repliedMessage={repliedMessage}
              planIndex={planIndex}
              onDecisionAnswer={onDecisionAnswer}
              isQueued={queuedMsgIds.has(msg.id)}
            />
          );
        })}

        {/* 智能建议 chip：渲染在最后一条消息下方，视觉上与消息本体分开 */}
        {showSmartReplies && (
          <div className="flex items-center gap-1.5 pl-11 pt-1">
            {smartReplies.map(text => (
              <button
                key={text}
                onClick={() => onSmartReply(text)}
                className="px-3 py-1.5 rounded-full bg-zinc-800/60 border border-zinc-700 text-zinc-300 text-xs hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-amber-300 transition-colors"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        {/* 骨架 chip：建议生成中 */}
        {showSkeletonReplies && (
          <div className="flex items-center gap-1.5 pl-11 pt-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="px-4 py-2 rounded-full bg-zinc-800/40 border border-zinc-700/50 animate-pulse"
              >
                <div className="h-3 w-10 bg-zinc-700/50 rounded" />
              </div>
            ))}
          </div>
        )}

        {typing && (
          <div className="flex items-center gap-2.5 py-2">
            <button
              onClick={() => typingExpert && onMentionSelect(typingExpert.id, typingExpert.name)}
              className="shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-medium hover:border-amber-500/50 hover:text-amber-400 transition-colors"
              title={typingExpert ? `@${typingExpert.name}` : undefined}
            >
              {typingExpert?.name?.[0] || '成'}
            </button>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-zinc-500">{typingExpert?.name || '成员'}</span>
              <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-zinc-900 border border-zinc-800 px-3.5 py-2 mt-0.5">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-xs text-zinc-500">{typing.hint}</span>
              </div>
            </div>
          </div>
        )}

        {showProcessing && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            <span className="text-zinc-500 text-sm">
              {currentDistillingExpert
                ? distillProgress
                  ? `正在让 ${currentDistillingExpert} 备好干活的本事（${distillProgress.current}/${distillProgress.total}）…`
                  : `正在让 ${currentDistillingExpert} 备好干活的本事…`
                : status === 'clarifying'
                ? '组长正在判断想法...'
                : status === 'reporting'
                ? '正在写汇报...'
                : '团队在准备...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function GroupMessageItem({
  message, experts, tasks, onMentionSelect, onChallenge, onOpenReport, onOpenMemberDetail,
  repliedMessage, planIndex, onDecisionAnswer, isQueued,
}: {
  message: GroupMessage;
  experts: Expert[];
  tasks: TaskCard[];
  onMentionSelect: (expertId: string, expertName: string) => void;
  onChallenge: (expertId: string, expertName: string, contextText: string) => void;
  onOpenReport: () => void;
  onOpenMemberDetail: (expertId: string) => void;
  repliedMessage?: GroupMessage;
  planIndex?: number;
  onDecisionAnswer: (messageId: string, answer: string) => void;
  isQueued: boolean;
}) {
  // 系统消息：居中灰色小字
  if (message.authorId === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-zinc-600 px-3 py-1 rounded-full bg-zinc-900/50">
          {message.content}
        </span>
      </div>
    );
  }

  // 决策卡：成员提问 + radio 选项 + 自由输入 + 确认
  if (message.kind === 'decision' && message.decisionData) {
    return (
      <DecisionCardBubble
        message={message}
        experts={experts}
        onMentionSelect={onMentionSelect}
        answered={message.decisionData?.answered}
        onAnswer={(answer) => onDecisionAnswer(message.id, answer)}
      />
    );
  }

  // 报告封面卡：标题 + 判决徽章 + 三个关键数字，点卡开报告抽屉
  if (message.kind === 'report-cover' && message.reportCoverData) {
    return (
      <ReportCoverBubble
        message={message}
        experts={experts}
        onMentionSelect={onMentionSelect}
        onOpenReport={onOpenReport}
      />
    );
  }

  const replyBlock = repliedMessage ? (
    <div className="mb-1 rounded-md bg-zinc-900/80 border-l-2 border-zinc-600 px-2 py-1 max-w-full">
      <span className="text-xs text-zinc-500 line-clamp-1">
        {repliedMessage.content.slice(0, 50) || '（卡片消息）'}
      </span>
    </div>
  ) : null;

  const isBoss = message.authorId === 'boss';
  const expert = experts.find(e => e.id === message.authorId);
  const mentionedExpert = message.mentionTargetId
    ? experts.find(e => e.id === message.mentionTargetId)
    : undefined;

  // 方案卡（kind='plan'）：组长发的分工方案，带版本号
  if (message.kind === 'plan') {
    return (
      <div className="flex gap-2.5">
        <button
          onClick={() => expert && onMentionSelect(expert.id, expert.name)}
          className="shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-medium hover:border-amber-500/50 hover:text-amber-400 transition-colors"
        >
          {expert?.name?.[0] || '成'}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{expert?.name || '成员'}</span>
            <span className="text-[10px] text-amber-400/80 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5">
              分工方案 v{planIndex || 1}
            </span>
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-zinc-900 border border-zinc-800 px-3.5 py-2 mt-0.5">
            <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isBoss) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%]">
          {replyBlock && <div className="flex justify-end">{replyBlock}</div>}
          {mentionedExpert && (
            <div className="flex justify-end mb-0.5">
              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5">
                <AtSign className="w-2.5 h-2.5" />
                {mentionedExpert.name}
              </span>
            </div>
          )}
          <div className="rounded-2xl rounded-tr-sm bg-amber-500 text-zinc-950 px-3.5 py-2">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          {isQueued && (
            <div className="flex justify-end mt-0.5">
              <span className="inline-flex items-center gap-0.5 text-[10px] text-zinc-600">
                <Clock className="w-2.5 h-2.5" />
                等人接话
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <button
        onClick={() => expert && onMentionSelect(expert.id, expert.name)}
        className="shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-medium hover:border-amber-500/50 hover:text-amber-400 transition-colors"
        title={expert ? `@${expert.name}` : undefined}
      >
        {expert?.name?.[0] || '成'}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500">{expert?.name || '成员'}</span>
          <span className="text-[10px] text-zinc-700">
            {formatHHmm(message.createdAt)}
          </span>
        </div>
        {replyBlock}
        <div className="rounded-2xl rounded-tl-sm bg-zinc-900 border border-zinc-800 px-3.5 py-2 mt-0.5 max-w-[75%]">
          <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

// 时间格式化：只显示 HH:mm
function formatHHmm(d: Date): string {
  const date = d instanceof Date ? d : new Date(d);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ========== 决策卡气泡 ==========

function DecisionCardBubble({
  message, experts, onMentionSelect, answered, onAnswer,
}: {
  message: GroupMessage;
  experts: Expert[];
  onMentionSelect: (expertId: string, expertName: string) => void;
  answered?: string;
  onAnswer: (answer: string) => void;
}) {
  const data: DecisionMessageData = message.decisionData!;
  const expert = experts.find(e => e.id === message.authorId);
  const [selected, setSelected] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const isAnswered = !!answered;

  const handleConfirm = () => {
    const answer = isCustom ? customText.trim() : selected;
    if (!answer) return;
    onAnswer(answer);
  };

  return (
    <div className="flex gap-2.5">
      <button
        onClick={() => expert && onMentionSelect(expert.id, expert.name)}
        className="shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-medium hover:border-amber-500/50 hover:text-amber-400 transition-colors"
        title={expert ? `@${expert.name}` : undefined}
      >
        {expert?.name?.[0] || '成'}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-zinc-500">{expert?.name || '成员'}</span>
          <span className="text-[10px] text-amber-400/80 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            请老板定夺
          </span>
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-zinc-900 border border-amber-500/30 p-3.5 max-w-[85%]">
          {/* 标题：一句话说清在决定什么 */}
          <p className="text-sm font-medium text-zinc-200 mb-3">{data.question}</p>

          {isAnswered ? (
            // 已答：显示老板的选择
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
              <p className="text-xs text-amber-400/70 mb-0.5">老板的选择</p>
              <p className="text-sm text-amber-300">{answered}</p>
            </div>
          ) : (
            <>
              {/* radio 选项列表 */}
              <div className="space-y-2">
                {data.options.map((opt, i) => (
                  <label
                    key={i}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                      selected === opt.text && !isCustom
                        ? "border-amber-500/50 bg-amber-500/10"
                        : "border-zinc-800 hover:bg-zinc-800/40"
                    )}
                  >
                    <input
                      type="radio"
                      name={`decision-${message.id}`}
                      checked={selected === opt.text && !isCustom}
                      onChange={() => {
                        setSelected(opt.text);
                        setIsCustom(false);
                      }}
                      className="mt-1 accent-amber-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200">{opt.text}</p>
                      <div className="mt-0.5 flex gap-3 text-[11px]">
                        {opt.pros && <span className="text-emerald-400/70">利：{opt.pros}</span>}
                        {opt.cons && <span className="text-red-400/70">弊：{opt.cons}</span>}
                      </div>
                    </div>
                  </label>
                ))}

                {/* 我有别的想法 */}
                <label
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                    isCustom
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-zinc-800 hover:bg-zinc-800/40"
                  )}
                >
                  <input
                    type="radio"
                    name={`decision-${message.id}`}
                    checked={isCustom}
                    onChange={() => setIsCustom(true)}
                    className="mt-1 accent-amber-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300">我有别的想法</p>
                    {isCustom && (
                      <input
                        type="text"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="说说你的想法"
                        className="mt-1.5 w-full px-2 py-1.5 rounded bg-zinc-950 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                        autoFocus
                      />
                    )}
                  </div>
                </label>
              </div>

              {/* 确认按钮 */}
              <button
                onClick={handleConfirm}
                disabled={!isCustom ? !selected : !customText.trim()}
                className={cn(
                  "mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  (!isCustom ? !selected : !customText.trim())
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-amber-500 text-zinc-950 hover:bg-amber-400"
                )}
              >
                <Check className="w-3.5 h-3.5" />
                确认
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== 报告封面卡气泡 ==========

function ReportCoverBubble({
  message, experts, onMentionSelect, onOpenReport,
}: {
  message: GroupMessage;
  experts: Expert[];
  onMentionSelect: (expertId: string, expertName: string) => void;
  onOpenReport: () => void;
}) {
  const data = message.reportCoverData!;
  const expert = experts.find(e => e.id === message.authorId);

  const decisionConfig = {
    '做': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', dot: 'bg-emerald-400' },
    '不做': { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40', dot: 'bg-red-400' },
    '换个做法': { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40', dot: 'bg-amber-400' },
  };
  const config = decisionConfig[data.decision];

  return (
    <div className="flex gap-2.5">
      <button
        onClick={() => expert && onMentionSelect(expert.id, expert.name)}
        className="shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-medium hover:border-amber-500/50 hover:text-amber-400 transition-colors"
      >
        {expert?.name?.[0] || '成'}
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-zinc-500">{expert?.name || '成员'}</span>
        <button
          onClick={onOpenReport}
          className="mt-0.5 w-full max-w-md text-left rounded-2xl rounded-tl-sm bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 transition-colors overflow-hidden group"
        >
          {/* 封面头部 */}
          <div className="flex items-center gap-2 px-3.5 py-2 border-b border-zinc-800">
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-zinc-400">项目汇报</span>
            <span className="text-[10px] text-zinc-600 ml-auto group-hover:text-amber-400 transition-colors">
              点开看全文 ›
            </span>
          </div>

          {/* 判决徽章 + 核心结论 */}
          <div className="px-3.5 py-3">
            <div className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border mb-2",
              config.bg, config.border
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
              <span className={cn("text-sm font-medium", config.color)}>{data.decision}</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed line-clamp-2">{data.coreJudgment}</p>

            {/* 三个关键数字 */}
            <div className="mt-3 flex items-center gap-4">
              {data.keyNumbers.map((n, i) => (
                <div key={i} className="flex-1 text-center">
                  <p className="text-xs text-zinc-200 font-medium">{n.split(' ')[0]}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {n.split(' ').slice(1).join(' ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ========== 活动时间线 ==========

function activityIcon(type: TaskActivity['type']) {
  switch (type) {
    case 'thinking': return <Quote className="w-3 h-3" />;
    case 'plan': return <ClipboardList className="w-3 h-3" />;
    case 'search': return <Search className="w-3 h-3" />;
    case 'read': return <ExternalLink className="w-3 h-3" />;
    case 'summarize': return <FileText className="w-3 h-3" />;
    case 'analyze': return <FileText className="w-3 h-3" />;
  }
}

function ActivityTimeline({ activities }: { activities: TaskActivity[] }) {
  if (activities.length === 0) {
    return <div className="text-xs text-zinc-600 py-2">等待开始…</div>;
  }
  return (
    <div className="space-y-1.5">
      {activities.map(act => {
        const isRunning = act.status === 'running';
        return (
          <div key={act.id} className="flex items-start gap-2 text-xs">
            <span className={cn("shrink-0 mt-0.5", isRunning ? "text-amber-400" : "text-zinc-500")}>
              {isRunning
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : act.type === 'thinking'
                ? <Quote className="w-3 h-3" />
                : activityIcon(act.type)}
            </span>
            <div className="flex-1 min-w-0">
              {act.type === 'thinking' ? (
                <span className="italic text-zinc-400">"{act.label}"</span>
              ) : act.type === 'read' && act.url ? (
                <a
                  href={act.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline truncate inline-flex items-center gap-0.5 max-w-full"
                  title={act.label}
                >
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{act.label}</span>
                </a>
              ) : (
                <span className="text-zinc-300">{act.label}</span>
              )}
              {act.detail && (
                <span className="text-zinc-600 ml-1">· {act.detail}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ========== 可质疑包裹器 ==========

function Challengeable({ expertId, expertName, contextText, onChallenge, children }: {
  expertId: string;
  expertName: string;
  contextText: string;
  onChallenge: (expertId: string, expertName: string, contextText: string) => void;
  children: React.ReactNode;
}) {
  return (
    <span className="group/ch inline">
      <span className="group-hover/ch:bg-amber-500/5 rounded transition-colors">{children}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onChallenge(expertId, expertName, contextText); }}
        className="inline-flex items-center justify-center w-3.5 h-3.5 ml-0.5 text-amber-400/40 hover:text-amber-400 align-middle"
        title={`质疑这条，@${expertName}`}
      >
        <Quote className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

// ========== 成员详情抽屉（按需弹出，取代原任务看板） ==========

function MemberDetailDrawer({ expert, session, onClose, onChallenge, onMentionSelect }: {
  expert: Expert;
  session: ProjectSession;
  onClose: () => void;
  onChallenge: (expertId: string, expertName: string, contextText: string) => void;
  onMentionSelect: (expertId: string, expertName: string) => void;
}) {
  useEscClose(onClose);
  const myTasks = session.tasks.filter(t => t.expertId === expert.id);
  const myAnalysisTask = myTasks.find(t => t.type === 'analysis' && t.result && 'verdict' in (t.result || {}));
  const myResearchTasks = myTasks.filter(t => t.type === 'research');

  const verdictConfig = myAnalysisTask?.result
    ? verdictBadgeConfig((myAnalysisTask.result as AnalysisResult).verdict)
    : null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-[560px] max-w-[90vw] h-full bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 text-base font-medium">
              {expert.name?.[0] || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-200">{expert.name}</p>
              {expert.title && (
                <p className="text-xs text-zinc-500">{expert.title}</p>
              )}
            </div>
            {verdictConfig && (
              <span className={cn(
                "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border",
                verdictConfig.bg, verdictConfig.color, verdictConfig.border
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", verdictConfig.dot)} />
                {verdictConfig.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onMentionSelect(expert.id, expert.name)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs hover:bg-amber-500/20 transition-colors"
              title={`@${expert.name}`}
            >
              <AtSign className="w-3 h-3" />
              点名
            </button>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 人设卡 */}
          <DrawerSection title="人设卡">
            {expert.personaCard ? (
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{expert.personaCard}</p>
            ) : (
              <div className="space-y-2">
                {expert.background && (
                  <p className="text-sm text-zinc-400 leading-relaxed">{expert.background}</p>
                )}
                {expert.methodologySource && (
                  <p className="text-xs text-zinc-500">方法论来源：{expert.methodologySource}</p>
                )}
                {expert.judgmentCriteria && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">判断标尺</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{expert.judgmentCriteria}</p>
                  </div>
                )}
                {expert.commonObjections && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">本能质疑</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{expert.commonObjections}</p>
                  </div>
                )}
              </div>
            )}
          </DrawerSection>

          {/* 工作流水（所有任务的时间线） */}
          {myTasks.length > 0 && (
            <DrawerSection title={`工作流水（${myTasks.length} 项任务）`}>
              <div className="space-y-4">
                {myTasks.map(task => (
                  <div key={task.id} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] text-zinc-500 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 shrink-0">
                          {task.type === 'research' ? '调研' : '分析'}
                        </span>
                        <span className="text-xs font-medium text-zinc-200 truncate">{task.title}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] shrink-0",
                        task.status === 'completed' ? "text-emerald-400"
                        : task.status === 'in_progress' ? "text-amber-400"
                        : task.status === 'failed' ? "text-red-400"
                        : "text-zinc-600"
                      )}>
                        {task.status === 'completed' ? '已完成'
                        : task.status === 'in_progress' ? '进行中'
                        : task.status === 'failed' ? '失败了'
                        : '待开始'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed mb-2">{task.description}</p>
                    {task.activities && task.activities.length > 0 && (
                      <ActivityTimeline activities={task.activities} />
                    )}
                    {task.isModelKnowledge && (
                      <p className="mt-2 text-xs text-amber-400/60 bg-amber-500/5 rounded px-2 py-1">
                        {task.degradeReason || '基于模型知识，非实时调研'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </DrawerSection>
          )}

          {/* 全部发现（调研+分析） */}
          {myResearchTasks.length > 0 && myResearchTasks.some(t => t.result) && (
            <DrawerSection title="调研发现">
              <div className="space-y-4">
                {myResearchTasks.filter(t => t.result).map(task => (
                  <ResearchDetailBody
                    key={task.id}
                    result={task.result as ResearchResult}
                    expertId={expert.id}
                    expertName={expert.name}
                    onChallenge={onChallenge}
                  />
                ))}
              </div>
            </DrawerSection>
          )}

          {/* 结论和判决 */}
          {myAnalysisTask && myAnalysisTask.result && (
            <DrawerSection title="结论和判决">
              <AnalysisDetailBody
                result={myAnalysisTask.result as AnalysisResult}
                expertId={expert.id}
                expertName={expert.name}
                onChallenge={onChallenge}
              />
            </DrawerSection>
          )}

          {/* 结论轨迹（仅 analysis 有） */}
          {myAnalysisTask && myAnalysisTask.conclusionHistory && myAnalysisTask.conclusionHistory.length > 0 && (
            <DrawerSection title={`结论轨迹（${myAnalysisTask.conclusionHistory.length + 1} 版）`}>
              <div className="space-y-2">
                {myAnalysisTask.conclusionHistory.map((h, i) => (
                  <ConclusionRevisionItem
                    key={i}
                    version={h.version}
                    result={h.result}
                    reason={h.reason}
                    isCurrent={false}
                  />
                ))}
                {myAnalysisTask.result && 'verdict' in myAnalysisTask.result && (
                  <ConclusionRevisionItem
                    version={(myAnalysisTask.conclusionHistory[myAnalysisTask.conclusionHistory.length - 1]?.version || 0) + 1}
                    result={myAnalysisTask.result as AnalysisResult}
                    reason="当前结论"
                    isCurrent={true}
                  />
                )}
              </div>
            </DrawerSection>
          )}
        </div>
      </div>
    </div>
  );
}

function DrawerSection({ title, children }: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500 font-medium mb-2 uppercase tracking-wider">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ResearchDetailBody({ result, expertId, expertName, onChallenge }: {
  result: ResearchResult;
  expertId: string;
  expertName: string;
  onChallenge: (expertId: string, expertName: string, contextText: string) => void;
}) {
  return (
    <>
      <DrawerSection title="调研摘要">
        <p className="text-sm text-zinc-300 leading-relaxed">{result.summary}</p>
      </DrawerSection>

      {result.findings.length > 0 && (
        <DrawerSection title={`发现（${result.findings.length}）`}>
          {result.findings.map((f, i) => (
            <div key={i} className="text-sm leading-relaxed">
              <Challengeable
                expertId={expertId}
                expertName={expertName}
                contextText={f.detail ? `${f.point} — ${f.detail}` : f.point}
                onChallenge={onChallenge}
              >
                <span className="font-medium text-zinc-200">{f.point}</span>
                {f.detail && <span className="text-zinc-400"> — {f.detail}</span>}
              </Challengeable>
              {f.sourceIndex !== undefined && f.sourceIndex > 0 && result.sources[f.sourceIndex - 1] && (
                <span className="ml-1 text-[10px] text-blue-400/70">[{f.sourceIndex}]</span>
              )}
            </div>
          ))}
        </DrawerSection>
      )}

      {result.dataPoints.length > 0 && (
        <DrawerSection title="数据点">
          <div className="flex flex-wrap gap-1.5">
            {result.dataPoints.map((d, i) => (
              <Challengeable
                key={i}
                expertId={expertId}
                expertName={expertName}
                contextText={d}
                onChallenge={onChallenge}
              >
                <span className="text-sm text-zinc-300 bg-zinc-900 border border-zinc-800 rounded px-2 py-1">{d}</span>
              </Challengeable>
            ))}
          </div>
        </DrawerSection>
      )}

      {result.sources.length > 0 && (
        <DrawerSection title={`来源（${result.sources.length}）`}>
          <div className="space-y-2">
            {result.sources.map((s, i) => (
              <div key={i} className="text-sm">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="font-medium">{i + 1}. {s.title}</span>
                </a>
                {s.snippet && (
                  <p className="text-sm text-zinc-500 leading-relaxed mt-0.5 pl-4">{s.snippet}</p>
                )}
              </div>
            ))}
          </div>
        </DrawerSection>
      )}
    </>
  );
}

function AnalysisDetailBody({ result, expertId, expertName, onChallenge }: {
  result: AnalysisResult;
  expertId: string;
  expertName: string;
  onChallenge: (expertId: string, expertName: string, contextText: string) => void;
}) {
  const verdictConfig = {
    'pass': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', label: '能做' },
    'conditional': { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40', label: '有前提' },
    'fail': { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40', label: '不建议做' },
  };
  const config = verdictConfig[result.verdict];

  return (
    <>
      <DrawerSection title="一句话结论">
        <div className={cn("flex items-center gap-3 rounded-lg border px-4 py-3", config.bg, config.border)}>
          <span className={cn("font-serif text-2xl font-black", config.color)}>{result.oneLiner}</span>
          <span className={cn("ml-auto text-xs border rounded px-2 py-0.5", config.border, config.color)}>{config.label}</span>
        </div>
      </DrawerSection>

      {result.findings.length > 0 && (
        <DrawerSection title={`发现（${result.findings.length}）`}>
          {result.findings.map((f, i) => (
            <div key={i} className="text-sm text-zinc-300 leading-relaxed">
              <Challengeable
                expertId={expertId}
                expertName={expertName}
                contextText={f}
                onChallenge={onChallenge}
              >
                · {f}
              </Challengeable>
            </div>
          ))}
        </DrawerSection>
      )}

      {result.biggestRisk && (
        <DrawerSection title="最大风险">
          <div className="text-sm text-amber-400/90 leading-relaxed">
            <Challengeable
              expertId={expertId}
              expertName={expertName}
              contextText={result.biggestRisk}
              onChallenge={onChallenge}
            >
              {result.biggestRisk}
            </Challengeable>
          </div>
        </DrawerSection>
      )}

      {result.verdict === 'conditional' && result.preconditions && result.preconditions.length > 0 && (
        <DrawerSection title={`前提（${result.preconditions.length}）`}>
          <div className="space-y-1.5 pl-2 border-l-2 border-amber-500/30">
            {result.preconditions.map((p, i) => (
              <div key={i} className="text-sm text-amber-300/80 leading-relaxed">
                <Challengeable
                  expertId={expertId}
                  expertName={expertName}
                  contextText={p}
                  onChallenge={onChallenge}
                >
                  前提{i + 1}：{p}
                </Challengeable>
              </div>
            ))}
          </div>
        </DrawerSection>
      )}

      {result.needBossDecision && (
        <DrawerSection title="需要老板定夺">
          <p className="text-sm text-zinc-300 leading-relaxed">{result.needBossDecision}</p>
        </DrawerSection>
      )}
    </>
  );
}

function ConclusionRevisionItem({ version, result, reason, isCurrent }: {
  version: number;
  result: AnalysisResult;
  reason: string;
  isCurrent: boolean;
}) {
  const verdictColor = {
    'pass': 'text-emerald-400',
    'conditional': 'text-amber-400',
    'fail': 'text-red-400',
  }[result.verdict];

  return (
    <div className="text-xs">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={cn("font-medium", isCurrent ? "text-zinc-200" : "text-zinc-500")}>v{version}</span>
        <span className={verdictColor}>{result.oneLiner}</span>
        <span className="text-zinc-600">（{verdictLabel(result.verdict)}）</span>
        {isCurrent && (
          <span className="text-[10px] text-amber-400/80 border border-amber-500/30 rounded px-1">当前</span>
        )}
      </div>
      <p className="text-zinc-600 leading-relaxed mt-0.5">{reason}</p>
    </div>
  );
}

// ========== 报告抽屉（按需弹出，取代原 Tab） ==========

function ReportDrawer({ report, onReset, reportStale, onRefreshReport, reportVersions, onClose, refreshing }: {
  report: Report;
  onReset: () => void;
  reportStale?: boolean;
  onRefreshReport: () => void;
  reportVersions: ReportVersion[];
  onClose: () => void;
  refreshing?: boolean;
}) {
  useEscClose(onClose);
  const [copied, setCopied] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const handleCopy = () => {
    const md = reportToMarkdown(report);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const decisionConfig: Record<string, { color: string; bg: string; border: string }> = {
    '做': { color: BADGE_COLORS.green.color, bg: BADGE_COLORS.green.bgSoft, border: BADGE_COLORS.green.borderSoft },
    '不做': { color: BADGE_COLORS.red.color, bg: BADGE_COLORS.red.bgSoft, border: BADGE_COLORS.red.borderSoft },
    '换个做法': { color: BADGE_COLORS.amber.color, bg: BADGE_COLORS.amber.bgSoft, border: BADGE_COLORS.amber.borderSoft },
  };
  const dConfig = decisionConfig[report.conclusion.decision];

  const currentVersion = reportVersions.length === 0 ? "1.0" : `1.${reportVersions.length}`;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-[720px] max-w-[92vw] h-full bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-sm font-medium text-zinc-200">项目汇报</span>
            <span className="text-xs text-zinc-500">v{currentVersion}</span>
            {reportVersions.length > 0 && (
              <button
                onClick={() => setShowVersions(!showVersions)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <History className="w-3 h-3" />
                历史版本（{reportVersions.length}）
                {showVersions ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors",
                copied
                  ? "border-emerald-500/50 text-emerald-400"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "已复制" : "复制 Markdown"}
            </button>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 待刷新提示条 */}
        {reportStale && (
          <div className="mx-5 mt-3 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 shrink-0">
            <RefreshCw className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-300 font-medium">有成员更新了结论，汇报待刷新</p>
            </div>
            <button
              onClick={onRefreshReport}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 text-zinc-950 text-xs font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 shrink-0"
            >
              {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {refreshing ? "更新中..." : "更新汇报"}
            </button>
          </div>
        )}

        {showVersions && reportVersions.length > 0 && (
          <div className="mx-5 mt-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 space-y-2 shrink-0">
            {reportVersions.map((v, i) => (
              <div key={i} className="text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-zinc-400 font-medium">v{v.version}</span>
                  <span className="text-zinc-600">
                    {new Date(v.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {v.changeSummary && (
                  <p className="text-zinc-500 mt-0.5 leading-relaxed">{v.changeSummary}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* 顶部结论 */}
          <div className="mb-6">
            <div className={cn("inline-flex items-center gap-3 px-4 py-2 rounded-xl border", dConfig.bg, dConfig.border)}>
              <span className={cn("font-serif text-3xl font-black", dConfig.color)}>
                {report.conclusion.decision}
              </span>
            </div>
            <p className="mt-3 text-zinc-300 text-sm leading-relaxed">{report.conclusion.coreJudgment}</p>

            {/* 为什么是这个判断 */}
            {report.conclusion.whyNot && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                <p className="text-xs text-amber-400/80 font-medium mb-1.5 flex items-center gap-1">
                  <Quote className="w-3 h-3" />
                  为什么是这个判断
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed">{report.conclusion.whyNot}</p>
              </div>
            )}

            {/* 被启发的新方向（仅 decision≠"做" 时显示） */}
            {report.conclusion.decision !== '做' && report.conclusion.inspiredDirections && report.conclusion.inspiredDirections.length > 0 && (
              <div className="mt-3 rounded-lg border border-zinc-700 bg-zinc-900/40 px-4 py-3">
                <p className="text-xs text-zinc-400 font-medium mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  被启发的新方向
                </p>
                <ul className="space-y-1.5">
                  {report.conclusion.inspiredDirections.map((d, i) => (
                    <li key={i} className="text-sm text-zinc-300 leading-relaxed flex gap-2">
                      <span className="text-amber-400/60 shrink-0">{i + 1}.</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 团队分歧 */}
          <ReportSection title="团队分歧">
            <p className="text-sm text-zinc-300 leading-relaxed">{report.teamDisagreement}</p>
          </ReportSection>

          {/* 调研发现 */}
          {(report.researchFindings.competitors || report.researchFindings.userPainPoints) && (
            <ReportSection title="调研发现">
              {report.researchFindings.competitors && (
                <div className="mb-3">
                  <p className="text-xs text-amber-400/80 font-medium mb-1">竞品格局</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{report.researchFindings.competitors}</p>
                </div>
              )}
              {report.researchFindings.userPainPoints && (
                <div className="mb-3">
                  <p className="text-xs text-amber-400/80 font-medium mb-1">用户痛点</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{report.researchFindings.userPainPoints}</p>
                </div>
              )}
              {report.researchFindings.sources.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">来源</p>
                  <ul className="space-y-1">
                    {report.researchFindings.sources.map((s, i) => (
                      <li key={i}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline">
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </ReportSection>
          )}

          {/* PRD */}
          <ReportSection title="方案（PRD）">
            <div className="space-y-4">
              <PRDField label="问题" content={report.prd.problem} />
              <PRDField label="目标用户" content={report.prd.targetUser} />
              <PRDField label="解决方案" content={report.prd.solution} />
              <PRDField label="核心功能" content={report.prd.coreFeatures} />
              <PRDField label="技术可行性" content={report.prd.technicalFeasibility} />
              <PRDField label="商业模式" content={report.prd.businessModel} />
              <PRDField label="未来推演" content={report.prd.futureEvolution} />
              <PRDField label="下一步" content={report.prd.nextStep} />
            </div>
          </ReportSection>

          {/* 未来推演 */}
          <ReportSection title="未来推演">
            <div className="space-y-2">
              <div className="flex gap-3">
                <span className="text-xs text-amber-400/80 font-medium shrink-0 w-16">3个月</span>
                <p className="text-sm text-zinc-300 leading-relaxed">{report.futureEvolution.threeMonths}</p>
              </div>
              <div className="flex gap-3">
                <span className="text-xs text-amber-400/80 font-medium shrink-0 w-16">6个月</span>
                <p className="text-sm text-zinc-300 leading-relaxed">{report.futureEvolution.sixMonths}</p>
              </div>
              <div className="flex gap-3">
                <span className="text-xs text-amber-400/80 font-medium shrink-0 w-16">12个月</span>
                <p className="text-sm text-zinc-300 leading-relaxed">{report.futureEvolution.twelveMonths}</p>
              </div>
            </div>
          </ReportSection>

          {/* 待验证清单 */}
          {report.validationChecklist.length > 0 && (
            <ReportSection title="待验证清单">
              <ul className="space-y-2">
                {report.validationChecklist.map((v, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-300 leading-relaxed">
                    <span className="text-amber-400/60 shrink-0">{i + 1}.</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </ReportSection>
          )}

          <button
            onClick={onReset}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            开始新项目
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <h3 className="font-medium text-sm text-amber-400 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function PRDField({ label, content }: { label: string; content: string }) {
  if (!content) return null;
  return (
    <div>
      <span className="text-xs text-zinc-500 font-medium">{label}</span>
      <p className="text-sm text-zinc-300 leading-relaxed mt-0.5">{content}</p>
    </div>
  );
}

// ========== Markdown 转换 ==========

function reportToMarkdown(report: Report): string {
  const whyNotSection = report.conclusion.whyNot
    ? `\n## 为什么是这个判断\n${report.conclusion.whyNot}\n`
    : '';
  const inspiredSection = report.conclusion.decision !== '做' && report.conclusion.inspiredDirections && report.conclusion.inspiredDirections.length > 0
    ? `\n## 被启发的新方向\n${report.conclusion.inspiredDirections.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n`
    : '';

  return `# 项目汇报

## 结论
**${report.conclusion.decision}**
${report.conclusion.coreJudgment}
${whyNotSection}${inspiredSection}
## 团队分歧
${report.teamDisagreement}

## 调研发现
### 竞品格局
${report.researchFindings.competitors}

### 用户痛点
${report.researchFindings.userPainPoints}

### 来源
${report.researchFindings.sources.map(s => `- [${s.title}](${s.url})`).join('\n')}

## 方案（PRD）
### 问题
${report.prd.problem}

### 目标用户
${report.prd.targetUser}

### 解决方案
${report.prd.solution}

### 核心功能
${report.prd.coreFeatures}

### 技术可行性
${report.prd.technicalFeasibility}

### 商业模式
${report.prd.businessModel}

### 未来推演
${report.prd.futureEvolution}

### 下一步
${report.prd.nextStep}

## 未来推演
- 3个月：${report.futureEvolution.threeMonths}
- 6个月：${report.futureEvolution.sixMonths}
- 12个月：${report.futureEvolution.twelveMonths}

## 待验证清单
${report.validationChecklist.map((v, i) => `${i + 1}. ${v}`).join('\n')}
`;
}
