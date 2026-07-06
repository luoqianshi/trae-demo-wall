// pages/index/index.js —— 首页逻辑
const mockRoutes = require('../../utils/mockRoutes.js');

// 人群预设模板配置（权重 + 特殊扣分规则）
const TEMPLATE_CONFIG = {
  'elderly': {
    name: '中老年散步',
    icon: '👴',
    desc: '安静安全优先，避开陡坡大车',
    weights: { safety: 0.45, quietness: 0.40, fitness: 0.05, scenery: 0.10 },
    penalties: {
      '陡坡': 20,
      '大车路': 25,
      '机动车混行': 18,
      '道路狭窄': 15
    },
    bonus: {
      '有休息区': 10,
      '有公厕': 8,
      '平缓': 12
    },
    defaultSport: '散步',
    defaultTime: '早间',
    defaultDistance: 3,
    summarySuffix: '安静安全优先'
  },
  'youth_night': {
    name: '青年夜跑',
    icon: '🏃',
    desc: '夜间照明翻倍，无路灯重度扣分',
    weights: { safety: 0.50, quietness: 0.20, fitness: 0.20, scenery: 0.10 },
    penalties: {
      '无路灯': 30,
      '道路狭窄': 12,
      '施工': 15
    },
    bonus: {
      '有路灯': 15,
      '绿道连续': 10,
      '平缓': 8
    },
    defaultSport: '慢跑',
    defaultTime: '夜间',
    defaultDistance: 5,
    summarySuffix: '夜间照明优先'
  },
  'family': {
    name: '亲子慢行',
    icon: '👨‍👩‍👧',
    desc: '避开窄路陡坡，休息区加分',
    weights: { safety: 0.50, quietness: 0.25, fitness: 0.05, scenery: 0.20 },
    penalties: {
      '无防护': 20,
      '陡坡': 25,
      '道路狭窄': 18,
      '机动车混行': 20
    },
    bonus: {
      '有休息区': 15,
      '有公厕': 12,
      '有儿童设施': 10,
      '平缓': 10
    },
    defaultSport: '散步',
    defaultTime: '白天',
    defaultDistance: 3,
    summarySuffix: '平缓安全优先'
  },
  'fitness_cycling': {
    name: '燃脂骑行',
    icon: '🚴',
    desc: '长绿道优先，避开拥挤路口',
    weights: { safety: 0.15, quietness: 0.20, fitness: 0.50, scenery: 0.15 },
    penalties: {
      '台阶': 25,
      '拥挤路口': 20,
      '行人密集': 18,
      '红绿灯多': 15,
      '道路狭窄': 12
    },
    bonus: {
      '绿道连续': 15,
      '路面平整': 12,
      '无中断': 10,
      '骑行友好': 8
    },
    defaultSport: '骑行',
    defaultTime: '早间',
    defaultDistance: 8,
    summarySuffix: '长绿道锻炼优先'
  },
  'scenic_cycling': {
    name: '观景轻骑行',
    icon: '🌅',
    desc: '风景安静优先，滨河平缓路段',
    weights: { safety: 0.15, quietness: 0.35, fitness: 0.10, scenery: 0.40 },
    penalties: {
      '噪音大': 15,
      '机动车混行': 12
    },
    bonus: {
      '滨河': 15,
      '公园': 12,
      '风景好': 10,
      '平缓': 8
    },
    defaultSport: '骑行',
    defaultTime: '白天',
    defaultDistance: 5,
    summarySuffix: '风景安静出游优先'
  }
};

// 运动类型到模板的映射（用于双向联动）
const SPORT_TO_TEMPLATE = {
  '散步': ['elderly', 'family'],    // 散步对应中老年散步、亲子慢行
  '慢跑': ['youth_night'],           // 慢跑对应青年夜跑
  '骑行': ['fitness_cycling', 'scenic_cycling']  // 骑行对应燃脂骑行、观景轻骑行
};

