import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SoftButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantStyles = {
  primary: 'bg-corgi-yellow text-text-primary hover:bg-corgi-orange hover:text-white shadow-soft',
  secondary: 'bg-warm-light text-text-primary hover:bg-corgi-yellow shadow-soft border-2 border-corgi-yellow/30',
  accent: 'bg-corgi-orange text-white hover:bg-corgi-dark shadow-soft',
  ghost: 'bg-transparent text-text-secondary hover:bg-corgi-yellow/20',
  danger: 'bg-berry-pink text-white hover:bg-berry-rose shadow-soft',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-2xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
};

export default function SoftButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: SoftButtonProps) {
  return (
    <button
      className={cn(
        'btn-press font-bold transition-all duration-200 flex items-center justify-center gap-2',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
