'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-white hover:bg-accent-hover shadow-sm shadow-accent/20',
        secondary:
          'bg-surface text-text border border-border hover:bg-surface-hover',
        ghost: 'text-text-muted hover:text-text hover:bg-surface-hover',
        outline:
          'border border-border bg-transparent text-text hover:bg-surface-hover hover:border-text-muted',
        danger: 'bg-error text-white hover:bg-error/90 shadow-sm shadow-error/20',
      },
      size: {
        sm: 'h-9 px-3.5 text-xs',
        md: 'h-11 px-5 text-sm',
        lg: 'h-13 px-7 text-base py-3.5',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
