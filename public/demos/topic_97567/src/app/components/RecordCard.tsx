'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Conversation {
  id: string;
  record_id: string;
  role: 'assistant' | 'user';
  content: string;
  created_at: string;
}

interface RecordCardProps {
  record: {
    id: string;
    content: string;
    type: string;
    tags: string[];
    mood: string;
    related_task_id?: string;
    created_at: string;
  };
  goalTitle?: string;
  onDelete: (id: string) => void;
  feedback?: string;
  followUp?: string;
  isLoadingFeedback?: boolean;
  conversations?: Conversation[];
  onAnswerFollowUp?: (recordId: string, answer: string, lastQuestion: string) => void;
  onContinueChat?: (recordId: string, message: string) => void;
  isAnswering?: boolean;
  /** 雪球增长百分比（用于右上角装饰） */
  snowballGrowth?: number;
}

const moodEmojis: Record<string, string> = {
  happy: '😊',
  proud: '🥰',
  excited: '🤩',
  calm: '😌',
  grateful: '🙏',
};

const typeLabels: Record<string, string> = {
  success: '小成功',
  habit: '好习惯',
  progress: '进步',
  reflection: '感悟',
};

const typeColors: Record<string, string> = {
  success: 'border-l-[#FFB6C1]',
  habit: 'border-l-[#87CEEB]',
  progress: 'border-l-[#FFD700]',
  reflection: 'border-l-[#9B8EC4]',
};

const tagColors: Record<string, string> = {
  success: 'bg-[#FFB6C1]/10 text-[#E8929E]',
  habit: 'bg-[#87CEEB]/10 text-[#5BA8D4]',
  progress: 'bg-[#FFD700]/10 text-[#D4A800]',
  reflection: 'bg-[#9B8EC4]/10 text-[#7B6FA3]',
};

