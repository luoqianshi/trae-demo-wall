import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { LEVEL_THRESHOLDS, LEVEL_REWARDS } from '@/types';

export function Level() {
  const navigate = useNavigate();
  const { level } = useStore();
  
  const currentLevelTime = level.level > 1 ? LEVEL_THRESHOLDS[level.level - 1] : 0;
  const nextLevelTime = LEVEL_THRESHOLDS[level.level] || 0;
  const progress = ((level.totalFocusTime - currentLevelTime) / (nextLevelTime - currentLevelTime)) * 100 || 0;
  
  const getLevelEmoji = (lvl: number) => {
    const emojis = ['🌱', '🌿', '🌳', '🏡', '🏰', '🌟', '💎', '👑'];
    return emojis[lvl - 1] || '⭐';
  };
  
  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'outfit':
        return '👗';
      case 'animation':
        return '🎬';
      case 'personality':
        return '💝';
      default:
        return '🎁';
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-warm to-soft p-4">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-sm">
            <span>←</span>
          </button>
          <h1 className="text-xl font-bold text-gray-800">等级体系</h1>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-4xl shadow-lg">
              {getLevelEmoji(level.level)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Lv.{level.level}</h2>
              <p className="text-sm text-gray-500">累计专注 {level.totalFocusTime} 小时</p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">当前进度</span>
              <span className="font-semibold text-primary">
                {level.totalFocusTime}h / {nextLevelTime}h
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              还需 <span className="font-bold text-secondary">{nextLevelTime - level.totalFocusTime}</span> 小时升级
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">已解锁奖励</h3>
          
          {level.unlockedItems.length === 0 ? (
            <p className="text-center text-gray-500 py-4">继续学习解锁更多奖励!</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {level.unlockedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-warm rounded-xl p-4 flex items-center gap-3"
                >
                  <span className="text-2xl">{getRewardIcon(item.type)}</span>
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.type === 'outfit' ? '装扮' : item.type === 'animation' ? '动画' : '性格'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">等级预览</h3>
          
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => {
              const rewards = LEVEL_REWARDS[lvl] || [];
              const isUnlocked = lvl <= level.level;
              
              return (
                <div
                  key={lvl}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isUnlocked ? 'bg-warm' : 'bg-gray-100 opacity-60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      isUnlocked ? 'bg-primary text-white' : 'bg-gray-300 text-gray-500'
                    }`}
                  >
                    {isUnlocked ? getLevelEmoji(lvl) : '🔒'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                        Lv.{lvl}
                      </span>
                      {isUnlocked && <span className="text-green-500 text-xs">✓ 已解锁</span>}
                    </div>
                    <div className="text-xs text-gray-500">
                      {lvl === 1 ? '入门级' : `${LEVEL_THRESHOLDS[lvl - 1]}小时`}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {rewards.map((reward, idx) => (
                      <span key={idx} className="text-lg">
                        {isUnlocked ? getRewardIcon(reward.type) : '?'}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <button
          onClick={() => navigate('/')}
          className="w-full mt-6 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
