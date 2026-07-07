import { Link } from "react-router-dom";
import { Trash2, Calendar, FileText, Hash } from "lucide-react";
import type { ErrorQuestion } from "@/types/question";
import SubjectTag from "./SubjectTag";
import DifficultyStars from "./DifficultyStars";
import { cn } from "@/lib/utils";

interface Props {
  question: ErrorQuestion;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  index?: number;
}

export default function QuestionCard({
  question,
  selectable = false,
  selected = false,
  onSelect,
  onDelete,
  index = 0,
}: Props) {
  const date = new Date(question.createdAt);
  const dateStr = isNaN(date.getTime())
    ? "未知日期"
    : `${date.getMonth() + 1}月${date.getDate()}日`;

  return (
    <article
      className={cn(
        "card-paper group relative overflow-hidden p-5 hover:-translate-y-1 hover:shadow-card",
        selected && "ring-2 ring-highlight ring-offset-2 ring-offset-paper-100"
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* 顶部:学科 + 难度 + 操作 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SubjectTag subject={question.subject} variant="solid" />
          <DifficultyStars level={question.difficulty} />
        </div>
        <div className="flex items-center gap-1">
          {selectable && (
            <button
              onClick={onSelect}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md border transition-all",
                selected
                  ? "border-highlight-deep bg-highlight text-ink-800"
                  : "border-paper-400 bg-paper-50 text-transparent hover:border-ink-400"
              )}
              aria-label={selected ? "取消选择" : "选择"}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex h-6 w-6 items-center justify-center rounded-md text-ink-300 transition-all hover:bg-coral-soft/30 hover:text-coral-deep"
              aria-label="删除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 题干 */}
      <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-ink-700">
        {question.questionText}
      </p>

      {/* 错因笔记 */}
      {question.note && (
        <div className="mb-3 rounded-lg border-l-2 border-coral bg-coral-soft/15 px-3 py-1.5">
          <p className="line-clamp-2 text-xs leading-relaxed text-coral-deep">
            <span className="font-semibold">错因 · </span>
            {question.note}
          </p>
        </div>
      )}

      {/* 知识点 */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {question.knowledgePoints.map((kp) => (
          <span
            key={kp}
            className="inline-flex items-center gap-1 rounded-md bg-paper-200/70 px-2 py-0.5 text-[11px] font-medium text-ink-500"
          >
            <Hash className="h-2.5 w-2.5" />
            {kp}
          </span>
        ))}
      </div>

      {/* 底部:来源 + 日期 */}
      <div className="flex items-center justify-between border-t border-paper-200/70 pt-3 text-[11px] text-ink-400">
        {question.source ? (
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {question.source}
          </span>
        ) : (
          <span />
        )}
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {dateStr}
        </span>
      </div>

      {/* 装饰:右上角折角 */}
      <div className="pointer-events-none absolute right-0 top-0 h-8 w-8 bg-gradient-to-bl from-paper-200/60 to-transparent" />
    </article>
  );
}
