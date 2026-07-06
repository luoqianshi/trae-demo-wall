// pages/recommend/recommend.js —— 推荐页逻辑
const recommendUtil = require('../../utils/recommend.js');
const mockRoutes = require('../../utils/mockRoutes.js');

Page({
  data: {
    prefTitle: '',
    prefTemplate: '',
    routeList: [],
    theme: 'light'
  },

  onLoad: function (options) {
    // 初始化主题
    const app = getApp();
    this.setData({ theme: app.getTheme() });
    this.pref = this.buildPreference(options);
    this.refresh();
  },

  onShow: function () {
    // 从上报页返回时，用最新数据重新计算
    if (this.pref) this.refresh();
  },

  // 主题切换回调
  onThemeChange: function(theme) {
    this.setData({ theme: theme });
  },

  // 根据 URL 参数或本地偏好构造 preference
  buildPreference: function (options) {
    const saved = mockRoutes.getPreference();
    // URL 显式参数优先；如未传则回落到本地保存的偏好
    let d, s, t, p, tpl;
    if (options && options.d !== undefined && options.d !== '') {
      d = Number(options.d);
    } else if (saved) {
      d = saved.distanceKm;
    } else {
      d = 5;
    }
    if (options && options.s) {
      // 小程序 onLoad 已自动 URL decode 一次，这里再做一次兼容保险
      s = decodeURIComponent(options.s);
    } else if (saved) {
      s = saved.sport;
    } else {
      s = '慢跑';
    }
    if (options && options.t) {
      t = decodeURIComponent(options.t);
    } else if (saved) {
      t = saved.timeSlot;
    } else {
      t = '夜间';
    }
    if (options && options.p) {
      p = decodeURIComponent(options.p);
    } else if (saved) {
      p = saved.priority;
    } else {
      p = '安静优先';
    }
    // 模板参数
    if (options && options.tpl) {
      tpl = decodeURIComponent(options.tpl);
    } else if (saved) {
      tpl = saved.template || '';
    } else {
      tpl = '';
    }
    return {
      distanceKm: d,
      sport: s,
      timeSlot: t,
      priority: p,
      template: tpl
    };
  },

  refresh: function () {
    const pref = this.pref || { distanceKm: 5, sport: '慢跑', timeSlot: '夜间', priority: '安静优先', template: '' };
    const rawList = recommendUtil.recommend(pref);

    // 获取模板名称（如果有）
    const templateConfig = recommendUtil.TEMPLATE_CONFIG[pref.template];
    const templateName = templateConfig ? templateConfig.name : '';
    const templateSuffix = templateName ? ' · ' + templateName : '';

    // 为 WXML 准备派生字段（WXML 不支持任意方法调用/join）
    const list = rawList.map(function (r) {
      const scores = r.scores || { safety: 60, quietness: 60, fitness: 60, scenery: 60 };
      // 计算统计数据（替换竞速数据）
      const quietMinutes = Math.round(r.durationMin * (scores.quietness / 100));
      const greenRate = Math.round(50 + scores.scenery * 0.3 + Math.random() * 20);
      const avgSpeed = r.sports && r.sports.indexOf('骑行') >= 0 ? '12-18' : '4-6';
      
      return {
        id: r.id,
        name: r.name,
        distanceKm: r.distanceKm,
        durationMin: r.durationMin,
        sportsText: (r.sports || []).join(' / '),
        timeSlotsText: (r.timeSlots || []).join(' / '),
        surfaceTypes: r.surfaceTypes || [],
        tags: r.tags || [],
        riskReports: r.riskReports || [],
        recommendScore: r.recommendScore,
        aiReason: r.aiReason || '',
        isUserUpload: !!r.isUserUpload,
        // 统计数据（替换竞速数据）
        stats: {
          quietMinutes: quietMinutes,
          greenRate: greenRate,
          avgSpeed: avgSpeed
        },
        dimScores: [
          { key: 'safety', label: '安全', value: scores.safety },
          { key: 'quietness', label: '安静', value: scores.quietness },
          { key: 'fitness', label: '运动适配', value: scores.fitness },
          { key: 'scenery', label: '风景', value: scores.scenery }
        ]
      };
    });

    this.setData({
      prefTitle: pref.timeSlot + pref.sport + ' ' + pref.distanceKm + 'km · ' + pref.priority + templateSuffix,
      prefTemplate: templateName,
      routeList: list
    });
  },

  onRefresh: function () {
    this.refresh();
    wx.showToast({ title: '已根据最新反馈重新计算', icon: 'none' });
  },

  onGoDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/route-detail/route-detail?id=' + id });
  },

  onGoReport: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/report/report?id=' + id });
  },

  onGoUpload: function () {
    wx.navigateTo({ url: '/pages/upload/upload' });
  }
});
