// pages/upload/upload.js —— 上传私藏路线逻辑
const mockRoutes = require('../../utils/mockRoutes.js');

Page({
  data: {
    theme: 'light',
    form: {
      name: '清晨河边 3km 私藏路线',
      distance: '3',
      duration: '25',
      desc: '河堤步道，几乎无机动车，清晨空气最好。'
    },
    sportOptions: [
      { label: '散步', value: '散步', selected: true },
      { label: '慢跑', value: '慢跑', selected: true },
      { label: '骑行', value: '骑行', selected: false }
    ],
    timeOptions: [
      { label: '早间', value: '早间', selected: true },
      { label: '白天', value: '白天', selected: false },
      { label: '夜间', value: '夜间', selected: false }
    ],
    tagOptions: [
      { label: '安静', value: '安静', selected: true },
      { label: '低车流', value: '低车流', selected: false },
      { label: '有路灯', value: '有路灯', selected: false },
      { label: '风景好', value: '风景好', selected: true },
      { label: '适合新手', value: '适合新手', selected: true },
      { label: '骑行友好', value: '骑行友好', selected: false }
    ]
  },

  onLoad: function() {
    // 初始化主题
    const app = getApp();
    this.setData({ theme: app.getTheme() });
  },

  // 主题切换回调
  onThemeChange: function(theme) {
    this.setData({ theme: theme });
  },

  onInput: function (e) {
    const key = e.currentTarget.dataset.key;
    const form = Object.assign({}, this.data.form);
    form[key] = e.detail.value;
    this.setData({ form: form });
  },

  // 多选切换通用方法
  toggleOption: function (list, value) {
    return list.map(function (item) {
      if (item.value === value) {
        return Object.assign({}, item, { selected: !item.selected });
      }
      return item;
    });
  },

  onToggleSport: function (e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ sportOptions: this.toggleOption(this.data.sportOptions, value) });
  },
  onToggleTime: function (e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ timeOptions: this.toggleOption(this.data.timeOptions, value) });
  },
  onToggleTag: function (e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ tagOptions: this.toggleOption(this.data.tagOptions, value) });
  },

  onSubmit: function () {
    const self = this;
    const f = self.data.form;
    const name = (f.name || '').trim();
    const distance = parseFloat(f.distance);
    const duration = parseInt(f.duration, 10);
    const desc = (f.desc || '').trim();

    const sports = self.data.sportOptions.filter(function (o) { return o.selected; }).map(function (o) { return o.value; });
    const times = self.data.timeOptions.filter(function (o) { return o.selected; }).map(function (o) { return o.value; });
    const tags = self.data.tagOptions.filter(function (o) { return o.selected; }).map(function (o) { return o.value; });

    if (!name) { wx.showToast({ title: '请填写路线名称', icon: 'none' }); return; }
    if (!distance || distance <= 0) { wx.showToast({ title: '请填写有效的里程', icon: 'none' }); return; }
    if (!duration || duration <= 0) { wx.showToast({ title: '请填写有效的耗时', icon: 'none' }); return; }
    if (sports.length === 0) { wx.showToast({ title: '至少选一种运动类型', icon: 'none' }); return; }
    if (times.length === 0) { wx.showToast({ title: '至少选一个推荐时段', icon: 'none' }); return; }

    const newRoute = {
      id: 'u_' + Date.now(),
      isUserUpload: true,
      name: name,
      distanceKm: distance,
      durationMin: duration,
      sports: sports,
      timeSlots: times,
      surfaceTypes: ['人行道', '沿河道路'],
      tags: tags,
      scores: { safety: 82, quietness: 85, fitness: 78, scenery: 88 },
      riskReports: [],
      polylineMock: [
        { label: '起点·' + name.slice(0, 8), pos: 'A' },
        { label: '中段 1.2km', pos: 'B' },
        { label: '折返点', pos: 'C' },
        { label: '终点·回到起点', pos: 'D' }
      ],
      reason: desc || '用户上传的私藏路线，感谢共建。',
      contributor: '热心市民'
    };

    mockRoutes.addUserRoute(newRoute);

    wx.showModal({
      title: '🎉 已加入全民共建路线池',
      content: '感谢你上传「' + name + '」。回到推荐页，当其他用户的偏好与这条路线匹配时，AI 会把它推荐给大家。',
      confirmText: '去推荐页看看',
      cancelText: '继续上传',
      success: function (res) {
        if (res.confirm) {
          const saved = mockRoutes.getPreference();
          const params = saved
            ? '?d=' + saved.distanceKm + '&s=' + encodeURIComponent(saved.sport) + '&t=' + encodeURIComponent(saved.timeSlot) + '&p=' + encodeURIComponent(saved.priority)
            : '?d=3&s=散步&t=早间&p=风景优先';
          wx.redirectTo({ url: '/pages/recommend/recommend' + params });
        } else {
          // 清空表单继续上传
          const form = { name: '', distance: '', duration: '', desc: '' };
          const resetSports = self.data.sportOptions.map(function (o) { return Object.assign({}, o, { selected: false }); });
          const resetTimes = self.data.timeOptions.map(function (o) { return Object.assign({}, o, { selected: false }); });
          const resetTags = self.data.tagOptions.map(function (o) { return Object.assign({}, o, { selected: false }); });
          self.setData({
            form: form,
            sportOptions: resetSports,
            timeOptions: resetTimes,
            tagOptions: resetTags
          });
          wx.showToast({ title: '已清空，可继续上传', icon: 'none' });
        }
      }
    });
  }
});
