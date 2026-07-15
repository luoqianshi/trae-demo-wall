import { useEffect } from "react";

// 监听 Esc 键关闭抽屉/弹窗。enabled 默认开启，可在条件未满足时关掉。
export function useEscClose(onClose: () => void, enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, enabled]);
}
