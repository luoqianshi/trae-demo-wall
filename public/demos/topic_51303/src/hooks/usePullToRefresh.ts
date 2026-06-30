import { useCallback, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  /** 触发刷新的下拉阈值 */
  threshold?: number;
  enabled?: boolean;
}

/**
 * 下拉刷新 hook：监听容器 touch 事件，下拉超过阈值触发刷新。
 * 返回绑定到滚动容器的 props 与刷新状态。
 */
export function usePullToRefresh({ onRefresh, threshold = 60, enabled = true }: UsePullToRefreshOptions) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const currentPull = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const el = containerRef.current;
      if (!el || el.scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      currentPull.current = 0;
    },
    [enabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || refreshing) return;
      const el = containerRef.current;
      if (!el || el.scrollTop > 0) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        // 阻尼
        currentPull.current = Math.min(delta * 0.5, 90);
        if (currentPull.current > 8) {
          setPulling(true);
        }
      }
    },
    [enabled, refreshing]
  );

  const onTouchEnd = useCallback(async () => {
    if (!enabled || !pulling) return;
    if (currentPull.current >= threshold) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPulling(false);
    currentPull.current = 0;
  }, [enabled, pulling, threshold, onRefresh]);

  const pullDistance = pulling ? currentPull.current : refreshing ? 40 : 0;

  return {
    containerRef,
    pulling,
    refreshing,
    pullDistance,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
