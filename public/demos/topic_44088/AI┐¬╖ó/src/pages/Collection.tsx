import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Printer,
  CheckSquare,
  Square,
  X,
  Camera,
  Hash,
  BookOpen,
  Download,
} from "lucide-react";
import { useQuestionStore } from "@/store/useQuestionStore";
import { SUBJECTS, DIFFICULTY_LABELS, type Subject } from "@/types/question";
import QuestionCard from "@/components/QuestionCard";
import SubjectTag from "@/components/SubjectTag";
import DifficultyStars from "@/components/DifficultyStars";
import { cn } from "@/lib/utils";

export default function Collection() {
  const questions = useQuestionStore((s) => s.questions);
  const selectedIds = useQuestionStore((s) => s.selectedIds);
  const toggleSelect = useQuestionStore((s) => s.toggleSelect);
  const toggleSelectIds = useQuestionStore((s) => s.toggleSelectIds);
  const clearSelect = useQuestionStore((s) => s.clearSelect);
  const removeQuestion = useQuestionStore((s) => s.removeQuestion);

  const [subject, setSubject] = useState<Subject | "全部">("全部");
  const [difficulty, setDifficulty] = useState<number | "全部">("全部");
  const [knowledgePoint, setKnowledgePoint] = useState<string>("全部");
  const [keyword, setKeyword] = useState("");
  const [showPrint, setShowPrint] = useState(false);

  const allKps = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => q.knowledgePoints.forEach((kp) => set.add(kp)));
    return Array.from(set);
  }, [questions]);

  // 知识点被删除后,若当前选中的知识点已不存在则重置
  useEffect(() => {
    if (knowledgePoint !== "全部" && !allKps.includes(knowledgePoint)) {
      setKnowledgePoint("全部");
    }
  }, [allKps, knowledgePoint]);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (subject !== "全部" && q.subject !== subject) return false;
      if (difficulty !== "全部" && q.difficulty !== difficulty) return false;
      if (knowledgePoint !== "全部" && !q.knowledgePoints.includes(knowledgePoint)) return false;
      if (keyword.trim() && !q.questionText.includes(keyword.trim())) return false;
      return true;
    });
  }, [questions, subject, difficulty, knowledgePoint, keyword]);

  const selectedQuestions = useMemo(
    () => questions.filter((q) => selectedIds.includes(q.id)),
    [questions, selectedIds]
  );

  const handleClosePrint = useCallback(() => setShowPrint(false), []);

  const handlePrint = () => {
    if (selectedQuestions.length === 0) return;
    setShowPrint(true);
  };

  const hasFilter = subject !== "全部" || difficulty !== "全部" || knowledgePoint !== "全部" || keyword.trim() !== "";

  // 当前筛选结果是否全部已选
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((q) => selectedIds.includes(q.id));

  return (
    <div className="bg-paper-grain min-h-[calc(100vh-4rem)]">
      <div className="container py-10">
        {/* 页头 */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-ink-400">
              <Link to="/" className="hover:text-ink-700">
                首页
              </Link>
              <span>/</span>
              <span className="text-ink-700">错题集</span>
            </div>
            <h1 className="mt-2 font-display text-4xl font-semibold text-ink-800">我的错题集</h1>
            <p className="mt-2 text-ink-500">
              共 <span className="font-semibold text-ink-700">{questions.length}</span> 道错题,
              已选 <span className="font-semibold text-coral-deep">{selectedIds.length}</span> 道
              {selectedIds.length > 0 && " 可打印复习"}。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/organize" className="btn-ghost">
              <Camera className="h-4 w-4" />
              添加错题
            </Link>
            <button
              onClick={handlePrint}
              disabled={selectedIds.length === 0}
              className={cn(
                "btn-ink transition-all",
                selectedIds.length === 0 && "cursor-not-allowed opacity-40"
              )}
            >
              <Printer className="h-4 w-4" />
              打印选中 ({selectedIds.length})
            </button>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="card-paper mb-6 p-5">
          <div className="flex flex-wrap items-center gap-4">
            {/* 学科 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                学科
              </span>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip
                  active={subject === "全部"}
                  onClick={() => setSubject("全部")}
                >
                  全部
                </FilterChip>
                {SUBJECTS.filter((s) => questions.some((q) => q.subject === s)).map((s) => (
                  <FilterChip
                    key={s}
                    active={subject === s}
                    onClick={() => setSubject(s)}
                  >
                    {s}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="hidden h-6 w-px bg-paper-300 sm:block" />

            {/* 难度 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                难度
              </span>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip
                  active={difficulty === "全部"}
                  onClick={() => setDifficulty("全部")}
                >
                  全部
                </FilterChip>
                {[1, 2, 3, 4, 5].map((d) => (
                  <FilterChip
                    key={d}
                    active={difficulty === d}
                    onClick={() => setDifficulty(d)}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="hidden h-6 w-px bg-paper-300 sm:block" />

            {/* 知识点 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                知识点
              </span>
              <select
                value={knowledgePoint}
                onChange={(e) => setKnowledgePoint(e.target.value)}
                className="input-paper w-auto py-1.5 text-sm"
              >
                <option value="全部">全部</option>
                {allKps.map((kp) => (
                  <option key={kp} value={kp}>
                    {kp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 搜索 + 清空 */}
          <div className="mt-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索题干关键词..."
                className="input-paper pl-9"
              />
            </div>
            {hasFilter && (
              <button
                onClick={() => {
                  setSubject("全部");
                  setDifficulty("全部");
                  setKnowledgePoint("全部");
                  setKeyword("");
                }}
                className="flex items-center gap-1 text-xs font-medium text-ink-400 hover:text-coral-deep"
              >
                <X className="h-3 w-3" />
                清空筛选
              </button>
            )}
          </div>
        </div>

        {/* 批量操作栏 */}
        {filtered.length > 0 && (
          <div className="mb-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  toggleSelectIds(
                    filtered.map((q) => q.id),
                    !allFilteredSelected
                  )
                }
                className="flex items-center gap-1.5 font-medium text-ink-500 hover:text-ink-800"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="h-4 w-4 text-highlight-deep" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {allFilteredSelected ? "取消全选" : "全选当前结果"}
              </button>
              <span className="text-ink-300">|</span>
              <span className="text-ink-400">
                筛选结果 <span className="font-semibold text-ink-700">{filtered.length}</span> 道
              </span>
              {selectedIds.length > 0 && (
                <>
                  <span className="text-ink-300">|</span>
                  <button
                    onClick={clearSelect}
                    className="text-xs font-medium text-ink-400 hover:text-coral-deep"
                  >
                    清空所有选中 ({selectedIds.length})
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* 错题列表 */}
        {filtered.length === 0 ? (
          <EmptyState hasFilter={hasFilter} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((q, i) => (
              <div key={q.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <QuestionCard
                  question={q}
                  selectable
                  selected={selectedIds.includes(q.id)}
                  onSelect={() => toggleSelect(q.id)}
                  onDelete={() => removeQuestion(q.id)}
                  index={i}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 打印预览弹层 */}
      {showPrint && (
        <PrintPreview
          questions={selectedQuestions}
          onClose={handleClosePrint}
        />
      )}
    </div>
  );
}

/* ============ 筛选 Chip ============ */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-all",
        active
          ? "bg-ink-700 text-paper-100 shadow-ink"
          : "bg-paper-200/60 text-ink-500 hover:bg-paper-300/60"
      )}
    >
      {children}
    </button>
  );
}

/* ============ 空状态 ============ */
function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="card-paper flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-paper-200/60">
        {hasFilter ? (
          <Filter className="h-7 w-7 text-ink-400" />
        ) : (
          <BookOpen className="h-7 w-7 text-ink-400" />
        )}
      </div>
      <h3 className="mb-2 font-display text-xl font-semibold text-ink-800">
        {hasFilter ? "没有符合条件的错题" : "错题集还是空的"}
      </h3>
      <p className="mb-6 text-sm text-ink-500">
        {hasFilter ? "尝试调整筛选条件,或清空筛选查看全部。" : "去拍照整理第一道错题吧!"}
      </p>
      <Link to="/organize" className="btn-ink">
        <Camera className="h-4 w-4" />
        拍照整理错题
      </Link>
    </div>
  );
}

