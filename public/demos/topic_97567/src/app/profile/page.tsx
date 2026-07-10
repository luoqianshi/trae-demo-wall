'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { usePageView } from '../../hooks/usePageView';
import Skeleton from '../components/Skeleton';
import { achievementDefinitions } from '../../lib/data-models';
import type { AchievementLevel } from '../../lib/data-models';
import AchievementBadge from '../components/AchievementBadge';
import RewardDisplay from '../components/RewardDisplay';
import ReminderSettings from '../components/ReminderSettings';
import { useToast } from '../components/Toast';
import { triggerAchievementCelebration } from '../components/GlobalCelebration';

interface AchievementData {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: AchievementLevel;
  category: string;
  unlocked: boolean;
  unlocked_at?: string;
  progress?: number;
}

const TIER_LABELS: Record<AchievementLevel, { name: string; emoji: string; desc: string }> = {
  micro: { name: '微里程碑', emoji: '🌱', desc: '小步开始，每一步都算数' },
  minor: { name: '小里程碑', emoji: '💧', desc: '积少成多，水滴石穿' },
  growth: { name: '成长里程碑', emoji: '🎯', desc: '坚持积累，看见变化' },
  major: { name: '大里程碑', emoji: '🔥', desc: '突破自我，势不可挡' },
  transformation: { name: '蜕变里程碑', emoji: '🌈', desc: '质的飞跃，全新自我' },
};

