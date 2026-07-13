import { create } from 'zustand';

export type ToolType = 'pen' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line';

interface WhiteboardStore {
  currentTool: ToolType;
  toolColor: string;
  toolSize: number;
  isDrawing: boolean;
  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setDrawing: (isDrawing: boolean) => void;
  clearCanvas: () => void;
}

export const useWhiteboardStore = create<WhiteboardStore>((set) => ({
  currentTool: 'pen',
  toolColor: '#6366f1',
  toolSize: 3,
  isDrawing: false,
  setTool: (tool) => set({ currentTool: tool }),
  setColor: (color) => set({ toolColor: color }),
  setSize: (size) => set({ toolSize: size }),
  setDrawing: (isDrawing) => set({ isDrawing }),
  clearCanvas: () => set({}),
}));