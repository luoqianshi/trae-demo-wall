import { Trophy, Clock, Target, Flame, Trash2, TrendingUp, Award, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { StatsChart } from './StatsChart';
import { AchievementBadge } from './AchievementBadge';
import { AIInsightsPanel } from './AIInsightsPanel';
import { EnhancedCharts } from './EnhancedCharts';
import { getLevel } from '../data/tasks';

export function ProfilePage() {
  const { stats, achievements, checkIns, removeCheckIn } = useStore();

  const levelInfo = getLevel(stats.totalMinutes);

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
    }
    return `${minutes}分钟`;
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const sortedCheckIns = [...checkIns].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 px-5 pt-12 pb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16 blur-3xl" />

        <div className="relative flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl shadow-lg">
            🌟
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-0.5">我的公益</h1>
            <p className="text-violet-100 text-sm">Lv.{levelInfo.level} · {levelInfo.name}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-violet-200 mb-0.5">等级进度</div>
            <div className="text-lg font-bold">{levelInfo.progress.toFixed(0)}%</div>
          </div>
        </div>

        {/* Level bar */}
        <div className="relative bg-white/15 backdrop-blur rounded-2xl p-4 border border-white/20 mb-5">
          <div className="flex items-center justify-between mb-2 text-xs text-violet-100">
            <span>当前时长：{stats.totalMinutes} 分钟</span>
            <span>下一级：{levelInfo.nextLevel} 分钟</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-yellow-200 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, levelInfo.progress)}%` }}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="relative grid grid-cols-2 gap-3">
          <div className="bg-white/20 backdrop-blur rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-violet-200 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">累计时长</span>
            </div>
            <p className="text-white text-xl font-bold">{formatTime(stats.totalMinutes)}</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-violet-200 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs">打卡次数</span>
            </div>
            <p className="text-white text-xl font-bold">{stats.totalCheckIns}次</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-violet-200 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs">当前连续</span>
            </div>
            <p className="text-white text-xl font-bold">{stats.currentStreak}天</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-violet-200 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-xs">成就徽章</span>
            </div>
            <p className="text-white text-xl font-bold">{unlockedCount}/{achievements.length}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* AI Insights */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-800 text-sm">AI 数据分析</h3>
          </div>
          <AIInsightsPanel />
        </div>

        {/* Enhanced Charts */}
        <EnhancedCharts />

        {/* Weekly Chart */}
        <StatsChart />

        {/* Achievements */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-800 text-sm">成就徽章</h3>
            <span className="ml-auto text-xs text-gray-400">{unlockedCount}/{achievements.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </div>

        {/* Check-in History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-gray-800 text-sm">打卡记录</h3>
            <span className="ml-auto text-xs text-gray-400">共 {sortedCheckIns.length} 条</span>
          </div>

          {sortedCheckIns.length > 0 ? (
            <div className="space-y-2">
              {sortedCheckIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 border border-gray-50"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    checkIn.category === '环保' ? 'bg-emerald-100' :
                    checkIn.category === '捐赠' ? 'bg-rose-100' :
                    checkIn.category === '帮扶' ? 'bg-violet-100' :
                    'bg-sky-100'
                  }`}>
                    {checkIn.taskIcon || (
                      checkIn.category === '环保' ? '🌿' :
                      checkIn.category === '捐赠' ? '🎁' :
                      checkIn.category === '帮扶' ? '💝' : '📢'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 text-sm truncate">{checkIn.taskName}</h4>
                    <p className="text-xs text-gray-400">
                      {new Date(checkIn.timestamp).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-xs text-emerald-500 font-medium">+{checkIn.duration}分</span>
                    <button
                      onClick={() => removeCheckIn(checkIn.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center border border-gray-50">
              <span className="text-5xl mb-3 block">📝</span>
              <p className="text-gray-500 text-sm mb-1">还没有打卡记录</p>
              <p className="text-xs text-gray-400">去首页选择一个任务开始吧</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
