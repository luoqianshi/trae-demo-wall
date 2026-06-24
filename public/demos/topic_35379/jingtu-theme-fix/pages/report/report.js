// pages/report/report.js —— 路况评分与上报（支持问题修复）
const mockRoutes = require('../../utils/mockRoutes.js');

// 根据 1~5 星值生成用于渲染的星星数组
function buildStars(val) {
  const arr = [];
  for (let i = 1; i <= 5; i++) {
    arr.push({ n: i, on: i <= val });
  }
  return arr;
}

Page({
  data: {
    route: null,
    theme: 'light',
    starRows: [
      { key: 'safety', label: '安全', value: 4, stars: buildStars(4) },
      { key: 'quietness', label: '安静', value: 4, stars: buildStars(4) },
      { key: 'fitness', label: '运动适配', value: 4, stars: buildStars(4) },
      { key: 'scenery', label: '风景', value: 4, stars: buildStars(4) }
    ],
    // 隐患标签（新增更多选项）
    riskOptions: [
      { label: '下班高峰车流', value: '下班高峰车流', selected: false },
      { label: '道路狭窄', value: '道路狭窄', selected: false },
      { label: '噪音过大', value: '噪音过大', selected: false },
      { label: '路灯损坏', value: '路灯损坏', selected: false },
      { label: '路面坑洼', value: '路面坑洼', selected: false },
      { label: '无非机动车道', value: '无非机动车道', selected: false },
      { label: '陡坡', value: '陡坡', selected: false },
      { label: '台阶过多', value: '台阶过多', selected: false },
      { label: '大货车频繁通行', value: '大货车频繁通行', selected: false },
      { label: '施工', value: '施工', selected: false },
      { label: '积水', value: '积水', selected: false },
      { label: '骑行不友好', value: '骑行不友好', selected: false }
    ],
    // 已上报的隐患（可标记为已修复）
    existingRisks: [],
    showHint: false,
    showRepairSection: false
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
    this.routeId = id;
    
    // 获取已有隐患（用于修复）
    const existingRisks = (r.riskReports || []).map(function(risk) {
      return { label: risk, value: risk, selected: false };
    });
    
    this.setData({
      route: {
        id: r.id,
        name: r.name,
        distanceKm: r.distanceKm,
        durationMin: r.durationMin
      },
      existingRisks: existingRisks
    });
  },

  // 点击星星
  onStar: function (e) {
    const key = e.currentTarget.dataset.key;
    const n = Number(e.currentTarget.dataset.value);
    if (!key || !n) return;
    const rows = this.data.starRows.map(function (row) {
      if (row.key === key) {
        return Object.assign({}, row, { value: n, stars: buildStars(n) });
      }
      return row;
    });
    this.setData({ starRows: rows });
  },

  // 点击风险标签（多选切换）
  onToggleRisk: function (e) {
    const value = e.currentTarget.dataset.value;
    const risks = this.data.riskOptions.map(function (r) {
      if (r.value === value) {
        return Object.assign({}, r, { selected: !r.selected });
      }
      return r;
    });
    const showHint = risks.some(function (r) { return (r.value === '无路灯' || r.value === '路灯损坏') && r.selected; });
    this.setData({ riskOptions: risks, showHint: showHint });
  },

  // 点击已有隐患（标记为已修复）
  onToggleRepair: function (e) {
    const value = e.currentTarget.dataset.value;
    const risks = this.data.existingRisks.map(function (r) {
      if (r.value === value) {
        return Object.assign({}, r, { selected: !r.selected });
      }
      return r;
    });
    this.setData({ existingRisks: risks });
  },

  // 切换修复区域显示
  onToggleRepairSection: function () {
    this.setData({ showRepairSection: !this.data.showRepairSection });
  },

  // 主题切换回调
  onThemeChange: function(theme) {
    this.setData({ theme: theme });
  },

  onSubmit: function () {
    const self = this;
    const raw = mockRoutes.getRouteById(this.routeId);
    const existing = (raw && raw.riskReports) || [];

    // 新上报的隐患
    const newRisks = this.data.riskOptions
      .filter(function (r) { return r.selected; })
      .map(function (r) { return r.value; });

    // 需要修复的隐患（从现有隐患中移除）
    const repairedRisks = this.data.existingRisks
      .filter(function (r) { return r.selected; })
      .map(function (r) { return r.value; });

    // 合并并移除已修复的隐患
    const combinedSet = {};
    existing.forEach(function (v) { 
      if (repairedRisks.indexOf(v) < 0) {
        combinedSet[v] = true; 
      }
    });
    newRisks.forEach(function (v) { combinedSet[v] = true; });
    const combined = Object.keys(combinedSet);

    // 计算新分数（星数 × 20）
    const newScores = {};
    this.data.starRows.forEach(function (row) {
      newScores[row.key] = row.value * 20;
    });

    // 根据隐患调整分数（降级）
    if (combined.indexOf('无路灯') >= 0 || combined.indexOf('路灯损坏') >= 0) {
      newScores.safety = Math.max(0, newScores.safety - 15);
    }
    if (combined.indexOf('噪音过大') >= 0) {
      newScores.quietness = Math.max(0, newScores.quietness - 15);
    }
    if (combined.indexOf('路面坑洼') >= 0) {
      newScores.fitness = Math.max(0, newScores.fitness - 12);
    }
    if (combined.indexOf('骑行不友好') >= 0) {
      newScores.fitness = Math.max(0, newScores.fitness - 12);
    }
    if (combined.indexOf('无非机动车道') >= 0 || combined.indexOf('大货车频繁通行') >= 0) {
      newScores.safety = Math.max(0, newScores.safety - 10);
    }
    if (combined.indexOf('陡坡') >= 0 || combined.indexOf('台阶过多') >= 0) {
      newScores.fitness = Math.max(0, newScores.fitness - 10);
    }

    mockRoutes.updateRoute(this.routeId, {
      scores: newScores,
      riskReports: combined
    });

    // 构建提示消息
    let hintText = '你的评分与路况上报已被 AI 纳入路线推荐。';
    if (repairedRisks.length > 0) {
      hintText = '你标记了 ' + repairedRisks.length + ' 个问题已修复，感谢你的共建！';
    }

    wx.showModal({
      title: '✨ 感谢你的反馈',
      content: hintText + ' 回到推荐页，你会发现相关路线的推荐分、排序、以及"AI 推荐理由"都发生了变化。',
      confirmText: '返回推荐页',
      cancelText: '继续浏览',
      success: function (res) {
        if (res.confirm) {
          const saved = mockRoutes.getPreference();
          const params = saved
            ? '?d=' + saved.distanceKm + '&s=' + encodeURIComponent(saved.sport) + '&t=' + encodeURIComponent(saved.timeSlot) + '&p=' + encodeURIComponent(saved.priority)
            : '?d=5&s=慢跑&t=夜间&p=安静优先';
          wx.redirectTo({ url: '/pages/recommend/recommend' + params });
        }
      }
    });
  }
});