import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2, Mic, PenLine, CheckCircle2, ListChecks, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import InkButton from '@/components/InkButton';
import TaskBadge from '@/components/TaskBadge';
import { useAppStore } from '@/store/useAppStore';
import { splitIntoSlices, classifyText } from '@/lib/classifier';
import { TASK_TYPE_META, type TaskType, type Task } from '@/types';
import { countChars, relativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Filter = 'all' | TaskType;

export default function Tasks() {
  const nav = useNavigate();
  const tasks = useAppStore((s) => s.tasks);
  const pendingScanText = useAppStore((s) => s.pendingScanText);
  const addTasks = useAppStore((s) => s.addTasks);
  const updateTask = useAppStore((s) => s.updateTask);
  const removeTask = useAppStore((s) => s.removeTask);
  const setTaskMastered = useAppStore((s) => s.setTaskMastered);
  const clearPendingScanText = useAppStore((s) => s.clearPendingScanText);

  const [filter, setFilter] = useState<Filter>('all');
  const [draft, setDraft] = useState(pendingScanText);

  // 扫描文本切分预览
  const slices = useMemo(() => (draft.trim() ? splitIntoSlices(draft) : []), [draft]);

  useEffect(() => {
    if (pendingScanText && pendingScanText !== draft) {
      setDraft(pendingScanText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingScanText]);

  const handleGenerate = () => {
    if (slices.length === 0) return;
    addTasks(
      slices.map((s) => ({
        type: s.type,
        title: s.title,
        source: '扫描识别',
        content: s.content,
        difficulty: 2 as const,
      }))
    );
    clearPendingScanText();
    setDraft('');
    nav('/tasks');
  };

  const changeSliceType = (idx: number, type: TaskType) => {
    setDraft((prev) => {
      const next = slices.map((s, i) => (i === idx ? { ...s, type } : s));
      // 不修改 draft 文本本身，仅影响 slices 缓存需要重算
      // 这里通过修改 draft 末尾加空格触发重算不合适，改用本地 state
      setLocalSlices(next);
      return prev;
    });
  };

  const [localSlices, setLocalSlices] = useState<typeof slices>([]);
  useEffect(() => {
    setLocalSlices(slices);
  }, [slices]);
  const displaySlices = localSlices.length ? localSlices : slices;

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.type === filter);

  return (
    <Layout title="任务" subtitle="TASKS">
      {/* 扫描切分预览 */}
      {displaySlices.length > 0 && (
        <section className="mb-10 bg-paper border border-cinnabar/30 rounded-sm p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl text-ink">已扫描，待生成任务</h2>
              <p className="text-xs text-ink-mute mt-1">系统已自动分类，可手动调整类型与难度</p>
            </div>
            <Sparkles size={20} className="text-cinnabar" />
          </div>

          <div className="space-y-3 mb-4">
            {displaySlices.map((s, i) => {
              const meta = TASK_TYPE_META[s.type];
              return (
                <div key={i} className="border border-ink/10 rounded-sm p-4 bg-paper/60">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-sm text-ink truncate">{s.title}</div>
                      <div className="text-[10px] text-ink-mute mt-0.5">
                        {countChars(s.content)} 字 · {meta.label}
                      </div>
                    </div>
                    {/* 类型切换 */}
                    <div className="flex gap-1">
                      {(Object.keys(TASK_TYPE_META) as TaskType[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => changeSliceType(i, t)}
                          className={cn(
                            'px-2 py-1 text-[10px] rounded-sm border transition-all cursor-pointer',
                            s.type === t
                              ? `${TASK_TYPE_META[t].bgClass} ${TASK_TYPE_META[t].textClass} ${TASK_TYPE_META[t].borderClass}`
                              : 'border-ink/10 text-ink-mute hover:border-ink/30'
                          )}
                        >
                          {TASK_TYPE_META[t].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <pre className="font-serif text-xs text-ink-soft whitespace-pre-wrap max-h-24 overflow-hidden leading-relaxed">
                    {s.content.slice(0, 120)}
                    {s.content.length > 120 ? '…' : ''}
                  </pre>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <InkButton variant="primary" size="md" onClick={handleGenerate}>
              <CheckCircle2 size={14} /> 生成 {displaySlices.length} 个任务
            </InkButton>
            <InkButton variant="outline" size="md" onClick={() => { clearPendingScanText(); setDraft(''); setLocalSlices([]); }}>
              取消
            </InkButton>
          </div>
        </section>
      )}

      {/* 已有任务列表 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl text-ink">背诵任务</h2>
            <span className="text-xs text-ink-mute">共 {tasks.length} 个</span>
          </div>
          <Link to="/scan">
            <InkButton variant="outline" size="sm">
              <Sparkles size={12} /> 新建任务
            </InkButton>
          </Link>
        </div>

        {/* 筛选 */}
        <div className="flex gap-1 mb-4 border-b border-ink/8">
          {(['all', 'poem', 'classical-word', 'english'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-2 text-sm transition-all border-b-2 -mb-px cursor-pointer',
                filter === f
                  ? 'border-cinnabar text-ink'
                  : 'border-transparent text-ink-mute hover:text-ink'
              )}
            >
              {f === 'all' ? '全部' : TASK_TYPE_META[f].label}
            </button>
          ))}
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <ListChecks size={32} className="mx-auto text-ink-mute/40 mb-3" strokeWidth={1.2} />
            <p className="text-sm text-ink-mute mb-4">
              {tasks.length === 0 ? '暂无任务，去扫描课本生成第一个任务' : '该类型暂无任务'}
            </p>
            {tasks.length === 0 && (
              <Link to="/scan">
                <InkButton variant="primary" size="sm">去扫描</InkButton>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                onRemove={() => removeTask(t.id)}
                onMastered={(v) => setTaskMastered(t.id, v)}
                onDifficulty={(d) => updateTask(t.id, { difficulty: d })}
              />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}

interface TaskRowProps {
  task: Task;
  onRemove: () => void;
  onMastered: (v: boolean) => void;
  onDifficulty: (d: 1 | 2 | 3) => void;
}

function TaskRow({ task, onRemove, onMastered, onDifficulty }: TaskRowProps) {
  return (
    <div className="group bg-paper border border-ink/8 hover:border-cinnabar/30 rounded-sm p-4 transition-all">
      <div className="flex items-center gap-3">
        <TaskBadge type={task.type} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="font-serif text-base text-ink truncate">{task.title}</div>
          <div className="text-[11px] text-ink-mute mt-0.5">
            {task.source} · {countChars(task.content)} 字 · {relativeTime(task.createdAt)}
          </div>
        </div>

        {/* 难度 */}
        <div className="hidden md:flex items-center gap-1">
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              onClick={() => onDifficulty(d as 1 | 2 | 3)}
              className={cn(
                'w-5 h-5 rounded-sm text-[10px] font-mono transition-all cursor-pointer',
                task.difficulty >= d
                  ? 'bg-cinnabar text-paper'
                  : 'bg-ink/5 text-ink-mute hover:bg-ink/10'
              )}
              title={`难度 ${d}`}
            >
              {d}
            </button>
          ))}
        </div>

        {task.mastered && (
          <span className="text-[10px] text-celadon border border-celadon/40 px-1.5 py-0.5 rounded-sm">
            已掌握
          </span>
        )}

        <div className="flex items-center gap-1">
          <Link to={`/recite/${task.id}`}>
            <button className="w-8 h-8 rounded-sm flex items-center justify-center text-ink-mute hover:text-cinnabar hover:bg-cinnabar/8 transition-all" title="背诵检测">
              <Mic size={14} />
            </button>
          </Link>
          <Link to={`/dictate/${task.id}`}>
            <button className="w-8 h-8 rounded-sm flex items-center justify-center text-ink-mute hover:text-cinnabar hover:bg-cinnabar/8 transition-all" title="默写批改">
              <PenLine size={14} />
            </button>
          </Link>
          <button
            onClick={() => onMastered(!task.mastered)}
            className="w-8 h-8 rounded-sm flex items-center justify-center text-ink-mute hover:text-celadon hover:bg-celadon/8 transition-all"
            title={task.mastered ? '取消掌握' : '标记已掌握'}
          >
            <CheckCircle2 size={14} />
          </button>
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-sm flex items-center justify-center text-ink-mute hover:text-cinnabar hover:bg-cinnabar/8 transition-all opacity-0 group-hover:opacity-100"
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <ArrowRight size={14} className="text-ink-mute/40 hidden md:block" />
      </div>
    </div>
  );
}
