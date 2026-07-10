'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTasks, Task, TaskType } from '../../hooks/useTasks';
import { useRecordsContext } from '../../contexts/RecordsContext';
import { usePageView } from '../../hooks/usePageView';
import Skeleton from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useSnowball } from '@/contexts/SnowballContext';
import { SCORE_VALUES } from '@/lib/snowball-score';
import SnowballCharacter from '../components/SnowballCharacter';
import { getStoryText } from '@/lib/snowball-story-text';
import CreateTaskModal, { CreateTaskFormData } from '../components/CreateTaskModal';
import { getImportanceStars, getDueDateLabel, QUADRANT_CONFIG, DEFAULT_THRESHOLDS, Thresholds, UrgencyLevel } from '@/lib/quadrant-utils';
import { DotCheckbox } from '../components/DotCheckbox';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CelebrationDialog } from '../components/CelebrationDialog';

interface PartialGoal {
  id: string;
  title: string;
  progress?: number;
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'completed' | 'archived';
  created_at?: string;
  updated_at?: string;
}

type ViewMode = 'goal' | 'list' | 'kanban' | 'quadrant';

interface StatusChangeOptions {
  taskTitle?: string;
  parentId?: string;
}

const SCORE_TEXT_MAP: Record<string, string> = {
  quick: '+2分 ⚡',
  normal: '+5分 ⚡',
  habit: '+5分 🔥',
  big: '+10分 🎯',
  subtask: '+5分 ✅',
};

const URGENCY_BADGE_CONFIG: Record<string, { icon: string; label: string; bg: string; text: string }> = {
  critical: { icon: '🔥', label: '极高', bg: 'bg-red-50', text: 'text-red-600' },
  high: { icon: '⚡', label: '高', bg: 'bg-red-50', text: 'text-red-500' },
  medium: { icon: '📅', label: '中', bg: 'bg-orange-50', text: 'text-orange-500' },
  low: { icon: '⏰', label: '低', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  none: { icon: '🗓️', label: '无', bg: 'bg-gray-50', text: 'text-gray-500' },
};

const TYPE_ACCENT_MAP: Record<string, string> = {
  quick: 'border-l-yellow-300',
  normal: 'border-l-[#FFB6C1]',
  big: 'border-l-[#87CEEB]',
  habit: 'border-l-[#90EE90]',
};

function getScoreText(taskType: TaskType, isSubtask: boolean): string {
  if (isSubtask) return SCORE_TEXT_MAP.subtask;
  return SCORE_TEXT_MAP[taskType] || SCORE_TEXT_MAP.normal;
}

function useTaskAnimation(isInitiallyCompleted: boolean) {
  const [isChecked, setIsChecked] = useState(isInitiallyCompleted);
  const [showFloatText, setShowFloatText] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    setIsChecked(isInitiallyCompleted);
  }, [isInitiallyCompleted]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const playCompletion = useCallback((onComplete: () => void) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsChecked(true);

    if (cardRef.current) {
      cardRef.current.classList.remove('task-card-glow');
      void cardRef.current.offsetWidth;
      cardRef.current.classList.add('task-card-glow');
    }

    if (floatRef.current) {
      floatRef.current.classList.remove('float-text-show');
      void floatRef.current.offsetWidth;
      floatRef.current.classList.add('float-text-show');
    }

    setShowFloatText(true);

    timeoutRef.current = setTimeout(() => {
      if (cardRef.current) cardRef.current.classList.remove('task-card-glow');
      if (floatRef.current) floatRef.current.classList.remove('float-text-show');
      setShowFloatText(false);
      isAnimatingRef.current = false;
      onComplete();
    }, 1500);
  }, []);

  return { isChecked, showFloatText, cardRef, floatRef, playCompletion, isAnimatingRef };
}

function UrgencyBadge({ urgency, size = 'sm', showLabel = true }: {
  urgency?: UrgencyLevel | null;
  size?: 'xs' | 'sm';
  showLabel?: boolean;
}) {
  if (!urgency) return null;
  const cfg = URGENCY_BADGE_CONFIG[urgency];
  if (!cfg) return null;
  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  return (
    <span className={`${sizeClass} rounded-full font-medium ${cfg.bg} ${cfg.text} inline-flex items-center whitespace-nowrap`}>
      {cfg.icon}{showLabel ? ` ${cfg.label}` : ''}
    </span>
  );
}

function FloatScoreText({ text, floatRef }: { text: string; floatRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={floatRef}
      className="absolute right-2 top-[10px] bg-gradient-to-br from-[#FFB6C1] to-[#87CEEB] text-white px-2.5 py-0.5 rounded-full text-xs font-semibold opacity-0 pointer-events-none z-10"
    >
      {text}
    </div>
  );
}

