import { create } from 'zustand';
import type { Message, Artifact } from '../types';

interface ChatState {
  messages: Message[];
  artifacts: Artifact[];
  isStreaming: boolean;
  currentStream: string;
  
  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  appendToStream: (content: string) => void;
  clearStream: () => void;
  addArtifact: (artifact: Artifact) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  artifacts: [],
  isStreaming: false,
  currentStream: '',

  setMessages: (messages) => {
    set({ messages });
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  updateLastMessage: (content) => {
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1].content += content;
      }
      return { messages };
    });
  },

  setStreaming: (streaming) => {
    set({ isStreaming: streaming });
  },

  appendToStream: (content) => {
    set((state) => ({
      currentStream: state.currentStream + content,
    }));
  },

  clearStream: () => {
    set({ currentStream: '' });
  },

  addArtifact: (artifact) => {
    set((state) => ({
      artifacts: [...state.artifacts, artifact],
    }));
  },

  clearMessages: () => {
    set({ messages: [], artifacts: [] });
  },
}));
