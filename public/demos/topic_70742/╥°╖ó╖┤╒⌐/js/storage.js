/**
 * 银发反诈守护人 - 本地存储模块
 * 使用 localStorage 实现数据持久化
 */

const Storage = {
  KEYS: {
    UNLOCKED_ENDINGS: 'af_guard_unlocked_endings',
    ENCYCLOPEDIA_PROGRESS: 'af_guard_encyclopedia',
    GAME_PROGRESS: 'af_guard_game_progress',
    COMPLETED_SCENARIOS: 'af_guard_completed_scenarios',
    FONT_SIZE: 'af_guard_font_size',
    STATS: 'af_guard_stats',
    ACHIEVEMENTS: 'af_guard_achievements',
    DAILY_STATS: 'af_guard_daily_stats'
  },

  /**
   * 初始化存储
   */
  init() {
    if (!this.get(this.KEYS.UNLOCKED_ENDINGS)) {
      this.set(this.KEYS.UNLOCKED_ENDINGS, []);
    }
    if (!this.get(this.KEYS.ENCYCLOPEDIA_PROGRESS)) {
      this.set(this.KEYS.ENCYCLOPEDIA_PROGRESS, []);
    }
    if (!this.get(this.KEYS.COMPLETED_SCENARIOS)) {
      this.set(this.KEYS.COMPLETED_SCENARIOS, []);
    }
    if (!this.get(this.KEYS.STATS)) {
      this.set(this.KEYS.STATS, {
        totalPlays: 0,
        successCount: 0,
        lossCount: 0,
        reportCount: 0,
        partialCount: 0
      });
    }
    if (!this.get(this.KEYS.FONT_SIZE)) {
      this.set(this.KEYS.FONT_SIZE, 'normal');
    }
    if (!this.get(this.KEYS.ACHIEVEMENTS)) {
      this.set(this.KEYS.ACHIEVEMENTS, []);
    }
  },

  get(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  /**
   * 解锁结局
   */
  unlockEnding(endingId) {
    const endings = this.get(this.KEYS.UNLOCKED_ENDINGS) || [];
    if (!endings.includes(endingId)) {
      endings.push(endingId);
      this.set(this.KEYS.UNLOCKED_ENDINGS, endings);
    }
  },

  getUnlockedEndings() {
    return this.get(this.KEYS.UNLOCKED_ENDINGS) || [];
  },

  /**
   * 解锁图鉴
   */
  unlockEncyclopedia(scenarioId) {
    const progress = this.get(this.KEYS.ENCYCLOPEDIA_PROGRESS) || [];
    if (!progress.includes(scenarioId)) {
      progress.push(scenarioId);
      this.set(this.KEYS.ENCYCLOPEDIA_PROGRESS, progress);
    }
  },

  getEncyclopediaProgress() {
    return this.get(this.KEYS.ENCYCLOPEDIA_PROGRESS) || [];
  },

  /**
   * 完成场景
   */
  completeScenario(scenarioId) {
    const completed = this.get(this.KEYS.COMPLETED_SCENARIOS) || [];
    if (!completed.includes(scenarioId)) {
      completed.push(scenarioId);
      this.set(this.KEYS.COMPLETED_SCENARIOS, completed);
    }
  },

  getCompletedScenarios() {
    return this.get(this.KEYS.COMPLETED_SCENARIOS) || [];
  },

  /**
   * 游戏进度（当前场景和节点）
   */
  saveGameProgress(scenarioId, nodeId) {
    this.set(this.KEYS.GAME_PROGRESS, { scenarioId, nodeId });
  },

  getGameProgress() {
    return this.get(this.KEYS.GAME_PROGRESS);
  },

  clearGameProgress() {
    localStorage.removeItem(this.KEYS.GAME_PROGRESS);
  },

  /**
   * 统计数据
   */
  updateStats(type) {
    const stats = this.get(this.KEYS.STATS) || {
      totalPlays: 0, successCount: 0, lossCount: 0, reportCount: 0, partialCount: 0
    };
    stats.totalPlays++;
    switch (type) {
      case 'success': stats.successCount++; break;
      case 'loss': stats.lossCount++; break;
      case 'report': stats.reportCount++; break;
      case 'partial': stats.partialCount++; break;
    }
    this.set(this.KEYS.STATS, stats);
  },

  getStats() {
    return this.get(this.KEYS.STATS) || {
      totalPlays: 0, successCount: 0, lossCount: 0, reportCount: 0, partialCount: 0
    };
  },

  /**
   * 字号设置
   */
  setFontSize(size) {
    this.set(this.KEYS.FONT_SIZE, size);
  },

  getFontSize() {
    return this.get(this.KEYS.FONT_SIZE) || 'normal';
  },

  /**
   * 成就系统
   */
  unlockAchievement(id) {
    const achievements = this.get(this.KEYS.ACHIEVEMENTS) || [];
    if (!achievements.includes(id)) {
      achievements.push(id);
      this.set(this.KEYS.ACHIEVEMENTS, achievements);
      return true;
    }
    return false;
  },

  getUnlockedAchievements() {
    return this.get(this.KEYS.ACHIEVEMENTS) || [];
  },

  checkAchievement(id) {
    const achievements = this.get(this.KEYS.ACHIEVEMENTS) || [];
    return achievements.includes(id);
  },

  /**
   * 每日统计
   */
  getTodayPlayCount() {
    const today = new Date().toISOString().slice(0, 10);
    const dailyStats = this.get(this.KEYS.DAILY_STATS);
    if (dailyStats && dailyStats.date === today) {
      return dailyStats.counter;
    }
    return 0;
  },

  /**
   * 增加当日游玩次数
   */
  incrementTodayPlayCount() {
    const today = new Date().toISOString().slice(0, 10);
    let dailyStats = this.get(this.KEYS.DAILY_STATS);
    if (!dailyStats || dailyStats.date !== today) {
      dailyStats = { date: today, counter: 1 };
    } else {
      dailyStats.counter++;
    }
    this.set(this.KEYS.DAILY_STATS, dailyStats);
  },

  /**
   * 重置所有数据
   */
  resetAll() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.init();
  }
};