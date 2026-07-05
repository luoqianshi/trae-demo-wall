import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mic, Volume2, Check, X, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import InkButton from '@/components/InkButton';
import TaskBadge from '@/components/TaskBadge';
import { useAppStore } from '@/store/useAppStore';
import { useSpeechSynthesis, useSpeechRecognition } from '@/hooks/useSpeech';
import { textSimilarity } from '@/lib/grading';
import { cn } from '@/lib/utils';

type Mode = 'cover' | 'cloze' | 'readalong';

export default function Recite() {
  const { taskId } = useParams();
  const nav = useNavigate();
  const task = useAppStore((s) => s.tasks.find((t) => t.id === taskId));

  const [mode, setMode] = useState<Mode>('cloze');
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [inputs, setInputs] = useState<Record<number, string>>({});

  if (!task) {
    return (
      <Layout title="背诵检测" subtitle="RECITE">
        <div className="text-center py-16">
          <p className="text-ink-mute mb-4">任务不存在或已被删除</p>
          <Link to="/tasks"><InkButton variant="outline" size="sm">返回任务列表</InkButton></Link>
        </div>
      </Layout>
    );
  }

  // 按行拆分
  const lines = task.content.split(/\r?\n/).filter(Boolean);

  // 挖空：根据难度决定挖空比例
  const clozeIndices = useMemo(() => {
    const allChars = Array.from(task.content.replace(/\s/g, ''));
    const ratio = task.difficulty === 1 ? 0.2 : task.difficulty === 2 ? 0.35 : 0.5;
    const step = Math.max(2, Math.floor(1 / ratio));
    const idxs: number[] = [];
    for (let i = step - 1; i < allChars.length; i += step) {
      // 跳过标点
      if (/[\u3000-\u303F\uff00-\uffef，。、；：！？「」『』（）]/.test(allChars[i])) continue;
      idxs.push(i);
    }
    return new Set(idxs);
  }, [task.content, task.difficulty]);

  const flatChars = useMemo(() => Array.from(task.content), [task.content]);

  const toggleReveal = (i: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const reset = () => {
    setRevealed(new Set());
    setInputs({});
  };

  return (
    <Layout title="背诵检测" subtitle="RECITE">
      <Link to="/tasks" className="inline-flex items-center gap-1 text-xs text-ink-mute hover:text-ink mb-4">
        <ArrowLeft size={12} /> 返回任务
      </Link>

      {/* 任务头 */}
      <div className="bg-paper border border-ink/8 rounded-sm p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <TaskBadge type={task.type} size="sm" />
          <h2 className="font-display text-2xl text-ink leading-none">{task.title}</h2>
        </div>
        <p className="text-xs text-ink-mute">{task.source} · 难度 {task.difficulty}</p>
      </div>

      {/* 模式切换 */}
      <div className="flex gap-1 mb-6 border-b border-ink/8">
        {([
          { id: 'cloze', label: '挖空还原', icon: Sparkles },
          { id: 'cover', label: '遮挡填空', icon: Eye },
          { id: 'readalong', label: '跟读评分', icon: Mic },
        ] as { id: Mode; label: string; icon: typeof Eye }[]).map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); reset(); }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm transition-all border-b-2 -mb-px cursor-pointer',
                mode === m.id
                  ? 'border-cinnabar text-ink font-medium'
                  : 'border-transparent text-ink-mute hover:text-ink'
              )}
            >
              <Icon size={14} /> {m.label}
            </button>
          );
        })}
      </div>

      {/* 内容区 */}
      {mode === 'cover' && (
        <CoverMode lines={lines} revealed={revealed} toggleReveal={toggleReveal} onReset={reset} />
      )}
      {mode === 'cloze' && (
        <ClozeMode
          flatChars={flatChars}
          clozeIndices={clozeIndices}
          inputs={inputs}
          setInputs={setInputs}
        />
      )}
      {mode === 'readalong' && (
        <ReadAlongMode lines={lines} />
      )}

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-ink/8">
        <InkButton variant="ghost" size="sm" onClick={reset}>
          <RefreshCw size={12} /> 重置
        </InkButton>
        <Link to={`/dictate/${task.id}`}>
          <InkButton variant="primary" size="md">
            去默写批改 →
          </InkButton>
        </Link>
      </div>
    </Layout>
  );
}

