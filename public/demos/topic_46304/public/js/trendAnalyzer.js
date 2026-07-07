/* ============================================================
 * TrendAnalyzer - 趋势分析与自适应决策模块
 *
 * 对标参考项目：
 *   - trend-predictor.js: 线性回归预测5维度趋势
 *   - plot-pattern-detector.js: 套路化检测（签名+三层检测）
 *   - improvement-evaluator.js: 迭代效果评估
 *   - adaptive-decision-engine.js: 自适应权重+风险预测
 *
 * 全部纯算法实现，零外部依赖。
 * ============================================================ */

// ============================================================
// TrendPredictor - 趋势预测器
// 对标参考项目 trend-predictor.js
// 线性回归 + 置信度 + 健康度
// ============================================================
const TrendPredictor = {

  // 5维度目标值
  TARGETS: {
    quality_score: 80,
    emotion_score: 75,
    cool_point_density: 0.29,
    word_count_accuracy: 0.85,
  },

  // 线性回归斜率（最小二乘法）
  calculateSlope(values){
    const n = values.length;
    if(n < 2) return 0;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for(let i = 0; i < n; i++){
      num += (i - xMean) * (values[i] - yMean);
      den += (i - xMean) ** 2;
    }
    return den === 0 ? 0 : num / den;
  },

  // 预测下一章
  predictNext(values){
    if(values.length < 2) return values[values.length - 1] || 0;
    const slope = this.calculateSlope(values);
    return values[values.length - 1] + slope;
  },

  // 置信度（基于变异系数）
  calculateConfidence(values){
    if(values.length < 3) return 0.3;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if(mean === 0) return 0.3;
    const std = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length);
    const cv = std / Math.abs(mean);
    return Math.max(0.1, Math.min(0.95, 1 - cv));
  },

  // 状态判定
  determineStatus(current, target, slope){
    if(current >= target && slope >= -0.5) return 'healthy';
    if(current >= target && slope < -0.5) return 'declining_from_good';
    if(slope > 0.3) return 'improving';
    if(slope < -0.3) return 'declining';
    if(current >= target * 0.9) return 'slightly_below';
    return 'below_target';
  },

  // 生成建议
  generateRecommendation(status, metric, slope){
    const metricNames = {
      quality_score: '质量分',
      emotion_score: '情绪分',
      cool_point_density: '爽点密度',
      word_count_accuracy: '字数准确度',
    };
    const name = metricNames[metric] || metric;
    switch(status){
      case 'healthy': return `${name}健康，保持当前策略`;
      case 'declining_from_good': return `${name}虽达标但呈下降趋势（斜率${slope.toFixed(2)}），需关注`;
      case 'improving': return `${name}正在改善，继续保持`;
      case 'declining': return `${name}持续下降（斜率${slope.toFixed(2)}），建议调整策略`;
      case 'slightly_below': return `${name}略低于目标，小幅调整即可`;
      case 'below_target': return `${name}严重低于目标，需要重点改善`;
      default: return '';
    }
  },

  // 分析单个维度
  analyzeMetric(metric, history, target){
    const values = history.filter(v => v !== undefined && v !== null);
    if(values.length < 2) return null;

    const current = values[values.length - 1];
    const slope = this.calculateSlope(values);
    const predicted = this.predictNext(values);
    const confidence = this.calculateConfidence(values);
    const status = this.determineStatus(current, target, slope);

    return {
      metric, current, target, slope, predicted, confidence, status,
      recommendation: this.generateRecommendation(status, metric, slope),
    };
  },

  // 从章节列表提取历史指标
  extractMetrics(novel, chapIdx, window = 15){
    const recent = novel.chapters?.slice(Math.max(0, chapIdx - window), chapIdx) || [];
    const history = {
      quality_score: [],
      emotion_score: [],
      cool_point_density: [],
      word_count_accuracy: [],
    };

    for(const c of recent){
      if(c.score?.overall) history.quality_score.push(c.score.overall);
      if(c.score?.scores?.engagement) history.emotion_score.push(c.score.scores.engagement);
      // 爽点密度：engagement > 50 算有爽点
      history.cool_point_density.push(c.score?.scores?.engagement > 50 ? 1 : 0);
      // 字数准确度
      const targetWords = novel.wordCount || 1200;
      history.word_count_accuracy.push(c.content && c.content.length >= targetWords * 0.7 ? 1 : 0);
    }

    return history;
  },

  // 全维度分析
  analyze(novel, chapIdx){
    const history = this.extractMetrics(novel, chapIdx);
    const results = {};
    for(const [metric, target] of Object.entries(this.TARGETS)){
      if(history[metric] && history[metric].length >= 2){
        results[metric] = this.analyzeMetric(metric, history[metric], target);
      }
    }

    // 整体健康度
    const overallHealth = this.calculateOverallHealth(results);
    return { metrics: results, overallHealth };
  },

  // 整体健康度
  calculateOverallHealth(results){
    const validMetrics = Object.values(results).filter(r => r);
    if(validMetrics.length === 0) return { score: 60, grade: 'C', weakest: null };

    // 归一化到0-100
    const normalized = validMetrics.map(r => {
      const ratio = r.current / r.target;
      return Math.min(100, Math.max(0, ratio * 100));
    });
    const score = Math.round(normalized.reduce((a, b) => a + b, 0) / normalized.length);

    let grade = 'F';
    if(score >= 90) grade = 'A';
    else if(score >= 80) grade = 'B';
    else if(score >= 70) grade = 'C';
    else if(score >= 60) grade = 'D';

    // 找最弱维度
    const weakest = validMetrics.reduce((min, r) =>
      (r.current / r.target) < (min.current / min.target) ? r : min
    );

    return { score, grade, weakest: weakest?.metric || null };
  },
};

