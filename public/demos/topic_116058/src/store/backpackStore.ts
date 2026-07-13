import { create } from 'zustand';
import type { BlindBoxReward, CollectionItem, Backpack, Rarity } from '@/types';

interface BackpackStore {
  backpack: Backpack;
  addPoints: (points: number) => void;
  spendPoints: (points: number) => boolean;
  addReward: (reward: BlindBoxReward) => void;
  consumeSnack: (snackId: string) => BlindBoxReward | null;
  unlockTitle: (titleId: string) => void;
  checkTitleUnlocks: (focusCount: number, scheduleCount: number) => void;
}

// 盲盒奖池 - 包含表情包、卡牌、零食、积分（无称号，称号来自完成日程/专注）
export const BLINDBOX_POOL: BlindBoxReward[] = [
  // ===== 表情包 - 全部柯基主题 =====
  // common
  { id: 'e1', type: 'expression', name: '摇尾柯基', rarity: 'common', emoji: '🐕', description: '开心摇尾巴的柯基' },
  { id: 'e2', type: 'expression', name: '困困柯基', rarity: 'common', emoji: '😴', description: '打哈欠的困困柯基' },
  { id: 'e3', type: 'expression', name: '馋嘴柯基', rarity: 'common', emoji: '🤤', description: '流口水想吃零食的柯基' },
  { id: 'e4', type: 'expression', name: '歪头柯基', rarity: 'common', emoji: '🤔', description: '歪头好奇的柯基' },
  // rare
  { id: 'e5', type: 'expression', name: '害羞柯基', rarity: 'rare', emoji: '😳', description: '脸颊泛红的害羞柯基' },
  { id: 'e6', type: 'expression', name: '鼓腮柯基', rarity: 'rare', emoji: '😤', description: '鼓起腮帮子的柯基' },
  { id: 'e7', type: 'expression', name: '闪耀柯基', rarity: 'rare', emoji: '✨', description: '闪闪发光的柯基' },
  // epic
  { id: 'e8', type: 'expression', name: '皇冠柯基', rarity: 'epic', emoji: '👑', description: '戴着皇冠的柯基王' },
  { id: 'e9', type: 'expression', name: '彩虹柯基', rarity: 'epic', emoji: '🌈', description: '彩虹下奔跑的柯基' },
  // legendary
  { id: 'e10', type: 'expression', name: '黄金柯基', rarity: 'legendary', emoji: '🌟', description: '传说中的黄金柯基' },

  // ===== 卡牌 =====
  // common
  { id: 'c1', type: 'card', name: '专注卡', rarity: 'common', emoji: '🎯', description: '专注度+10%' },
  { id: 'c2', type: 'card', name: '体力卡', rarity: 'common', emoji: '💪', description: '体力恢复+15%' },
  // rare
  { id: 'c3', type: 'card', name: '时间卡', rarity: 'rare', emoji: '⏰', description: '额外30分钟缓冲时间' },
  { id: 'c4', type: 'card', name: '心情卡', rarity: 'rare', emoji: '💗', description: '柯基心情+20' },
  // epic
  { id: 'c5', type: 'card', name: '免死金牌', rarity: 'epic', emoji: '🛡️', description: '跳过一次日程不扣分' },

  // ===== 零食（喂食柯基用）=====
  // common
  { id: 's1', type: 'snack', name: '小饼干', rarity: 'common', emoji: '🍪', description: '饱食度+10', satietyValue: 10 },
  { id: 's2', type: 'snack', name: '狗粮', rarity: 'common', emoji: '🦴', description: '饱食度+12', satietyValue: 12 },
  // rare
  { id: 's3', type: 'snack', name: '肉骨头', rarity: 'rare', emoji: '🍖', description: '饱食度+20', satietyValue: 20 },
  { id: 's4', type: 'snack', name: '鸡胸肉', rarity: 'rare', emoji: '🍗', description: '饱食度+22', satietyValue: 22 },
  // epic
  { id: 's5', type: 'snack', name: '三文鱼', rarity: 'epic', emoji: '🐟', description: '饱食度+30 好感+1', satietyValue: 30 },
  // legendary
  { id: 's6', type: 'snack', name: '皇家盛宴', rarity: 'legendary', emoji: '👑', description: '饱食度+50 好感+3', satietyValue: 50 },

  // ===== 积分奖励（盲盒直接抽到积分）=====
  { id: 'p1', type: 'points', name: '小积分', rarity: 'common', emoji: '💰', description: '+10 积分', pointsValue: 10 },
  { id: 'p2', type: 'points', name: '中积分', rarity: 'rare', emoji: '💎', description: '+30 积分', pointsValue: 30 },
  { id: 'p3', type: 'points', name: '大积分', rarity: 'epic', emoji: '🏆', description: '+80 积分', pointsValue: 80 },

  // ===== 院子装饰（五级解锁小院子后可摆放）=====
  // common
  { id: 'd1', type: 'decoration', name: '小木屋', rarity: 'common', emoji: '🏡', description: '柯基的小木屋' },
  { id: 'd2', type: 'decoration', name: '小皮球', rarity: 'common', emoji: '⚽', description: '柯基爱玩的小皮球' },
  { id: 'd3', type: 'decoration', name: '食盆', rarity: 'common', emoji: '🥣', description: '柯基的食盆' },
  // rare
  { id: 'd4', type: 'decoration', name: '飞盘', rarity: 'rare', emoji: '🥏', description: '彩色飞盘' },
  { id: 'd5', type: 'decoration', name: '小滑梯', rarity: 'rare', emoji: '🛝', description: '柯基的小滑梯' },
  { id: 'd6', type: 'decoration', name: '花圃', rarity: 'rare', emoji: '🌷', description: '美丽的花圃' },
  // epic
  { id: 'd7', type: 'decoration', name: '彩色彩带', rarity: 'epic', emoji: '🎀', description: '装饰彩带' },
  { id: 'd8', type: 'decoration', name: '气球拱门', rarity: 'epic', emoji: '🎈', description: '派对气球拱门' },
  // legendary
  { id: 'd9', type: 'decoration', name: '彩虹喷泉', rarity: 'legendary', emoji: '🌈', description: '梦幻彩虹喷泉' },
  { id: 'd10', type: 'decoration', name: '黄金狗窝', rarity: 'legendary', emoji: '👑', description: '黄金打造的豪华狗窝' },
];

