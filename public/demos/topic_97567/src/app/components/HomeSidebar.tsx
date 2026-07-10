'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { SnowballStage } from '../../lib/snowball-score';
import SnowballCharacter from './SnowballCharacter';
import { getStoryText } from '@/lib/snowball-story-text';
import { useSnowball } from '@/contexts/SnowballContext';

// 动态导入 SnowballStageCard 避免 SSR 问题
const SnowballStageCard = dynamic(() => import('./SnowballStageCard'), { ssr: false });

import { SnowballStageConfig } from '@/lib/snowball-score';

// ─── 接口定义 ────────────────────────────────────────────────────────────────

interface BigTask {
  id: string;
  title: string;
  progress: number;
  status: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: string;
  category: string;
  unlocked: boolean;
  unlocked_at?: string;
}

interface HomeSidebarProps {
  totalRecords: number;
  todayRecordCount: number;
  streakDays: number;
  stageConfig: SnowballStageConfig;
  nextThreshold: number | null;
  bigTasks?: BigTask[];
  tasks?: Task[];
  achievements?: Achievement[];
}

// ─── 层级配置（兼容 5 级体系）────────────────────────────────────────────────

const TIER_CONFIG: Record<string, {
  label: string;
  borderColor: string;
  bgGradient: string;
  tagClass: string;
}> = {
  micro: {
    label: '微',
    borderColor: 'border-l-[#90EE90]',
    bgGradient: 'from-[#F0FFF0] to-[#E8F5E9]',
    tagClass: 'bg-[#90EE90]/80 text-green-700',
  },
  minor: {
    label: '小',
    borderColor: 'border-l-[#87CEEB]',
    bgGradient: 'from-[#F0F8FF] to-[#E0F0FF]',
    tagClass: 'bg-[#87CEEB]/80 text-blue-700',
  },
  growth: {
    label: '成长',
    borderColor: 'border-l-[#FFD700]',
    bgGradient: 'from-[#FFFEF0] to-[#FFF8DC]',
    tagClass: 'bg-[#FFD700]/80 text-amber-700',
  },
  major: {
    label: '大',
    borderColor: 'border-l-[#FF8C00]',
    bgGradient: 'from-[#FFF5EB] to-[#FFE8D0]',
    tagClass: 'bg-[#FF8C00]/80 text-orange-700',
  },
  transformation: {
    label: '蜕变',
    borderColor: 'border-l-[#FF69B4]',
    bgGradient: 'from-[#FFF0F5] via-[#F0F8FF] to-[#FFF0F5]',
    tagClass: 'bg-gradient-to-r from-[#FF69B4]/80 to-[#87CEEB]/80 text-white',
  },
};

// ─── 主组件 ──────────────────────────────────────────────────────────────────

