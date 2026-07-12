window.StorageManager = {
  KEYS: {
    LEARNED_CARDS: 'yixian_learned_cards',
    WRONG_CARDS: 'yixian_wrong_cards',
    MASTERED_CARDS: 'yixian_mastered_cards',
    DAILY_GOAL: 'yx_daily_goal',
    DAILY_STATS: 'yx_daily_stats',
    LAST_STUDY_DATE: 'yx_last_study_date',
    STREAK_DAYS: 'yx_streak_days',
    PRACTICE_STATS: 'yx_practice_stats'
  },

  defaultDailyGoal: 20,

  defaultLearnedCards: [
    { char: '人', pinyin: 'rén', category: '人物', learnedAt: Date.now() - 86400000 * 10 },
    { char: '大', pinyin: 'dà', category: '形容词', learnedAt: Date.now() - 86400000 * 9 },
    { char: '小', pinyin: 'xiǎo', category: '形容词', learnedAt: Date.now() - 86400000 * 8 },
    { char: '山', pinyin: 'shān', category: '自然', learnedAt: Date.now() - 86400000 * 7 },
    { char: '水', pinyin: 'shuǐ', category: '自然', learnedAt: Date.now() - 86400000 * 6 },
    { char: '日', pinyin: 'rì', category: '自然', learnedAt: Date.now() - 86400000 * 5 },
    { char: '月', pinyin: 'yuè', category: '自然', learnedAt: Date.now() - 86400000 * 4 },
    { char: '明', pinyin: 'míng', category: '形容词', learnedAt: Date.now() - 86400000 * 3 },
    { char: '天', pinyin: 'tiān', category: '自然', learnedAt: Date.now() - 86400000 * 2 },
    { char: '地', pinyin: 'dì', category: '自然', learnedAt: Date.now() - 86400000 * 1 }
  ],

  defaultWrongCards: [
    { char: '辨', pinyin: 'biàn', wrongCount: 3, lastWrong: Date.now() - 86400000 * 2 },
    { char: '辩', pinyin: 'biàn', wrongCount: 2, lastWrong: Date.now() - 86400000 * 1 },
    { char: '辫', pinyin: 'biàn', wrongCount: 2, lastWrong: Date.now() - 86400000 * 3 },
    { char: '掇', pinyin: 'duō', wrongCount: 1, lastWrong: Date.now() - 86400000 * 5 },
    { char: '辍', pinyin: 'chuò', wrongCount: 1, lastWrong: Date.now() - 86400000 * 4 },
    { char: '缀', pinyin: 'zhuì', wrongCount: 1, lastWrong: Date.now() - 86400000 * 6 },
    { char: '戮', pinyin: 'lù', wrongCount: 1, lastWrong: Date.now() - 86400000 * 7 },
    { char: '戳', pinyin: 'chuō', wrongCount: 1, lastWrong: Date.now() - 86400000 * 8 }
  ],

  defaultMasteredCards: [
    { char: '人', pinyin: 'rén', category: '人物', masteredAt: Date.now() - 86400000 * 7 },
    { char: '大', pinyin: 'dà', category: '形容词', masteredAt: Date.now() - 86400000 * 6 },
    { char: '小', pinyin: 'xiǎo', category: '形容词', masteredAt: Date.now() - 86400000 * 5 },
    { char: '山', pinyin: 'shān', category: '自然', masteredAt: Date.now() - 86400000 * 4 },
    { char: '水', pinyin: 'shuǐ', category: '自然', masteredAt: Date.now() - 86400000 * 3 },
    { char: '日', pinyin: 'rì', category: '自然', masteredAt: Date.now() - 86400000 * 2 },
    { char: '月', pinyin: 'yuè', category: '自然', masteredAt: Date.now() - 86400000 * 1 }
  ],

  _get: function(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      if (data === null) {
        return defaultValue || [];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('[StorageManager] 读取数据失败:', key, e);
      return defaultValue || [];
    }
  },

  _set: function(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[StorageManager] 保存数据失败:', key, e);
      return false;
    }
  },

  getLearnedCards: function() {
    const cards = this._get(this.KEYS.LEARNED_CARDS, null);
    if (cards.length === 0) {
      this._set(this.KEYS.LEARNED_CARDS, this.defaultLearnedCards);
      return [...this.defaultLearnedCards];
    }
    return cards;
  },

  addLearnedCard: function(card) {
    const cards = this.getLearnedCards();
    const exists = cards.find(c => c.char === card.char);
    if (!exists) {
      cards.push({
        char: card.char,
        pinyin: card.pinyin || '',
        category: card.category || '',
        learnedAt: Date.now()
      });
      this._set(this.KEYS.LEARNED_CARDS, cards);
      return true;
    }
    return false;
  },

  getWrongCards: function() {
    const cards = this._get(this.KEYS.WRONG_CARDS, null);
    if (cards.length === 0) {
      this._set(this.KEYS.WRONG_CARDS, this.defaultWrongCards);
      return [...this.defaultWrongCards];
    }
    return cards;
  },

  addWrongCard: function(card) {
    const cards = this.getWrongCards();
    const exists = cards.find(c => c.char === card.char);
    if (exists) {
      exists.wrongCount = (exists.wrongCount || 0) + 1;
      exists.lastWrong = Date.now();
    } else {
      cards.push({
        char: card.char,
        pinyin: card.pinyin || '',
        wrongCount: 1,
        lastWrong: Date.now()
      });
    }
    this._set(this.KEYS.WRONG_CARDS, cards);
    return true;
  },

  removeWrongCard: function(char) {
    const cards = this.getWrongCards();
    const index = cards.findIndex(c => c.char === char);
    if (index > -1) {
      cards.splice(index, 1);
      this._set(this.KEYS.WRONG_CARDS, cards);
      return true;
    }
    return false;
  },

  getMasteredCards: function() {
    const cards = this._get(this.KEYS.MASTERED_CARDS, null);
    if (cards.length === 0) {
      this._set(this.KEYS.MASTERED_CARDS, this.defaultMasteredCards);
      return [...this.defaultMasteredCards];
    }
    return cards;
  },

  addMasteredCard: function(card) {
    const cards = this.getMasteredCards();
    const exists = cards.find(c => c.char === card.char);
    if (!exists) {
      cards.push({
        char: card.char,
        pinyin: card.pinyin || '',
        category: card.category || '',
        masteredAt: Date.now()
      });
      this._set(this.KEYS.MASTERED_CARDS, cards);
      return true;
    }
    return false;
  },

  getStats: function() {
    const learned = this.getLearnedCards().length;
    const wrong = this.getWrongCards().length;
    const mastered = this.getMasteredCards().length;
    return {
      totalLearned: learned,
      totalWrong: wrong,
      totalMastered: mastered,
      masteryRate: learned > 0 ? Math.round((mastered / learned) * 100) : 0
    };
  },

  _getTodayStr: function() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  },

  getDailyGoal: function() {
    const val = localStorage.getItem(this.KEYS.DAILY_GOAL);
    if (val === null) {
      return this.defaultDailyGoal;
    }
    const n = parseInt(val, 10);
    return isNaN(n) ? this.defaultDailyGoal : n;
  },

  setDailyGoal: function(n) {
    const num = parseInt(n, 10);
    if (isNaN(num) || num <= 0) return false;
    localStorage.setItem(this.KEYS.DAILY_GOAL, String(num));
    return true;
  },

  _getRawDailyStats: function() {
    try {
      const data = localStorage.getItem(this.KEYS.DAILY_STATS);
      if (data === null) return null;
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  },

  getDailyStats: function() {
    const today = this._getTodayStr();
    const raw = this._getRawDailyStats();
    if (!raw || raw.date !== today) {
      return { learned: 0, exercised: 0, date: today };
    }
    return {
      learned: raw.learned || 0,
      exercised: raw.exercised || 0,
      date: raw.date
    };
  },

  _saveDailyStats: function(stats) {
    try {
      localStorage.setItem(this.KEYS.DAILY_STATS, JSON.stringify(stats));
      return true;
    } catch (e) {
      return false;
    }
  },

  addDailyLearned: function(n) {
    const today = this._getTodayStr();
    const stats = this.getDailyStats();
    stats.learned = (stats.learned || 0) + (parseInt(n, 10) || 0);
    stats.date = today;
    this._saveDailyStats(stats);
    this._updateStreak();
    return stats;
  },

  addDailyExercised: function(n) {
    const today = this._getTodayStr();
    const stats = this.getDailyStats();
    stats.exercised = (stats.exercised || 0) + (parseInt(n, 10) || 0);
    stats.date = today;
    this._saveDailyStats(stats);
    this._updateStreak();
    return stats;
  },

  getLastStudyDate: function() {
    return localStorage.getItem(this.KEYS.LAST_STUDY_DATE) || '';
  },

  _setLastStudyDate: function(dateStr) {
    localStorage.setItem(this.KEYS.LAST_STUDY_DATE, dateStr);
  },

  getStreakDays: function() {
    const streak = localStorage.getItem(this.KEYS.STREAK_DAYS);
    return streak ? parseInt(streak, 10) || 0 : 0;
  },

  _setStreakDays: function(n) {
    localStorage.setItem(this.KEYS.STREAK_DAYS, String(n));
  },

  _updateStreak: function() {
    const today = this._getTodayStr();
    const lastDate = this.getLastStudyDate();
    let streak = this.getStreakDays();

    if (lastDate === today) {
      return streak;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, '0');
    const d = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = y + '-' + m + '-' + d;

    if (lastDate === yesterdayStr) {
      streak += 1;
    } else if (!lastDate || lastDate !== today) {
      streak = 1;
    }

    this._setStreakDays(streak);
    this._setLastStudyDate(today);
    return streak;
  },

  _getDefaultPracticeStats: function() {
    const demoStats = window.DemoData && window.DemoData.stats && window.DemoData.stats.practice
      ? window.DemoData.stats.practice
      : {};
    return {
      image: {
        done: (demoStats.image && demoStats.image.done) || 0,
        mastered: (demoStats.image && demoStats.image.mastered) || 0,
        wrong: (demoStats.image && demoStats.image.wrong) || 0
      },
      audio: {
        done: (demoStats.audio && demoStats.audio.done) || 0,
        mastered: (demoStats.audio && demoStats.audio.mastered) || 0,
        wrong: (demoStats.audio && demoStats.audio.wrong) || 0
      },
      sentence: {
        done: (demoStats.sentence && demoStats.sentence.done) || 0,
        mastered: (demoStats.sentence && demoStats.sentence.mastered) || 0,
        wrong: (demoStats.sentence && demoStats.sentence.wrong) || 0
      },
      pinyin: {
        done: (demoStats.pinyin && demoStats.pinyin.done) || 0,
        mastered: (demoStats.pinyin && demoStats.pinyin.mastered) || 0,
        wrong: (demoStats.pinyin && demoStats.pinyin.wrong) || 0
      }
    };
  },

  getPracticeStats: function() {
    const defaultStats = this._getDefaultPracticeStats();
    try {
      const local = localStorage.getItem(this.KEYS.PRACTICE_STATS);
      if (!local) return defaultStats;
      const localStats = JSON.parse(local);
      const result = {};
      ['image', 'audio', 'sentence', 'pinyin'].forEach(function(type) {
        result[type] = {
          done: (localStats[type] && localStats[type].done != null) ? localStats[type].done : defaultStats[type].done,
          mastered: (localStats[type] && localStats[type].mastered != null) ? localStats[type].mastered : defaultStats[type].mastered,
          wrong: (localStats[type] && localStats[type].wrong != null) ? localStats[type].wrong : defaultStats[type].wrong
        };
      });
      return result;
    } catch (e) {
      return defaultStats;
    }
  },

  resetAll: function() {
    localStorage.removeItem(this.KEYS.LEARNED_CARDS);
    localStorage.removeItem(this.KEYS.WRONG_CARDS);
    localStorage.removeItem(this.KEYS.MASTERED_CARDS);
    localStorage.removeItem(this.KEYS.DAILY_GOAL);
    localStorage.removeItem(this.KEYS.DAILY_STATS);
    localStorage.removeItem(this.KEYS.LAST_STUDY_DATE);
    localStorage.removeItem(this.KEYS.STREAK_DAYS);
    localStorage.removeItem(this.KEYS.PRACTICE_STATS);
  }
};

window.getLearnedCards = function() {
  return window.StorageManager.getLearnedCards();
};

window.addLearnedCard = function(card) {
  return window.StorageManager.addLearnedCard(card);
};

window.getWrongCards = function() {
  return window.StorageManager.getWrongCards();
};

window.addWrongCard = function(card) {
  return window.StorageManager.addWrongCard(card);
};

window.getMasteredCards = function() {
  return window.StorageManager.getMasteredCards();
};
