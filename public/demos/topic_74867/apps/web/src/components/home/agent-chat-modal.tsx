'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Loader2, Sparkles, Zap } from 'lucide-react';
import { useFamilyHubStore, type AgentRuntime } from '@/stores/family-hub-store';

interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
}

interface AgentChatModalProps {
  agent: AgentRuntime | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Agent Chat Modal — lets the user have a real AI conversation with an agent.
 * Calls POST /family-hub/agents/:code/invoke which routes through the LLM adapter.
 */
export default function AgentChatModal({ agent, open, onClose }: AgentChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const invokeAgent = useFamilyHubStore((s) => s.invokeAgent);

  // Reset conversation when agent changes
  useEffect(() => {
    if (agent && open) {
      setMessages([
        {
          role: 'agent',
          content: agent.welcomeMessage || `你好！我是${agent.name}（${agent.role}）。有什么我可以帮你的吗？`,
          timestamp: Date.now(),
        },
      ]);
      setInput('');
      setLoading(false);
    }
  }, [agent?.id, open]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !agent || loading) return;

    const userMessage = input.trim();
    setInput('');

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, timestamp: Date.now() },
    ]);

    setLoading(true);

    try {
      const result = await invokeAgent(agent.id, userMessage);

      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: result.response,
          timestamp: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: '抱歉，我遇到了一些问题。请稍后再试。',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, agent, loading, invokeAgent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!agent) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="liquid-glass-strong w-full max-w-2xl h-[70vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${agent.color || '#5E9EF5'}20` }}
              >
                <Sparkles
                  className="w-5 h-5"
                  style={{ color: agent.color || '#5E9EF5' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-text truncate">
                  {agent.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{agent.role}</span>
                  <span className="text-[10px] text-text-subtle">
                    Lv.{agent.level} · {agent.calls} 次调用
                  </span>
                </div>
              </div>
              {agent.capabilities && agent.capabilities.length > 0 && (
                <div className="hidden sm:flex items-center gap-1 flex-wrap justify-end max-w-[200px]">
                  {agent.capabilities.slice(0, 2).map((cap) => (
                    <span
                      key={cap}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-text-muted"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-white/[0.06] transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-accent text-white'
                        : 'bg-white/[0.06] text-text'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/[0.06] rounded-2xl px-4 py-2.5 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-text-muted" />
                    <span className="text-xs text-text-muted">
                      {agent.name} 正在思考...
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/[0.06]">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`和 ${agent.role} 对话...`}
                  rows={1}
                  disabled={loading}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-subtle resize-none focus:outline-none focus:border-accent/40 transition-colors disabled:opacity-50"
                  style={{ maxHeight: '100px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-30 hover:bg-accent-hover transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] text-text-subtle">
                <Zap className="w-3 h-3" />
                <span>真实 AI 对话 · 按下 Enter 发送 · Shift+Enter 换行</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
