Page({
  data: {
    level: 1,
    courseId: 1,
    setId: 'A',
    questions: [],
    currentIndex: 0,
    selectedIndex: -1,
    answered: false,
    isCorrect: false,
    score: 0,
    totalQuestions: 0,
    currentQuestion: {},
    currentExplainText: '',
    showConfetti: false,
    correctCount: 0,
    optionLabels: ['A', 'B', 'C', 'D'],
    optionClasses: ['', '', '', ''],
    optionLabelClasses: ['', '', '', ''],
    progressPercent: 0,
    confettiPieces: [],
    audioCtxCorrect: null,
    audioCtxWrong: null
  },

  onLoad(options) {
    const level = parseInt(options.level) || 1;
    const courseId = parseInt(options.courseId) || 1;
    const setId = options.setId || 'A';

    this.setData({ level, courseId, setId });

    // 加载题库
    let allCourses = [];
    if (level === 1) {
      allCourses = require('../../data/level1');
    } else if (level === 2) {
      allCourses = require('../../data/level2');
    }

    // 找到对应的课程和套题
    const course = allCourses.find(c => c.courseId === courseId);
    if (!course) {
      wx.showToast({ title: '课程数据加载失败', icon: 'none' });
      return;
    }

    const set = course.sets.find(s => s.id === setId);
    if (!set) {
      wx.showToast({ title: '套题数据加载失败', icon: 'none' });
      return;
    }

    // 给每个题目注入课程标题
    const questions = set.questions.map(q => ({ ...q, courseTitle: course.title }));

    // 预生成撒花位数据（避免 WXML 中调用 Math.random）
    const confettiPieces = [];
    const confettiColors = ['#FF6B4A', '#FFD54F', '#4CAF50', '#4A90D9', '#E040FB', '#FF4081'];
    for (let i = 0; i < 25; i++) {
      confettiPieces.push({
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)]
      });
    }

    this.setData({
      questions: questions,
      totalQuestions: questions.length,
      currentIndex: 0,
      score: 0,
      correctCount: 0,
      currentQuestion: questions[0],
      currentExplainText: this._getExplainText(questions[0]),
      progressPercent: 0,
      confettiPieces,
      // 初始化音效
      audioCtxCorrect: wx.createInnerAudioContext({ useWebAudioImplement: false }),
      audioCtxWrong: wx.createInnerAudioContext({ useWebAudioImplement: false })
    });

    // 设置音效文件路径
    const correctAudio = this.data.audioCtxCorrect;
    const wrongAudio = this.data.audioCtxWrong;
    correctAudio.src = '/sounds/correct.wav';
    wrongAudio.src = '/sounds/wrong.wav';
    correctAudio.volume = 0.6;
    wrongAudio.volume = 0.5;
  },

  // 计算选项样式
  _computeOptionClasses(selectedIndex, answered, currentQuestion) {
    const classes = ['', '', '', ''];
    const labelClasses = ['', '', '', ''];
    
    if (answered && currentQuestion) {
      for (let i = 0; i < 4; i++) {
        if (i === currentQuestion.answer) {
          classes[i] = 'correct';
          labelClasses[i] = 'correct';
        } else if (i === selectedIndex && i !== currentQuestion.answer) {
          classes[i] = 'wrong';
          labelClasses[i] = 'wrong';
        }
      }
    } else if (selectedIndex >= 0) {
      classes[selectedIndex] = 'selected';
      labelClasses[selectedIndex] = 'selected';
    }
    
    return { optionClasses: classes, optionLabelClasses: labelClasses };
  },

  // 选择选项
  selectOption(e) {
    if (this.data.answered) return;

    const index = parseInt(e.currentTarget.dataset.index);
    const { currentQuestion } = this.data;
    const isCorrect = index === currentQuestion.answer;

    const { optionClasses, optionLabelClasses } = this._computeOptionClasses(
      index, true, currentQuestion
    );

    this.setData({
      selectedIndex: index,
      answered: true,
      isCorrect,
      ...optionClasses,
      ...optionLabelClasses
    });

    // 记录错题（保存完整数据）
    if (!isCorrect) {
      const { level, courseId, setId, currentIndex } = this.data;
      const wrongKey = `wrong_${level}_${courseId}_${setId}_${currentIndex}`;
      wx.setStorageSync(wrongKey, {
        question: currentQuestion.q,
        options: currentQuestion.options,
        selected: index,
        selectedText: currentQuestion.options[index],
        answer: currentQuestion.answer,
        answerText: currentQuestion.options[currentQuestion.answer],
        explain: currentQuestion.explain,
        tag: currentQuestion.tag,
        level, courseId, setId,
        courseTitle: currentQuestion.courseTitle || '',
        timestamp: Date.now()
      });
    }

    // 更新分数
    if (isCorrect) {
      this.setData({ 
        score: this.data.score + 10,
        correctCount: this.data.correctCount + 1
      });
      // 答对音效 + 撒花
      this.playCorrectSound();
      this.triggerMiniConfetti();
    } else {
      // 答错音效
      this.playWrongSound();
    }
  },

  // 下一题
  nextQuestion() {
    const nextIndex = this.data.currentIndex + 1;
    if (nextIndex >= this.data.totalQuestions) return;

    const progressPercent = ((nextIndex + 1) / this.data.totalQuestions * 100).toFixed(1);

    const { optionClasses, optionLabelClasses } = this._computeOptionClasses(
      -1, false, null
    );

    this.setData({
      currentIndex: nextIndex,
      currentQuestion: this.data.questions[nextIndex],
      currentExplainText: this._getExplainText(this.data.questions[nextIndex]),
      selectedIndex: -1,
      answered: false,
      isCorrect: false,
      progressPercent: parseFloat(progressPercent),
      ...optionClasses,
      ...optionLabelClasses
    });
  },

  // 查看成绩
  showResult() {
    const { level, courseId, setId, score, correctCount, totalQuestions } = this.data;

    // 保存进度 —— localStorage + 全局数据 双重保险
    const progressKey = `progress_${level}_${courseId}_${setId}`;
    
    // 1. 存 localStorage
    try {
      wx.setStorageSync(progressKey, score);
      // 同时存排行榜记录
      const userInfo = wx.getStorageSync('userInfo') || {};
      wx.setStorageSync(progressKey + '_record', {
        score, total: totalQuestions,
        nickName: userInfo.nickName || '',
        regionName: userInfo.regionName || userInfo.province || '',
        grade: userInfo.grade || '',
        name: userInfo.name || '',
        level, courseId, setId,
        timestamp: Date.now()
      });
    } catch(e) {
      console.warn('[quiz] localStorage写入失败:', e);
    }

    // 2. 存全局数据（页面间即时可读）
    const app = getApp();
    app.globalData.progressSync[progressKey] = score;

    console.log('[quiz] 进度已保存:', progressKey, '=', score, '全局同步:', JSON.stringify(app.globalData.progressSync));

    // 可见提示
    wx.showToast({ title: '进度已保存 ✓', icon: 'success', duration: 800 });

    // 启动撒花动画
    this.setData({ showConfetti: true });

    setTimeout(() => {
      wx.redirectTo({
        url: `/pages/result/result?level=${level}&courseId=${courseId}&setId=${setId}&score=${score}&correct=${correctCount}&total=${totalQuestions}`
      });
    }, 1500);
  },

  // 答对音效
  playCorrectSound() {
    try {
      this.data.audioCtxCorrect.stop();
      this.data.audioCtxCorrect.play();
    } catch(e) { /* 静默 */ }
  },

  // 答错音效
  playWrongSound() {
    try {
      this.data.audioCtxWrong.stop();
      this.data.audioCtxWrong.play();
    } catch(e) { /* 静默 */ }
  },

  // 单题答对撒花效果（小规模）
  triggerMiniConfetti() {
    // 在答题区随机创建几个彩色圆点动画
    const pages = getCurrentPages();
    if (pages.length > 0) {
      // 创建一个轻量的小撒花效果
      const miniPieces = [];
      const colors = ['#FF6B4A', '#FFD54F', '#4CAF50', '#4A90D9', '#E040FB', '#FF4081'];
      for (let i = 0; i < 10; i++) {
        miniPieces.push({
          left: 10 + Math.random() * 80,
          top: 20 + Math.random() * 60,
          size: 8 + Math.random() * 16,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.3,
          rotate: Math.random() * 360
        });
      }
      this.setData({ miniConfetti: miniPieces });
      // 0.6秒后清除
      setTimeout(() => {
        this.setData({ miniConfetti: [] });
      }, 600);
    }
  },

  // 获取解析文本（安全兜底）
  _getExplainText(q) {
    return (q && q.explain) ? q.explain : '暂无解析';
  }
});