/* ============ 打印预览 ============ */
function PrintPreview({
  questions,
  onClose,
}: {
  questions: ReturnType<typeof useQuestionStore.getState>["questions"];
  onClose: () => void;
}) {
  // 组件挂载后,等待两帧确保 DOM 渲染完成再自动触发打印
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // 打印结束后关闭预览
  useEffect(() => {
    const handleClose = () => onClose();
    window.addEventListener("afterprint", handleClose);
    return () => window.removeEventListener("afterprint", handleClose);
  }, [onClose]);

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-paper-100 shadow-lift">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-paper-300 px-6 py-4">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-ink-700" />
            <h3 className="font-display text-lg font-semibold text-ink-800">
              打印预览 · {questions.length} 道错题
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="btn-highlight px-4 py-2">
              <Printer className="h-4 w-4" />
              确认打印
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 hover:bg-paper-200 hover:text-ink-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 预览内容 */}
        <div className="scrollbar-thin flex-1 overflow-y-auto bg-paper-200/40 p-6">
          <div className="print-page mx-auto max-w-[210mm] bg-white p-10 shadow-card">
            {/* 错题集标题 */}
            <div className="mb-8 border-b-2 border-ink-700 pb-4">
              <h1 className="font-display text-3xl font-bold text-ink-800">我的错题集</h1>
              <div className="mt-1 flex items-center justify-between text-xs text-ink-500">
                <span>共 {questions.length} 道错题</span>
                <span>{new Date().toLocaleDateString("zh-CN")}</span>
              </div>
            </div>

            {/* 错题列表 */}
            <div className="space-y-6">
              {questions.map((q, i) => (
                <div key={q.id} className="break-inside-avoid">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-display text-lg font-semibold text-ink-800">
                      {i + 1}.
                    </span>
                    <SubjectTag subject={q.subject} variant="solid" />
                    <DifficultyStars level={q.difficulty} showLabel={false} />
                    {q.source && (
                      <span className="ml-auto text-[10px] text-ink-400">{q.source}</span>
                    )}
                  </div>
                  <p className="mb-2 text-sm leading-relaxed text-ink-800">{q.questionText}</p>
                  {q.note && (
                    <p className="mb-2 rounded bg-paper-100 px-3 py-1.5 text-xs text-coral-deep">
                      <span className="font-semibold">错因:</span>
                      {q.note}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-ink-500">
                    <Hash className="h-2.5 w-2.5" />
                    {q.knowledgePoints.join(" · ")}
                  </div>
                  {/* 留白书写区 */}
                  <div className="mt-3 h-16 border-b border-dashed border-ink-200" />
                </div>
              ))}
            </div>

            {/* 页脚 */}
            <div className="mt-10 border-t border-ink-200 pt-3 text-center text-[10px] text-ink-400">
              AI 错题整理助手 · 自动生成 · {new Date().toLocaleDateString("zh-CN")}
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="border-t border-paper-300 px-6 py-3 text-center text-xs text-ink-400">
          <Download className="mr-1 inline h-3 w-3" />
          打印时请在浏览器对话框选择"另存为 PDF"可导出电子版
        </div>
      </div>
    </div>
  );
}
