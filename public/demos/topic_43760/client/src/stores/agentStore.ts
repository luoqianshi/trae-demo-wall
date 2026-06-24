import { create } from 'zustand';
import type { Agent } from '../types';

interface AgentState {
  agents: Agent[];
  currentAgent: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchAgents: () => Promise<void>;
  setCurrentAgent: (agentName: string | null) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  currentAgent: null,
  isLoading: false,
  error: null,

  fetchAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('agent_access_token') ?? '';
      const response = await fetch('/api/agents', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      set({ agents: data.agents, isLoading: false });
    } catch (err) {
      set({ error: 'Failed to fetch agents', isLoading: false });
    }
  },

  setCurrentAgent: (agentName) => {
    set({ currentAgent: agentName });
  },
}));
