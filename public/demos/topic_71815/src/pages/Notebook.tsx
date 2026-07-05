import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Check, Trash2, BookOpen, TrendingUp, Clock, Award } from 'lucide-react';
import Layout from '@/components/Layout';
import InkButton from '@/components/InkButton';
import WrongCharCard from '@/components/WrongCharCard';
import { useAppStore } from '@/store/useAppStore';
import { TASK_TYPE_META, type TaskType } from '@/types';
import { formatNextReview, isDueForReview, REVIEW_INTERVALS_DAYS } from '@/lib/ebbinghaus';
import { cn } from '@/lib/utils';

type Tab = 'today' | 'all' | 'mastered' | 'stats';

export default function Notebook() {
  const wrongChars = useAppStore((s) => s.wrongChars);
  const tasks = useAppStore((s) => s.tasks);
  const dictations = useAppStore((s) => s.dictations);
  const markMastered = useAppStore((s) => s.markWrongCharMastered);
  const removeWrong = useAppStore((s) => s.removeWrongChar);
  const [tab, setTab] = useState<Tab>('today');

  const dueList = wrongChars.filter((w) => !w.mastered && isDueForReview(w.nextReview));
  const allList = wrongChars.filter((w) => !w.mastered).sort((a, b) => b.count - a.count);
  const masteredList = wrongChars.filter((w) => w.mastered);

  const list = tab === 'today' ? dueList : tab === 'all' ? allList : tab === 'mastered' ? masteredList : [];

  // 统计：按类型掌握度
  const stats = useMemo(() => {
    const byType: Record<TaskType, { total: number; mastered: number; avgAcc: number }> = {
      english: { total: 0, mastered: 0, avgAcc: 0 },
      poem: { total: 0, mastered: 0, avgAcc: 0 },
      'classical-word': { total: 0, mastered: 0, avgAcc: 0 },
    };
    tasks.forEach((t) => {
      byType[t.type].total++;
      if (t.mastered) byType[t.type].mastered++;
    });
    // 平均正确率（按类型聚合最近 10 次默写）
    const recent = dictations.slice(0, 30);
    const accSum: Record<TaskType, number> = { english: 0, poem: 0, 'classical-word': 0 };
    const accCnt: Record<TaskType, number> = { english: 0, poem: 0, 'classical-word': 0 };
    recent.forEach((d) => {
      const t = tasks.find((x) => x.id === d.taskId);
      if (t) {
        accSum[t.type] += d.accuracy;
        accCnt[t.type]++;
      }
    });
    (Object.keys(byType) as TaskType[]).forEach((k) => {
      byType[k].avgAcc = accCnt[k] > 0 ? accSum[k] / accCnt[k] : 0;
    });
    return byType;
  }, [tasks, dictations]);

  return (
    <Layout title="错题本" subtitle="NOTEBOOK">
      {/* 概览条 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="待复习" value={dueList.length} icon={Clock} color="cinnabar" />
        <StatCard label="未掌握" value={allList.length} icon={BookOpen} color="ochre" />
        <StatCard label="已掌握" value={masteredList.length} icon={Award} color="celadon" />
        <StatCard label="默写次数" value={dictations.length} icon={TrendingUp} color="ink" />
      </section>

      {/* Tab */}
      <div className="flex gap-1 mb-6 border-b border-ink/8">
        {([
          { id: 'today', label: `今日待复习 (${dueList.length})`, icon: Clock },
          { id: 'all', label: `全部错字 (${allList.length})`, icon: BookOpen },
          { id: 'mastered', label: `已掌握 (${masteredList.length})`, icon: Award },
          { id: 'stats', label: '掌握度报告', icon: TrendingUp },
        ] as { id: Tab; label: string; icon: typeof Clock }[]).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm transition-all border-b-2 -mb-px cursor-pointer',
                tab === t.id ? 'border-cinnabar text-ink font-medium' : 'border-transparent text-ink-mute hover:text-ink'
              )}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'stats' ? (
        <StatsView stats={stats} />
      ) : list.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={32} className="mx-auto text-ink-mute/40 mb-3" strokeWidth={1.2} />
          <p className="text-sm text-ink-mute mb-4">
            {tab === 'today' ? '今日没有待复习的错字，继续保持' : tab === 'mastered' ? '尚无已掌握的错字' : '错题本为空，去默写一篇试试'}
          </p>
          <Link to="/tasks">
            <InkButton variant="outline" size="sm">去默写</InkButton>
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {list.map((w) => (
            <div key={w.id} className="relative">
              <WrongCharCard
                char={w.char}
                correct={w.correct}
                count={w.count}
                taskTitle={w.taskTitle}
                mastered={w.mastered}
                onMarkMastered={() => markMastered(w.id)}
                animate={tab === 'today'}
              />
              {tab !== 'today' && (
                <div className="mt-7 text-[10px] text-ink-mute flex items-center gap-1 justify-center">
                  <Calendar size={10} />
                  {w.mastered ? '已掌握' : formatNextReview(w.nextReview)}
                </div>
              )}
              {tab === 'today' && (
                <div className="mt-7 flex gap-1 justify-center">
                  <button
                    onClick={() => markMastered(w.id)}
                    className="w-7 h-7 rounded-sm bg-celadon text-paper flex items-center justify-center hover:bg-celadon/80 cursor-pointer"
                    title="标记已掌握"
                  >
                    <Check size={12} strokeWidth={3} />
                  </button>
                  <button
                    onClick={() => removeWrong(w.id)}
                    className="w-7 h-7 rounded-sm bg-ink/5 text-ink-mute flex items-center justify-center hover:bg-cinnabar hover:text-paper cursor-pointer"
                    title="删除"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 艾宾浩斯曲线说明 */}
      {tab !== 'stats' && (
        <section className="mt-12 bg-paper border border-ink/8 rounded-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-cinnabar" />
            <h3 className="font-display text-base text-ink">艾宾浩斯复习节奏</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {REVIEW_INTERVALS_DAYS.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs bg-cinnabar/8 text-cinnabar rounded-sm border border-cinnabar/20 tabular">
                  第 {i + 1} 次 · {d}天
                </span>
                {i < REVIEW_INTERVALS_DAYS.length - 1 && <span className="text-ink-mute">→</span>}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink-mute mt-3">
            错字每次默写再错重置到第 1 阶段，连续两次正确推进到下一阶段，达到末阶段且正确则标记已掌握
          </p>
        </section>
      )}
    </Layout>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Clock; color: string }) {
  const colorMap: Record<string, string> = {
    cinnabar: 'text-cinnabar border-cinnabar/30 bg-cinnabar/5',
    ochre: 'text-ochre border-ochre/30 bg-ochre/5',
    celadon: 'text-celadon border-celadon/30 bg-celadon/5',
    ink: 'text-ink border-ink/20 bg-ink/5',
  };
  return (
    <div className={cn('border rounded-sm p-4', colorMap[color])}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-ink-mute">{label}</span>
        <Icon size={14} />
      </div>
      <div className="font-display text-3xl tabular">{value}</div>
    </div>
  );
}

function StatsView({ stats }: { stats: Record<TaskType, { total: number; mastered: number; avgAcc: number }> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {(Object.keys(stats) as TaskType[]).map((t) => {
        const s = stats[t];
        const meta = TASK_TYPE_META[t];
        const masteryRate = s.total > 0 ? Math.round((s.mastered / s.total) * 100) : 0;
        const avgAcc = Math.round(s.avgAcc * 100);
        return (
          <div key={t} className="bg-paper border border-ink/8 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="inline-flex items-center justify-center font-display text-paper rounded-sm"
                style={{ width: 24, height: 24, background: meta.color, fontSize: 13 }}
              >
                {meta.seal}
              </span>
              <h3 className="font-display text-lg text-ink">{meta.label}</h3>
            </div>

            {/* 掌握度条 */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-ink-mute mb-1">
                <span>任务掌握度</span>
                <span className="tabular">{s.mastered} / {s.total}</span>
              </div>
              <div className="h-2 bg-ink/8 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-700"
                  style={{ width: `${masteryRate}%`, background: meta.color }}
                />
              </div>
              <div className="font-display text-2xl tabular mt-1" style={{ color: meta.color }}>{masteryRate}%</div>
            </div>

            {/* 平均正确率 */}
            <div>
              <div className="flex justify-between text-xs text-ink-mute mb-1">
                <span>近期默写正确率</span>
              </div>
              <div className="h-2 bg-ink/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-celadon transition-all duration-700"
                  style={{ width: `${avgAcc}%` }}
                />
              </div>
              <div className="font-display text-2xl text-celadon tabular mt-1">{avgAcc || '—'}{avgAcc ? '%' : ''}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
