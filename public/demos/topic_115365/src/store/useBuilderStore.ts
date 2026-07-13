import { create } from "zustand";
import type { Control, ProjectConfig, ControlType, ChatMessage } from "@/types";
import { DEFAULT_PROJECT_CONFIG, createControl } from "@/constants/controls";
import { parseAiInput } from "@/utils/aiParser";

interface BuilderState {
  // 项目配置
  config: ProjectConfig;
  setConfig: (patch: Partial<ProjectConfig>) => void;

  // 控件列表
  controls: Control[];
  selectedId: string | null;
  addControl: (type: ControlType) => void;
  addControls: (controls: Control[]) => void;
  removeControl: (id: string) => void;
  selectControl: (id: string | null) => void;
  updateControl: (id: string, patch: Partial<Control>) => void;
  reorderControls: (from: number, to: number) => void;
  clearControls: () => void;

  // AI 对话
  aiOpen: boolean;
  chatMessages: ChatMessage[];
  setAiOpen: (open: boolean) => void;
  sendAiMessage: (text: string) => void;

  // 预览模式
  previewMode: boolean;
  setPreviewMode: (v: boolean) => void;

  // 代码预览
  generatedOpen: boolean;
  setGeneratedOpen: (v: boolean) => void;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  config: { ...DEFAULT_PROJECT_CONFIG },
  setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),

  controls: [],
  selectedId: null,

  addControl: (type) =>
    set((s) => {
      const ctrl = createControl(type, s.controls.length + 1);
      return { controls: [...s.controls, ctrl], selectedId: ctrl.id };
    }),

  addControls: (controls) =>
    set((s) => ({ controls: [...s.controls, ...controls], selectedId: controls[0]?.id ?? s.selectedId })),

  removeControl: (id) =>
    set((s) => {
      const controls = s.controls.filter((c) => c.id !== id);
      const selectedId = s.selectedId === id ? null : s.selectedId;
      return { controls, selectedId };
    }),

  selectControl: (id) => set({ selectedId: id }),

  updateControl: (id, patch) =>
    set((s) => ({
      controls: s.controls.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  reorderControls: (from, to) =>
    set((s) => {
      const arr = [...s.controls];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return { controls: arr };
    }),

  clearControls: () => set({ controls: [], selectedId: null }),

  aiOpen: false,
  chatMessages: [
    {
      role: "assistant",
      content: "你好，我是砌码 AI 助手。用一句话描述你想做的页面，例如：「做一个用户管理，包含用户名、手机号、年龄、状态、注册时间、头像附件」。",
    },
  ],
  setAiOpen: (open) => set({ aiOpen: open }),

  sendAiMessage: (text) => {
    const { controls } = get();
    const newControls = parseAiInput(text, controls.length);
    const reply =
      newControls.length > 0
        ? `已解析出 ${newControls.length} 个字段并生成控件：${newControls.map((c) => c.label).join("、")}。你可以在画布上继续调整属性。`
        : "未识别到有效字段关键词，请尝试描述包含「名称、手机、年龄、状态、日期、附件」等关键词的需求。";
    set((s) => ({
      chatMessages: [...s.chatMessages, { role: "user", content: text }, { role: "assistant", content: reply }],
      controls: [...s.controls, ...newControls],
      selectedId: newControls[0]?.id ?? s.selectedId,
    }));
  },

  previewMode: false,
  setPreviewMode: (v) => set({ previewMode: v }),

  generatedOpen: false,
  setGeneratedOpen: (v) => set({ generatedOpen: v }),
}));