/* —— 遮挡模式：按行整行遮挡，点击翻转 —— */
function CoverMode({
  lines,
  revealed,
  toggleReveal,
  onReset,
}: {
  lines: string[];
  revealed: Set<number>;
  toggleReveal: (i: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const shown = revealed.has(i);
        return (
          <div
            key={i}
            onClick={() => toggleReveal(i)}
            className={cn(
              'group relative flex items-center gap-3 px-5 py-3 rounded-sm border cursor-pointer transition-all gaozhi-bg',
              shown
                ? 'border-ink/15 bg-paper'
                : 'border-cinnabar/30 bg-cinnabar/5 hover:bg-cinnabar/10'
            )}
          >
            <span className="font-mono text-[10px] text-ink-mute tabular w-6">{String(i + 1).padStart(2, '0')}</span>
            <span
              className={cn(
                'flex-1 font-serif text-lg leading-loose transition-all',
                shown ? 'text-ink' : 'text-cinnabar/0 select-none'
              )}
            >
              {line}
            </span>
            <span className="text-ink-mute group-hover:text-cinnabar">
              {shown ? <EyeOff size={14} /> : <Eye size={14} />}
            </span>
            {!shown && (
              <span className="absolute inset-y-0 right-0 left-12 flex items-center text-xs text-cinnabar/60 pointer-events-none">
                点击翻转显示
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* —— 挖空模式：随机挖空，输入答案 —— */
function ClozeMode({
  flatChars,
  clozeIndices,
  inputs,
  setInputs,
}: {
  flatChars: string[];
  clozeIndices: Set<number>;
  inputs: Record<number, string>;
  setInputs: (v: Record<number, string>) => void;
}) {
  // 重建带换行的渲染
  const rendered: React.ReactNode[] = [];
  let globalIdx = 0;
  for (let i = 0; i < flatChars.length; i++) {
    const ch = flatChars[i];
    if (ch === '\n') {
      rendered.push(<br key={`br-${i}`} />);
      continue;
    }
    const isCloze = clozeIndices.has(globalIdx);
    if (isCloze) {
      const val = inputs[globalIdx] ?? '';
      const correct = ch;
      const status = val.length > 0 ? (val === correct ? 'correct' : 'wrong') : 'empty';
      rendered.push(
        <input
          key={`c-${globalIdx}`}
          value={val}
          onChange={(e) => setInputs({ ...inputs, [globalIdx]: e.target.value.slice(-1) })}
          maxLength={1}
          className={cn(
            'inline-block w-6 h-7 mx-0.5 text-center font-serif text-base rounded-sm border-b-2 bg-transparent transition-all',
            status === 'empty' && 'border-cinnabar text-ink',
            status === 'correct' && 'border-celadon text-celadon',
            status === 'wrong' && 'border-cinnabar text-cinnabar bg-cinnabar/10'
          )}
        />
      );
    } else {
      rendered.push(<span key={`t-${globalIdx}`} className="font-serif text-lg text-ink">{ch}</span>);
    }
    globalIdx++;
  }

  const totalCloze = clozeIndices.size;
  const correctCount = Object.entries(inputs).filter(([idx, v]) => flatChars[Number(idx)] === v).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 text-xs text-ink-mute">
        <span>填入挖空处，回车跳下一空</span>
        <span className="tabular">
          已填 {Object.keys(inputs).length} / {totalCloze} · 正确 <span className="text-celadon">{correctCount}</span>
        </span>
      </div>
      <div className="bg-paper border border-ink/8 rounded-sm p-6 leading-loose">
        <div className="font-serif text-lg">{rendered}</div>
      </div>
    </div>
  );
}

/* —— 跟读模式：TTS 朗读 + ASR 识别比对 —— */
function ReadAlongMode({ lines }: { lines: string[] }) {
  const tts = useSpeechSynthesis();
  const asr = useSpeechRecognition('zh-CN');
  const [spokenLine, setSpokenLine] = useState(-1);
  const [score, setScore] = useState<number | null>(null);

  const handleSpeak = (line: string, idx: number) => {
    tts.speak(line);
    setSpokenLine(idx);
    setScore(null);
  };

  const handleStart = () => {
    asr.start();
    setScore(null);
  };

  const handleEval = () => {
    if (!asr.transcript || spokenLine < 0) return;
    const s = textSimilarity(lines[spokenLine].replace(/[，。、；：！？]/g, ''), asr.transcript);
    setScore(Math.round(s * 100));
  };

  return (
    <div>
      <div className="space-y-2 mb-6">
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-3 px-5 py-3 rounded-sm border transition-all',
              spokenLine === i ? 'border-cinnabar bg-cinnabar/5' : 'border-ink/8 bg-paper'
            )}
          >
            <span className="font-mono text-[10px] text-ink-mute tabular w-6">{String(i + 1).padStart(2, '0')}</span>
            <span className="flex-1 font-serif text-lg text-ink">{line}</span>
            {tts.supported && (
              <button
                onClick={() => handleSpeak(line, i)}
                className="w-8 h-8 rounded-sm flex items-center justify-center text-ink-mute hover:text-cinnabar hover:bg-cinnabar/8 cursor-pointer"
                title="朗读"
              >
                <Volume2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-paper border border-ink/8 rounded-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base text-ink">跟读评分</h3>
          {!asr.supported && (
            <span className="text-[11px] text-cinnabar">浏览器不支持语音识别</span>
          )}
        </div>
        <div className="flex gap-2 mb-3">
          <InkButton
            variant="primary"
            size="sm"
            onClick={asr.listening ? asr.stop : handleStart}
            disabled={!asr.supported || spokenLine < 0}
          >
            <Mic size={14} /> {asr.listening ? '停止' : '开始跟读'}
          </InkButton>
          <InkButton variant="outline" size="sm" onClick={handleEval} disabled={!asr.transcript}>
            <Check size={14} /> 评分
          </InkButton>
        </div>
        {asr.transcript && (
          <div className="mt-3">
            <div className="text-[10px] text-ink-mute mb-1">识别结果：</div>
            <div className="font-serif text-base text-ink-soft px-3 py-2 bg-ink/5 rounded-sm">{asr.transcript}</div>
          </div>
        )}
        {score !== null && (
          <div className="mt-3 flex items-center gap-3 animate-seal-stamp">
            <span className="font-display text-3xl text-cinnabar tabular">{score}</span>
            <span className="text-sm text-ink-mute">
              {score >= 85 ? '熟练' : score >= 60 ? '尚可' : '需再练'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
