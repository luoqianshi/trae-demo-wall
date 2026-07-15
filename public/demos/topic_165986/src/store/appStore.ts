import { create } from "zustand";
import type { Entry, State, EntryKind, PaperType, FontType, AudioType, BackgroundMusic } from "@/types";
import { kindTemplates } from "@/data/examples";

export interface CustomKind {
  id: string;
  key: string;
  label: string;
  defaultTitle: string;
  content: string;
}

interface AppState {
  entries: Entry[];
  state: State | null;
  currentKind: EntryKind;
  paper: PaperType;
  font: FontType;
  fontSize: number;
  audio: AudioType;
  bgMusic: BackgroundMusic;
  customKinds: CustomKind[];
  darkMode: boolean;
  selectedEntryId: string | null;
  setEntries: (entries: Entry[]) => void;
  setState: (state: State) => void;
  setCurrentKind: (kind: EntryKind) => void;
  setPaper: (paper: PaperType) => void;
  setFont: (font: FontType) => void;
  setFontSize: (size: number) => void;
  setAudio: (audio: AudioType) => void;
  setBgMusic: (bgMusic: BackgroundMusic) => void;
  addCustomKind: (kind: Omit<CustomKind, "id">) => void;
  updateCustomKind: (id: string, updates: Partial<CustomKind>) => void;
  deleteCustomKind: (id: string) => void;
  toggleDarkMode: () => void;
  setSelectedEntryId: (id: string | null) => void;
  getAllKinds: () => Array<{ key: string; label: string; defaultTitle: string; content: string }>;
}

const loadCustomKinds = (): CustomKind[] => {
  try {
    const saved = localStorage.getItem("serious-writing-custom-kinds");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveCustomKinds = (kinds: CustomKind[]) => {
  localStorage.setItem("serious-writing-custom-kinds", JSON.stringify(kinds));
};

const loadDarkMode = (): boolean => {
  try {
    const saved = localStorage.getItem("serious-writing-dark-mode");
    return saved === "true";
  } catch {
    return false;
  }
};

const saveDarkMode = (dark: boolean) => {
  localStorage.setItem("serious-writing-dark-mode", dark ? "true" : "false");
};

export const useAppStore = create<AppState>((set, get) => ({
  entries: [],
  state: null,
  currentKind: "free",
  paper: "white",
  font: "system",
  fontSize: 19,
  audio: "off",
  bgMusic: "none",
  customKinds: loadCustomKinds(),
  darkMode: loadDarkMode(),
  selectedEntryId: null,

  setEntries: (entries) => set({ entries }),
  setState: (state) => set({ state }),

  setCurrentKind: (kind) => set({ currentKind: kind }),
  setPaper: (paper) => set({ paper }),
  setFont: (font) => set({ font }),
  setFontSize: (size) => set({ fontSize: size }),
  setAudio: (audio) => set({ audio }),
  setBgMusic: (bgMusic) => set({ bgMusic }),

  addCustomKind: (kind) => {
    const newKind: CustomKind = { ...kind, id: Date.now().toString(36) };
    const customKinds = [...get().customKinds, newKind];
    saveCustomKinds(customKinds);
    set({ customKinds });
  },

  updateCustomKind: (id, updates) => {
    const customKinds = get().customKinds.map(k => k.id === id ? { ...k, ...updates } : k);
    saveCustomKinds(customKinds);
    set({ customKinds });
  },

  deleteCustomKind: (id) => {
    const customKinds = get().customKinds.filter(k => k.id !== id);
    saveCustomKinds(customKinds);
    set({ customKinds });
  },

  toggleDarkMode: () => {
    const newDarkMode = !get().darkMode;
    saveDarkMode(newDarkMode);
    set({ darkMode: newDarkMode });
  },

  setSelectedEntryId: (id) => set({ selectedEntryId: id }),

  getAllKinds: () => {
    const presetKinds = Object.entries(kindTemplates).map(([key, value]) => ({
      key,
      label: value.label,
      defaultTitle: value.defaultTitle,
      content: value.content,
    }));
    const customKinds = get().customKinds.map(k => ({
      key: k.key,
      label: k.label,
      defaultTitle: k.defaultTitle,
      content: k.content,
    }));
    return [...presetKinds, ...customKinds];
  },
}));
