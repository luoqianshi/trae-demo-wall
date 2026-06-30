import type { ReactNode } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Loader2 } from "lucide-react";

interface ScrollAreaProps {
  children: ReactNode;
  /** 下拉刷新回调，提供则启用下拉刷新 */
  onRefresh?: () => Promise<void> | void;
  /** 底部留白，避免被 Tab 遮挡 */
  bottomPadding?: number;
  className?: string;
}

/** 可滚动内容区，支持下拉刷新与顶部刷新提示 */
export default function ScrollArea({ children, onRefresh, bottomPadding = 84, className }: ScrollAreaProps) {
  const { containerRef, pulling, refreshing, pullDistance, touchHandlers } = usePullToRefresh({
    onRefresh: onRefresh ?? (async () => {}),
    enabled: !!onRefresh,
  });

  return (
    <div
      ref={containerRef}
      className={`no-scrollbar relative flex-1 overflow-y-auto ${className ?? ""}`}
      style={{ WebkitOverflowScrolling: "touch" }}
      {...touchHandlers}
    >
      {/* 下拉刷新提示 */}
      {onRefresh ? (
        <div
          className="flex items-center justify-center gap-2 overflow-hidden"
          style={{
            height: pulling || refreshing ? pullDistance : 0,
            transition: pulling ? "none" : "height 200ms ease",
            fontSize: 13,
            color: "var(--color-text-muted)",
          }}
        >
          {refreshing ? (
            <>
              <Loader2 size={16} className="animate-spin-slow" />
              <span>正在更新…</span>
            </>
          ) : (
            <span>{pullDistance > 50 ? "松开刷新" : "下拉刷新"}</span>
          )}
        </div>
      ) : null}

      <div style={{ paddingBottom: bottomPadding }}>{children}</div>
    </div>
  );
}
