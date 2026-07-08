Page({
  data: {
    currentLevel: 1,
    courses: [],
    progressMap: {}
  },

  onLoad(options) {
    const level = parseInt(options.level) || 1;
    this.setData({ currentLevel: level });
    this.loadCourses(level);
    // onLoad 中也直接同步进度（双重保险）
    this.syncProgressFromStorage();
  },

  onShow() {
    // 每次页面显现都重新读取进度，确保答题回来按钮状态更新
    this.loadProgress();
  },

  // 加载课程数据
  loadCourses(level) {
    let courses = [];
    if (level === 1) {
      courses = require('../../data/level1');
    } else if (level === 2) {
      courses = require('../../data/level2');
    }
    this.setData({ courses });
    this.loadProgress();
  },

  // 从 localStorage 直接同步数据到 globalData（页面启动时确保一致性）
  syncProgressFromStorage() {
    const app = getApp();
    const allKeys = wx.getStorageInfoSync().keys || [];
    let synced = 0;
    for (const key of allKeys) {
      if (key.startsWith('progress_')) {
        const stored = wx.getStorageSync(key) || 0;
        if (stored > 0) {
          app.globalData.progressSync[key] = stored;
          synced++;
        }
      }
    }
    console.log('[courses] 从 localStorage 同步了', synced, '条进度记录到 globalData');
  },

  // 从本地存储 + 全局数据读取进度（三重保障）
  // 同时预计算所有显示属性（WXML 不支持在 {{}} 中调用方法）
  loadProgress() {
    const level = this.data.currentLevel;
    const courses = this.data.courses;
    if (!courses || courses.length === 0) {
      console.warn('[courses] courses 为空，跳过 loadProgress');
      return;
    }
    const progressMap = {};
    const app = getApp();

    // 第一遍：构建 progressMap
    for (const course of courses) {
      for (const set of course.sets) {
        const key = `progress_${level}_${course.courseId}_${set.id}`;
        
        // 从全局数据读取（页面间即时同步）
        let score = app.globalData.progressSync[key] || 0;
        
        // 从 localStorage 读取（持久化保障）
        const stored = wx.getStorageSync(key) || 0;
        
        // 取最大值（防止数据不一致）
        if (stored > score) {
          score = stored;
          app.globalData.progressSync[key] = stored;
        }
        
        progressMap[key] = score;
      }
    }

    console.log('[courses] 进度加载完成:', JSON.stringify(progressMap));

    // 第二遍：为每个课程预计算显示属性（_statusClass, _statusText, _setAClass 等）
    const enrichedCourses = courses.map(course => {
      const cid = course.courseId;
      
      // 计算课程状态：两组都做过（score>0）才算"已学完"
      const aScore = progressMap[`progress_${level}_${cid}_A`] || 0;
      const bScore = progressMap[`progress_${level}_${cid}_B`] || 0;
      const hasStarted = aScore > 0 || bScore > 0;
      const bothDone = aScore > 0 && bScore > 0;
      const status = bothDone ? 'completed' : (hasStarted ? 'in_progress' : 'not_started');
      const statusTextMap = { completed: '已学完', in_progress: '进行中', not_started: '未开始' };

      return {
        ...course,
        _statusClass: status,
        _statusText: statusTextMap[status] || '未开始',
        _setAClass: aScore > 0 ? 'completed' : 'not-started',
        _setASuffix: aScore > 0 ? ' ✓' : '',
        _setBClass: bScore > 0 ? 'completed' : 'not-started',
        _setBSuffix: bScore > 0 ? ' ✓' : '',
      };
    });

    // 强制触发页面重新渲染
    this.setData({ 
      progressMap: progressMap,
      courses: enrichedCourses
    });
  },

  // 更新课程状态显示
  updateCourseStatus() {
    // 重新设置数据触发 wx:for 更新
    this.setData({ courses: this.data.courses });
  },

  // 获取课程完成状态
  getCourseStatus(courseId) {
    const level = this.data.currentLevel;
    const course = this.data.courses.find(c => c.courseId === courseId);
    if (!course) return 'not_started';

    let hasStarted = false;
    let allDone = true;

    for (const set of course.sets) {
      const key = `progress_${level}_${courseId}_${set.id}`;
      const score = this.data.progressMap[key] || 0;
      if (score > 0) {
        hasStarted = true;
      }
      if (score < 100) {
        allDone = false;
      }
    }

    if (allDone && hasStarted) return 'completed';
    if (hasStarted) return 'in_progress';
    return 'not_started';
  },

  // 获取课程完成状态文字
  getCourseStatusText(courseId) {
    const status = this.getCourseStatus(courseId);
    const map = {
      completed: '已学完',
      in_progress: '进行中',
      not_started: '未开始'
    };
    return map[status] || '未开始';
  },

  // 获取 Set 按钮样式（已做/未做）
  getSetBtnClass(courseId, setId) {
    const level = this.data.currentLevel;
    const key = `progress_${level}_${courseId}_${setId}`;
    const score = this.data.progressMap[key] || 0;
    return score > 0 ? 'completed' : 'not-started';
  },

  // 检查 Set 是否已完成
  getSetDone(courseId, setId) {
    const level = this.data.currentLevel;
    const key = `progress_${level}_${courseId}_${setId}`;
    return (this.data.progressMap[key] || 0) >= 100;
  },

  // 获取按钮后缀
  getSetSuffix(courseId, setId) {
    const level = this.data.currentLevel;
    const key = `progress_${level}_${courseId}_${setId}`;
    const score = this.data.progressMap[key] || 0;
    return score > 0 ? ' ✓' : '';
  },

  // 图片加载失败时的兜底
  onImageError(e) {
    // 图片加载失败，保留卡片白色背景即可
    console.warn('课程配图加载失败');
  },

  // 跳转答题页面
  goQuiz(e) {
    const { courseid, setid } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/quiz/quiz?level=${this.data.currentLevel}&courseId=${courseid}&setId=${setid}`
    });
  }
});