// 称号 - 通过完成番茄钟/日程获得（不来自盲盒）
export const TITLES_POOL: BlindBoxReward[] = [
  { id: 't1', type: 'title', name: '勤奋学徒', rarity: 'rare', emoji: '📚', description: '完成5次番茄钟专注' },
  { id: 't2', type: 'title', name: '日程达人', rarity: 'rare', emoji: '🗓️', description: '完成20条日程' },
  { id: 't3', type: 'title', name: '柯基挚友', rarity: 'epic', emoji: '🤝', description: '完成15次番茄钟专注' },
  { id: 't4', type: 'title', name: '专注大师', rarity: 'epic', emoji: '🎯', description: '完成30次番茄钟专注' },
  { id: 't5', type: 'title', name: '时光守护者', rarity: 'legendary', emoji: '⭐', description: '完成50条日程+30次专注' },
];

// 称号解锁条件
export const TITLE_UNLOCK_CONDITIONS: Record<string, { focusCount: number; scheduleCount: number }> = {
  t1: { focusCount: 5, scheduleCount: 0 },
  t2: { focusCount: 0, scheduleCount: 20 },
  t3: { focusCount: 15, scheduleCount: 0 },
  t4: { focusCount: 30, scheduleCount: 0 },
  t5: { focusCount: 30, scheduleCount: 50 },
};

// 初始背包 — 所有物品计数从0开始
const initialBackpack: Backpack = {
  points: 0,  // 初始积分 0
  expressions: BLINDBOX_POOL.filter((r) => r.type === 'expression').map((r) => ({
    reward: r,
    count: 0,
    unlocked: false,
  })),
  cards: BLINDBOX_POOL.filter((r) => r.type === 'card').map((r) => ({
    reward: r,
    count: 0,
    unlocked: false,
  })),
  snacks: BLINDBOX_POOL.filter((r) => r.type === 'snack').map((r) => ({
    reward: r,
    count: 0,
    unlocked: false,
  })),
  titles: TITLES_POOL.map((r) => ({
    reward: r,
    count: 0,
    unlocked: false,
  })),
  decorations: BLINDBOX_POOL.filter((r) => r.type === 'decoration').map((r) => ({
    reward: r,
    count: 0,
    unlocked: false,
  })),
};

