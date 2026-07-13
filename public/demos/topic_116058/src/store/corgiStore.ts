import { create } from 'zustand';
import type { CorgiState, FurColor, CorgiMood, PetType } from '@/types';

// 好感度等级配置：每 100 点升一级
export const AFFINITY_LEVELS = [
  { level: 1, min: 0, max: 99, label: '陌生', color: '#B0A088', emoji: '👋', unlock: '基础互动' },
  { level: 2, min: 100, max: 199, label: '认识', color: '#8B7355', emoji: '🤝', unlock: '每日抚摸上限解锁' },
  { level: 3, min: 200, max: 299, label: '熟悉', color: '#5BAE9C', emoji: '💛', unlock: '专属开心动画' },
  { level: 4, min: 300, max: 399, label: '亲密', color: '#E8A857', emoji: '💗', unlock: '专属兴奋动画' },
  { level: 5, min: 400, max: 9999, label: '挚爱', color: '#FF6B8A', emoji: '💕', unlock: '宠物小院子 + 小游戏' },
];

export function getAffinityLevel(affinity: number) {
  return AFFINITY_LEVELS.find((l) => affinity >= l.min && affinity <= l.max) || AFFINITY_LEVELS[0];
}

// 喂食配置
export const FEED_COST = 5; // 每次喂食消耗的积分
export const FEED_DAILY_LIMIT = 5; // 每日喂食上限
export const PET_DAILY_LIMIT = 10; // 每日抚摸上限（Lv2+ 解锁）
export const PLAY_DAILY_LIMIT = 5; // 每日玩耍上限

// 防沉迷：单次互动 20 分钟
export const ANTI_ADDICTION_MS = 20 * 60 * 1000;

// 离线饥饿值降低：每小时 10 点
export const SATIETY_DROP_PER_HOUR = 10;

interface CorgiStore {
  corgi: CorgiState;
  setFurColor: (color: FurColor) => void;
  setName: (name: string) => void;
  setCorgiName: (name: string) => void;
  setPetType: (type: PetType) => void;
  adopt: () => void;
  setMood: (mood: CorgiMood) => void;
  interact: (action: 'pet' | 'feed' | 'play') => { success: boolean; message?: string };
  // 用零食喂食：按零食自身的 satietyValue 恢复饱食度，并依据稀有度加额外好感
  feedSnack: (satietyValue: number, affinityBonus: number) => { success: boolean; message?: string };
  applyOfflineSatiety: () => void;
  checkStreak: () => void;
  addInteractionMinutes: (minutes: number) => boolean;
  resetDailyLimits: () => void;
  addAffinity: (amount: number) => void;
}