Page({
  data: {
    // 主题状态
    theme: 'light',
    themeIcon: '🌙',
    themeText: '深色',

    // 主题颜色（用于动态绑定到组件）
    themeColors: {
      sliderActive: '#0F9D58',
      sliderBackground: '#E8F0FE',
      primary: '#0F9D58'
    },

    // 选项配置
    distanceOptions: [
      { label: '3km', value: 3 },
      { label: '5km', value: 5 },
      { label: '8km', value: 8 },
      { label: '10km', value: 10 }
    ],
    sportOptions: [
      { label: '散步', value: '散步' },
      { label: '慢跑', value: '慢跑' },
      { label: '骑行', value: '骑行' }
    ],
    timeOptions: [
      { label: '早间', value: '早间' },
      { label: '白天', value: '白天' },
      { label: '夜间', value: '夜间' }
    ],
    priorityOptions: [
      { label: '安静优先', value: '安静优先' },
      { label: '安全优先', value: '安全优先' },
      { label: '风景优先', value: '风景优先' },
      { label: '运动适配优先', value: '运动适配优先' }
    ],

    // 人群预设模板
    templateOptions: [
      { id: 'elderly', name: '中老年散步', icon: '👴', desc: '安静安全优先' },
      { id: 'youth_night', name: '青年夜跑', icon: '🏃', desc: '照明权重翻倍' },
      { id: 'family', name: '亲子慢行', icon: '👨‍👩‍👧', desc: '避开窄路陡坡' },
      { id: 'fitness_cycling', name: '燃脂骑行', icon: '🚴', desc: '长绿道优先' },
      { id: 'scenic_cycling', name: '观景轻骑行', icon: '🌅', desc: '风景安静优先' }
    ],
    selectedTemplate: '',
    templateHint: '',

    // 用户选择状态
    selectedDistance: 5,
    customDistance: '',
    selectedSport: '慢跑',
    selectedTime: '夜间',
    selectedPriority: '安静优先',

    // 运动类型禁用状态（用于互斥绑定）
    disabledSports: [],

    // 显示摘要（优化后格式）
    summaryText: '当前选择：慢跑5km · 夜间照明优先',

    // 白噪音选项
    noiseOptions: [
      { id: 'wind', name: '晚风', icon: '🌬️' },
      { id: 'stream', name: '溪流', icon: '💧' },
      { id: 'birds', name: '鸟鸣', icon: '🐦' }
    ],
    currentNoise: '',
    noiseVolume: 50
  },

  // 音频上下文（用于生成白噪音）
  audioContext: null,
  noiseNode: null,

  // 播放/停止白噪音
  onToggleNoise: function (e) {
    const noiseId = e.currentTarget.dataset.id;
    if (this.data.currentNoise === noiseId) {
      this.stopNoise();
    } else {
      this.playNoise(noiseId);
    }
  },

  // 播放白噪音（使用 Web Audio API 生成）
  playNoise: function (type) {
    this.stopNoise();

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.audioContext = audioContext;

      const bufferSize = 2 * audioContext.sampleRate;
      const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        if (type === 'wind') {
          output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
        } else if (type === 'stream') {
          output[i] = (Math.random() * 2 - 1) * 0.5 + Math.sin(i * 0.05) * 0.2;
        } else {
          output[i] = (Math.random() * 2 - 1) * (Math.random() > 0.8 ? 1.5 : 0.3);
        }
      }

      const whiteNoise = audioContext.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = audioContext.createBiquadFilter();
      if (type === 'wind') {
        filter.type = 'lowpass';
        filter.frequency.value = 400;
      } else if (type === 'stream') {
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.5;
      } else {
        filter.type = 'highpass';
        filter.frequency.value = 2000;
      }

      const gainNode = audioContext.createGain();
      gainNode.gain.value = this.data.noiseVolume / 100 * 0.3;

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);

      whiteNoise.start();

      this.noiseNode = whiteNoise;
      this.setData({ currentNoise: type });
      wx.showToast({ title: '正在播放 ' + this.getNoiseName(type), icon: 'none' });
    } catch (e) {
      wx.showToast({ title: '音频播放失败', icon: 'none' });
    }
  },

  // 获取噪音名称
  getNoiseName: function (type) {
    const option = this.data.noiseOptions.find(n => n.id === type);
    return option ? option.name : '';
  },

  // 停止白噪音
  stopNoise: function () {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode = null;
      } catch (e) {
        // ignore
      }
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
        this.audioContext = null;
      } catch (e) {
        // ignore
      }
    }
    this.setData({ currentNoise: '' });
  },

  // 音量改变
  onNoiseVolumeChange: function (e) {
    const volume = e.detail.value;
    this.setData({ noiseVolume: volume });
    if (this.audioContext && this.audioContext.state === 'running') {
      const current = this.data.currentNoise;
      if (current) {
        this.playNoise(current);
      }
    }
  },

  // 停止播放按钮
  onStopNoise: function () {
    this.stopNoise();
    wx.showToast({ title: '已停止播放', icon: 'none' });
  },

  onLoad: function () {
    // 初始化主题
    const app = getApp();
    const currentTheme = app.getTheme();
    this.initTheme(currentTheme);

    // 恢复最近一次偏好
    const saved = mockRoutes.getPreference();
    if (saved) {
      const data = {
        selectedDistance: saved.distanceKm || 5,
        selectedSport: saved.sport || '慢跑',
        selectedTime: saved.timeSlot || '夜间',
        selectedPriority: saved.priority || '安静优先',
        selectedTemplate: saved.template || ''
      };
      if (saved.template && TEMPLATE_CONFIG[saved.template]) {
        data.templateHint = TEMPLATE_CONFIG[saved.template].name;
      }
      this.setData(data);
      this.refreshSummary();
    }
  },

  // 初始化主题
  initTheme: function(theme) {
    const isDark = theme === 'dark';
    
    // 根据主题设置对应的颜色
    const themeColors = isDark ? {
      sliderActive: '#4CAF7A',
      sliderBackground: '#2A332E',
      primary: '#4CAF7A'
    } : {
      sliderActive: '#0F9D58',
      sliderBackground: '#E8F0FE',
      primary: '#0F9D58'
    };
    
    this.setData({
      theme: theme,
      themeIcon: isDark ? '☀️' : '🌙',
      themeText: isDark ? '浅色' : '深色',
      themeColors: themeColors
    });
    
    if (isDark) {
      wx.pageScrollTo({ scrollTop: 0, duration: 0 });
      wx.createSelectorQuery().select('page').boundingClientRect(function(rect) {
        // 不需要额外操作
      }).exec();
    }
  },

  // 主题切换回调（由 app.js 调用）
  onThemeChange: function(theme) {
    this.initTheme(theme);
  },

  // 切换主题
  onToggleTheme: function() {
    const app = getApp();
    const newTheme = app.toggleTheme();
    this.initTheme(newTheme);
    wx.showToast({
      title: newTheme === 'dark' ? '已切换深色模式' : '已切换浅色模式',
      icon: 'none',
      duration: 1500
    });
  },

  // 点击里程选项
  onSelectDistance: function (e) {
    const val = Number(e.currentTarget.dataset.value);
    this.setData({ selectedDistance: val, customDistance: '' });
    this.refreshSummary();
  },

  // 自定义里程输入
  onCustomDistanceInput: function (e) {
    const val = parseFloat(e.detail.value);
    if (!isNaN(val) && val > 0) {
      this.setData({ selectedDistance: val, customDistance: e.detail.value });
    } else {
      this.setData({ customDistance: e.detail.value });
    }
    this.refreshSummary();
  },

  // 点击运动类型（双向联动：自动切换对应模板）
  onSelectSport: function (e) {
    const sport = e.currentTarget.dataset.value;
    const templates = SPORT_TO_TEMPLATE[sport];
    
    // 根据运动类型自动选择对应的模板（优先选择第一个）
    let newTemplate = '';
    let newTime = this.data.selectedTime;
    let newDistance = this.data.selectedDistance;
    
    if (templates && templates.length > 0) {
      // 如果当前模板不属于该运动类型对应的模板，则切换到第一个匹配的模板
      if (!this.data.selectedTemplate || templates.indexOf(this.data.selectedTemplate) < 0) {
        newTemplate = templates[0];
        const config = TEMPLATE_CONFIG[newTemplate];
        newTime = config.defaultTime;
        newDistance = config.defaultDistance;
      } else {
        // 当前模板属于该运动类型，保持不变
        newTemplate = this.data.selectedTemplate;
      }
    } else {
      // 没有匹配模板，清除当前模板选择
      newTemplate = '';
    }

    // 清除运动类型禁用状态（点击运动类型时允许切换）
    const disabledSports = this.data.sportOptions
      .map(opt => opt.value)
      .filter(s => s !== sport);

    this.setData({
      selectedSport: sport,
      selectedTemplate: newTemplate,
      selectedTime: newTime,
      selectedDistance: newDistance,
      templateHint: newTemplate ? TEMPLATE_CONFIG[newTemplate].name : '',
      disabledSports: disabledSports
    });
    this.refreshSummary();
  },

  onSelectTime: function (e) {
    this.setData({ selectedTime: e.currentTarget.dataset.value });
    this.refreshSummary();
  },

  onSelectPriority: function (e) {
    this.setData({ selectedPriority: e.currentTarget.dataset.value });
    this.refreshSummary();
  },

  // 点击人群预设模板（互斥绑定：自动切换运动类型并禁用其他类型）
  onSelectTemplate: function (e) {
    const templateId = e.currentTarget.dataset.id;
    const config = TEMPLATE_CONFIG[templateId];
    if (!config) return;

    // 计算需要禁用的运动类型（除了当前模板绑定的运动类型外，其他都禁用）
    const disabledSports = this.data.sportOptions
      .map(opt => opt.value)
      .filter(sport => sport !== config.defaultSport);

    // 互斥绑定：自动锁定运动类型和默认值
    this.setData({
      selectedTemplate: templateId,
      templateHint: config.name,
      selectedSport: config.defaultSport,
      selectedTime: config.defaultTime,
      selectedDistance: config.defaultDistance,
      disabledSports: disabledSports
    });
    this.refreshSummary();
    
    wx.showToast({
      title: '已选择「' + config.name + '」模板',
      icon: 'none',
      duration: 1500
    });
  },

  // 刷新摘要（优化后：根据模板显示匹配的文案）
  refreshSummary: function () {
    const d = this.data.selectedDistance;
    const templateId = this.data.selectedTemplate;
    
    let text = '';
    
    if (templateId && TEMPLATE_CONFIG[templateId]) {
      // 如果选择了模板，显示模板对应的文案
      const config = TEMPLATE_CONFIG[templateId];
      text = '当前选择：' + config.defaultSport + d + 'km · ' + config.summarySuffix;
    } else {
      // 没有选择模板，显示通用文案
      text = '当前选择：' + this.data.selectedSport + d + 'km · ' + this.data.selectedPriority;
    }
    
    this.setData({ summaryText: text });
  },

  // 点击生成：保存偏好 + 跳转推荐页
  onGenerate: function () {
    const pref = {
      distanceKm: Number(this.data.selectedDistance),
      sport: this.data.selectedSport,
      timeSlot: this.data.selectedTime,
      priority: this.data.selectedPriority,
      template: this.data.selectedTemplate
    };
    mockRoutes.setPreference(pref);

    wx.navigateTo({
      url: '/pages/recommend/recommend' +
        '?d=' + pref.distanceKm +
        '&s=' + encodeURIComponent(pref.sport) +
        '&t=' + encodeURIComponent(pref.timeSlot) +
        '&p=' + encodeURIComponent(pref.priority) +
        '&tpl=' + encodeURIComponent(pref.template || '')
    });
  },

  onGoUpload: function () {
    wx.navigateTo({ url: '/pages/upload/upload' });
  },

  onShowIntro: function () {
    wx.showModal({
      title: '关于"全民共建"',
      content: '静途的每条路线推荐都由大家的上报共同改进。你给一条路线打"无路灯"，其他用户夜间看到它时，AI 会自动降低它的安全推荐分。当你上传一条私藏路线，它也会进入全国路线池被推荐。',
      showCancel: false,
      confirmText: '我懂了'
    });
  },

  onReset: function () {
    wx.showModal({
      title: '重置演示数据',
      content: '是否清空你的所有上报与私藏路线？（仅清除本机演示数据，不会影响其他人）',
      success: function (res) {
        if (res.confirm) {
          mockRoutes.resetAll();
          wx.showToast({ title: '已重置', icon: 'success' });
        }
      }
    });
  }
});
