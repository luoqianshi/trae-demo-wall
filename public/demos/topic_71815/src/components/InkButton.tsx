import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
}

const VARIANT = {
  primary:
    'bg-cinnabar text-paper border border-cinnabar-deep hover:bg-cinnabar-deep active:shadow-press',
  dark: 'bg-ink text-paper border border-ink hover:bg-ink-soft active:shadow-press',
  outline:
    'bg-transparent text-ink border border-ink/30 hover:border-ink/60 hover:bg-ink/5 active:shadow-press',
  ghost: 'bg-transparent text-ink-mute border border-transparent hover:text-ink hover:bg-ink/5',
};

const SIZE = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
};

export default function InkButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: InkButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-sans tracking-wide rounded-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none',
        VARIANT[variant],
        SIZE[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
