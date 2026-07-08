// ===== 云数据库操作工具 =====
const DB = wx.cloud.database();
const _ = DB.command;

module.exports = {
  // 获取用户记录
  async getUser(openid) {
    const res = await DB.collection('users').where({ _openid: openid }).get();
    return res.data[0] || null;
  },

  // 创建/更新用户
  async saveUser(userData) {
    const openid = wx.getCloudID ? '' : (wx.getStorageSync('openid') || '');
    // 查找是否已存在
    const existing = await this.getUser(openid);
    if (existing) {
      return await DB.collection('users').doc(existing._id).update({
        data: { ...userData, updateTime: DB.serverDate() }
      });
    } else {
      return await DB.collection('users').add({
        data: { ...userData, createTime: DB.serverDate(), updateTime: DB.serverDate() }
      });
    }
  },

  // 保存答题记录
  async saveScore(record) {
    return await DB.collection('scores').add({
      data: {
        ...record,
        createTime: DB.serverDate()
      }
    });
  },

  // 获取排行榜（按筛选条件）
  async getRankings(filter = {}) {
    const { level, campusId } = filter;
    let query = {};
    if (level) query.level = level;
    if (campusId) query.campusId = campusId;

    const res = await DB.collection('scores')
      .where(query)
      .orderBy('score', 'desc')
      .orderBy('createTime', 'desc')
      .limit(100)
      .get();
    return res.data;
  },

  // 获取校区统计
  async getCampusStats(level) {
    const res = await DB.collection('scores')
      .where({ level })
      .get();
    
    // 按校区分组统计
    const stats = {};
    for (const r of res.data) {
      if (!stats[r.campusId]) {
        stats[r.campusId] = {
          campusId: r.campusId,
          campusName: r.campusName || '',
          totalStudents: new Set(),
          totalScores: 0,
          count: 0,
          maxScore: 0
        };
      }
      stats[r.campusId].totalStudents.add(r.nickName);
      stats[r.campusId].totalScores += r.score;
      stats[r.campusId].count++;
      if (r.score > stats[r.campusId].maxScore) stats[r.campusId].maxScore = r.score;
    }

    return Object.values(stats).map(s => ({
      campusId: s.campusId,
      campusName: s.campusName,
      studentCount: s.totalStudents.size,
      avgScore: Math.round(s.totalScores / s.count),
      maxScore: s.maxScore,
      testCount: s.count
    })).sort((a, b) => b.avgScore - a.avgScore);
  },

  // 获取我的错题本（从云端）
  async getWrongQuestions(openid) {
    const res = await DB.collection('wrongQuestions').where({ _openid: openid }).get();
    return res.data || [];
  },

  // 保存错题
  async saveWrongQuestion(data) {
    // 先查是否已存在
    const existing = await DB.collection('wrongQuestions')
      .where({ _openid: wx.getStorageSync('openid'), questionId: data.questionId })
      .get();
    if (existing.data.length > 0) {
      return await DB.collection('wrongQuestions').doc(existing.data[0]._id).update({
        data: { wrongCount: _.inc(1), updateTime: DB.serverDate() }
      });
    }
    return await DB.collection('wrongQuestions').add({
      data: { ...data, wrongCount: 1, createTime: DB.serverDate() }
    });
  }
};