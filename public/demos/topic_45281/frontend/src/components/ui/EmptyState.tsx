import React from "react";
import { Package, Search, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** 空状态占位组件 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Package,
  title,
  description,
  action,
  className = "",
}) => (
  <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
    <Icon className="text-muted-foreground/60 mb-4" size={48} />
    <h3 className="text-base font-medium text-foreground mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
    )}
    {action}
  </div>
);

/** 搜索无结果空状态 */
export const NoSearchResults: React.FC<{ searchTerm: string; onClear: () => void }> = ({
  searchTerm,
  onClear,
}) => (
  <EmptyState
    icon={Search}
    title={`未找到"${searchTerm}"相关结果`}
    description="请尝试调整搜索关键词"
    action={
      <button
        onClick={onClear}
        className="text-sm text-primary hover:underline"
      >
        清除搜索
      </button>
    }
  />
);
