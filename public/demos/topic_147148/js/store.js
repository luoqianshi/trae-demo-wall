/**
 * 数据存储层 - localStorage 封装 + 防抖处理
 * 负责所有数据的持久化与读取
 */

const STORAGE_KEYS = {
  USER: 'duolingo_user',
  PROGRESS: 'duolingo_progress',
  WORDBOOK: 'duolingo_wordbook',
  ACHIEVEMENTS: 'duolingo_achievements',
  SETTINGS: 'duolingo_settings',
  CHECKIN: 'duolingo_checkin'
};

// 默认用户数据
const DEFAULT_USER = {
  name: 'Learner',
  avatar: 0,
  xp: 0,
  level: 1,
  streak: 0,
  lastStudyDate: null,
  gems: 100,
  hearts: 5,
  maxHearts: 5,
  heartRecoveryTime: null,
  dailyGoal: 20,
  todayXp: 0,
  totalStudyDays: 0,
  consecutiveLessons: 0,
  doubleXpActive: false
};

const DEFAULT_PROGRESS = {
  currentUnit: 1,
  completedLessons: [],
  lessonStars: {}
};

const DEFAULT_SETTINGS = {
  sound: true,
  notifications: true,
  darkMode: false
};

const DEFAULT_CHECKIN = {
  lastCheckin: null,
  consecutiveDays: 0
};

// 防抖写入队列
const writeQueue = new Map();

function debouncedWrite(key, value) {
  writeQueue.set(key, value);
  if (!writeQueue.has('_timer')) {
    writeQueue.set('_timer', setTimeout(() => {
      writeQueue.forEach((val, k) => {
        if (k !== '_timer') {
          try {
            localStorage.setItem(k, val);
          } catch (e) {
            console.error('localStorage 写入失败:', e);
          }
        }
      });
      writeQueue.clear();
    }, 300));
  }
}

