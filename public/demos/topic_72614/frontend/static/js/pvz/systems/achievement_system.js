// 成就系统 - 追踪和解锁成就
import { ACHIEVEMENTS } from '../data/achievements.js';

export class AchievementSystem {
  constructor(game) {
    this.game = game;
    // 已解锁成就ID集合
    this.unlocked = new Set();
    // 统计数据
    this.stats = {
      total_kills: 0,
      boss_kills: 0,
      flawless_battles: 0,
      hybrids_created: 0,
      triple_fusions: 0,
      quad_fusions: 0,
      penta_fusions: 0,
      special_plants_obtained: 0,
      unique_plants: 0,
      max_floor: 1,
      total_coins_earned: 0,
      events_completed: 0,
      lucky_special_plant: 0,
      total_plants: 0
    };
    // 待通知的成就队列
    this._pendingNotifications = [];
  }

  // 更新统计数据
  updateStat(key, value, isMax = false) {
    if (isMax) {
      this.stats[key] = Math.max(this.stats[key] || 0, value);
    } else {
      this.stats[key] = (this.stats[key] || 0) + value;
    }
    this._checkAchievements();
  }

  // 设置统计值（用于最大值类统计）
  setStat(key, value) {
    this.stats[key] = value;
    this._checkAchievements();
  }

  // 检查所有成就条件
  _checkAchievements() {
    for (const ach of Object.values(ACHIEVEMENTS)) {
      if (this.unlocked.has(ach.id)) continue;
      const cond = ach.condition;
      const current = this.stats[cond.type] || 0;
      if (current >= cond.value) {
        this.unlock(ach.id);
      }
    }
  }

  // 解锁成就
  unlock(achievementId) {
    if (this.unlocked.has(achievementId)) return false;
    const ach = ACHIEVEMENTS[achievementId];
    if (!ach) return false;
    this.unlocked.add(achievementId);
    this._pendingNotifications.push(ach);
    return true;
  }

  // 获取待通知的成就
  getPendingNotifications() {
    const notifs = [...this._pendingNotifications];
    this._pendingNotifications = [];
    return notifs;
  }

  // 获取已解锁成就数量
  getUnlockedCount() {
    return this.unlocked.size;
  }

  // 获取总成就数量
  getTotalCount() {
    return Object.keys(ACHIEVEMENTS).length;
  }

  // 检查成就是否已解锁
  isUnlocked(achievementId) {
    return this.unlocked.has(achievementId);
  }

  // 获取所有成就列表（含解锁状态）
  getAllAchievements() {
    return Object.values(ACHIEVEMENTS).map(ach => ({
      ...ach,
      unlocked: this.unlocked.has(ach.id),
      progress: this.stats[ach.condition.type] || 0,
      target: ach.condition.value
    }));
  }

  // 序列化（存档）
  serialize() {
    return {
      unlocked: Array.from(this.unlocked),
      stats: { ...this.stats }
    };
  }

  // 反序列化（读档）
  deserialize(data) {
    if (!data) return;
    if (data.unlocked) {
      this.unlocked = new Set(data.unlocked);
    }
    if (data.stats) {
      this.stats = { ...this.stats, ...data.stats };
    }
  }
}
