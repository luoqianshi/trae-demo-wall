/* ================================================================
 * RhythmEngine — 伴伴生理节律引擎 v1.0
 * 基于真实的昼夜节律模型（Circadian Rhythm）+ 认知负荷累积模型
 * 提供 AI 可调用的完整接口，用于动态调整个人节律曲线
 *
 * 核心模型：
 *   1. 昼夜节律 (Circadian) - 基于人体生物钟的正弦叠加模型
 *   2. 稳态睡眠压力 (Homeostatic) - 清醒时间越长压力越大
 *   3. 认知负荷累积 (Cognitive Load) - 任务消耗精力和专注力
 *   4. 恢复机制 (Recovery) - 休息、进食、运动带来的恢复
 *
 * AI 接口：
 *   RhythmEngine.setChronotype()    - 设置作息类型（百灵鸟/中间型/猫头鹰）
 *   RhythmEngine.setSleepTime()     - 设置入睡/起床时间
 *   RhythmEngine.addTask()          - 添加任务（消耗精力）
 *   RhythmEngine.addRecovery()      - 添加恢复活动（补充精力）
 *   RhythmEngine.setMealTimes()     - 设置进餐时间（影响饥饿/精力）
 *   RhythmEngine.setFatigueFactor() - 设置疲劳系数（个体差异）
 *   RhythmEngine.generate()         - 生成完整的节律数据
 *   RhythmEngine.analyze()          - AI 分析总结当前节律状态
 * ================================================================ */

