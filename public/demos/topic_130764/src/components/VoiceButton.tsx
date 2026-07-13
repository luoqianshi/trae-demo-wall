import React from 'react';

interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  interimText?: string;
  onStartListening: () => void;
  onStopListening: () => void;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({
  isListening,
  isSpeaking,
  interimText,
  onStartListening,
  onStopListening,
}) => {
  const handleClick = (): void => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* 脉冲环动画 - 仅录音时显示 */}
      {isListening && (
        <div className="absolute w-[88px] h-[88px] rounded-full bg-[#e07a3a]/20 animate-pulse-ring" />
      )}
      {isListening && (
        <div className="absolute w-[104px] h-[104px] rounded-full bg-[#e07a3a]/10 animate-pulse-ring [animation-delay:200ms]" />
      )}

      {/* 主按钮 */}
      <button
        onClick={handleClick}
        className={`
          relative w-[72px] h-[72px] rounded-full flex items-center justify-center
          transition-all duration-300 cursor-pointer
          ${isListening
            ? 'bg-[#c4602a] scale-110 shadow-lg shadow-[#e07a3a]/30'
            : isSpeaking
              ? 'bg-[#5b8c5a] animate-breathe shadow-lg shadow-[#5b8c5a]/30'
              : 'bg-[#e07a3a] hover:bg-[#d06a2a] shadow-md shadow-[#e07a3a]/20 hover:shadow-lg hover:shadow-[#e07a3a]/30 active:scale-105'
          }
        `}
        aria-label={isListening ? '停止录音' : isSpeaking ? 'AI正在说话' : '开始说话'}
      >
        {/* 麦克风图标 - 默认 / 录音状态 */}
        {(!isSpeaking) && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}

        {/* 波形动画 - 录音中 */}
        {isListening && (
          <div className="absolute flex items-center gap-[3px]">
            <div className="w-[3px] h-4 bg-white rounded-full animate-waveform" />
            <div className="w-[3px] h-6 bg-white rounded-full animate-waveform [animation-delay:150ms]" />
            <div className="w-[3px] h-3 bg-white rounded-full animate-waveform [animation-delay:300ms]" />
            <div className="w-[3px] h-7 bg-white rounded-full animate-waveform [animation-delay:450ms]" />
            <div className="w-[3px] h-4 bg-white rounded-full animate-waveform [animation-delay:600ms]" />
          </div>
        )}

        {/* 扬声器图标 - AI 说话 */}
        {isSpeaking && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      {/* 语音识别中间结果文本 */}
      {interimText && (
        <p className="text-sm text-[#8a7e6e] max-w-[240px] text-center animate-fade-in leading-relaxed">
          {interimText}
        </p>
      )}
    </div>
  );
};

export default VoiceButton;
