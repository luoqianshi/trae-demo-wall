// pages/result/result.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    level: '',
    courseId: '',
    setId: '',
    score: 0,
    total: 0,
    correct: 0,
    pct: 0,
    evaluation: '',
    wrongList: [],
    wrongCount: 0,
    optionLabelMap: 'ABCDEFGHIJ'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const level = options.level || '';
    const courseId = options.courseId || '';
    const setId = options.setId || '';
    const score = parseInt(options.score || '0');
    const correct = parseInt(options.correct || '0');
    const total = parseInt(options.total || '0');
    const pct = total > 0 ? Math.round(correct / total * 100) : 0;

    // 计算评价等级
    let evaluation = '';
    if (pct >= 90) {
      evaluation = '太棒了！🌟';
    } else if (pct >= 70) {
      evaluation = '表现不错！继续加油！';
    } else if (pct >= 60) {
      evaluation = '及格了！再练练吧！';
    } else {
      evaluation = '别灰心，再来一次！';
    }

    this.setData({
      level,
      courseId,
      setId,
      score,
      correct,
      total,
      pct,
      evaluation
    });

    // 累加学习总统计（首页学习数据卡片使用）
    this.updateQuizStats(score, correct, total);

    // 读取错题信息
    this.loadWrongQuestions(level, courseId, setId);

    // 优秀评价触发撒花
    if (pct >= 90) {
      this.triggerConfetti();
    }
  },

  /**
   * 累加学习总统计（首页学习数据卡片使用）
   */
  updateQuizStats(score, correct, total) {
    const stats = wx.getStorageSync('quizStats') || { total: 0, correct: 0, maxStreak: 0 };
    // correct 存正确题数累加，total 存总答题数累加
    stats.total += total;
    stats.correct += correct;
    // 更新连续答对
    if (correct === total) {
      stats.maxStreak = Math.max(stats.maxStreak || 0, correct);
    }
    wx.setStorageSync('quizStats', stats);
  },

  /**
   * 从本地存储读取错题信息
   */
  loadWrongQuestions(level, courseId, setId) {
    const prefix = `wrong_${level}_${courseId}_${setId}`;
    const wrongList = [];
    const allKeys = wx.getStorageInfoSync().keys || [];

    for (const key of allKeys) {
      if (key.startsWith(prefix)) {
        const wrongData = wx.getStorageSync(key);
        if (wrongData) {
          wrongList.push(wrongData);
        }
      }
    }

    // 按题目序号排序
    wrongList.sort((a, b) => (a.index || 0) - (b.index || 0));

    this.setData({
      wrongList,
      wrongCount: wrongList.length
    });
  },

  /**
   * 撒花效果
   */
  triggerConfetti() {
    // 使用简单的动画模拟撒花效果
    const emojis = ['🌟', '✨', '🎉', '🎊', '💫', '⭐'];
    let confettiItems = [];
    for (let i = 0; i < 20; i++) {
      confettiItems.push({
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        left: Math.random() * 100,
        delay: Math.random() * 1000,
        duration: 1500 + Math.random() * 1000
      });
    }
    this.setData({ confettiItems });
  },

  /**
   * 再做一遍：清除进度记录，跳转答题页
   */
  onRetry() {
    const { level, courseId, setId } = this.data;

    // 清除该套题的进度记录
    const progressKey = `progress_${level}_${courseId}_${setId}`;
    wx.removeStorageSync(progressKey);

    // 清除错题记录
    const prefix = `wrong_${level}_${courseId}_${setId}`;
    const allKeys = wx.getStorageInfoSync().keys || [];
    for (const key of allKeys) {
      if (key.startsWith(prefix)) {
        wx.removeStorageSync(key);
      }
    }

    wx.redirectTo({
      url: `/pages/quiz/quiz?level=${level}&courseId=${courseId}&setId=${setId}`
    });
  },

  /**
   * 返回课程页面
   */
  onBackToCourse() {
    const { level, courseId, setId, score } = this.data;
    // 在跳转前把进度同步到全局数据和 localStorage，保证课程页能读到
    const progressKey = `progress_${level}_${courseId}_${setId}`;
    const app = getApp();
    app.globalData.progressSync[progressKey] = score;
    // 同时写入 localStorage 双重保障
    wx.setStorageSync(progressKey, score);
    
    wx.navigateBack({ delta: 1 });
  }
});