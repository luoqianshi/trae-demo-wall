/* ============================================
   AI 立体回忆馆 — 数字展柜数据管理
   ============================================ */

const Gallery = {
  STORAGE_KEY: 'ai_3d_gallery_items',

  /**
   * 获取所有展柜项目
   */
  getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * 添加模型到展柜
   */
  add(modelData, theme = 'other') {
    const items = this.getAll();
    const item = {
      id: Utils.generateId(),
      name: modelData.name || '未命名模型',
      theme: theme,
      style: modelData.style || 'sculpture',
      geometry: modelData.geometry,
      colors: modelData.colors || [],
      sourceImage: modelData.sourceImage || null,
      createdAt: Utils.getTimestamp(),
      thumbnailRendered: false
    };
    items.unshift(item);
    this._save(items);
    return item;
  },

  /**
   * 删除展柜项目
   */
  remove(id) {
    const items = this.getAll().filter(item => item.id !== id);
    this._save(items);
  },

  /**
   * 按主题筛选
   */
  getByTheme(theme) {
    if (theme === 'all') return this.getAll();
    return this.getAll().filter(item => item.theme === theme);
  },

  /**
   * 获取主题统计
   */
  getThemeCounts() {
    const items = this.getAll();
    const counts = { all: items.length, family: 0, pet: 0, travel: 0, item: 0, other: 0 };
    items.forEach(item => {
      if (counts[item.theme] !== undefined) counts[item.theme]++;
      else counts.other++;
    });
    return counts;
  },

  /**
   * 清空展柜
   */
  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  /**
   * 获取主题中文名
   */
  getThemeName(theme) {
    const names = {
      family: '家人',
      pet: '宠物',
      travel: '旅行',
      item: '物品',
      other: '其他'
    };
    return names[theme] || '其他';
  },

  _save(items) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save gallery:', e);
      Utils.showToast('保存失败，可能存储空间不足');
    }
  }
};
