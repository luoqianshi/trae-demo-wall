import React from 'react';

interface HeaderProps {
  onShowGoals: () => void;
  onShowSettings: () => void;
  hasActiveGoals: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onShowGoals,
  onShowSettings,
  hasActiveGoals,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8f5]/95 backdrop-blur-sm border-b border-[#e8e2da]">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        {/* 左侧：Logo + 副标题 */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e07a3a] to-[#d06a2a] flex items-center justify-center shadow-sm">
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
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-[#2c2418] leading-tight">溯光</h1>
            <p className="text-[10px] text-[#8a7e6e] leading-tight">陪你一起变更好</p>
          </div>
        </div>

        {/* 右侧：按钮组 */}
        <div className="flex items-center gap-2">
          {/* 目标列表按钮 */}
          <button
            onClick={onShowGoals}
            className={`
              relative w-9 h-9 rounded-full flex items-center justify-center
              transition-colors cursor-pointer
              ${hasActiveGoals
                ? 'bg-[#e07a3a]/10 text-[#e07a3a] hover:bg-[#e07a3a]/20'
                : 'bg-[#f0ebe5] text-[#8a7e6e] hover:bg-[#e8e2da]'
              }
            `}
            aria-label="查看目标"
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {/* 活跃目标指示点 */}
            {hasActiveGoals && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#e07a3a] animate-pulse" />
            )}
          </button>

          {/* 设置按钮 */}
          <button
            onClick={onShowSettings}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[#f0ebe5] text-[#8a7e6e] hover:bg-[#e8e2da] transition-colors cursor-pointer"
            aria-label="设置"
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
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