// 工具：获取今日日期字符串
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 工具：计算两个日期字符串之间是否相差一天
function isYesterday(lastDate: string): boolean {
  if (!lastDate) return false;
  const last = new Date(lastDate);
  const today = new Date(todayStr());
  const diff = (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(diff) === 1;
}

function isSameDay(lastDate: string): boolean {
  return lastDate === todayStr();
}

// 初始状态：所有数值归零（如用户要求），satiety 默认 80
export const useCorgiStore = create<CorgiStore>((set, get) => ({
  corgi: {
    name: '布丁',
    furColor: 'classic',
    petType: 'corgi',  // 默认柯基
    mood: 'happy',
    satiety: 80,
    affinity: 0,
    level: 1,
    streak: 0,
    adopted: false,  // 初始未领养，引导页后设置
    lastActiveTime: Date.now(),
    lastInteractionDate: '',
    petCountToday: 0,
    feedCountToday: 0,
    playCountToday: 0,
    interactionMinutesToday: 0,
  },

  setFurColor: (furColor) =>
    set((state) => ({ corgi: { ...state.corgi, furColor } })),

  setName: (name) =>
    set((state) => ({ corgi: { ...state.corgi, name } })),

  setCorgiName: (name) =>
    set((state) => ({ corgi: { ...state.corgi, name } })),

  setPetType: (petType) =>
    set((state) => ({ corgi: { ...state.corgi, petType } })),

  adopt: () =>
    set((state) => ({ corgi: { ...state.corgi, adopted: true } })),

  setMood: (mood) =>
    set((state) => ({ corgi: { ...state.corgi, mood } })),

  // 互动 - 包含所有规则限制
  interact: (action) => {
    const c = get().corgi;
    const affLevel = getAffinityLevel(c.affinity);

    // 防沉迷检查
    if (c.interactionMinutesToday >= 20) {
      return {
        success: false,
        message: '今日互动已达 20 分钟上限，去完成日程学习吧～',
      };
    }

    // 检查日期，如果是新的一天，重置每日上限
    let petCount = c.petCountToday;
    let feedCount = c.feedCountToday;
    let playCount = c.playCountToday;
    let interactionMinutes = c.interactionMinutesToday;
    let streak = c.streak;

    if (!isSameDay(c.lastInteractionDate)) {
      // 新的一天
      if (c.lastInteractionDate && !isYesterday(c.lastInteractionDate)) {
        // 断签 - 重置连胜
        streak = 0;
      }
      petCount = 0;
      feedCount = 0;
      playCount = 0;
      interactionMinutes = 0;
    }

    if (action === 'pet') {
      // 抚摸：Lv2+ 解锁每日上限抚摸
      if (affLevel.level < 2) {
        return {
          success: false,
          message: '好感度等级 2 解锁每日抚摸功能，继续加油～',
        };
      }
      if (petCount >= PET_DAILY_LIMIT) {
        return {
          success: false,
          message: `今日抚摸已达上限 ${PET_DAILY_LIMIT} 次～`,
        };
      }
      set({
        corgi: {
          ...c,
          affinity: Math.min(500, c.affinity + 2),
          mood: 'happy',
          petCountToday: petCount + 1,
          feedCountToday: feedCount,
          playCountToday: playCount,
          interactionMinutesToday: interactionMinutes,
          lastInteractionDate: todayStr(),
          lastActiveTime: Date.now(),
          streak: isSameDay(c.lastInteractionDate) ? streak : streak + 1,
        },
      });
      return { success: true };
    }

    if (action === 'feed') {
      // 喂食：需要积分（在外部检查），有每日上限
      if (feedCount >= FEED_DAILY_LIMIT) {
        return {
          success: false,
          message: `今日喂食已达上限 ${FEED_DAILY_LIMIT} 次～`,
        };
      }
      set({
        corgi: {
          ...c,
          satiety: Math.min(100, c.satiety + 15),
          affinity: Math.min(500, c.affinity + 1),
          mood: 'excited',
          feedCountToday: feedCount + 1,
          petCountToday: petCount,
          playCountToday: playCount,
          interactionMinutesToday: interactionMinutes,
          lastInteractionDate: todayStr(),
          lastActiveTime: Date.now(),
          streak: isSameDay(c.lastInteractionDate) ? streak : streak + 1,
        },
      });
      return { success: true };
    }

    // 玩耍
    if (playCount >= PLAY_DAILY_LIMIT) {
      return {
        success: false,
        message: `今日玩耍已达上限 ${PLAY_DAILY_LIMIT} 次～`,
      };
    }
    set({
      corgi: {
        ...c,
        satiety: Math.max(0, c.satiety - 5),
        affinity: Math.min(500, c.affinity + 3),
        mood: 'excited',
        playCountToday: playCount + 1,
        petCountToday: petCount,
        feedCountToday: feedCount,
        interactionMinutesToday: interactionMinutes,
        lastInteractionDate: todayStr(),
        lastActiveTime: Date.now(),
        streak: isSameDay(c.lastInteractionDate) ? streak : streak + 1,
      },
    });
    return { success: true };
  },

  // 用零食喂食：与普通喂食共用防沉迷/每日上限/连胜逻辑，但饱食度按零食自身值恢复
  feedSnack: (satietyValue, affinityBonus) => {
    const c = get().corgi;

    // 防沉迷检查
    if (c.interactionMinutesToday >= 20) {
      return { success: false, message: '今日互动已达 20 分钟上限，去完成日程学习吧～' };
    }

    let feedCount = c.feedCountToday;
    let streak = c.streak;

    if (!isSameDay(c.lastInteractionDate)) {
      if (c.lastInteractionDate && !isYesterday(c.lastInteractionDate)) {
        streak = 0;
      }
      feedCount = 0;
    }

    if (feedCount >= FEED_DAILY_LIMIT) {
      return { success: false, message: `今日喂食已达上限 ${FEED_DAILY_LIMIT} 次～` };
    }

    set({
      corgi: {
        ...c,
        satiety: Math.min(100, c.satiety + satietyValue),
        affinity: Math.min(500, c.affinity + 1 + affinityBonus),
        mood: 'excited',
        feedCountToday: feedCount + 1,
        lastInteractionDate: todayStr(),
        lastActiveTime: Date.now(),
        streak: isSameDay(c.lastInteractionDate) ? streak : streak + 1,
      },
    });
    return { success: true };
  },

  // 离线饥饿值降低
  applyOfflineSatiety: () => {
    const c = get().corgi;
    const now = Date.now();
    const elapsedMs = now - c.lastActiveTime;
    const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
    if (hours <= 0) return;
    const drop = Math.min(c.satiety, hours * SATIETY_DROP_PER_HOUR);
    if (drop <= 0) return;
    set({
      corgi: {
        ...c,
        satiety: Math.max(0, c.satiety - drop),
        lastActiveTime: now,
        mood: c.satiety - drop < 30 ? 'sad' : c.mood,
      },
    });
  },

  // 检查连胜 - 断签重置
  checkStreak: () => {
    const c = get().corgi;
    if (!c.lastInteractionDate) return;
    if (!isSameDay(c.lastInteractionDate) && !isYesterday(c.lastInteractionDate)) {
      // 断签
      set({ corgi: { ...c, streak: 0 } });
    }
  },

  // 防沉迷 - 累加互动分钟数
  addInteractionMinutes: (minutes) => {
    const c = get().corgi;
    const newTotal = c.interactionMinutesToday + minutes;
    set({
      corgi: {
        ...c,
        interactionMinutesToday: newTotal,
      },
    });
    return newTotal >= 20; // 返回是否达到上限
  },

  // 重置每日上限（通常在跨日时调用）
  resetDailyLimits: () =>
    set((state) => ({
      corgi: {
        ...state.corgi,
        petCountToday: 0,
        feedCountToday: 0,
        playCountToday: 0,
        interactionMinutesToday: 0,
      },
    })),

  addAffinity: (amount) =>
    set((state) => ({
      corgi: {
        ...state.corgi,
        affinity: Math.max(0, Math.min(500, state.corgi.affinity + amount)),
      },
    })),
}));

// 毛色配置 - 包含稀有度等级
export interface FurColorConfig {
  name: string;
  body: string;
  belly: string;
  ear: string;
  patch: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  emoji: string;
}

export const FUR_COLORS: Record<FurColor, FurColorConfig> = {
  classic: {
    name: '经典黄白',
    body: '#E8A857',
    belly: '#FFFBF0',
    ear: '#C68642',
    patch: '#A06B2E',
    rarity: 'common',
    emoji: '🐕',
  },
  tricolor: {
    name: '三色',
    body: '#E8A857',
    belly: '#FFFBF0',
    ear: '#5D4E37',
    patch: '#3A2E1E',
    rarity: 'common',
    emoji: '🐕',
  },
  red: {
    name: '红棕色',
    body: '#C97B3E',
    belly: '#FFE8D0',
    ear: '#9C5A2A',
    patch: '#7A4420',
    rarity: 'common',
    emoji: '🦊',
  },
  cream: {
    name: '奶白色',
    body: '#F5DEB3',
    belly: '#FFFBF0',
    ear: '#DEB887',
    patch: '#C8A878',
    rarity: 'common',
    emoji: '🐶',
  },
  merle: {
    name: '陨石柯基',
    body: '#B8A090',
    belly: '#FFFBF0',
    ear: '#7A6858',
    patch: '#5A4838',
    rarity: 'rare',
    emoji: '☁️',
  },
  sable: {
    name: '黑貂柯基',
    body: '#A0683C',
    belly: '#FFFBF0',
    ear: '#3A2418',
    patch: '#1F140C',
    rarity: 'rare',
    emoji: '🐻',
  },
  chocolate: {
    name: '巧克力柯基',
    body: '#6B4226',
    belly: '#E8C8A0',
    ear: '#4A2D1A',
    patch: '#2E1B10',
    rarity: 'rare',
    emoji: '🍫',
  },
  peach: {
    name: '蜜桃粉柯基',
    body: '#FFB6A3',
    belly: '#FFF5F0',
    ear: '#E88C7A',
    patch: '#C66B5A',
    rarity: 'epic',
    emoji: '🍑',
  },
  mint: {
    name: '薄荷绿柯基',
    body: '#A8E0C8',
    belly: '#F0FFF8',
    ear: '#7CC4A4',
    patch: '#5AA888',
    rarity: 'epic',
    emoji: '🌿',
  },
  blue: {
    name: '蓝色稀有柯基',
    body: '#8FA8C8',
    belly: '#F0F5FF',
    ear: '#5D7A9C',
    patch: '#3D5A7C',
    rarity: 'epic',
    emoji: '💎',
  },
  lilac: {
    name: '薰衣草柯基',
    body: '#C8B0D8',
    belly: '#F8F0FF',
    ear: '#A888C0',
    patch: '#8868A0',
    rarity: 'legendary',
    emoji: '💜',
  },
  lavender: {
    name: '淡紫梦幻柯基',
    body: '#E0B0FF',
    belly: '#FFF5FF',
    ear: '#C080E0',
    patch: '#A060C0',
    rarity: 'legendary',
    emoji: '✨',
  },
};

export const FUR_RARITY_CONFIG: Record<FurColorConfig['rarity'], { label: string; color: string; bg: string }> = {
  common: { label: '普通', color: '#8B7355', bg: 'rgba(176, 160, 136, 0.15)' },
  rare: { label: '稀有', color: '#5BAE9C', bg: 'rgba(93, 174, 156, 0.15)' },
  epic: { label: '史诗', color: '#B57BCE', bg: 'rgba(181, 123, 206, 0.15)' },
  legendary: { label: '传说', color: '#FF9F43', bg: 'rgba(255, 159, 67, 0.2)' },
};
