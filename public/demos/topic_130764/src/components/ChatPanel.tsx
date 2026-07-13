import React, { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import VoiceButton from './VoiceButton';
import ChatBubble from './ChatBubble';
import type { Goal } from '../types';

interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  type: 'voice' | 'text' | 'image' | 'system';
  imageUrl?: string;
  timestamp: number;
}

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string, type: 'voice' | 'text') => void;
  onUploadImage: (file: File) => void;
  isListening: boolean;
  isSpeaking: boolean;
  interimText?: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onSpeak: (text: string) => void;
  currentGoal?: Goal | null;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  onUploadImage,
  isListening,
  isSpeaking,
  interimText,
  onStartListening,
  onStopListening,
  onSpeak,
  currentGoal,
}) => {
  const [textInput, setTextInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimText]);

  const handleTextSubmit = (e?: FormEvent): void => {
    e?.preventDefault();
    const trimmed = textInput.trim();
    if (!trimmed) return;
    onSendMessage(trimmed, 'text');
    setTextInput('');
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImage(file);
      // 清空 input 以便重复上传同一文件
      e.target.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 顶部：当前目标状态 */}
      {currentGoal && (
        <div className="flex-shrink-0 bg-[#e07a3a]/8 border-b border-[#e07a3a]/15 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e07a3a] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e07a3a]" />
            </span>
            <span className="text-sm text-[#e07a3a] font-medium">
              正在陪练「{currentGoal.title}」
            </span>
          </div>
        </div>
      )}

      {/* 中间：消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
            <div className="w-16 h-16 rounded-full bg-[#f0ebe5] flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8a7e6e"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-7 h-7"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm text-[#8a7e6e]">点击下方麦克风按钮开始对话</p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            role={msg.role as 'user' | 'ai'}
            content={msg.content}
            isVoice={msg.type === 'voice'}
            onSpeak={msg.role === 'ai' ? onSpeak : undefined}
            isSpeaking={msg.role === 'ai' && isSpeaking}
          />
        ))}

        {/* 图片消息 */}
        {messages
          .filter((m) => m.type === 'image' && m.imageUrl)
          .map((msg) => (
            <div key={msg.id} className="flex justify-end animate-fade-in-up">
              <div className="max-w-[65%]">
                <img
                  src={msg.imageUrl}
                  alt="提交的成果"
                  className="rounded-2xl rounded-br-md shadow-sm max-h-[200px] object-cover"
                />
                {msg.content && (
                  <p className="text-xs text-[#8a7e6e] mt-1 text-right">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

        {/* 录音中间结果 - 显示在底部 */}
        {interimText && isListening && (
          <div className="flex justify-end">
            <div className="max-w-[75%] bg-[#f0ebe5]/60 rounded-2xl rounded-br-md px-4 py-2.5 text-[#8a7e6e] text-[15px] leading-relaxed border border-dashed border-[#d4cdc3]">
              {interimText}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 底部：输入区域 */}
      <div className="flex-shrink-0 bg-[#faf8f5] border-t border-[#e8e2da] px-4 py-3">
        <div className="max-w-lg mx-auto">
          {/* VoiceButton + 临时文本 */}
          <div className="flex items-center gap-3">
            {/* 文件上传按钮 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[#f0ebe5] text-[#8a7e6e] hover:bg-[#e8e2da] transition-colors cursor-pointer"
              aria-label="上传图片"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-[18px] h-[18px]"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* 语音按钮 */}
            <div className="flex-shrink-0">
              <VoiceButton
                isListening={isListening}
                isSpeaking={isSpeaking}
                interimText={undefined}
                onStartListening={onStartListening}
                onStopListening={onStopListening}
              />
            </div>

            {/* 文字输入框 + 发送按钮 */}
            <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="或者打字告诉我..."
                className="flex-1 h-9 px-3.5 rounded-full bg-[#f0ebe5] border border-[#e8e2da] text-[#2c2418] text-sm placeholder-[#b8b0a4] focus:outline-none focus:ring-2 focus:ring-[#e07a3a]/30 focus:border-[#e07a3a]/50 transition-all"
              />
              {textInput.trim() && (
                <button
                  type="submit"
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-[#e07a3a] text-white flex items-center justify-center hover:bg-[#d06a2a] transition-colors cursor-pointer shadow-sm"
                  aria-label="发送"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
export type { Message };
