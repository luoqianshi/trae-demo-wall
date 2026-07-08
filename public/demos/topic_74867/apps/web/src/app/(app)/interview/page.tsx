'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, Sparkles, AlertCircle, Tag, Heart } from 'lucide-react';
import { useSSEChat } from '@/hooks/use-sse-chat';
import { PageTransition } from '@/components/page-transition';
import { Badge } from '@/components/ui/badge';
import { TypingDots } from '@/components/ui/loading';
import { useAuthStore } from '@/stores/auth-store';
import {
  cn,
  getEmotionColor,
  getEmotionLabel,
} from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';

/** Suggested conversation starters. */
const STARTERS = [
  '今天我想聊聊我小时候的故事',
  '最近发生了一件让我难忘的事',
  '说说我对家人的感情',
  '我想回忆一段童年的夏天',
];

export default function InterviewPage() {
  const user = useAuthStore((s) => s.user);
  const { messages, isStreaming, error, sendMessage, stopStream } = useSSEChat();

  const [input, setInput] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to the latest message
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || isStreaming) return;
    sendMessage(content);
    setInput('');
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <PageTransition>
      <div className="flex h-[calc(100dvh-4rem)] flex-col">
        {/* Immersive liquid glass chat container */}
        <div className="liquid-glass-strong flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:space-y-6 sm:px-8 sm:py-8"
          >
            {messages.length === 0 ? (
              <EmptyConversation
                nickname={user?.profile.nickname}
                onStart={(text) => {
                  sendMessage(text);
                }}
                starters={STARTERS}
              />
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 border-t border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input area */}
          <div className="border-t border-glass-border/30 px-3 py-3 sm:px-8 sm:py-4"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-end gap-2 sm:gap-3">
              <div className="liquid-glass-input relative flex flex-1 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="说点什么，或分享一段回忆..."
                  rows={1}
                  disabled={isStreaming}
                  className="min-h-[44px] w-full flex-1 resize-none bg-transparent px-4 py-3 text-sm text-text placeholder:text-text-muted/60 outline-none disabled:opacity-60"
                />
              </div>
              <motion.button
                type={isStreaming ? 'button' : 'submit'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isStreaming ? stopStream : undefined}
                disabled={!isStreaming && !input.trim()}
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors',
                  isStreaming
                    ? 'bg-life-rose/20 text-life-rose'
                    : input.trim()
                      ? 'bg-accent/20 text-accent hover:bg-accent/30'
                      : 'bg-surface text-text-muted'
                )}
              >
                {isStreaming ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </motion.button>
            </form>
            <p className="mt-2 text-center text-xs text-text-muted/50">
              按 Enter 发送，Shift + Enter 换行
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function EmptyConversation({
  nickname,
  onStart,
  starters,
}: {
  nickname?: string;
  onStart: (text: string) => void;
  starters: string[];
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-[#5e5ce6]"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="h-8 w-8 text-white" />
        </motion.div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
        className="mt-4 text-lg font-semibold text-text"
      >
        你好{nickname ? `，${nickname}` : ''}，准备好开始访谈了吗？
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
        className="mt-2 max-w-sm text-sm text-text-muted"
      >
        我会引导你回忆人生的点点滴滴，并帮你把它们变成珍贵的数字记忆。
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
        className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {starters.map((starter, i) => (
          <motion.button
            key={starter}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.35 + i * 0.05,
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onStart(starter)}
            className="liquid-glass px-4 py-3 text-left text-sm text-text-muted transition-colors hover:text-text"
          >
            {starter}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isAI = message.role === 'ai';
  const emotionColor = getEmotionColor(message.emotion);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold',
          isUser
            ? 'bg-surface-hover text-text'
            : 'bg-gradient-to-br from-accent to-[#5e5ce6] text-white',
        )}
      >
        {isUser ? '我' : <Sparkles className="h-4 w-4" />}
      </motion.span>

      {/* Bubble + metadata */}
      <div className={cn('flex max-w-[80%] flex-col gap-2', isUser && 'items-end')}>
        <div className={cn('px-4 py-3 text-sm leading-relaxed', isUser ? 'msg-user' : 'msg-ai')}>
          {message.content ? (
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
          ) : message.streaming ? (
            <TypingDots />
          ) : null}
          {message.streaming && message.content && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse-soft bg-accent align-middle" />
          )}
        </div>

        {/* Entities chips */}
        {isAI && message.entities && message.entities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.1 }}
            className="flex flex-wrap items-center gap-1.5"
          >
            <Tag className="h-3 w-3 text-text-muted" />
            {message.entities.map((entity, i) => (
              <Badge key={`${entity}-${i}`} variant="default" className="text-[10px]">
                {entity}
              </Badge>
            ))}
          </motion.div>
        )}

        {/* Emotion indicator */}
        {isAI && message.emotion && !message.streaming && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.15 }}
            className="flex items-center gap-1.5 text-xs text-text-muted"
          >
            <Heart className="h-3 w-3" style={{ color: emotionColor }} fill={emotionColor} />
            <span style={{ color: emotionColor }}>
              {getEmotionLabel(message.emotion)}
            </span>
            {typeof message.emotionIntensity === 'number' && (
              <span className="text-text-muted/70">
                强度 {Math.round(message.emotionIntensity * 100)}%
              </span>
            )}
          </motion.div>
        )}

        {/* Memory saved confirmation */}
        {isAI && message.memoryId && !message.streaming && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.2 }}
            className="text-xs text-success"
          >
            已保存为记忆{message.summary ? `：${message.summary}` : ''}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
