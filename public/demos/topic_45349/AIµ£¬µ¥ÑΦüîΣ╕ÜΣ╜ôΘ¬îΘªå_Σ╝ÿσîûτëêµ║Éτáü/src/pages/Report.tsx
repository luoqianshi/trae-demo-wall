import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ICONS } from "@/lib/icons";
import Layout from "@/components/Layout";
import NeonButton from "@/components/NeonButton";
import { useAppStore } from "@/store/useAppStore";
import {
  INTEREST_OPTIONS,
  SUBJECT_OPTIONS,
  DISLIKED_WORK_OPTIONS,
  PERSONALITY_DIMENSIONS,
} from "@/types";
import { cn } from "@/lib/utils";

const accentMap = {
  cyan: { text: "text-neon-cyan", border: "border-neon-cyan/40", bg: "bg-neon-cyan/10", stroke: "#00f0ff" },
  magenta: { text: "text-neon-magenta", border: "border-neon-magenta/40", bg: "bg-neon-magenta/10", stroke: "#ff2e88" },
  gold: { text: "text-neon-gold", border: "border-neon-gold/40", bg: "bg-neon-gold/10", stroke: "#ffb800" },
  green: { text: "text-neon-green", border: "border-neon-green/40", bg: "bg-neon-green/10", stroke: "#39ff14" },
};

