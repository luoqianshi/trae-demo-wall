import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Flame,
  Clock,
  TrendingUp,
  Play,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Brain,
  Target,
} from "lucide-react";
import { useQuestionStore } from "@/store/useQuestionStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { MasteryBar } from "@/components/ui/MasteryBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { getSubject } from "@/data/subjects";
import { QUESTION_TYPE_META, type Question } from "@/types";
import { cn } from "@/lib/utils";

// 复习优先级算法
function rankByPriority(q: Question): number {
  // 越大越优先复习
  // 1. 掌握度越低越优先
  let score = 100 - q.mastery;
  // 2. 长时间未复习加分
  const daysSinceReview = q.lastReviewAt
    ? (Date.now() - +new Date(q.lastReviewAt)) / (24 * 3600 * 1000)
    : 999;
  score += Math.min(daysSinceReview * 2, 30);
  // 3. 错误率高的加分
  if (q.reviewCount > 0) {
    const errRate = 1 - q.correctCount / q.reviewCount;
    score += errRate * 20;
  }
  // 4. 难度高的略微加分
  score += q.difficulty * 2;
  return score;
}

export default function Review() {
  const navigate = useNavigate();
  const questions = useQuestionStore((s) => s.questions);
  const reviewRecords = useQuestionStore((s) => s.reviewRecords);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genCount, setGenCount] = useState(10);
  const [genSubject, setGenSubject] = useState<string>("all");

  // 智能推荐清单：按优先级排序，取前 12 道
  const recommended = useMemo(() => {
    return [...questions]
      .map((q) => ({ q, score: rankByPriority(q) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(({ q }) => q);
  }, [questions]);

  // 今日已复习数
  const todayReviewed = useMemo(() => {
    const today = new Date();
    return reviewRecords.filter((r) => {
      const d = new Date(r.reviewedAt);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    }).length;
  }, [reviewRecords]);

  // 今日正确率
  const todayAccuracy = useMemo(() => {
    const today = new Date();
    const todayRecords = reviewRecords.filter((r) => {
      const d = new Date(r.reviewedAt);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    });
    if (todayRecords.length === 0) return null;
    const correct = todayRecords.filter((r) => r.correct).length;
    return Math.round((correct / todayRecords.length) * 100);
  }, [reviewRecords]);

  // 待复习总数
  const pendingCount = questions.filter((q) => q.mastery < 80).length;

  // 最近 7 日复习日历
  const weekCalendar = useMemo(() => {
    const days: { date: Date; count: number; correct: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const records = reviewRecords.filter((r) => {
        const rd = new Date(r.reviewedAt);
        return rd >= d && rd < next;
      });
      days.push({
        date: d,
        count: records.length,
        correct: records.filter((r) => r.correct).length,
      });
    }
    return days;
  }, [reviewRecords]);

  const startReview = (qs: Question[]) => {
    if (qs.length === 0) return;
    // 通过路由 state 传递题目 id
    navigate("/review/session", { state: { ids: qs.map((q) => q.id) } });
  };

  const generatePaper = () => {
    let pool = questions;
    if (genSubject !== "all") {
      pool = questions.filter((q) => q.subject === genSubject);
    }
    const count = Math.min(genCount, pool.length);
    if (count === 0) {
      setGenerateOpen(false);
      return;
    }
    // 简单随机
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
    setGenerateOpen(false);
    startReview(shuffled);
  };

  return (
    <div className="space-y-5">
      {/* 顶部数据卡 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={<Clock size={16} />}
          tone="amber"
          label="今日已复习"
          value={todayReviewed}
          suffix=" 道"
        />
        <SummaryCard
          icon={<Target size={16} />}
          tone="mint"
          label="今日正确率"
          value={todayAccuracy === null ? "—" : todayAccuracy}
          suffix={todayAccuracy === null ? "" : "%"}
        />
        <SummaryCard
          icon={<Flame size={16} />}
          tone="brand"
          label="待复习"
          value={pendingCount}
          suffix=" 道"
        />
        <SummaryCard
          icon={<TrendingUp size={16} />}
          tone="rose"
          label="累计复习"
          value={reviewRecords.length}
          suffix=" 次"
        />
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* 智能复习清单 */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-500 to-mint-400 grid place-items-center text-white shadow-glow-brand">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="title-display text-lg font-bold text-ink-900">今日智能复习清单</h3>
                <p className="text-xs text-ink-400 mt-0.5">
                  基于艾宾浩斯遗忘曲线 + 错误率 + 掌握度排序
                </p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={() => startReview(recommended)} disabled={recommended.length === 0}>
              <Play size={14} /> 开始复习
            </Button>
          </div>

          {recommended.length === 0 ? (
            <EmptyState
              icon={<Sparkles size={28} />}
              title="暂无可复习的题目"
              description="去上传一些作业，让 AI 帮你建立错题库"
            />
          ) : (
            <div className="space-y-2.5">
              {recommended.map((q, idx) => {
                const meta = getSubject(q.subject);
                const typeMeta = QUESTION_TYPE_META[q.questionType];
                const priority = idx < 3 ? "high" : idx < 7 ? "medium" : "low";
                const priorityMeta = {
                  high: { tone: "rose" as const, label: "紧急" },
                  medium: { tone: "amber" as const, label: "建议" },
                  low: { tone: "mint" as const, label: "巩固" },
                };
                const daysSinceReview = q.lastReviewAt
                  ? Math.floor((Date.now() - +new Date(q.lastReviewAt)) / (24 * 3600 * 1000))
                  : null;
                return (
                  <div
                    key={q.id}
                    className="relative glass-strong rounded-2xl p-4 pl-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-glow group"
                    onClick={() => startReview([q])}
                  >
                    <span className="subj-bar" style={{ background: meta.color }} />
                    <div className="flex items-start gap-3">
                      <span className="num-display w-7 h-7 rounded-lg bg-ink-100 text-ink-600 grid place-items-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          <SubjectBadge subject={q.subject} size="sm" showName={false} />
                          <Tag tone="brand" size="xs">{q.knowledgePoint}</Tag>
                          <Tag tone="ink" size="xs">{typeMeta.short}</Tag>
                          <Tag tone={priorityMeta[priority].tone} size="xs">
                            {priorityMeta[priority].label}
                          </Tag>
                        </div>
                        <p className="text-sm text-ink-800 line-clamp-1">{q.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex-1 max-w-[120px]">
                            <MasteryBar value={q.mastery} size="sm" showLabel={false} />
                          </div>
                          <span className="text-[11px] text-ink-400 shrink-0">
                            {daysSinceReview === null
                              ? "未复习"
                              : daysSinceReview === 0
                              ? "今日复习过"
                              : `${daysSinceReview}天前复习`}
                          </span>
                        </div>
                      </div>
                      <Play
                        size={16}
                        className="text-ink-300 group-hover:text-brand-500 shrink-0 transition-colors"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* 右侧：复习卷生成 + 日历 */}
        <div className="space-y-5">
          <Card className="p-5 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br from-amber-300/20 to-brand-400/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 grid place-items-center text-white">
                  <FileText size={18} />
                </div>
                <h3 className="title-display text-base font-bold text-ink-900">自定义复习卷</h3>
              </div>
              <p className="text-xs text-ink-500 mb-4 leading-relaxed">
                按学科与题量生成专属复习卷，进入沉浸式做题模式
              </p>
              <Button variant="primary" className="w-full" onClick={() => setGenerateOpen(true)}>
                <Brain size={14} /> 生成复习卷
              </Button>
            </div>
          </Card>

          {/* 复习日历 */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-brand-500" />
                <h3 className="title-display text-base font-bold text-ink-900">最近 7 天</h3>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {weekCalendar.map((d, i) => {
                const isToday = i === 6;
                const intensity = d.count === 0 ? 0 : Math.min(d.count / 5, 1);
                return (
                  <div key={i} className="text-center">
                    <div className="text-[10px] text-ink-400 mb-1">
                      {["日", "一", "二", "三", "四", "五", "六"][d.date.getDay()]}
                    </div>
                    <div
                      className={cn(
                        "aspect-square rounded-xl grid place-items-center text-xs font-bold transition-all",
                        isToday && "ring-2 ring-brand-400",
                        intensity === 0
                          ? "bg-ink-100/60 text-ink-300"
                          : intensity < 0.4
                          ? "bg-brand-100 text-brand-700"
                          : intensity < 0.8
                          ? "bg-brand-300 text-white"
                          : "bg-brand-500 text-white",
                      )}
                    >
                      {d.count > 0 ? d.count : "·"}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-ink-100/60 flex items-center justify-between text-[11px] text-ink-500">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={12} className="text-mint-500" />
                本周共复习 {weekCalendar.reduce((s, d) => s + d.count, 0)} 次
              </span>
              <span className="inline-flex items-center gap-1">
                <XCircle size={12} className="text-rose-400" />
                答错 {weekCalendar.reduce((s, d) => s + (d.count - d.correct), 0)} 题
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* 生成复习卷弹窗 */}
      <Modal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title="生成自定义复习卷"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setGenerateOpen(false)}>取消</Button>
            <Button onClick={generatePaper}>
              <Play size={14} /> 开始做题
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="block text-xs font-bold text-ink-600 mb-2">学科范围</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setGenSubject("all")}
                className={cn(
                  "h-8 px-3 rounded-full text-xs font-medium border transition-all",
                  genSubject === "all"
                    ? "bg-brand-500 text-white border-brand-500"
                    : "bg-white/60 text-ink-600 border-ink-100",
                )}
              >
                全部学科
              </button>
              {Array.from(new Set(questions.map((q) => q.subject))).map((s) => {
                const meta = getSubject(s);
                return (
                  <button
                    key={s}
                    onClick={() => setGenSubject(s)}
                    className={cn(
                      "h-8 px-3 rounded-full text-xs font-medium border transition-all inline-flex items-center gap-1.5",
                      genSubject === s
                        ? "bg-brand-500 text-white border-brand-500"
                        : "bg-white/60 text-ink-600 border-ink-100",
                    )}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                    {meta.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink-600">题目数量</span>
              <span className="num-display text-sm font-bold text-brand-600">{genCount} 道</span>
            </div>
            <input
              type="range"
              min={1}
              max={Math.max(20, questions.length)}
              value={genCount}
              onChange={(e) => setGenCount(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-[10px] text-ink-400 mt-1">
              <span>1 道</span>
              <span>{Math.max(20, questions.length)} 道</span>
            </div>
          </div>
          <div className="text-xs text-ink-500 bg-ink-50/70 rounded-xl p-3">
            <Sparkles size={12} className="inline mr-1 text-brand-500" />
            将随机抽取题目进入全屏沉浸式做题模式，提交后自动判分并更新掌握度。
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SummaryCard({
  icon,
  tone,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  tone: "brand" | "mint" | "amber" | "rose";
  label: string;
  value: number | string;
  suffix?: string;
}) {
  const tones = {
    brand: "from-brand-400/15 to-brand-500/5 text-brand-600",
    mint: "from-mint-400/15 to-mint-500/5 text-mint-600",
    amber: "from-amber-300/15 to-amber-500/5 text-amber-600",
    rose: "from-rose-400/15 to-rose-500/5 text-rose-600",
  };
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br ${tones[tone]} blur-2xl opacity-70`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-ink-500 font-medium">{label}</span>
          <div className={`w-8 h-8 rounded-xl grid place-items-center bg-gradient-to-br ${tones[tone]}`}>
            {icon}
          </div>
        </div>
        <div className="num-display text-2xl font-bold text-ink-900">
          {value}{suffix}
        </div>
      </div>
    </Card>
  );
}
