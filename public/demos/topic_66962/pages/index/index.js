const app = getApp();

// 引入课程数据以获取总课程数
const level1Data = require('../../data/level1');
const level2Data = require('../../data/level2');

Page({
  data: {
    userInfo: {},
    level1Total: level1Data.length || 0,
    level2Total: level2Data.length || 0,
    level1Completed: 0,
    level2Completed: 0,
    level1Progress: 0,
    level2Progress: 0,
    totalAnswers: 0,
    correctAnswers: 0,
    accuracyRate: 0,
    maxStreak: 0,
    wrongCount: 0
  },

  onLoad() {
    // 从全局获取用户信息
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
    this.setData({ userInfo });
  },

  onShow() {
    this.loadStudyData();
  },

  // 读取本地存储中的学习数据
  loadStudyData() {
    const allKeys = wx.getStorageInfoSync().keys || [];
    
    // 从单个 progress_ 键计算各等级的完成进度
    // 每节课有 A/B 两套题，两套都完成（>=100分）才算该课完成
    const l1LessonProgress = {}; // { "1": { A: 100, B: 0 }, "2": { A: 100, B: 100 } }
    const l2LessonProgress = {};

    for (const key of allKeys) {
      if (key.startsWith('progress_')) {
        const parts = key.split('_'); // progress_1_1_A
        if (parts.length >= 4) {
          const level = parseInt(parts[1]);
          const courseId = parts[2];
          const setId = parts[3];
          const score = wx.getStorageSync(key) || 0;
          
          const lessonMap = level === 1 ? l1LessonProgress : 
                            level === 2 ? l2LessonProgress : null;
          if (!lessonMap) continue;
          
          if (!lessonMap[courseId]) lessonMap[courseId] = {};
          lessonMap[courseId][setId] = score;
        }
      }
    }

    // 统计两套都完成的课程数
    let l1CompletedCount = 0;
    for (const courseId in l1LessonProgress) {
      const sets = l1LessonProgress[courseId];
      const aScore = sets['A'] || 0;
      const bScore = sets['B'] || 0;
      if (aScore >= 100 && bScore >= 100) l1CompletedCount++;
    }

    let l2CompletedCount = 0;
    for (const courseId in l2LessonProgress) {
      const sets = l2LessonProgress[courseId];
      const aScore = sets['A'] || 0;
      const bScore = sets['B'] || 0;
      if (aScore >= 100 && bScore >= 100) l2CompletedCount++;
    }

    const level1Total = this.data.level1Total || 1;
    const level2Total = this.data.level2Total || 1;

    this.setData({
      level1Completed: l1CompletedCount,
      level2Completed: l2CompletedCount,
      level1Progress: Math.round((l1CompletedCount / level1Total) * 100),
      level2Progress: Math.round((l2CompletedCount / level2Total) * 100)
    });

    // 读取答题统计数据
    const stats = wx.getStorageSync('quizStats') || { total: 0, correct: 0, maxStreak: 0 };
    
    // 统计错题数（复用 allKeys）
    let wrongCount = 0;
    for (const key of allKeys) {
      if (key.startsWith('wrong_')) {
        wrongCount++;
      }
    }

    this.setData({
      totalAnswers: stats.total || 0,
      correctAnswers: stats.correct || 0,
      accuracyRate: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      maxStreak: stats.maxStreak || 0,
      wrongCount
    });
  },

  // 跳转到错题汇总
  goWrong() {
    wx.navigateTo({
      url: '/pages/wrong/wrong'
    });
  },

  // 用户设置（切换账户 / 退出登录）
  onUserSettings() {
    const that = this;
    wx.showActionSheet({
      itemList: ['切换账户', '退出登录'],
      success(res) {
        if (res.tapIndex === 0) {
          // 切换账户：只清除用户信息，保留学习数据
          that.doLogout(false);
        } else if (res.tapIndex === 1) {
          // 退出登录：弹窗确认
          wx.showModal({
            title: '退出登录',
            content: '退出后将清除当前账户信息，确定要退出吗？',
            confirmColor: '#FF6B4A',
            success(modalRes) {
              if (modalRes.confirm) {
                that.doLogout(true);
              }
            }
          });
        }
      }
    });
  },

  // 执行退出逻辑
  doLogout(clearAll) {
    const app = getApp();
    // 清除用户信息
    wx.removeStorageSync('userInfo');
    app.globalData.userInfo = null;
    app.globalData.isLoggedIn = false;
    
    if (clearAll) {
      // 退出登录：询问是否清除学习记录
      wx.showModal({
        title: '清除学习记录',
        content: '是否同时清除本地学习进度和错题记录？',
        confirmColor: '#FF6B4A',
        cancelText: '保留记录',
        confirmText: '全部清除',
        success(modalRes) {
          if (modalRes.confirm) {
            // 清除所有学习相关数据
            const keys = wx.getStorageInfoSync().keys;
            for (const key of keys) {
              if (key.startsWith('progress_') || key.startsWith('wrong_') ||
                  key.startsWith('level') || key === 'quizStats') {
                wx.removeStorageSync(key);
              }
            }
          }
          // 跳转到登录页
          wx.reLaunch({ url: '/pages/login/login' });
        }
      });
    } else {
      // 切换账户：直接跳登录页
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },

  // 跳转到文学一级课程列表
  goLevel1() {
    wx.navigateTo({
      url: '/pages/courses/courses?level=1'
    });
  },

  // 跳转到文学二级课程列表
  goLevel2() {
    wx.navigateTo({
      url: '/pages/courses/courses?level=2'
    });
  }
});