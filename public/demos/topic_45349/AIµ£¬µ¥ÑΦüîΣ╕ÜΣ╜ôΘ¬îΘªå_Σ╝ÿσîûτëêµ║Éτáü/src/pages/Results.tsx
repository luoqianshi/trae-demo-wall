import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ICONS } from "@/lib/icons";
import Layout from "@/components/Layout";
import CareerCard from "@/components/CareerCard";
import NeonButton from "@/components/NeonButton";
import { useAppStore } from "@/store/useAppStore";
import { CAREERS } from "@/data/careers";
import {
  INTEREST_OPTIONS,
  SUBJECT_OPTIONS,
  DISLIKED_WORK_OPTIONS,
  PERSONALITY_DIMENSIONS,
  type Recommendation,
} from "@/types";

export default function Results() {
  const { userProfile, recommendations, hasInput, browseMode, selectCareer } = useAppStore();

  // 浏览模式：无画像时展示全部职业
  const isBrowse = browseMode || (!hasInput && recommendations.length === 0);

  // 浏览模式构造全量推荐列表（匹配度用占位）
  const displayRecs: Recommendation[] = useMemo(() => {
    if (isBrowse) {
      return CAREERS.map((career, i) => ({
        career,
        matchScore: 0,
        reason: career.reason,
        _browseIndex: i,
      } as Recommendation & { _browseIndex: number }));
    }
    return recommendations;
  }, [isBrowse, recommendations]);

  if (!isBrowse && (!hasInput || recommendations.length === 0)) {
    return null;
  }

  const topBreakdown = displayRecs[0]?.scoreBreakdown;

  const interestLabels = userProfile.interests
    .map((id) => INTEREST_OPTIONS.find((o) => o.id === id)?.label)
    .filter(Boolean);
  const subjectLabels = userProfile.strongSubjects
    .map((id) => SUBJECT_OPTIONS.find((o) => o.id === id)?.label)
    .filter(Boolean);
  const dislikeLabels = userProfile.dislikedWork
    .map((id) => DISLIKED_WORK_OPTIONS.find((o) => o.id === id)?.label)
    .filter(Boolean);

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-4rem)] py-12">
        {/* 背景 */}
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-neon-magenta/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6">
          {/* 标题 */}
          <div className="mb-10 text-center">
            {isBrowse ? (
              <>
                <p className="font-mono text-sm tracking-widest text-neon-magenta">
                  BROWSE MODE · 自由探索
                </p>
                <h1 className="mt-3 font-display text-4xl font-bold text-ink-100 sm:text-5xl">
                  浏览全部<span className="gradient-text">未来职业</span>
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-ink-300">
                  选择任意职业，进入沉浸式一天体验。也可以随时回来填写画像获取 AI 推荐。
                </p>
                <div className="mt-6">
                  <Link to="/input">
                    <NeonButton variant="ghost" size="sm">
                      <ICONS.Sparkles className="h-4 w-4" />
                      去填写画像获取精准推荐
                    </NeonButton>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="font-mono text-sm tracking-widest text-neon-cyan">
                  STEP 02 · AI RECOMMENDATIONS
                </p>
                <h1 className="mt-3 font-display text-4xl font-bold text-ink-100 sm:text-5xl">
                  AI 为你锁定<span className="gradient-text"> 3 个未来职业</span>
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-ink-300">
                  基于你的五维画像，推荐算法从扩展职业库中筛选出较匹配的 Top 3
                </p>
              </>
            )}
          </div>

          {/* 用户画像摘要（仅推荐模式） */}
          {!isBrowse && (
            <div className="glass-card mb-10 animate-fade-up p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <ICONS.UserCircle className="h-5 w-5 text-neon-cyan" />
                <h2 className="font-display text-lg font-bold text-ink-100">你的画像摘要</h2>
                <Link to="/input" className="ml-auto font-mono text-xs text-ink-300 hover:text-neon-cyan">
                  ← 修改
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* 兴趣 */}
                <div>
                  <p className="mb-2 font-mono text-xs text-ink-300">INTERESTS · 兴趣</p>
                  <div className="flex flex-wrap gap-1.5">
                    {interestLabels.length > 0 ? (
                      interestLabels.map((label) => (
                        <span key={label} className="rounded border border-neon-cyan/30 bg-neon-cyan/5 px-2 py-0.5 text-xs text-neon-cyan">
                          {label}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-ink-400">未选择</span>
                    )}
                  </div>
                </div>

                {/* 科目 */}
                <div>
                  <p className="mb-2 font-mono text-xs text-ink-300">SUBJECTS · 科目</p>
                  <div className="flex flex-wrap gap-1.5">
                    {subjectLabels.length > 0 ? (
                      subjectLabels.map((label) => (
                        <span key={label} className="rounded border border-neon-gold/30 bg-neon-gold/5 px-2 py-0.5 text-xs text-neon-gold">
                          {label}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-ink-400">未选择</span>
                    )}
                  </div>
                </div>

                {/* 讨厌 */}
                <div>
                  <p className="mb-2 font-mono text-xs text-ink-300">AVOID · 避免</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dislikeLabels.length > 0 ? (
                      dislikeLabels.map((label) => (
                        <span key={label} className="rounded border border-neon-magenta/30 bg-neon-magenta/5 px-2 py-0.5 text-xs text-neon-magenta">
                          {label}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-ink-400">未选择</span>
                    )}
                  </div>
                </div>

                {/* 性格 */}
                <div>
                  <p className="mb-2 font-mono text-xs text-ink-300">PERSONALITY · 性格</p>
                  <div className="space-y-1">
                    {PERSONALITY_DIMENSIONS.map((dim) => {
                      const value = userProfile.personality[dim.key];
                      return (
                        <div key={dim.key} className="flex items-center gap-2 font-mono text-[10px]">
                          <span className="w-8 text-ink-400">{dim.leftLabel}</span>
                          <div className="relative h-1 flex-1 rounded-full bg-white/5">
                            <div
                              className="absolute h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
                              style={{ width: `${value}%` }}
                            />
                            <div
                              className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-neon-cyan"
                              style={{ left: `calc(${value}% - 4px)` }}
                            />
                          </div>
                          <span className="w-8 text-ink-400">{dim.rightLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 未来期待 */}
              {userProfile.futureExpectation && (
                <div className="mt-6 border-t border-white/5 pt-4">
                  <p className="mb-1.5 font-mono text-xs text-ink-300">EXPECTATION · 未来期待</p>
                  <p className="text-sm italic text-ink-200">「{userProfile.futureExpectation}」</p>
                </div>
              )}
            </div>
          )}



          {/* 推荐依据可视化 */}
          {!isBrowse && topBreakdown && (
            <section className="glass-card mb-10 animate-fade-up p-6 sm:p-7" style={{ animationDelay: "80ms" }}>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <ICONS.BrainCircuit className="h-5 w-5 text-neon-cyan" />
                <h2 className="font-display text-lg font-bold text-ink-100">推荐依据拆解</h2>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-ink-300">
                  最高匹配职业 · {displayRecs[0].career.name}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { label: "兴趣匹配", value: topBreakdown.interests, color: "bg-neon-cyan", text: "text-neon-cyan" },
                  { label: "科目契合", value: topBreakdown.subjects, color: "bg-neon-gold", text: "text-neon-gold" },
                  { label: "性格适配", value: topBreakdown.personality, color: "bg-neon-magenta", text: "text-neon-magenta" },
                  { label: "避雷安全", value: topBreakdown.dislike, color: "bg-neon-green", text: "text-neon-green" },
                  { label: "综合指数", value: topBreakdown.composite, color: "bg-white", text: "text-ink-100" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-ink-300">{item.label}</span>
                      <span className={`font-display text-lg font-bold ${item.text}`}>{item.value}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-ink-300">
                这不是简单按兴趣排序，而是同时考虑你喜欢什么、擅长什么、性格节奏是否匹配，以及你明确不想接触的工作方式。
              </p>
            </section>
          )}

          {/* 职业卡片 */}
          <div className={isBrowse ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-6 lg:grid-cols-3"}>
            {displayRecs.map((rec, i) => (
              <div
                key={rec.career.id}
                onMouseEnter={() => selectCareer(rec.career.id)}
              >
                <CareerCard recommendation={rec} index={i} browseMode={isBrowse} />
              </div>
            ))}
          </div>

          {/* 底部操作 */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
            <Link to="/input">
              <NeonButton variant="ghost">
                <ICONS.RotateCcw className="h-4 w-4" />
                {isBrowse ? "填写画像获取推荐" : "重新填写信息"}
              </NeonButton>
            </Link>
            {!isBrowse && (
              <div className="text-center sm:text-right">
                <p className="mb-2 font-mono text-xs text-ink-300">
                  体验完职业的一天后，可生成完整报告
                </p>
                <Link to="/report">
                  <NeonButton variant="secondary" className="group">
                    <ICONS.FileText className="h-4 w-4" />
                    直接生成体验报告
                    <ICONS.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </NeonButton>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
