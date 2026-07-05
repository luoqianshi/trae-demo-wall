// LocalStorage 操作封装
const Storage = {
  KEYS: {
    LAST_VISIT: 'betterDay_lastVisit',
    STREAK: 'betterDay_streak',
    FIRST_VISIT_DONE: 'betterDay_firstVisitDone',
    MESSAGES: 'betterDay_messages',
    TODAY_MESSAGE_INDEX: 'betterDay_todayMessageIndex'
  },

  // 获取今天日期字符串 YYYY-MM-DD
  getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  // 获取昨天日期字符串
  getYesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  // 获取当前日期显示（如 "7月4日"）
  getDateDisplay() {
    const d = new Date();
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  },

  // 计算并更新连续天数，返回当前连续天数
  updateStreak() {
    const today = this.getTodayStr();
    const yesterday = this.getYesterdayStr();
    const lastVisit = localStorage.getItem(this.KEYS.LAST_VISIT);

    if (lastVisit === today) {
      // 今日已来过，不变
      return parseInt(localStorage.getItem(this.KEYS.STREAK) || '1');
    }

    let streak;
    if (lastVisit === yesterday) {
      // 连续
      streak = parseInt(localStorage.getItem(this.KEYS.STREAK) || '0') + 1;
    } else {
      // 断掉了或首次
      streak = 1;
    }

    localStorage.setItem(this.KEYS.LAST_VISIT, today);
    localStorage.setItem(this.KEYS.STREAK, String(streak));
    return streak;
  },

  // 获取当前连续天数（不更新）
  getStreak() {
    return parseInt(localStorage.getItem(this.KEYS.STREAK) || '1');
  },

  // 检查是否已完成首次引导
  isFirstVisitDone() {
    return localStorage.getItem(this.KEYS.FIRST_VISIT_DONE) === 'true';
  },

  // 标记首次引导已完成
  markFirstVisitDone() {
    localStorage.setItem(this.KEYS.FIRST_VISIT_DONE, 'true');
  },

  // 保存留言
  saveMessage(text) {
    const messages = this.getMessages();
    messages.push({
      text: text,
      dateCreated: this.getTodayStr()
    });
    localStorage.setItem(this.KEYS.MESSAGES, JSON.stringify(messages));
  },

  // 获取所有留言
  getMessages() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.MESSAGES)) || [];
    } catch {
      return [];
    }
  },

  // 获取今日要展示的留言
  getTodayMessage() {
    const messages = this.getMessages();
    if (messages.length === 0) return null;

    const todayStr = this.getTodayStr();
    const key = this.KEYS.TODAY_MESSAGE_INDEX;
    let index = parseInt(localStorage.getItem(key) || '-1');

    // 检查是否需要重新选择（新的一天）
    const lastMsgDate = localStorage.getItem('betterDay_lastMessageDate');
    if (lastMsgDate !== todayStr) {
      // 随机选一条
      index = Math.floor(Math.random() * messages.length);
      localStorage.setItem(key, String(index));
      localStorage.setItem('betterDay_lastMessageDate', todayStr);
    }

    return messages[index] || messages[0];
  }
};