Page({
  data: {
    currentLevel: 1,       // 1=一级, 2=二级
    wrongList: [],         // 当前显示的错题列表
    wrongCount: 0,         // 当前级别错题数
    totalWrong: 0,         // 全部错题数
    level1Wrong: 0,
    level2Wrong: 0,
    // 重练状态
    retryMode: false,
    retryQuestion: null,
    retryIndex: -1,
    retryAnswered: false,
    retrySelected: -1,
    retryCorrect: false,
    retryOptionClasses: ['', '', '', ''],
    retryOptionLabels: ['A', 'B', 'C', 'D'],
    // 空状态
    isEmpty: false
  },

  onShow() {
    this.loadWrongAnswers();
  },

  // 扫描本地存储加载所有错题
  loadWrongAnswers(keepRetry) {
    const allWrong = [];
    const keys = wx.getStorageInfoSync().keys;
    for (const key of keys) {
      if (key.startsWith('wrong_')) {
        const data = wx.getStorageSync(key);
        if (data) {
          allWrong.push({ ...data, _key: key });
        }
      }
    }
    // 按时间倒序排列
    allWrong.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const labels = ['A', 'B', 'C', 'D'];
    // 为旧数据补充显示文本
    for (const w of allWrong) {
      if (!w.selectedText && w.selected !== undefined) {
        w.selectedText = '选项' + labels[w.selected];
      }
      if (!w.answerText && w.answer !== undefined) {
        w.answerText = labels[w.answer];
      }
    }

    const level1Wrong = allWrong.filter(w => w.level === 1);
    const level2Wrong = allWrong.filter(w => w.level === 2);
    const currentList = this.data.currentLevel === 1 ? level1Wrong : level2Wrong;

    const update = {
      level1Wrong: level1Wrong.length,
      level2Wrong: level2Wrong.length,
      totalWrong: allWrong.length,
      wrongCount: currentList.length,
      wrongList: currentList,
      isEmpty: currentList.length === 0
    };
    // 非重练模式下退出重练状态
    if (!keepRetry) {
      update.retryMode = false;
      update.retryQuestion = null;
    }
    this.setData(update);
  },

  // 切换级别
  switchLevel(e) {
    const level = parseInt(e.currentTarget.dataset.level);
    if (level === this.data.currentLevel) return;
    this.setData({ currentLevel: level }, () => {
      this.loadWrongAnswers();
    });
  },

  // 清空错题
  clearWrong() {
    const that = this;
    wx.showModal({
      title: '清空错题',
      content: `确定要清空当前级别所有错题吗？（共${this.data.wrongCount}道）`,
      confirmColor: '#FF6B4A',
      success(res) {
        if (res.confirm) {
          const keys = wx.getStorageInfoSync().keys;
          const prefix = `wrong_${that.data.currentLevel}_`;
          for (const key of keys) {
            if (key.startsWith(prefix)) {
              wx.removeStorageSync(key);
            }
          }
          wx.showToast({ title: '已清空', icon: 'success' });
          that.loadWrongAnswers();
        }
      }
    });
  },

  // 错题重练（将所有错题按顺序展示）
  retryAll() {
    if (this.data.wrongCount === 0) {
      wx.showToast({ title: '没有错题需要重练', icon: 'none' });
      return;
    }
    this.startRetry(0);
  },

  // 重新练习单题
  retrySingle(e) {
    const idx = parseInt(e.currentTarget.dataset.idx);
    this.startRetry(idx);
  },

  // 进入重练模式
  startRetry(idx) {
    const wrong = this.data.wrongList[idx];
    if (!wrong) return;
    this.setData({
      retryMode: true,
      retryQuestion: wrong,
      retryIndex: idx,
      retryAnswered: false,
      retrySelected: -1,
      retryCorrect: false,
      retryOptionClasses: ['', '', '', '']
    });
  },

  // 重练选择选项
  retrySelect(e) {
    if (this.data.retryAnswered) return;
    const idx = parseInt(e.currentTarget.dataset.index);
    const q = this.data.retryQuestion;
    const isCorrect = idx === q.answer;

    const classes = ['', '', '', ''];
    if (isCorrect) {
      classes[idx] = 'correct';
    } else {
      classes[idx] = 'wrong';
      classes[q.answer] = 'correct';
    }

    this.setData({
      retryAnswered: true,
      retrySelected: idx,
      retryCorrect: isCorrect,
      retryOptionClasses: classes
    });

    if (isCorrect) {
      // 答对了 → 从错题本移除该题
      setTimeout(() => {
        wx.removeStorageSync(q._key);
        wx.showToast({ title: '已掌握！👏', icon: 'none' });
        // 继续下一题或退出
        this.retryNextOrExit();
      }, 1000);
    }
  },

  // 重练下一题或退出
  retryNextOrExit() {
    const currentIdx = this.data.retryIndex;
    const that = this;
    // 重新加载错题列表（当前题已被移除），保持重练模式
    this.loadWrongAnswers(true);
    // setData 回调中获取更新后的列表
    const checkNext = () => {
      const newList = that.data.wrongList;
      if (currentIdx < newList.length) {
        that.startRetry(currentIdx);
      } else if (newList.length > 0) {
        that.startRetry(0);
      } else {
        // 所有错题都已掌握
        that.setData({
          retryMode: false,
          retryQuestion: null
        });
        wx.showToast({ title: '全部掌握！太棒了！🎉', icon: 'none' });
      }
    };
    // setData 需要一点时间完成，用 setTimeout 确保数据同步
    setTimeout(checkNext, 50);
  },

  // 退出重练模式
  exitRetry() {
    this.setData({
      retryMode: false,
      retryQuestion: null
    });
  },

  // 获取课程标题（兼容旧数据）
  getCourseTitle(wrong) {
    return wrong.courseTitle || `第${wrong.courseId}讲`;
  }
});