import { Link } from "react-router-dom";
import { Clock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Question } from "@/types";
import { getSubject } from "@/data/subjects";
import { QUESTION_TYPE_META } from "@/types";
import { SubjectBadge } from "./SubjectBadge";
import { DifficultyBadge } from "./DifficultyBadge";
import { MasteryBar } from "./MasteryBar";
import { Tag } from "./Tag";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: Question;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onClick?: (q: Question) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function QuestionCard({
  question,
  selected,
  onSelect,
  onClick,
  onDelete,
  className,
}: QuestionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = getSubject(question.subject);
  const typeMeta = QUESTION_TYPE_META[question.questionType];
  const created = new Date(question.createdAt);
  const today = new Date();
  const daysAgo = Math.floor((today.getTime() - created.getTime()) / (24 * 3600 * 1000));

  return (
    <div
      className={cn(
        "relative glass rounded-3xl p-5 pl-7 transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-glow cursor-pointer group",
        selected && "ring-2 ring-brand-400",
        className,
      )}
      onClick={() => onClick?.(question)}
    >
      {/* 学科色条 */}
      <span className="subj-bar" style={{ background: meta.color }} />

      {/* 顶部行：选择框 + 学科 + 题型 + 难度 + 菜单 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {onSelect && (
            <input
              type="checkbox"
              checked={!!selected}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onSelect(question.id, e.target.checked)}
              className="w-4 h-4 rounded border-ink-300 text-brand-500 focus:ring-brand-400 focus:ring-offset-0"
            />
          )}
          <SubjectBadge subject={question.subject} size="sm" showName={false} />
          <Tag tone="ink" size="xs">{typeMeta.short}</Tag>
          <DifficultyBadge level={question.difficulty} />
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="w-8 h-8 grid place-items-center rounded-full text-ink-400 hover:bg-ink-100/60 hover:text-ink-700 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 top-9 z-20 w-36 glass-strong rounded-2xl p-1.5 shadow-glow">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.(question);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-ink-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  <Pencil size={14} /> 查看 / 编辑
                </button>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(question.id);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 size={14} /> 删除
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 题干 */}
      <p className="text-[14px] leading-relaxed text-ink-800 line-clamp-2 mb-3">
        {question.content}
      </p>

      {/* 标签 */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <Tag tone="brand" size="xs">{question.knowledgePoint}</Tag>
        {question.errorReason && (
          <Tag tone="rose" size="xs">错因：{question.errorReason}</Tag>
        )}
      </div>

      {/* 底部：掌握度 + 时间 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 max-w-[160px]">
          <MasteryBar value={question.mastery} size="sm" showLabel={false} />
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-400">
          <Clock size={11} />
          {daysAgo === 0 ? "今天" : daysAgo === 1 ? "昨天" : `${daysAgo}天前`}
        </span>
      </div>
    </div>
  );
}

interface QuestionListItemProps extends QuestionCardProps {}

export function QuestionListItem({
  question,
  selected,
  onSelect,
  onClick,
  className,
}: QuestionListItemProps) {
  const meta = getSubject(question.subject);
  const typeMeta = QUESTION_TYPE_META[question.questionType];
  const created = new Date(question.createdAt);
  const today = new Date();
  const daysAgo = Math.floor((today.getTime() - created.getTime()) / (24 * 3600 * 1000));

  return (
    <div
      className={cn(
        "relative glass rounded-2xl p-4 pl-6 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-glow flex items-center gap-4",
        selected && "ring-2 ring-brand-400",
        className,
      )}
      onClick={() => onClick?.(question)}
    >
      <span className="subj-bar" style={{ background: meta.color }} />

      {onSelect && (
        <input
          type="checkbox"
          checked={!!selected}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onSelect(question.id, e.target.checked)}
          className="w-4 h-4 rounded border-ink-300 text-brand-500 focus:ring-brand-400 focus:ring-offset-0 shrink-0"
        />
      )}

      <SubjectBadge subject={question.subject} size="sm" showName={false} />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink-800 line-clamp-1">{question.content}</p>
        <div className="flex items-center gap-2 mt-1">
          <Tag tone="brand" size="xs">{question.knowledgePoint}</Tag>
          <Tag tone="ink" size="xs">{typeMeta.short}</Tag>
        </div>
      </div>

      <div className="w-32 shrink-0 hidden sm:block">
        <MasteryBar value={question.mastery} size="sm" showLabel={false} />
      </div>

      <span className="text-[11px] text-ink-400 shrink-0 hidden md:inline">
        {daysAgo === 0 ? "今天" : `${daysAgo}天前`}
      </span>
    </div>
  );
}

// 用于在复习中心等场景快速访问 Link 包装
export function QuestionCardLink({
  question,
  to,
}: {
  question: Question;
  to: string;
}) {
  return (
    <Link to={to}>
      <QuestionCard question={question} />
    </Link>
  );
}