// ============================================================
// PlotPatternDetector - 情节模式检测器
// 对标参考项目 plot-pattern-detector.js
// 签名+三层检测+替代方案推荐
// ============================================================
const PlotPatternDetector = {

  WINDOW: 30,
  MIN_CHAPTERS: 5,
  MAX_REPETITION: 4,
  MAX_STREAK: 3,

  // 开篇类型（5种）
  OPENING_TYPES: ['action', 'dialogue', 'suspense', 'scene', 'emotion'],

  // 钩子类型（6种）
  HOOK_TYPES: ['crisis_interrupt', 'info_bomb', 'plot_twist', 'new_goal', 'emotional_impact', 'upgrade_omen'],

  // 爽点类型（9种）
  COOL_POINT_TYPES: ['underdog_win', 'face_slap', 'treasure_find', 'breakthrough', 'power_expand', 'romance_win', 'truth_reveal', 'last_stand', 'sacrifice'],

  // 替代方案映射
  ALTERNATIVES: {
    action: ['以对话开篇', '以悬念开篇', '以场景描写开篇'],
    dialogue: ['以动作开篇', '以悬念开篇', '以情感开篇'],
    suspense: ['以动作开篇', '以对话开篇', '以场景描写开篇'],
    scene: ['以动作开篇', '以对话开篇', '以悬念开篇'],
    emotion: ['以动作开篇', '以场景描写开篇', '以悬念开篇'],
    crisis_interrupt: ['信息爆炸型钩子', '反转颠覆型钩子', '情感冲击型钩子'],
    info_bomb: ['危机打断型钩子', '新目标型钩子', '升级预示型钩子'],
    plot_twist: ['危机打断型钩子', '情感冲击型钩子', '新目标型钩子'],
    new_goal: ['反转颠覆型钩子', '危机打断型钩子', '升级预示型钩子'],
    emotional_impact: ['危机打断型钩子', '信息爆炸型钩子', '新目标型钩子'],
    upgrade_omen: ['危机打断型钩子', '反转颠覆型钩子', '情感冲击型钩子'],
    underdog_win: ['打脸反转', '真相揭露', '宝物奇遇'],
    face_slap: ['越级战胜', '真相揭露', '突破'],
    treasure_find: ['越级战胜', '打脸反转', '势力扩张'],
    breakthrough: ['越级战胜', '打脸反转', '宝物奇遇'],
    power_expand: ['越级战胜', '真相揭露', '背水一战'],
    romance_win: ['真相揭露', '背水一战', '牺牲'],
    truth_reveal: ['越级战胜', '打脸反转', '背水一战'],
    last_stand: ['越级战胜', '突破', '真相揭露'],
    sacrifice: ['越级战胜', '打脸反转', '突破'],
  },

  // 构建章节签名
  buildSignature(chapter){
    const opening = chapter.openingType || 'normal';
    const hook = chapter.hookType || 'none';
    const coolPoint = chapter.coolPointType || 'none';
    return `${opening}|${hook}|${coolPoint}`;
  },

  // 检测套路化
  detect(novel, chapIdx){
    if(chapIdx < this.MIN_CHAPTERS) return null;

    const recent = novel.chapters?.slice(Math.max(0, chapIdx - this.WINDOW), chapIdx) || [];
    if(recent.length < this.MIN_CHAPTERS) return null;

    // 构建签名序列
    const signatures = recent.map(c => this.buildSignature(c));

    // 检测1：单一签名出现次数
    const sigCounts = {};
    for(const sig of signatures){
      sigCounts[sig] = (sigCounts[sig] || 0) + 1;
    }
    const maxSig = Object.entries(sigCounts).sort((a, b) => b[1] - a[1])[0];
    if(maxSig && maxSig[1] >= this.MAX_REPETITION){
      return {
        severity: 'high',
        type: 'pattern_repetition',
        pattern: maxSig[0],
        count: maxSig[1],
        message: `情节套路化：相同开篇+钩子+爽点组合出现${maxSig[1]}次，建议变换节奏`,
        directive: this.buildAvoidDirective(maxSig[0]),
      };
    }

    // 检测2：连续相同签名
    const maxStreak = this.detectMaxStreak(signatures);
    if(maxStreak.count >= this.MAX_STREAK){
      return {
        severity: 'medium',
        type: 'consecutive_repetition',
        pattern: maxStreak.signature,
        count: maxStreak.count,
        message: `连续${maxStreak.count}章使用相同的情节模式，读者可能产生疲劳`,
        directive: this.buildConsecutiveDirective(maxStreak.signature),
      };
    }

    // 检测3：单一元素过度使用
    const elementOveruse = this.detectElementOveruse(recent);
    if(elementOveruse){
      return elementOveruse;
    }

    return null;
  },

  // 最长连续重复检测
  detectMaxStreak(signatures){
    let maxSig = '', maxCount = 0, currentSig = '', currentCount = 0;
    for(const sig of signatures){
      if(sig === currentSig){
        currentCount++;
        if(currentCount > maxCount){
          maxCount = currentCount;
          maxSig = sig;
        }
      } else {
        currentSig = sig;
        currentCount = 1;
      }
    }
    return { signature: maxSig, count: maxCount };
  },

  // 单一元素过度使用检测
  detectElementOveruse(chapters){
    const elementCounts = { opening: {}, hook: {}, coolPoint: {} };
    for(const c of chapters){
      const o = c.openingType || 'normal';
      const h = c.hookType || 'none';
      const cp = c.coolPointType || 'none';
      elementCounts.opening[o] = (elementCounts.opening[o] || 0) + 1;
      elementCounts.hook[h] = (elementCounts.hook[h] || 0) + 1;
      elementCounts.coolPoint[cp] = (elementCounts.coolPoint[cp] || 0) + 1;
    }

    const threshold = Math.max(6, Math.round(chapters.length * 0.35));
    for(const [elemType, counts] of Object.entries(elementCounts)){
      for(const [type, count] of Object.entries(counts)){
        if(count >= threshold && type !== 'normal' && type !== 'none'){
          const elemNames = { opening: '开篇方式', hook: '钩子类型', coolPoint: '爽点类型' };
          return {
            severity: 'medium',
            type: 'element_overuse',
            element: elemNames[elemType],
            pattern: type,
            count,
            message: `${elemNames[elemType]}"${type}"过度使用（${count}次/${chapters.length}章），建议多样化`,
            directive: this.buildElementDirective(type),
          };
        }
      }
    }
    return null;
  },

  buildAvoidDirective(signature){
    const [opening, hook, coolPoint] = signature.split('|');
    const alts = [];
    if(this.ALTERNATIVES[opening]) alts.push(...this.ALTERNATIVES[opening].slice(0, 2));
    if(this.ALTERNATIVES[hook]) alts.push(...this.ALTERNATIVES[hook].slice(0, 2));
    if(alts.length > 0) return `建议变换情节模式：${alts.join('、')}`;
    return '建议变换情节模式，避免套路化';
  },

  buildConsecutiveDirective(signature){
    return this.buildAvoidDirective(signature);
  },

  buildElementDirective(type){
    const alts = this.ALTERNATIVES[type] || [];
    if(alts.length > 0) return `建议使用替代方案：${alts.join('、')}`;
    return '建议尝试不同的情节元素';
  },

  // 获取分布统计
  getStats(novel, chapIdx){
    const recent = novel.chapters?.slice(Math.max(0, chapIdx - this.WINDOW), chapIdx) || [];
    const stats = { opening: {}, hook: {}, coolPoint: {} };
    for(const c of recent){
      const o = c.openingType || 'normal';
      const h = c.hookType || 'none';
      const cp = c.coolPointType || 'none';
      stats.opening[o] = (stats.opening[o] || 0) + 1;
      stats.hook[h] = (stats.hook[h] || 0) + 1;
      stats.coolPoint[cp] = (stats.coolPoint[cp] || 0) + 1;
    }
    return stats;
  },

  // ===== v4 计划补全方法 =====

  // 描述模式 — 对标 Reference-php describePattern()
  // 将检测到的模式转为人类可读描述
  describePattern(pattern){
    if(!pattern) return '未检测到明显模式';
    if(pattern.type === 'max_streak'){
      const elemNames = { opening: '开篇方式', hook: '钩子类型', coolPoint: '爽点类型' };
      return `${elemNames[pattern.element] || pattern.element}"${pattern.pattern}"连续出现${pattern.count}次，存在套路化风险`;
    }
    if(pattern.type === 'element_overuse'){
      return `${pattern.element}"${pattern.pattern}"过度使用（${pattern.count}次），建议多样化`;
    }
    return pattern.message || '检测到模式异常';
  },

  // 获取替代方案 — 对标 Reference-php getAlternatives()
  // 返回指定类型的替代模式列表
  getAlternatives(type){
    if(!type) return this.ALTERNATIVES;
    return this.ALTERNATIVES[type] || [];
  },
};

