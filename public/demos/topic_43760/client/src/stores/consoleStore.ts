import { create } from 'zustand';
import type { AgentTask, Message, Session, Workspace } from '@/types';

const storedToken = localStorage.getItem('agent_access_token') ?? '';

function authHeaders(token: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ConsoleState {
  sessions: Session[];
  currentSessionId: string | null;
  workspaces: Workspace[];
  tasks: AgentTask[];
  token: string;
  connectionStatus: 'offline' | 'connecting' | 'online' | 'reconnecting';
  isLoading: boolean;
  error: string | null;

  setToken: (token: string) => void;
  setConnectionStatus: (status: ConsoleState['connectionStatus']) => void;
  fetchWorkspaces: () => Promise<void>;
  fetchSessions: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  createSession: (agent: string, cwd: string) => Promise<Session | null>;
  selectSession: (sessionId: string) => void;
  upsertSession: (session: Session) => void;
  upsertTask: (task: AgentTask) => void;
}

export const useConsoleStore = create<ConsoleState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  workspaces: [],
  tasks: [],
  token: storedToken,
  connectionStatus: 'offline',
  isLoading: false,
  error: null,

  setToken: (token) => {
    localStorage.setItem('agent_access_token', token);
    set({ token });
  },

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  fetchWorkspaces: async () => {
    try {
      const response = await fetch('/api/workspaces', { headers: authHeaders(get().token) });
      const data = await response.json();
      set({ workspaces: data.workspaces ?? [], error: null });
    } catch {
      set({ error: '无法读取工作目录' });
    }
  },

  fetchSessions: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/sessions', { headers: authHeaders(get().token) });
      const data = await response.json();
      const sessions = data.sessions ?? [];
      set((state) => ({
        sessions,
        currentSessionId: state.currentSessionId ?? sessions[0]?.id ?? null,
        isLoading: false,
        error: null,
      }));
    } catch {
      set({ isLoading: false, error: '无法读取会话' });
    }
  },

  fetchTasks: async () => {
    try {
      const response = await fetch('/api/tasks', { headers: authHeaders(get().token) });
      const data = await response.json();
      set({ tasks: data.tasks ?? [], error: null });
    } catch {
      set({ error: '无法读取任务状态' });
    }
  },

  createSession: async (agent, cwd) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(get().token),
        },
        body: JSON.stringify({ agent, cwd }),
      });
      const data = await response.json();
      const session = data.session as Session;
      set((state) => ({
        sessions: [session, ...state.sessions.filter((item) => item.id !== session.id)],
        currentSessionId: session.id,
        error: null,
      }));
      return session;
    } catch {
      set({ error: '无法创建会话' });
      return null;
    }
  },

  selectSession: (currentSessionId) => set({ currentSessionId }),

  upsertSession: (session) => {
    set((state) => ({
      sessions: [session, ...state.sessions.filter((item) => item.id !== session.id)].sort(
        (a, b) => b.updatedAt - a.updatedAt,
      ),
    }));
  },

  upsertTask: (task) => {
    set((state) => ({
      tasks: [task, ...state.tasks.filter((item) => item.id !== task.id)].slice(0, 30),
    }));
  },
}));

export async function fetchSessionMessages(sessionId: string, token: string): Promise<Message[]> {
  const response = await fetch(`/api/sessions/${sessionId}`, { headers: authHeaders(token) });
  const data = await response.json();
  return data.messages ?? [];
}
