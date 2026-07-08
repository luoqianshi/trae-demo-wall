'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const hasError = Boolean(error);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-text"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'min-h-[100px] w-full rounded-xl border bg-surface/60 px-4 py-3 text-sm text-text placeholder:text-text-muted/60',
            'transition-all duration-200 focus-ring resize-y',
            'hover:border-text-muted/40',
            hasError
              ? 'border-error/60 focus-visible:ring-error/40'
              : 'border-border focus:border-accent',
            className,
          )}
          aria-invalid={hasError}
          {...props}
        />
        {error ? (
          <p className="text-xs text-error">{error}</p>
        ) : hint ? (
          <p className="text-xs text-text-muted">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