// 雪球加载动画组件
const SnowballLoadingIndicator = ({ message }: { message?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-gradient-to-r from-[#87CEEB]/8 to-[#FFD700]/8 rounded-2xl p-4 border border-[#87CEEB]/12"
  >
    <div className="flex items-center gap-3">
      {/* 雪球旋转动画 */}
      <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-[#87CEEB]/20 to-[#FFD700]/20 border-2 border-dashed border-[#87CEEB]/30"
        />
        <span className="absolute text-lg">❄️</span>
      </div>

      {/* 文字提示 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#87CEEB] mb-1">雪球正在思考...</p>
        <p className="text-xs text-gray-400">{message || '正在认真阅读你的回答，稍等片刻哦'}</p>
      </div>

      {/* 跳动的点 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#87CEEB]"
            animate={{
              y: [0, -6, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

// 错误/重试组件
const ErrorRetryBox = ({ onRetry }: { onRetry: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-red-50/50 rounded-2xl p-3 border border-red-100"
  >
    <div className="flex items-start gap-2">
      <span className="text-base">😅</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-600 mb-1">哎呀，出了一点小问题</p>
        <p className="text-xs text-gray-500 mb-2">网络可能不太顺畅，可以再试一次</p>
        <button
          onClick={onRetry}
          className="px-3 py-1.5 bg-gradient-to-r from-[#87CEEB] to-[#5BA8D4] text-white text-xs font-medium rounded-lg hover:shadow-md transition-all"
        >
          🔄 重试一下
        </button>
      </div>
    </div>
  </motion.div>
);

const RecordCard = React.memo(({ 
  record, 
  goalTitle, 
  onDelete, 
  feedback, 
  followUp, 
  isLoadingFeedback,
  conversations = [],
  onAnswerFollowUp,
  onContinueChat,
  isAnswering = false,
  snowballGrowth = 3,
}: RecordCardProps) => {
  const [answerInput, setAnswerInput] = useState('');
  const [showAnswerInput, setShowAnswerInput] = useState(true); // 默认展开
  const [pendingAnswer, setPendingAnswer] = useState('');
  const [hasError, setHasError] = useState(false);
  const [continueChatInput, setContinueChatInput] = useState('');
  const [showContinueChat, setShowContinueChat] = useState(true); // 默认展开

  // 构建完整的对话流
  const buildConversationFlow = (): { 
    items: Array<{type: 'question' | 'answer' | 'feedback', content: string, id: string}>; 
    lastQuestion: string | null 
  } => {
    const items: Array<{type: 'question' | 'answer' | 'feedback', content: string, id: string}> = [];
    let lastQuestion: string | null = null;

    if (followUp && conversations.length === 0) {
      items.push({ type: 'question', content: followUp, id: 'initial-followup' });
      lastQuestion = followUp;
    }

    for (const conv of conversations) {
      if (conv.role === 'assistant') {
        const isQuestion = conv.content.includes('？') || conv.content.includes('?') || 
                          conv.content.includes('说说') || conv.content.includes('分享') ||
                          conv.content.includes('能') || conv.content.includes('可以');
        if (isQuestion) {
          items.push({ type: 'question', content: conv.content, id: conv.id });
          lastQuestion = conv.content;
        } else {
          items.push({ type: 'feedback', content: conv.content, id: conv.id });
        }
      } else {
        items.push({ type: 'answer', content: conv.content, id: conv.id });
      }
    }

    if (followUp && conversations.length > 0) {
      const alreadyExists = items.some(item => item.content === followUp);
      if (!alreadyExists) {
        items.push({ type: 'question', content: followUp, id: 'current-followup' });
        lastQuestion = followUp;
      }
    }

    return { items, lastQuestion };
  };

  const { items: conversationFlow, lastQuestion } = buildConversationFlow();
  
  // 获取最后一条消息的类型（用于决定输入框样式）
  const lastItemType = conversationFlow.length > 0 
    ? conversationFlow[conversationFlow.length - 1].type 
    : null;
  
  // 是否正在等待AI响应（用户已提交但还没收到回复）
  const isWaitingForResponse = isAnswering || pendingAnswer !== '';

  // 是否应该显示输入框（当最后一条是追问或反馈时，且不在等待响应）
  const shouldShowInputBox = conversationFlow.length > 0 && 
                            (lastItemType === 'question' || lastItemType === 'feedback') && 
                            !isLoadingFeedback && 
                            !isAnswering;

  // 提交回复（统一处理追问回答和继续聊天）
  const handleSubmitReply = () => {
    const inputText = lastItemType === 'question' ? answerInput : continueChatInput;
    if (!inputText.trim()) return;
    
    if (lastItemType === 'question' && lastQuestion && onAnswerFollowUp) {
      // 回答追问
      setPendingAnswer(inputText.trim());
      setHasError(false);
      onAnswerFollowUp(record.id, inputText.trim(), lastQuestion);
      setAnswerInput('');
    } else if (lastItemType === 'feedback' && onContinueChat) {
      // 继续聊天
      onContinueChat(record.id, inputText.trim());
      setContinueChatInput('');
    }
  };

  // 重试
  const handleRetry = () => {
    setHasError(false);
    if (pendingAnswer && lastQuestion && onAnswerFollowUp) {
      onAnswerFollowUp(record.id, pendingAnswer, lastQuestion);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitReply();
    }
  };

  // 当收到新对话后清除 pending 状态
  useEffect(() => {
    if (conversations.length > 0 && pendingAnswer) {
      setPendingAnswer('');
      setHasError(false);
    }
  }, [conversations.length]);

  // 监听错误状态（如果 answering 变为 false 但没有新的对话内容）
  useEffect(() => {
    if (!isAnswering && pendingAnswer) {
      // 检查是否有新的对话被添加
      const hasNewConversation = conversations.some(
        c => c.content === pendingAnswer && c.role === 'user'
      );
      if (!hasNewConversation && !isLoadingFeedback) {
        // 可能出错了
        setTimeout(() => {
          if (pendingAnswer && !conversations.some(c => c.content === pendingAnswer)) {
            setHasError(true);
          }
        }, 2000);
      }
    }
  }, [isAnswering, pendingAnswer, conversations, isLoadingFeedback]);

  return (
    <div className={`bg-white rounded-3xl shadow-lg border border-white/80 p-6 border-l-4 ${typeColors[record.type] || 'border-l-[#FFB6C1]'} relative`}>
      {/* 右上角雪球装饰 */}
      <div className="absolute right-4 top-4 flex items-center gap-1.5">
        <div 
          className="w-8 h-8 rounded-full shadow-sm relative"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #fff, #E8F4F8)',
          }}
        >
          <div 
            className="absolute w-2 h-2 bg-white/90 rounded-full"
            style={{ top: '6px', left: '7px' }}
          />
        </div>
        <span className="text-xs font-semibold text-pink-400 bg-gradient-to-r from-pink-50 to-blue-50 px-2 py-0.5 rounded-full">
          +{snowballGrowth}%
        </span>
      </div>
      
      {/* 记录主体 */}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{moodEmojis[record.mood] || '😊'}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${tagColors[record.type] || 'bg-[#87CEEB]/10 text-[#5BA8D4]'}`}>
              {typeLabels[record.type] || record.type}
            </span>
            {goalTitle && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#FFB6C1]/10 text-[#E8929E]">
                🎯 {goalTitle}
              </span>
            )}
          </div>
          <p className="text-gray-700 mb-3 leading-relaxed break-words">{record.content}</p>
          {record.tags && record.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {record.tags.map((tag, index) => (
                <span key={index} className="px-2.5 py-0.5 rounded-full text-xs bg-[#FFF8F0] text-gray-500 border border-[#FFE4D6]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-300">
            {new Date(record.created_at).toLocaleString('zh-CN')}
          </p>
        </div>
        <button
          onClick={() => onDelete(record.id)}
          className="text-gray-300 hover:text-red-400 ml-4 transition-colors text-sm"
        >
          删除
        </button>
      </div>

      {/* 对话区域 */}
      {(conversationFlow.length > 0 || isLoadingFeedback || isWaitingForResponse) && (
        <div className="mt-4 pt-4 border-t border-gray-50">
          <AnimatePresence mode="popLayout">
            {/* 对话历史 */}
            {conversationFlow.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className={`mb-3 rounded-2xl p-3 ${
                  item.type === 'answer'
                    ? 'bg-gradient-to-r from-[#FFB6C1]/5 to-[#FFD700]/5 border border-[#FFB6C1]/10 ml-4'
                    : item.type === 'question'
                    ? 'bg-gradient-to-r from-[#87CEEB]/5 to-[#FFD700]/5 border border-[#87CEEB]/15'
                    : 'bg-gradient-to-r from-[#FFB6C1]/5 to-[#87CEEB]/5 border border-[#FFB6C1]/10'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base flex-shrink-0">
                    {item.type === 'answer' ? '💬' : item.type === 'question' ? '❄️' : '🌟'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium mb-1 ${
                      item.type === 'answer' ? 'text-[#E8929E]' : 
                      item.type === 'question' ? 'text-[#87CEEB]' : 'text-[#FFB6C1]'
                    }`}>
                      {item.type === 'answer' ? '你的回答' : item.type === 'question' ? '雪球追问' : '雪球回应'}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed break-words">{item.content}</p>
                  </div>
                </div>

                {/* 回复输入框 - 在最后一条追问后显示 */}
                {item.type === 'question' && index === conversationFlow.length - 1 && shouldShowInputBox && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-[#87CEEB]/10"
                  >
                    {showAnswerInput ? (
                      <div className="space-y-2">
                        <textarea
                          value={answerInput}
                          onChange={(e) => setAnswerInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="写下你的回答..."
                          className="w-full px-3 py-2 rounded-xl border border-[#87CEEB]/20 focus:border-[#87CEEB]/50 focus:outline-none text-sm resize-none bg-white/50"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setShowAnswerInput(false)}
                            className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            收起
                          </button>
                          <button
                            onClick={handleSubmitReply}
                            disabled={!answerInput.trim()}
                            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-[#87CEEB] to-[#5BA8D4] text-white hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            发送 ✨
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAnswerInput(true)}
                        className="w-full py-2 px-4 bg-white/50 hover:bg-white/80 rounded-xl text-sm text-[#87CEEB] font-medium transition-all border border-[#87CEEB]/20 hover:border-[#87CEEB]/40"
                      >
                        💬 回答这个问题
                      </button>
                    )}
                  </motion.div>
                )}

                {/* 回复输入框 - 在最后一条反馈后显示（粉色主题） */}
                {item.type === 'feedback' && index === conversationFlow.length - 1 && shouldShowInputBox && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-[#FFB6C1]/10"
                  >
                    {showContinueChat ? (
                      <div className="space-y-2">
                        <textarea
                          value={continueChatInput}
                          onChange={(e) => setContinueChatInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="想聊点什么？可以分享更多细节、感受或新想法..."
                          className="w-full px-3 py-2.5 rounded-xl border border-[#FFB6C1]/20 focus:border-[#FFB6C1]/50 focus:outline-none text-sm resize-none bg-white/60"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setShowContinueChat(false)}
                            className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            收起
                          </button>
                          <button
                            onClick={handleSubmitReply}
                            disabled={!continueChatInput.trim()}
                            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-[#FFB6C1] to-[#FF99AA] text-white hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            发送 ✨
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowContinueChat(true)}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FFB6C1]/10 to-[#87CEEB]/10 hover:from-[#FFB6C1]/20 hover:to-[#87CEEB]/20 rounded-xl text-sm font-medium text-[#E8929E] transition-all border border-[#FFB6C1]/15 hover:border-[#FFB6C1]/30 flex items-center justify-center gap-2"
                      >
                        <span>💫</span>
                        <span>继续聊聊</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}

            {/* 待发送的回答（用户刚提交但还在等待AI响应） */}
            <AnimatePresence>
              {isWaitingForResponse && pendingAnswer && (
                <>
                  {/* 用户回答气泡 */}
                  <motion.div
                    key="pending-answer"
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mb-3 rounded-2xl p-3 bg-gradient-to-r from-[#FFB6C1]/5 to-[#FFD700]/5 border border-[#FFB6C1]/10 ml-4"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base flex-shrink-0">💬</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#E8929E] mb-1">你的回答</p>
                        <p className="text-sm text-gray-600 leading-relaxed break-words">{pendingAnswer}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* 加载状态指示器 */}
                  {!hasError ? (
                    <SnowballLoadingIndicator />
                  ) : (
                    <ErrorRetryBox onRetry={handleRetry} />
                  )}
                </>
              )}

              {/* 初始加载状态（首次获取追问） */}
              {isLoadingFeedback && conversationFlow.length === 0 && !isWaitingForResponse && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 py-2"
                >
                  <span className="animate-pulse text-lg">❄️</span>
                  <span className="text-sm text-gray-400">正在思考如何追问...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

export default RecordCard;
