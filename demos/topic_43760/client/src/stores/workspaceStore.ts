import { create } from 'zustand';
import type { AgentMemory, AgentNativeSession, AgentTodo, FileNode, GitCommit, GitStatus } from '@/types';

const storedToken = localStorage.getItem('agent_access_token') ?? '';

function authHeaders(token: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface WorkspaceState {
  token: string;
  currentPath: string;
  files: FileNode[];
  gitStatus: GitStatus | null;
  gitCommits: GitCommit[];
  agentSessions: AgentNativeSession[];
  diffContent: string;
  diffFile: string | null;
  isLoading: boolean;
  error: string | null;
  memories: AgentMemory[];
  todos: AgentTodo[];

  setToken: (token: string) => void;
  setCurrentPath: (path: string) => void;
  fetchFiles: (path?: string) => Promise<void>;
  fetchGitStatus: () => Promise<void>;
  fetchGitLog: () => Promise<void>;
  fetchAgentSessions: (agent: string) => Promise<void>;
  fetchDiff: (file?: string) => Promise<void>;
  fetchStagedDiff: () => Promise<void>;

  // Agent memory & todo
  fetchAgentMemory: (agent: string) => Promise<void>;
  fetchAgentTodo: (agent: string) => Promise<void>;

  // File CRUD
  createFile: (path: string, isDirectory?: boolean) => Promise<boolean>;
  updateFile: (path: string, content: string) => Promise<boolean>;
  deleteFile: (path: string) => Promise<boolean>;
  renameFile: (oldPath: string, newPath: string) => Promise<boolean>;
  searchFiles: (query: string) => Promise<{ name: string; path: string; type: string }[]>;

  // Git operations
  gitAdd: (file: string) => Promise<boolean>;
  gitReset: (file: string) => Promise<boolean>;
  gitCommit: (message: string) => Promise<boolean>;
  gitCheckout: (target: string, createBranch?: boolean) => Promise<boolean>;
  fetchBranches: () => Promise<{ name: string; current: boolean }[]>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  token: storedToken,
  currentPath: '',
  files: [],
  gitStatus: null,
  gitCommits: [],
  agentSessions: [],
  diffContent: '',
  diffFile: null,
  isLoading: false,
  error: null,
  memories: [],
  todos: [],

  setToken: (token) => {
    localStorage.setItem('agent_access_token', token);
    set({ token });
  },

  setCurrentPath: (currentPath) => set({ currentPath }),

  fetchFiles: async (path) => {
    const p = path ?? get().currentPath;
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(p)}`, {
        headers: authHeaders(get().token),
      });
      const data = await response.json();
      set({ files: data.files ?? [], error: null });
    } catch {
      set({ error: '无法读取文件列表' });
    }
  },

  fetchGitStatus: async () => {
    try {
      const response = await fetch(`/api/git/status?cwd=${encodeURIComponent(get().currentPath)}`, {
        headers: authHeaders(get().token),
      });
      const data = await response.json();
      set({ gitStatus: data, error: null });
    } catch {
      set({ error: '无法读取 Git 状态' });
    }
  },

  fetchGitLog: async () => {
    try {
      const response = await fetch(`/api/git/log?cwd=${encodeURIComponent(get().currentPath)}`, {
        headers: authHeaders(get().token),
      });
      const data = await response.json();
      set({ gitCommits: data.commits ?? [], error: null });
    } catch {
      set({ error: '无法读取 Git 日志' });
    }
  },

  fetchAgentSessions: async (agent) => {
    try {
      const response = await fetch(`/api/agent/sessions?agent=${agent}`, {
        headers: authHeaders(get().token),
      });
      const data = await response.json();
      set({ agentSessions: data.sessions ?? [], error: null });
    } catch {
      set({ error: '无法读取 Agent 会话' });
    }
  },

  fetchDiff: async (file) => {
    const cwd = get().currentPath;
    const url = file
      ? `/api/git/diff?cwd=${encodeURIComponent(cwd)}&target=${encodeURIComponent(file)}`
      : `/api/git/diff?cwd=${encodeURIComponent(cwd)}`;
    try {
      const response = await fetch(url, { headers: authHeaders(get().token) });
      const data = await response.json();
      set({ diffContent: data.diff ?? '', diffFile: file ?? null, error: null });
    } catch {
      set({ error: '无法读取 Diff' });
    }
  },

  fetchStagedDiff: async () => {
    try {
      const response = await fetch(`/api/git/diff/staged?cwd=${encodeURIComponent(get().currentPath)}`, {
        headers: authHeaders(get().token),
      });
      const data = await response.json();
      set({ diffContent: data.diff ?? '', diffFile: null, error: null });
    } catch {
      set({ error: '无法读取暂存 Diff' });
    }
  },

  // ------------------------------------------------------------------
  // Agent memory & todo
  // ------------------------------------------------------------------
  fetchAgentMemory: async (agent) => {
    try {
      const response = await fetch(`/api/agent/memory?agent=${agent}&cwd=${encodeURIComponent(get().currentPath)}`, {
        headers: authHeaders(get().token),
      });
      const data = await response.json();
      set({ memories: data.memories ?? [], error: null });
    } catch {
      set({ error: '无法读取 Agent 记忆' });
    }
  },

  fetchAgentTodo: async (agent) => {
    try {
      const response = await fetch(`/api/agent/todo?agent=${agent}&cwd=${encodeURIComponent(get().currentPath)}`, {
        headers: authHeaders(get().token),
      });
      const data = await response.json();
      set({ todos: data.todos ?? [], error: null });
    } catch {
      set({ error: '无法读取 Agent TODO' });
    }
  },

  // ------------------------------------------------------------------
  // File CRUD
  // ------------------------------------------------------------------
  createFile: async (path, isDirectory = false) => {
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}&is_directory=${isDirectory}`, {
        method: 'POST',
        headers: authHeaders(get().token),
      });
      if (response.ok) {
        get().fetchFiles();
        return true;
      }
      const data = await response.json();
      set({ error: data.detail || '创建失败' });
      return false;
    } catch {
      set({ error: '创建失败' });
      return false;
    }
  },

  updateFile: async (path, content) => {
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`, {
        method: 'PUT',
        headers: { ...authHeaders(get().token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (response.ok) return true;
      const data = await response.json();
      set({ error: data.detail || '保存失败' });
      return false;
    } catch {
      set({ error: '保存失败' });
      return false;
    }
  },

  deleteFile: async (path) => {
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
        headers: authHeaders(get().token),
      });
      if (response.ok) {
        get().fetchFiles();
        return true;
      }
      const data = await response.json();
      set({ error: data.detail || '删除失败' });
      return false;
    } catch {
      set({ error: '删除失败' });
      return false;
    }
  },

  renameFile: async (oldPath, newPath) => {
    try {
      const response = await fetch(`/api/files/rename?old_path=${encodeURIComponent(oldPath)}&new_path=${encodeURIComponent(newPath)}`, {
        method: 'POST',
        headers: authHeaders(get().token),
      });
      if (response.ok) {
        get().fetchFiles();
        return true;
      }
      const data = await response.json();
      set({ error: data.detail || '重命名失败' });
      return false;
    } catch {
      set({ error: '重命名失败' });
      return false;
    }
  },

  searchFiles: async (query) => {
    try {
      const response = await fetch(`/api/files/search?cwd=${encodeURIComponent(get().currentPath)}&query=${encodeURIComponent(query)}`, {
        headers: authHeaders(get().token),
      });
      const data = await response.json();
      return data.results ?? [];
    } catch {
      return [];
    }
  },

  // ------------------------------------------------------------------
  // Git operations
  // ------------------------------------------------------------------
  gitAdd: async (file) => {
    try {
      const response = await fetch(`/api/git/add?cwd=${encodeURIComponent(get().currentPath)}&file=${encodeURIComponent(file)}`, {
        method: 'POST',
        headers: authHeaders(get().token),
      });
      if (response.ok) {
        get().fetchGitStatus();
        return true;
      }
      const data = await response.json();
      set({ error: data.detail || 'Stage 失败' });
      return false;
    } catch {
      set({ error: 'Stage 失败' });
      return false;
    }
  },

  gitReset: async (file) => {
    try {
      const response = await fetch(`/api/git/reset?cwd=${encodeURIComponent(get().currentPath)}&file=${encodeURIComponent(file)}`, {
        method: 'POST',
        headers: authHeaders(get().token),
      });
      if (response.ok) {
        get().fetchGitStatus();
        return true;
      }
      const data = await response.json();
      set({ error: data.detail || 'Unstage 失败' });
      return false;
    } catch {
      set({ error: 'Unstage 失败' });
      return false;
    }
  },

  gitCommit: async (message) => {
    try {
      const response = await fetch(`/api/git/commit?cwd=${encodeURIComponent(get().currentPath)}&message=${encodeURIComponent(message)}`, {
        method: 'POST',
        headers: authHeaders(get().token),
      });
      if (response.ok) {
        get().fetchGitStatus();
        get().fetchGitLog();
        return true;
      }
      const data = await response.json();
      set({ error: data.detail || 'Commit 失败' });
      return false;
    } catch {
      set({ error: 'Commit 失败' });
      return false;
    }
  },

  gitCheckout: async (target, createBranch = false) => {
    try {
      const response = await fetch(`/api/git/checkout?cwd=${encodeURIComponent(get().currentPath)}&target=${encodeURIComponent(target)}&create_branch=${createBranch}`, {
        method: 'POST',
        headers: authHeaders(get().token),
      });
      if (response.ok) {
        get().fetchGitStatus();
        get().fetchGitLog();
        return true;
      }
      const data = await response.json();
      set({ error: data.detail || 'Checkout 失败' });
      return false;
    } catch {
      set({ error: 'Checkout 失败' });
      return false;
    }
  },

  fetchBranches: async () => {
    try {
      const response = await fetch(`/api/git/branches?cwd=${encodeURIComponent(get().currentPath)}`, {
        headers: authHeaders(get().token),
      });
      const data = await response.json();
      return data.branches ?? [];
    } catch {
      return [];
    }
  },
}));
