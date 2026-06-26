/**
 * ================================================================
 * simulator.js — NeuroFocus EEG 数据模拟引擎 v2.0
 * ================================================================
 * 重构要点：
 * 1. 时间序列状态模型：指标随时间平滑变化，不再每秒剧烈跳动
 * 2. 指标关联：专注↑→疲劳缓升，疲劳↑→专注↓，信号差→可信度降
 * 3. 5 个预设场景：正常 / 深度专注 / 疲劳升高 / 信号较弱 / 音乐恢复
 * 4. 4 通道 EEG 波形：TP9 / TP10 / AF7 / AF8
 * 5. 设备硬件参数：电量 / 蓝牙信号 / 采样率 / 丢包率 / 噪声 / 接触阻抗
 * 6. 恢复指标关联计算：Recovery Index = 专注×0.5 + 完成度×0.3 + 信号×0.2
 * ================================================================
 */

const Simulator = {

  // ---------- 内部时钟 ----------
  _tick: 0,

  // ---------- 当前场景 ----------
  _scenario: 'normal',

  // ---------- 脑状态指标（平滑状态值） ----------
  _state: {
    focus: 62,        // 专注度
    fatigue: 22,      // 疲劳度
    cognitiveLoad: 48, // 认知负荷
    calmness: 54,     // 平静度
    signalQuality: 88 // 信号质量 0-100
  },

  // ---------- 科学层状态 ----------
  _science: {
    baselineReady: false,
    baseline: { focus: 0, fatigue: 0, cognitiveLoad: 0, calmness: 0, alpha: 0, theta: 0, beta: 0 },
    eegFeatures: { alpha: 0, theta: 0, beta: 0, alphaThetaRatio: 0 },
    artifactRisk: 'low',      // low / medium / high
    confidence: 'high',       // high / medium / low
    metricsHistory: [],       // 最近 10 秒指标快照，用于稳定性判断
    consecutiveFatigueRise: 0, // 连续疲劳上升窗口数
    consecutiveFocusDrop: 0    // 连续专注下降窗口数
  },

  // ---------- 设备硬件参数 ----------
  _device: {
    battery: 86,       // 电量 %
    rssi: -42,         // 蓝牙信号强度 dBm
    sampleRate: 250,   // 采样率 Hz
    channels: 12,      // 通道数
    packetLoss: 0.3,   // 丢包率 %
    noiseLevel: 12,    // 噪声水平 uV
    contactImpedance: 18 // 接触阻抗 kOhm
  },

  // ---------- 音乐恢复状态 ----------
  _recovery: {
    recoveryIndex: 0,
    fatigueRisk: 0,
    calmnessGain: 0,
    stability: 0,
    cognitiveLoadIndex: 0,
    compliance: 0,
    volume: 60,               // 声音场景音量 %
    recommendationStatus: 'normal', // normal / watch / pause
    _recoveryDuration: 0      // 恢复时长（秒），用于疲劳负荷计算
  },

  // ---------- 睡眠脑状态 ----------
  _sleep: {
    active: false,
    stage: 'awake',
    stageIndex: 0,
    tick: 0,
    delta: 15,
    theta: 25,
    alpha: 45,
    beta: 35,
    stability: 50,
    signalQuality: 'Good',
    artifactRisk: 'Low',
    confidence: 'Medium',
    timeline: [],
    recommendation: 'Sleep Prep',
    reason: 'Beta 较高，Alpha 可见，建议进行睡前准备。',
    startTime: null,
    duration: 0
  },

  // ---------- 场景配置 ----------
  scenarios: {
    normal: {
      name: '正常状态',
      desc: '指标在合理范围内波动',
      target: { focus: 62, fatigue: 22, cognitiveLoad: 48, calmness: 54, signalQuality: 88 },
      device: { battery: 86, rssi: -42, packetLoss: 0.3, noiseLevel: 12, contactImpedance: 18 }
    },
    deepFocus: {
      name: '深度专注',
      desc: '专注度显著升高，疲劳缓慢上升',
      target: { focus: 85, fatigue: 30, cognitiveLoad: 65, calmness: 45, signalQuality: 92 },
      device: { battery: 84, rssi: -40, packetLoss: 0.2, noiseLevel: 10, contactImpedance: 15 }
    },
    fatigueRising: {
      name: '疲劳升高',
      desc: '疲劳度持续上升，专注度逐渐下降',
      target: { focus: 42, fatigue: 78, cognitiveLoad: 72, calmness: 35, signalQuality: 80 },
      device: { battery: 78, rssi: -48, packetLoss: 0.5, noiseLevel: 15, contactImpedance: 22 }
    },
    weakSignal: {
      name: '信号较弱',
      desc: '信号质量下降，接触阻抗升高',
      target: { focus: 55, fatigue: 35, cognitiveLoad: 50, calmness: 48, signalQuality: 52 },
      device: { battery: 72, rssi: -65, packetLoss: 2.1, noiseLevel: 28, contactImpedance: 45 }
    },
    recoveryFatigue: {
      name: 'Music Recovery 音乐恢复',
      desc: '恢复过程中疲劳累积，Recovery Index 下降',
      target: { focus: 48, fatigue: 72, cognitiveLoad: 68, calmness: 38, signalQuality: 82 },
      device: { battery: 75, rssi: -45, packetLoss: 0.4, noiseLevel: 14, contactImpedance: 20 }
    }
  },

  // ---------- 睡眠阶段配置 ----------
  sleepStages: [
    { key: 'awake', label: '清醒', en: 'Awake', duration: 8 },
    { key: 'transition', label: '入睡过渡', en: 'Transition', duration: 10 },
    { key: 'light', label: '浅睡趋势', en: 'Light Sleep', duration: 12 },
    { key: 'deep', label: '深睡趋势', en: 'Deep Sleep', duration: 10 },
    { key: 'remLike', label: 'REM 趋势', en: 'REM-like', duration: 8 }
  ],

  // ---------- EEG 通道配置 ----------
  eegChannels: [
    { key: 'TP9', label: 'TP9', color: '#00e5ff', freq: 10.5, amp: 0.45 },
    { key: 'TP10', label: 'TP10', color: '#7c4dff', freq: 11.2, amp: 0.42 },
    { key: 'AF7', label: 'AF7', color: '#69f0ae', freq: 9.8, amp: 0.50 },
    { key: 'AF8', label: 'AF8', color: '#ffc107', freq: 10.8, amp: 0.48 }
  ],

  // ---------- EEG 波形滚动缓冲区 ----------
  _eegBuffer: { TP9: [], TP10: [], AF7: [], AF8: [] },
  _eegBufferSize: 200,


  // ================================================================
  // 工具函数
  // ================================================================

  /**
   * 将值平滑过渡到目标值（指数移动平均）
   * @param {number} current - 当前值
   * @param {number} target - 目标值
   * @param {number} rate - 过渡速率 (0-1, 越大越快)
   * @returns {number} 平滑后的值
   */
  _lerp(current, target, rate) {
    return current + (target - current) * rate;
  },

  /**
   * 添加微小自然波动（模拟生理信号的不确定性）
   */
  _jitter(val, amplitude) {
    return val + (Math.random() - 0.5) * amplitude;
  },

  /**
   * 将值限制在 0-100 范围内并取整
   */
  _clamp(val) {
    return Math.max(0, Math.min(100, Math.round(val)));
  },

  /**
   * 将值限制在指定范围内
   */
  _clampRange(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },


  // ================================================================
  // 场景管理
  // ================================================================

  /**
   * 切换演示场景
   * @param {string} scenario - 场景 key
   */
  setScenario(scenario) {
    if (!this.scenarios[scenario]) return;
    this._scenario = scenario;
    console.log('[Simulator] 场景切换 → ' + this.scenarios[scenario].name);
  },

  /**
   * 获取当前场景信息
   */
  getScenarioInfo() {
    return {
      key: this._scenario,
      name: this.scenarios[this._scenario].name,
      desc: this.scenarios[this._scenario].desc
    };
  },


  // ================================================================
  // 脑状态指标生成
  // ================================================================

  /**
   * 生成一组脑电监测指标（每秒调用一次）
   * 使用时间序列状态模型：指标向场景目标值平滑过渡 + 自然波动
   * @returns {Object} { focus, fatigue, cognitiveLoad, calmness, signalQuality }
   */
  generateMetrics() {
    this._tick++;
    const scenario = this.scenarios[this._scenario];
    const target = scenario.target;

    // --- 平滑过渡到场景目标值 ---
    // 过渡速率：0.03 表示每秒靠近目标 3%（约 30 秒达到 90%）
    const transitionRate = 0.03;

    this._state.focus = this._lerp(this._state.focus, target.focus, transitionRate);
    this._state.fatigue = this._lerp(this._state.fatigue, target.fatigue, transitionRate);
    this._state.cognitiveLoad = this._lerp(this._state.cognitiveLoad, target.cognitiveLoad, transitionRate);
    this._state.calmness = this._lerp(this._state.calmness, target.calmness, transitionRate);
    this._state.signalQuality = this._lerp(this._state.signalQuality, target.signalQuality, transitionRate);

    // --- 指标关联逻辑 ---
    // 1. 疲劳升高时，专注度额外缓慢下降
    const fatiguePenalty = (this._state.fatigue - 30) / 100 * 8;
    if (this._state.fatigue > 30) {
      this._state.focus = this._state.focus - fatiguePenalty * 0.1;
    }

    // 2. 平静度过低时，认知负荷升高
    if (this._state.calmness < 40) {
      this._state.cognitiveLoad = this._state.cognitiveLoad + (40 - this._state.calmness) * 0.05;
    }

    // 3. 信号质量差时，所有指标可信度降低（添加更大波动）
    const signalNoiseFactor = this._state.signalQuality < 60 ? 2.5 : 1.0;

    // --- 添加自然波动 ---
    const focus = this._jitter(this._state.focus, 3 * signalNoiseFactor);
    const fatigue = this._jitter(this._state.fatigue, 2 * signalNoiseFactor);
    const cognitiveLoad = this._jitter(this._state.cognitiveLoad, 3 * signalNoiseFactor);
    const calmness = this._jitter(this._state.calmness, 2.5 * signalNoiseFactor);
    const signalQuality = this._jitter(this._state.signalQuality, 1.5);

    return {
      focus: this._clamp(focus),
      fatigue: this._clamp(fatigue),
      cognitiveLoad: this._clamp(cognitiveLoad),
      calmness: this._clamp(calmness),
      signalQuality: this._clamp(signalQuality),
      // 科学层数据
      eegFeatures: this._science.eegFeatures,
      artifactRisk: this._science.artifactRisk,
      confidence: this._science.confidence,
      baselineReady: this._science.baselineReady
    };
  },


  // ================================================================
  // 设备硬件参数生成
  // ================================================================

  /**
   * 生成设备硬件参数（每秒调用）
   * @returns {Object} 设备参数
   */
  generateDeviceParams() {
    const scenario = this.scenarios[this._scenario];
    const dev = scenario.device;

    // 平滑过渡
    this._device.battery = this._lerp(this._device.battery, dev.battery, 0.01);
    this._device.rssi = this._lerp(this._device.rssi, dev.rssi, 0.05);
    this._device.packetLoss = this._lerp(this._device.packetLoss, dev.packetLoss, 0.05);
    this._device.noiseLevel = this._lerp(this._device.noiseLevel, dev.noiseLevel, 0.05);
    this._device.contactImpedance = this._lerp(this._device.contactImpedance, dev.contactImpedance, 0.05);

    // 电量缓慢下降
    if (this._tick % 30 === 0 && this._device.battery > 20) {
      this._device.battery -= 0.5;
    }

    return {
      battery: Math.round(this._device.battery),
      rssi: Math.round(this._device.rssi),
      sampleRate: this._device.sampleRate,
      channels: this._device.channels,
      packetLoss: parseFloat(this._device.packetLoss.toFixed(1)),
      noiseLevel: Math.round(this._device.noiseLevel),
      contactImpedance: Math.round(this._device.contactImpedance)
    };
  },


  // ================================================================
  // 多通道 EEG 波形生成
  // ================================================================

  /**
   * 生成 4 通道 EEG 波形数据（滚动缓冲区模式）
   * 每次调用推进若干个采样点，波形连续滚动
   * @param {number} samplesPerCall - 每次调用生成的采样点数
   * @returns {Object} { TP9: [], TP10: [], AF7: [], AF8: [] }
   */
  generateMultiChannelEEG(samplesPerCall = 8) {
    const t = this._tick;
    const focusFactor = this._state.focus / 100;
    const fatigueFactor = this._state.fatigue / 100;
    const calmFactor = this._state.calmness / 100;
    const signalFactor = this._state.signalQuality / 100;

    // 信号质量差时增加噪声
    const noiseMultiplier = signalFactor < 0.6 ? (1 + (0.6 - signalFactor) * 5) : 1;

    this.eegChannels.forEach(ch => {
      for (let i = 0; i < samplesPerCall; i++) {
        const x = (t * samplesPerCall + i) * 0.12;

        // 基础节律：Alpha 波 (8-13Hz) — 放松时强
        const alpha = Math.sin(x * ch.freq * 0.6) * 0.3 * (0.5 + calmFactor * 0.5);
        // Beta 波 (13-30Hz) — 专注时强
        const beta = Math.sin(x * ch.freq * 1.5) * 0.25 * (0.4 + focusFactor * 0.6);
        // Theta 波 (4-8Hz) — 疲劳时强
        const theta = Math.sin(x * ch.freq * 0.3) * 0.2 * (0.3 + fatigueFactor * 0.7);
        // 高频噪声
        const noise = (Math.random() - 0.5) * 0.08 * noiseMultiplier;
        // 通道间微小相位差异
        const phaseOffset = ch.key === 'TP9' ? 0 : ch.key === 'TP10' ? 0.3 : ch.key === 'AF7' ? 0.6 : 0.9;

        const value = (alpha + beta + theta + noise) * ch.amp +
                      Math.sin(x * ch.freq + phaseOffset) * ch.amp * 0.3;

        this._eegBuffer[ch.key].push(value);
        // 保持缓冲区长度
        if (this._eegBuffer[ch.key].length > this._eegBufferSize) {
          this._eegBuffer[ch.key].shift();
        }
      }
    });

    // 返回缓冲区的拷贝
    const result = {};
    this.eegChannels.forEach(ch => {
      result[ch.key] = this._eegBuffer[ch.key].slice();
    });
    return result;
  },


  // ================================================================
  // 音乐恢复指标生成（关联计算）
  // ================================================================

  /**
   * 生成音乐恢复指标
   * 指标之间有关联计算（按用户指定公式）：
   * - Recovery Index = Focus × 0.45 + Movement Completion × 0.35 + Signal Quality × 0.2
   * - Fatigue Load = Fatigue × 0.6 + Session Duration × 0.25 + Cognitive Load × 0.15
   * - Cognitive Load Index 与 Focus、Recovery Index 正相关
   * - 当 Signal Quality 低时，所有恢复判断标记低可信度
   * @param {string} stage - 恢复阶段
   * @returns {Object} 恢复指标
   */
  generateRecoveryMetrics(stage) {
    const focus = this._state.focus;
    const fatigue = this._state.fatigue;
    const signalQ = this._state.signalQuality;
    const cognitiveLoad = this._state.cognitiveLoad;

    // 恢复时长（归一化到 0-100，假设 40 秒为满值）
    const recoveryDurationNorm = Math.min(100, this._recovery._recoveryDuration * 2.5);

    // 根据阶段调整恢复进度
    switch (stage) {
      case 'deviceCheck':
        this._recovery.calmnessGain = this._lerp(this._recovery.calmnessGain, 5, 0.1);
        break;
      case 'baseline':
        this._recovery.calmnessGain = this._lerp(this._recovery.calmnessGain, 15, 0.08);
        break;
      case 'active':
        this._recovery.calmnessGain = this._lerp(this._recovery.calmnessGain, 85, 0.06);
        break;
      case 'fatigue':
        this._recovery.calmnessGain = this._lerp(this._recovery.calmnessGain, 55, 0.05);
        break;
      case 'assessment':
        this._recovery.calmnessGain = this._lerp(this._recovery.calmnessGain, 70, 0.03);
        break;
    }

    // --- 关联计算（按用户指定公式） ---
    // Recovery Index = Focus × 0.45 + Calmness Gain × 0.35 + Signal Quality × 0.2
    const recoveryIndex = focus * 0.45 + this._recovery.calmnessGain * 0.35 + signalQ * 0.2;

    // Fatigue Risk = Fatigue × 0.6 + Recovery Duration × 0.25 + Cognitive Load × 0.15
    const fatigueRisk = fatigue * 0.6 + recoveryDurationNorm * 0.25 + cognitiveLoad * 0.15;
    this._recovery.fatigueRisk = this._lerp(this._recovery.fatigueRisk, fatigueRisk, 0.05);

    // Stability = 信号质量×0.4 + 平静度×0.3 + (100-疲劳)×0.3
    const stability = signalQ * 0.4 + this._state.calmness * 0.3 + (100 - fatigue) * 0.3;

    // Cognitive Load Index 与 Focus、Recovery Index 正相关
    const cognitiveLoadIndex = focus * 0.5 + recoveryIndex * 0.3 + (100 - fatigue) * 0.2;

    // 恢复配合度 = Recovery Index×0.5 + Stability×0.3 + 信号质量×0.2
    const compliance = recoveryIndex * 0.5 + stability * 0.3 + signalQ * 0.2;

    this._recovery.recoveryIndex = recoveryIndex;
    this._recovery.stability = stability;
    this._recovery.cognitiveLoadIndex = cognitiveLoadIndex;
    this._recovery.compliance = compliance;

    // 添加自然波动
    const j = 3;

    // --- 声音场景音量自动调整 ---
    const targetVolume = this._recovery.fatigueRisk > 60 ? 40 :
                         this._recovery.fatigueRisk > 40 ? 50 : 60;
    this._recovery.volume = this._lerp(this._recovery.volume, targetVolume, 0.02);

    // --- 推荐状态判断 ---
    if (this._recovery.fatigueRisk > 70 || signalQ < 50) {
      this._recovery.recommendationStatus = 'pause';
    } else if (this._recovery.fatigueRisk > 50 || signalQ < 65) {
      this._recovery.recommendationStatus = 'watch';
    } else {
      this._recovery.recommendationStatus = 'normal';
    }

    // --- 低可信度标记 ---
    const lowConfidence = signalQ < 60;

    return {
      recoveryIndex: this._clamp(this._jitter(recoveryIndex, j)),
      fatigueRisk: this._clamp(this._jitter(this._recovery.fatigueRisk, j * 0.7)),
      calmnessGain: this._clamp(this._jitter(this._recovery.calmnessGain, j * 0.5)),
      stability: this._clamp(this._jitter(stability, j)),
      cognitiveLoadIndex: this._clamp(this._jitter(cognitiveLoadIndex, j)),
      compliance: this._clamp(this._jitter(compliance, j)),
      volume: Math.round(this._recovery.volume),
      signalQuality: signalQ,
      recommendationStatus: this._recovery.recommendationStatus,
      lowConfidence: lowConfidence
    };
  },

  /**
   * 推进恢复进度
   */
  advanceRecoveryProgress() {
    // 新阶段开始时平静度增益适当回落
    this._recovery.calmnessGain = Math.max(0, this._recovery.calmnessGain - 30);
  },


  // ================================================================
  // 脑健康指标推导（参考 MW75 Neuro LT 报告设计思路）
  // ================================================================

  /**
   * 生成脑健康趋势指标（从现有 Focus/Fatigue/Calmness/CognitiveLoad/SignalQuality 推导）
   * - Cognitive Strain = Cognitive Load × 0.6 + Fatigue × 0.4
   * - Mental Recovery = Calmness × 0.5 + (100 - Fatigue) × 0.5
   * - Cognitive Speed = Focus × 0.4 + Signal Quality × 0.3 + Calmness × 0.3
   * - Focus Stability = Focus 最近波动越小越高
   * - Fatigue Load = Fatigue
   * - Calmness = 现有 Calmness
   * @returns {Object} 6 项脑健康指标
   */
  generateBrainHealthMetrics() {
    const focus = this._state.focus;
    const fatigue = this._state.fatigue;
    const cognitiveLoad = this._state.cognitiveLoad;
    const calmness = this._state.calmness;
    const signalQ = this._state.signalQuality;

    // Cognitive Strain 认知压力
    const cognitiveStrain = this._clamp(cognitiveLoad * 0.6 + fatigue * 0.4);

    // Mental Recovery 心理恢复
    const mentalRecovery = this._clamp(calmness * 0.5 + (100 - fatigue) * 0.5);

    // Cognitive Speed 认知速度
    const cognitiveSpeed = this._clamp(focus * 0.4 + signalQ * 0.3 + calmness * 0.3);

    // Focus Stability 专注稳定性（从历史波动计算）
    const focusHistory = this._focusHistory || [];
    let focusStability = 70; // 默认值
    if (focusHistory.length >= 5) {
      const recent = focusHistory.slice(-10);
      const avgVal = recent.reduce((a, b) => a + b, 0) / recent.length;
      const variance = recent.reduce((sum, v) => sum + Math.pow(v - avgVal, 2), 0) / recent.length;
      const stdDev = Math.sqrt(variance);
      focusStability = this._clamp(100 - stdDev * 3);
    }

    // Fatigue Load 疲劳负荷
    const fatigueLoad = this._clamp(fatigue);

    // Calmness 平静度
    const calmnessScore = this._clamp(calmness);

    return {
      cognitiveStrain: this._jitter(cognitiveStrain, 2),
      mentalRecovery: this._jitter(mentalRecovery, 2),
      cognitiveSpeed: this._jitter(cognitiveSpeed, 2),
      focusStability: this._jitter(focusStability, 2),
      fatigueLoad: this._jitter(fatigueLoad, 2),
      calmness: this._jitter(calmnessScore, 2)
    };
  },

  /**
   * 获取脑健康指标状态标签
   * @param {number} value - 0-100
   * @param {boolean} inverse - 是否反向（值越低越好）
   * @returns {Object} { en, zh, class }
   */
  getBrainHealthStatus(value, inverse = false) {
    const v = inverse ? 100 - value : value;
    if (v >= 75) return { en: 'Optimal', zh: '优秀', class: 'optimal' };
    if (v >= 55) return { en: 'Balanced', zh: '平衡', class: 'balanced' };
    if (v >= 35) return { en: 'Fair', zh: '一般', class: 'fair' };
    return { en: 'Watch', zh: '需关注', class: 'watch' };
  },

  /**
   * 计算大脑年龄（Demo 模拟指标）
   * BrainAge = 38 + Fatigue × 0.05 + CognitiveLoad × 0.03 - Focus × 0.04 - Calmness × 0.03
   * @returns {Object} { age, trend, lastWeek, change }
   */
  generateBrainAge() {
    const focus = this._state.focus;
    const fatigue = this._state.fatigue;
    const cognitiveLoad = this._state.cognitiveLoad;
    const calmness = this._state.calmness;

    let age = 38 + fatigue * 0.05 + cognitiveLoad * 0.03 - focus * 0.04 - calmness * 0.03;
    age = Math.max(20, Math.min(80, age));

    // 模拟上周数据
    const lastWeek = parseFloat((age + 0.6 + (Math.random() - 0.5) * 0.4).toFixed(1));
    const change = parseFloat((lastWeek - age).toFixed(1));

    // 趋势判断
    let trend = 'Stable 稳定';
    if (change < -0.3) trend = 'Improving 改善中';
    else if (change > 0.3) trend = 'Rising 上升';

    return {
      age: parseFloat(age.toFixed(1)),
      lastWeek: lastWeek,
      change: change,
      trend: trend
    };
  },

  /**
   * 计算认知准备度
   * Cognitive Readiness = Focus × 0.35 + (100 - Fatigue) × 0.3 + Calmness × 0.2 + SignalQuality × 0.15
   * @returns {Object} { score, sleepRecovery, mentalReadiness, suggestion }
   */
  generateCognitiveReadiness() {
    const focus = this._state.focus;
    const fatigue = this._state.fatigue;
    const calmness = this._state.calmness;
    const signalQ = this._state.signalQuality;

    const score = this._clamp(
      focus * 0.35 + (100 - fatigue) * 0.3 + calmness * 0.2 + signalQ * 0.15
    );

    // Sleep Recovery 模拟
    let sleepRecovery = '良好';
    if (fatigue > 60) sleepRecovery = '不足';
    else if (fatigue > 40) sleepRecovery = '一般';

    // Mental Readiness
    let mentalReadiness = '适合开始深度任务';
    if (score < 45) mentalReadiness = '建议先休息恢复';
    else if (score < 60) mentalReadiness = '适合轻度任务';
    else if (score < 75) mentalReadiness = '适合常规任务';

    // 建议
    let suggestion = '今天适合 35–45 分钟一组的专注训练';
    if (score < 45) suggestion = '建议先进行 10 分钟放松再开始任务';
    else if (score < 60) suggestion = '建议 25–30 分钟短组专注训练';
    else if (score > 80) suggestion = '状态极佳，可挑战 50–60 分钟深度专注';

    return {
      score: score,
      sleepRecovery: sleepRecovery,
      mentalReadiness: mentalReadiness,
      suggestion: suggestion
    };
  },

  /**
   * 记录 Focus 历史（用于计算专注稳定性）
   */
  _focusHistory: [],
  recordFocusHistory(focus) {
    this._focusHistory.push(focus);
    if (this._focusHistory.length > 30) this._focusHistory.shift();
  },


  // ================================================================
  // 信号质量
  // ================================================================

  /**
   * 获取信号质量等级
   * @param {number} score - 信号质量分数 0-100
   * @returns {string} excellent / good / fair / poor
   */
  getSignalQualityLevel(score) {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'fair';
    return 'poor';
  },

  /**
   * 获取信号质量中文文本
   */
  getSignalQualityText(level) {
    const map = { excellent: '优秀', good: '良好', fair: '一般', poor: '较差' };
    return map[level] || '—';
  },

  /**
   * 获取蓝牙信号强度文本
   */
  getRssiText(rssi) {
    if (rssi >= -50) return '强';
    if (rssi >= -60) return '良好';
    if (rssi >= -70) return '一般';
    return '弱';
  },


  // ================================================================
  // 科学层：EEG 特征 / 伪迹风险 / 置信度 / 基线
  // ================================================================

  /**
   * 生成模拟 EEG 频段特征
   * 基于 _state 推导 Alpha / Theta / Beta 相对功率
   * 注意：这些值是模拟生成，用于展示频段与指标的对应关系
   */
  generateEEGFeatures() {
    var s = this._state;
    // Alpha (8-13 Hz): 放松、闭眼时增强，与平静度正相关
    var alpha = this._jitter(s.calmness * 0.6 + (100 - s.cognitiveLoad) * 0.4, 3);
    // Theta (4-8 Hz): 疲劳、走神时增强，与疲劳正相关
    var theta = this._jitter(s.fatigue * 0.7 + s.cognitiveLoad * 0.3, 3);
    // Beta (13-30 Hz): 警觉、主动思考时增强，与专注正相关
    var beta = this._jitter(s.focus * 0.65 + s.cognitiveLoad * 0.35, 3);
    // Alpha/Theta 比值：认知负荷和疲劳变化的参考特征
    var alphaThetaRatio = theta > 1 ? alpha / theta : 0;

    this._science.eegFeatures = {
      alpha: this._clamp(alpha),
      theta: this._clamp(theta),
      beta: this._clamp(beta),
      alphaThetaRatio: Math.round(alphaThetaRatio * 100) / 100
    };

    return this._science.eegFeatures;
  },

  /**
   * 计算伪迹风险
   * 规则：
   * - Signal Quality < 50 → High
   * - Noise Level 高 → High
   * - 变化过快且全频段同步 → Medium / High
   * - Good Fit + 稳定波形 → Low
   */
  calculateArtifactRisk(metrics) {
    var sq = metrics.signalQuality;
    var noise = this._device.noiseLevel;
    var risk = 'low';

    // 信号质量极差
    if (sq < 50) {
      risk = 'high';
    }
    // 噪声水平高
    else if (noise > 25) {
      risk = 'high';
    }
    // 信号质量一般 + 噪声中等
    else if (sq < 65 || noise > 18) {
      risk = 'medium';
    }
    // 检查指标变化是否过快（全频段同步剧烈变化 = 可能是伪迹）
    else if (this._science.metricsHistory.length >= 3) {
      var hist = this._science.metricsHistory;
      var last = hist[hist.length - 1];
      var prev = hist[hist.length - 2];
      var allChanged = Math.abs(last.focus - prev.focus) > 15 &&
                       Math.abs(last.fatigue - prev.fatigue) > 15 &&
                       Math.abs(last.calmness - prev.calmness) > 15;
      if (allChanged) risk = 'medium';
    }

    this._science.artifactRisk = risk;
    return risk;
  },

  /**
   * 计算判断置信度
   * High: 信号好，伪迹低，指标连续稳定超过 10 秒
   * Medium: 信号一般，趋势存在但波动较大
   * Low: 信号差或伪迹高，不建议解读
   */
  calculateConfidence(metrics) {
    var sq = metrics.signalQuality;
    var risk = this._science.artifactRisk;
    var conf = 'high';

    if (risk === 'high' || sq < 55) {
      conf = 'low';
    }
    else if (risk === 'medium' || sq < 75) {
      conf = 'medium';
    }
    else {
      // 检查稳定性：最近 10 秒指标波动
      var hist = this._science.metricsHistory;
      if (hist.length >= 10) {
        var recent = hist.slice(-10);
        var focusStd = this._stdDev(recent.map(function(h) { return h.focus; }));
        var fatigueStd = this._stdDev(recent.map(function(h) { return h.fatigue; }));
        if (focusStd > 12 || fatigueStd > 10) {
          conf = 'medium';
        }
      } else if (hist.length < 5) {
        // 数据不足，暂时 medium
        conf = 'medium';
      }
    }

    this._science.confidence = conf;
    return conf;
  },

  /**
   * 建立个人基线（前 3 秒模拟）
   */
  establishBaseline() {
    var s = this._state;
    this._science.baseline = {
      focus: s.focus,
      fatigue: s.fatigue,
      cognitiveLoad: s.cognitiveLoad,
      calmness: s.calmness,
      alpha: this._science.eegFeatures.alpha,
      theta: this._science.eegFeatures.theta,
      beta: this._science.eegFeatures.beta
    };
    this._science.baselineReady = true;
    this._science.metricsHistory = [];
    return this._science.baseline;
  },

  /**
   * 记录指标快照（用于稳定性分析和趋势判断）
   */
  recordMetricsSnapshot(metrics) {
    this._science.metricsHistory.push({
      focus: metrics.focus,
      fatigue: metrics.fatigue,
      cognitiveLoad: metrics.cognitiveLoad,
      calmness: metrics.calmness,
      signalQuality: metrics.signalQuality
    });
    if (this._science.metricsHistory.length > 30) {
      this._science.metricsHistory.shift();
    }

    // 更新连续上升/下降计数（容忍 2 点以内抖动）
    var hist = this._science.metricsHistory;
    if (hist.length >= 2) {
      var last = hist[hist.length - 1];
      var prev = hist[hist.length - 2];
      // 疲劳：允许 2 点以内的小幅下降仍视为上升趋势
      if (last.fatigue >= prev.fatigue - 2) {
        this._science.consecutiveFatigueRise++;
      } else {
        this._science.consecutiveFatigueRise = 0;
      }
      // 专注：允许 2 点以内的小幅上升仍视为下降趋势
      if (last.focus <= prev.focus + 2) {
        this._science.consecutiveFocusDrop++;
      } else {
        this._science.consecutiveFocusDrop = 0;
      }
    }
  },

  /**
   * 获取声音场景推荐理由
   * @param {string} scene - focus / whiteNoise / breath / calm
   * @param {Object} metrics - 当前指标
   * @returns {Object} { reason, confidence, signalQuality }
   */
  getRecommendationReason(scene, metrics) {
    var s = this._science;
    var baseline = s.baselineReady ? s.baseline : null;
    var reasons = {
      focus: {
        reason: 'Focus Trend is above personal baseline and Fatigue Load is low. Current state is suitable for maintaining low-distraction focus audio.',
        reasonZh: '专注趋势高于个人基线，疲劳负荷较低。当前状态适合维持低干扰专注音频。',
        condition: baseline ? metrics.focus > baseline.focus + 5 && metrics.fatigue < 40 : metrics.focus > 60 && metrics.fatigue < 40
      },
      whiteNoise: {
        reason: 'Focus Trend is fluctuating and Cognitive Load is moderate. White noise helps reduce external interference and maintain stable input.',
        reasonZh: '专注趋势波动较大，认知负荷中等。白噪声用于降低外部干扰，帮助保持稳定输入。',
        condition: this._focusFluctuating() && metrics.cognitiveLoad > 40 && metrics.cognitiveLoad < 70
      },
      breath: {
        reason: 'Fatigue Load has increased for ' + Math.max(2, s.consecutiveFatigueRise) + ' consecutive windows and Focus Trend is declining. Short breath guidance helps interrupt sustained cognitive load.',
        reasonZh: '疲劳负荷连续 ' + Math.max(2, s.consecutiveFatigueRise) + ' 个窗口上升，专注趋势下降。短呼吸引导用于中断持续负荷，建议短休息。',
        condition: s.consecutiveFatigueRise >= 2 || (metrics.fatigue > 60 && s.consecutiveFocusDrop >= 2)
      },
      calm: {
        reason: 'Calmness Estimate is below personal baseline and Cognitive Load is high. Low-stimulation ambient sound helps reduce auditory stress and restore rhythm.',
        reasonZh: '平静度估计低于个人基线，认知负荷较高。低刺激环境音用于降低声音刺激，帮助恢复节奏。',
        condition: (baseline ? metrics.calmness < baseline.calmness - 5 : metrics.calmness < 45) && metrics.cognitiveLoad > 55
      }
    };

    var info = reasons[scene] || reasons.focus;
    return {
      reason: info.reason,
      reasonZh: info.reasonZh,
      confidence: s.confidence,
      signalQuality: this.getSignalQualityLevel(metrics.signalQuality),
      artifactRisk: s.artifactRisk,
      conditionMet: info.condition,
      shouldNotAutoSwitch: s.artifactRisk === 'high' || s.confidence === 'low'
    };
  },

  /**
   * 获取推荐的声音场景（基于科学逻辑）
   */
  getRecommendedScene(metrics) {
    // 伪迹风险高或置信度低时不自动推荐
    if (this._science.artifactRisk === 'high' || this._science.confidence === 'low') {
      return {
        scene: null,
        reason: 'Signal is unstable. Avoid auto-switching based on noise.',
        reasonZh: '当前信号不稳定，避免根据噪声自动切换音乐。',
        confidence: this._science.confidence
      };
    }

    var s = this._science;
    var baseline = s.baselineReady ? s.baseline : null;

    // Breath Guide: 疲劳连续升高 + 专注连续下降
    if (s.consecutiveFatigueRise >= 2 && s.consecutiveFocusDrop >= 2) {
      return {
        scene: 'breath',
        reason: 'Fatigue Load has increased for ' + s.consecutiveFatigueRise + ' consecutive windows. Focus Trend is declining.',
        reasonZh: '疲劳负荷连续 ' + s.consecutiveFatigueRise + ' 个窗口上升，专注趋势下降。建议短呼吸引导休息。',
        confidence: s.confidence
      };
    }

    // Calm Ambient: 平静度低于基线 + 认知负荷高
    if ((baseline ? metrics.calmness < baseline.calmness - 5 : metrics.calmness < 45) && metrics.cognitiveLoad > 55) {
      return {
        scene: 'calm',
        reason: 'Calmness Estimate is below personal baseline. Cognitive Load is high.',
        reasonZh: '平静度估计低于个人基线，认知负荷较高。建议低刺激环境音。',
        confidence: s.confidence
      };
    }

    // White Noise: 专注波动 + 认知负荷中等
    if (this._focusFluctuating() && metrics.cognitiveLoad > 40 && metrics.cognitiveLoad < 70) {
      return {
        scene: 'whiteNoise',
        reason: 'Focus Trend is fluctuating. White noise helps reduce external interference.',
        reasonZh: '专注趋势波动较大。白噪声用于降低外部干扰。',
        confidence: s.confidence
      };
    }

    // Focus Mix: 专注高于基线 + 疲劳低
    if ((baseline ? metrics.focus > baseline.focus + 5 : metrics.focus > 60) && metrics.fatigue < 40) {
      return {
        scene: 'focus',
        reason: 'Focus Trend is above baseline. Fatigue Load is low.',
        reasonZh: '专注趋势高于基线，疲劳负荷较低。适合维持专注音频。',
        confidence: s.confidence
      };
    }

    // 默认：保持当前
    return {
      scene: null,
      reason: 'No strong recommendation signal detected.',
      reasonZh: '未检测到强推荐信号。',
      confidence: s.confidence
    };
  },

  /**
   * 检查专注度是否波动较大
   */
  _focusFluctuating() {
    var hist = this._science.metricsHistory;
    if (hist.length < 5) return false;
    var recent = hist.slice(-5);
    var std = this._stdDev(recent.map(function(h) { return h.focus; }));
    return std > 8;
  },

  /**
   * 标准差计算
   */
  _stdDev(arr) {
    if (!arr || arr.length === 0) return 0;
    var mean = arr.reduce(function(a, b) { return a + b; }, 0) / arr.length;
    var variance = arr.reduce(function(a, b) { return a + (b - mean) * (b - mean); }, 0) / arr.length;
    return Math.sqrt(variance);
  },

  /**
   * 获取科学层数据快照
   */
  getScienceSnapshot() {
    return {
      baselineReady: this._science.baselineReady,
      baseline: this._science.baseline,
      eegFeatures: this._science.eegFeatures,
      artifactRisk: this._science.artifactRisk,
      confidence: this._science.confidence,
      consecutiveFatigueRise: this._science.consecutiveFatigueRise,
      consecutiveFocusDrop: this._science.consecutiveFocusDrop
    };
  },


  // ================================================================
  // 睡眠脑状态模拟
  // ================================================================

  getSleepState() {
    return {
      stage: this._sleep.stage,
      stageLabel: this._getSleepStageLabel(this._sleep.stage),
      delta: Math.round(this._sleep.delta),
      theta: Math.round(this._sleep.theta),
      alpha: Math.round(this._sleep.alpha),
      beta: Math.round(this._sleep.beta),
      stability: Math.round(this._sleep.stability),
      signalQuality: this._sleep.signalQuality,
      artifactRisk: this._sleep.artifactRisk,
      confidence: this._sleep.confidence,
      recommendation: this._sleep.recommendation,
      reason: this._sleep.reason,
      timeline: this._sleep.timeline.slice(),
      duration: this._sleep.duration,
      active: this._sleep.active
    };
  },

  _getSleepStageLabel(stage) {
    var labels = {
      awake: '清醒',
      transition: '入睡过渡',
      light: '浅睡趋势',
      deep: '深睡趋势',
      remLike: 'REM 趋势',
      unstable: '不稳定'
    };
    return labels[stage] || '清醒';
  },

  advanceSleep() {
    if (!this._sleep.active) return null;

    this._sleep.tick++;
    this._sleep.duration++;

    var stages = this.sleepStages;
    var currentStage = stages[this._sleep.stageIndex];

    // Advance to next stage after duration
    if (this._sleep.tick >= currentStage.duration) {
      this._sleep.tick = 0;
      this._sleep.stageIndex++;
      if (this._sleep.stageIndex >= stages.length) {
        this._sleep.stageIndex = 3; // Stay in deep/rem cycle
      }
      this._sleep.stage = stages[this._sleep.stageIndex].key;
    }

    // Simulate band values based on stage
    var stage = this._sleep.stage;
    var targets = this._getSleepTargets(stage);

    // Smooth transition toward targets
    this._sleep.delta = this._lerp(this._sleep.delta, targets.delta, 0.08);
    this._sleep.theta = this._lerp(this._sleep.theta, targets.theta, 0.08);
    this._sleep.alpha = this._lerp(this._sleep.alpha, targets.alpha, 0.08);
    this._sleep.beta = this._lerp(this._sleep.beta, targets.beta, 0.08);

    // Add jitter
    this._sleep.delta = this._jitter(this._sleep.delta, 2);
    this._sleep.theta = this._jitter(this._sleep.theta, 2);
    this._sleep.alpha = this._jitter(this._sleep.alpha, 2);
    this._sleep.beta = this._jitter(this._sleep.beta, 2);

    // Clamp
    this._sleep.delta = this._clampRange(this._sleep.delta, 0, 100);
    this._sleep.theta = this._clampRange(this._sleep.theta, 0, 100);
    this._sleep.alpha = this._clampRange(this._sleep.alpha, 0, 100);
    this._sleep.beta = this._clampRange(this._sleep.beta, 0, 100);

    // Update stability
    this._sleep.stability = this._lerp(this._sleep.stability, targets.stability, 0.06);

    // Random artifact risk
    if (Math.random() < 0.05) {
      this._sleep.artifactRisk = Math.random() < 0.5 ? 'Medium' : 'High';
      this._sleep.signalQuality = this._sleep.artifactRisk === 'High' ? 'Low' : 'Medium';
      this._sleep.confidence = this._sleep.artifactRisk === 'High' ? 'Low' : 'Medium';
    } else {
      this._sleep.artifactRisk = 'Low';
      this._sleep.signalQuality = 'Good';
      this._sleep.confidence = stage === 'awake' || stage === 'transition' ? 'Medium' : 'High';
    }

    // Update recommendation
    this._updateSleepRecommendation();

    // Record timeline point
    this._sleep.timeline.push({
      t: this._sleep.duration,
      stage: stage,
      stageLabel: this._getSleepStageLabel(stage)
    });
    if (this._sleep.timeline.length > 60) {
      this._sleep.timeline.shift();
    }

    return this.getSleepState();
  },

  _getSleepTargets(stage) {
    var targets = {
      awake: { delta: 10, theta: 20, alpha: 50, beta: 40, stability: 40 },
      transition: { delta: 20, theta: 45, alpha: 30, beta: 20, stability: 55 },
      light: { delta: 35, theta: 50, alpha: 15, beta: 12, stability: 70 },
      deep: { delta: 70, theta: 30, alpha: 8, beta: 8, stability: 85 },
      remLike: { delta: 25, theta: 40, alpha: 20, beta: 25, stability: 60 },
      unstable: { delta: 30, theta: 35, alpha: 25, beta: 30, stability: 30 }
    };
    return targets[stage] || targets.awake;
  },

  _updateSleepRecommendation() {
    var s = this._sleep;

    if (s.artifactRisk === 'High' || s.confidence === 'Low') {
      s.recommendation = 'No Auto Switch';
      s.reason = '当前信号可能受翻身、佩戴接触或肌电影响，暂停睡眠趋势判断。';
      s.stage = 'unstable';
      return;
    }

    var stage = s.stage;
    if (stage === 'awake') {
      s.recommendation = 'Sleep Prep';
      s.reason = 'Beta 较高，Alpha 可见，建议进行睡前准备，降低声音刺激。';
    } else if (stage === 'transition') {
      s.recommendation = 'Calm Ambient';
      s.reason = 'Alpha 下降，Theta 上升，可能处于入睡过渡趋势，建议保持低刺激声音环境。';
    } else if (stage === 'light') {
      s.recommendation = 'Brown Noise';
      s.reason = 'Theta 稳定，Alpha 较低，浅睡趋势中，建议保持低音量环境音。';
    } else if (stage === 'deep') {
      s.recommendation = 'No Auto Switch';
      s.reason = 'Delta 趋势增强，深睡趋势中，建议暂停主动提示，只保留低音量环境音。';
    } else if (stage === 'remLike') {
      s.recommendation = 'Calm Ambient';
      s.reason = '低幅混合频率波动，REM 趋势，建议保持当前声音环境。';
    } else {
      s.recommendation = 'No Auto Switch';
      s.reason = '信号不稳定，建议调整佩戴后继续。';
    }
  },

  startSleep() {
    this._sleep.active = true;
    this._sleep.stage = 'awake';
    this._sleep.stageIndex = 0;
    this._sleep.tick = 0;
    this._sleep.delta = 10;
    this._sleep.theta = 20;
    this._sleep.alpha = 50;
    this._sleep.beta = 40;
    this._sleep.stability = 40;
    this._sleep.timeline = [];
    this._sleep.duration = 0;
    this._sleep.startTime = Date.now();
    this._updateSleepRecommendation();
  },

  stopSleep() {
    this._sleep.active = false;
  },

  resetSleep() {
    this._sleep = {
      active: false, stage: 'awake', stageIndex: 0, tick: 0,
      delta: 15, theta: 25, alpha: 45, beta: 35, stability: 50,
      signalQuality: 'Good', artifactRisk: 'Low', confidence: 'Medium',
      timeline: [], recommendation: 'Sleep Prep',
      reason: 'Beta 较高，Alpha 可见，建议进行睡前准备。',
      startTime: null, duration: 0
    };
  },

  generateAutoSleepInsight() {
    var stability = 65 + Math.floor(Math.random() * 20);
    var deepPercent = 24 + Math.floor(Math.random() * 12);
    var remPercent = 24 + Math.floor(Math.random() * 12);
    var lightPercent = 100 - deepPercent - remPercent - 1;
    var totalMinutes = 480 + Math.floor(Math.random() * 40);
    var hours = Math.floor(totalMinutes / 60);
    var mins = totalMinutes % 60;
    var transitionMin = 12 + Math.floor(Math.random() * 12);

    var sleepScore = 75 + Math.floor(Math.random() * 18);
    var scoreChange = '+' + (5 + Math.floor(Math.random() * 12));
    var percentile = 85 + Math.floor(Math.random() * 12);

    var artifactRisk = Math.random() < 0.4 ? 'Medium' : 'Low';
    var signalQuality = artifactRisk === 'Medium' ? 'Medium' : 'Good';
    var confidence = artifactRisk === 'Medium' ? 'Medium' : 'High';

    var scenes = ['Brown Noise', 'Calm Ambient', 'Sleep Prep'];
    var recommendedScene = scenes[Math.floor(Math.random() * scenes.length)];

    function fmtDur(mins) {
      var h = Math.floor(mins / 60);
      var m = mins % 60;
      return h + '小时' + m + '分';
    }

    var remMin = Math.round(totalMinutes * remPercent / 100);
    var lightMin = Math.round(totalMinutes * lightPercent / 100);
    var deepMin = Math.round(totalMinutes * deepPercent / 100);
    var awakeMin = totalMinutes - remMin - lightMin - deepMin;

    return {
      available: true,
      source: 'auto-demo',
      sleepScore: sleepScore,
      scoreChange: scoreChange,
      percentile: percentile,
      sleepWindow: '00:08 - 08:45',
      totalSleep: fmtDur(totalMinutes),
      totalMinutes: totalMinutes,
      transitionTime: transitionMin + '分钟',
      stability: stability,
      remPercent: remPercent,
      remDuration: fmtDur(remMin),
      lightPercent: lightPercent,
      lightDuration: fmtDur(lightMin),
      deepPercent: deepPercent,
      deepDuration: fmtDur(deepMin),
      awakeCount: 1,
      awakeDuration: awakeMin + '分钟',
      deepSleepTrend: deepPercent,
      remLikeTrend: remPercent,
      signalQuality: signalQuality,
      artifactRisk: artifactRisk,
      confidence: confidence,
      recommendedScene: recommendedScene,
      bands: {
        delta: 55 + Math.floor(Math.random() * 20),
        theta: 40 + Math.floor(Math.random() * 15),
        alpha: 20 + Math.floor(Math.random() * 12),
        beta: 12 + Math.floor(Math.random() * 10)
      },
      stageSegments: [
        { stage: 'light', start: 0, duration: 28 },
        { stage: 'deep', start: 28, duration: 46 },
        { stage: 'rem', start: 74, duration: 35 },
        { stage: 'light', start: 109, duration: 50 },
        { stage: 'deep', start: 159, duration: 38 },
        { stage: 'light', start: 197, duration: 120 },
        { stage: 'awake', start: 317, duration: 19 },
        { stage: 'rem', start: 336, duration: 55 },
        { stage: 'light', start: 391, duration: 107 }
      ],
      summary: '昨晚睡眠质量较佳。入睡过渡约 ' + transitionMin + ' 分钟，深睡趋势占比为 ' + deepPercent + '%。夜间伪迹风险为 ' + artifactRisk + '，可能受翻身或佩戴接触影响。建议继续保持规律作息，睡前可使用 ' + recommendedScene + ' 降低刺激。'
    };
  },


  // ================================================================
  // 重置
  // ================================================================

  /**
   * 重置模拟器状态
   */
  reset() {
    this._tick = 0;
    this._scenario = 'normal';
    this._state = { focus: 62, fatigue: 22, cognitiveLoad: 48, calmness: 54, signalQuality: 88 };
    this._device = { battery: 86, rssi: -42, sampleRate: 250, channels: 12, packetLoss: 0.3, noiseLevel: 12, contactImpedance: 18 };
    this._recovery = {
      recoveryIndex: 0, fatigueRisk: 0, calmnessGain: 0, stability: 0,
      cognitiveLoadIndex: 0, compliance: 0, volume: 60,
      recommendationStatus: 'normal', _recoveryDuration: 0
    };
    // 重置科学层状态
    this._science = {
      baselineReady: false,
      baseline: { focus: 0, fatigue: 0, cognitiveLoad: 0, calmness: 0, alpha: 0, theta: 0, beta: 0 },
      eegFeatures: { alpha: 0, theta: 0, beta: 0, alphaThetaRatio: 0 },
      artifactRisk: 'low',
      confidence: 'high',
      metricsHistory: [],
      consecutiveFatigueRise: 0,
      consecutiveFocusDrop: 0
    };
    // 清空 EEG 缓冲区
    this.eegChannels.forEach(ch => { this._eegBuffer[ch.key] = []; });
    // 清空 Focus 历史
    this._focusHistory = [];
    // 重置睡眠脑状态
    this.resetSleep();
  },

  /**
   * 仅重置恢复数据（不重置脑状态）
   */
  resetRecovery() {
    this._recovery = {
      recoveryIndex: 0, fatigueRisk: 0, calmnessGain: 0, stability: 0,
      cognitiveLoadIndex: 0, compliance: 0, volume: 60,
      recommendationStatus: 'normal', _recoveryDuration: 0
    };
  }
};