export const useBackpackStore = create<BackpackStore>((set, get) => ({
  backpack: initialBackpack,
  addPoints: (points) =>
    set((state) => ({
      backpack: { ...state.backpack, points: state.backpack.points + points },
    })),
  spendPoints: (points) => {
    const current = get().backpack.points;
    if (current < points) return false;
    set((state) => ({
      backpack: { ...state.backpack, points: state.backpack.points - points },
    }));
    return true;
  },
  addReward: (reward) =>
    set((state) => {
      // 积分类型直接加积分
      if (reward.type === 'points' && reward.pointsValue) {
        return {
          backpack: { ...state.backpack, points: state.backpack.points + reward.pointsValue },
        };
      }
      // 根据类型确定存储 key
      let key: 'expressions' | 'cards' | 'snacks' | 'decorations';
      if (reward.type === 'expression') key = 'expressions';
      else if (reward.type === 'card') key = 'cards';
      else if (reward.type === 'snack') key = 'snacks';
      else if (reward.type === 'decoration') key = 'decorations';
      else return {}; // title 类型不在此处理

      const collection = state.backpack[key];
      const existing = collection.find((c) => c.reward.id === reward.id);
      let updated: CollectionItem[];
      if (existing) {
        updated = collection.map((c) =>
          c.reward.id === reward.id
            ? { ...c, count: c.count + 1, unlocked: true }
            : c
        );
      } else {
        updated = [...collection, { reward, count: 1, unlocked: true }];
      }
      return {
        backpack: { ...state.backpack, [key]: updated },
      };
    }),
  // 消耗一个零食（喂食时调用）
  consumeSnack: (snackId) => {
    const snack = get().backpack.snacks.find((s) => s.reward.id === snackId);
    if (!snack || snack.count <= 0) return null;
    set((state) => ({
      backpack: {
        ...state.backpack,
        snacks: state.backpack.snacks.map((s) =>
          s.reward.id === snackId ? { ...s, count: Math.max(0, s.count - 1) } : s
        ),
      },
    }));
    return snack.reward;
  },
  unlockTitle: (titleId) =>
    set((state) => ({
      backpack: {
        ...state.backpack,
        titles: state.backpack.titles.map((t) =>
          t.reward.id === titleId ? { ...t, unlocked: true, count: t.count + 1 } : t
        ),
      },
    })),
  // 检查称号解锁条件
  checkTitleUnlocks: (focusCount, scheduleCount) => {
    const { backpack, unlockTitle } = get();
    Object.entries(TITLE_UNLOCK_CONDITIONS).forEach(([id, cond]) => {
      const title = backpack.titles.find((t) => t.reward.id === id);
      if (title && !title.unlocked && focusCount >= cond.focusCount && scheduleCount >= cond.scheduleCount) {
        if ((cond.focusCount > 0 && focusCount >= cond.focusCount) || (cond.scheduleCount > 0 && scheduleCount >= cond.scheduleCount)) {
          unlockTitle(id);
        }
      }
    });
  },
}));

// 稀有度颜色配置
export const RARITY_CONFIG: Record<Rarity, { color: string; bg: string; border: string; label: string }> = {
  common: { color: '#8B7355', bg: 'rgba(176, 160, 136, 0.15)', border: '#B0A088', label: '普通' },
  rare: { color: '#5BAE9C', bg: 'rgba(93, 174, 156, 0.15)', border: '#5BAE9C', label: '稀有' },
  epic: { color: '#B57BCE', bg: 'rgba(181, 123, 206, 0.15)', border: '#B57BCE', label: '史诗' },
  legendary: { color: '#FF9F43', bg: 'rgba(255, 159, 67, 0.2)', border: '#FF9F43', label: '传说' },
};

// 抽奖概率
export const DRAW_COST = 50;
export function drawReward(): BlindBoxReward {
  const rand = Math.random();
  let pool: BlindBoxReward[];
  if (rand < 0.5) {
    pool = BLINDBOX_POOL.filter((r) => r.rarity === 'common');
  } else if (rand < 0.8) {
    pool = BLINDBOX_POOL.filter((r) => r.rarity === 'rare');
  } else if (rand < 0.95) {
    pool = BLINDBOX_POOL.filter((r) => r.rarity === 'epic');
  } else {
    pool = BLINDBOX_POOL.filter((r) => r.rarity === 'legendary');
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