function QuadrantTaskCard({ task, onStatusChange }: {
  task: Task;
  onStatusChange: (id: string, status: Task['status'], options?: StatusChangeOptions) => void;
}) {
  const { isChecked, cardRef, floatRef, playCompletion, isAnimatingRef } = useTaskAnimation(task.status === 'completed');
  const scoreText = getScoreText(task.type, false);

  const handleClick = () => {
    if (isAnimatingRef.current) return;
    if (!isChecked) {
      playCompletion(() => onStatusChange(task.id, 'completed', { taskTitle: task.title }));
    } else {
      onStatusChange(task.id, 'pending', { taskTitle: task.title });
    }
  };

  return (
    <div ref={cardRef} className="bg-white/80 rounded-2xl p-3 hover:bg-white transition-all duration-200 hover:shadow-sm relative">
      <div className="flex items-center gap-2">
        <DotCheckbox checked={isChecked} onChange={handleClick} size={16} />
        <span className={`text-sm font-medium ${isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</span>
      </div>
      <div className="flex items-center gap-2 mt-1.5 ml-6">
        {task.importance && <span className="text-xs tracking-tight">{getImportanceStars(task.importance)}</span>}
        <UrgencyBadge urgency={task.urgency} size="xs" showLabel={false} />
      </div>
      <FloatScoreText text={scoreText} floatRef={floatRef} />
    </div>
  );
}

function SubtaskItem({ st, parentId, onStatusChange }: {
  st: Task;
  parentId: string;
  onStatusChange: (id: string, status: Task['status'], options?: StatusChangeOptions) => void;
}) {
  const stCompleted = st.status === 'completed';
  const { isChecked, cardRef, floatRef, playCompletion, isAnimatingRef } = useTaskAnimation(stCompleted);
  const scoreText = getScoreText(st.type, true);

  const handleComplete = () => {
    if (isAnimatingRef.current) return;
    if (!stCompleted) {
      playCompletion(() => onStatusChange(st.id, 'completed', { taskTitle: st.title, parentId }));
    } else {
      onStatusChange(st.id, 'pending', { taskTitle: st.title, parentId });
    }
  };

  return (
    <div
      ref={cardRef}
      className={`flex items-start gap-2.5 py-2 px-3 rounded-xl transition-all duration-200 relative ${stCompleted ? 'bg-gray-50/50' : 'hover:bg-[#FFF8F0]'}`}
    >
      <DotCheckbox checked={isChecked} onChange={handleComplete} size={16} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${isChecked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{st.title}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {st.importance && <span className="text-[10px]">{getImportanceStars(st.importance)}</span>}
          <UrgencyBadge urgency={st.urgency} size="xs" showLabel={false} />
          {st.due_date && <span className="text-[10px] text-gray-400">{getDueDateLabel(st.due_date)}</span>}
          {st.quadrant && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              st.quadrant === 1 ? 'bg-red-50 text-red-500' :
              st.quadrant === 2 ? 'bg-blue-50 text-blue-500' :
              st.quadrant === 3 ? 'bg-orange-50 text-orange-500' :
              'bg-gray-100 text-gray-500'
            }`}>Q{st.quadrant}</span>
          )}
        </div>
      </div>
      <FloatScoreText text={scoreText} floatRef={floatRef} />
    </div>
  );
}