export default function Report() {
  const navigate = useNavigate();
  const { userProfile, recommendations, report, generateReport, hasInput } = useAppStore();

  useEffect(() => {
    if (!hasInput) {
      navigate("/input");
    } else if (!report && recommendations.length > 0) {
      generateReport();
    }
  }, [hasInput, report, recommendations.length, generateReport, navigate]);

  if (!hasInput || recommendations.length === 0) {
    return null;
  }

  const generatedDate = report
    ? new Date(report.generatedAt).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const interestLabels = userProfile.interests
    .map((id) => INTEREST_OPTIONS.find((o) => o.id === id)?.label)
    .filter(Boolean);
  const subjectLabels = userProfile.strongSubjects
    .map((id) => SUBJECT_OPTIONS.find((o) => o.id === id)?.label)
    .filter(Boolean);
  const dislikeLabels = userProfile.dislikedWork
    .map((id) => DISLIKED_WORK_OPTIONS.find((o) => o.id === id)?.label)
    .filter(Boolean);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `我刚在《AI 未来职业体验馆》生成了专属职业报告！\n\n推荐职业：${recommendations
      .map((r) => `${r.career.name}（匹配度 ${r.matchScore}%）`)
      .join("、")}\n\n快来体验你的未来职业 →`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "AI 未来职业体验报告", text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("报告摘要已复制到剪贴板！");
      }
    } catch {
      // 用户取消分享
    }
  };

  const actionPlan = report?.actionPlan || { short: [], mid: [], long: [] };
  const reportId = report
    ? `FC-${new Date(report.generatedAt).getTime().toString(36).toUpperCase()}-${report.selectedCareerId.slice(0, 4).toUpperCase()}`
    : "FC-PREVIEW";

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-4rem)] py-12">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />

        <div className="relative mx-auto max-w-4xl px-6">
          {/* 报告封面 */}
          <div className="glass-card mb-8 animate-fade-up overflow-hidden">
            {/* 装饰边框 */}
            <div className="relative border-b border-white/10 p-8 text-center sm:p-12">
              {/* 角标装饰 */}
              <div className="absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-neon-cyan/40" />
              <div className="absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-neon-cyan/40" />
              <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-neon-magenta/40" />
              <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-neon-magenta/40" />

              <p className="font-mono text-xs tracking-[0.3em] text-neon-cyan">
                FUTURE CAREER EXPERIENCE REPORT
              </p>
              <h1 className="mt-4 font-display text-3xl font-black text-ink-100 sm:text-5xl">
                未来职业<span className="gradient-text">体验报告</span>
              </h1>
              <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-4 font-mono text-xs text-ink-300">
                <span className="flex items-center gap-1.5">
                  <ICONS.Calendar className="h-3 w-3" />
                  {generatedDate}
                </span>
                <span className="h-3 w-px bg-white/20" />
                <span className="flex items-center gap-1.5">
                  <ICONS.Hash className="h-3 w-3" />
                  ID: {reportId}
                </span>
              </div>
            </div>

            {/* 用户画像 */}
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <ICONS.UserCircle className="h-4 w-4 text-neon-cyan" />
                <h2 className="font-display text-base font-bold text-ink-100">用户画像</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="mb-1.5 font-mono text-[10px] uppercase text-ink-300">兴趣领域</p>
                  <p className="text-sm text-ink-100">{interestLabels.join("、")}</p>
                </div>
                <div>
                  <p className="mb-1.5 font-mono text-[10px] uppercase text-ink-300">擅长科目</p>
                  <p className="text-sm text-ink-100">{subjectLabels.join("、")}</p>
                </div>
                <div>
                  <p className="mb-1.5 font-mono text-[10px] uppercase text-ink-300">避免类型</p>
                  <p className="text-sm text-ink-100">{dislikeLabels.join("、")}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-5">
                {PERSONALITY_DIMENSIONS.map((dim) => {
                  const value = userProfile.personality[dim.key];
                  return (
                    <div key={dim.key}>
                      <p className="mb-1 font-mono text-[10px] text-ink-300">
                        {dim.leftLabel}→{dim.rightLabel}
                      </p>
                      <div className="h-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-ink-400">{value}</p>
                    </div>
                  );
                })}
              </div>
              {userProfile.futureExpectation && (
                <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <p className="mb-1 font-mono text-[10px] uppercase text-ink-300">未来期待</p>
                  <p className="text-sm italic text-ink-200">「{userProfile.futureExpectation}」</p>
                </div>
              )}
            </div>
          </div>

          {/* 推荐职业汇总 */}
          <section className="glass-card mb-8 animate-fade-up p-6 sm:p-8" style={{ animationDelay: "100ms" }}>
            <div className="mb-6 flex items-center gap-2">
              <ICONS.Award className="h-4 w-4 text-neon-gold" />
              <h2 className="font-display text-lg font-bold text-ink-100">AI 推荐职业 Top 3</h2>
              <span className="ml-auto font-mono text-xs text-ink-300">RECOMMENDATIONS</span>
            </div>
            <div className="space-y-4">
              {recommendations.map((rec, i) => {
                const career = rec.career;
                const accent = accentMap[career.accentColor];
                const Icon = ICONS[career.icon] || ICONS.Compass;
                return (
                  <div
                    key={career.id}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border p-4 transition-all hover:bg-white/[0.04]",
                      accent.border,
                      accent.bg
                    )}
                  >
                    <span className="font-display text-2xl font-black text-ink-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border", accent.border)}>
                      <Icon className={cn("h-6 w-6", accent.text)} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-base font-bold text-ink-100">{career.name}</h3>
                      <p className="font-mono text-xs text-ink-300">{career.enName}</p>
                    </div>
                    <div className="text-right">
                      <div className={cn("font-display text-xl font-bold", accent.text)}>{rec.matchScore}%</div>
                      <div className="font-mono text-[10px] text-ink-300">MATCH</div>
                    </div>
                    <Link
                      to={`/experience/${career.id}`}
                      className="ml-2 hidden rounded-lg border border-white/10 p-2 text-ink-300 transition-all hover:border-neon-cyan/40 hover:text-neon-cyan sm:block"
                    >
                      <ICONS.ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>



          {/* 职业横向对比 */}
          <section className="glass-card mb-8 animate-fade-up p-6 sm:p-8" style={{ animationDelay: "130ms" }}>
            <div className="mb-5 flex items-center gap-2">
              <ICONS.BarChart3 className="h-4 w-4 text-neon-cyan" />
              <h2 className="font-display text-lg font-bold text-ink-100">Top 3 横向对比</h2>
              <span className="ml-auto font-mono text-xs text-ink-300">COMPARISON</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/5">
              <div className="grid grid-cols-[1.1fr_.8fr_.8fr_.8fr] bg-white/[0.03] px-4 py-3 font-mono text-[10px] text-ink-300">
                <span>职业</span>
                <span>匹配度</span>
                <span>核心优势</span>
                <span>主要风险</span>
              </div>
              {recommendations.map((rec) => (
                <div key={rec.career.id} className="grid grid-cols-[1.1fr_.8fr_.8fr_.8fr] gap-3 border-t border-white/5 px-4 py-4 text-xs text-ink-200">
                  <span className="font-semibold text-ink-100">{rec.career.name}</span>
                  <span className="font-mono text-neon-cyan">{rec.matchScore}%</span>
                  <span>{rec.career.abilities[0]?.name || "综合能力"}</span>
                  <span>{rec.career.risks[0]?.title || "需要持续学习"}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 推荐逻辑说明 */}
          <section className="glass-card mb-8 animate-fade-up p-6 sm:p-8" style={{ animationDelay: "150ms" }}>
            <div className="mb-4 flex items-center gap-2">
              <ICONS.BrainCircuit className="h-4 w-4 text-neon-cyan" />
              <h2 className="font-display text-lg font-bold text-ink-100">AI 推荐逻辑</h2>
              <span className="ml-auto font-mono text-xs text-ink-300">ALGORITHM</span>
            </div>
            <p className="text-sm leading-relaxed text-ink-200">
              本报告基于神经匹配引擎，综合你的<span className="text-neon-cyan">兴趣匹配（30%）</span>、
              <span className="text-neon-gold">科目契合（25%）</span>、
              <span className="text-neon-magenta">性格距离（25%）</span>与
              <span className="text-neon-green">讨厌项惩罚（20%）</span>四维度评分，
              从扩展未来职业库中筛选出最匹配的 Top 3。
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "兴趣匹配", weight: "30%", color: "text-neon-cyan" },
                { label: "科目契合", weight: "25%", color: "text-neon-gold" },
                { label: "性格距离", weight: "25%", color: "text-neon-magenta" },
                { label: "讨厌惩罚", weight: "20%", color: "text-neon-green" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-center">
                  <div className={cn("font-display text-lg font-bold", item.color)}>{item.weight}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-ink-300">{item.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 行动建议 */}
          <section className="glass-card mb-8 animate-fade-up p-6 sm:p-8" style={{ animationDelay: "200ms" }}>
            <div className="mb-6 flex items-center gap-2">
              <ICONS.Compass className="h-4 w-4 text-neon-magenta" />
              <h2 className="font-display text-lg font-bold text-ink-100">行动建议</h2>
              <span className="ml-auto font-mono text-xs text-ink-300">ACTION PLAN</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <ActionCard
                title="短期行动"
                period="1-2 周内"
                items={actionPlan.short}
                icon="Zap"
                accent="cyan"
              />
              <ActionCard
                title="中期行动"
                period="1-6 个月"
                items={actionPlan.mid}
                icon="TrendingUp"
                accent="gold"
              />
              <ActionCard
                title="长期行动"
                period="6 个月以上"
                items={actionPlan.long}
                icon="Target"
                accent="magenta"
              />
            </div>
          </section>

          {/* 结语 */}
          <section className="glass-card mb-8 animate-fade-up p-6 text-center sm:p-8" style={{ animationDelay: "250ms" }}>
            <ICONS.Sparkles className="mx-auto h-8 w-8 text-neon-cyan" />
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-200">
              未来不是被预测的，而是被创造的。
              <br />
              这份报告只是一个起点，真正的职业旅程从你的下一步行动开始。
              <br />
              <span className="gradient-text font-display text-base">愿你在未来的职业中，找到热爱与价值的交汇点。</span>
            </p>
          </section>

          {/* 操作按钮 */}
          <div className="no-print flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
            <Link to="/results">
              <NeonButton variant="ghost">
                <ICONS.ArrowLeft className="h-4 w-4" />
                返回推荐列表
              </NeonButton>
            </Link>
            <div className="flex gap-3">
              <NeonButton variant="ghost" onClick={handleShare}>
                <ICONS.Share2 className="h-4 w-4" />
                分享
              </NeonButton>
              <NeonButton variant="secondary" onClick={handlePrint}>
                <ICONS.Download className="h-4 w-4" />
                下载为 PDF
              </NeonButton>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ActionCard({
  title,
  period,
  items,
  icon,
  accent,
}: {
  title: string;
  period: string;
  items: string[];
  icon: string;
  accent: keyof typeof accentMap;
}) {
  const Icon = ICONS[icon] || ICONS.Circle;
  const a = accentMap[accent];
  return (
    <div className={cn("rounded-xl border p-5", a.border, a.bg)}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={cn("h-4 w-4", a.text)} />
        <h3 className="font-display text-base font-bold text-ink-100">{title}</h3>
      </div>
      <p className={cn("mb-3 font-mono text-[10px]", a.text)}>{period}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-ink-200">
            <span className={cn("mt-1.5 h-1 w-1 shrink-0 rounded-full", a.text)} style={{ backgroundColor: a.stroke }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
