import type { Achievement } from '../store/useStore';

interface AchievementBadgeProps {
  achievement: Achievement;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  return (
    <div
      className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
        achievement.unlocked
          ? 'bg-gradient-to-br from-amber-50 to-orange-50'
          : 'bg-gray-100 opacity-60'
      }`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-2 ${
          achievement.unlocked
            ? 'bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-500/30'
            : 'bg-gray-200'
        }`}
      >
        {achievement.icon}
      </div>
      <span
        className={`text-xs font-medium text-center ${
          achievement.unlocked ? 'text-gray-800' : 'text-gray-400'
        }`}
      >
        {achievement.name}
      </span>
      {achievement.unlocked && achievement.unlockedAt && (
        <span className="text-[10px] text-gray-400 mt-0.5">
          {new Date(achievement.unlockedAt).toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      )}
    </div>
  );
}