function TaskCard({ task, onStatusChange, onDelete, onEdit,
  onToggleBigTask, expandedBigTask, subtasks, onOpenSubtaskModal, onOpenSubtaskQuadrant, groupType,
}: {
  task: Task;
  onStatusChange: (id: string, status: Task['status'], options?: StatusChangeOptions) => void;
  onDelete: (id: string, taskTitle: string) => void;
  onEdit: (task: Task) => void;
  onToggleBigTask: (id: string) => void;
  expandedBigTask: string | null;
  subtasks: Task[];
  onOpenSubtaskModal: () => void;
  onOpenSubtaskQuadrant: () => void;
  groupType?: 'quick' | 'normal' | 'big' | 'habit';
}) {
  const [showActions, setShowActions] = useState(false);
  const isCompleted = task.status === 'completed';
  const { isChecked, showFloatText, cardRef, floatRef, playCompletion, isAnimatingRef } = useTaskAnimation(isCompleted);
  const accent = TYPE_ACCENT_MAP[groupType || 'normal'] || TYPE_ACCENT_MAP.normal;
  const scoreText = getScoreText(task.type, false);
  const dueLabel = getDueDateLabel(task.due_date);
  const isExpanded = expandedBigTask === task.id;

  const completedSubtasks = subtasks.filter(s => s.status === 'completed').length;
  const totalSubtasks = subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleCheckboxClick = () => {
    if (isAnimatingRef.current) return;
    if (!isCompleted) {
      playCompletion(() => onStatusChange(task.id, 'completed', { taskTitle: task.title }));
    } else {
      onStatusChange(task.id, 'pending', { taskTitle: task.title });
    }
  };

  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-2xl shadow-sm border border-white/80 border-l-4 ${accent} transition-all duration-200 ${isExpanded ? 'shadow-md p-4 pb-3' : 'hover:shadow-md p-4 hover:-translate-y-0.5'} relative overflow-hidden`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={`flex items-start gap-3 relative ${task.type === 'big' ? 'cursor-pointer select-none' : ''}`}
        onClick={task.type === 'big' ? () => onToggleBigTask(task.id) : undefined}
      >
        <div onClick={e => e.stopPropagation()}>
          <DotCheckbox checked={isChecked} onChange={handleCheckboxClick} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium leading-snug ${isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</p>
            {task.type === 'big' && (
              <span className={`text-xs flex-shrink-0 transition-all duration-300 ${isExpanded ? 'rotate-180 text-[#87CEEB]' : 'text-gray-300'}`}>▾</span>
            )}
            {task.type === 'habit' && task.current_streak !== undefined && task.current_streak > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-500 flex-shrink-0">🔥 {task.current_streak}天</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {task.type === 'habit' && task.best_streak !== undefined && task.best_streak > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-500">🏆 最高{task.best_streak}天</span>
            )}
            {task.importance && groupType !== 'quick' && groupType !== 'habit' && (
              <span className="text-xs tracking-tight">{getImportanceStars(task.importance)}</span>
            )}
            {task.urgency && groupType !== 'quick' && groupType !== 'habit' && (
              <UrgencyBadge urgency={task.urgency} />
            )}
            {dueLabel && <span className="text-xs text-gray-400">{dueLabel}</span>}
            {task.type === 'big' && totalSubtasks > 0 && (
              <span className="text-xs text-gray-400">{completedSubtasks}/{totalSubtasks} 子任务</span>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-1 transition-all duration-200 flex-shrink-0 ${showActions && !showFloatText ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-1'}`}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 text-gray-400 hover:text-[#87CEEB] hover:bg-[#87CEEB]/10 rounded-xl transition-all duration-200" title="编辑">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          {task.type === 'big' && (
            <button onClick={(e) => { e.stopPropagation(); onOpenSubtaskQuadrant(); }} className="p-1.5 text-gray-400 hover:text-[#87CEEB] hover:bg-[#87CEEB]/10 rounded-xl transition-all duration-200" title="子任务四象限">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDelete(task.id, task.title); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200" title="删除">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>

        <FloatScoreText text={scoreText} floatRef={floatRef} />
      </div>

      {task.type === 'big' && isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 overflow-hidden">
          {totalSubtasks > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <div className="flex-1 bg-gray-100 rounded-full h-1">
                  <div className="h-full bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] rounded-full transition-all duration-700 ease-out" style={{ width: `${subtaskProgress}%` }} />
                </div>
                <span className="text-xs text-gray-400 font-medium">{subtaskProgress}%</span>
              </div>
              {subtaskProgress === 100 && (
                <p className="text-xs text-[#87CEEB] mb-2 px-1">✨ 所有子任务已完成，点击完成长任务</p>
              )}
              <div className="space-y-1 mb-3">
                {subtasks
                  .map((st) => (
                    <SubtaskItem
                      key={st.id}
                      st={st}
                      parentId={task.id}
                      onStatusChange={onStatusChange}
                    />
                  ))}
              </div>
            </>
          )}
          <button onClick={onOpenSubtaskModal}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-[#87CEEB] hover:text-[#87CEEB] hover:bg-[#87CEEB]/5 transition-all duration-200 flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            添加子任务
          </button>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, goal, onStatusChange, onDelete, onEdit, showGoal = false, cardStyle = false, groupType }: {
  task: Task;
  goal?: PartialGoal;
  onStatusChange: (id: string, status: Task['status'], options?: StatusChangeOptions) => void;
  onDelete: (id: string, taskTitle: string) => void;
  onEdit: (task: Task) => void;
  showGoal?: boolean;
  cardStyle?: boolean;
  groupType?: 'quick' | 'normal' | 'big' | 'habit';
}) {
  const [showActions, setShowActions] = useState(false);
  const isCompleted = task.status === 'completed';
  const { isChecked, showFloatText, cardRef, floatRef, playCompletion, isAnimatingRef } = useTaskAnimation(isCompleted);
  const scoreText = getScoreText(task.type, false);
  const dueLabel = getDueDateLabel(task.due_date);

  const handleCheckboxClick = () => {
    if (isAnimatingRef.current) return;
    if (!isCompleted) {
      playCompletion(() => onStatusChange(task.id, 'completed', { taskTitle: task.title }));
    } else {
      onStatusChange(task.id, 'pending', { taskTitle: task.title });
    }
  };

  const content = (
    <div
      ref={cardRef}
      className="flex items-center gap-3 hover:bg-[#FFF8F0] transition-all duration-200 rounded-xl px-3 py-2.5 -mx-1 relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <DotCheckbox checked={isChecked} onChange={handleCheckboxClick} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {showGoal && goal && <span className="text-xs text-[#87CEEB]">🎯 {goal.title}</span>}
          {task.type === 'habit' && task.current_streak !== undefined && task.current_streak > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-500">🔥 {task.current_streak}天</span>
          )}
          {dueLabel && <span className="text-xs text-gray-400">{dueLabel}</span>}
        </div>
      </div>
      {task.importance && groupType !== 'quick' && groupType !== 'habit' && (
        <span className="text-xs flex-shrink-0 tracking-tight">{getImportanceStars(task.importance)}</span>
      )}
      {task.urgency && groupType !== 'quick' && groupType !== 'habit' && (
        <UrgencyBadge urgency={task.urgency} />
      )}
      <div className={`flex items-center gap-1 transition-all duration-200 flex-shrink-0 ${showActions && !showFloatText ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={() => onEdit(task)} className="p-1.5 text-gray-400 hover:text-[#87CEEB] hover:bg-[#87CEEB]/10 rounded-xl transition-all duration-200" title="编辑">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
        <button onClick={() => onDelete(task.id, task.title)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200" title="删除">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
      <FloatScoreText text={scoreText} floatRef={floatRef} />
    </div>
  );

  if (cardStyle) return <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-3">{content}</div>;
  return <div className="px-2">{content}</div>;
}

function KanbanColumn({ title, tasks, color, goals, onStatusChange, completed = false }: {
  title: string;
  tasks: Task[];
  color: string;
  goals: PartialGoal[];
  onStatusChange: (id: string, status: Task['status'], options?: StatusChangeOptions) => void;
  completed?: boolean;
}) {
  const { stage } = useSnowball();
  const colorMap: Record<string, { bg: string; dot: string }> = {
    gray: { bg: 'bg-gray-50/70', dot: 'bg-gray-400' },
    blue: { bg: 'bg-[#87CEEB]/10', dot: 'bg-[#87CEEB]' },
    green: { bg: 'bg-[#90EE90]/10', dot: 'bg-[#90EE90]' },
  };
  const cfg = colorMap[color] || colorMap.gray;
  return (
    <div className={`${cfg.bg} rounded-3xl p-4 border border-white/80 shadow-sm`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shadow-sm`}></div>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 text-gray-500 font-medium ml-auto">{tasks.length}</span>
      </div>
      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => <KanbanCard key={task.id} task={task} goals={goals} onStatusChange={onStatusChange} completed={completed} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center py-6">
          <SnowballCharacter size="sm" />
          <p className="text-gray-400 text-xs mt-2">{getStoryText(completed ? 'taskEmptyKanbanDone' : 'taskEmptyKanbanPending', stage).main}</p>
        </div>
      )}
    </div>
  );
}

