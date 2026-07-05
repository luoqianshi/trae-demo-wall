import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  UploadCloud,
  ScanLine,
  FileText,
  Library as LibraryIcon,
  ArrowUpRight,
  Flame,
  TrendingUp,
  BookOpen,
  Clock,
  Sparkles,
} from "lucide-react";
import { useQuestionStore } from "@/store/useQuestionStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { MasteryBar } from "@/components/ui/MasteryBar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { getSubject, SUBJECTS } from "@/data/subjects";
import { QUESTION_TYPE_META } from "@/types";
import type { Question } from "@/types";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isThisWeek(d: Date) {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 周一为起点
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return d.getTime() >= monday.getTime();
}

function StatCard({
  label,
  value,
  suffix,
  icon,
  tone,
  hint,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  tone: "brand" | "mint" | "amber" | "rose";
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
      <div className={`absolute -right-6 -top-6 w-28 h-28 rounded-full bg-gradient-to-br ${tones[tone]} blur-2xl opacity-70`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
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

function QuickAction({
  to,
  icon,
  title,
  desc,
  tone,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  tone: "brand" | "mint" | "amber" | "rose";
}) {
  const tones = {
    brand: "from-brand-500 to-brand-600 shadow-glow-brand",
    mint: "from-mint-400 to-mint-500 shadow-glow-mint",
    amber: "from-amber-300 to-amber-500 shadow-[0_18px_32px_rgba(255,193,51,0.32)]",
    rose: "from-rose-400 to-rose-500 shadow-[0_18px_32px_rgba(244,63,94,0.30)]",
  };
  return (
    <Link
      to={to}
      className="group relative glass rounded-3xl p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow overflow-hidden"
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tones[tone]} grid place-items-center text-white shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-ink-900 text-sm">{title}</div>
        <div className="text-[12px] text-ink-500 mt-0.5 truncate">{desc}</div>
      </div>
      <ArrowUpRight
        size={18}
        className="text-ink-300 group-hover:text-brand-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
      />
    </Link>
  );
}

export default function Dashboard() {
  const questions = useQuestionStore((s) => s.questions);

  const stats = useMemo(() => {
    const today = new Date();
    const todayAdded = questions.filter((q) => isSameDay(new Date(q.createdAt), today)).length;
    const weekAdded = questions.filter((q) => isThisWeek(new Date(q.createdAt))).length;
    const pending = questions.filter((q) => q.mastery < 60).length;
    const mastered = questions.filter((q) => q.mastery >= 80).length;
    const avgMastery = questions.length
      ? Math.round(questions.reduce((sum, q) => sum + q.mastery, 0) / questions.length)
      : 0;
    return { todayAdded, weekAdded, pending, mastered, avgMastery, total: questions.length };
  }, [questions]);

  const recentQuestions = useMemo(
    () =>
      [...questions]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 6),
    [questions],
  );

  // 薄弱知识点 TOP5
  const weakPoints = useMemo(() => {
    const map = new Map<string, { sum: number; count: number; subject: string }>();
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
        subject: v.subject as Question["subject"],
        avg: Math.round(v.sum / v.count),
        count: v.count,
      }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 5);
  }, [questions]);

  // 学科分布（用于最近整理色块）
  const subjectCounts = useMemo(() => {
    const m = new Map<string, number>();
    questions.forEach((q) => m.set(q.subject, (m.get(q.subject) ?? 0) + 1));
    return SUBJECTS.map((s) => ({ ...s, count: m.get(s.code) ?? 0 })).filter((s) => s.count > 0);
  }, [questions]);

  return (
    <div className="space-y-5">
      {/* Hero 概览区 */}
      <Card className="relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-gradient-to-br from-brand-400/20 to-mint-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-gradient-to-tr from-amber-300/20 to-brand-400/10 blur-3xl pointer-events-none" />
        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-6">
          {/* 左侧：问候 + 数据 */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-3">
              <Sparkles size={12} />
              {new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}
            </div>
            <h2 className="title-display text-3xl lg:text-4xl font-bold text-ink-900 leading-tight">
              让整理不再打断学习，
              <br />
              让复习真正有迹可循。
            </h2>
            <p className="mt-3 text-sm text-ink-500 leading-relaxed max-w-md">
              你今天整理了 <b className="text-brand-600">{stats.todayAdded}</b> 道新错题，
              还有 <b className="text-amber-600">{stats.pending}</b> 道题等待巩固，
              坚持就是进步。
            </p>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="今日整理" value={stats.todayAdded} suffix=" 道" tone="brand"
                icon={<UploadCloud size={16} />} />
              <StatCard label="待复习" value={stats.pending} suffix=" 道" tone="amber"
                icon={<Clock size={16} />} hint="掌握度 < 60%" />
              <StatCard label="本周新增" value={stats.weekAdded} suffix=" 道" tone="mint"
                icon={<TrendingUp size={16} />} />
              <StatCard label="平均掌握" value={stats.avgMastery} suffix="%" tone="rose"
                icon={<Flame size={16} />} />
            </div>
          </div>

          {/* 右侧：快捷操作 */}
          <div className="grid grid-cols-1 gap-3">
            <QuickAction to="/upload" tone="brand" icon={<UploadCloud size={22} />}
              title="拍照上传" desc="上传作业或试卷，AI 自动识别" />
            <QuickAction to="/upload" tone="mint" icon={<ScanLine size={22} />}
              title="扫描试卷" desc="批量扫描整张试卷并拆分归档" />
            <QuickAction to="/review" tone="amber" icon={<FileText size={22} />}
              title="生成复习卷" desc="按知识点智能生成个性化复习卷" />
            <QuickAction to="/library" tone="rose" icon={<LibraryIcon size={22} />}
              title="查看错题库" desc={`${stats.total} 道错题，多维度检索`} />
          </div>
        </div>
      </Card>

      {/* 中部：最近整理 + 薄弱知识点 */}
      <div className="grid lg:grid-cols-[1.55fr_1fr] gap-5">
        {/* 最近整理 */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="title-display text-lg font-bold text-ink-900">最近整理</h3>
              <p className="text-xs text-ink-400 mt-0.5">最近 6 条归档记录</p>
            </div>
            <Link to="/library">
              <Button variant="ghost" size="sm">查看全部 <ArrowUpRight size={14} /></Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentQuestions.length === 0 && (
              <div className="text-center py-10 text-sm text-ink-400">
                还没有整理记录，去
                <Link to="/upload" className="text-brand-600 font-bold mx-1">上传整理</Link>
                开始吧
              </div>
            )}
            {recentQuestions.map((q) => {
              const meta = getSubject(q.subject);
              const typeMeta = QUESTION_TYPE_META[q.questionType];
              const created = new Date(q.createdAt);
              const today = new Date();
              const daysAgo = Math.floor((today.getTime() - created.getTime()) / (24 * 3600 * 1000));
              return (
                <Link
                  key={q.id}
                  to="/library"
                  className="relative block glass-strong rounded-2xl p-4 pl-6 transition-all hover:-translate-y-0.5 hover:shadow-glow"
                >
                  <span className="subj-bar" style={{ background: meta.color }} />
                  <div className="flex items-start gap-3">
                    <SubjectBadge subject={q.subject} size="sm" showName={false} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-800 line-clamp-1">{q.content}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <Tag tone="brand" size="xs">{q.knowledgePoint}</Tag>
                        <Tag tone="ink" size="xs">{typeMeta.short}</Tag>
                        <span className="text-[11px] text-ink-400 ml-auto">
                          {daysAgo === 0 ? "今天" : `${daysAgo}天前`}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        {/* 薄弱知识点 */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="title-display text-lg font-bold text-ink-900">薄弱知识点</h3>
              <p className="text-xs text-ink-400 mt-0.5">掌握度最低 TOP 5</p>
            </div>
            <Link to="/review">
              <Button variant="mint" size="sm">立即复习</Button>
            </Link>
          </div>

          <div className="space-y-4">
            {weakPoints.length === 0 && (
              <div className="text-center py-8 text-sm text-ink-400">
                <BookOpen size={28} className="mx-auto mb-2 text-ink-300" />
                暂无薄弱知识点
              </div>
            )}
            {weakPoints.map((wp, idx) => (
              <div key={wp.name} className="group">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="num-display text-xs font-bold text-ink-400 w-4">#{idx + 1}</span>
                  <SubjectBadge subject={wp.subject} size="sm" showName={false} />
                  <span className="text-sm font-medium text-ink-800 flex-1 truncate">{wp.name}</span>
                  <span className="num-display text-xs text-rose-500 font-bold">{wp.avg}%</span>
                </div>
                <MasteryBar value={wp.avg} size="sm" showLabel={false} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 学科分布条带 */}
      {subjectCounts.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="title-display text-lg font-bold text-ink-900">学科分布</h3>
            <Link to="/stats">
              <Button variant="ghost" size="sm">详细统计 <ArrowUpRight size={14} /></Button>
            </Link>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-ink-100/70">
            {subjectCounts.map((s) => (
              <div
                key={s.code}
                style={{
                  width: `${(s.count / stats.total) * 100}%`,
                  background: s.color,
                }}
                className="h-full transition-all hover:brightness-110"
                title={`${s.name}：${s.count} 道`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            {subjectCounts.map((s) => (
              <div key={s.code} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-ink-700">{s.name}</span>
                <span className="num-display text-ink-400">{s.count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
