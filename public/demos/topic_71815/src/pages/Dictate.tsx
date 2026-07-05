import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Check, PenLine, BookPlus, Award, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import InkButton from '@/components/InkButton';
import TaskBadge from '@/components/TaskBadge';
import WrongCharCard from '@/components/WrongCharCard';
import { useAppStore } from '@/store/useAppStore';
import { alignTexts, extractErrors, calcAccuracy, type AlignCell } from '@/lib/grading';
import { cn } from '@/lib/utils';

export default function Dictate() {
  const { taskId } = useParams();
  const nav = useNavigate();
  const task = useAppStore((s) => s.tasks.find((t) => t.id === taskId));
  const addDictation = useAppStore((s) => s.addDictation);
  const upsertWrongChar = useAppStore((s) => s.upsertWrongChar);
  const setTaskMastered = useAppStore((s) => s.setTaskMastered);

  const [userInput, setUserInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => {
    if (!submitted || !task) return null;
    const cells = alignTexts(task.content, userInput);
    const errors = extractErrors(cells);
    const accuracy = calcAccuracy(cells);
    return { cells, errors, accuracy };
  }, [submitted, task, userInput]);

  if (!task) {
    return (
      <Layout title="默写批改" subtitle="DICTATE">
        <div className="text-center py-16">
          <p className="text-ink-mute mb-4">任务不存在或已被删除</p>
          <Link to="/tasks"><InkButton variant="outline" size="sm">返回任务列表</InkButton></Link>
        </div>
      </Layout>
    );
  }

  const handleSubmit = () => {
    setSubmitted(true);
    const cells = alignTexts(task.content, userInput);
    const errors = extractErrors(cells);
    const accuracy = calcAccuracy(cells);
    addDictation({ taskId: task.id, userInput, errors, accuracy });
    // 错字入本
    errors.forEach((e) => {
      if (e.type !== 'extra' && e.expected) {
        upsertWrongChar({
          char: e.expected,
          correct: e.actual || '',
          taskId: task.id,
          taskTitle: task.title,
        });
      }
    });
    if (accuracy >= 0.95) setTaskMastered(task.id, true);
  };

  const handleReset = () => {
    setUserInput('');
    setSubmitted(false);
  };

  const charCount = Array.from(userInput.replace(/\s/g, '')).length;
  const expectedCount = Array.from(task.content.replace(/\s/g, '')).length;

  return (
    <Layout title="默写批改" subtitle="DICTATE">
      <Link to={`/recite/${task.id}`} className="inline-flex items-center gap-1 text-xs text-ink-mute hover:text-ink mb-4">
        <ArrowLeft size={12} /> 返回检测
      </Link>

      {/* 任务头 */}
      <div className="bg-paper border border-ink/8 rounded-sm p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <TaskBadge type={task.type} size="sm" />
          <h2 className="font-display text-2xl text-ink leading-none">{task.title}</h2>
        </div>
        <p className="text-xs text-ink-mute">{task.source} · 应默 {expectedCount} 字</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左：默写输入 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-ink">默写区</h3>
            <span className="text-xs text-ink-mute tabular">{charCount} / {expectedCount} 字</span>
          </div>
          <textarea
            value={userInput}
            onChange={(e) => !submitted && setUserInput(e.target.value)}
            placeholder="凭记忆默写完整内容，可分行…"
            disabled={submitted}
            className={cn(
              'w-full h-80 p-5 font-serif text-base leading-loose rounded-sm border resize-none gaozhi-bg transition-all',
              submitted ? 'border-ink/10 opacity-70' : 'border-ink/10 focus:border-cinnabar',
              'focus:outline-none'
            )}
            style={{ lineHeight: '36px' }}
          />
          <div className="mt-3 flex gap-2">
            {!submitted ? (
              <>
                <InkButton variant="primary" size="md" onClick={handleSubmit} disabled={!userInput.trim()}>
                  <Check size={14} /> 提交批改
                </InkButton>
                <InkButton variant="ghost" size="md" onClick={() => setUserInput('')} disabled={!userInput}>
                  清空
                </InkButton>
              </>
            ) : (
              <InkButton variant="outline" size="md" onClick={handleReset}>
                <RefreshCw size={14} /> 重新默写
              </InkButton>
            )}
          </div>
        </section>

        {/* 右：批改结果 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-ink">批改结果</h3>
            {result && (
              <span className={cn(
                'font-display text-2xl tabular',
                result.accuracy >= 0.9 ? 'text-celadon' : result.accuracy >= 0.7 ? 'text-ochre' : 'text-cinnabar'
              )}>
                {Math.round(result.accuracy * 100)}%
              </span>
            )}
          </div>

          {!submitted ? (
            <div className="h-80 border border-dashed border-ink/15 rounded-sm flex flex-col items-center justify-center text-center px-6">
              <PenLine size={28} className="text-ink-mute/40 mb-3" strokeWidth={1.2} />
              <p className="text-sm text-ink-mute">提交默写后将自动逐字批改</p>
              <p className="text-[11px] text-ink-mute/70 mt-1">错字红、漏字黄、多字灰</p>
            </div>
          ) : (
            <ResultView cells={result!.cells} accuracy={result!.accuracy} />
          )}
        </section>
      </div>

      {/* 错字卡 */}
      {submitted && result && result.errors.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookPlus size={16} className="text-cinnabar" />
              <h3 className="font-display text-lg text-ink">错字入本（{result.errors.filter(e => e.type !== 'extra').length}）</h3>
            </div>
            <Link to="/notebook">
              <InkButton variant="ghost" size="sm">查看错题本 →</InkButton>
            </Link>
          </div>
          <div className="flex flex-wrap gap-4">
            {result.errors
              .filter((e) => e.type !== 'extra' && e.expected)
              .map((e, i) => (
                <WrongCharCard
                  key={`${e.expected}-${i}`}
                  char={e.expected}
                  correct={e.actual || '?'}
                  taskTitle={task.title}
                  animate
                />
              ))}
          </div>
        </section>
      )}

      {submitted && result && result.accuracy >= 0.95 && (
        <div className="mt-8 bg-celadon/10 border border-celadon/30 rounded-sm p-5 flex items-center gap-3 animate-fade-up">
          <Award size={24} className="text-celadon" />
          <div>
            <div className="font-display text-base text-celadon">掌握度达标</div>
            <div className="text-xs text-ink-soft">正确率 ≥ 95%，本任务已自动标记为已掌握</div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function ResultView({ cells, accuracy }: { cells: AlignCell[]; accuracy: number }) {
  return (
    <div>
      <div className="h-64 overflow-y-auto bg-paper border border-ink/8 rounded-sm p-4 leading-loose">
        <div className="font-serif text-base flex flex-wrap">
          {cells.map((c, i) => {
            if (c.type === 'match') {
              return <span key={i} className="text-ink">{c.expected}</span>;
            }
            if (c.type === 'missing') {
              return (
                <span
                  key={i}
                  className="inline-flex items-center justify-center bg-ochre/20 text-ochre border-b-2 border-ochre px-1 mx-0.5 animate-seal-stamp"
                  title={`漏字：应为「${c.expected}」`}
                >
                  {c.expected}
                </span>
              );
            }
            if (c.type === 'extra') {
              return (
                <span
                  key={i}
                  className="inline-flex items-center justify-center bg-ink/10 text-ink-mute line-through px-1 mx-0.5"
                  title="多字"
                >
                  {c.actual}
                </span>
              );
            }
            // wrong
            return (
              <span key={i} className="inline-flex items-center mx-0.5">
                <span
                  className="inline-flex items-center justify-center bg-cinnabar/15 text-cinnabar border-b-2 border-cinnabar px-1 line-through animate-seal-stamp"
                  title={`错字：应为「${c.expected}」`}
                >
                  {c.expected}
                </span>
                <span className="text-[10px] text-cinnabar mx-0.5">→</span>
                <span className="inline-flex items-center justify-center bg-celadon/15 text-celadon border-b-2 border-celadon px-1">
                  {c.actual}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* 图例 */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-ink-mute">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-cinnabar/15 border-b-2 border-cinnabar" /> 错字</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-ochre/20 border-b-2 border-ochre" /> 漏字</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-ink/10" /> 多字</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-celadon/15 border-b-2 border-celadon" /> 应为</span>
        <span className="ml-auto flex items-center gap-1">
          <AlertCircle size={12} className="text-cinnabar" />
          错字已自动加入错题本
        </span>
      </div>
    </div>
  );
}
