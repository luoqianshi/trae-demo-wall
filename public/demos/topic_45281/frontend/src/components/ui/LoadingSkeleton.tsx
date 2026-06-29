import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

/** Enhanced card skeleton with shimmer animation */
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`motion-card bg-card rounded-xl border border-border p-5 ${className}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="h-3 motion-skeleton rounded-full w-20" />
      <div className="w-8 h-8 motion-skeleton rounded-xl" />
    </div>
    <div className="h-7 motion-skeleton rounded-lg w-24 mb-2" />
    <div className="h-3 motion-skeleton rounded-full w-16" />
  </div>
);

/** Table row skeleton */
export const TableSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 5, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="motion-row flex items-center gap-4 p-3 bg-card rounded-xl border border-border"
        style={{ animationDelay: `${Math.min(i * 24, 120)}ms` }}
      >
        <div className="h-3 motion-skeleton rounded-full flex-1" style={{ maxWidth: `${25 + (i % 4) * 8}%` }} />
        <div className="h-3 motion-skeleton rounded-full flex-1" style={{ maxWidth: `${20 + (i % 3) * 10}%` }} />
        <div className="h-3 motion-skeleton rounded-full flex-1" style={{ maxWidth: `${30 + (i % 2) * 12}%` }} />
        <div className="h-6 motion-skeleton rounded-full w-14" />
      </div>
    ))}
  </div>
);

/** General loading skeleton with varied widths */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 5, className = "" }) => (
  <TableSkeleton rows={rows} className={className} />
);

/** Full-page loading with animated dots */
export const FullPageLoader: React.FC<{ message?: string }> = ({ message = "正在加载系统数据..." }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="w-full max-w-md space-y-3">
      <div className="h-4 motion-skeleton rounded-full w-1/3 mx-auto" />
      <div className="h-12 motion-skeleton rounded-xl" />
      <div className="h-12 motion-skeleton rounded-xl" />
      <div className="h-12 motion-skeleton rounded-xl" />
    </div>
    <p className="text-sm text-on-surface-variant">{message}</p>
  </div>
);

/** Inline spinner loader */
export const InlineLoader: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = "" }) => (
  <Loader2 className={`animate-spin text-primary ${className}`} size={size} />
);

export default LoadingSkeleton;
