/* ============================================================
 * PIDController - 全局质量控制模块
 *
 * 对标参考项目：
 *   - pid-controller.js: 4变量PID闭环控制（情绪/爽点/字数/质量）
 *   - global-novel-controller.js: 每20章5项全书检查
 *   - system-health-monitor.js: 5维度系统健康评分
 *
 * 全部纯算法实现，零外部依赖。
 * ============================================================ */

// ============================================================
// PIDController - PID闭环控制器
// 对标参考项目 pid-controller.js
// ============================================================
const PIDController = {

  // 4变量目标值和PID参数
  VARIABLES: {
    emotion_score:      { target: 75.0,  Kp: 0.5,  Ki: 0.15, Kd: 0.25 },
    cool_point_density: { target: 0.29,  Kp: 0.4,  Ki: 0.10, Kd: 0.20 },
    word_count_accuracy:{ target: 0.85,  Kp: 0.3,  Ki: 0.08, Kd: 0.15 },
    quality_score:      { target: 80.0,  Kp: 0.45, Ki: 0.12, Kd: 0.22 },
  },

  // 状态存储（持久化到 novel.pidStates）
  init(novel){
    if(!novel.pidStates) novel.pidStates = {};
    for(const varName of Object.keys(this.VARIABLES)){
      if(!novel.pidStates[varName]){
        novel.pidStates[varName] = {
          error_integral: 0,
          last_error: 0,
          last_value: 0,
          sample_count: 0,
        };
      }
    }
  },

  // 单变量PID计算
  compute(varName, currentValue){
    const config = this.VARIABLES[varName];
    if(!config) return null;

    const state = { error_integral: 0, last_error: 0, last_value: 0, sample_count: 0 };
    // 从 novel 获取状态（调用方需传入）
    const s = arguments[2] || state;

    const target = config.target;
    const error = target - currentValue;

    // P 项
    const pCorrection = config.Kp * error;

    // I 项（积分衰减防饱和）
    s.error_integral = s.error_integral * 0.85 + error;
    const iCorrection = config.Ki * s.error_integral;

    // D 项（首次采样D=0）
    const dCorrection = s.sample_count > 0 ? config.Kd * (error - s.last_error) : 0;

    const total = pCorrection + iCorrection + dCorrection;

    // 趋势判断
    const derivative = error - s.last_error;
    let trend = 'stable';
    if(derivative < -0.05) trend = 'improving';
    else if(derivative > 0.05) trend = 'worsening';

    // 严重度
    const absError = Math.abs(error);
    const absTarget = Math.abs(target);
    let severity = 'ok';
    if(absError / absTarget > 0.3 || Math.abs(s.error_integral) > 3.0) severity = 'critical';
    else if(absError / absTarget > 0.15 || Math.abs(s.error_integral) > 1.5) severity = 'warning';

    // 更新状态
    s.last_error = error;
    s.last_value = currentValue;
    s.sample_count++;
    // 状态重置（防累积过大）
    if(s.sample_count > 100){
      s.error_integral *= 0.5;
      s.sample_count = 50;
    }

    return {
      varName,
      target,
      current: currentValue,
      error,
      p_correction: Math.round(pCorrection * 100) / 100,
      i_correction: Math.round(iCorrection * 100) / 100,
      d_correction: Math.round(dCorrection * 100) / 100,
      total: Math.round(total * 100) / 100,
      trend,
      severity,
      integral: Math.round(s.error_integral * 100) / 100,
      derivative: Math.round(derivative * 100) / 100,
    };
  },

  // 评估全部4变量
  evaluateAll(novel, metrics){
    this.init(novel);
    const results = {};
    for(const [varName, config] of Object.entries(this.VARIABLES)){
      const current = metrics[varName];
      if(current !== undefined && current !== null){
        results[varName] = this.compute(varName, current, novel.pidStates[varName]);
      }
    }
    return results;
  },

  // 生成修正建议文本
  buildRecommendations(results){
    const recs = [];
    for(const [varName, result] of Object.entries(results)){
      if(result.severity === 'ok') continue;
      const varNames = {
        emotion_score: '情绪密度',
        cool_point_density: '爽点密度',
        word_count_accuracy: '字数控制',
        quality_score: '章节质量',
      };
      const name = varNames[varName] || varName;
      if(result.error > 0){
        recs.push(`【${name}偏低】当前${Math.round(result.current*100)/100}，目标${result.target}，建议提升${Math.round(result.total*100)/100}`);
      } else {
        recs.push(`【${name}偏高】当前${Math.round(result.current*100)/100}，目标${result.target}，建议降低${Math.abs(Math.round(result.total*100)/100)}`);
      }
    }
    return recs;
  },

  // 从章节列表计算当前指标
  computeMetrics(novel, chapIdx){
    const recent = novel.chapters?.slice(Math.max(0, chapIdx - 5), chapIdx) || [];
    if(recent.length === 0) return null;

    // 情绪密度：近5章情绪分均值
    const emotionScores = recent.filter(c => c.score?.scores?.engagement).map(c => c.score.scores.engagement);
    const emotion_score = emotionScores.length > 0 ?
      emotionScores.reduce((a,b) => a+b, 0) / emotionScores.length : 60;

    // 爽点密度：近5章有爽点的章节占比
    const coolPointChapters = recent.filter(c => c.score?.scores?.engagement > 50).length;
    const cool_point_density = coolPointChapters / recent.length;

    // 字数准确度：近5章字数达标率
    const targetWords = novel.wordCount || 1200;
    const wordAccurate = recent.filter(c => c.content && c.content.length >= targetWords * 0.7).length;
    const word_count_accuracy = wordAccurate / recent.length;

    // 质量分：近5章综合分均值
    const qualityScores = recent.filter(c => c.score?.overall).map(c => c.score.overall);
    const quality_score = qualityScores.length > 0 ?
      qualityScores.reduce((a,b) => a+b, 0) / qualityScores.length : 60;

    return { emotion_score, cool_point_density, word_count_accuracy, quality_score };
  },
};

