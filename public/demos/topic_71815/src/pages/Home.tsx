import { Link } from 'react-router-dom';
import { ScanLine, Mic, PenLine, ArrowRight, Flame, BookOpen, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import InkButton from '@/components/InkButton';
import ProgressRing from '@/components/ProgressRing';
import SealStamp from '@/components/SealStamp';
import TaskBadge from '@/components/TaskBadge';
import WrongCharCard from '@/components/WrongCharCard';
import { useAppStore, selectMasteryByType } from '@/store/useAppStore';
import { TASK_TYPE_META, type TaskType } from '@/types';
import { SAMPLE_TASKS } from '@/lib/sampleData';
import { relativeTime } from '@/lib/utils';
import { isDueForReview } from '@/lib/ebbinghaus';

const QUICK_ENTRIES = [
  {
    to: '/scan',
    title: '去扫描',
    sub: 'SCAN & RECOGNIZE',
    desc: '拍照课本试卷，OCR 识别生成任务',
    icon: ScanLine,
    seal: '扫',
  },
  {
    to: '/tasks',
    title: '背诵检测',
    sub: 'RECITE',
    desc: '遮挡 / 挖空 / 跟读三模式自测',
    icon: Mic,
    seal: '诵',
  },
  {
    to: '/tasks',
    title: '默写批改',
    sub: 'DICTATE',
    desc: '逐字比对原文，错字即入错题本',
    icon: PenLine,
    seal: '默',
  },
];

export default function Home() {
  const tasks = useAppStore((s) => s.tasks);
  const wrongChars = useAppStore((s) => s.wrongChars);
  const stats = useAppStore((s) => s.stats);
  const addTasks = useAppStore((s) => s.addTasks);
  const mastery = useAppStore(selectMasteryByType);

  const todayTasks = tasks.filter((t) => !t.mastered).length;
  const dueWrongChars = wrongChars.filter((w) => !w.mastered && isDueForReview(w.nextReview));
  const recentWrongChars = wrongChars.filter((w) => !w.mastered).slice(0, 6);

  const handleLoadSample = () => {
    if (tasks.length === 0) {
      addTasks(SAMPLE_TASKS.map((t) => ({
        type: t.type,
        title: t.title,
        source: t.source,
        content: t.content,
        difficulty: t.difficulty,
      })));
    }
  };

  const ringSegments = (['poem', 'english', 'classical-word'] as TaskType[]).map((t) => {
    const m = mastery[t];
    const ratio = m.total > 0 ? m.mastered / m.total : 0;
    return { value: Math.max(ratio, 0.02), color: TASK_TYPE_META[t].color, label: t };
  });
  const totalMastered = tasks.filter((t) => t.mastered).length;
  const totalRatio = tasks.length > 0 ? totalMastered / tasks.length : 0;

  return (
    <Layout title="拾诵台" subtitle="HOME">
      {/* 极速入口 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {QUICK_ENTRIES.map((e, i) => {
          const Icon = e.icon;
          return (
            <Link
              key={e.title}
              to={e.to}
              className="group relative bg-paper border border-ink/10 hover:border-cinnabar/40 rounded-sm p-5 transition-all hover:shadow-float hover:-translate-y-0.5 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <SealStamp text={e.seal} size="md" rotate={-4} />
                <Icon size={20} className="text-ink-mute group-hover:text-cinnabar transition-colors" strokeWidth={1.5} />
              </div>
              <div className="font-display text-2xl text-ink leading-none mb-1">{e.title}</div>
              <div className="font-en text-[10px] text-ink-mute tracking-widest mb-3">{e.sub}</div>
              <div className="text-xs text-ink-soft leading-relaxed">{e.desc}</div>
              <div className="flex items-center gap-1 text-[11px] text-cinnabar mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                进入 <ArrowRight size={12} />
              </div>
            </Link>
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左：今日 + 错字回顾 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 今日待办 */}
          <section className="bg-paper border border-ink/8 rounded-sm p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-xl text-ink">今日待诵</h2>
              <span className="font-en text-[10px] text-ink-mute tracking-widest">TODAY</span>
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen size={32} className="mx-auto text-ink-mute/40 mb-3" strokeWidth={1.2} />
                <p className="text-sm text-ink-mute mb-4">尚未有背诵任务，先去扫描课本或载入样本</p>
                <div className="flex gap-2 justify-center">
                  <Link to="/scan">
                    <InkButton variant="primary" size="sm">
                      <ScanLine size={14} /> 去扫描
                    </InkButton>
                  </Link>
                  <InkButton variant="outline" size="sm" onClick={handleLoadSample}>
                    <Sparkles size={14} /> 载入样本
                  </InkButton>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 5).map((t) => (
                  <Link
                    key={t.id}
                    to={t.type === 'english' ? `/recite/${t.id}` : `/recite/${t.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 border-l-2 border-cinnabar/60 hover:border-cinnabar hover:bg-cinnabar/5 transition-all rounded-sm group"
                  >
                    <TaskBadge type={t.type} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-sm text-ink truncate">{t.title}</div>
                      <div className="text-[10px] text-ink-mute">{t.source} · {relativeTime(t.createdAt)}</div>
                    </div>
                    {t.mastered && (
                      <span className="text-[10px] text-celadon border border-celadon/40 px-1.5 py-0.5 rounded-sm">已掌握</span>
                    )}
                    <ArrowRight size={14} className="text-ink-mute group-hover:text-cinnabar transition-colors" />
                  </Link>
                ))}
                {tasks.length > 5 && (
                  <Link to="/tasks" className="block text-center text-xs text-ink-mute hover:text-cinnabar py-2">
                    查看全部 {tasks.length} 个任务 →
                  </Link>
                )}
              </div>
            )}
          </section>

          {/* 错字回顾条 */}
          <section className="bg-paper border border-ink/8 rounded-sm p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-xl text-ink">错字回顾</h2>
              <span className="font-en text-[10px] text-ink-mute tracking-widest">REVIEW</span>
            </div>
            {recentWrongChars.length === 0 ? (
              <p className="text-sm text-ink-mute py-4 text-center">尚无错字记录，去默写一篇试试</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-6 pt-2">
                {recentWrongChars.map((w) => (
                  <WrongCharCard
                    key={w.id}
                    char={w.char}
                    correct={w.correct}
                    count={w.count}
                    taskTitle={w.taskTitle}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 右：进度 + 统计 */}
        <div className="space-y-6">
          <section className="bg-paper border border-ink/8 rounded-sm p-6 flex flex-col items-center">
            <div className="flex items-baseline justify-between w-full mb-2">
              <h2 className="font-display text-xl text-ink">掌握之环</h2>
              <span className="font-en text-[10px] text-ink-mute tracking-widest">MASTERY</span>
            </div>
            <ProgressRing
              segments={ringSegments}
              size={180}
              thickness={14}
              centerLabel={`${Math.round(totalRatio * 100)}%`}
              centerSub="总掌握率"
            />
            <div className="grid grid-cols-3 gap-2 mt-5 w-full">
              {(['poem', 'english', 'classical-word'] as TaskType[]).map((t) => {
                const m = mastery[t];
                return (
                  <div key={t} className="text-center">
                    <div
                      className="w-2 h-2 rounded-full mx-auto mb-1"
                      style={{ background: TASK_TYPE_META[t].color }}
                    />
                    <div className="font-display text-lg text-ink leading-none tabular">
                      {m.total > 0 ? Math.round((m.mastered / m.total) * 100) : 0}%
                    </div>
                    <div className="text-[10px] text-ink-mute mt-1">{TASK_TYPE_META[t].label}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-ink text-paper rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-cinnabar-soft" />
                <span className="font-display text-lg">连续打卡</span>
              </div>
              <span className="font-en text-[10px] text-paper/50 tracking-widest">STREAK</span>
            </div>
            <div className="font-display text-5xl text-paper leading-none tabular">
              {stats.streakDays}
              <span className="text-base text-paper/60 ml-1">天</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-paper/15">
              <div>
                <div className="font-display text-2xl text-paper tabular">{stats.totalTasks}</div>
                <div className="text-[10px] text-paper/60">总任务数</div>
              </div>
              <div>
                <div className="font-display text-2xl text-paper tabular">{stats.totalDictations}</div>
                <div className="text-[10px] text-paper/60">默写次数</div>
              </div>
            </div>
          </section>

          {dueWrongChars.length > 0 && (
            <section className="bg-cinnabar/8 border border-cinnabar/30 rounded-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-cinnabar animate-pulse" />
                <span className="font-display text-base text-cinnabar">复习提醒</span>
              </div>
              <p className="text-xs text-ink-soft">
                今日有 <span className="font-display text-cinnabar text-base">{dueWrongChars.length}</span> 个错字待复习
              </p>
              <Link to="/notebook" className="text-xs text-cinnabar underline mt-2 inline-block">
                前往错题本 →
              </Link>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
}