// ============================================================
// ImprovementEvaluator - 改进评估器
// 对标参考项目 improvement-evaluator.js
// 迭代效果评估+诊断
// ============================================================
const ImprovementEvaluator = {

  // 评估单轮迭代
  evaluateIteration(before, after, issuesBefore, issuesAfter){
    const improvement = after - before;
    const improvementRate = before > 0 ? improvement / before : 0;
    const effectiveness = this.assessEffectiveness(improvement);
    const issuesResolved = this.calculateIssuesResolved(issuesBefore, issuesAfter);

    return {
      before_score: before,
      after_score: after,
      improvement: Math.round(improvement * 10) / 10,
      improvement_rate: Math.round(improvementRate * 1000) / 1000,
      effectiveness,
      issues_resolved: issuesResolved.resolved,
      issues_remaining: issuesResolved.remaining,
    };
  },

  // 效果分级
  assessEffectiveness(improvement){
    if(improvement >= 10) return 'excellent';
    if(improvement >= 5) return 'good';
    if(improvement >= 2) return 'moderate';
    if(improvement >= -2) return 'minimal';
    if(improvement >= -5) return 'slight_decline';
    return 'significant_decline';
  },

  // 问题解决判定
  calculateIssuesResolved(before, after){
    if(!before || !after) return { resolved: 0, remaining: 0 };
    const resolved = before.filter(issue => !after.includes(issue));
    return { resolved: resolved.length, remaining: after.length };
  },

  // 整体评估
  evaluateOverall(iterationResults){
    if(iterationResults.length === 0) return null;

    const totalIterations = iterationResults.length;
    const totalImprovement = iterationResults[totalIterations - 1].after_score - iterationResults[0].before_score;
    const improvements = iterationResults.map(r => r.improvement);
    const successfulIterations = improvements.filter(i => i > 0).length;
    const successRate = successfulIterations / totalIterations;
    const avgImprovement = improvements.reduce((a, b) => a + b, 0) / totalIterations;

    const trend = this.analyzeImprovementTrend(improvements);
    const best = this.findBestIteration(iterationResults);
    const worst = this.findWorstIteration(iterationResults);
    const diagnostics = this.generateDiagnostics(iterationResults, trend, successRate, avgImprovement);

    return {
      summary: { totalIterations, totalImprovement, successRate, avgImprovement },
      trend,
      best, worst,
      diagnostics,
    };
  },

  // 趋势分析
  analyzeImprovementTrend(improvements){
    if(improvements.length < 2) return { direction: 'insufficient_data', consistency: 0 };

    const positive = improvements.filter(i => i > 0).length;
    const negative = improvements.filter(i => i < 0).length;
    const positiveRate = positive / improvements.length;

    let direction;
    if(positive === improvements.length) direction = 'improving';
    else if(negative === improvements.length) direction = 'declining';
    else if(positiveRate >= 0.7) direction = 'mostly_improving';
    else if(positiveRate < 0.3) direction = 'mostly_declining';
    else direction = 'fluctuating';

    // 递减趋势检测
    let declining = false;
    if(improvements.length >= 3){
      declining = improvements.slice(-3).every((v, i, arr) => i === 0 || v < arr[i - 1]);
    }

    const consistency = Math.abs(positiveRate - 0.5) * 2;

    return { direction, consistency, declining };
  },

  findBestIteration(results){
    return results.reduce((best, r) => r.improvement > best.improvement ? r : best);
  },

  findWorstIteration(results){
    return results.reduce((worst, r) => r.improvement < worst.improvement ? r : worst);
  },

  generateDiagnostics(results, trend, successRate, avgImprovement){
    const diagnostics = [];
    if(trend.declining) diagnostics.push('近3轮改进持续递减，可能已达到当前策略的改进上限');
    if(successRate < 0.3) diagnostics.push('迭代成功率低，建议调整重写策略或Prompt');
    if(avgImprovement < 2) diagnostics.push('平均改进幅度小，边际收益低');
    if(trend.direction === 'declining') diagnostics.push('质量持续下降，可能存在系统性问题');
    return diagnostics;
  },
};

