import { cn } from '@/lib/utils';
import { TASK_TYPE_META, type TaskType } from '@/types';

interface TaskBadgeProps {
  type: TaskType;
  size?: 'sm' | 'md';
  className?: string;
}

export default function TaskBadge({ type, size = 'md', className }: TaskBadgeProps) {
  const meta = TASK_TYPE_META[type];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-sans rounded-sm border tracking-wide',
        meta.bgClass,
        meta.textClass,
        meta.borderClass,
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        className
      )}
    >
      <span
        className="inline-flex items-center justify-center font-display text-paper rounded-sm"
        style={{
          width: size === 'sm' ? 14 : 16,
          height: size === 'sm' ? 14 : 16,
          background: meta.color,
          fontSize: size === 'sm' ? 9 : 11,
        }}
      >
        {meta.seal}
      </span>
      {meta.label}
    </span>
  );
}
