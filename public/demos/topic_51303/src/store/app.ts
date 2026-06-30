import { create } from "zustand";
import type { AlertSettings, MetricKey } from "@/types";

interface ToastState {
  message: string;
  visible: boolean;
  id: number;
}

interface AppState {
  /** 当前选中菇棚 */
  currentShedId: string;
  setCurrentShed: (id: string) => void;

  /** 历史曲线关注的指标 */
  activeMetric: MetricKey;
  setActiveMetric: (m: MetricKey) => void;

  /** 告警设置（本地缓存便于即时反馈） */
  alertSettings: AlertSettings | null;
  setAlertSettings: (s: AlertSettings) => void;

  /** Toast */
  toast: ToastState;
  showToast: (msg: string) => void;
  hideToast: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useAppStore = create<AppState>((set) => ({
  currentShedId: "S001",
  setCurrentShed: (id) => set({ currentShedId: id }),

  activeMetric: "temperature",
  setActiveMetric: (m) => set({ activeMetric: m }),

  alertSettings: null,
  setAlertSettings: (s) => set({ alertSettings: s }),

  toast: { message: "", visible: false, id: 0 },
  showToast: (msg) => {
    if (toastTimer) clearTimeout(toastTimer);
    set((s) => ({ toast: { message: msg, visible: true, id: s.toast.id + 1 } }));
    toastTimer = setTimeout(() => {
      set((s) => ({ toast: { ...s.toast, visible: false } }));
    }, 2200);
  },
  hideToast: () => set((s) => ({ toast: { ...s.toast, visible: false } })),
}));
