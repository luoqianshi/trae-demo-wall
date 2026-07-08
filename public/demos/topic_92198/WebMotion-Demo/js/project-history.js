/**
 * WebMotion - 项目历史管理模块
 * 自动保存 AI 生成的项目到 localStorage，支持浏览和复用
 * 也可导出为 .webmotion.json 文件
 */
const ProjectHistory = (function() {
  const STORAGE_KEY = 'webmotion_history';
  const MAX_HISTORY = 50; // 最多保存 50 条记录

  /**
   * 获取所有历史记录
   */
  function getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('读取项目历史失败:', e);
      return [];
    }
  }

  /**
   * 将历史记录写入 localStorage，配额不足时逐步删除最旧记录重试
   * @param {Array} history - 历史记录数组
   * @returns {boolean} 是否保存成功
   */
  function persistHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      return true;
    } catch (e) {
      console.warn('保存项目历史失败（可能 localStorage 已满），开始渐进式清理:', e.message);
      // 渐进式清理：每次删除最旧的一条记录后重试，最多 5 次
      for (let attempt = 0; attempt < 5; attempt++) {
        if (history.length <= 1) {
          // 只剩一条仍然失败，无法继续清理
          console.error('保存项目历史失败：已删除至最后一条仍无法保存', e);
          return false;
        }
        history.pop(); // 删除最旧的一条
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
          console.warn('渐进式清理成功，当前记录数:', history.length);
          return true;
        } catch (e2) {
          console.warn('第 ' + (attempt + 1) + ' 次清理后仍失败，剩余记录数:', history.length);
        }
      }
      console.error('保存项目历史失败：渐进式清理 5 次后仍无法保存');
      return false;
    }
  }

  /**
   * 保存项目到历史记录
   * @param {Object} projectData - 项目数据（SceneManager.exportProject() 的结果）
   * @param {string} sourceText - 原始文案
   * @param {string} summary - AI 生成的摘要
   * @param {string} [thumbnailDataUrl] - 可选缩略图（base64 JPEG，建议 ~10KB）
   */
  function save(projectData, sourceText, summary, thumbnailDataUrl) {
    const history = getAll();
    const record = {
      id: Utils.uid(),
      name: sourceText ? sourceText.substring(0, 30) + (sourceText.length > 30 ? '...' : '') : '未命名项目',
      sourceText: sourceText || '',
      summary: summary || '',
      project: projectData,
      createdAt: new Date().toISOString(),
      sceneCount: projectData.scenes ? projectData.scenes.length : 0
    };
    // 缩略图为可选字段，旧记录不会有
    if (thumbnailDataUrl) {
      record.thumbnail = thumbnailDataUrl;
    }
    history.unshift(record); // 最新的放最前面
    // 限制历史记录数量
    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY;
    }
    const saved = persistHistory(history);
    if (!saved) {
      console.warn('项目历史保存失败：localStorage 空间不足，已尝试渐进式清理但仍无法保存');
    }
    return record;
  }

  /**
   * 保存项目到历史记录（带缩略图）
   * @param {Object} projectData - 项目数据（SceneManager.exportProject() 的结果）
   * @param {string} sourceText - 原始文案
   * @param {string} summary - AI 生成的摘要
   * @param {string} thumbnailDataUrl - 缩略图（base64 JPEG，建议 ~10KB）
   */
  function saveWithThumbnail(projectData, sourceText, summary, thumbnailDataUrl) {
    return save(projectData, sourceText, summary, thumbnailDataUrl);
  }

  /**
   * 获取存储使用情况（用于调试）
   * @returns {{used: number, count: number, maxCount: number}} 存储信息
   */
  function getStorageInfo() {
    let used = 0;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      used = data ? data.length : 0;
    } catch (e) {
      console.error('获取存储信息失败:', e);
    }
    return {
      used: used,
      count: getAll().length,
      maxCount: MAX_HISTORY
    };
  }

  /**
   * 删除指定记录
   */
  function remove(id) {
    const history = getAll().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  /**
   * 清空所有历史
   */
  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * 导出项目为 .webmotion.json 文件
   */
  function exportToFile(projectData, filename) {
    const json = JSON.stringify(projectData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const name = (filename || 'webmotion-project') + '.webmotion.json';
    Utils.downloadBlob(blob, name);
  }

  /**
   * 从文件导入项目
   */
  function importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.scenes || !Array.isArray(data.scenes)) {
            reject(new Error('文件格式不正确：缺少 scenes 数组'));
            return;
          }
          resolve(data);
        } catch (err) {
          reject(new Error('文件解析失败: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  return {
    getAll,
    save,
    saveWithThumbnail,
    remove,
    clearAll,
    exportToFile,
    importFromFile,
    getStorageInfo
  };
})();
