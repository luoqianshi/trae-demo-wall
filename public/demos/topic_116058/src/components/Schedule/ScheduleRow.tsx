import { GripVertical, Trash2, Zap, CheckCircle2, Circle } from 'lucide-react';
import type { ScheduleItem } from '@/types';
import BellToggle from './BellToggle';
import { useScheduleStore } from '@/store/scheduleStore';
import { cn } from '@/lib/utils';

interface ScheduleRowProps {
  item: ScheduleItem;
  onToggleReminder: (id: string) => void;
  onRemove: (id: string) => void;
}

const typeConfig = {
  course: { label: '课程', color: 'bg-corgi-orange/15 text-corgi-dark border-corgi-orange/30', icon: '📚' },
  homework: { label: '作业', color: 'bg-mint-fresh/15 text-mint-deep border-mint-fresh/30', icon: '📝' },
  rest: { label: '休息', color: 'bg-berry-pink/15 text-berry-rose border-berry-pink/30', icon: '☕' },
  entertainment: { label: '娱乐', color: 'bg-blue-100 text-blue-600 border-blue-200', icon: '🎮' },
  custom: { label: '其他', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: '📌' },
};

export default function ScheduleRow({ item, onToggleReminder, onRemove }: ScheduleRowProps) {
  const { toggleComplete } = useScheduleStore();
  const config = typeConfig[item.type];
  const isCompleted = item.completed;
  const isHidden = item.buffTime === -1; // 假期模式隐藏标记

  if (isHidden) {
    // 隐藏的日程显示为占位状态
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b border-corgi-yellow/15 opacity-40">
        <div className="w-[22px] h-[22px] rounded-full border-2 border-dashed border-text-light" />
        <div className="cursor-not-allowed text-text-light">
          <GripVertical size={18} />
        </div>
        <div className="flex flex-col items-center min-w-[60px]">
          <span className="text-sm font-bold text-text-light line-through">{item.startTime}</span>
          <span className="text-xs text-text-light line-through">{item.endTime}</span>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full border bg-gray-100 text-gray-400 border-gray-200">
          🚫 已隐藏
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-text-light line-through truncate block">{item.title}</span>
          <span className="text-xs text-text-light">假期模式 - 课程已隐藏</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-3 border-b border-corgi-yellow/15 transition-all hover:bg-warm-cream/50',
        item.isExamSprint && 'bg-corgi-orange/5',
        isCompleted && 'opacity-50'
      )}
    >
      {/* 完成切换 */}
      <button
        onClick={() => toggleComplete(item.id)}
        className="btn-press shrink-0"
        title={isCompleted ? '标记未完成' : '标记完成'}
      >
        {isCompleted ? (
          <CheckCircle2 size={22} className="text-mint-deep" fill="currentColor" />
        ) : (
          <Circle size={22} className="text-text-light hover:text-mint-deep transition-colors" />
        )}
      </button>

      {/* 拖拽手柄 */}
      <div className="cursor-grab text-text-light hover:text-corgi-orange transition-colors active:cursor-grabbing">
        <GripVertical size={18} />
      </div>

      {/* 时间 */}
      <div className={cn('flex flex-col items-center min-w-[60px]', isCompleted && 'line-through')}>
        <span className="text-sm font-bold text-text-primary">{item.startTime}</span>
        <span className="text-xs text-text-light">{item.endTime}</span>
      </div>

      {/* 类型标签 */}
      <span className={cn('text-xs font-bold px-2 py-1 rounded-full border', config.color)}>
        {config.icon} {config.label}
      </span>

      {/* 标题 */}
      <div className="flex-1 min-w-0">
        <span className={cn('text-sm font-bold text-text-primary truncate block', isCompleted && 'line-through')}>
          {item.title}
        </span>
        {item.buffTime > 0 && (
          <span className="text-xs text-text-light flex items-center gap-1">
            <Zap size={10} />
            缓冲 {item.buffTime}分钟
          </span>
        )}
        {item.buffTime === 0 && (
          <span className="text-xs text-text-light">无缓冲</span>
        )}
        {item.isExamSprint && (
          <span className="text-xs text-corgi-orange font-bold">🔥 考前突击</span>
        )}
      </div>

      {/* 铃铛开关 */}
      <BellToggle isOn={item.reminder} onToggle={() => onToggleReminder(item.id)} />

      {/* 删除 */}
      <button
        onClick={() => onRemove(item.id)}
        className="btn-press w-8 h-8 rounded-full flex items-center justify-center text-text-light hover:text-berry-rose hover:bg-berry-pink/10 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
