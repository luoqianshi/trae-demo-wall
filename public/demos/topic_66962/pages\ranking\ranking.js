// pages/ranking/ranking.js
const app = getApp();
const dbUtil = require('../../utils/db');

Page({

  data: {
    activeTab: 'personal',
    selectedLevelIndex: 0,
    selectedCourseIndex: 0,
    levelOptions: ['全部等级', '文学一级', '文学二级'],
    courseOptions: ['全部课程'],
    personalList: [],
    classList: [],
    campusList: [],
    currentUser: null
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ currentUser: userInfo });

    // 尝试从云数据库读取
    this.loadFromCloud();
    // 同时从本地存储加载
    this.loadFromStorage();
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ currentUser: userInfo });
    this.loadFromStorage();
  },

  /**
   * Tab切换
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab }, () => {
      this.loadFromStorage();
    });
  },

  /**
   * 等级筛选切换
   */
  onLevelChange(e) {
    this.setData({ selectedLevelIndex: e.detail.value }, () => {
      this.loadFromStorage();
    });
  },

  /**
   * 课程筛选切换
   */
  onCourseChange(e) {
    this.setData({ selectedCourseIndex: e.detail.value }, () => {
      this.loadFromStorage();
    });
  },

  /**
   * 从云数据库加载排行榜数据
   */
  async loadFromCloud() {
    try {
      const level = this.data.selectedLevelIndex;
      const filter = {};
      if (level === 1) filter.level = 1;
      else if (level === 2) filter.level = 2;

      const scores = await dbUtil.getRankings(filter);
      if (scores && scores.length > 0) {
        this.processRankings(scores);
      }
    } catch (e) {
      console.log('云数据库读取失败，使用本地数据', e);
    }
  },

  /**
   * 从本地存储加载进度数据
   */
  loadFromStorage() {
    const allKeys = wx.getStorageInfoSync().keys || [];
    const levelFilter = this.data.selectedLevelIndex;
    const courseFilter = this.data.selectedCourseIndex;

    // 收集所有进度记录
    const records = [];
    for (const key of allKeys) {
      if (key.startsWith('progress_')) {
        const data = wx.getStorageSync(key);
        if (data) {
          // 解析key: progress_{level}_{courseId}_{setId}
          const parts = key.split('_');
          const level = parseInt(parts[1] || '0');

          // 等级筛选
          if (levelFilter === 1 && level !== 1) continue;
          if (levelFilter === 2 && level !== 2) continue;

          // 获取用户信息
          const userInfo = wx.getStorageSync('userInfo') || {};
          records.push({
            ...data,
            level,
            courseId: parts[2] || '',
            setId: parts[3] || '',
            nickName: data.nickName || userInfo.nickName || '未知用户',
            avatar: data.avatar || userInfo.avatar || '',
            regionName: data.regionName || userInfo.regionName || userInfo.province || '',
            grade: data.grade || userInfo.grade || '',
            key
          });
        }
      }
    }

    // 按各Tab处理数据
    this.processPersonalRanking(records);
    this.processClassRanking(records);
    this.processCampusRanking(records);
  },

  /**
   * 处理个人排行
   */
  processPersonalRanking(records) {
    const courseFilter = this.data.selectedCourseIndex;
    let filtered = [...records];

    // 课程筛选（只显示该用户的最新一次记录）
    const userLatest = {};
    for (const r of filtered) {
      const uid = r.nickName || r.key;
      if (!userLatest[uid] || r.timestamp > userLatest[uid].timestamp) {
        userLatest[uid] = r;
      }
    }

    let list = Object.values(userLatest);
    if (courseFilter > 0 && this.data.courseOptions.length > courseFilter) {
      const courseName = this.data.courseOptions[courseFilter];
      if (courseName !== '全部课程') {
        list = list.filter(r => r.courseName === courseName);
      }
    }

    // 按分数从高到低排序
    list.sort((a, b) => (b.score || 0) - (a.score || 0));

    // 添加排名
    const currentUser = this.data.currentUser;
    const processedList = list.map((item, index) => ({
      ...item,
      rank: index + 1,
      isMe: currentUser && (item.nickName === currentUser.nickName)
    }));

    // 更新课程选项
    const courseSet = new Set();
    records.forEach(r => {
      if (r.courseName) courseSet.add(r.courseName);
    });
    const courseOptions = ['全部课程', ...Array.from(courseSet)];

    this.setData({
      personalList: processedList,
      courseOptions: courseOptions.length > 1 ? courseOptions : ['全部课程']
    });
  },

  /**
   * 处理班级排行
   */
  processClassRanking(records) {
    const groupMap = {};
    let filtered = [...records];

    // 按课程筛选（取每人最新记录）
    const userLatest = {};
    for (const r of filtered) {
      const uid = r.nickName || r.key;
      if (!userLatest[uid] || r.timestamp > userLatest[uid].timestamp) {
        userLatest[uid] = r;
      }
    }

    // 按年级分组
    for (const r of Object.values(userLatest)) {
      const gradeName = r.grade || r.gradeName || '未知班级';
      if (!groupMap[gradeName]) {
        groupMap[gradeName] = { totalScore: 0, count: 0, students: new Set() };
      }
      groupMap[gradeName].totalScore += r.score || 0;
      groupMap[gradeName].count++;
      groupMap[gradeName].students.add(r.nickName);
    }

    const list = Object.entries(groupMap).map(([gradeName, data]) => ({
      gradeName,
      avgScore: Math.round(data.totalScore / data.count),
      count: data.students.size
    }));

    list.sort((a, b) => b.avgScore - a.avgScore);
    const processedList = list.map((item, index) => ({
      ...item, rank: index + 1
    }));

    this.setData({ classList: processedList });
  },

  /**
   * 处理地区排行
   */
  processCampusRanking(records) {
    const groupMap = {};
    let filtered = [...records];

    // 按课程筛选（取每人最新记录）
    const userLatest = {};
    for (const r of filtered) {
      const uid = r.nickName || r.key;
      if (!userLatest[uid] || r.timestamp > userLatest[uid].timestamp) {
        userLatest[uid] = r;
      }
    }

    // 按地区分组
    for (const r of Object.values(userLatest)) {
      const regionId = r.regionName || '其他地区';
      const regionName = r.regionName || '其他地区';
      if (!groupMap[regionId]) {
        groupMap[regionId] = { totalScore: 0, count: 0, maxScore: 0, students: new Set(), regionName };
      }
      groupMap[regionId].totalScore += r.score || 0;
      groupMap[regionId].count++;
      groupMap[regionId].students.add(r.nickName);
      if ((r.score || 0) > groupMap[regionId].maxScore) {
        groupMap[regionId].maxScore = r.score || 0;
      }
    }

    const list = Object.entries(groupMap).map(([regionId, data]) => ({
      regionId,
      regionName: data.regionName,
      avgScore: Math.round(data.totalScore / data.count),
      maxScore: data.maxScore,
      count: data.students.size
    }));

    list.sort((a, b) => b.avgScore - a.avgScore);
    const processedList = list.map((item, index) => ({
      ...item, rank: index + 1
    }));

    this.setData({ campusList: processedList });
  }
});