const Store = {
  // 初始化所有数据（首次使用）
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      this.setUser(DEFAULT_USER);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROGRESS)) {
      this.setProgress(DEFAULT_PROGRESS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.WORDBOOK)) {
      this.setWordbook([]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)) {
      this.setAchievements(
        window.APP_DATA.ACHIEVEMENTS.map(a => ({ ...a, unlocked: false, unlockDate: null }))
      );
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.setSettings(DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CHECKIN)) {
      this.setCheckin(DEFAULT_CHECKIN);
    }
    this.recoverHearts();
  },

  // 通用读取
  _get(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error('读取失败:', key, e);
      return defaultValue;
    }
  },

  // 用户数据
  getUser() { return { ...DEFAULT_USER, ...this._get(STORAGE_KEYS.USER, {}) }; },
  setUser(user) { debouncedWrite(STORAGE_KEYS.USER, JSON.stringify(user)); },

  // 进度
  getProgress() { return { ...DEFAULT_PROGRESS, ...this._get(STORAGE_KEYS.PROGRESS, {}) }; },
  setProgress(progress) { debouncedWrite(STORAGE_KEYS.PROGRESS, JSON.stringify(progress)); },

  // 单词本
  getWordbook() { return this._get(STORAGE_KEYS.WORDBOOK, []); },
  setWordbook(book) { debouncedWrite(STORAGE_KEYS.WORDBOOK, JSON.stringify(book)); },

  // 成就
  getAchievements() { return this._get(STORAGE_KEYS.ACHIEVEMENTS, []); },
  setAchievements(achievements) { debouncedWrite(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements)); },

  // 设置
  getSettings() { return { ...DEFAULT_SETTINGS, ...this._get(STORAGE_KEYS.SETTINGS, {}) }; },
  setSettings(settings) { debouncedWrite(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); },

  // 签到
  getCheckin() { return { ...DEFAULT_CHECKIN, ...this._get(STORAGE_KEYS.CHECKIN, {}) }; },
  setCheckin(checkin) { debouncedWrite(STORAGE_KEYS.CHECKIN, JSON.stringify(checkin)); },

  // 计算等级：level = floor(sqrt(xp/100)) + 1
  getLevel(xp) {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  },

  // 当前等级所需 XP 与下一级 XP
  getLevelInfo(xp) {
    const level = this.getLevel(xp);
    const currentLevelXp = (level - 1) * (level - 1) * 100;
    const nextLevelXp = level * level * 100;
    return {
      level,
      currentLevelXp,
      nextLevelXp,
      progress: xp - currentLevelXp,
      total: nextLevelXp - currentLevelXp
    };
  },

  // 添加 XP 并返回是否升级
  addXp(amount) {
    const user = this.getUser();
    const oldLevel = this.getLevel(user.xp);
    user.xp += amount;
    user.todayXp += amount;
    const newLevel = this.getLevel(user.xp);
    this.setUser(user);
    return { leveledUp: newLevel > oldLevel, newLevel, oldLevel };
  },

  // 更新连胜
  updateStreak() {
    const user = this.getUser();
    const today = new Date().toISOString().slice(0, 10);
    if (user.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (user.lastStudyDate === yesterday) {
        user.streak += 1;
      } else {
        user.streak = 1;
      }
      user.lastStudyDate = today;
      user.totalStudyDays += 1;
      this.setUser(user);
    }
    return user.streak;
  },

  // 生命值恢复（每 4 小时恢复 1 颗）
  recoverHearts() {
    const user = this.getUser();
    if (user.hearts >= user.maxHearts) {
      user.heartRecoveryTime = null;
      this.setUser(user);
      return;
    }
    if (user.heartRecoveryTime) {
      const elapsed = Date.now() - user.heartRecoveryTime;
      const intervals = Math.floor(elapsed / (4 * 60 * 60 * 1000));
      if (intervals > 0) {
        user.hearts = Math.min(user.maxHearts, user.hearts + intervals);
        if (user.hearts >= user.maxHearts) {
          user.heartRecoveryTime = null;
        } else {
          user.heartRecoveryTime += intervals * 4 * 60 * 60 * 1000;
        }
        this.setUser(user);
      }
    } else if (user.hearts < user.maxHearts) {
      user.heartRecoveryTime = Date.now();
      this.setUser(user);
    }
  },

  // 扣心
  loseHeart() {
    const user = this.getUser();
    if (user.hearts > 0) {
      user.hearts -= 1;
      if (user.hearts === user.maxHearts - 1) {
        user.heartRecoveryTime = Date.now();
      }
      this.setUser(user);
    }
    return user.hearts;
  },

  // 补心
  addHeart(n = 1) {
    const user = this.getUser();
    user.hearts = Math.min(user.maxHearts, user.hearts + n);
    if (user.hearts >= user.maxHearts) {
      user.heartRecoveryTime = null;
    }
    this.setUser(user);
  },

  // 扣宝石
  spendGems(amount) {
    const user = this.getUser();
    if (user.gems >= amount) {
      user.gems -= amount;
      this.setUser(user);
      return true;
    }
    return false;
  },

  // 完成关卡
  completeLesson(lessonId, stars) {
    const progress = this.getProgress();
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      // 连续完成关卡计数
      const user = this.getUser();
      user.consecutiveLessons = (user.consecutiveLessons || 0) + 1;
      this.setUser(user);
    }
    progress.lessonStars[lessonId] = Math.max(stars, progress.lessonStars[lessonId] || 0);
    this.setProgress(progress);
  },

  // 判断关卡是否解锁
  isLessonUnlocked(lessonId) {
    const progress = this.getProgress();
    // 找到该关卡在课程中的位置
    let prevId = null;
    for (const unit of window.APP_DATA.COURSES) {
      for (let i = 0; i < unit.lessons.length; i++) {
        if (unit.lessons[i].id === lessonId) {
          if (i === 0) {
            // 单元第一关：上一单元最后一关完成 或 当前是第一单元
            const unitIdx = window.APP_DATA.COURSES.indexOf(unit);
            if (unitIdx === 0) return true;
            const prevUnit = window.APP_DATA.COURSES[unitIdx - 1];
            const prevUnitLastLesson = prevUnit.lessons[prevUnit.lessons.length - 1];
            return progress.completedLessons.includes(prevUnitLastLesson.id);
          } else {
            prevId = unit.lessons[i - 1].id;
            return progress.completedLessons.includes(prevId);
          }
        }
      }
    }
    return false;
  },

  // 获取当前可学关卡
  getCurrentLesson() {
    for (const unit of window.APP_DATA.COURSES) {
      for (const lesson of unit.lessons) {
        if (!this.getProgress().completedLessons.includes(lesson.id)) {
          return lesson;
        }
      }
    }
    return null;
  },

  // 更新单词本
  updateWordbook(word, correct) {
    const book = this.getWordbook();
    let entry = book.find(w => w.word === word);
    if (!entry) {
      const wordData = window.APP_DATA.WORDS[word];
      if (!wordData) return;
      entry = {
        word: wordData.word,
        phonetic: wordData.phonetic,
        meaning: wordData.meaning,
        emoji: wordData.emoji,
        example: wordData.example,
        mastery: 0,
        wrongCount: 0,
        lastReview: null,
        nextReview: null
      };
      book.push(entry);
    }
    if (correct) {
      entry.mastery = Math.min(3, entry.mastery + 1);
    } else {
      entry.wrongCount += 1;
      entry.mastery = Math.max(0, entry.mastery - 1);
    }
    entry.lastReview = new Date().toISOString();
    // 艾宾浩斯：1天、2天、4天、7天、15天
    const intervals = [1, 2, 4, 7, 15];
    const idx = Math.min(entry.mastery, intervals.length - 1);
    entry.nextReview = new Date(Date.now() + intervals[idx] * 86400000).toISOString();
    this.setWordbook(book);
  },

  // 解锁成就
  unlockAchievement(id) {
    const achievements = this.getAchievements();
    const ach = achievements.find(a => a.id === id);
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      ach.unlockDate = new Date().toISOString();
      this.setAchievements(achievements);
      return ach;
    }
    return null;
  },

  // 重置所有数据
  resetAll() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    this.init();
  }
};

window.Store = Store;
