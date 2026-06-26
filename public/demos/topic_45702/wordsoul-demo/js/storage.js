/**
 * WordSoul - 本地存储管理模块
 * 封装 localStorage 操作，提供数据持久化能力
 */

var Storage = {
  // 存储键名前缀
  PREFIX: 'wordsoul_',

  // 默认 AI 配置
  DEFAULT_AI_CONFIG: {
    apiUrl: '',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 500,
    enabled: false
  },

  /**
   * 获取存储键
   */
  key(name) {
    return this.PREFIX + name;
  },

  /**
   * 读取数据
   */
  get(name, defaultValue = null) {
    try {
      const data = localStorage.getItem(this.key(name));
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error('Storage get error:', e);
      return defaultValue;
    }
  },

  /**
   * 写入数据
   */
  set(name, value) {
    try {
      localStorage.setItem(this.key(name), JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  /**
   * 删除数据
   */
  remove(name) {
    localStorage.removeItem(this.key(name));
  },

  /**
   * 获取 AI 配置
   */
  getAIConfig() {
    return this.get('ai_config', { ...this.DEFAULT_AI_CONFIG });
  },

  /**
   * 保存 AI 配置
   */
  saveAIConfig(config) {
    return this.set('ai_config', config);
  },

  /**
   * 获取用户词库
   */
  getWordBank() {
    return this.get('word_bank', []);
  },

  /**
   * 保存词语到词库
   */
  addWord(word) {
    const bank = this.getWordBank();
    if (!bank.includes(word)) {
      bank.push(word);
      this.set('word_bank', bank);
    }
    return bank;
  },

  /**
   * 获取对战记录
   */
  getRecords() {
    return this.get('records', []);
  },

  /**
   * 保存对战记录
   */
  saveRecord(record) {
    const records = this.getRecords();
    records.unshift({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...record
    });
    // 只保留最近 50 条
    if (records.length > 50) {
      records.pop();
    }
    return this.set('records', records);
  },

  /**
   * 获取统计信息
   */
  getStats() {
    const records = this.getRecords();
    return {
      totalGames: records.length,
      iterGames: records.filter(r => r.mode === 'iter').length,
      battleGames: records.filter(r => r.mode === 'battle').length,
      winCount: records.filter(r => r.result === 'win').length,
      loseCount: records.filter(r => r.result === 'lose').length,
      drawCount: records.filter(r => r.result === 'draw').length,
      wordCount: this.getWordBank().length
    };
  },

  /**
   * 清空所有数据
   */
  clearAll() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },

  /**
   * 导出数据
   */
  exportData() {
    const data = {};
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        const name = key.replace(this.PREFIX, '');
        data[name] = this.get(name);
      }
    });
    return JSON.stringify(data, null, 2);
  },

  /**
   * 导入数据
   */
  importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      Object.keys(data).forEach(key => {
        this.set(key, data[key]);
      });
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }
};
