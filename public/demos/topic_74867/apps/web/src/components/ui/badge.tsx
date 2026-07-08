import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border bg-surface text-text-muted',
        accent: 'border-accent/30 bg-accent/10 text-accent',
        success: 'border-success/30 bg-success/10 text-success',
        warning: 'border-warning/30 bg-warning/10 text-warning',
        error: 'border-error/30 bg-error/10 text-error',
        outline: 'border-border bg-transparent text-text-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional color override as a hex string (used for emotion tags). */
  color?: string;
}

export function Badge({ className, variant, color, style, children, ...props }: BadgeProps) {
  const customStyle: React.CSSProperties = { ...style };
  if (color) {
    customStyle.borderColor = `${color}4d`;
    customStyle.backgroundColor = `${color}1a`;
    customStyle.color = color;
  }
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      style={customStyle}
      {...props}
    >
      {children}
    </span>
  );
}

export { badgeVariants };
