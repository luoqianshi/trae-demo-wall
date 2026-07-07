/* ============================================
   storage.js — localStorage 数据持久化
   ============================================ */

const STORAGE_KEY = 'curio-archive-data';
const APPROX_MAX_BYTES = 5 * 1024 * 1024;

const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data;
    } catch {
      return [];
    }
  },

  getUsageInfo() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        total += localStorage.getItem(key).length * 2;
      }
    }
    return {
      usedBytes: total,
      usedMB: (total / (1024 * 1024)).toFixed(1),
      remainingBytes: Math.max(0, APPROX_MAX_BYTES - total),
      remainingMB: Math.max(0, (APPROX_MAX_BYTES - total) / (1024 * 1024)).toFixed(1),
    };
  },

  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn('localStorage quota exceeded');
        return false;
      }
      throw e;
    }
  },

  clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  },

  getAll() {
    return this.load();
  },

  exportReadable() {
    const list = this.load();
    if (list.length === 0) return '# 🏺 奇物档案馆\n\n*暂无藏品*';
    let md = '# 🏺 奇物档案馆\n\n';
    md += `> 共 ${list.length} 件藏品，收录于 ${new Date().toISOString().slice(0, 10)}\n\n`;
    md += '---\n\n';
    list.forEach((item, i) => {
      md += `## ${i + 1}. ${item.itemName}\n\n`;
      md += `**描述**：${item.itemDescription || '无'}\n\n`;
      md += `**标签**：${(item.tags || []).join('、') || '无'}\n\n`;
      md += `**创建时间**：${item.createdAt || '未知'}\n\n`;
      md += `**收藏**：${item.favorited ? '⭐ 已收藏' : '♡ 未收藏'}\n\n`;
      if (item.stories) {
        md += '### 故事\n\n';
        Object.entries(item.stories).forEach(([style, story]) => {
          md += `**${style}**：${story.text ? story.text.slice(0, 100) + '...' : '无'}\n\n`;
        });
      }
      md += '---\n\n';
    });
    return md;
  },

  getById(id) {
    const items = this.load();
    return items.find(item => item.id === id) || null;
  },

  add(item) {
    const items = this.load();
    items.unshift(item);
    return this.save(items);
  },

  update(id, updates) {
    const items = this.load();
    const idx = items.findIndex(item => item.id === id);
    if (idx === -1) return false;
    items[idx] = { ...items[idx], ...updates };
    return this.save(items);
  },

  remove(id) {
    const items = this.load();
    const filtered = items.filter(item => item.id !== id);
    return this.save(filtered);
  },

  removeStory(id, style) {
    const items = this.load();
    const idx = items.findIndex(item => item.id === id);
    if (idx === -1) return false;

    const curio = { ...items[idx] };
    const stories = { ...(curio.stories || {}) };
    const selectedStyles = [...(curio.selectedStyles || Object.keys(stories))];

    if (!stories[style]) return false;

    delete stories[style];
    const newStyles = selectedStyles.filter(s => s !== style);

    if (newStyles.length === 0) {
      const filtered = items.filter(item => item.id !== id);
      return this.save(filtered);
    }

    items[idx] = { ...curio, stories, selectedStyles: newStyles };
    return this.save(items);
  },

  exportJSON(metaOnly = false) {
    const data = this.load();
    let output;

    if (metaOnly) {
      output = data.map(item => {
        const cloned = { ...item };
        if (cloned.stories) {
          const newStories = {};
          for (const key of Object.keys(cloned.stories)) {
            const story = cloned.stories[key];
            const { imageUrl, ...rest } = story;
            newStories[key] = rest;
          }
          cloned.stories = newStories;
        }
        return cloned;
      });
    } else {
      output = data;
    }

    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = metaOnly ? `curio-archive-meta-${dateStr}.json` : `curio-archive-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!Array.isArray(data)) {
            reject(new Error('无效的数据格式：需要 JSON 数组'));
            return;
          }

          const now = new Date().toISOString();
          const validated = data.map(item => {
            if (typeof item !== 'object' || item === null) {
              return {
                id: this.generateId(),
                itemName: '未命名藏品',
                selectedStyles: [],
                stories: {},
                createdAt: now,
                favorited: false,
              };
            }
            return {
              id: item.id || this.generateId(),
              itemName: item.itemName || '未命名藏品',
              selectedStyles: Array.isArray(item.selectedStyles) ? item.selectedStyles : [],
              stories: (item.stories && typeof item.stories === 'object') ? item.stories : {},
              createdAt: item.createdAt || now,
              favorited: item.favorited === undefined ? false : item.favorited,
              ...Object.fromEntries(
                Object.entries(item).filter(([key]) =>
                  !['id', 'itemName', 'selectedStyles', 'stories', 'createdAt', 'favorited'].includes(key)
                )
              ),
            };
          });

          this.save(validated);
          resolve(validated);
        } catch {
          reject(new Error('JSON 解析失败，请检查文件格式'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  },

  getStats() {
    const list = this.load();
    const totalItems = list.length;
    let totalStories = 0;
    const styleCount = {};
    let favoritedCount = 0;
    list.forEach(item => {
      if (item.stories) {
        const styles = Object.keys(item.stories);
        totalStories += styles.length;
        styles.forEach(s => { styleCount[s] = (styleCount[s] || 0) + 1; });
      }
      if (item.favorited) favoritedCount++;
    });
    const uniqueStyles = Object.keys(styleCount).length;
    const today = new Date().toISOString().slice(0, 10);
    const firstDate = list.length > 0
      ? list.reduce((a, b) => (a.createdAt < b.createdAt ? a : b)).createdAt.slice(0, 10)
      : today;
    return { totalItems, totalStories, uniqueStyles, styleCount, favoritedCount, firstDate, today };
  },

  generateId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 6);
    return `curio_${timestamp}${random}`;
  },

  _compressBase64Image(dataUrl, maxWidth) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxWidth) {
          h = Math.round(h * (maxWidth / w));
          w = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  },

  async shrinkImageData(curio) {
    const stories = curio.stories || {};
    const keys = Object.keys(stories);
    for (const key of keys) {
      const story = stories[key];
      if (story.imageUrl && story.imageUrl.startsWith('data:')) {
        stories[key] = { ...story, imageUrl: await this._compressBase64Image(story.imageUrl, 400) };
      }
    }
    if (curio.userImage && curio.userImage.startsWith('data:')) {
      curio.userImage = await this._compressBase64Image(curio.userImage, 300);
    }
    return curio;
  },
};