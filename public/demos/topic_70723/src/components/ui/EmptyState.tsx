import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className,
      )}
    >
      {icon && (
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-50 to-mint-50 grid place-items-center text-brand-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="title-display text-lg font-bold text-ink-800 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-ink-500 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
