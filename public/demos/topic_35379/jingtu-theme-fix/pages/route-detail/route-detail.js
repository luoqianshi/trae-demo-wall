// pages/route-detail/route-detail.js —— 路线详情逻辑（新增随笔功能）
const mockRoutes = require('../../utils/mockRoutes.js');

Page({
  data: {
    route: null,
    dimScores: [],
    // 随笔内容
    note: '',
    noteSaved: false,
    // 路线统计信息（替换竞速数据）
    stats: {
      quietMinutes: 0,
      greenRate: 0,
      avgSpeed: 0
    },
    theme: 'light'
  },

  onLoad: function (options) {
    // 初始化主题
    const app = getApp();
    this.setData({ theme: app.getTheme() });
    const id = options.id;
    const r = mockRoutes.getRouteById(id);
    if (!r) {
      this.setData({ route: null });
      return;
    }
    const scores = r.scores || { safety: 60, quietness: 60, fitness: 60, scenery: 60 };
    
    // 计算统计数据
    const quietMinutes = Math.round(r.durationMin * (scores.quietness / 100));
    const greenRate = Math.round(50 + scores.scenery * 0.3 + Math.random() * 20);
    
    const routeView = Object.assign({}, r, {
      sportsText: (r.sports || []).join(' / '),
      timeSlotsText: (r.timeSlots || []).join(' / '),
      surfaceTypes: r.surfaceTypes || [],
      tags: r.tags || [],
      riskReports: r.riskReports || [],
      riskReportsText: (r.riskReports || []).join('、'),
      polylineMock: r.polylineMock || [],
      reason: r.reason || ''
    });
    
    // 加载已保存的随笔
    const note = this.loadNote(id);
    
    this.routeId = id;
    this.setData({
      route: routeView,
      dimScores: [
        { key: 'safety', label: '安全', value: scores.safety },
        { key: 'quietness', label: '安静', value: scores.quietness },
        { key: 'fitness', label: '运动适配', value: scores.fitness },
        { key: 'scenery', label: '风景', value: scores.scenery }
      ],
      note: note,
      stats: {
        quietMinutes: quietMinutes,
        greenRate: greenRate,
        avgSpeed: r.sports && r.sports.indexOf('骑行') >= 0 ? '约 12-18' : '约 4-6'
      }
    });
  },

  // 加载随笔
  loadNote: function (routeId) {
    try {
      const notes = wx.getStorageSync('jingtu_notes');
      if (notes && notes[routeId]) {
        return notes[routeId];
      }
    } catch (e) {
      // ignore
    }
    return '';
  },

  // 保存随笔
  saveNote: function () {
    if (!this.data.note.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }
    
    try {
      const notes = wx.getStorageSync('jingtu_notes') || {};
      notes[this.routeId] = this.data.note;
      wx.setStorageSync('jingtu_notes', notes);
      this.setData({ noteSaved: true });
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => {
        this.setData({ noteSaved: false });
      }, 2000);
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 随笔输入
  onNoteInput: function (e) {
    this.setData({ note: e.detail.value });
  },

  onBack: function () {
    wx.navigateBack({ delta: 1 });
  },

  onGoReport: function () {
    wx.navigateTo({ url: '/pages/report/report?id=' + this.routeId });
  },

  // 主题切换回调
  onThemeChange: function(theme) {
    this.setData({ theme: theme });
  }
});