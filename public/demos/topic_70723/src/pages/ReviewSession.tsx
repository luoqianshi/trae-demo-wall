import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Flag,
  Clock,
  Award,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useQuestionStore } from "@/store/useQuestionStore";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { getSubject } from "@/data/subjects";
import { QUESTION_TYPE_META, type Question } from "@/types";
import { cn } from "@/lib/utils";

interface LocationState {
  ids: string[];
}

type Phase = "answering" | "result";

export default function ReviewSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const { ids } = (location.state ?? { ids: [] }) as LocationState;

  const questions = useQuestionStore((s) => s.questions);
  const reviewQuestion = useQuestionStore((s) => s.reviewQuestion);

  const session = useMemo(
    () => questions.filter((q) => ids.includes(q.id)),
    [questions, ids],
  );

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("answering");
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  // 实时计时
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // 题目为空（直接访问或刷新丢失 state）
  if (session.length === 0) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="glass-strong rounded-4xl p-10 text-center max-w-md">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-brand-50 text-brand-500 grid place-items-center mb-4">
            <Clock size={28} />
          </div>
          <h2 className="title-display text-xl font-bold text-ink-900 mb-2">
            没有可复习的题目
          </h2>
          <p className="text-sm text-ink-500 mb-5">
            可能是页面刷新导致会话丢失，请返回复习中心重新开始。
          </p>
          <Link to="/review">
            <Button variant="primary">
              <RotateCcw size={14} /> 返回复习中心
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const q = session[current];
  const isLast = current === session.length - 1;
  const total = session.length;

  const setAnswer = (val: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  };

  const next = () => {
    if (isLast) {
      submit();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const prev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const submit = () => {
    // 自动判分
    session.forEach((item) => {
      const ans = answers[item.id] ?? "";
      const correct = judgeAnswer(item, ans);
      reviewQuestion(item.id, correct, ans);
    });
    setPhase("result");
  };

  // 结果统计
  const resultStats = useMemo(() => {
    if (phase !== "result") return null;
    let correctCount = 0;
    session.forEach((item) => {
      const ans = answers[item.id] ?? "";
      if (judgeAnswer(item, ans)) correctCount += 1;
    });
    return {
      correct: correctCount,
      wrong: total - correctCount,
      accuracy: Math.round((correctCount / total) * 100),
    };
  }, [phase, session, answers, total]);

  if (phase === "result" && resultStats) {
    return (
      <ResultView
        session={session}
        answers={answers}
        stats={resultStats}
        elapsed={elapsed}
        onRetry={() => {
          setAnswers({});
          setCurrent(0);
          setPhase("answering");
          setElapsed(0);
        }}
        onBack={() => navigate("/review")}
      />
    );
  }

  const typeMeta = QUESTION_TYPE_META[q.questionType];
  const meta = getSubject(q.subject);
  const ans = answers[q.id] ?? "";
  const answered = ans.trim().length > 0;
  const progress = ((current + (answered ? 1 : 0)) / total) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-ink-50 via-white to-brand-50">
      {/* 顶部进度条 */}
      <header className="px-6 py-4 border-b border-ink-100/60 backdrop-blur-md bg-white/70 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/review")}
            className="w-10 h-10 grid place-items-center rounded-full text-ink-500 hover:bg-ink-100/70 hover:text-ink-700 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-ink-700">
                第 <span className="num-display text-brand-600">{current + 1}</span> / {total} 题
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                <Clock size={12} />
                <span className="num-display">
                  {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
                </span>
              </span>
            </div>
            <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-mint-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 题目卡 */}
      <main className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* 题目元信息 */}
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <SubjectBadge subject={q.subject} size="md" />
            <Tag tone="brand">{q.knowledgePoint}</Tag>
            <Tag tone="ink">{typeMeta.name}</Tag>
            <DifficultyBadge level={q.difficulty} />
          </div>

          {/* 题干 */}
          <div className="glass-strong rounded-4xl p-7 mb-6">
            <div className="text-[11px] text-ink-400 mb-3 font-bold">题目</div>
            <p className="text-lg leading-relaxed text-ink-900 whitespace-pre-wrap">
              {q.content}
            </p>
            {q.options && (
              <div className="mt-5 space-y-2.5">
                {q.options.map((opt, i) => {
                  const isSelected = ans === opt.split(".")[0].trim();
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswer(opt.split(".")[0].trim())}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-2xl border-2 transition-all flex items-center gap-3",
                        isSelected
                          ? "bg-brand-50 border-brand-400 text-ink-900"
                          : "bg-white/60 border-ink-100 text-ink-700 hover:border-brand-200 hover:bg-white",
                      )}
                    >
                      <span
                        className={cn(
                          "w-7 h-7 rounded-full grid place-items-center text-sm font-bold shrink-0 transition-all",
                          isSelected
                            ? "bg-brand-500 text-white"
                            : "bg-ink-100 text-ink-500",
                        )}
                      >
                        {opt[0]}
                      </span>
                      <span className="text-sm">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 答题区（非选择题） */}
          {!q.options && (
            <div className="glass-strong rounded-4xl p-7 mb-6">
              <div className="text-[11px] text-ink-400 mb-3 font-bold">作答</div>
              {q.questionType === "fill" || q.questionType === "calc" ? (
                <input
                  type="text"
                  value={ans}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="在此输入你的答案…"
                  className="w-full px-4 py-3 rounded-2xl bg-white/70 border-2 border-ink-100 text-base outline-none focus:border-brand-400 focus:bg-white transition-all"
                  autoFocus
                />
              ) : (
                <textarea
                  value={ans}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="在此输入你的解答…"
                  className="w-full min-h-[120px] px-4 py-3 rounded-2xl bg-white/70 border-2 border-ink-100 text-base outline-none focus:border-brand-400 focus:bg-white transition-all resize-y"
                  autoFocus
                />
              )}
              <p className="mt-2 text-[11px] text-ink-400">
                <Sparkles size={11} className="inline mr-1" />
                提交后系统将自动判分（简答/作文题需人工复核）
              </p>
            </div>
          )}

          {/* 题号导航 */}
          <div className="glass rounded-3xl p-4 mb-6">
            <div className="text-[11px] text-ink-400 mb-2 font-bold">题号导航</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {session.map((item, i) => {
                const isCurrent = i === current;
                const isAnswered = !!(answers[item.id]?.trim());
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                      isCurrent
                        ? "bg-brand-500 text-white shadow-glow-brand"
                        : isAnswered
                        ? "bg-mint-100 text-mint-700"
                        : "bg-ink-100 text-ink-400 hover:bg-ink-200",
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* 底部操作栏 */}
      <footer className="px-6 py-4 border-t border-ink-100/60 backdrop-blur-md bg-white/70">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={prev}
            disabled={current === 0}
          >
            <ChevronLeft size={16} /> 上一题
          </Button>
          <div className="text-xs text-ink-500 hidden sm:block">
            {answered ? "已作答，" : "未作答，"}可跳过本题
          </div>
          <Button variant="primary" onClick={next}>
            {isLast ? (
              <>
                <Flag size={14} /> 提交判分
              </>
            ) : (
              <>
                下一题 <ChevronRight size={16} />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}

// 答案判定
function judgeAnswer(q: Question, ans: string): boolean {
  const cleanAns = ans.trim().toLowerCase();
  if (!cleanAns) return false;
  // 选择题：精确匹配
  if (q.options) {
    return cleanAns === q.answer.trim().toLowerCase();
  }
  // 填空/计算：去除空格、标点后模糊匹配
  const norm = (s: string) =>
    s.toLowerCase().replace(/[\s,，。.;；、]/g, "").replace(/[（(]/g, "(").replace(/[)）]/g, ")");
  return norm(cleanAns) === norm(q.answer);
}

// 结果视图
function ResultView({
  session,
  answers,
  stats,
  elapsed,
  onRetry,
  onBack,
}: {
  session: Question[];
  answers: Record<string, string>;
  stats: { correct: number; wrong: number; accuracy: number };
  elapsed: number;
  onRetry: () => void;
  onBack: () => void;
}) {
  const tone =
    stats.accuracy >= 80 ? "mint" : stats.accuracy >= 50 ? "brand" : "rose";
  const toneClass = {
    mint: "from-mint-400 to-mint-500",
    brand: "from-brand-500 to-brand-600",
    rose: "from-rose-400 to-rose-500",
  }[tone];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-50 via-white to-brand-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* 总分卡 */}
        <div className="relative glass-strong rounded-5xl p-8 mb-6 text-center overflow-hidden">
          <div className={`absolute -right-20 -top-20 w-72 h-72 rounded-full bg-gradient-to-br ${toneClass} opacity-15 blur-3xl`} />
          <div className="relative">
            <div className={`mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br ${toneClass} grid place-items-center text-white shadow-glow-brand mb-4`}>
              <Award size={40} />
            </div>
            <h2 className="title-display text-3xl font-bold text-ink-900 mb-2">
              复习完成！
            </h2>
            <p className="text-sm text-ink-500 mb-6">
              共 {session.length} 题 · 用时{" "}
              <span className="num-display font-bold">
                {Math.floor(elapsed / 60)}分{elapsed % 60}秒
              </span>
            </p>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="glass rounded-2xl p-4">
                <div className="num-display text-3xl font-bold text-mint-600">
                  {stats.correct}
                </div>
                <div className="text-xs text-ink-500 mt-1">答对</div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="num-display text-3xl font-bold text-rose-500">
                  {stats.wrong}
                </div>
                <div className="text-xs text-ink-500 mt-1">答错</div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className={`num-display text-3xl font-bold text-${tone}-600`}>
                  {stats.accuracy}%
                </div>
                <div className="text-xs text-ink-500 mt-1">正确率</div>
              </div>
            </div>
          </div>
        </div>

        {/* 题目回顾 */}
        <h3 className="title-display text-lg font-bold text-ink-900 mb-3 px-1">题目回顾</h3>
        <div className="space-y-3 mb-6">
          {session.map((q, i) => {
            const ans = answers[q.id] ?? "";
            const correct = judgeAnswer(q, ans);
            const meta = getSubject(q.subject);
            const typeMeta = QUESTION_TYPE_META[q.questionType];
            return (
              <div
                key={q.id}
                className="relative glass-strong rounded-3xl p-5 pl-6"
              >
                <span className="subj-bar" style={{ background: meta.color }} />
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl grid place-items-center shrink-0",
                      correct ? "bg-mint-100 text-mint-600" : "bg-rose-100 text-rose-500",
                    )}
                  >
                    {correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      <span className="num-display text-xs font-bold text-ink-600">第 {i + 1} 题</span>
                      <Tag tone="ink" size="xs">{meta.name}</Tag>
                      <Tag tone="brand" size="xs">{typeMeta.short}</Tag>
                    </div>
                    <p className="text-sm text-ink-800 leading-relaxed mb-2">{q.content}</p>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-rose-50 rounded-xl p-2.5">
                        <div className="text-[10px] text-rose-500 font-bold mb-0.5">你的答案</div>
                        <div className="text-sm text-ink-800 font-medium">
                          {ans.trim() || "（未作答）"}
                        </div>
                      </div>
                      <div className="bg-mint-50 rounded-xl p-2.5">
                        <div className="text-[10px] text-mint-600 font-bold mb-0.5">正确答案</div>
                        <div className="text-sm text-mint-700 font-bold">{q.answer}</div>
                      </div>
                    </div>
                    {q.analysis && (
                      <div className="mt-2 text-xs text-ink-500 leading-relaxed bg-ink-50/50 rounded-xl p-2.5">
                        <span className="font-bold text-ink-600">解析：</span>{q.analysis}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 操作 */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="flex-1" onClick={onBack}>
            返回复习中心
          </Button>
          <Button variant="primary" className="flex-1" onClick={onRetry}>
            <RotateCcw size={14} /> 再做一次
          </Button>
        </div>
      </div>
    </div>
  );
}
