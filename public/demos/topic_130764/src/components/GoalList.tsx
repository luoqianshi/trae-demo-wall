import React from 'react';
import type { Goal, GoalStatus } from '../types';

interface GoalListProps {
  goals: Goal[];
  onSelectGoal: (goal: Goal) => void;
  onCreateGoal: () => void;
}

/** 频率文本映射 */
const frequencyLabel = (freq: Goal['frequency']): string => {
  switch (freq) {
    case 'daily': return '每天';
    case 'weekly': return '每周';
    case 'custom': return '自定义';
    default: return '';
  }
};

/** 状态样式映射 */
const statusConfig: Record<GoalStatus, { label: string; className: string }> = {
  active: {
    label: '进行中',
    className: 'bg-[#5b8c5a]/10 text-[#5b8c5a] border-[#5b8c5a]/20',
  },
  paused: {
    label: '已暂停',
    className: 'bg-[#d4a843]/10 text-[#d4a843] border-[#d4a843]/20',
  },
  completed: {
    label: '已完成',
    className: 'bg-[#8a7e6e]/10 text-[#8a7e6e] border-[#8a7e6e]/20',
  },
};

const GoalList: React.FC<GoalListProps> = ({
  goals,
  onSelectGoal,
  onCreateGoal,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* 页面标题 */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <h2 className="text-xl font-semibold text-[#2c2418]">我的目标</h2>
        <p className="text-sm text-[#8a7e6e] mt-0.5">坚持每一步，溯光陪着你</p>
      </div>

      {/* 目标列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {goals.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-[#f0ebe5] flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8a7e6e"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-9 h-9"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <p className="text-[#8a7e6e] text-sm leading-relaxed max-w-[240px]">
              还没有目标，告诉溯光你想做什么吧
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const status = statusConfig[goal.status];
              return (
                <button
                  key={goal.id}
                  onClick={() => onSelectGoal(goal)}
                  className="w-full text-left bg-white rounded-xl border border-[#e8e2da] p-4 hover:shadow-md hover:border-[#e07a3a]/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* 目标标题 */}
                      <h3 className="text-base font-medium text-[#2c2418] group-hover:text-[#e07a3a] transition-colors truncate">
                        {goal.title}
                      </h3>
                      {/* 描述 */}
                      {goal.description && (
                        <p className="text-sm text-[#8a7e6e] mt-0.5 line-clamp-2">
                          {goal.description}
                        </p>
                      )}
                      {/* 频率 + 状态 */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-[#8a7e6e]">
                          {frequencyLabel(goal.frequency)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* 右侧进度指示 */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-[#f0ebe5] flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#e07a3a"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-5 h-5"
                        >
                          <polyline points="9 11 12 14 22 4" />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* 创建时间 */}
                  <div className="mt-2 pt-2 border-t border-[#f0ebe5]">
                    <span className="text-xs text-[#b8b0a4]">
                      创建于 {new Date(goal.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部：创建新目标按钮 */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-[#e8e2da] bg-[#faf8f5]">
        <button
          onClick={onCreateGoal}
          className="w-full h-11 rounded-full bg-[#e07a3a] text-white text-sm font-medium hover:bg-[#d06a2a] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          创建新目标
        </button>
      </div>
    </div>
  );
};

export default GoalList;
