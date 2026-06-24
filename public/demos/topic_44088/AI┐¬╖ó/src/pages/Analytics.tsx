import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  PieChart,
  Calendar,
  ArrowRight,
  Sparkles,
  BookOpen,
  Layers,
  Flame,
} from "lucide-react";
import { useQuestionStore } from "@/store/useQuestionStore";
import { SUBJECT_COLORS, DIFFICULTY_LABELS, type Subject } from "@/types/question";
import { cn } from "@/lib/utils";

export default function Analytics() {
  const questions = useQuestionStore((s) => s.questions);

  const stats = useMemo(() => {
    const total = questions.length;
    const subjectCount = new Set(questions.map((q) => q.subject)).size;
    const kpSet = new Set<string>();
    questions.forEach((q) => q.knowledgePoints.forEach((kp) => kpSet.add(kp)));
    const avgDifficulty =
      total > 0
        ? (questions.reduce((sum, q) => sum + q.difficulty, 0) / total).toFixed(1)
        : "0";

    // 学科分布
    const subjectDist: Record<string, number> = {};
    questions.forEach((q) => {
      subjectDist[q.subject] = (subjectDist[q.subject] || 0) + 1;
    });
    const subjectData = Object.entries(subjectDist)
      .map(([name, count]) => ({ name: name as Subject, count, pct: total ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.count - a.count);

    // 知识点频次(薄弱点)— 记录每个知识点在各学科的出现次数
    const kpFreq: Record<string, { count: number; subjects: Record<string, number> }> = {};
    questions.forEach((q) => {
      q.knowledgePoints.forEach((kp) => {
        if (!kpFreq[kp]) kpFreq[kp] = { count: 0, subjects: {} };
        kpFreq[kp].count += 1;
        kpFreq[kp].subjects[q.subject] = (kpFreq[kp].subjects[q.subject] || 0) + 1;
      });
    });
    const weakPoints = Object.entries(kpFreq)
      .map(([name, { count, subjects }]) => {
        // 取出现次数最多的学科作为该知识点的归属学科
        const subject = Object.entries(subjects).sort((a, b) => b[1] - a[1])[0][0] as Subject;
        return { name, count, subject };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 难度分布
    const diffDist = [1, 2, 3, 4, 5].map((d) => ({
      level: d,
      count: questions.filter((q) => q.difficulty === d).length,
    }));

    // 近 7 天整理趋势 — 统一使用 UTC 日期避免时区偏移
    const days: { label: string; count: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const key = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
      const count = questions.filter((q) => {
        const qd = new Date(q.createdAt);
        return (
          qd.getUTCFullYear() === d.getUTCFullYear() &&
          qd.getUTCMonth() === d.getUTCMonth() &&
          qd.getUTCDate() === d.getUTCDate()
        );
      }).length;
      days.push({ label: key, count });
    }

    return {
      total,
      subjectCount,
      kpCount: kpSet.size,
      avgDifficulty,
      subjectData,
      weakPoints,
      diffDist,
      days,
      maxWeak: weakPoints[0]?.count || 1,
      maxDiff: Math.max(...diffDist.map((d) => d.count), 1),
      maxDay: Math.max(...days.map((d) => d.count), 1),
    };
  }, [questions]);

  // 智能复习建议
  const recommendations = useMemo(() => {
    const recs: { title: string; desc: string; priority: "high" | "medium" | "low"; icon: typeof Target }[] = [];

    if (stats.weakPoints.length > 0) {
      const top = stats.weakPoints[0];
      recs.push({
        title: `重点突破「${top.name}」`,
        desc: `该知识点出现 ${top.count} 次错题,是当前最薄弱环节,建议优先复习。`,
        priority: "high",
        icon: Target,
      });
    }

    const hardCount = stats.diffDist
      .filter((d) => d.level >= 4)
      .reduce((s, d) => s + d.count, 0);
    if (hardCount > 0) {
      recs.push({
        title: `攻克 ${hardCount} 道难题`,
        desc: `难度"较难/困难"的错题需要深度理解,建议结合课本例题反复推敲。`,
        priority: "medium",
        icon: AlertTriangle,
      });
    }

    const recentDays = stats.days.slice(-3).reduce((s, d) => s + d.count, 0);
    if (recentDays === 0) {
      recs.push({
        title: "近期未整理错题",
        desc: "近 3 天没有新增错题,建议养成每日整理的习惯,避免错题堆积。",
        priority: "low",
        icon: Calendar,
      });
    } else {
      recs.push({
        title: "保持整理节奏",
        desc: `近 3 天整理了 ${recentDays} 道错题,继续保持,定期复盘效果更佳。`,
        priority: "low",
        icon: Flame,
      });
    }

    if (stats.subjectData.length >= 2) {
      const weakest = stats.subjectData[stats.subjectData.length - 1];
      recs.push({
        title: `${weakest.name}学科需加强`,
        desc: `${weakest.name}错题占比 ${weakest.pct.toFixed(0)}%,建议分配更多复习时间。`,
        priority: "medium",
        icon: BookOpen,
      });
    }

    return recs;
  }, [stats]);

  if (questions.length === 0) {
    return (
      <div className="bg-paper-grain min-h-[calc(100vh-4rem)]">
        <div className="container py-10">
          <div className="card-paper mx-auto flex max-w-md flex-col items-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-paper-200/60">
              <BarChart3 className="h-7 w-7 text-ink-400" />
            </div>
            <h2 className="mb-2 font-display text-xl font-semibold text-ink-800">
              暂无数据可分析
            </h2>
            <p className="mb-6 text-sm text-ink-500">
              先去整理几道错题,这里会自动生成你的学情分析报告。
            </p>
            <Link to="/organize" className="btn-ink">
              <Sparkles className="h-4 w-4" />
              去整理错题
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper-grain min-h-[calc(100vh-4rem)]">
      <div className="container py-10">
        {/* 页头 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-400">
            <Link to="/" className="hover:text-ink-700">
              首页
            </Link>
            <span>/</span>
            <span className="text-ink-700">学情分析</span>
          </div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-4xl font-semibold text-ink-800">学情分析</h1>
              <p className="mt-2 text-ink-500">
                基于你的错题数据,智能识别薄弱环节,给出复习建议。
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-paper-300 bg-paper-50 px-3 py-1.5 text-xs text-ink-500">
              <Sparkles className="h-3.5 w-3.5 text-highlight-deep" />
              数据更新于 {new Date().toLocaleDateString("zh-CN")}
            </div>
          </div>
        </div>

        {/* 概览卡片 */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Layers}
            label="错题总数"
            value={stats.total}
            unit="道"
            trend={stats.days.slice(-3).reduce((s, d) => s + d.count, 0) > 0 ? "up" : "flat"}
            trendText={`近3天 +${stats.days.slice(-3).reduce((s, d) => s + d.count, 0)}`}
            color="ink"
          />
          <StatCard
            icon={BookOpen}
            label="覆盖学科"
            value={stats.subjectCount}
            unit="科"
            color="coral"
          />
          <StatCard
            icon={Target}
            label="涉及知识点"
            value={stats.kpCount}
            unit="个"
            color="mint"
          />
          <StatCard
            icon={BarChart3}
            label="平均难度"
            value={stats.avgDifficulty}
            unit="/5"
            color="highlight"
          />
        </div>

        {/* 图表区 */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {/* 学科分布 - 环形图 */}
          <div className="card-paper p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-800">
                <PieChart className="h-5 w-5 text-ink-500" />
                学科分布
              </h3>
              <span className="text-xs text-ink-400">共 {stats.total} 道错题</span>
            </div>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <DonutChart data={stats.subjectData} />
              <div className="flex-1 space-y-2">
                {stats.subjectData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("h-3 w-3 rounded-sm", SUBJECT_COLORS[s.name].dot)}
                      />
                      <span className="font-medium text-ink-700">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-ink-800">{s.count}</span>
                      <span className="text-ink-400">{s.pct.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 难度分布 - 柱状图 */}
          <div className="card-paper p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-800">
                <BarChart3 className="h-5 w-5 text-ink-500" />
                难度分布
              </h3>
              <span className="text-xs text-ink-400">按难度等级统计</span>
            </div>
            <div className="flex h-48 items-end justify-around gap-3 px-2">
              {stats.diffDist.map((d) => {
                const h = (d.count / stats.maxDiff) * 100;
                return (
                  <div key={d.level} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-ink-700">{d.count}</span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className={cn(
                          "w-full rounded-t-lg transition-all duration-700",
                          d.level <= 2 && "bg-mint/70",
                          d.level === 3 && "bg-highlight/80",
                          d.level >= 4 && "bg-coral/70"
                        )}
                        style={{ height: `${Math.max(h, 4)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-ink-500">
                      {DIFFICULTY_LABELS[d.level]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 薄弱知识点 + 复习建议 */}
        <div className="mb-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* 薄弱知识点 */}
          <div className="card-paper p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-800">
                <AlertTriangle className="h-5 w-5 text-coral-deep" />
                薄弱知识点
              </h3>
              <span className="text-xs text-ink-400">按错题频次排序</span>
            </div>
            <div className="space-y-3">
              {stats.weakPoints.map((kp, i) => {
                const pct = (kp.count / stats.maxWeak) * 100;
                return (
                  <div key={kp.name} className="group">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold",
                            i === 0
                              ? "bg-coral-deep text-paper-100"
                              : i === 1
                                ? "bg-coral-soft/60 text-coral-deep"
                                : "bg-paper-200 text-ink-500"
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="font-medium text-ink-700">{kp.name}</span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            SUBJECT_COLORS[kp.subject].soft
                          )}
                        >
                          {kp.subject}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-ink-600">
                        {kp.count} 次
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-paper-200">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          i === 0 ? "bg-coral-deep" : i === 1 ? "bg-coral" : "bg-highlight-deep"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 复习建议 */}
          <div className="card-paper p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-800">
                <Lightbulb className="h-5 w-5 text-highlight-deep" />
                智能复习建议
              </h3>
              <span className="flex items-center gap-1 rounded-full bg-highlight-soft/40 px-2 py-0.5 text-[10px] font-medium text-highlight-deep">
                <Sparkles className="h-3 w-3" />
                AI 生成
              </span>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec, i) => {
                const Icon = rec.icon;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 transition-all",
                      rec.priority === "high" && "border-coral/30 bg-coral-soft/10",
                      rec.priority === "medium" && "border-highlight-deep/30 bg-highlight-soft/10",
                      rec.priority === "low" && "border-mint-deep/20 bg-mint-soft/10"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                        rec.priority === "high" && "bg-coral-soft/40 text-coral-deep",
                        rec.priority === "medium" && "bg-highlight-soft/50 text-highlight-deep",
                        rec.priority === "low" && "bg-mint-soft/40 text-mint-deep"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-ink-800">{rec.title}</div>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{rec.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 近期整理趋势 */}
        <div className="card-paper p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-800">
              <TrendingUp className="h-5 w-5 text-mint-deep" />
              近 7 天整理趋势
            </h3>
            <Link
              to="/organize"
              className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800"
            >
              继续整理
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex h-40 items-end justify-between gap-2 sm:gap-4">
            {stats.days.map((day, i) => {
              const h = (day.count / stats.maxDay) * 100;
              const isToday = i === stats.days.length - 1;
              return (
                <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-ink-700">{day.count || ""}</span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={cn(
                        "w-full rounded-t-md transition-all duration-500",
                        isToday ? "bg-ink-700" : "bg-ink-300",
                        day.count === 0 && "bg-paper-200"
                      )}
                      style={{ height: `${Math.max(h, day.count > 0 ? 8 : 3)}%` }}
                    />
                  </div>
                  <span className={cn("text-[11px]", isToday ? "font-semibold text-ink-700" : "text-ink-400")}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部行动 */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/collection" className="btn-ghost">
            <BookOpen className="h-4 w-4" />
            查看错题集
          </Link>
          <Link to="/organize" className="btn-ink group">
            <Sparkles className="h-4 w-4" />
            整理新错题
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============ 概览卡片 ============ */
function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  trendText,
  color,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  unit: string;
  trend?: "up" | "down" | "flat";
  trendText?: string;
  color: "ink" | "coral" | "mint" | "highlight";
}) {
  const colorMap = {
    ink: "bg-ink-100 text-ink-700",
    coral: "bg-coral-soft/40 text-coral-deep",
    mint: "bg-mint-soft/40 text-mint-deep",
    highlight: "bg-highlight-soft/50 text-highlight-deep",
  };

  return (
    <div className="card-paper p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colorMap[color])}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        {trend === "up" && trendText && (
          <span className="flex items-center gap-0.5 rounded-full bg-mint-soft/30 px-2 py-0.5 text-[10px] font-medium text-mint-deep">
            <TrendingUp className="h-3 w-3" />
            {trendText}
          </span>
        )}
        {trend === "down" && trendText && (
          <span className="flex items-center gap-0.5 rounded-full bg-coral-soft/30 px-2 py-0.5 text-[10px] font-medium text-coral-deep">
            <TrendingDown className="h-3 w-3" />
            {trendText}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-3xl font-semibold text-ink-800">{value}</span>
        <span className="text-sm font-medium text-ink-400">{unit}</span>
      </div>
      <div className="mt-1 text-xs text-ink-500">{label}</div>
    </div>
  );
}

/* ============ 环形图 ============ */
function DonutChart({ data }: { data: { name: Subject; count: number; pct: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const colorHex: Record<Subject, string> = {
    数学: "#1B2A4E",
    语文: "#D94F4F",
    英语: "#3FAE6F",
    物理: "#E6C700",
    化学: "#9333EA",
    生物: "#059669",
    历史: "#B45309",
    地理: "#0369A1",
  };

  return (
    <div className="relative h-40 w-40 flex-shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#E0D5B8" strokeWidth="16" />
        {data.map((d) => {
          const len = (d.count / total) * circumference;
          const seg = (
            <circle
              key={d.name}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={colorHex[d.name]}
              strokeWidth="16"
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return seg;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold text-ink-800">{total}</span>
        <span className="text-[10px] text-ink-400">总错题</span>
      </div>
    </div>
  );
}
