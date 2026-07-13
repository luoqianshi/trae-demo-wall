import React, { useMemo } from 'react';
import type { Goal } from '../types';

/**
 * 个人中心 Props
 */
interface ProfilePageProps {
  /** 用户所有目标 */
  goals: Goal[];
  /** 选中某个目标 */
  onSelectGoal: (goal: Goal) => void;
  /** 创建新目标 */
  onCreateGoal: () => void;
  /** 返回上一页 */
  onBack: () => void;
}

// ---- 目标名称 → 图标映射 ----
const GOAL_ICONS: Record<string, string> = {
  '练字': '\u270D\uFE0F',     // ✍️
  '写字': '\u270D\uFE0F',     // ✍️
  '跑步': '\uD83C\uDFC3',     // 🏃
  '阅读': '\uD83D\uDCDA',     // 📚
  '读书': '\uD83D\uDCDA',     // 📚
  '吉他': '\uD83C\uDFB8',     // 🎸
  '画画': '\uD83C\uDFA8',     // 🎨
  '绘画': '\uD83C\uDFA8',     // 🎨
};

/**
 * 根据目标标题匹配图标
 */
function getGoalIcon(title: string): string {
  for (const [keyword, icon] of Object.entries(GOAL_ICONS)) {
    if (title.includes(keyword)) {
      return icon;
    }
  }
  return '\uD83C\uDFAF'; // 🎯 默认图标
}

/**
 * 目标状态 → 中文标签 + 样式
 */
function getStatusLabel(status: Goal['status']): { label: string; colorClass: string } {
  switch (status) {
    case 'active':
      return { label: '进行中', colorClass: 'bg-green-100 text-green-700' };
    case 'paused':
      return { label: '暂停', colorClass: 'bg-yellow-100 text-yellow-700' };
    case 'completed':
      return { label: '已完成', colorClass: 'bg-blue-100 text-blue-700' };
  }
}

/**
 * ProfilePage -- 个人中心
 *
 * 展示用户头像、昵称、统计数据，以及按目标生成的文件夹列表。
 */
const ProfilePage: React.FC<ProfilePageProps> = ({
  goals,
  onSelectGoal,
  onCreateGoal,
  onBack,
}) => {
  // ---- 统计数据 ----
  const stats = useMemo(() => {
    // Goal 类型没有 submissionCount 字段，统计暂设为 0
    const totalSubmissions = 0;
    return {
      goalCount: goals.length,
      totalSubmissions,
      // 连续天数暂用固定值占位（需结合实际数据计算）
      streakDays: 7,
    };
  }, [goals]);

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: '#faf8f5' }}>
      {/* ---- 顶部返回栏 ---- */}
      <div className="sticky top-0 z-20 flex items-center px-4 py-3"
           style={{ backgroundColor: 'rgba(250,248,245,0.85)', backdropFilter: 'blur(8px)' }}>
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
      </div>

      {/* ---- 用户信息区域 ---- */}
      <div className="flex flex-col items-center mt-4 mb-8 px-6">
        {/* 头像 */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md mb-3"
          style={{ background: 'linear-gradient(135deg, #e07a3a 0%, #c96930 100%)' }}
        >
          溯
        </div>

        {/* 昵称 */}
        <h2 className="text-xl font-bold mb-1" style={{ color: '#2c2418' }}>
          溯光用户
        </h2>

        {/* 统计卡片 */}
        <div className="flex gap-6 mt-4">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: '#e07a3a' }}>{stats.goalCount}</span>
            <span className="text-xs mt-1" style={{ color: '#8a7e6e' }}>目标数</span>
          </div>
          <div className="w-px h-10" style={{ backgroundColor: '#e8e0d6' }} />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: '#e07a3a' }}>{stats.totalSubmissions}</span>
            <span className="text-xs mt-1" style={{ color: '#8a7e6e' }}>总提交</span>
          </div>
          <div className="w-px h-10" style={{ backgroundColor: '#e8e0d6' }} />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: '#e07a3a' }}>{stats.streakDays}</span>
            <span className="text-xs mt-1" style={{ color: '#8a7e6e' }}>连续天数</span>
          </div>
        </div>
      </div>

      {/* ---- 文件夹区域 ---- */}
      <div className="px-6">
        {/* 标题栏 + 创建按钮 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: '#2c2418' }}>
            我的目标
          </h3>
          <button
            type="button"
            onClick={onCreateGoal}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #e07a3a 0%, #c96930 100%)' }}
            title="创建新目标"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* 文件夹列表 */}
        {goals.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-5xl mb-4 opacity-50">{'\uD83D\uDCC1'}</span>
            <p className="text-sm" style={{ color: '#8a7e6e' }}>
              还没有目标哦，点击上方 + 号创建一个吧
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {goals.map((goal) => {
              const icon = getGoalIcon(goal.title);
              const status = getStatusLabel(goal.status);
              const submissionCount = (goal as Goal & { submissionCount?: number }).submissionCount ?? 0;

              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => onSelectGoal(goal)}
                  className="relative flex flex-col items-start p-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-sm cursor-pointer"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #ece6de',
                  }}
                >
                  {/* 图标 */}
                  <span className="text-3xl mb-2">{icon}</span>

                  {/* 标题 */}
                  <h4
                    className="text-sm font-semibold truncate w-full mb-1"
                    style={{ color: '#2c2418' }}
                  >
                    {goal.title}
                  </h4>

                  {/* 提交次数 */}
                  <p className="text-xs mb-2" style={{ color: '#8a7e6e' }}>
                    提交了 {submissionCount} 次
                  </p>

                  {/* 状态标签 */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.colorClass}`}>
                    {status.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- 底部区域 ---- */}
      <div className="mt-10 px-6 flex flex-col items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            backgroundColor: '#f0ebe4',
            color: '#2c2418',
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          设置
        </button>

        <p className="text-xs" style={{ color: '#b8b0a4' }}>
          关于溯光 v1.0.0
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
