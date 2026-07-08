// pages/teacher/teacher.js
const app = getApp();
Page({

  data: {
    selectedLevel: 1,
    overview: {
      studentCount: 0,
      testCount: 0,
      avgScore: 0,
      passRate: 0
    },
    regionStats: []
  },

  onLoad() {
    // 检查教师登录状态
    const teacherLoggedIn = wx.getStorageSync('teacherLoggedIn');
    if (!teacherLoggedIn) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.loadStats();
  },

  onShow() {
    // 再次检查登录状态（防止从其他页面返回）
    const teacherLoggedIn = wx.getStorageSync('teacherLoggedIn');
    if (!teacherLoggedIn) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.loadStats();
  },

  /**
   * 切换等级
   */
  switchLevel(e) {
    const level = parseInt(e.currentTarget.dataset.level);
    this.setData({ selectedLevel: level });
    this.loadStats();
  },

  /**
   * 加载统计数据
   */
  loadStats() {
    const level = this.data.selectedLevel;
    const allKeys = wx.getStorageInfoSync().keys || [];

    // 收集该等级的所有进度记录
    const records = [];
    const studentSet = new Set();
    const regionData = {};
    const totalCourses = level === 1 ? 38 : 38;

    for (const key of allKeys) {
      if (key.startsWith(`progress_${level}_`)) {
        const data = wx.getStorageSync(key);
        if (data) {
          const parts = key.split('_');

          // 尝试从记录中读取地区信息，否则从 userInfo 读取
          const userInfo = wx.getStorageSync('userInfo') || {};
          const regionName = data.regionName || userInfo.regionName || userInfo.province || '其他地区';

          if (!regionData[regionName]) {
            regionData[regionName] = {
              regionName,
              totalScore: 0,
              count: 0,
              maxScore: 0,
              students: new Set(),
              passCount: 0,
              courseSet: new Set()
            };
          }

          regionData[regionName].totalScore += data.score || 0;
          regionData[regionName].count++;
          regionData[regionName].students.add(data.nickName);
          regionData[regionName].courseSet.add(`${parts[2]}_${parts[3]}`);
          if ((data.score || 0) > regionData[regionName].maxScore) {
            regionData[regionName].maxScore = data.score || 0;
          }
          if ((data.score || 0) >= 60) {
            regionData[regionName].passCount++;
          }

          studentSet.add(data.nickName);
          records.push(data);
        }
      }
    }

    // 计算总览数据
    const totalScore = records.reduce((sum, r) => sum + (r.score || 0), 0);
    const avgScore = records.length > 0 ? Math.round(totalScore / records.length) : 0;
    const passCount = records.filter(r => (r.score || 0) >= 60).length;
    const passRate = records.length > 0 ? Math.round(passCount / records.length * 100) : 0;

    this.setData({
      overview: {
        studentCount: studentSet.size,
        testCount: records.length,
        avgScore,
        passRate
      }
    });

    // 计算各地区数据
    const regionStats = Object.values(regionData).map(r => ({
      regionId: r.regionName,
      regionName: r.regionName,
      studentCount: r.students.size,
      avgScore: r.count > 0 ? Math.round(r.totalScore / r.count) : 0,
      maxScore: r.maxScore,
      passRate: r.count > 0 ? Math.round(r.passCount / r.count * 100) : 0,
      completionRate: Math.min(100, Math.round(r.courseSet.size / totalCourses * 100)),
      testCount: r.count
    }));

    // 按平均分排序
    regionStats.sort((a, b) => b.avgScore - a.avgScore);

    this.setData({ regionStats });
  },

  /**
   * 点击地区卡片，查看详情
   */
  onRegionTap(e) {
    const region = e.currentTarget.dataset.region;
    wx.showModal({
      title: region.regionName,
      content: `参与人数：${region.studentCount}人\n答题次数：${region.testCount}次\n平均分：${region.avgScore}分\n最高分：${region.maxScore}分\n及格率：${region.passRate}%`,
      showCancel: false,
      confirmText: '知道了'
    });
  }
});