const RhythmEngine = (() => {
  'use strict';

  // ===== 时间范围 =====
  const HOUR_START = 6;   // 早上6点
  const HOUR_END = 24;    // 晚上12点
  const HOUR_STEP = 2;    // 每2小时一个采样点
  const SAMPLE_HOURS = [];
  for (let h = HOUR_START; h <= HOUR_END; h += HOUR_STEP) SAMPLE_HOURS.push(h);

  // ===== 默认参数（中间型作息） =====
  const DEFAULTS = {
    // 作息类型: 'lark'（百灵鸟/早起型）| 'intermediate'（中间型）| 'owl'（猫头鹰/晚睡型）
    chronotype: 'intermediate',

    // 睡眠参数
    wakeHour: 7,        // 起床时间（小时，24小时制）
    sleepHour: 23,      // 入睡时间
    sleepQuality: 0.75, // 睡眠质量 0-1

    // 进餐时间
    mealTimes: {
      breakfast: 7.5,   // 早餐
      lunch: 12.5,      // 午餐
      dinner: 18.5,     // 晚餐
    },

    // 个体差异系数
    fatigueFactor: 1.0,    // 疲劳累积速度（0.5-1.5）
    recoveryRate: 1.0,     // 恢复速度（0.5-1.5）
    focusBaseline: 60,     // 基础专注度（个体差异）

    // 任务列表 [{hour, duration, type, cognitiveLoad}]
    tasks: [],

    // 恢复活动列表 [{hour, duration, type, recoveryAmount}]
    recovery: [],
  };

  // ===== 内部状态 =====
  let config = { ...DEFAULTS };
  let cachedResult = null;
  let cacheKey = '';

  // ================================================================
  // 核心模型函数
  // ================================================================

  /**
   * 昼夜节律函数（Circadian Rhythm）
   * 基于双振荡器模型：核心体温节律 + 皮质醇节律
   * 返回 0-100 的警觉度/精力水平
   */
  function circadianEnergy(hour, chronotype) {
    // 不同作息类型的相位偏移（小时）
    const phaseOffset = {
      lark: -1.5,        // 百灵鸟：峰值提前
      intermediate: 0,   // 中间型
      owl: 2.0,          // 猫头鹰：峰值延后
    };
    const offset = phaseOffset[chronotype] || 0;

    // 核心体温节律（24小时周期，下午达到峰值）
    // 体温越高，警觉度越高
    const t = hour + offset;
    const tempRhythm = Math.sin((t - 6) * Math.PI / 12) * 0.5 + 0.5;

    // 皮质醇节律（早晨最高，然后逐渐下降）
    let cortisol;
    if (t < 4) {
      cortisol = 0.1;
    } else if (t < 9) {
      // 早晨皮质醇飙升（醒来后1-2小时达到峰值）
      cortisol = 0.2 + 0.8 * Math.sin((t - 4) * Math.PI / 5);
    } else {
      // 下午到晚上逐渐下降
      cortisol = Math.max(0.05, 0.8 * Math.exp(-0.15 * (t - 9)));
    }

    // 午后低谷（午餐后 14:00 左右的自然困倦）
    let postLunchDip = 0;
    if (t >= 12 && t <= 16) {
      postLunchDip = 0.25 * Math.sin((t - 12) * Math.PI / 4);
    }

    // 综合：体温节律权重 60%，皮质醇权重 30%，减去午后低谷
    let energy = 0.6 * tempRhythm + 0.3 * cortisol - postLunchDip;
    energy = Math.max(0.1, Math.min(1.0, energy));

    return Math.round(energy * 100);
  }

  /**
   * 稳态睡眠压力（Homeostatic Sleep Pressure）
   * 清醒时间越长，睡眠压力越大，精力越低
   * 返回 0-100 的精力消耗值（越高越累）
   */
  function homeostaticFatigue(hour, wakeHour, sleepHour, sleepQuality) {
    // 计算清醒时长
    let awakeHours;
    if (hour >= wakeHour) {
      awakeHours = hour - wakeHour;
    } else {
      // 跨夜（凌晨）
      awakeHours = (24 - wakeHour) + hour;
    }

    // 睡眠压力累积曲线（指数增长）
    // 前几个小时精力充沛，之后逐渐下降
    const maxAwake = 16; // 正常清醒16小时
    const ratio = Math.min(1.0, awakeHours / maxAwake);

    // 指数累积：初期慢，后期快
    let pressure = Math.pow(ratio, 1.5);

    // 睡眠质量影响：睡得好，压力累积慢
    pressure = pressure * (1.2 - 0.4 * sleepQuality);

    return Math.round(pressure * 100);
  }

  /**
   * 认知负荷累积模型
   * 任务会消耗专注力和精力，休息会恢复
   */
  function cognitiveLoadEffect(hour, tasks, recovery) {
    let focusDrain = 0;   // 专注度消耗
    let energyDrain = 0;  // 精力消耗
    let focusGain = 0;    // 专注度恢复
    let energyGain = 0;   // 精力恢复

    // 计算从起床到当前时间的累积消耗
    const wakeHour = config.wakeHour;

    // 任务消耗
    (tasks || []).forEach(task => {
      if (task.hour > hour + 0.5) return; // 还没开始的任务
      const taskDuration = task.duration || 1;
      const taskEnd = task.hour + taskDuration;
      if (taskEnd < wakeHour - 0.5) return; // 起床前的任务忽略

      // 计算任务覆盖的比例
      const overlapStart = Math.max(task.hour, wakeHour);
      const overlapEnd = Math.min(taskEnd, hour);
      if (overlapEnd <= overlapStart) return;
      const overlap = overlapEnd - overlapStart;

      // 认知负荷强度
      const load = task.cognitiveLoad || 'medium';
      const loadMultiplier = { deep: 1.5, medium: 1.0, light: 0.5 }[load] || 1.0;

      // 任务类型调整
      const type = task.type || 'work';
      const typeFactor = {
        deep_work: 1.2, learning: 1.15, focus: 1.1, planning: 1.0,
        light_work: 0.7, execute: 0.8, work: 0.8,
        meeting: 0.9, social: 0.6, communicate: 0.6,
        exercise: 0.4, rest: 0.1, meal: 0.05, routine: 0.2,
      }[type] || 0.8;

      // 每小时消耗
      focusDrain += overlap * 8 * loadMultiplier * typeFactor * config.fatigueFactor;
      energyDrain += overlap * 6 * loadMultiplier * typeFactor * config.fatigueFactor;
    });

    // 恢复活动增益
    (recovery || []).forEach(rec => {
      if (rec.hour > hour + 0.5) return;
      const recDuration = rec.duration || 0.5;
      const recEnd = rec.hour + recDuration;
      if (recEnd < wakeHour - 0.5) return;

      const overlapStart = Math.max(rec.hour, wakeHour);
      const overlapEnd = Math.min(recEnd, hour);
      if (overlapEnd <= overlapStart) return;
      const overlap = overlapEnd - overlapStart;

      const amount = rec.recoveryAmount || 1.0;
      const type = rec.type || 'rest';
      const typeFactor = {
        rest: 1.0, nap: 1.5, meditation: 1.3,
        walk: 0.8, exercise: 0.6, meal: 1.2,
        snack: 0.5, coffee: 1.5, // 咖啡短期提神
      }[type] || 1.0;

      focusGain += overlap * 10 * amount * typeFactor * config.recoveryRate;
      energyGain += overlap * 8 * amount * typeFactor * config.recoveryRate;
    });

    return {
      focusDrain: Math.round(focusDrain),
      energyDrain: Math.round(energyDrain),
      focusGain: Math.round(focusGain),
      energyGain: Math.round(energyGain),
    };
  }

  /**
   * 进餐对饥饿和精力的影响
   */
  function mealEffect(hour, mealTimes) {
    let hunger = 0;
    let energyBoost = 0;

    const meals = [
      { time: mealTimes.breakfast, size: 0.8, name: 'breakfast' },
      { time: mealTimes.lunch, size: 1.0, name: 'lunch' },
      { time: mealTimes.dinner, size: 0.9, name: 'dinner' },
    ];

    // 计算饥饿感（距离上一餐越久越饿）
    let lastMealTime = null;
    let lastMealSize = 0;
    meals.forEach(meal => {
      if (meal.time <= hour + 0.5) {
        if (lastMealTime === null || meal.time > lastMealTime) {
          lastMealTime = meal.time;
          lastMealSize = meal.size;
        }
      }
    });

    if (lastMealTime !== null) {
      const hoursSinceMeal = hour - lastMealTime;
      // 饥饿感随时间增长（3-4小时后明显饥饿）
      hunger = Math.min(100, Math.max(0, (hoursSinceMeal - 1) * 25 / lastMealSize));
    } else {
      hunger = 30; // 还没吃早餐，有点饿
    }

    // 餐后精力提升（餐后1-2小时有能量补充）
    meals.forEach(meal => {
      const hoursAfter = hour - meal.time;
      if (hoursAfter > 0 && hoursAfter < 3) {
        // 餐后精力先升后降
        let boost;
        if (hoursAfter < 1) {
          boost = 0.8 * meal.size * hoursAfter;
        } else {
          boost = 0.8 * meal.size * (1 - (hoursAfter - 1) / 2);
        }
        energyBoost = Math.max(energyBoost, boost * 20);
      }
    });

    return { hunger: Math.round(hunger), energyBoost: Math.round(energyBoost) };
  }

  // ================================================================
  // 主生成函数
  // ================================================================

  /**
   * 生成完整的节律数据
   * 返回 { focus: [], energy: [], fatigue: [], sleepiness: [], hunger: [], restNeed: [], sampleHours: [] }
   */
  function generate() {
    // 检查缓存
    const key = JSON.stringify(config);
    if (cachedResult && cacheKey === key) {
      return { ...cachedResult };
    }

    const results = {
      focus: [],       // 专注度 0-100
      energy: [],      // 精力水平 0-100
      fatigue: [],     // 疲劳度 0-100
      sleepiness: [],  // 困意 0-100
      hunger: [],      // 饥饿感 0-100
      restNeed: [],    // 需休息程度 0-100
      sampleHours: SAMPLE_HOURS.slice(),
    };

    SAMPLE_HOURS.forEach(hour => {
      // 1. 昼夜节律基础精力
      const circadianE = circadianEnergy(hour, config.chronotype);

      // 2. 稳态疲劳
      const homeoF = homeostaticFatigue(hour, config.wakeHour, config.sleepHour, config.sleepQuality);

      // 3. 认知负荷影响
      const loadEffect = cognitiveLoadEffect(hour, config.tasks, config.recovery);

      // 4. 进餐影响
      const meal = mealEffect(hour, config.mealTimes);

      // 计算精力
      let energy = circadianE
        - homeoF * 0.6                      // 稳态疲劳消耗
        - loadEffect.energyDrain * 0.4      // 认知负荷消耗
        + loadEffect.energyGain * 0.5       // 恢复活动增益
        + meal.energyBoost;                 // 餐后能量补充

      energy = Math.max(5, Math.min(100, energy + (config.focusBaseline - 60) * 0.3));

      // 计算专注度
      let focus = energy
        - loadEffect.focusDrain * 0.5       // 专注消耗
        + loadEffect.focusGain * 0.6;       // 专注恢复

      focus = Math.max(5, Math.min(100, focus + (config.focusBaseline - 60) * 0.5));

      // 疲劳度 = 稳态疲劳 + 认知负荷
      let fatigue = homeoF * 0.5 + loadEffect.energyDrain * 0.3;
      fatigue = Math.min(100, Math.max(0, fatigue * config.fatigueFactor));

      // 困意 = 稳态睡眠压力 + 昼夜节律低谷
      let sleepiness = homeoF * 0.7;
      // 下午困意增加
      if (hour >= 13 && hour <= 15) {
        sleepiness += 20;
      }
      // 晚上困意增加
      if (hour >= 22) {
        sleepiness += (hour - 22) * 15;
      }
      sleepiness = Math.min(100, Math.max(0, sleepiness));

      // 饥饿感
      const hunger = meal.hunger;

      // 需休息程度 = 疲劳 + 困意 + 饥饿的综合
      let restNeed = fatigue * 0.4 + sleepiness * 0.3 + hunger * 0.2;
      restNeed = Math.min(100, Math.max(0, restNeed));

      results.focus.push(Math.round(focus));
      results.energy.push(Math.round(energy));
      results.fatigue.push(Math.round(fatigue));
      results.sleepiness.push(Math.round(sleepiness));
      results.hunger.push(Math.round(hunger));
      results.restNeed.push(Math.round(restNeed));
    });

    // 缓存结果
    cachedResult = { ...results };
    cacheKey = key;

    return results;
  }

  // ================================================================
  // AI 分析函数
  // ================================================================

  /**
   * 分析当前节律状态，生成 AI 总结
   * 返回 { chronotype, currentPhase, peakHours, lowHours, recommendations, insight }
   */
  function analyze() {
    const data = generate();
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    // 找到峰值时段
    const peakIndices = [];
    const lowIndices = [];

    data.focus.forEach((val, i) => {
      if (val >= 75) peakIndices.push(i);
      if (val <= 40) lowIndices.push(i);
    });

    // 节律类型判断
    const morningFocus = data.focus.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const afternoonFocus = data.focus.slice(3, 6).reduce((a, b) => a + b, 0) / 3;
    const eveningFocus = data.focus.slice(6, 9).reduce((a, b) => a + b, 0) / 3;

    let chronotype = '中间型';
    if (morningFocus > afternoonFocus && morningFocus > eveningFocus + 10) {
      chronotype = '百灵鸟型';
    } else if (eveningFocus > afternoonFocus && eveningFocus > morningFocus + 10) {
      chronotype = '猫头鹰型';
    }

    // 当前阶段
    let currentIdx = 0;
    for (let i = 0; i < data.sampleHours.length; i++) {
      if (currentHour >= data.sampleHours[i]) currentIdx = i;
    }

    const currentFocus = data.focus[currentIdx] || 50;
    let currentPhase = '平稳';
    let phaseIcon = 'circle-dotted';

    if (currentFocus >= 75) {
      currentPhase = '高效';
      phaseIcon = 'bolt';
    } else if (currentFocus >= 60) {
      currentPhase = '良好';
      phaseIcon = 'trending-up';
    } else if (currentFocus >= 40) {
      currentPhase = '平稳';
      phaseIcon = 'circle-dotted';
    } else if (currentFocus >= 25) {
      currentPhase = '低谷';
      phaseIcon = 'trending-down';
    } else {
      currentPhase = '疲劳';
      phaseIcon = 'battery-low';
    }

    // 峰值时段描述
    let peakDesc = '';
    if (peakIndices.length > 0) {
      const peakHours = peakIndices.map(i => data.sampleHours[i]);
      if (peakHours.length <= 2) {
        peakDesc = peakHours.map(h => `${h}:00`).join('、');
      } else {
        peakDesc = `${peakHours[0]}:00 - ${peakHours[peakHours.length - 1]}:00`;
      }
    }

    // 低谷时段描述
    let lowDesc = '';
    if (lowIndices.length > 0) {
      const lowHours = lowIndices.map(i => data.sampleHours[i]);
      if (lowHours.length <= 2) {
        lowDesc = lowHours.map(h => `${h}:00`).join('、');
      } else {
        lowDesc = `${lowHours[0]}:00 - ${lowHours[lowHours.length - 1]}:00`;
      }
    }

    // 生成建议
    const recommendations = [];

    // 基于当前状态的建议
    if (currentPhase === '高效') {
      recommendations.push('当前处于高效时段，适合处理深度工作和复杂任务');
    } else if (currentPhase === '低谷') {
      recommendations.push('当前精力较低，建议安排轻量任务或短暂休息');
    }

    // 基于饥饿的建议
    const currentHunger = data.hunger[currentIdx] || 0;
    if (currentHunger > 60) {
      recommendations.push('饥饿感较强，建议补充能量');
    }

    // 基于疲劳的建议
    const currentFatigue = data.fatigue[currentIdx] || 0;
    if (currentFatigue > 70) {
      recommendations.push('疲劳度较高，建议休息15-20分钟');
    }

    // 时间规划建议
    if (peakIndices.length > 0) {
      recommendations.push(`建议将重要任务安排在 ${peakDesc} 高效时段`);
    }

    // 生成洞察文字
    let insight = '';
    if (chronotype === '百灵鸟型') {
      insight = '你属于早起型，早晨精力最充沛。建议利用上午高效时段处理重要工作，下午安排轻量任务，晚上早些休息。';
    } else if (chronotype === '猫头鹰型') {
      insight = '你属于晚睡型，晚上思维更活跃。建议把创造性工作安排在下午到晚上，上午可以安排例行事务，注意保证充足睡眠。';
    } else {
      if (afternoonFocus > morningFocus) {
        insight = '下午容易进入稳定专注，17:00 后适合切换到整理型任务。';
      } else if (morningFocus > afternoonFocus) {
        insight = '上午专注力较好，建议把深度工作安排在上午，午后适当休息。';
      } else {
        insight = '全天精力比较平稳，午后有自然低谷。建议在低谷时段安排休息或轻量活动，保持整体节奏。';
      }
    }

    return {
      chronotype,           // 节律类型
      currentPhase,         // 当前阶段
      phaseIcon,            // 阶段图标
      currentFocus,         // 当前专注度
      currentEnergy: data.energy[currentIdx] || 50,
      currentFatigue: data.fatigue[currentIdx] || 30,
      currentHunger: data.hunger[currentIdx] || 30,
      currentSleepiness: data.sleepiness[currentIdx] || 20,
      currentRestNeed: data.restNeed[currentIdx] || 25,
      peakHours: peakDesc,  // 峰值时段
      lowHours: lowDesc,    // 低谷时段
      recommendations,      // 建议列表
      insight,              // 洞察总结
      data,                 // 完整数据
    };
  }

  // ================================================================
  // AI 可调用的设置接口
  // ================================================================

  /**
   * 设置作息类型
   * @param {string} type - 'lark' | 'intermediate' | 'owl'
   */
  function setChronotype(type) {
    if (['lark', 'intermediate', 'owl'].includes(type)) {
      config.chronotype = type;
      invalidateCache();
    }
  }

  /**
   * 设置睡眠时间
   * @param {number} wakeHour - 起床时间（小时）
   * @param {number} sleepHour - 入睡时间（小时）
   * @param {number} sleepQuality - 睡眠质量 0-1
   */
  function setSleepTime(wakeHour, sleepHour, sleepQuality) {
    if (wakeHour != null) config.wakeHour = wakeHour;
    if (sleepHour != null) config.sleepHour = sleepHour;
    if (sleepQuality != null) config.sleepQuality = Math.max(0, Math.min(1, sleepQuality));
    invalidateCache();
  }

  /**
   * 设置进餐时间
   * @param {object} meals - { breakfast, lunch, dinner }
   */
  function setMealTimes(meals) {
    if (meals && typeof meals === 'object') {
      config.mealTimes = { ...config.mealTimes, ...meals };
      invalidateCache();
    }
  }

  /**
   * 设置个体参数
   * @param {object} params - { fatigueFactor, recoveryRate, focusBaseline }
   */
  function setIndividualParams(params) {
    if (params && typeof params === 'object') {
      if (params.fatigueFactor != null) {
        config.fatigueFactor = Math.max(0.3, Math.min(2.0, params.fatigueFactor));
      }
      if (params.recoveryRate != null) {
        config.recoveryRate = Math.max(0.3, Math.min(2.0, params.recoveryRate));
      }
      if (params.focusBaseline != null) {
        config.focusBaseline = Math.max(30, Math.min(90, params.focusBaseline));
      }
      invalidateCache();
    }
  }

  /**
   * 添加任务（消耗精力）
   * @param {object} task - { hour, duration, type, cognitiveLoad }
   */
  function addTask(task) {
    if (task && task.hour != null) {
      config.tasks.push({
        hour: task.hour,
        duration: task.duration || 1,
        type: task.type || 'work',
        cognitiveLoad: task.cognitiveLoad || 'medium',
      });
      invalidateCache();
    }
  }

  /**
   * 批量设置任务
   * @param {Array} tasks
   */
  function setTasks(tasks) {
    config.tasks = [];
    if (Array.isArray(tasks)) {
      tasks.forEach(t => addTask(t));
    }
    invalidateCache();
  }

  /**
   * 添加恢复活动（补充精力）
   * @param {object} recovery - { hour, duration, type, recoveryAmount }
   */
  function addRecovery(recovery) {
    if (recovery && recovery.hour != null) {
      config.recovery.push({
        hour: recovery.hour,
        duration: recovery.duration || 0.5,
        type: recovery.type || 'rest',
        recoveryAmount: recovery.recoveryAmount || 1.0,
      });
      invalidateCache();
    }
  }

  /**
   * 批量设置恢复活动
   * @param {Array} recoveries
   */
  function setRecoveries(recoveries) {
    config.recovery = [];
    if (Array.isArray(recoveries)) {
      recoveries.forEach(r => addRecovery(r));
    }
    invalidateCache();
  }

  /**
   * 直接设置某一时刻的数值（AI 强制调整）
   * @param {number} hour - 小时
   * @param {string} metric - 'focus' | 'energy' | 'fatigue' | 'sleepiness' | 'hunger'
   * @param {number} value - 0-100
   */
  function setValueAt(hour, metric, value) {
    // 这个函数会在 generate 之后手动调整数据点
    // 用于 AI 微调特定时间点的数值
    const data = generate();
    const idx = SAMPLE_HOURS.findIndex(h => Math.abs(h - hour) < 1.5);
    if (idx >= 0 && data[metric] != null) {
      data[metric][idx] = Math.max(0, Math.min(100, value));
      // 简单平滑相邻点
      if (idx > 0) {
        data[metric][idx - 1] = Math.round(data[metric][idx - 1] * 0.7 + value * 0.3);
      }
      if (idx < data[metric].length - 1) {
        data[metric][idx + 1] = Math.round(data[metric][idx + 1] * 0.7 + value * 0.3);
      }
      cachedResult = { ...data };
      cacheKey = ''; // 手动调整后缓存key失效
    }
    return data;
  }

  /**
   * 重置为默认值
   */
  function reset() {
    config = { ...DEFAULTS };
    config.mealTimes = { ...DEFAULTS.mealTimes };
    config.tasks = [];
    config.recovery = [];
    invalidateCache();
  }

  // ================================================================
  // 工具函数
  // ================================================================

  function invalidateCache() {
    cachedResult = null;
    cacheKey = '';
  }

  /**
   * 获取当前配置
   */
  function getConfig() {
    return { ...config, mealTimes: { ...config.mealTimes }, tasks: [...config.tasks], recovery: [...config.recovery] };
  }

  /**
   * 获取采样小时数组
   */
  function getSampleHours() {
    return SAMPLE_HOURS.slice();
  }

  // ================================================================
  // 公开 API
  // ================================================================

  return {
    // 核心生成
    generate,
    analyze,

    // AI 设置接口
    setChronotype,
    setSleepTime,
    setMealTimes,
    setIndividualParams,
    addTask,
    setTasks,
    addRecovery,
    setRecoveries,
    setValueAt,
    reset,

    // 查询
    getConfig,
    getSampleHours,

    // 常量
    SAMPLE_HOURS,
    CHRONOTYPES: ['lark', 'intermediate', 'owl'],
  };
})();

// 暴露到全局
if (typeof window !== 'undefined') {
  window.RhythmEngine = RhythmEngine;
}
