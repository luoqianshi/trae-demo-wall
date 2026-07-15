import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { useNavigate } from "react-router-dom";
import { Archive, FileText, Plus, ChevronRight, ChevronDown, RefreshCw, ListChecks, MessageCircle, Play, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasActiveProviderConfig } from "@/lib/llm";
import type { ProjectSession, Report } from "@/lib/types";

export default function ArchivePage() {
  const navigate = useNavigate();
  const { sessions, loadSessionsFromStorage, restartProject, resetProject, resumeSession, config, loadConfigFromStorage } = useProjectStore();
  const [selectedSession, setSelectedSession] = useState<ProjectSession | null>(null);
  const [historyExpandedId, setHistoryExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadSessionsFromStorage();
    loadConfigFromStorage();
  }, [loadSessionsFromStorage, loadConfigFromStorage]);

  const hasKey = hasActiveProviderConfig(config);

  // 按想法分组（同 ideaId 视为同一想法的多次交办）
  const groupedByIdea = sessions.reduce((acc, session) => {
    const key = session.ideaId;
    if (!acc[key]) {
      acc[key] = { idea: session.idea, sessions: [] };
    }
    acc[key].sessions.push(session);
    return acc;
  }, {} as Record<string, { idea: string; sessions: ProjectSession[] }>);

  const ideas = Object.entries(groupedByIdea).sort((a, b) => {
    const aTime = Math.max(...a[1].sessions.map(s => s.createdAt.getTime()));
    const bTime = Math.max(...b[1].sessions.map(s => s.createdAt.getTime()));
    return bTime - aTime;
  });

  const handleRestart = async (sessionId: string) => {
    if (!hasKey) {
      navigate("/settings");
      return;
    }
    resetProject();
    await restartProject(sessionId);
    navigate("/");
  };

  // 继续追问：把已 done 的 session 恢复为当前，保留群消息/任务卡/汇报版本
  const handleContinueQuestioning = (sessionId: string) => {
    resumeSession(sessionId);
    navigate("/");
  };

  // 继续项目：把未完成的 session 恢复为当前，从断点继续
  const handleContinueProject = (sessionId: string) => {
    if (!hasKey) {
      navigate("/settings");
      return;
    }
    resumeSession(sessionId);
    navigate("/");
  };

  return (
    <div className="min-h-full">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex items-center gap-2 text-amber-500 mb-3">
          <Archive className="w-4 h-4" />
          <span className="text-sm font-medium">档案</span>
        </div>
        <h1 className="font-serif text-4xl font-black mb-2">项目档案</h1>
        <p className="text-zinc-400 text-sm mb-10">
          所有交办过的想法和团队汇报。可以选一个旧想法再次交办，带着上版汇报迭代出 2.0。
        </p>

        {ideas.length === 0 ? (
          <div className="text-center py-20">
            <Archive className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">还没有项目记录</p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 text-zinc-950 text-sm font-medium hover:bg-amber-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              交办第一个想法
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {ideas.map(([ideaId, group]) => {
              const sortedSessions = [...group.sessions].sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
              );
              return (
                <div key={ideaId} className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-800/80">
                    <p className="text-xs text-zinc-500 mb-1">想法</p>
                    <p className="text-zinc-200 text-sm leading-relaxed">{group.idea}</p>
                  </div>

                  <div className="divide-y divide-zinc-800/60">
                    {sortedSessions.map((session, idx) => {
                      const versionLabel = session.parentSessionId
                        ? `汇报 ${sortedSessions.length - idx}.0`
                        : `汇报 1.0`;
                      const expanded = selectedSession?.id === session.id;
                      return (
                        <div
                          key={session.id}
                          className="px-5 py-4 hover:bg-zinc-900/60 transition-colors cursor-pointer"
                          onClick={() => setSelectedSession(expanded ? null : session)}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-medium">
                                {sortedSessions.length - idx}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm text-zinc-200 font-medium">{versionLabel}</span>
                                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs">
                                    {session.domain}
                                  </span>
                                  {session.report && (
                                    <ConclusionTag report={session.report} />
                                  )}
                                  {session.report && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                                      v{getCurrentReportVersion(session)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  {session.createdAt.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })}
                                  {' · '}
                                  {session.tasks.length} 个任务
                                  {' · '}
                                  {session.groupMessages.length} 条工作群消息
                                  {' · '}
                                  {session.experts.length} 位成员
                                </p>
                              </div>
                            </div>
                            <ChevronRight className={cn(
                              "w-4 h-4 text-zinc-600 transition-transform shrink-0",
                              expanded && "rotate-90"
                            )} />
                          </div>

                          {expanded && (
                            <div className="mt-4 space-y-4">
                              {/* 团队成员 */}
                              <div>
                                <p className="text-xs text-zinc-500 mb-2">团队</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {session.experts.map(e => (
                                    <span key={e.id} className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs">
                                      {e.name} · {e.title}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* 汇报预览 */}
                              {session.report ? (
                                <ReportPreview report={session.report} />
                              ) : (
                                <p className="text-xs text-zinc-600 italic">这场尚未生成汇报</p>
                              )}

                              {/* 历史汇报版本（追问刷新产生的旧版本归档） */}
                              {session.reportVersions.length > 0 && (
                                <div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHistoryExpandedId(historyExpandedId === session.id ? null : session.id);
                                    }}
                                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                                  >
                                    {historyExpandedId === session.id ? (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    )}
                                    查看历史版本（{session.reportVersions.length}）
                                  </button>
                                  {historyExpandedId === session.id && (
                                    <div className="mt-2 space-y-2 pl-5">
                                      {session.reportVersions.map((rv, i) => (
                                        <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-2.5 space-y-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400/90 text-xs font-medium">
                                              v{rv.version}
                                            </span>
                                            <span className="text-xs text-zinc-500">
                                              {rv.createdAt.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })}
                                            </span>
                                          </div>
                                          {rv.changeSummary && (
                                            <p className="text-xs text-zinc-400 leading-relaxed">
                                              <span className="text-amber-400/70">变更：</span>
                                              {rv.changeSummary}
                                            </p>
                                          )}
                                          <div className="text-xs text-zinc-400 leading-relaxed">
                                            <span className="text-amber-400/70">当时结论：</span>
                                            {rv.report.conclusion.decision} · {rv.report.conclusion.coreJudgment}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 老板插话记录 */}
                              {session.bossInterruptions.length > 0 && (
                                <div>
                                  <p className="text-xs text-zinc-500 mb-2">老板插话</p>
                                  <div className="space-y-1">
                                    {session.bossInterruptions.map((b, i) => (
                                      <p key={i} className="text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1">
                                        {b.content}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 操作 */}
                              <div className="flex gap-2 pt-2 flex-wrap">
                                {session.stage === 'done' && session.report && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleContinueQuestioning(session.id);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium hover:bg-zinc-700 transition-colors"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    继续追问
                                  </button>
                                )}
                                {session.stage !== 'done' && session.stage !== 'idle' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleContinueProject(session.id);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-xs font-medium hover:bg-amber-400 transition-colors"
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                    继续项目
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestart(session.id);
                                  }}
                                  className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                    hasKey
                                      ? "bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                                      : "bg-zinc-800 border border-amber-500/40 text-amber-400 hover:bg-zinc-700"
                                  )}
                                  title={hasKey ? undefined : "需要先配置 API Key"}
                                >
                                  {hasKey ? <RefreshCw className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5" />}
                                  {hasKey ? "再次交办（带上一版迭代 2.0）" : "先去配置才能再次交办"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// 当前汇报版本号：初始汇报是 1.0 不存进 reportVersions，
// 每次追问刷新后把旧版本归档进 reportVersions，所以当前版本 = 1.{reportVersions.length}
function getCurrentReportVersion(session: ProjectSession): string {
  return session.reportVersions.length === 0
    ? '1.0'
    : `1.${session.reportVersions.length}`;
}

function ConclusionTag({ report }: { report: Report }) {
  const decision = report.conclusion.decision;
  const tone = decision === '做'
    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    : decision === '不做'
      ? 'bg-red-500/10 border-red-500/30 text-red-400'
      : 'bg-amber-500/10 border-amber-500/30 text-amber-400';
  return (
    <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs", tone)}>
      <FileText className="w-3 h-3" />
      {decision}
    </span>
  );
}

function ReportPreview({ report }: { report: Report }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 space-y-2">
      <div>
        <span className="text-xs text-amber-400/80 font-medium">核心判断：</span>
        <span className="text-xs text-zinc-300 leading-relaxed">{report.conclusion.coreJudgment}</span>
      </div>
      <div>
        <span className="text-xs text-amber-400/80 font-medium">团队分歧：</span>
        <span className="text-xs text-zinc-400 leading-relaxed">{report.teamDisagreement}</span>
      </div>
      <div>
        <span className="text-xs text-amber-400/80 font-medium">竞品格局：</span>
        <span className="text-xs text-zinc-400 leading-relaxed">{report.researchFindings.competitors}</span>
      </div>
      <div className="flex items-start gap-1.5">
        <ListChecks className="w-3 h-3 text-amber-400/60 mt-0.5 shrink-0" />
        <span className="text-xs text-zinc-400 leading-relaxed">
          待验证清单：{report.validationChecklist.length} 条
        </span>
      </div>
    </div>
  );
}