function KanbanCard({ task, goals, onStatusChange, completed = false }: {
  task: Task;
  goals: PartialGoal[];
  onStatusChange: (id: string, status: Task['status'], options?: StatusChangeOptions) => void;
  completed?: boolean;
}) {
  const { isChecked, cardRef, floatRef, playCompletion, isAnimatingRef } = useTaskAnimation(completed);
  const scoreText = getScoreText(task.type, false);
  const goal = null;
  const dueLabel = getDueDateLabel(task.due_date);
  const typeColorMap: Record<string, { bg: string; border: string }> = {
    quick: { bg: 'bg-yellow-50/80', border: 'border-yellow-200/50' },
    normal: { bg: 'bg-white', border: 'border-gray-100' },
    big: { bg: 'bg-[#87CEEB]/5', border: 'border-[#87CEEB]/20' },
    habit: { bg: 'bg-[#90EE90]/5', border: 'border-[#90EE90]/20' },
  };
  const cfg = typeColorMap[task.type] || typeColorMap.normal;

  const handleCheckboxClick = () => {
    if (isAnimatingRef.current) return;
    if (!completed) {
      playCompletion(() => onStatusChange(task.id, 'completed', { taskTitle: task.title }));
    } else {
      onStatusChange(task.id, 'pending', { taskTitle: task.title });
    }
  };

  return (
    <div ref={cardRef} className={`${cfg.bg} border ${cfg.border} rounded-2xl p-3 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 relative`}>
      <div className="flex items-start gap-2 mb-2.5">
        <DotCheckbox checked={isChecked} onChange={handleCheckboxClick} size={16} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 ml-6 flex-wrap">
        {task.importance && <span className="text-xs">{getImportanceStars(task.importance)}</span>}
        <UrgencyBadge urgency={task.urgency} size="xs" showLabel={false} />
        {goal && <span className="text-xs text-gray-400 truncate max-w-[100px]">🎯 {goal.title}</span>}
        {task.type === 'habit' && task.current_streak !== undefined && task.current_streak > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-500">🔥{task.current_streak}天</span>
        )}
        {dueLabel && <span className="text-xs text-gray-400">{dueLabel}</span>}
      </div>
      <FloatScoreText text={scoreText} floatRef={floatRef} />
    </div>
  );
}