export default function HomeSidebar({
  totalRecords,
  todayRecordCount,
  streakDays,
  stageConfig,
  nextThreshold,
  bigTasks = [],
  tasks = [],
  achievements = [],
}: HomeSidebarProps) {
  const { stage } = useSnowball();
  const activeBigTasks = bigTasks.filter(t => t.status === 'active' || t.status === 'pending');
  const displayBigTasks = activeBigTasks.slice(0, 2);
  const completedBigTasksCount = bigTasks.filter(t => t.status === 'completed').length;

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const displayTasks = pendingTasks.slice(0, 3);
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

  // 获取最近解锁的成就（按解锁时间倒序，取前 3 个）
  const recentUnlocked = achievements
    .filter(a => a.unlocked && a.unlocked_at)
    .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
    .slice(0, 3);

  return (
    <aside className="w-96 space-y-6">
      {/* 雪球状态卡片 */}
      <SnowballStageCard
        totalRecords={totalRecords}
        streakDays={streakDays}
        todayRecordCount={todayRecordCount}
      />

      {/* 最近成就 - 使用真实数据 */}
      <div className="bg-white rounded-3xl shadow-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">🏆 最近成就</h3>
          <Link
            href="/profile"
            className="text-xs text-[#87CEEB] hover:text-[#5BA8D4] transition-colors"
          >
            查看全部 →
          </Link>
        </div>

        {recentUnlocked.length > 0 ? (
          <div className="space-y-3">
            {recentUnlocked.map((achievement) => {
              const tier = TIER_CONFIG[achievement.level] || TIER_CONFIG.micro;
              const unlockedDate = achievement.unlocked_at
                ? new Date(achievement.unlocked_at).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
                : '';

              return (
                <div
                  key={achievement.id}
                  className={`bg-gradient-to-br ${tier.bgGradient} rounded-2xl shadow-sm p-3 border-l-4 ${tier.borderColor} transition-shadow hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-800">{achievement.title}</h4>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tier.tagClass}`}
                        >
                          {tier.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{achievement.description}</p>
                      {unlockedDate && (
                        <p className="text-xs text-[#FFD700] mt-1">{unlockedDate} 解锁</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400 mb-2">还没有解锁成就</p>
            <p className="text-xs text-gray-300">记录小成功来解锁你的第一个成就吧</p>
          </div>
        )}
      </div>

      {/* 长任务进度 - 显示前2个进行中长任务 */}
      <div className="bg-white rounded-3xl shadow-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">🎯 长任务进度</h3>
          <Link
            href="/tasks"
            className="text-xs text-[#87CEEB] hover:text-[#5BA8D4] transition-colors"
          >
            查看长任务 →
          </Link>
        </div>

        {displayBigTasks.length > 0 ? (
          <div className="space-y-4">
            {displayBigTasks.map((task) => (
              <div key={task.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-700 truncate pr-2">{task.title}</span>
                  <span className="text-gray-500 flex-shrink-0 font-medium">{task.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#87CEEB] to-[#5BA8D4] rounded-full transition-all duration-500"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            ))}

            {/* 统计行 */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-400">
              <span>{activeBigTasks.length} 个进行中</span>
              {completedBigTasksCount > 0 && (
                <span>{completedBigTasksCount} 个已完成</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <SnowballCharacter size="sm" />
            <p className="text-sm text-gray-500 font-medium mt-2">{getStoryText('sidebarBigTaskEmpty', stage).main}</p>
            <p className="text-xs text-gray-400 mt-1">{getStoryText('sidebarBigTaskEmpty', stage).sub}</p>
            <Link
              href="/tasks"
              className="text-sm text-[#87CEEB] hover:text-[#5BA8D4] transition-colors mt-2"
            >
              去创建长任务 →
            </Link>
          </div>
        )}
      </div>

      {/* 今日待办 - 显示前3个具体任务 */}
      <div className="bg-white rounded-3xl shadow-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">✅ 今日待办</h3>
          <Link
            href="/tasks"
            className="text-xs text-[#87CEEB] hover:text-[#5BA8D4] transition-colors"
          >
            管理任务 →
          </Link>
        </div>

        {displayTasks.length > 0 ? (
          <div className="space-y-2.5">
            {displayTasks.map((task) => {
              const isInProgress = task.status === 'in_progress';
              const priorityColor = task.priority === 'high'
                ? 'bg-[#FF6B6B]/10 text-[#FF6B6B]'
                : task.priority === 'low'
                ? 'bg-gray-100 text-gray-400'
                : 'bg-[#FFD700]/10 text-[#DAA520]';

              const priorityLabel = task.priority === 'high'
                ? '高'
                : task.priority === 'low'
                ? '低'
                : '中';

              return (
                <Link
                  key={task.id}
                  href="/tasks"
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 transition-colors group"
                >
                  {/* 状态指示器 */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isInProgress ? 'bg-[#87CEEB]' : 'bg-gray-300'
                  }`} />
                  {/* 任务标题 */}
                  <span className={`text-sm flex-1 truncate ${
                    isInProgress ? 'text-gray-800 font-medium' : 'text-gray-600'
                  }`}>
                    {task.title}
                  </span>
                  {/* 优先级标签 */}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${priorityColor}`}>
                    {priorityLabel}
                  </span>
                </Link>
              );
            })}

            {/* 统计行 */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-400">
              <span>{pendingTasks.length} 项待完成</span>
              {completedTasksCount > 0 && (
                <span>{completedTasksCount} 已完成</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <SnowballCharacter size="sm" />
            <p className="text-sm text-gray-500 font-medium mt-2">
              {completedTasksCount > 0 ? getStoryText('sidebarTodoAllDone', stage).main : getStoryText('sidebarTodoEmpty', stage).main}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {completedTasksCount > 0 ? getStoryText('sidebarTodoAllDone', stage).sub : getStoryText('sidebarTodoEmpty', stage).sub}
            </p>
            <Link
              href="/tasks"
              className="text-sm text-[#87CEEB] hover:text-[#5BA8D4] transition-colors mt-2"
            >
              {completedTasksCount > 0 ? '查看已完成' : '去创建任务 →'}
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
