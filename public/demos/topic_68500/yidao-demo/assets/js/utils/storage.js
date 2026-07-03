/**
 * 易道 App - LocalStorage 工具
 */

const Storage = {
  // 存储 key 前缀
  PREFIX: 'yidao_',
  
  // 保存数据
  save(key, data) {
    try {
      const fullKey = this.PREFIX + key;
      const json = JSON.stringify(data);
      localStorage.setItem(fullKey, json);
      return true;
    } catch (e) {
      console.warn('Storage save error:', e);
      return false;
    }
  },
  
  // 加载数据
  load(key) {
    try {
      const fullKey = this.PREFIX + key;
      const json = localStorage.getItem(fullKey);
      if (json) {
        return JSON.parse(json);
      }
      return null;
    } catch (e) {
      console.warn('Storage load error:', e);
      return null;
    }
  },
  
  // 删除数据
  remove(key) {
    const fullKey = this.PREFIX + key;
    localStorage.removeItem(fullKey);
  },
  
  // 清除所有数据
  clear() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },
  
  // === 卜卦记录 ===
  
  // 保存卜卦记录
  saveDivinationRecord(record) {
    const history = this.load('divinationHistory') || [];
    history.unshift(record);
    // 最多保存50条
    if (history.length > 50) {
      history.pop();
    }
    this.save('divinationHistory', history);
    return history;
  },
  
  // 获取卜卦记录
  getDivinationHistory() {
    return this.load('divinationHistory') || [];
  },
  
  // 清除卜卦记录
  clearDivinationHistory() {
    this.save('divinationHistory', []);
  },
  
  // === 学习进度 ===
  
  // 获取学习进度
  getStudyProgress() {
    return this.load('studyProgress') || {
      completedCourses: [],
      totalProgress: 0,
      studyTime: 0
    };
  },
  
  // 保存学习进度
  saveStudyProgress(progress) {
    this.save('studyProgress', progress);
  },
  
  // 标记课程完成
  completeCourse(courseId) {
    const progress = this.getStudyProgress();
    if (!progress.completedCourses.includes(courseId)) {
      progress.completedCourses.push(courseId);
      progress.totalProgress = Math.round((progress.completedCourses.length / 8) * 100);
      this.saveStudyProgress(progress);
    }
    return progress;
  },
  
  // 检查课程是否完成
  isCourseCompleted(courseId) {
    const progress = this.getStudyProgress();
    return progress.completedCourses.includes(courseId);
  },
  
  // === 用户偏好 ===
  
  // 获取用户偏好
  getPreferences() {
    return this.load('preferences') || {
      soundEnabled: true,
      animationEnabled: true,
      lastVisitedPage: 'home'
    };
  },
  
  // 保存用户偏好
  savePreferences(prefs) {
    this.save('preferences', prefs);
  }
};