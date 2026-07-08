import { create } from "zustand";

interface Toast {
  id: number;
  message: string;
  type: "success" | "warning" | "error" | "info";
}

interface AppState {
  // 适老化模式
  elderMode: boolean;
  toggleElderMode: () => void;

  // Toast 通知
  toasts: Toast[];
  showToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: number) => void;

  // 语音播报开关
  voiceEnabled: boolean;
  toggleVoice: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 适老化模式
  elderMode: false,
  toggleElderMode: () => {
    const next = !get().elderMode;
    set({ elderMode: next });
    // 同步到 html 标签，用于 CSS 适老化样式
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("elder-mode", next);
    }
    get().showToast(next ? "已开启适老化大字体模式" : "已关闭适老化模式", "success");
  },

  // Toast 通知
  toasts: [],
  showToast: (message, type = "success") => {
    const id = Date.now() + Math.random();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    // 3 秒后自动移除
    setTimeout(() => {
      get().removeToast(id);
    }, 3000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  // 语音播报
  voiceEnabled: true,
  toggleVoice: () => {
    const next = !get().voiceEnabled;
    set({ voiceEnabled: next });
    get().showToast(next ? "语音播报已开启" : "语音播报已关闭", "info");
  },
}));
