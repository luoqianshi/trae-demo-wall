import React from 'react';
import type { Goal, Submission } from '../types';

/**
 * 目标详情页 Props
 */
interface GoalDetailPageProps {
  /** 当前目标 */
  goal: Goal;
  /** 该目标的提交记录 */
  submissions: Submission[];
  /** 开始练习 */
  onStartPractice: () => void;
  /** 暂停 / 恢复目标 */
  onPause: () => void;
  /** 返回上一页 */
  onBack: () => void;
}

/**
 * 格式化日期戳为可读字符串
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 根据提交类型返回图标描述
 */
function getSubmissionTypeIcon(type: Submission['type']): string {
  switch (type) {
    case 'image':
      return '\uD83D\uDDBC\uFE0F';       // 🖼️
    case 'audio':
      return '\uD83C\uDFA4';              // 🎤
    case 'text':
      return '\uD83D\uDCDD';              // 📝
  }
}

/**
 * GoalDetailPage -- 目标详情页（改进版）
 *
 * 展示单个目标的完整创作历程，包含时间线、AI 反馈和进步对比。
 */
const GoalDetailPage: React.FC<GoalDetailPageProps> = ({
  goal,
  submissions,
  onStartPractice,
  onPause,
  onBack,
}) => {
  /** 按时间倒序排列的提交记录 */
  const sortedSubmissions = [...submissions].sort((a, b) => b.createdAt - a.createdAt);

  /** 最近两次提交，用于对比 */
  const recentTwo = sortedSubmissions.length >= 2
    ? [sortedSubmissions[0], sortedSubmissions[1]]
    : null;

  /** 目标状态中文标签 */
  const statusLabel: Record<Goal['status'], string> = {
    active: '进行中',
    paused: '暂停中',
    completed: '已完成',
  };

  /** 状态标签颜色 */
  const statusColorMap: Record<Goal['status'], string> = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: '#faf8f5' }}>
      {/* ---- 顶部栏：返回 + 标题 + 状态 ---- */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: 'rgba(250,248,245,0.85)', backdropFilter: 'blur(8px)' }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-70 cursor-pointer"
          style={{ color: '#8a7e6e' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>

        <h2 className="flex-1 text-base font-bold truncate" style={{ color: '#2c2418' }}>
          {goal.title}
        </h2>

        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColorMap[goal.status]}`}>
          {statusLabel[goal.status]}
        </span>
      </div>

      {/* ---- 操作按钮区 ---- */}
      <div className="flex gap-3 px-6 mt-4 mb-6">
        {/* 暂停 / 恢复 */}
        {goal.status !== 'completed' && (
          <button
            type="button"
            onClick={onPause}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            style={{
              backgroundColor: goal.status === 'paused' ? '#5b8c5a' : '#f0ebe4',
              color: goal.status === 'paused' ? '#ffffff' : '#2c2418',
              border: goal.status === 'paused' ? 'none' : '1px solid #e8e0d6',
            }}
          >
            {goal.status === 'paused' ? '恢复目标' : '暂停目标'}
          </button>
        )}

        {/* 继续练习 */}
        <button
          type="button"
          onClick={onStartPractice}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #e07a3a 0%, #c96930 100%)',
          }}
        >
          继续练习
        </button>
      </div>

      {/* ---- 成果时间线 ---- */}
      <div className="px-6">
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#2c2418' }}>
          创作历程
        </h3>

        {sortedSubmissions.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-5xl mb-4 opacity-50">{'\uD83C\uDF1F'}</span>
            <p className="text-sm" style={{ color: '#8a7e6e' }}>
              还没有提交记录，开始第一次练习吧
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* 时间线竖线 */}
            <div
              className="absolute left-[18px] top-2 bottom-2 w-0.5"
              style={{ backgroundColor: '#ece6de' }}
            />

            {sortedSubmissions.map((sub, index) => (
              <div key={sub.id ?? index} className="relative flex gap-4 mb-6 last:mb-0">
                {/* 时间线节点圆点 */}
                <div
                  className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 shadow-sm"
                  style={{
                    backgroundColor: index === 0 ? '#e07a3a' : '#f0ebe4',
                    color: index === 0 ? '#ffffff' : '#8a7e6e',
                  }}
                >
                  {getSubmissionTypeIcon(sub.type)}
                </div>

                {/* 提交内容卡片 */}
                <div
                  className="flex-1 rounded-2xl p-4 shadow-sm"
                  style={{
                    backgroundColor: '#ffffff',
                    border: index === 0 ? '2px solid #e07a3a' : '1px solid #ece6de',
                  }}
                >
                  {/* 提交类型标签 + 日期 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0ea', color: '#8a7e6e' }}>
                      {sub.type === 'image' ? '图片' : sub.type === 'audio' ? '音频' : '文字'}
                    </span>
                    <span className="text-xs" style={{ color: '#b8b0a4' }}>
                      {formatDate(sub.createdAt)}
                    </span>
                  </div>

                  {/* 内容预览 */}
                  {sub.type === 'image' && (
                    <div className="mb-2 rounded-xl overflow-hidden" style={{ backgroundColor: '#f5f0ea' }}>
                      <img
                        src={sub.content}
                        alt={`提交 #${sub.id}`}
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  )}

                  {sub.type === 'audio' && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl" style={{ backgroundColor: '#f5f0ea' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#5b8c5a' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-1.464a5 5 0 010-7.072" />
                      </svg>
                      <span className="text-xs" style={{ color: '#8a7e6e' }}>语音提交</span>
                    </div>
                  )}

                  {sub.type === 'text' && (
                    <p className="text-sm mb-2 leading-relaxed" style={{ color: '#2c2418' }}>
                      {sub.content.length > 100 ? sub.content.slice(0, 100) + '...' : sub.content}
                    </p>
                  )}

                  {/* AI 反馈 */}
                  {sub.aiFeedback && (
                    <div className="mt-2 p-3 rounded-xl" style={{ backgroundColor: 'rgba(91,140,90,0.08)', borderLeft: '3px solid #5b8c5a' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: '#5b8c5a' }}>
                        AI 反馈
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: '#2c2418' }}>
                        {sub.aiFeedback}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- 进步对比区域 ---- */}
      {recentTwo && (
        <div className="px-6 mt-8">
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#2c2418' }}>
            进步对比
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {recentTwo.map((sub, index) => (
              <div
                key={sub.id ?? index}
                className="rounded-2xl overflow-hidden shadow-sm"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #ece6de',
                }}
              >
                {/* 对比标题 */}
                <div className="px-3 py-2 text-center">
                  <span className="text-xs font-medium" style={{ color: index === 0 ? '#e07a3a' : '#8a7e6e' }}>
                    {index === 0 ? '最新' : '上一次'}
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: '#b8b0a4' }}>
                    {formatDate(sub.createdAt)}
                  </span>
                </div>

                {/* 内容预览 */}
                {sub.type === 'image' && (
                  <img
                    src={sub.content}
                    alt={`对比 #${index}`}
                    className="w-full h-32 object-cover"
                  />
                )}

                {sub.type === 'text' && (
                  <div className="px-3 py-3">
                    <p className="text-xs leading-relaxed" style={{ color: '#2c2418' }}>
                      {sub.content.length > 80 ? sub.content.slice(0, 80) + '...' : sub.content}
                    </p>
                  </div>
                )}

                {sub.type === 'audio' && (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-3xl">{'\uD83C\uDFA4'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalDetailPage;
