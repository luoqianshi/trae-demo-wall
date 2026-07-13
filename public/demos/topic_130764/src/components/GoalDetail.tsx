import React from 'react';
import type { Goal, GoalStatus, Submission, SubmissionType } from '../types';

interface GoalDetailProps {
  goal: Goal;
  submissions: Submission[];
  onBack: () => void;
  onPause: () => void;
}

/** 状态样式 */
const statusLabel: Record<GoalStatus, string> = {
  active: '进行中',
  paused: '已暂停',
  completed: '已完成',
};

/** 成果类型图标 */
const SubmissionIcon: React.FC<{ type: SubmissionType }> = ({ type }) => {
  switch (type) {
    case 'image':
      return (
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
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    case 'audio':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#5b8c5a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      );
    case 'text':
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8a7e6e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
  }
};

const GoalDetail: React.FC<GoalDetailProps> = ({
  goal,
  submissions,
  onBack,
  onPause,
}) => {
  const formatDate = (ts: number): string => {
    return new Date(ts).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* 顶部导航 */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[#e8e2da]">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-[#f0ebe5] text-[#8a7e6e] hover:bg-[#e8e2da] transition-colors cursor-pointer"
          aria-label="返回"
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
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-[#2c2418] truncate">{goal.title}</h2>
          {goal.description && (
            <p className="text-xs text-[#8a7e6e] truncate">{goal.description}</p>
          )}
        </div>
        {/* 状态标签 */}
        <span className={`text-xs px-2.5 py-1 rounded-full border flex-shrink-0 ${
          goal.status === 'active'
            ? 'bg-[#5b8c5a]/10 text-[#5b8c5a] border-[#5b8c5a]/20'
            : goal.status === 'paused'
              ? 'bg-[#d4a843]/10 text-[#d4a843] border-[#d4a843]/20'
              : 'bg-[#8a7e6e]/10 text-[#8a7e6e] border-[#8a7e6e]/20'
        }`}>
          {statusLabel[goal.status]}
        </span>
        {/* 暂停/恢复按钮 */}
        <button
          onClick={onPause}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-[#f0ebe5] text-[#8a7e6e] hover:bg-[#e8e2da] transition-colors cursor-pointer flex-shrink-0"
          aria-label={goal.status === 'active' ? '暂停目标' : '恢复目标'}
        >
          {goal.status === 'active' ? (
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
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
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
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {/* 成果时间线 */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-medium text-[#2c2418] mb-3">
            练习记录
            <span className="ml-1.5 text-xs font-normal text-[#8a7e6e]">
              ({submissions.length}次提交)
            </span>
          </h3>

          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#f0ebe5] flex items-center justify-center mx-auto mb-3">
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
              <p className="text-sm text-[#8a7e6e]">还没有练习记录，快去提交你的第一次成果吧</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {/* 时间线竖线 */}
              <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-[#e8e2da]" />

              {submissions.map((sub, index) => (
                <div key={sub.id} className="relative flex gap-3 pb-6 animate-fade-in-up" style={{ animationDelay: `${index * 80}ms` }}>
                  {/* 时间线节点 */}
                  <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-xl bg-white border border-[#e8e2da] flex items-center justify-center shadow-sm">
                    <SubmissionIcon type={sub.type} />
                  </div>

                  {/* 提交内容 */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    {/* 图片缩略图或内容预览 */}
                    {sub.type === 'image' && (
                      <div className="w-full aspect-[4/3] rounded-lg bg-[#f0ebe5] mb-2 overflow-hidden flex items-center justify-center">
                        <img
                          src={sub.content}
                          alt={`第${index + 1}次提交`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {sub.type === 'text' && (
                      <div className="bg-[#f0ebe5] rounded-lg px-3 py-2 mb-2 text-sm text-[#2c2418]">
                        {sub.content}
                      </div>
                    )}
                    {sub.type === 'audio' && (
                      <div className="bg-[#f0ebe5] rounded-lg px-3 py-2 mb-2 flex items-center gap-2 text-sm text-[#5b8c5a]">
                        <SubmissionIcon type="audio" />
                        <span>语音练习录音</span>
                      </div>
                    )}

                    {/* AI 反馈 */}
                    {sub.aiFeedback && (
                      <div className="bg-white rounded-lg border border-[#e8e2da] px-3 py-2 text-sm text-[#2c2418] leading-relaxed">
                        <span className="text-xs text-[#e07a3a] font-medium">溯光：</span>
                        {sub.aiFeedback}
                      </div>
                    )}

                    {/* 时间 */}
                    <p className="text-xs text-[#b8b0a4] mt-1.5">
                      {formatDate(sub.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 进步对比区域 - 当有 >= 2 次提交时显示 */}
        {submissions.length >= 2 && (
          <div className="px-4 py-4 border-t border-[#e8e2da]">
            <h3 className="text-sm font-medium text-[#2c2418] mb-3">进步对比</h3>
            <div className="flex gap-3">
              {submissions
                .slice(-2)
                .map((sub, index) => (
                  <div
                    key={sub.id}
                    className="flex-1 bg-white rounded-xl border border-[#e8e2da] overflow-hidden"
                  >
                    <div className="aspect-[4/3] bg-[#f0ebe5] flex items-center justify-center">
                      {sub.type === 'image' ? (
                        <img
                          src={sub.content}
                          alt={`对比${index === 0 ? '上一次' : '最新'}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center text-xs text-[#8a7e6e]">
                          <SubmissionIcon type={sub.type} />
                          <p className="mt-1">{sub.type === 'text' ? '文字' : '音频'}</p>
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-xs text-[#8a7e6e]">
                        {index === 0 ? '上一次' : '最新'} - {formatDate(sub.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalDetail;
