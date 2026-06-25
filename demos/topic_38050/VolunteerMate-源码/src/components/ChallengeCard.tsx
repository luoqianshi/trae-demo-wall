import { useState } from 'react';
import { Flame, Trophy, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { challenges, Challenge, startChallenge } from '../data/challenges';
import { useStore } from '../store/useStore';

export function ChallengeCard() {
  const { stats, checkIns } = useStore();
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Calculate progress based on challenge type
  const calculateProgress = (challenge: Challenge): number => {
    if (!challenge.startDate) return 0;

    switch (challenge.id) {
      case 'challenge_1':
        // 7日连续打卡
        return stats.currentStreak;
      case 'challenge_2':
        // 环保类任务
        return stats.environmentalTasks;
      case 'challenge_3':
        // 帮扶类任务
        return stats.helpTasks;
      case 'challenge_4':
        // 累计时长
        return Math.floor(stats.totalMinutes / 60);
      case 'challenge_5':
        // 不同类型任务
        const categories = new Set(checkIns.map(c => c.category));
        return categories.size;
      default:
        return 0;
    }
  };

  const getProgressPercent = (challenge: Challenge): number => {
    const progress = calculateProgress(challenge);
    const target = challenge.id === 'challenge_4' ? 60 :
                   challenge.id === 'challenge_5' ? 4 :
                   challenge.days;
    return Math.min(100, (progress / target) * 100);
  };

  const handleStartChallenge = (challenge: Challenge) => {
    const started = startChallenge(challenge);
    setActiveChallenge(started);
  };

  const displayChallenge = activeChallenge || challenges[0];
  const progressPercent = activeChallenge ? getProgressPercent(activeChallenge) : 0;
  const isCompleted = progressPercent >= 100;

  if (!showAll) {
    return (
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-medium">7日公益挑战</span>
          </div>
          <button
            onClick={() => setShowAll(true)}
            className="text-xs bg-white/20 px-2 py-1 rounded-full hover:bg-white/30 transition-all"
          >
            更多挑战
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
            {displayChallenge.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-0.5">{displayChallenge.title}</h3>
            <p className="text-xs text-white/80">{displayChallenge.description}</p>
          </div>
        </div>

        {activeChallenge ? (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>进度：{calculateProgress(activeChallenge)} / {
                activeChallenge.id === 'challenge_4' ? 60 :
                activeChallenge.id === 'challenge_5' ? 4 : activeChallenge.days
              }</span>
              <span>{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-yellow-300 to-amber-300'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-3 bg-white/10 rounded-xl p-2">
            <Trophy className="w-4 h-4" />
            <span className="text-xs">完成可获得「{displayChallenge.badge}」徽章 +{displayChallenge.reward}积分</span>
          </div>
        )}

        <button
          onClick={() => activeChallenge ? null : handleStartChallenge(displayChallenge)}
          className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
            activeChallenge
              ? isCompleted
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-white'
                : 'bg-white/20 text-white'
              : 'bg-white text-orange-600 hover:bg-white/90'
          }`}
        >
          {activeChallenge ? (
            isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                已完成！领取奖励
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                进行中 · 继续加油
              </>
            )
          ) : (
            <>
              <Flame className="w-4 h-4" />
              开始挑战
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5" />
          <span className="font-semibold">公益挑战</span>
        </div>
        <button
          onClick={() => setShowAll(false)}
          className="text-xs bg-white/20 px-2 py-1 rounded-full"
        >
          收起
        </button>
      </div>

      <div className="p-4 space-y-3">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-3 border border-slate-100 hover:border-orange-200 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-lg">
                {challenge.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm text-gray-800">{challenge.title}</h4>
                <p className="text-xs text-gray-500">{challenge.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">
                  {challenge.days}天
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">
                  +{challenge.reward}分
                </span>
              </div>
              <button
                onClick={() => handleStartChallenge(challenge)}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-xs font-medium hover:opacity-95 transition-all"
              >
                参与
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}