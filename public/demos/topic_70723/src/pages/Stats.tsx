import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Award,
  Flame,
} from "lucide-react";
import { useQuestionStore } from "@/store/useQuestionStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { MasteryBar } from "@/components/ui/MasteryBar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { DonutChart } from "@/components/charts/DonutChart";
import { MasteryRadar } from "@/components/charts/MasteryRadar";
import { TrendLine } from "@/components/charts/TrendLine";
import { getSubject, SUBJECTS } from "@/data/subjects";
import { QUESTION_TYPE_META, type Subject } from "@/types";
import { cn } from "@/lib/utils";

export default function Stats() {
  const questions = useQuestionStore((s) => s.questions);
  const reviewRecords = useQuestionStore((s) => s.reviewRecords);

  // 总览
  const totals = useMemo(() => {
    const total = questions.length;
    const mastered = questions.filter((q) => q.mastery >= 80).length;
    const pending = questions.filter((q) => q.mastery < 80).length;
    const avgMastery = total
      ? Math.round(questions.reduce((s, q) => s + q.mastery, 0) / total)
      : 0;
    return { total, mastered, pending, avgMastery };
  }, [questions]);

  // 学科分布
  const subjectStats = useMemo(() => {
    const m = new Map<Subject, { count: number; sumMastery: number }>();
    questions.forEach((q) => {
      if (!m.has(q.subject)) m.set(q.subject, { count: 0, sumMastery: 0 });
      const e = m.get(q.subject)!;
      e.count += 1;
      e.sumMastery += q.mastery;
    });
    return SUBJECTS.map((s) => {
      const v = m.get(s.code);
      return {
        ...s,
        count: v?.count ?? 0,
        avgMastery: v ? Math.round(v.sumMastery / v.count) : 0,
      };
    })
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [questions]);

  // 题型分布
  const typeStats = useMemo(() => {
    const m = new Map<string, number>();
    questions.forEach((q) => {
      m.set(q.questionType, (m.get(q.questionType) ?? 0) + 1);
    });
    return Array.from(m.entries())
      .map(([code, count]) => ({ ...QUESTION_TYPE_META[code as keyof typeof QUESTION_TYPE_META], count }))
      .sort((a, b) => b.count - a.count);
  }, [questions]);

  // 难度分布
  const difficultyStats = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    questions.forEach((q) => {
      counts[q.difficulty - 1] += 1;
    });
    return counts;
  }, [questions]);

  // 薄弱知识点 TOP5
  const weakPoints = useMemo(() => {
    const map = new Map<string, { sum: number; count: number; subject: Subject }>();
    questions.forEach((q) => {
      const key = q.knowledgePoint;
      if (!map.has(key)) map.set(key, { sum: 0, count: 0, subject: q.subject });
      const e = map.get(key)!;
      e.sum += q.mastery;
      e.count += 1;
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name,
        subject: v.subject,
        avg: Math.round(v.sum / v.count),
        count: v.count,
      }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 8);
  }, [questions]);

  // 复习数据
  const reviewStats = useMemo(() => {
    const totalReviews = reviewRecords.length;
    const correctReviews = reviewRecords.filter((r) => r.correct).length;
    const accuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;
    return { totalReviews, correctReviews, accuracy };
  }, [reviewRecords]);

  // 近 7 日 vs 近 30 日
  const trend = useMemo(() => {
    const now = Date.now();
    const week = now - 7 * 24 * 3600 * 1000;
    const month = now - 30 * 24 * 3600 * 1000;
    const weekReviews = reviewRecords.filter((r) => +new Date(r.reviewedAt) >= week).length;
    const monthReviews = reviewRecords.filter((r) => +new Date(r.reviewedAt) >= month).length;
    const weekAdded = questions.filter((q) => +new Date(q.createdAt) >= week).length;
    const monthAdded = questions.filter((q) => +new Date(q.createdAt) >= month).length;
    return { weekReviews, monthReviews, weekAdded, monthAdded };
  }, [reviewRecords, questions]);

  if (questions.length === 0) {
    return (
      <Card>
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-brand-50 text-brand-500 grid place-items-center mb-4">
            <BookOpen size={28} />
          </div>
          <h2 className="title-display text-xl font-bold text-ink-900 mb-2">暂无统计数据</h2>
          <p className="text-sm text-ink-500 mb-5">上传作业并整理错题后，这里将显示完整的学习数据分析</p>
          <Link to="/upload">
            <Button variant="primary"><Sparkles size={14} /> 去上传</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* 总览 4 卡 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBigCard
          icon={<BookOpen size={16} />}
          tone="brand"
          label="累计错题"
          value={totals.total}
          suffix=" 道"
          hint={`本月新增 ${trend.monthAdded} 道`}
        />
        <StatBigCard
          icon={<CheckCircle2 size={16} />}
          tone="mint"
          label="已掌握"
          value={totals.mastered}
          suffix=" 道"
          hint={`占比 ${Math.round((totals.mastered / totals.total) * 100)}%`}
        />
        <StatBigCard
          icon={<Clock size={16} />}
          tone="amber"
          label="待复习"
          value={totals.pending}
          suffix=" 道"
          hint="掌握度 < 80%"
        />
        <StatBigCard
          icon={<Target size={16} />}
          tone="rose"
          label="平均掌握度"
          value={totals.avgMastery}
          suffix="%"
          hint={`复习正确率 ${reviewStats.accuracy}%`}
        />
      </div>

      {/* 趋势曲线 */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-500" />
            <div>
              <h3 className="title-display text-lg font-bold text-ink-900">学习趋势</h3>
              <p className="text-xs text-ink-400 mt-0.5">最近 30 天新增错题与复习量</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />新增错题
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-mint-400" />复习题数
            </span>
          </div>
        </div>
        <TrendLine questions={questions} reviewRecords={reviewRecords} days={30} />
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* 学科分布 */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-mint-500" />
              <h3 className="title-display text-lg font-bold text-ink-900">学科分布</h3>
            </div>
          </div>
          <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
            <DonutChart questions={questions} height={180} />
            <div className="space-y-1.5">
              {subjectStats.map((s) => (
                <div
                  key={s.code}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-ink-700 flex-1">{s.name}</span>
                  <span className="num-display text-ink-500">{s.count}</span>
                  <span className="num-display text-ink-300 w-10 text-right">
                    {Math.round((s.count / totals.total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 知识点掌握度雷达 */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-brand-500" />
              <h3 className="title-display text-lg font-bold text-ink-900">章节掌握度</h3>
            </div>
          </div>
          <MasteryRadar questions={questions} height={260} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
        {/* 学科详情表 */}
        <Card className="p-5">
          <h3 className="title-display text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
            <Award size={18} className="text-amber-500" />
            学科掌握度详情
          </h3>
          <div className="space-y-3">
            {subjectStats.map((s) => (
              <div key={s.code}>
                <div className="flex items-center gap-2 mb-1.5">
                  <SubjectBadge subject={s.code} size="sm" showName={false} />
                  <span className="text-sm font-medium text-ink-800 flex-1">{s.name}</span>
                  <span className="text-xs text-ink-500">{s.count} 道</span>
                  <span className="num-display text-xs font-bold text-brand-600 w-10 text-right">
                    {s.avgMastery}%
                  </span>
                </div>
                <MasteryBar value={s.avgMastery} size="sm" showLabel={false} />
              </div>
            ))}
          </div>
        </Card>

        {/* 题型与难度分布 */}
        <Card className="p-5">
          <h3 className="title-display text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-mint-500" />
            题型与难度分布
          </h3>
          {/* 题型 */}
          <div className="mb-5">
            <div className="text-xs font-bold text-ink-500 mb-2">题型分布</div>
            <div className="space-y-1.5">
              {typeStats.map((t) => (
                <div key={t.code} className="flex items-center gap-2">
                  <span className="text-xs text-ink-700 w-12 shrink-0">{t.short}</span>
                  <div className="flex-1 h-5 bg-ink-100/60 rounded-md overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-md transition-all"
                      style={{ width: `${(t.count / totals.total) * 100}%` }}
                    />
                  </div>
                  <span className="num-display text-xs text-ink-600 w-8 text-right">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
          {/* 难度 */}
          <div>
            <div className="text-xs font-bold text-ink-500 mb-2">难度分布</div>
            <div className="flex items-end gap-2 h-24">
              {difficultyStats.map((count, i) => {
                const max = Math.max(...difficultyStats, 1);
                const h = (count / max) * 100;
                const tone = [
                  "from-mint-300 to-mint-500",
                  "from-mint-300 to-mint-500",
                  "from-amber-300 to-amber-500",
                  "from-brand-300 to-brand-500",
                  "from-rose-300 to-rose-500",
                ][i];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <span className="num-display text-[11px] font-bold text-ink-700">{count}</span>
                    <div
                      className={cn(
                        "w-full rounded-t-md bg-gradient-to-t transition-all",
                        tone,
                      )}
                      style={{ height: `${h}%`, minHeight: count > 0 ? "4px" : "0" }}
                    />
                    <span className="text-[10px] text-ink-400">{i + 1}星</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* 薄弱知识点 + 复习统计 */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-500" />
              <h3 className="title-display text-lg font-bold text-ink-900">薄弱知识点</h3>
            </div>
            <Link to="/review">
              <Button variant="mint" size="sm">立即复习</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {weakPoints.map((wp, idx) => (
              <div
                key={wp.name}
                className="glass-strong rounded-2xl p-3.5 flex items-center gap-3"
              >
                <span className="num-display w-7 h-7 rounded-lg bg-rose-50 text-rose-500 grid place-items-center text-xs font-bold shrink-0">
                  #{idx + 1}
                </span>
                <SubjectBadge subject={wp.subject} size="sm" showName={false} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink-800 truncate">{wp.name}</span>
                    <span className="num-display text-xs text-rose-500 font-bold ml-2">{wp.avg}%</span>
                  </div>
                  <MasteryBar value={wp.avg} size="sm" showLabel={false} />
                </div>
                <span className="text-[11px] text-ink-400 shrink-0">{wp.count} 题</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={18} className="text-amber-500" />
            <h3 className="title-display text-lg font-bold text-ink-900">复习统计</h3>
          </div>
          <div className="space-y-4">
            <div className="glass-strong rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-ink-500">累计复习次数</span>
                <span className="num-display text-2xl font-bold text-brand-600">
                  <AnimatedNumber value={reviewStats.totalReviews} />
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-ink-400">
                <span>答对 <b className="text-mint-600 num-display">{reviewStats.correctReviews}</b> 次</span>
                <span>答错 <b className="text-rose-500 num-display">
                  {reviewStats.totalReviews - reviewStats.correctReviews}
                </b> 次</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-strong rounded-2xl p-4">
                <div className="text-xs text-ink-500 mb-1">近 7 日</div>
                <div className="num-display text-xl font-bold text-ink-900">{trend.weekReviews}</div>
                <div className="text-[11px] text-ink-400 mt-1">复习 {trend.weekAdded} 题新增</div>
              </div>
              <div className="glass-strong rounded-2xl p-4">
                <div className="text-xs text-ink-500 mb-1">近 30 日</div>
                <div className="num-display text-xl font-bold text-ink-900">{trend.monthReviews}</div>
                <div className="text-[11px] text-ink-400 mt-1">复习 {trend.monthAdded} 题新增</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-mint-50 to-brand-50 rounded-2xl p-4 border border-white/70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-ink-600">复习正确率</span>
                <span className="num-display text-lg font-bold text-mint-600">
                  {reviewStats.accuracy}%
                </span>
              </div>
              <MasteryBar value={reviewStats.accuracy} size="sm" showLabel={false} />
              <div className="mt-2 text-[11px] text-ink-500">
                {reviewStats.accuracy >= 80
                  ? "🎉 表现出色，继续保持！"
                  : reviewStats.accuracy >= 50
                  ? "💪 还有提升空间，多复习几次"
                  : "📚 需要加强基础，建议重新整理相关知识点"}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatBigCard({
  icon,
  tone,
  label,
  value,
  suffix,
  hint,
}: {
  icon: React.ReactNode;
  tone: "brand" | "mint" | "amber" | "rose";
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
}) {
  const tones = {
    brand: "from-brand-400/15 to-brand-500/5 text-brand-600",
    mint: "from-mint-400/15 to-mint-500/5 text-mint-600",
    amber: "from-amber-300/15 to-amber-500/5 text-amber-600",
    rose: "from-rose-400/15 to-rose-500/5 text-rose-600",
  };
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${tones[tone]} blur-2xl opacity-70`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-ink-500 font-medium">{label}</span>
          <div className={`w-9 h-9 rounded-2xl grid place-items-center bg-gradient-to-br ${tones[tone]}`}>
            {icon}
          </div>
        </div>
        <div className="num-display text-3xl font-bold text-ink-900">
          <AnimatedNumber value={value} suffix={suffix} />
        </div>
        {hint && <div className="mt-1 text-[11px] text-ink-400">{hint}</div>}
      </div>
    </Card>
  );
}