const ProfilePage = () => {
  const { token, user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  usePageView('profile');
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [newlyUnlockedIds, setNewlyUnlockedIds] = useState<Set<string>>(new Set());
  const [checkingAchievements, setCheckingAchievements] = useState(false);
  const router = useRouter();

  const [rewardsData, setRewardsData] = useState<{
    unlocked: { decorations: string[]; colors: string[]; themes: string[]; titles: string[] };
    available: {
      decorations: Array<{ id: string; name: string; condition: string; unlocked: boolean }>;
      colors: Array<{ id: string; name: string; condition: string; unlocked: boolean }>;
      themes: Array<{ id: string; name: string; condition: string; unlocked: boolean }>;
      titles: Array<{ id: string; name: string; condition: string; unlocked: boolean }>;
    };
  } | null>(null);
  const [currentRewardSettings, setCurrentRewardSettings] = useState<{
    decoration: string;
    color: string;
    theme: string;
    title: string;
  }>({ decoration: 'none', color: 'white', theme: 'clear_sky', title: '初心者' });

  const userId = token ? token.replace('local-token-', '') : '1';

  const loadAchievements = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/achievements', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.achievements) {
          setAchievements(data.achievements);
        }
      }
    } catch (err) {
      console.warn('Failed to load achievements:', err);
    }
  }, [token]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  // 修复 R8-5: 添加 silent 参数，挂载时静默检查（不显示 toast），仅在按钮点击时显示提示
  const checkAchievements = useCallback(async (silent?: boolean) => {
    if (!token) return;

    setCheckingAchievements(true);
    try {
      const response = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.newlyUnlocked && data.newlyUnlocked.length > 0) {
          // 修复 R8-2: data.newlyUnlocked 是对象数组 [{id, title, ...}]，需要映射为 ID 字符串数组
          const achievementIds: string[] = data.newlyUnlocked.map((ach: { id: string }) => ach.id);
          setNewlyUnlockedIds(new Set(achievementIds));
          triggerAchievementCelebration(achievementIds);
          await loadAchievements();
          setTimeout(() => setNewlyUnlockedIds(new Set()), 2000);
        } else if (!silent && data.newlyUnlocked?.length === 0) {
          showToast('暂无新成就解锁，继续加油！', 'info');
        }
      }
    } catch (err) {
      console.warn('Failed to check achievements:', err);
      if (!silent) showToast('检查成就失败，请重试', 'error');
    }
    setCheckingAchievements(false);
  }, [token, showToast, loadAchievements]);

  useEffect(() => {
    if (userId) {
      // 修复 R8-5: 挂载时静默检查，避免每次访问 profile 都弹 toast
      checkAchievements(true).catch(err => console.error('checkAchievements failed:', err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadRewards = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/rewards', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRewardsData({
            unlocked: data.unlocked,
            available: data.available,
          });
          if (data.currentSettings) {
            setCurrentRewardSettings(data.currentSettings);
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Rewards API failed:', err);
    }

    setRewardsData({
      unlocked: {
        decorations: ['none'],
        colors: ['white'],
        themes: ['clear_sky'],
        titles: ['初心者'],
      },
      available: {
        decorations: [
          { id: 'none', name: '无装饰', condition: '默认', unlocked: true },
          { id: 'hat', name: '帽子', condition: '连续15天', unlocked: false },
          { id: 'scarf', name: '围巾', condition: '连续7天', unlocked: false },
          { id: 'glasses', name: '眼镜', condition: '累计20条记录', unlocked: false },
          { id: 'crown', name: '皇冠', condition: '累计100条记录', unlocked: false },
        ],
        colors: [
          { id: 'white', name: '白色', condition: '默认', unlocked: true },
          { id: 'pink', name: '粉色', condition: '累计10条记录', unlocked: false },
          { id: 'blue', name: '蓝色', condition: '累计25条记录', unlocked: false },
          { id: 'gold', name: '金色', condition: '累计50条记录', unlocked: false },
          { id: 'rainbow', name: '彩虹', condition: '累计100条记录', unlocked: false },
        ],
        themes: [
          { id: 'clear_sky', name: '晴空', condition: '默认', unlocked: true },
          { id: 'starry', name: '星空', condition: '连续7天', unlocked: false },
          { id: 'flower', name: '花海', condition: '连续15天', unlocked: false },
          { id: 'aurora', name: '极光', condition: '连续30天', unlocked: false },
        ],
        titles: [
          { id: '初心者', name: '初心者', condition: '默认', unlocked: true },
          { id: '行动派', name: '行动派', condition: '完成第1个任务', unlocked: false },
          { id: '坚持者', name: '坚持者', condition: '连续7天', unlocked: false },
          { id: '雪球大师', name: '雪球大师', condition: '解锁所有其他成就', unlocked: false },
        ],
      },
    });
  }, [token]);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  const handleEquipReward = useCallback(async (type: string, value: string) => {
    if (!token) return;

    try {
      const response = await fetch('/api/rewards', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type, value }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentRewardSettings(prev => ({ ...prev, [type]: value }));
          showToast('装备成功！', 'success');
          return;
        }
      }

      const errorData = await response.json();
      showToast(errorData.error || '装备失败', 'error');
    } catch (err) {
      console.warn('Equip reward failed:', err);
      showToast('装备失败，请重试', 'error');
    }
  }, [token, showToast]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFB6C1]/30 border-t-[#FFB6C1] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] rounded-3xl p-6 mb-6 shadow-lg animate-pulse">
            <div className="h-7 w-28 bg-white/30 rounded-2xl mb-2"></div>
            <div className="h-4 w-40 bg-white/20 rounded-2xl"></div>
          </div>
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="flex items-center justify-center mb-6">
              <Skeleton type="circle" />
            </div>
            <div className="space-y-4">
              <div className="h-14 bg-gray-200 rounded-2xl animate-pulse"></div>
              <div className="h-14 bg-gray-200 rounded-2xl animate-pulse"></div>
              <div className="h-14 bg-gray-200 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-4 relative overflow-hidden">
      <div className="absolute top-[-40px] right-[-40px] w-56 h-56 bg-[#FFB6C1]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-30px] left-[-30px] w-48 h-48 bg-[#87CEEB]/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/3 left-10 w-32 h-32 bg-[#FFD700]/5 rounded-full blur-2xl"></div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] rounded-3xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-8 bg-white/80 rounded-full"></span>
            <h1 className="text-2xl font-bold text-white">个人中心</h1>
          </div>
          <p className="text-white/80 text-sm mt-1 ml-4">你的温暖角落</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFB6C1] to-[#87CEEB] p-1">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#FFB6C1] text-3xl font-bold">
                {user.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">{user.name || '雪球用户'}</h2>
            <p className="text-sm text-gray-400 mt-1">{user.email}</p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('onboarding_completed');
              router.push('/');
            }}
            className="w-full bg-gradient-to-r from-[#FFB6C1]/20 to-[#87CEEB]/20 text-[#FFB6C1] py-3 px-4 rounded-2xl hover:from-[#FFB6C1]/30 hover:to-[#87CEEB]/30 transition-all font-medium border border-[#FFB6C1]/30"
          >
            重新引导
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-8 mt-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-8 bg-gradient-to-b from-[#FFD700] to-[#FFA500] rounded-full"></span>
            <h2 className="text-xl font-bold text-gray-800">我的成就</h2>
            <span className="text-sm text-gray-400 ml-2">
              {achievements.filter(a => a.unlocked).length}/{achievements.length}
            </span>
          </div>

          {(['micro', 'minor', 'growth', 'major', 'transformation'] as AchievementLevel[]).map(tier => {
            const tierConfig = TIER_LABELS[tier];
            const tierAchievements = achievements.filter(a => a.level === tier);
            if (tierAchievements.length === 0) return null;

            return (
              <div key={tier} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{tierConfig.emoji}</span>
                  <h3 className="text-sm font-bold text-gray-700">{tierConfig.name}</h3>
                  <span className="text-xs text-gray-400">- {tierConfig.desc}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {tierAchievements.filter(a => a.unlocked).length}/{tierAchievements.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {tierAchievements.map(achievement => (
                    <AchievementBadge
                      key={achievement.id}
                      achievement={achievement}
                      unlocked={achievement.unlocked}
                      unlockedAt={achievement.unlocked_at}
                      isNewlyUnlocked={newlyUnlockedIds.has(achievement.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => checkAchievements()}
              disabled={checkingAchievements}
              className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white py-2.5 px-6 rounded-2xl hover:from-[#FFC800] hover:to-[#FF9500] transition-all shadow-md hover:shadow-lg font-medium text-sm disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
            >
              {checkingAchievements ? '检查中...' : '检查新成就'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6 mt-6">
          <ReminderSettings />
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-8 mt-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-8 bg-gradient-to-b from-[#FF69B4] to-[#87CEEB] rounded-full"></span>
            <h2 className="text-xl font-bold text-gray-800">奖励收藏</h2>
            {rewardsData && (
              <span className="text-sm text-gray-400 ml-2">
                {rewardsData.unlocked.decorations.length + rewardsData.unlocked.colors.length + rewardsData.unlocked.themes.length + rewardsData.unlocked.titles.length}/{rewardsData.available.decorations.length + rewardsData.available.colors.length + rewardsData.available.themes.length + rewardsData.available.titles.length}
              </span>
            )}
          </div>

          <div className="bg-gradient-to-r from-[#FFF0F5]/60 to-[#F0F8FF]/60 rounded-2xl p-4 mb-5 border border-[#FFB6C1]/20">
            <p className="text-xs text-gray-400 mb-2">当前装备</p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1 bg-white/80 rounded-xl px-3 py-1.5 text-sm text-gray-600 shadow-sm">
                🎩 {currentRewardSettings.decoration === 'none' ? '无装饰' : currentRewardSettings.decoration}
              </span>
              <span className="inline-flex items-center gap-1 bg-white/80 rounded-xl px-3 py-1.5 text-sm text-gray-600 shadow-sm">
                🎨 {currentRewardSettings.color === 'white' ? '白色' : currentRewardSettings.color}
              </span>
              <span className="inline-flex items-center gap-1 bg-white/80 rounded-xl px-3 py-1.5 text-sm text-gray-600 shadow-sm">
                🌈 {currentRewardSettings.theme === 'clear_sky' ? '晴空' : currentRewardSettings.theme}
              </span>
              <span className="inline-flex items-center gap-1 bg-white/80 rounded-xl px-3 py-1.5 text-sm text-gray-600 shadow-sm">
                🏅 {currentRewardSettings.title}
              </span>
            </div>
          </div>

          {rewardsData ? (
            <RewardDisplay
              rewards={rewardsData}
              currentSettings={currentRewardSettings}
              onEquip={handleEquipReward}
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-[#FFB6C1] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
