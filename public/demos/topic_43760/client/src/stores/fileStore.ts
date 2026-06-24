import { create } from 'zustand';
import type { FileNode } from '../types';

interface FileState {
  rootPath: string;
  fileTree: FileNode[];
  selectedFile: string | null;
  fileContent: string | null;
  isLoading: boolean;
  expandedDirs: Set<string>;
  
  // Actions
  setRootPath: (path: string) => void;
  fetchFileTree: () => Promise<void>;
  selectFile: (path: string) => Promise<void>;
  toggleDir: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

// Mock data for now
const mockFileTree: FileNode[] = [
  {
    name: 'src',
    path: 'src',
    type: 'directory',
    children: [
      {
        name: 'components',
        path: 'src/components',
        type: 'directory',
        children: [
          { name: 'Button.tsx', path: 'src/components/Button.tsx', type: 'file' },
          { name: 'Input.tsx', path: 'src/components/Input.tsx', type: 'file' },
        ],
      },
      { name: 'App.tsx', path: 'src/App.tsx', type: 'file' },
      { name: 'main.tsx', path: 'src/main.tsx', type: 'file' },
    ],
  },
  {
    name: 'package.json',
    path: 'package.json',
    type: 'file',
  },
  {
    name: 'README.md',
    path: 'README.md',
    type: 'file',
  },
];

export const useFileStore = create<FileState>((set, get) => ({
  rootPath: '.',
  fileTree: [],
  selectedFile: null,
  fileContent: null,
  isLoading: false,
  expandedDirs: new Set(['src', 'src/components']),

  setRootPath: (path) => {
    set({ rootPath: path });
    get().fetchFileTree();
  },

  fetchFileTree: async () => {
    set({ isLoading: true });
    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ fileTree: mockFileTree, isLoading: false });
  },

  selectFile: async (path) => {
    set({ selectedFile: path, isLoading: true });
    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({
      fileContent: `// ${path}\n\nexport default function Component() {\n  return <div>Hello World</div>;\n}`,
      isLoading: false,
    });
  },

  toggleDir: (path) => {
    set((state) => {
      const expandedDirs = new Set(state.expandedDirs);
      if (expandedDirs.has(path)) {
        expandedDirs.delete(path);
      } else {
        expandedDirs.add(path);
      }
      return { expandedDirs };
    });
  },

  expandAll: () => {
    // TODO: Implement
  },

  collapseAll: () => {
    set({ expandedDirs: new Set() });
  },
}));
