import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Filter,
  X,
  Download,
  Trash2,
  Library as LibraryIcon,
  RotateCcw,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { useQuestionStore } from "@/store/useQuestionStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { MasteryBar } from "@/components/ui/MasteryBar";
import { QuestionCard, QuestionListItem } from "@/components/ui/QuestionCard";
import { SUBJECTS, getSubject } from "@/data/subjects";
import { ERROR_REASONS } from "@/data/mockQuestions";
import { QUESTION_TYPE_META, DIFFICULTY_META, type Question, type Subject, type Difficulty } from "@/types";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type SortKey = "newest" | "oldest" | "mastery-asc" | "mastery-desc";

interface Filters {
  keyword: string;
  subjects: Subject[];
  difficulties: Difficulty[];
  errorReasons: string[];
  masteryRange: "all" | "weak" | "medium" | "mastered";
}

const DEFAULT_FILTERS: Filters = {
  keyword: "",
  subjects: [],
  difficulties: [],
  errorReasons: [],
  masteryRange: "all",
};

export default function Library() {
  const questions = useQuestionStore((s) => s.questions);
  const removeQuestion = useQuestionStore((s) => s.removeQuestion);
  const removeMany = useQuestionStore((s) => s.removeMany);

  const [view, setView] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<SortKey>("newest");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailQ, setDetailQ] = useState<Question | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportWithAns, setExportWithAns] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  const filtered = useMemo(() => {
    let list = questions.filter((q) => {
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const hit =
          q.content.toLowerCase().includes(kw) ||
          q.knowledgePoint.toLowerCase().includes(kw) ||
          q.chapter.toLowerCase().includes(kw) ||
          q.tags.some((t) => t.toLowerCase().includes(kw));
        if (!hit) return false;
      }
      if (filters.subjects.length && !filters.subjects.includes(q.subject)) return false;
      if (filters.difficulties.length && !filters.difficulties.includes(q.difficulty)) return false;
      if (filters.errorReasons.length && (!q.errorReason || !filters.errorReasons.includes(q.errorReason))) return false;
      if (filters.masteryRange === "weak" && q.mastery >= 30) return false;
      if (filters.masteryRange === "medium" && (q.mastery < 30 || q.mastery >= 80)) return false;
      if (filters.masteryRange === "mastered" && q.mastery < 80) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "newest":
          return +new Date(b.createdAt) - +new Date(a.createdAt);
        case "oldest":
          return +new Date(a.createdAt) - +new Date(b.createdAt);
        case "mastery-asc":
          return a.mastery - b.mastery;
        case "mastery-desc":
          return b.mastery - a.mastery;
      }
    });
    return list;
  }, [questions, filters, sort]);

  const activeFilterCount =
    filters.subjects.length +
    filters.difficulties.length +
    filters.errorReasons.length +
    (filters.masteryRange !== "all" ? 1 : 0);

  const toggleArray = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const onSelect = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((q) => q.id)));
    }
  };

  const onBulkDelete = () => {
    if (selected.size === 0) return;
    removeMany(Array.from(selected));
    showToast(`已删除 ${selected.size} 道题`);
    setSelected(new Set());
  };

  const onExport = () => {
    const ids = selected.size > 0 ? Array.from(selected) : filtered.map((q) => q.id);
    if (ids.length === 0) return;
    setExportOpen(true);
    // 这里仅生成可下载的 HTML 文本，作为"复习卷"导出
    setTimeout(() => {
      const qs = questions.filter((q) => ids.includes(q.id));
      const html = generateReviewPaperHTML(qs, exportWithAns);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `复习卷_${new Date().toISOString().slice(0, 10)}${exportWithAns ? "_含答案" : ""}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }, 100);
  };

  const onSingleDelete = (id: string) => {
    removeQuestion(id);
    showToast("已删除");
    if (detailQ?.id === id) setDetailQ(null);
  };

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* 搜索 */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              placeholder="搜索题干、知识点、章节、标签…"
              className="w-full h-11 pl-10 pr-4 rounded-full bg-white/70 border border-ink-100 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-400/15 transition-all"
            />
          </div>

          {/* 排序 */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-11 pl-4 pr-9 rounded-full bg-white/70 border border-ink-100 text-sm font-medium outline-none focus:border-brand-400 appearance-none cursor-pointer"
            >
              <option value="newest">最新优先</option>
              <option value="oldest">最早优先</option>
              <option value="mastery-asc">掌握度升序</option>
              <option value="mastery-desc">掌握度降序</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>

          {/* 筛选 */}
          <Button
            variant={showFilter ? "primary" : "secondary"}
            size="md"
            onClick={() => setShowFilter((v) => !v)}
          >
            <Filter size={14} />
            筛选
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-300 text-ink-900 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* 视图切换 */}
          <div className="inline-flex p-1 bg-white/70 border border-ink-100 rounded-full">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "w-9 h-9 grid place-items-center rounded-full transition-colors",
                view === "grid" ? "bg-brand-500 text-white" : "text-ink-400 hover:text-ink-700",
              )}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "w-9 h-9 grid place-items-center rounded-full transition-colors",
                view === "list" ? "bg-brand-500 text-white" : "text-ink-400 hover:text-ink-700",
              )}
            >
              <ListIcon size={16} />
            </button>
          </div>
        </div>

        {/* 展开筛选区 */}
        {showFilter && (
          <div className="mt-4 pt-4 border-t border-ink-100/60 space-y-4 animate-[fadeUp_0.25s_ease-out]">
            {/* 学科 */}
            <FilterRow label="学科">
              {SUBJECTS.map((s) => (
                <Chip
                  key={s.code}
                  active={filters.subjects.includes(s.code)}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      subjects: toggleArray(filters.subjects, s.code),
                    })
                  }
                  color={s.color}
                >
                  {s.name}
                </Chip>
              ))}
            </FilterRow>

            {/* 难度 */}
            <FilterRow label="难度">
              {(Object.keys(DIFFICULTY_META) as unknown as Difficulty[]).map((d) => (
                <Chip
                  key={d}
                  active={filters.difficulties.includes(d)}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      difficulties: toggleArray(filters.difficulties, d),
                    })
                  }
                >
                  {DIFFICULTY_META[d].name}
                </Chip>
              ))}
            </FilterRow>

            {/* 掌握度 */}
            <FilterRow label="掌握度">
              {([
                { v: "all", l: "全部" },
                { v: "weak", l: "薄弱 (<30%)" },
                { v: "medium", l: "巩固中 (30-80%)" },
                { v: "mastered", l: "已掌握 (≥80%)" },
              ] as const).map((m) => (
                <Chip
                  key={m.v}
                  active={filters.masteryRange === m.v}
                  onClick={() => setFilters({ ...filters, masteryRange: m.v })}
                >
                  {m.l}
                </Chip>
              ))}
            </FilterRow>

            {/* 错因 */}
            <FilterRow label="错因">
              {ERROR_REASONS.map((r) => (
                <Chip
                  key={r}
                  active={filters.errorReasons.includes(r)}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      errorReasons: toggleArray(filters.errorReasons, r),
                    })
                  }
                >
                  {r}
                </Chip>
              ))}
            </FilterRow>

            {activeFilterCount > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                >
                  <X size={14} /> 清空筛选
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 批量操作栏 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-ink-500">
          共 <b className="num-display text-ink-800">{filtered.length}</b> 道题
          {selected.size > 0 && (
            <span className="ml-3 text-brand-600">
              已选 <b className="num-display">{selected.size}</b> 道
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            {selected.size === filtered.length && filtered.length > 0 ? "取消全选" : "全选"}
          </Button>
          <Button variant="secondary" size="sm" onClick={onExport} disabled={filtered.length === 0}>
            <Download size={14} />
            {selected.size > 0 ? `导出选中 (${selected.size})` : "导出全部"}
          </Button>
          {selected.size > 0 && (
            <Button variant="danger" size="sm" onClick={onBulkDelete}>
              <Trash2 size={14} /> 删除选中
            </Button>
          )}
        </div>
      </div>

      {/* 错题列表 */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<LibraryIcon size={28} />}
            title={questions.length === 0 ? "错题库还是空的" : "没有符合条件的题目"}
            description={
              questions.length === 0
                ? "上传第一份作业，开始建立你的个人错题库"
                : "尝试调整筛选条件，或清空所有筛选"
            }
            action={
              questions.length === 0 ? (
                <Link to="/upload">
                  <Button><RotateCcw size={14} /> 去上传</Button>
                </Link>
              ) : (
                <Button variant="secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  清空筛选
                </Button>
              )
            }
          />
        </Card>
      ) : view === "grid" ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              selected={selected.has(q.id)}
              onSelect={onSelect}
              onClick={(q) => setDetailQ(q)}
              onDelete={onSingleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((q) => (
            <QuestionListItem
              key={q.id}
              question={q}
              selected={selected.has(q.id)}
              onSelect={onSelect}
              onClick={(q) => setDetailQ(q)}
            />
          ))}
        </div>
      )}

      {/* 详情抽屉 */}
      <Drawer
        open={!!detailQ}
        onClose={() => setDetailQ(null)}
        title={detailQ ? `${getSubject(detailQ.subject).name} · ${QUESTION_TYPE_META[detailQ.questionType].name}` : ""}
      >
        {detailQ && <QuestionDetail question={detailQ} onDelete={onSingleDelete} />}
      </Drawer>

      {/* 导出确认 */}
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="导出复习卷"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setExportOpen(false)}>关闭</Button>
            <Button onClick={() => { setExportOpen(false); showToast("复习卷已下载"); }}>
              <Download size={14} /> 再次下载
            </Button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-mint-100 text-mint-600 grid place-items-center mb-3">
            <CheckCircle2 size={28} />
          </div>
          <p className="text-sm text-ink-700">
            复习卷已生成并开始下载，
            {exportWithAns ? "包含" : "不包含"}参考答案。
          </p>
          <label className="mt-4 inline-flex items-center gap-2 text-xs text-ink-500 cursor-pointer">
            <input
              type="checkbox"
              checked={exportWithAns}
              onChange={(e) => setExportWithAns(e.target.checked)}
              className="w-4 h-4 rounded border-ink-300 text-brand-500 focus:ring-brand-400"
            />
            包含参考答案与解析
          </label>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-ink-900 text-white text-sm shadow-glow animate-[fadeUp_0.3s_ease-out]">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={14} className="text-mint-400" />
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs font-bold text-ink-500 w-12 pt-1.5 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 flex-wrap flex-1">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border transition-all",
        active
          ? "bg-brand-500 text-white border-brand-500 shadow-glow-brand"
          : "bg-white/60 text-ink-600 border-ink-100 hover:bg-white",
      )}
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: active ? "#fff" : color }}
        />
      )}
      {children}
    </button>
  );
}

function QuestionDetail({
  question,
  onDelete,
}: {
  question: Question;
  onDelete: (id: string) => void;
}) {
  const meta = getSubject(question.subject);
  const typeMeta = QUESTION_TYPE_META[question.questionType];
  const created = new Date(question.createdAt);
  const last = question.lastReviewAt ? new Date(question.lastReviewAt) : null;
  const accuracy = question.reviewCount > 0
    ? Math.round((question.correctCount / question.reviewCount) * 100)
    : null;

  return (
    <div className="space-y-5">
      {/* 元信息 */}
      <div className="flex items-center gap-2 flex-wrap">
        <SubjectBadge subject={question.subject} size="md" />
        <Tag tone="brand" size="sm">{question.knowledgePoint}</Tag>
        <Tag tone="ink" size="sm">{typeMeta.name}</Tag>
        <DifficultyBadge level={question.difficulty} />
      </div>

      {/* 章节 */}
      <div className="text-xs text-ink-500">
        <span className="font-bold">章节：</span>
        {question.chapter}
      </div>

      {/* 题干 */}
      <div>
        <div className="text-xs font-bold text-ink-500 mb-2">题目</div>
        <div className="glass-strong rounded-2xl p-4 text-sm text-ink-800 leading-relaxed whitespace-pre-wrap">
          {question.content}
        </div>
        {question.options && (
          <div className="mt-2 space-y-1.5">
            {question.options.map((opt, i) => (
              <div
                key={i}
                className={cn(
                  "text-sm px-3 py-2 rounded-xl",
                  opt.startsWith(question.answer + ".") || opt === question.answer
                    ? "bg-mint-50 text-mint-700 font-bold"
                    : "bg-white/50 text-ink-700",
                )}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 答案 */}
      <div>
        <div className="text-xs font-bold text-ink-500 mb-2">参考答案</div>
        <div className="bg-gradient-to-br from-mint-50 to-white rounded-2xl p-4 text-mint-700 font-bold">
          {question.answer}
        </div>
      </div>

      {/* 解析 */}
      {question.analysis && (
        <div>
          <div className="text-xs font-bold text-ink-500 mb-2">解析</div>
          <div className="text-sm text-ink-700 leading-relaxed">{question.analysis}</div>
        </div>
      )}

      {/* 错因标签 */}
      {question.errorReason && (
        <div>
          <div className="text-xs font-bold text-ink-500 mb-2">错因</div>
          <Tag tone="rose">{question.errorReason}</Tag>
        </div>
      )}

      {/* 自定义标签 */}
      {question.tags.length > 0 && (
        <div>
          <div className="text-xs font-bold text-ink-500 mb-2">标签</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {question.tags.map((t) => (
              <Tag key={t} tone="ink" size="sm">{t}</Tag>
            ))}
          </div>
        </div>
      )}

      {/* 掌握度与复习历史 */}
      <div className="glass-strong rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink-600">掌握度</span>
          <span className="num-display text-sm font-bold text-brand-600">{question.mastery}%</span>
        </div>
        <MasteryBar value={question.mastery} showLabel={false} />
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-ink-100/60">
          <Stat label="复习次数" value={question.reviewCount} />
          <Stat label="答对次数" value={question.correctCount} />
          <Stat
            label="正确率"
            value={accuracy !== null ? `${accuracy}%` : "—"}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 text-[11px] text-ink-400">
          <div>归档：{created.toLocaleDateString("zh-CN")}</div>
          <div>
            最近复习：
            {last ? last.toLocaleDateString("zh-CN") : "未复习"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link to="/review" className="flex-1">
          <Button variant="primary" className="w-full">
            <RotateCcw size={14} /> 立即复习
          </Button>
        </Link>
        <Button variant="danger" onClick={() => onDelete(question.id)}>
          <Trash2 size={14} /> 删除
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="num-display text-base font-bold text-ink-900">{value}</div>
      <div className="text-[11px] text-ink-400 mt-0.5">{label}</div>
    </div>
  );
}

// 生成可下载的复习卷 HTML
function generateReviewPaperHTML(questions: Question[], withAnswer: boolean): string {
  const items = questions
    .map(
      (q, i) => `
      <div class="q">
        <div class="q-head">
          <span class="q-no">${i + 1}.</span>
          <span class="q-meta">${getSubject(q.subject).name} · ${QUESTION_TYPE_META[q.questionType].name} · ${q.knowledgePoint}</span>
        </div>
        <div class="q-content">${q.content}</div>
        ${q.options ? `<div class="q-opts">${q.options.map((o) => `<div>${o}</div>`).join("")}</div>` : ""}
        ${
          withAnswer
            ? `<div class="q-ans"><b>答案：</b>${q.answer}</div>${q.analysis ? `<div class="q-ana"><b>解析：</b>${q.analysis}</div>` : ""}`
            : `<div class="q-ans-empty">答：__________________</div>`
        }
      </div>`,
    )
    .join("");

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>错题复习卷 - ${new Date().toLocaleDateString("zh-CN")}</title>
<style>
  body { font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif; padding: 40px; color: #162033; line-height: 1.8; }
  h1 { text-align: center; margin-bottom: 8px; }
  .sub { text-align: center; color: #5d6b84; margin-bottom: 32px; font-size: 14px; }
  .q { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px dashed #dde4f0; }
  .q-head { display: flex; gap: 12px; align-items: baseline; margin-bottom: 8px; }
  .q-no { font-weight: 700; font-size: 16px; }
  .q-meta { color: #5d6b84; font-size: 12px; }
  .q-content { font-size: 15px; }
  .q-opts { margin-top: 8px; padding-left: 16px; font-size: 14px; }
  .q-ans { margin-top: 8px; padding: 8px 12px; background: #effbf8; border-radius: 8px; color: #1c726f; font-size: 14px; }
  .q-ana { margin-top: 4px; color: #5d6b84; font-size: 13px; }
  .q-ans-empty { margin-top: 12px; color: #b7c2d8; }
</style>
</head>
<body>
  <h1>错题复习卷</h1>
  <div class="sub">共 ${questions.length} 题 · ${new Date().toLocaleDateString("zh-CN")} · ${withAnswer ? "含答案" : "无答案"}</div>
  ${items}
</body>
</html>`;
}
