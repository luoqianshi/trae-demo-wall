import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WrongCharCardProps {
  char: string;
  correct: string;
  count?: number;
  taskTitle?: string;
  mastered?: boolean;
  onMarkMastered?: () => void;
  className?: string;
  animate?: boolean;
}

export default function WrongCharCard({
  char,
  correct,
  count = 1,
  taskTitle,
  mastered = false,
  onMarkMastered,
  className,
  animate = false,
}: WrongCharCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col items-center justify-center bg-paper border-2 border-cinnabar/60 rounded-sm shadow-seal p-3 transition-all',
        animate && 'animate-seal-stamp',
        mastered && 'opacity-50 border-celadon/50',
        className
      )}
      style={{ width: 88, height: 96 }}
    >
      {/* 错字 */}
      <div
        className={cn(
          'font-display text-3xl leading-none line-through decoration-cinnabar decoration-2',
          mastered ? 'text-ink-mute' : 'text-cinnabar'
        )}
      >
        {char}
      </div>
      {/* 正确字 */}
      <div className="font-display text-2xl leading-none text-ink mt-1">{correct}</div>
      {count > 1 && (
        <div className="absolute top-1 right-1 text-[9px] font-mono text-ink-mute tabular">
          ×{count}
        </div>
      )}
      {onMarkMastered && !mastered && (
        <button
          onClick={onMarkMastered}
          className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-celadon text-paper flex items-center justify-center shadow-float opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          title="标记已掌握"
        >
          <Check size={12} strokeWidth={3} />
        </button>
      )}
      {taskTitle && (
        <div className="absolute -bottom-5 left-0 right-0 text-center text-[9px] text-ink-mute truncate px-1">
          {taskTitle}
        </div>
      )}
    </div>
  );
}
