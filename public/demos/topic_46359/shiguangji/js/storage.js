/**
 * 食光机 - 数据持久层
 * 基于 localStorage 的 CRUD 操作，管理所有美食记录
 */
const Storage = (function () {
  const STORAGE_KEY = 'shiguangji_records';
  const SETTINGS_KEY = 'shiguangji_settings';

  /**
   * 获取所有记录
   * @returns {Array} 记录数组，按日期降序排列
   */
  function getAllRecords() {
    const data = localStorage.getItem(STORAGE_KEY);
    const records = data ? JSON.parse(data) : [];
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * 获取单条记录
   * @param {string} id - 记录ID
   * @returns {Object|null}
   */
  function getRecord(id) {
    const records = getAllRecords();
    return records.find(r => r.id === id) || null;
  }

  /**
   * 新增记录
   * @param {Object} record - 记录对象
   * @returns {Object} 保存后的记录（含ID和创建时间）
   */
  function addRecord(record) {
    const records = getAllRecords();
    const newRecord = {
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      createdAt: new Date().toISOString(),
      ...record
    };
    records.push(newRecord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return newRecord;
  }

  /**
   * 更新记录
   * @param {string} id - 记录ID
   * @param {Object} updates - 要更新的字段
   * @returns {Object|null} 更新后的记录
   */
  function updateRecord(id, updates) {
    const records = getAllRecords();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return null;
    records[index] = { ...records[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return records[index];
  }

  /**
   * 删除记录
   * @param {string} id - 记录ID
   * @returns {boolean} 是否删除成功
   */
  function deleteRecord(id) {
    const records = getAllRecords();
    const filtered = records.filter(r => r.id !== id);
    if (filtered.length === records.length) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }

  /**
   * 搜索记录
   * @param {Object} filters - 筛选条件 {keyword, tags, mealType, dateFrom, dateTo}
   * @returns {Array} 筛选后的记录
   */
  function searchRecords(filters) {
    let records = getAllRecords();

    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      records = records.filter(r =>
        r.dishName.toLowerCase().includes(kw) ||
        (r.notes && r.notes.toLowerCase().includes(kw))
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      records = records.filter(r =>
        r.tags && filters.tags.some(tag => r.tags.includes(tag))
      );
    }

    if (filters.mealType && filters.mealType !== 'all') {
      records = records.filter(r => r.mealType === filters.mealType);
    }

    if (filters.dateFrom) {
      records = records.filter(r => new Date(r.date) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      records = records.filter(r => new Date(r.date) <= new Date(filters.dateTo));
    }

    return records;
  }

  /**
   * 获取统计数据
   * @returns {Object} 统计信息
   */
  function getStats() {
    const records = getAllRecords();
    const tagCount = {};
    const mealTypeCount = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    const difficultyCount = { easy: 0, medium: 0, hard: 0 };
    const monthlyCount = {};

    records.forEach(r => {
      if (r.tags) {
        r.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
      if (r.mealType && mealTypeCount[r.mealType] !== undefined) {
        mealTypeCount[r.mealType]++;
      }
      if (r.difficulty && difficultyCount[r.difficulty] !== undefined) {
        difficultyCount[r.difficulty]++;
      }
      if (r.date) {
        const month = r.date.substring(0, 7);
        monthlyCount[month] = (monthlyCount[month] || 0) + 1;
      }
    });

    return {
      total: records.length,
      tagCount,
      mealTypeCount,
      difficultyCount,
      monthlyCount,
      avgRating: records.length > 0
        ? (records.reduce((sum, r) => sum + (r.rating || 0), 0) / records.length).toFixed(1)
        : '0.0'
    };
  }

  /**
   * 获取用户设置
   */
  function getSettings() {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { userName: '美食家', initialized: false };
  }

  /**
   * 保存用户设置
   */
  function saveSettings(settings) {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  }

  /**
   * 导出所有数据为JSON
   */
  function exportData() {
    return JSON.stringify({
      records: getAllRecords(),
      settings: getSettings(),
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  /**
   * 从JSON导入数据
   */
  function importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.records && Array.isArray(data.records)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.records));
      }
      if (data.settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
      }
      return true;
    } catch (e) {
      console.error('导入数据失败:', e);
      return false;
    }
  }

  /**
   * 清空所有数据
   */
  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * 插入示例数据（首次使用时）
   */
  function seedSampleData() {
    const existing = getAllRecords();
    if (existing.length > 0) return;

    const samples = [
      {
        dishName: '番茄牛腩煲',
        image: null,
        emoji: '🍲',
        date: getDateOffset(-1),
        mealType: 'dinner',
        tags: ['家常菜', '炖菜', '牛肉'],
        difficulty: 'medium',
        notes: '第一次尝试慢炖，牛腩软糯入味，番茄酸甜适中，家人赞不绝口。',
        rating: 5
      },
      {
        dishName: '蒜蓉西兰花',
        image: null,
        emoji: '🥦',
        date: getDateOffset(-2),
        mealType: 'lunch',
        tags: ['健康', '快手菜', '蔬菜'],
        difficulty: 'easy',
        notes: '快手健康菜，10分钟搞定。适合减脂期食用。',
        rating: 4
      },
      {
        dishName: '红烧排骨',
        image: null,
        emoji: '🍖',
        date: getDateOffset(-4),
        mealType: 'dinner',
        tags: ['家常菜', '硬菜', '猪肉'],
        difficulty: 'hard',
        notes: '周末大展身手，糖色炒得恰到好处。',
        rating: 5
      },
      {
        dishName: '宫保鸡丁',
        image: null,
        emoji: '🥘',
        date: getDateOffset(-6),
        mealType: 'dinner',
        tags: ['川菜', '家常菜', '鸡肉'],
        difficulty: 'medium',
        notes: '麻辣鲜香，花生酥脆，下饭神器。',
        rating: 4
      },
      {
        dishName: '清蒸鲈鱼',
        image: null,
        emoji: '🐟',
        date: getDateOffset(-8),
        mealType: 'dinner',
        tags: ['清淡', '海鲜', '健康'],
        difficulty: 'medium',
        notes: '清蒸保留了鱼的鲜味，葱姜去腥效果很好。',
        rating: 5
      }
    ];

    samples.forEach(s => addRecord(s));
  }

  function getDateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  return {
    getAllRecords,
    getRecord,
    addRecord,
    updateRecord,
    deleteRecord,
    searchRecords,
    getStats,
    getSettings,
    saveSettings,
    exportData,
    importData,
    clearAll,
    seedSampleData
  };
})();
