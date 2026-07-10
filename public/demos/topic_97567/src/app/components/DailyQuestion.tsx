'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DailyQuestionProps {
  token: string;
  onRecordFromAnswer?: (content: string, questionText?: string) => Promise<any>;
}

const DailyQuestion = ({ token, onRecordFromAnswer }: DailyQuestionProps) => {
  const [question, setQuestion] = useState('');
  const [questionType, setQuestionType] = useState<string>('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const onRecordFromAnswerRef = useRef(onRecordFromAnswer);
  onRecordFromAnswerRef.current = onRecordFromAnswer;

  const initialFetchDoneRef = useRef(false);

  const fetchQuestion = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setIsRefreshing(true);

    try {
      const response = await fetch('/api/ai/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestion(data.question);
        setQuestionType(data.question_type);
      }
    } catch (error) {
      console.error('Failed to fetch daily question:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      fetchQuestion();
    }
  }, [fetchQuestion]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAnswer = useCallback(async () => {
    if (!answer.trim() || isSubmitting) return;
    const callback = onRecordFromAnswerRef.current;
    if (!callback) return;
    setIsSubmitting(true);
    try {
      const result = await callback(answer.trim(), question);
      if (result) {
        setAnswer('');
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 3000);
      }
    } catch (err) {
      console.error('Failed to record answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [answer, isSubmitting]);

  const handleRefresh = useCallback(() => {
    setIsSubmitted(false);
    setAnswer('');
    fetchQuestion(false);
  }, [fetchQuestion]);

  const questionTypeLabel: Record<string, string> = {
    morning: '早安',
    noon: '午安',
    evening: '晚安',
  };

  if (!isLoading && !question) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white rounded-3xl shadow-lg border border-[#FFB6C1]/15 overflow-hidden"
      >
        <div className="h-1.5 bg-gradient-to-r from-[#FFB6C1] via-[#FFD700] to-[#87CEEB]" />

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <motion.span
                className="text-2xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                ❄️
              </motion.span>
              <div>
                <span className="text-sm font-semibold text-[#FFB6C1]">雪球问你</span>
                {questionType && (
                  <span className="ml-2 text-xs text-gray-300">
                    {questionTypeLabel[questionType] || ''}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs text-gray-400 hover:text-[#FFB6C1] transition-colors disabled:opacity-50"
            >
              {isRefreshing ? '...' : '换一个问题'}
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 py-3">
              <motion.div
                className="w-2 h-2 bg-[#FFB6C1] rounded-full"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              <motion.div
                className="w-2 h-2 bg-[#FFD700] rounded-full"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 bg-[#87CEEB] rounded-full"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
              />
              <span className="text-sm text-gray-300 ml-1">雪球正在想问题...</span>
            </div>
          ) : (
            <motion.p
              key={question}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-gray-700 text-base leading-relaxed py-1"
            >
              {question}
            </motion.p>
          )}

          {!isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-4"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && answer.trim()) {
                      handleSubmitAnswer();
                    }
                  }}
                  placeholder="写下你的想法..."
                  className="flex-1 px-4 py-3 bg-[#FFF8F0] border border-[#FFB6C1]/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]/40 focus:border-transparent transition-all placeholder:text-gray-300"
                />
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || isSubmitted || isSubmitting}
                  className="px-5 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FF99AA] text-white rounded-2xl text-sm font-medium hover:shadow-md hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100 whitespace-nowrap"
                >
                  {isSubmitting ? '记录中...' : isSubmitted ? '已记录 ✓' : '记录这个想法'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DailyQuestion;