// ============================================================
// GlobalNovelController - 全书控制器
// 对标参考项目 global-novel-controller.js
// 每20章触发5项全书检查
// ============================================================
const GlobalNovelController = {

  // 是否应该触发（每20章）
  shouldTrigger(chapIdx){
    return chapIdx > 0 && (chapIdx + 1) % 20 === 0;
  },

  // 执行5项检查
  async regulate(novel, chapIdx){
    if(!this.shouldTrigger(chapIdx)) return null;

    const checks = {};
    const directives = [];

    // 1. 情绪曲线健康检查
    try{
      checks.emotionCurve = this.checkEmotionCurve(novel, chapIdx);
      if(checks.emotionCurve.issue){
        directives.push({ type:'quality', directive: checks.emotionCurve.message, applyRange:5 });
      }
    }catch(e){ console.warn('情绪曲线检查失败', e); }

    // 2. 伏笔密度检查
    try{
      checks.foreshadowing = this.checkForeshadowingDensity(novel, chapIdx);
      if(checks.foreshadowing.issue){
        directives.push({ type:'quality', directive: checks.foreshadowing.message, applyRange:3 });
      }
    }catch(e){ console.warn('伏笔密度检查失败', e); }

    // 3. 角色平衡检查
    try{
      checks.characterBalance = this.checkCharacterBalance(novel, chapIdx);
      if(checks.characterBalance.issue){
        directives.push({ type:'quality', directive: checks.characterBalance.message, applyRange:3 });
      }
    }catch(e){ console.warn('角色平衡检查失败', e); }

    // 4. 爽点节奏检查
    try{
      checks.coolPointRhythm = this.checkCoolPointRhythm(novel, chapIdx);
      if(checks.coolPointRhythm.issue){
        directives.push({ type:'strategy', directive: checks.coolPointRhythm.message, applyRange:3 });
      }
    }catch(e){ console.warn('爽点节奏检查失败', e); }

    // 5. 主线对齐度（简化版：基于进度推断）
    try{
      checks.mainlineAlignment = this.checkMainlineAlignment(novel, chapIdx);
      if(checks.mainlineAlignment.issue){
        directives.push({ type:'strategy', directive: checks.mainlineAlignment.message, applyRange:5 });
      }
    }catch(e){ console.warn('主线对齐检查失败', e); }

    return { triggered: true, checks, directives };
  },

  // 情绪曲线健康检查
  // 增强：集成 detectEmotionCurveAnomaly（对标 Reference-php helpers.detectEmotionCurveAnomaly）
  checkEmotionCurve(novel, chapIdx){
    const recent = novel.chapters?.slice(Math.max(0, chapIdx - 20), chapIdx) || [];
    const scored = recent.filter(c => c.score?.scores?.engagement);
    if(scored.length < 5) return { checked: false, issue: false };

    const scores = scored.map(c => c.score.scores.engagement);
    const avg = scores.reduce((a,b) => a+b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;

    // 近5章均值和最大值
    const recent5 = scores.slice(-5);
    const recent5Avg = recent5.reduce((a,b) => a+b, 0) / recent5.length;
    const recent5Max = Math.max(...recent5);

    // 原有规则检查
    if(recent5Avg < 50 && recent5Max < 60){
      return {
        checked: true, issue: true,
        avg: Math.round(avg), variance: Math.round(variance),
        message: '【情绪低谷】近5章情绪密度持续偏低（均值<50），建议安排情感爆发点或高潮事件',
      };
    }
    if(variance < 100 && scored.length >= 8){
      return {
        checked: true, issue: true,
        avg: Math.round(avg), variance: Math.round(variance),
        message: '【情绪持平】近20章情绪曲线过于平坦（方差<100），建议增加起伏和转折',
      };
    }

    // 增强：使用 detectEmotionCurveAnomaly 检测情绪突变和单调
    // 为什么增强：原方法仅检查 engagement 分数趋势，新方法检测情绪类型的跳跃和单调
    try{
      const anomalyResult = detectEmotionCurveAnomaly(recent);
      if(anomalyResult.detected && anomalyResult.anomalies.length > 0){
        // 取最严重的异常
        const worst = anomalyResult.anomalies[0];
        return {
          checked: true, issue: true,
          avg: Math.round(avg), variance: Math.round(variance),
          message: `【${worst.type === 'sudden_jump' ? '情绪突变' : worst.type === 'long_flat' ? '情绪平淡' : '情绪单调'}】${worst.message}`,
          anomaly: worst,
        };
      }
    }catch(e){ /* detectEmotionCurveAnomaly 未加载时静默降级 */ }

    return { checked: true, issue: false, avg: Math.round(avg), variance: Math.round(variance) };
  },

  // 伏笔密度检查
  checkForeshadowingDensity(novel, chapIdx){
    const m = novel.memory;
    if(!m?.foreshadowing) return { checked: false, issue: false };

    const pending = m.foreshadowing.filter(f => f.status !== 'resolved');
    let aging = 0, forgotten = 0;
    for(const fs of pending){
      const age = chapIdx - fs.plantedAt;
      if(age > 25) aging++;
      const lastMention = fs.mentions.length > 0 ? Math.max(...fs.mentions) : fs.plantedAt;
      const sinceLastMention = chapIdx - lastMention;
      if(sinceLastMention > 15 && age > 20) forgotten++;
    }

    if(forgotten > 0){
      return {
        checked: true, issue: true, pending: pending.length, aging, forgotten,
        message: `【伏笔遗忘】${forgotten}个伏笔超过15章未被提及且埋设超20章，建议近期提及或回收`,
      };
    }
    if(aging > 0){
      return {
        checked: true, issue: true, pending: pending.length, aging, forgotten,
        message: `【伏笔老化】${aging}个伏笔埋设超25章未回收，建议安排回收`,
      };
    }
    return { checked: true, issue: false, pending: pending.length, aging, forgotten };
  },

  // 角色平衡检查
  checkCharacterBalance(novel, chapIdx){
    const m = novel.memory;
    if(!m?.characterCards) return { checked: false, issue: false };

    const marginalized = [];
    for(const [name, card] of Object.entries(m.characterCards)){
      const gap = chapIdx - (card.lastAppearChap ?? -1);
      // 主角gap>4 / 次要gap>12 → 边缘化
      if(card.role === 'protagonist' && gap > 4){
        marginalized.push({ name, gap, role: '主角' });
      } else if(card.role === 'major' && gap > 8){
        marginalized.push({ name, gap, role: '主要角色' });
      } else if(gap > 12){
        marginalized.push({ name, gap, role: '配角' });
      }
    }

    if(marginalized.length > 0){
      const list = marginalized.map(m => `${m.name}(${m.role},${m.gap}章未出场)`).join('、');
      return {
        checked: true, issue: true, marginalized,
        message: `【角色边缘化】以下角色长期未出场：${list}，建议安排出场`,
      };
    }
    return { checked: true, issue: false, marginalized: [] };
  },

  // 爽点节奏检查
  checkCoolPointRhythm(novel, chapIdx){
    const recent = novel.chapters?.slice(Math.max(0, chapIdx - 20), chapIdx) || [];
    if(recent.length < 5) return { checked: false, issue: false };

    const coolPointChapters = recent.filter(c => c.score?.scores?.engagement > 50);
    const totalChapters = recent.length;
    const chaptersPerCool = coolPointChapters.length > 0 ? totalChapters / coolPointChapters.length : Infinity;

    // 计算最长无爽点间隔
    let maxGap = 0, currentGap = 0;
    for(const c of recent){
      if(c.score?.scores?.engagement > 50){
        maxGap = Math.max(maxGap, currentGap);
        currentGap = 0;
      } else {
        currentGap++;
      }
    }
    maxGap = Math.max(maxGap, currentGap);

    if(coolPointChapters.length === 0 && totalChapters >= 6){
      return {
        checked: true, issue: true,
        message: '【爽点缺失】近20章无爽点章节，必须安排爽点事件',
      };
    }
    if(maxGap >= 6){
      return {
        checked: true, issue: true, maxGap,
        message: `【爽点断层】已连续${maxGap}章无爽点，建议本章安排爽点`,
      };
    }
    if(chaptersPerCool > 5 && totalChapters >= 8){
      return {
        checked: true, issue: true, chaptersPerCool: Math.round(chaptersPerCool),
        message: `【爽点稀薄】平均${Math.round(chaptersPerCool)}章才有1个爽点，建议提高爽点密度`,
      };
    }
    return { checked: true, issue: false, chaptersPerCool: Math.round(chaptersPerCool), maxGap };
  },

  // 主线对齐度检查（简化版：基于进度推断）
  checkMainlineAlignment(novel, chapIdx){
    const progress = (chapIdx + 1) / novel.chapterCount;
    const outline = novel.outline?.[chapIdx];

    // 检查是否偏离三幕结构
    let expectedAct = 1;
    if(progress > 0.75) expectedAct = 3;
    else if(progress > 0.25) expectedAct = 2;

    // 简化版：检查大纲是否存在
    if(!outline || !outline.summary){
      return {
        checked: true, issue: true,
        message: '【主线偏离风险】本章大纲缺失或过于简略，可能偏离主线',
      };
    }

    return { checked: true, issue: false, progress: Math.round(progress * 100), act: expectedAct };
  },
};

// ============================================================
// SystemHealthMonitor - 系统健康监控
// 对标参考项目 system-health-monitor.js
// 简化版：4维度检查
// ============================================================
const SystemHealthMonitor = {

  // 检查系统健康
  check(novel, chapIdx){
    let score = 100;
    const alerts = [];

    // 1. LLM调用失败率（从 novel.apiStats 获取）
    const apiStats = novel.apiStats || { failures: 0, total: 0 };
    if(apiStats.total > 5){
      const failRate = apiStats.failures / apiStats.total;
      if(failRate > 0.3){
        score -= 25;
        alerts.push({ level: 'error', type: 'api_failure', message: `API失败率${Math.round(failRate*100)}%，建议检查网络或更换模型` });
      } else if(failRate > 0.1){
        score -= 10;
        alerts.push({ level: 'warning', type: 'api_failure', message: `API失败率${Math.round(failRate*100)}%` });
      }
    }

    // 2. 质量评分偏差
    const recent = novel.chapters?.slice(Math.max(0, chapIdx - 10), chapIdx) || [];
    const scored = recent.filter(c => c.criticScore?.avg);
    if(scored.length >= 8){
      const highScores = scored.filter(c => c.criticScore.avg >= 9).length;
      if(highScores >= 8){
        score -= 20;
        alerts.push({ level: 'warning', type: 'critic_bias', message: '近10章读者评分持续≥9分，可能存在评分虚高' });
      }
    }

    // 3. 写作停滞
    if(novel.chapters?.length > 0){
      const lastChap = novel.chapters[novel.chapters.length - 1];
      if(lastChap?.createdAt){
        const hoursSince = (Date.now() - lastChap.createdAt) / (1000 * 60 * 60);
        if(hoursSince > 72){
          score -= 20;
          alerts.push({ level: 'info', type: 'chapter_stagnation', message: `已${Math.round(hoursSince)}小时未生成新章节` });
        }
      }
    }

    // 4. 质量守卫P0违规
    const p0Violations = recent.filter(c => c.score?.overall < 40).length;
    if(p0Violations >= 5){
      score -= 20;
      alerts.push({ level: 'error', type: 'constraint_surge', message: `近10章有${p0Violations}章质量分<40，建议检查Prompt配置` });
    }

    const recommendations = this.generateRecommendations(alerts);
    return { healthy: score >= 70, score, alerts, recommendations };
  },

  generateRecommendations(alerts){
    const map = {
      api_failure: '检查API Key有效性、网络连接，或切换备用模型',
      critic_bias: 'CriticAgent可能评分虚高，建议人工抽检章节质量',
      chapter_stagnation: '考虑调整生成参数或简化章节大纲',
      constraint_surge: '检查世界观/角色设定是否过于复杂，导致AI生成困难',
    };
    return alerts.map(a => map[a.type] || '').filter(Boolean);
  },
};

window.PIDController = PIDController;
window.GlobalNovelController = GlobalNovelController;
window.SystemHealthMonitor = SystemHealthMonitor;
