Page({
  data: {
    currentLevel: 1,
    badgeList: [],
    earnedCount: 0,
    totalCount: 0
  },

  onShow() {
    this.loadBadges();
  },

  onLoad() {
    this.loadBadges();
  },

  switchLevel(e) {
    const level = parseInt(e.currentTarget.dataset.level);
    if (level === this.data.currentLevel) return;
    this.setData({ currentLevel: level });
    this.loadBadges();
  },

  loadBadges() {
    const level = this.data.currentLevel;
    let courses = [];
    if (level === 1) {
      courses = require('../../data/level1');
    } else if (level === 2) {
      courses = require('../../data/level2');
    }

    const badgeList = [];
    let earnedCount = 0;

    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      let allCompleted = true;
      let hasStarted = false;

      for (const set of course.sets) {
        const key = `progress_${level}_${course.courseId}_${set.id}`;
        const score = wx.getStorageSync(key) || 0;
        if (score > 0) hasStarted = true;
        if (score < 100) allCompleted = false;
      }

      const earned = allCompleted && hasStarted;
      if (earned) earnedCount++;

      badgeList.push({
        courseId: course.courseId,
        badgeName: course.badgeName || '未知徽章',
        courseTitle: course.title || '',
        earned
      });
    }

    this.setData({
      badgeList,
      earnedCount,
      totalCount: badgeList.length
    });
  }
});