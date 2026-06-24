import { useState } from 'react';
import { Heart, Target, TrendingUp, Flame, Sparkles, ChevronRight, Trophy, BookOpen } from 'lucide-react';
import { tasks, categories, getLevel } from '../data/tasks';
import { TaskCard } from './TaskCard';
import { CaptionModal } from './CaptionModal';
import { AchievementModal } from './CheckInModal';
import { CelebrationModal } from './CelebrationModal';
import { TaskDetailModal } from './TaskDetailModal';
import { LeaderboardModal } from './LeaderboardModal';
import { DiaryModal } from './DiaryModal';
import { ChallengeCard } from './ChallengeCard';
import { NewsSection } from './NewsSection';
import { Onboarding } from './Onboarding';
import { useStore } from '../store/useStore';
import { getAITaskRecommendations, getDailyTheme } from '../ai/recommendation';
import { getMotivationalMessage, getUserPersona } from '../ai/insights';
import { generateDiaryEntry } from '../data/diary';
import type { Task } from '../data/tasks';

export function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState<Task | null>(null);
  const [showCelebration, setShowCelebration] = useState<Task | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const { addCheckIn, stats, newAchievement, clearNewAchievement, checkIns, hasCompletedOnboarding, completeOnboarding, addDiaryEntry } = useStore();

  const filteredTasks = selectedCategory === '全部'
    ? tasks
    : tasks.filter(t => t.category === selectedCategory);

  const levelInfo = getLevel(stats.totalMinutes);
  const recs = getAITaskRecommendations(stats, checkIns, 3);
  const dailyTheme = getDailyTheme();
  const persona = getUserPersona(stats);
  const moti = getMotivationalMessage(stats, checkIns.length === 0 ? 999 : Math.floor((Date.now() - checkIns[checkIns.length - 1].timestamp) / 3600000));

  const handleCheckIn = (task: Task) => {
    setShowTaskDetail(task);
  };

  const handleConfirmCheckIn = (task: Task) => {
    setShowTaskDetail(null);
    setShowCelebration(task);
  };

  const handleCelebrationClose = () => {
    if (showCelebration) {
      addCheckIn({
        id: showCelebration.id,
        name: showCelebration.name,
        icon: showCelebration.icon,
        category: showCelebration.category,
        duration: showCelebration.duration,
        difficulty: showCelebration.difficulty,
      });
      // Add diary entry
      const diaryEntry = generateDiaryEntry(
        showCelebration.name,
        showCelebration.icon,
        showCelebration.category,
        showCelebration.duration,
        Date.now()
      );
      addDiaryEntry(diaryEntry);
      setShowCelebration(null);
      setSelectedTask(null);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
    }
    return `${minutes}分钟`;
  };

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-24">
      {/* Header with AI feel */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 px-5 pt-12 pb-10 text-white relative overflow-hidden">
        {/* Decorative blurs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16 blur-3xl" />

        <div className="relative flex items-start justify-between mb-5">
          <div>
            <p className="text-emerald-100 text-xs mb-1">{moti.message}</p>
            <h1 className="text-2xl font-bold">公益随手做</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDiary(true)}
              className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white/30 transition-all"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white/30 transition-all"
            >
              <Trophy className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Level Progress */}
        <div className="relative bg-white/15 backdrop-blur rounded-2xl p-4 border border-white/20 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                Lv.{levelInfo.level}
              </span>
              <span className="text-sm font-semibold">{levelInfo.name}</span>
            </div>
            <span className="text-xs text-white/80">
              距离升级还需 {Math.max(0, levelInfo.nextLevel - stats.totalMinutes)} 分钟
            </span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-yellow-200 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, levelInfo.progress)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-white/80">
            <span>当前：{stats.totalMinutes} 分钟</span>
            <span>下一级：{levelInfo.nextLevel} 分钟</span>
          </div>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur rounded-2xl p-3 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1 text-white mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-lg font-bold">{stats.currentStreak}</span>
            </div>
            <p className="text-xs text-emerald-100">连续天数</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-2xl p-3 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1 text-white mb-1">
              <Target className="w-4 h-4" />
              <span className="text-lg font-bold">{stats.totalCheckIns}</span>
            </div>
            <p className="text-xs text-emerald-100">累计打卡</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-2xl p-3 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1 text-white mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-bold">{formatTime(stats.totalMinutes)}</span>
            </div>
            <p className="text-xs text-emerald-100">公益时长</p>
          </div>
        </div>
      </div>

      {/* Daily Theme Card */}
      <div className="px-5 -mt-5 mb-4 relative z-10">
        <div className={`bg-gradient-to-r ${dailyTheme.color} rounded-2xl p-4 text-white shadow-lg shadow-purple-500/20`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80 mb-0.5">今日主题</p>
              <h2 className="text-lg font-bold mb-1">{dailyTheme.emoji} {dailyTheme.title}</h2>
              <p className="text-xs text-white/90">{dailyTheme.subtitle}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70 mb-1">你的公益画像</p>
              <p className="text-sm font-semibold">{persona.persona}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Card */}
      <div className="px-5 mb-4">
        <ChallengeCard />
      </div>

      {/* AI Recommendations */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h2 className="font-semibold text-gray-800 text-sm">AI 智能推荐</h2>
          </div>
          <span className="text-xs text-gray-400">基于你的偏好 · 实时更新</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {recs.map((rec, idx) => (
            <div
              key={rec.task.id}
              onClick={() => setShowTaskDetail(rec.task)}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-50 cursor-pointer"
            >
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-4 py-2 flex items-center justify-between border-b border-indigo-100/50">
                <span className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI 推荐 #{idx + 1}
                </span>
                <span className="text-xs text-gray-500">
                  +{rec.task.reward}分 · {rec.task.duration}分钟
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl flex-shrink-0">
                    {rec.task.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm mb-1">{rec.task.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{rec.task.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {rec.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full border border-slate-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {rec.reason && (
                  <div className="bg-gradient-to-r from-indigo-50/70 to-purple-50/70 rounded-xl p-2.5 mb-3 border border-indigo-100/50">
                    <p className="text-xs text-indigo-700 leading-relaxed">💡 {rec.reason}</p>
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleConfirmCheckIn(rec.task); }}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-1 hover:opacity-95 transition-all active:scale-95 shadow-md shadow-indigo-500/15"
                >
                  <Heart className="w-4 h-4" />
                  去打卡
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-5 mb-3">
        <h2 className="font-semibold text-gray-800 text-sm mb-3">更多任务</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white text-gray-600 hover:bg-emerald-50 border border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="px-5 space-y-3 mb-5">
        {filteredTasks.map((task) => (
          <div key={task.id} onClick={() => setShowTaskDetail(task)} className="cursor-pointer">
            <TaskCard task={task} onCheckIn={handleConfirmCheckIn} />
          </div>
        ))}
      </div>

      {/* News Section */}
      <div className="px-5 mb-5">
        <NewsSection />
      </div>

      {/* Modals */}
      {showTaskDetail && (
        <TaskDetailModal
          task={showTaskDetail}
          onClose={() => setShowTaskDetail(null)}
          onCheckIn={handleConfirmCheckIn}
        />
      )}

      {showCelebration && (
        <CelebrationModal
          task={showCelebration}
          onClose={handleCelebrationClose}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )}

      {showDiary && (
        <DiaryModal onClose={() => setShowDiary(false)} />
      )}

      {newAchievement && (
        <AchievementModal
          achievement={newAchievement}
          onClose={clearNewAchievement}
        />
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}