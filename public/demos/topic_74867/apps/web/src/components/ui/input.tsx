'use client';

import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  /** Wrapper class for layout control. */
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      wrapperClassName,
      label,
      error,
      hint,
      icon: Icon,
      iconRight: IconRight,
      id,
      type = 'text',
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const hasError = Boolean(error);

    return (
      <div className={cn('w-full space-y-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              'h-11 w-full rounded-xl border bg-surface/60 px-4 text-sm text-text placeholder:text-text-muted/60',
              'transition-all duration-200 focus-ring',
              'hover:border-text-muted/40',
              Icon && 'pl-10',
              IconRight && 'pr-10',
              hasError
                ? 'border-error/60 focus-visible:ring-error/40'
                : 'border-border focus:border-accent',
              className,
            )}
            aria-invalid={hasError}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {IconRight && (
            <IconRight
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-error">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-text-muted">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