// ============================================================
// AdaptiveDecisionEngine - 自适应决策引擎
// 对标参考项目 adaptive-decision-engine.js
// 权重计算+风险预测
// ============================================================
const AdaptiveDecisionEngine = {

  // 获取自适应权重
  getAdaptiveWeight(novel, decisionType){
    const stats = AgentDirectives.getOutcomeStats(novel);
    if(!stats || !stats[decisionType]) return 1.0;

    const typeStats = stats[decisionType];
    const baseWeight = 1.0;

    // 基于平均质量变化
    const changeFactor = 1 + (typeStats.avgChange || 0) / 10;
    // 基于改进成功率
    const rateFactor = 0.5 + (typeStats.effectiveness || 0.5);

    let weight = baseWeight * changeFactor * rateFactor;
    return Math.max(0.3, Math.min(1.5, weight));
  },

  // 决策：是否应该干预
  shouldDecide(novel, decisionType, currentScore, threshold){
    const weight = this.getAdaptiveWeight(novel, decisionType);
    const adjustedThreshold = threshold / weight;
    return currentScore < adjustedThreshold;
  },

  // 风险预测
  predictIssues(novel, chapIdx){
    const predictions = [];

    // 1. 质量下降风险
    const trend = TrendPredictor.analyze(novel, chapIdx);
    if(trend?.metrics?.quality_score){
      const qs = trend.metrics.quality_score;
      if(qs.slope < -0.5 && qs.confidence > 0.6){
        predictions.push({
          type: 'quality_decline',
          severity: this.classifySeverity(qs.slope),
          message: `质量分呈下降趋势（斜率${qs.slope.toFixed(2)}），预计下章${qs.predicted.toFixed(1)}分`,
        });
      }
    }

    // 2. 情绪密度不足
    if(trend?.metrics?.emotion_score){
      const es = trend.metrics.emotion_score;
      const recent = novel.chapters?.slice(-5) || [];
      const belowCount = recent.filter(c => c.score?.scores?.engagement < 50).length;
      if(belowCount >= 3){
        predictions.push({
          type: 'emotion_deficit',
          severity: belowCount >= 5 ? 'high' : 'medium',
          message: `近${belowCount}章情绪密度不足，建议安排情感爆发点`,
        });
      }
    }

    // 3. 伏笔堆积
    const m = novel.memory;
    if(m?.foreshadowing){
      const overdue = m.foreshadowing.filter(f => f.status === 'overdue').length;
      if(overdue > 0){
        predictions.push({
          type: 'foreshadowing_accumulation',
          severity: overdue >= 3 ? 'high' : 'medium',
          message: `${overdue}个伏笔已逾期未回收，建议优先处理`,
        });
      }
    }

    // 4. 爽点饥饿
    if(trend?.metrics?.cool_point_density){
      const cpd = trend.metrics.cool_point_density;
      const recent = novel.chapters?.slice(-5) || [];
      const noCoolPoint = recent.filter(c => !c.score?.scores?.engagement || c.score.scores.engagement <= 50).length;
      const hunger = noCoolPoint / 5;
      if(hunger >= 0.9){
        predictions.push({
          type: 'coolpoint_starvation',
          severity: 'high',
          message: '已连续多章无爽点，读者疲劳风险高，必须安排爽点',
        });
      }
    }

    return predictions;
  },

  // 严重度分级
  classifySeverity(slope){
    if(slope < -2) return 'critical';
    if(slope < -1) return 'high';
    if(slope < -0.5) return 'medium';
    return 'low';
  },

  // R²计算（线性回归拟合优度）
  calculateRSquared(values){
    const n = values.length;
    if(n < 3) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const slope = TrendPredictor.calculateSlope(values);
    let ssResidual = 0, ssTotal = 0;
    for(let i = 0; i < n; i++){
      const predicted = mean + slope * (i - (n - 1) / 2);
      ssResidual += (values[i] - predicted) ** 2;
      ssTotal += (values[i] - mean) ** 2;
    }
    return ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;
  },

  // ===== v4 计划补全方法 =====

  // 获取指令效果统计 — 对标 Reference-php getOutcomeStats()
  getOutcomeStats(novel, decisionType){
    const stats = AgentDirectives.getOutcomeStats(novel);
    if(!decisionType) return stats;
    return stats?.[decisionType] || null;
  },

  // 获取指标趋势 — 对标 Reference-php getMetricTrend()
  getMetricTrend(novel, chapIdx, metricName){
    const trend = TrendPredictor.analyze(novel, chapIdx);
    if(!trend?.metrics?.[metricName]) return null;
    return trend.metrics[metricName];
  },

  // 线性回归 — 对标 Reference-php linearRegression()
  // 返回 { slope, intercept, r2 }
  linearRegression(values){
    const n = values.length;
    if(n < 2) return { slope: 0, intercept: 0, r2: 0 };
    const xs = values.map((_, i) => i);
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = values.reduce((a, b) => a + b, 0) / n;
    let num = 0, denX = 0, denY = 0;
    for(let i = 0; i < n; i++){
      num += (xs[i] - meanX) * (values[i] - meanY);
      denX += (xs[i] - meanX) ** 2;
      denY += (values[i] - meanY) ** 2;
    }
    const slope = denX === 0 ? 0 : num / denX;
    const intercept = meanY - slope * meanX;
    const r2 = denX === 0 || denY === 0 ? 0 : (num ** 2) / (denX * denY);
    return { slope: Math.round(slope * 1000) / 1000, intercept: Math.round(intercept * 1000) / 1000, r2: Math.round(r2 * 1000) / 1000 };
  },

  // 生成专家建议 — 对标 Reference-php generateExpertAdvice()
  generateExpertAdvice(predictions){
    if(!predictions || predictions.length === 0) return '当前无风险预警，保持现有策略。';
    const advice = [];
    for(const p of predictions){
      if(p.severity === 'critical' || p.severity === 'high'){
        advice.push(`【紧急】${p.message}`);
      } else if(p.severity === 'medium'){
        advice.push(`【建议】${p.message}`);
      }
    }
    return advice.length > 0 ? advice.join('\n') : '当前风险较低，保持关注即可。';
  },

  // 获取目标值 — 对标 Reference-php getTarget()
  getTarget(metricName, novel){
    const targets = {
      quality_score: 75,
      emotion_score: 60,
      cool_point_density: novel?.config?.coolPointDensity ? novel.config.coolPointDensity * 100 : 29,
      word_count_accuracy: 85,
    };
    return targets[metricName] || 70;
  },

  // 获取爽点饥饿度 — 对标 Reference-php getCoolPointHunger()
  // 从 predictIssues 中抽出为独立方法
  getCoolPointHunger(novel, chapIdx){
    const recent = novel.chapters?.slice(-5) || [];
    if(recent.length === 0) return 0;
    const noCoolPoint = recent.filter(c => !c.score?.scores?.engagement || c.score.scores.engagement <= 50).length;
    return Math.round(noCoolPoint / 5 * 100) / 100;
  },

  // 获取伏笔风险 — 对标 Reference-php getForeshadowingRisk()
  // 从 predictIssues 中抽出为独立方法
  getForeshadowingRisk(novel){
    const m = novel.memory;
    if(!m?.foreshadowing) return { level: 'none', overdue: 0 };
    const overdue = m.foreshadowing.filter(f => f.status === 'overdue').length;
    const pending = m.foreshadowing.filter(f => f.status === 'planted').length;
    const level = overdue >= 3 ? 'high' : overdue >= 1 ? 'medium' : pending > 5 ? 'low' : 'none';
    return { level, overdue, pending };
  },

  // 趋势摘要 — 对标 Reference-php getTrendSummary()
  getTrendSummary(novel, chapIdx){
    const trend = TrendPredictor.analyze(novel, chapIdx);
    if(!trend) return { summary: '数据不足', metrics: {} };
    const summaries = [];
    const metrics = {};
    for(const [name, data] of Object.entries(trend.metrics || {})){
      const status = data.status || 'unknown';
      const current = data.current?.toFixed(1) || 'N/A';
      const target = data.target?.toFixed(1) || 'N/A';
      metrics[name] = { status, current, target, slope: data.slope };
      const labels = { quality_score: '质量分', emotion_score: '情感分', cool_point_density: '爽点密度', word_count_accuracy: '字数准确度' };
      summaries.push(`${labels[name] || name}: ${current}/${target} (${status})`);
    }
    return { summary: summaries.join(' | '), metrics };
  },
};

window.TrendPredictor = TrendPredictor;
window.PlotPatternDetector = PlotPatternDetector;
window.ImprovementEvaluator = ImprovementEvaluator;
window.AdaptiveDecisionEngine = AdaptiveDecisionEngine;