export default function TasksPage() {
  const { tasks, goals, loading, error, stats, createTask, updateTask, deleteTask, updateTaskStatusOptimistic, patchTask, fetchSubtasks, createSubtask, checkinHabit, fetchQuadrantData, fetchThresholds, updateThresholds } = useTasks();
  const { createRecord } = useRecordsContext();
  const { addScore, refreshStats, stage } = useSnowball();
  const { showToast } = useToast();
  usePageView('tasks');

  const [viewMode, setViewMode] = useState<ViewMode>('goal');
  const [expandedBigTask, setExpandedBigTask] = useState<string | null>(null);
  const [subtasksMap, setSubtasksMap] = useState<Record<string, Task[]>>({});
  const [quadrantData, setQuadrantData] = useState<any>(null);
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImportance, setEditImportance] = useState(1);
  const [editDueDate, setEditDueDate] = useState('');
  const [quickInput, setQuickInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; taskId: string; taskTitle: string }>({ isOpen: false, taskId: '', taskTitle: '' });
  const [celebration, setCelebration] = useState<{ isOpen: boolean; taskTitle: string; score: number }>({ isOpen: false, taskTitle: '', score: 0 });
  const [showSubtaskModal, setShowSubtaskModal] = useState<string | null>(null);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtaskImportance, setSubtaskImportance] = useState(3);
  const [subtaskDueDate, setSubtaskDueDate] = useState('');
  const [showSubtaskQuadrant, setShowSubtaskQuadrant] = useState<string | null>(null);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [tempThresholds, setTempThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);

  const loadSubtasks = useCallback(async (taskId: string) => {
    const data = await fetchSubtasks(taskId);
    if (data) {
      const pending = data.filter(st => st.status !== 'completed');
      const completed = data.filter(st => st.status === 'completed');
      setSubtasksMap(prev => ({ ...prev, [taskId]: [...pending, ...completed] }));
    }
  }, [fetchSubtasks]);

  const loadQuadrantData = useCallback(async () => {
    const data = await fetchQuadrantData('global');
    if (data) setQuadrantData(data);
  }, [fetchQuadrantData]);

  const loadThresholds = useCallback(async () => {
    const data = await fetchThresholds();
    if (data) {
      setThresholds(data.normal);
      setTempThresholds(data.normal);
    }
  }, [fetchThresholds]);

  useEffect(() => {
    if (viewMode === 'quadrant') loadQuadrantData();
    if (viewMode === 'quadrant') loadThresholds();
  }, [viewMode, loadQuadrantData, loadThresholds]);

  const handleToggleBigTask = useCallback((taskId: string) => {
    setExpandedBigTask(prev => {
      const next = prev === taskId ? null : taskId;
      if (next && !subtasksMap[next]) loadSubtasks(next);
      return next;
    });
  }, [subtasksMap, loadSubtasks]);

  const handleOpenSubtaskModal = useCallback((taskId: string) => {
    setShowSubtaskModal(taskId);
    setSubtaskInput('');
    setSubtaskImportance(3);
    setSubtaskDueDate('');
  }, []);

  const handleOpenSubtaskQuadrant = useCallback((taskId: string) => {
    setShowSubtaskQuadrant(taskId);
  }, []);

  const handleAddSubtask = useCallback(async () => {
    if (!showSubtaskModal || !subtaskInput.trim()) return;
    const result = await createSubtask(showSubtaskModal, {
      title: subtaskInput.trim(),
      importance: subtaskImportance,
      due_date: subtaskDueDate || undefined,
    });
    if (result) {
      setSubtaskInput('');
      setSubtaskImportance(3);
      setSubtaskDueDate('');
      setShowSubtaskModal(null);
      setSubtasksMap(prev => {
        const list = [...(prev[showSubtaskModal] || []), result];
        const pending = list.filter(st => st.status !== 'completed');
        const completed = list.filter(st => st.status === 'completed');
        return { ...prev, [showSubtaskModal]: [...pending, ...completed] };
      });
      showToast('子任务已添加', 'success');
    }
  }, [showSubtaskModal, subtaskInput, subtaskImportance, subtaskDueDate, createSubtask, showToast]);

  const handleEditSave = useCallback(async () => {
    if (!editingTask) return;
    const result = await patchTask(editingTask.id, {
      title: editTitle,
      description: editDescription,
      importance: editImportance,
      due_date: editDueDate || undefined,
    });
    if (result) {
      setEditingTask(null);
      showToast('任务已更新', 'success');
    }
  }, [editingTask, editTitle, editDescription, editImportance, editDueDate, patchTask, showToast]);

  const handleQuickAdd = useCallback(async () => {
    if (!quickInput.trim()) return;
    const result = await createTask({
      title: quickInput.trim(),
      type: 'quick',
    });
    if (result) {
      setQuickInput('');
      showToast('快速任务已添加', 'success');
    }
  }, [quickInput, createTask, showToast]);

  const handleStatusChange = useCallback(async (
    taskId: string,
    status: Task['status'],
    options?: StatusChangeOptions,
  ) => {
    const { taskTitle, parentId } = options || {};
    const task = tasks.find(t => t.id === taskId);
    const isSubtask = !!parentId;
    const finalTitle = taskTitle || task?.title || '任务';

    if (status !== 'completed') {
      await updateTaskStatusOptimistic(taskId, status, isSubtask);
      return;
    }

    if (!isSubtask && task && (task.type === 'normal' || task.type === 'quick' || task.type === 'big')) {
      const score = task.type === 'quick' ? SCORE_VALUES.TASK_QUICK_COMPLETED : task.type === 'big' ? SCORE_VALUES.BIG_TASK_COMPLETED : SCORE_VALUES.TASK_NORMAL_COMPLETED;
      const action = task.type === 'quick' ? 'TASK_QUICK_COMPLETED' as const : task.type === 'big' ? 'BIG_TASK_COMPLETED' as const : 'TASK_NORMAL_COMPLETED' as const;
      
      try {
        // 1. 先创建记录（只有成功后才继续）
        const recordResult = await createRecord({
          content: `完成了${task.type === 'big' ? '长任务' : '任务'}：${finalTitle}`,
          type: 'success',
          mood: 'proud',
          tags: ['任务完成'],
          related_task_id: taskId,
          skip_score: true,
        }, { skipCelebration: true });

        if (!recordResult) {
          throw new Error('Failed to create record');
        }

        // 2. 记录创建成功后，加分
        addScore(action);

        // 3. 标记任务为已完成（分数由后端 PATCH 自动写入）
        const updateSuccess = await updateTask(taskId, { status: 'completed' });
        if (!updateSuccess) {
          throw new Error('Failed to complete task');
        }

        // 4. 后端事件已写入，从服务端同步最终分数
        refreshStats();

        // 5. 全部成功后才显示庆祝
        setCelebration({ isOpen: true, taskTitle: finalTitle, score });
      } catch (error) {
        console.error('Error completing task:', error);
        // 如果任何一步失败，显示错误提示
        // 这里不需要回滚 addScore，因为我们只有成功才会 addScore
      }
      return;
    }

    if (isSubtask && parentId) {
      try {
        // 乐观更新 UI
        setSubtasksMap(prev => {
          const updated = { ...prev };
          if (updated[parentId]) {
            const list = updated[parentId].map(st =>
              st.id === taskId ? { ...st, status: 'completed' as const } : st
            );
            const pending = list.filter(st => st.status !== 'completed');
            const completed = list.filter(st => st.status === 'completed');
            updated[parentId] = [...pending, ...completed];
          }
          return updated;
        });

        // 实际更新数据库
        const result = await patchTask(taskId, { status: 'completed' });
        if (!result) {
          throw new Error('Failed to update subtask');
        }

        // 成功后才加分
        addScore('SUBTASK_COMPLETED');
        refreshStats();
      } catch (error) {
        console.error('Error completing subtask:', error);
        // 回滚乐观更新
        setSubtasksMap(prev => {
          const updated = { ...prev };
          if (updated[parentId]) {
            const list = updated[parentId].map(st =>
              st.id === taskId ? { ...st, status: 'pending' as const } : st
            );
            updated[parentId] = list;
          }
          return updated;
        });
      }
      return;
    }

    if (task?.type === 'habit') {
      const result = await checkinHabit(taskId);
      if (result) {
        addScore('HABIT_CHECKIN');
        refreshStats();
      }
      return;
    }

    await updateTaskStatusOptimistic(taskId, status, isSubtask);
  }, [tasks, addScore, createRecord, refreshStats, updateTask, updateTaskStatusOptimistic, checkinHabit, patchTask]);

  const handleDelete = useCallback((taskId: string, taskTitle: string) => {
    setConfirmDelete({ isOpen: true, taskId, taskTitle });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const { taskId } = confirmDelete;
    if (expandedBigTask === taskId) setExpandedBigTask(null);
    await deleteTask(taskId);
    setConfirmDelete({ isOpen: false, taskId: '', taskTitle: '' });
    showToast('任务已删除', 'success');
  }, [confirmDelete, expandedBigTask, deleteTask, showToast]);

  const handleCreateTask = useCallback(async (data: CreateTaskFormData) => {
    const result = await createTask({
      title: data.title,
      description: data.description,
      type: data.type,
      importance: data.type === 'quick' || data.type === 'habit' ? undefined : data.importance,
      due_date: data.due_date,
      frequency: data.frequency,
      target_count: data.target_count,
      reminder_time: data.reminder_time,
      thresholds: data.thresholds,
    });
    if (result) {
      setShowCreateModal(false);
      showToast('任务已创建', 'success');
    }
  }, [createTask, showToast]);

  const handleSaveThresholds = useCallback(async () => {
    const result = await updateThresholds('normal', tempThresholds);
    if (result) {
      setThresholds(tempThresholds);
      setShowThresholdModal(false);
      showToast('阈值已更新', 'success');
    }
  }, [tempThresholds, updateThresholds, showToast]);

  const groupedTasks = useMemo(() => {
    const topLevel = tasks.filter(t => !t.parent_id);
    const bigTasks = topLevel.filter(t => t.type === 'big');
    const habits = topLevel.filter(t => t.type === 'habit');
    const quickTasks = topLevel.filter(t => t.type === 'quick');
    const normalTasks = topLevel.filter(t => t.type === 'normal');

    const independent = normalTasks;
    const withGoal: any[] = [];

    return [
      { key: 'big', title: '长任务', icon: '🎯', tasks: bigTasks, type: 'big' as const, bg: 'bg-gradient-to-br from-[#87CEEB]/10 to-[#87CEEB]/5' },
      { key: 'habit', title: '习惯', icon: '🔄', tasks: habits, type: 'habit' as const, bg: 'bg-gradient-to-br from-[#90EE90]/10 to-[#90EE90]/5' },
      { key: 'quick', title: '快速任务', icon: '⚡', tasks: quickTasks, type: 'quick' as const, bg: 'bg-gradient-to-br from-yellow-50/80 to-yellow-50/40' },
      { key: 'normal', title: '普通任务', icon: '📋', tasks: [...withGoal, ...independent], type: 'normal' as const, bg: 'bg-gradient-to-br from-[#FFB6C1]/10 to-[#FFB6C1]/5' },
    ];
  }, [tasks]);

  const kanbanTasks = useMemo(() => {
    const topLevel = tasks.filter(t => !t.parent_id);
    return {
      pending: topLevel.filter(t => t.status === 'pending' || !t.status),
      completed: topLevel.filter(t => t.status === 'completed'),
    };
  }, [tasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] rounded-3xl p-6 mb-6 shadow-lg animate-pulse">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-7 w-20 bg-white/30 rounded-2xl mb-2"></div>
                <div className="h-4 w-36 bg-white/20 rounded-2xl"></div>
              </div>
              <div className="h-10 w-24 bg-white/30 rounded-2xl"></div>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
          </div>
        </div>
      </div>
    );
  }

  // 修复 H-15: 添加错误状态 UI，避免白屏或无反馈
  if (error) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] p-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">😵</div>
          <h1 className="text-xl font-bold text-[#FFB6C1] mb-2">加载任务失败</h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl px-6 py-2.5 font-semibold hover:opacity-90 transition-opacity"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-4 relative overflow-hidden">
      <div className="absolute top-[-40px] right-[-40px] w-56 h-56 bg-[#87CEEB]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-30px] left-[-30px] w-48 h-48 bg-[#FFB6C1]/10 rounded-full blur-3xl"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] rounded-3xl p-5 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-8 bg-white/80 rounded-full"></span>
                <h1 className="text-xl font-bold text-white">任务</h1>
              </div>
              <p className="text-white/80 text-sm mt-1 ml-4">完成小任务，雪球越滚越大 ⛄</p>
            </div>
            <div className="flex items-center gap-2">
              {stats && (
                <div className="text-white/90 text-xs mr-2">
                  待办 {stats.pending} · 已完成 {stats.completed}
                </div>
              )}
              <button onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                新建任务
              </button>
            </div>
          </div>
          <div className="flex gap-1 mt-4 p-1 bg-white/20 rounded-2xl">
            {(['goal', 'list', 'kanban', 'quadrant'] as ViewMode[]).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  viewMode === mode ? 'bg-white text-[#FFB6C1] shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}>
                {{ goal: '🎯 目标', list: '📋 列表', kanban: '📊 看板', quadrant: '🔥 四象限' }[mode]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 bg-white rounded-2xl px-3 py-2 shadow-sm border border-white/80">
            <span className="text-lg">⚡</span>
            <input
              type="text"
              value={quickInput}
              onChange={e => setQuickInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
              placeholder="快速添加任务..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            {quickInput.trim() && (
              <button onClick={handleQuickAdd}
                className="px-3 py-1 bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-xl text-xs font-medium hover:shadow-md transition-all duration-200">
                添加
              </button>
            )}
          </div>
        </div>

        {viewMode === 'goal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedTasks.map(group => (
              <div key={group.key} className={`${group.bg} rounded-3xl p-4 border border-white/80 shadow-sm`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center text-lg">{group.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 truncate">{group.title}</h3>
                    <span className="text-xs text-gray-400">{group.tasks.length} 个任务</span>
                  </div>
                </div>
                {group.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {group.tasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        onEdit={(t) => { setEditingTask(t); setEditTitle(t.title); setEditDescription(t.description || ''); setEditImportance(t.importance || 1); setEditDueDate(t.due_date || ''); }}
                        onToggleBigTask={handleToggleBigTask}
                        expandedBigTask={expandedBigTask}
                        subtasks={subtasksMap[task.id] || []}
                        onOpenSubtaskModal={() => handleOpenSubtaskModal(task.id)}
                        onOpenSubtaskQuadrant={() => handleOpenSubtaskQuadrant(task.id)}
                        groupType={group.type}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6">
                    <SnowballCharacter size="sm" />
                    <p className="text-gray-500 text-sm font-medium mt-2">{getStoryText(group.type === 'big' ? 'taskEmptyBig' : group.type === 'habit' ? 'taskEmptyHabit' : group.type === 'quick' ? 'taskEmptyQuick' : 'taskEmptyNormal', stage).main}</p>
                    <p className="text-gray-400 text-xs mt-1">{getStoryText(group.type === 'big' ? 'taskEmptyBig' : group.type === 'habit' ? 'taskEmptyHabit' : group.type === 'quick' ? 'taskEmptyQuick' : 'taskEmptyNormal', stage).sub}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

            {viewMode === 'list' && (
              <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-4">
                {tasks.length > 0 ? (
                <div className="space-y-1">
                  {tasks.map(task => {
                    const associatedGoal = null;
                    return (
                      <TaskRow
                        key={task.id}
                        task={task}
                        goal={associatedGoal}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        onEdit={(t) => { setEditingTask(t); setEditTitle(t.title); setEditDescription(t.description || ''); setEditImportance(t.importance || 1); setEditDueDate(t.due_date || ''); }}
                        showGoal
                        cardStyle
                        groupType={task.type as any}
                      />
                    );
                  })}
                </div>
                ) : (
                  <div className="flex flex-col items-center py-8">
                    <SnowballCharacter size="md" />
                    <p className="text-gray-500 text-sm font-medium mt-3">{getStoryText('taskEmptyList', stage).main}</p>
                    <p className="text-gray-400 text-xs mt-1">{getStoryText('taskEmptyList', stage).sub}</p>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'kanban' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KanbanColumn title="待办" tasks={kanbanTasks.pending} color="gray" goals={goals} onStatusChange={handleStatusChange} />
                <KanbanColumn title="已完成" tasks={kanbanTasks.completed} color="green" goals={goals} onStatusChange={handleStatusChange} completed />
              </div>
            )}

            {viewMode === 'quadrant' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-700">四象限视图</h2>
                  <button onClick={() => { setTempThresholds(thresholds); setShowThresholdModal(true); }}
                    className="text-xs text-[#87CEEB] hover:text-[#87CEEB]/80 font-medium transition-colors">
                    ⚙️ 阈值设置
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {([1, 2, 3, 4] as const).map(q => {
                    const cfg = QUADRANT_CONFIG[q];
                    const qTasks = quadrantData?.quadrants?.[q] || [];
                    return (
                      <div key={q} className={`${cfg.bgColor} rounded-3xl p-4 border ${cfg.borderColor}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{cfg.icon}</span>
                          <h3 className="text-sm font-semibold text-gray-700">Q{q} {cfg.label}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 text-gray-500 font-medium ml-auto">{qTasks.length}</span>
                        </div>
                        {qTasks.length > 0 ? (
                          <div className="space-y-2 overflow-y-auto max-h-52">
                            {qTasks.map((task: Task) => (
                              <QuadrantTaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-4">
                            <SnowballCharacter size="sm" />
                            <p className="text-gray-400 text-xs mt-1">{getStoryText('taskEmptyQuadrant', stage).main}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 bg-white rounded-3xl p-4 shadow-sm border border-white/80">
                  <h3 className="text-xs font-semibold text-gray-500 mb-3">紧急度阈值（天）</h3>
                  <div className="flex gap-2">
                    {Object.entries(URGENCY_BADGE_CONFIG).map(([key, cfg]) => (
                      <div key={key} className="flex-1 text-center p-2 rounded-xl bg-gray-50/50">
                        <span className="text-sm">{cfg.icon}</span>
                        <div className="mt-0.5 font-medium text-gray-600">{cfg.label}</div>
                        <div className="text-gray-400">{thresholds[key as keyof Thresholds]}天</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
      </div>

      {showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setEditingTask(null)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#87CEEB] to-[#87CEEB]/60 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">编辑任务</h2>
                <button onClick={() => setEditingTask(null)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">✕</button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">标题</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF8F0]/50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1] outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">描述</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2}
                  className="w-full px-3 py-2 bg-[#FFF8F0]/50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1] outline-none resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">重要性</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} onClick={() => setEditImportance(i)}
                      className={`w-8 h-8 rounded-xl text-sm transition-all duration-200 ${i <= editImportance ? 'bg-gradient-to-br from-[#FFB6C1] to-[#87CEEB] text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">截止日期</label>
                <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF8F0]/50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1] outline-none" />
              </div>
              <button onClick={handleEditSave}
                className="w-full py-2.5 bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl text-sm font-medium hover:shadow-lg transition-all duration-200">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubtaskModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowSubtaskModal(null)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#87CEEB] to-[#87CEEB]/60 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">添加子任务</h2>
                <button onClick={() => setShowSubtaskModal(null)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">✕</button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">标题</label>
                <input type="text" value={subtaskInput} onChange={e => setSubtaskInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="子任务标题..."
                  className="w-full px-3 py-2 bg-[#FFF8F0]/50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1] outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">重要性</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} onClick={() => setSubtaskImportance(i)}
                      className={`w-8 h-8 rounded-xl text-sm transition-all duration-200 ${i <= subtaskImportance ? 'bg-gradient-to-br from-[#FFB6C1] to-[#87CEEB] text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">截止日期</label>
                <input type="date" value={subtaskDueDate} onChange={e => setSubtaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF8F0]/50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1] outline-none" />
              </div>
              <button onClick={handleAddSubtask}
                className="w-full py-2.5 bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl text-sm font-medium hover:shadow-lg transition-all duration-200">
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubtaskQuadrant && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowSubtaskQuadrant(null)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#87CEEB] to-[#FFB6C1] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">子任务四象限</h2>
                <button onClick={() => setShowSubtaskQuadrant(null)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">✕</button>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {([1, 2, 3, 4] as const).map(q => {
                const cfg = QUADRANT_CONFIG[q];
                const qSubtasks = (subtasksMap[showSubtaskQuadrant] || []).filter(st => st.quadrant === q);
                return (
                  <div key={q} className={`${cfg.bgColor} rounded-2xl p-3 border ${cfg.borderColor}`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-sm">{cfg.icon}</span>
                      <span className="text-xs font-semibold text-gray-600">Q{q} {cfg.label}</span>
                    </div>
                    {qSubtasks.length > 0 ? (
                      <div className="space-y-1.5 overflow-y-auto max-h-52">
                        {qSubtasks.map(st => (
                          <QuadrantTaskCard key={st.id} task={st} onStatusChange={handleStatusChange} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-3">
                        <SnowballCharacter size="sm" />
                        <p className="text-gray-400 text-xs mt-1">这里还没有子任务~</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showThresholdModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowThresholdModal(false)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">阈值设置</h2>
                <button onClick={() => setShowThresholdModal(false)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">✕</button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {([
                { key: 'critical' as const, icon: '🔥', label: '极高紧急度' },
                { key: 'high' as const, icon: '⚡', label: '高紧急度' },
                { key: 'medium' as const, icon: '📅', label: '中紧急度' },
                { key: 'low' as const, icon: '⏰', label: '低紧急度' },
                { key: 'none' as const, icon: '🗓️', label: '无紧急度' },
              ]).map(item => (
                <div key={item.key} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                  <div className="flex items-center gap-1">
                    <input type="number" value={tempThresholds[item.key]} min={1}
                      onChange={e => setTempThresholds(prev => ({ ...prev, [item.key]: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-16 px-2 py-1 bg-[#FFF8F0]/50 border border-gray-200 rounded-xl text-sm text-center focus:ring-2 focus:ring-[#FFB6C1]/50 outline-none" />
                    <span className="text-xs text-gray-400">天</span>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100">
                <button onClick={handleSaveThresholds}
                  className="w-full py-2.5 bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl text-sm font-medium hover:shadow-lg transition-all duration-200">
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="确认删除"
        message={`确定要删除「${confirmDelete.taskTitle}」吗？此操作不可撤销。`}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, taskId: '', taskTitle: '' })}
      />

      <CelebrationDialog
        isOpen={celebration.isOpen}
        taskTitle={celebration.taskTitle}
        score={celebration.score}
        onClose={() => setCelebration({ isOpen: false, taskTitle: '', score: 0 })}
      />
    </div>
  );
}
