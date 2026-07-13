import React from 'react';

interface ChatBubbleProps {
  role: 'user' | 'ai';
  content: string;
  isVoice?: boolean;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

/** AI 头像组件 */
const AIAvatar: React.FC = () => (
  <div className="w-9 h-9 rounded-full bg-[#e07a3a] flex items-center justify-center flex-shrink-0 shadow-sm">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M12 3c-1.5 0-2.5 1.5-2.5 3v1c0 1.5 1 3 2.5 3s2.5-1.5 2.5-3V6c0-1.5-1-3-2.5-3z" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <circle cx="12" cy="18" r="2" />
    </svg>
  </div>
);

/** 语音播放按钮 */
const SpeakButton: React.FC<{ onClick: () => void; isSpeaking: boolean }> = ({ onClick, isSpeaking }) => (
  <button
    onClick={onClick}
    className={`
      flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
      transition-colors cursor-pointer
      ${isSpeaking
        ? 'bg-[#5b8c5a] text-white animate-breathe'
        : 'bg-[#faf8f5] text-[#8a7e6e] hover:bg-[#5b8c5a] hover:text-white'
      }
    `}
    aria-label={isSpeaking ? '停止播放' : '播放语音'}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      {isSpeaking ? (
        <>
          <line x1="6" y1="4" x2="6" y2="20" />
          <line x1="10" y1="4" x2="10" y2="20" />
          <line x1="14" y1="4" x2="14" y2="20" />
          <line x1="18" y1="4" x2="18" y2="20" />
        </>
      ) : (
        <>
          <polygon points="5 3 19 12 5 21 5 3" />
        </>
      )}
    </svg>
  </button>
);

const ChatBubble: React.FC<ChatBubbleProps> = ({
  role,
  content,
  isVoice,
  onSpeak,
  isSpeaking = false,
}) => {
  if (role === 'user') {
    return (
      <div className="flex justify-end animate-fade-in-up">
        <div className="max-w-[75%] flex items-end gap-2">
          {/* 语音标记 */}
          {isVoice && (
            <div className="flex-shrink-0 mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8a7e6e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
            </div>
          )}
          <div className="bg-[#f0ebe5] rounded-2xl rounded-br-md px-4 py-2.5 text-[#2c2418] text-[15px] leading-relaxed shadow-sm">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // AI 消息
  return (
    <div className="flex gap-2.5 animate-fade-in-up">
      <AIAvatar />
      <div className="max-w-[75%] flex flex-col gap-1">
        <div className="bg-white rounded-2xl rounded-tl-md px-4 py-2.5 text-[#2c2418] text-[15px] leading-relaxed shadow-sm border border-[#f0ebe5]">
          {content}
        </div>
        {/* 语音播放按钮行 */}
        <div className="flex items-center gap-1.5 pl-1">
          <SpeakButton onClick={() => onSpeak?.(content)} isSpeaking={isSpeaking} />
          <span className="text-xs text-[#8a7e6e]">{isSpeaking ? '播放中' : '播放'}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
