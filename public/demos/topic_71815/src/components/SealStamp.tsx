import { cn } from '@/lib/utils';

interface SealStampProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rotate?: number;
  animate?: boolean;
}

const SIZE_MAP = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

export default function SealStamp({
  text = '诵',
  size = 'md',
  className,
  rotate = -3,
  animate = false,
}: SealStampProps) {
  return (
    <span
      className={cn(
        'seal inline-flex items-center justify-center font-display rounded-sm select-none',
        SIZE_MAP[size],
        animate && 'animate-seal-stamp',
        className
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      {text}
    </span>
  );
}
