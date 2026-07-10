'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SnowballLoadingOverlay from './SnowballLoadingOverlay';

interface QuickRecordProps {
  onSubmit: (data: { content: string; type: string; mood: string; tags: string[]; related_task_id: string }) => Promise<{ id: string; content: string } | null>;
  onUpdateRecord?: (recordId: string, data: { type: string; tags: string[] }) => void;
  isLoading?: boolean;
}

const MOOD_OPTIONS = [
  { value: 'happy', emoji: '😊', label: '开心' },
  { value: 'proud', emoji: '🥰', label: '自豪' },
  { value: 'excited', emoji: '🤩', label: '兴奋' },
  { value: 'calm', emoji: '😌', label: '平静' },
  { value: 'grateful', emoji: '🙏', label: '感恩' },
];

const QuickRecord = ({ onSubmit, onUpdateRecord, isLoading = false }: QuickRecordProps) => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('proud');

  const [showMoodBar, setShowMoodBar] = useState(false);
  const [moodBarDismissed, setMoodBarDismissed] = useState(false);
  const moodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 当用户输入内容时，自动弹出心情选择器
  useEffect(() => {
    if (content.length > 0 && !moodBarDismissed) {
      setShowMoodBar(true);
    } else if (content.length === 0) {
      setShowMoodBar(false);
      setMoodBarDismissed(false);
    }
  }, [content, moodBarDismissed]);

  // 3秒自动收起心情选择器
  useEffect(() => {
    if (showMoodBar && !moodBarDismissed) {
      // 清除之前的定时器
      if (moodTimerRef.current) {
        clearTimeout(moodTimerRef.current);
      }
      moodTimerRef.current = setTimeout(() => {
        setMoodBarDismissed(true);
        setShowMoodBar(false);
      }, 3000);
    }

    return () => {
      if (moodTimerRef.current) {
        clearTimeout(moodTimerRef.current);
      }
    };
  }, [showMoodBar, moodBarDismissed]);

  // 用户点击心情时，重置定时器并收起
  const handleMoodSelect = useCallback((value: string) => {
    setMood(value);
    // 选择后短暂展示再收起
    if (moodTimerRef.current) {
      clearTimeout(moodTimerRef.current);
    }
    moodTimerRef.current = setTimeout(() => {
      setMoodBarDismissed(true);
      setShowMoodBar(false);
    }, 800);
  }, []);

  // Layer 3: AI 自动打标（后台执行）
  const triggerAutoTag = useCallback(async (text: string) => {
    try {
      const response = await fetch('/api/ai/auto-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (response.ok) {
        const data = await response.json();
        return { type: data.type, tags: data.tags };
      }
    } catch (error) {
      console.error('Auto-tag failed:', error);
    }
    return null;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const trimmedContent = content.trim();

    let autoType = 'success';
    let autoTags: string[] = [];

    const tagResult = await triggerAutoTag(trimmedContent);
    if (tagResult) {
      autoType = tagResult.type;
      autoTags = tagResult.tags;
    }

    const record = await onSubmit({
      content: trimmedContent,
      type: autoType,
      mood,
      tags: autoTags,
      related_task_id: '',
    });

    setContent('');
    setMood('proud');
    setMoodBarDismissed(false);
    setShowMoodBar(false);

    if (record && onUpdateRecord && tagResult) {
      onUpdateRecord(record.id, {
        type: tagResult.type,
        tags: tagResult.tags,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 relative">
      <SnowballLoadingOverlay isVisible={isLoading} />
      {/* Layer 1: 单行输入框 + 提交按钮 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">✨</span>
          <input
            id="quick-record-input"
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="记录今天的一个小成功..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all text-sm shadow-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="px-6 py-4 bg-gradient-to-r from-[#FFB6C1] to-[#FF99AA] text-white rounded-2xl font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 text-sm whitespace-nowrap"
        >
          {isLoading ? '记录中...' : '记录'}
        </button>
      </div>

      {/* Layer 2: 心情快速选择（输入后自动弹出） */}
      <AnimatePresence>
        {showMoodBar && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#FFF8F0] to-white rounded-2xl border border-[#FFB6C1]/20 shadow-sm">
              <span className="text-xs text-gray-400 mr-1 whitespace-nowrap">心情</span>
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleMoodSelect(option.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm transition-all ${
                    mood === option.value
                      ? 'bg-[#FFB6C1]/20 border border-[#FFB6C1]/40 scale-105 shadow-sm'
                      : 'bg-white border border-gray-100 hover:border-[#FFB6C1]/30 hover:scale-105'
                  }`}
                >
                  <span className="text-lg">{option.emoji}</span>
                  <span className={`text-xs ${mood === option.value ? 'text-[#FF99AA] font-medium' : 'text-gray-500'}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
};

export default QuickRecord;
