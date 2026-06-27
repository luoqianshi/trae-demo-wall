/**
 * CodeNotes API 接口封装
 * 基于 json-server 的 RESTful API
 */

// API 基础地址
const API_BASE_URL = 'http://localhost:3000';

/**
 * API 请求封装
 * @param {string} url - 请求地址
 * @param {object} options - 请求配置
 * @returns {Promise} 响应数据
 */
async function request(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // DELETE 请求可能没有响应体
    if (options.method === 'DELETE') {
      return { success: true };
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * 笔记相关 API
 */
const NotesAPI = {
  /**
   * 获取所有笔记
   * @returns {Promise<Array>} 笔记列表
   */
  async getAll() {
    const notes = await request(`${API_BASE_URL}/notes?_sort=updatedAt&_order=desc`);
    return notes;
  },

  /**
   * 根据ID获取单个笔记
   * @param {number} id - 笔记ID
   * @returns {Promise<Object>} 笔记详情
   */
  async getById(id) {
    const note = await request(`${API_BASE_URL}/notes/${id}`);
    return note;
  },

  /**
   * 搜索笔记（按标题或内容）
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>} 匹配的笔记列表
   */
  async search(keyword) {
    const notes = await request(`${API_BASE_URL}/notes?q=${encodeURIComponent(keyword)}`);
    return notes;
  },

  /**
   * 按标签筛选笔记
   * @param {string} tag - 标签名称
   * @returns {Promise<Array>} 笔记列表
   */
  async filterByTag(tag) {
    const notes = await request(`${API_BASE_URL}/notes?tags_like=${encodeURIComponent(tag)}`);
    return notes;
  },

  /**
   * 【新增】获取收藏笔记列表
   * @returns {Promise<Array>} 收藏的笔记列表
   */
  async getCollected() {
    const notes = await request(`${API_BASE_URL}/notes?isCollect=true&_sort=updatedAt&_order=desc`);
    return notes;
  },

  /**
   * 【新增】切换笔记收藏状态
   * @param {number} id - 笔记ID
   * @param {boolean} isCollect - 收藏状态
   * @returns {Promise<Object>} 更新后的笔记
   */
  async toggleCollect(id, isCollect) {
    // 先获取原有数据
    const existingNote = await this.getById(id);
    
    // 更新收藏状态
    const updatedNote = {
      ...existingNote,
      isCollect: isCollect,
      updatedAt: new Date().toISOString()
    };

    const result = await request(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedNote)
    });

    return result;
  },

  /**
   * 创建新笔记
   * @param {Object} noteData - 笔记数据
   * @param {string} noteData.title - 标题
   * @param {string} noteData.content - 内容
   * @param {Array<string>} noteData.tags - 标签数组
   * @param {string} noteData.language - 代码语言
   * @returns {Promise<Object>} 创建成功的笔记
   */
  async create(noteData) {
    const now = new Date().toISOString();
    const newNote = {
      ...noteData,
      tags: noteData.tags || [],
      isCollect: false, // 【新增】新建笔记默认不收藏
      createdAt: now,
      updatedAt: now
    };

    const result = await request(`${API_BASE_URL}/notes`, {
      method: 'POST',
      body: JSON.stringify(newNote)
    });

    return result;
  },

  /**
   * 更新笔记
   * @param {number} id - 笔记ID
   * @param {Object} noteData - 更新的笔记数据
   * @returns {Promise<Object>} 更新后的笔记
   */
  async update(id, noteData) {
    // 先获取原有数据，保留创建时间和收藏状态
    const existingNote = await this.getById(id);
    
    const updatedNote = {
      ...existingNote,
      ...noteData,
      id: id,
      createdAt: existingNote.createdAt,
      isCollect: existingNote.isCollect || false, // 【新增】保留收藏状态
      updatedAt: new Date().toISOString()
    };

    const result = await request(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedNote)
    });

    return result;
  },

  /**
   * 删除笔记
   * @param {number} id - 笔记ID
   * @returns {Promise<Object>} 删除结果
   */
  async delete(id) {
    await request(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE'
    });
    return { success: true, id };
  },

  /**
   * 获取所有标签（从笔记中提取）
   * @returns {Promise<Array<string>>} 标签列表
   */
  async getAllTags() {
    const notes = await request(`${API_BASE_URL}/notes`);
    const tagsSet = new Set();
    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  },

  /**
   * 【新增】获取统计数据
   * @returns {Promise<Object>} 统计数据对象
   */
  async getStats() {
    const notes = await request(`${API_BASE_URL}/notes`);
    
    // 计算今日新增数量
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = notes.filter(note => {
      const createdAt = new Date(note.createdAt);
      createdAt.setHours(0, 0, 0, 0);
      return createdAt.getTime() === today.getTime();
    }).length;

    // 计算收藏数量
    const collectCount = notes.filter(note => note.isCollect === true).length;

    // 计算各语言数量
    const languageStats = {};
    notes.forEach(note => {
      const lang = note.language || 'Other';
      languageStats[lang] = (languageStats[lang] || 0) + 1;
    });

    // 计算标签数量
    const tagsSet = new Set();
    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => tagsSet.add(tag));
      }
    });

    return {
      total: notes.length,
      todayCount,
      collectCount,
      tagsCount: tagsSet.size,
      languageStats
    };
  }
};

// 导出 API 对象
window.NotesAPI = NotesAPI;