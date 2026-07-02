/****************************
 * 见澄明后端 - 计分引擎 v4.1
 * 从 H5 scoring.js 迁移到 Node.js ES Module
 * 功能完全一致：
 *   原始分采集 → 归一化 → 效度修正(SE两档) → 画像查表(70分阈值)
 *   → 遮蔽判定 → 五指数计算 → 交叉判定 → 一致性校验 → TOO_FAST
 ****************************/

import { DEEP_DIAG_DATA } from './reportService.js';

export class CJIScorer {
  /**
   * @param {Object} answers - {questionId: optionId}
   * @param {Array} questions - 题目数组
   * @param {string} mode - 'fast' | 'standard'
   * @param {number} elapsedMs - 答题耗时（毫秒）
   */
  constructor(answers, questions, mode = 'fast', elapsedMs = 0) {
    this.answers = answers;
    this.questions = questions;
    this.mode = mode;
    this.elapsedMs = elapsedMs;
    this.rawScores = {
      jianCha: 0, chengXing: 0, mingDing: 0,
      aiUse: 0, aiRisk: 0,
      socialUse: 0, socialVulnerability: 0,
      se: 0
    };
    this.shadowCounts = { lazy: 0, fear: 0, profit: 0, bind: 0 };
    this.crossFlags = {
      feedingRisk: false,
      calibrationCheck: false,
      driveShadowAlignment: false,
      overlapDetection: false
    };
    this.firstQuestionSignal = null;
    this.consistencySignal = null;
    this.maxScores = {};
    this._computeMaxScores();
  }

  // === 预计算各轴理论满分（遍历题库） ===
  _computeMaxScores() {
    const axes = ['jianCha', 'chengXing', 'mingDing', 'aiUse', 'aiRisk', 'socialUse', 'socialVulnerability', 'se'];
    this.maxScores = {};
    for (const axis of axes) {
      let total = 0;
      for (const q of this.questions) {
        let maxForQ = 0;
        for (const opt of q.options) {
          const val = (opt.scores || {})[axis] || 0;
          if (val > maxForQ) maxForQ = val;
        }
        total += maxForQ;
      }
      this.maxScores[axis] = total || 1;
    }
  }

  // 主入口
  calculate() {
    this._collectRawScores();
    const normalized = this._normalize();
    const validity = this._validityCheck(normalized);
    const portrait = this._getPortrait(validity.jianCha, validity.chengXing, validity.mingDing);
    const shadow = this._analyzeShadow();
    const fiveIndices = this._calculateFiveIndices(validity, portrait);
    const deepDiag = this._deepDiagnosis(shadow);
    const consistency = this._checkConsistency();
    const tooFast = this._checkTooFast();

    return {
      threeAxes: validity,
      portrait: portrait,
      shadow: shadow,
      fiveIndices: fiveIndices,
      deepDiag: deepDiag,
      consistency: consistency,
      tooFast: tooFast,
      crossFlags: this.crossFlags,
      raw: this.rawScores
    };
  }

  // 1. 原始分采集
  _collectRawScores() {
    let firstSituationalFound = false;

    for (const q of this.questions) {
      const selectedId = this.answers[q.id];
      if (!selectedId) continue;

      // 排序题答案格式是逗号分隔的ID列表，特殊处理
      let opt;
      if (q.layout === 'sort' && typeof selectedId === 'string' && selectedId.includes(',')) {
        const firstId = selectedId.split(',')[0];
        opt = q.options.find(o => o.id === firstId);
      } else {
        opt = q.options.find(o => o.id === selectedId);
      }
      if (!opt) continue;
      const s = opt.scores || {};

      // 三轴分
      if (s.jianCha) this.rawScores.jianCha += s.jianCha;
      if (s.chengXing) this.rawScores.chengXing += s.chengXing;
      if (s.mingDing) this.rawScores.mingDing += s.mingDing;

      // 五指数
      if (s.aiUse) this.rawScores.aiUse += s.aiUse;
      if (s.aiRisk) this.rawScores.aiRisk += s.aiRisk;
      if (s.socialUse) this.rawScores.socialUse += s.socialUse;
      if (s.socialVulnerability) this.rawScores.socialVulnerability += s.socialVulnerability;
      if (s.se) this.rawScores.se += s.se;

      // 遮蔽信号
      if (s.shadowType && this.shadowCounts[s.shadowType] !== undefined) {
        this.shadowCounts[s.shadowType]++;
      }

      // --- 交叉判定标记 ---

      // 投喂型风险：选了C或D（接受AI确认而不质疑）
      if (q.crossNote === 'feedingRisk' && (opt.id === 'C' || opt.id === 'D')) {
        this.crossFlags.feedingRisk = true;
      }

      // 校准偏差：选了C或D（不验证成功归因）
      if (q.crossNote === 'calibrationCheck' && (opt.id === 'C' || opt.id === 'D')) {
        this.crossFlags.calibrationCheck = true;
      }

      // 驱动-遮蔽一致性：crossJudge题为driveShadowAlignment
      if (q.crossNote === 'driveShadowAlignment' && (opt.id === 'C' || opt.id === 'D')) {
        this.crossFlags.driveShadowAlignment = true;
      }

      // 叠合遮蔽：crossJudge题为overlapDetection
      if (q.crossNote === 'overlapDetection' && (opt.id === 'C' || opt.id === 'D')) {
        this.crossFlags.overlapDetection = true;
      }

      // 记录第一道情境题的信号（用于一致性校验基线）
      if (!firstSituationalFound && (q.type === 'situational' || q.type === 'whatIf')) {
        this.firstQuestionSignal = opt.id;
        firstSituationalFound = true;
      }

      // 记录对照校验题的信号
      if (q.type === 'consistency') {
        this.consistencySignal = opt.mappedSignal || opt.id;
      }
    }
  }

  // 2. 归一化（基于题库动态计算满分）
  _normalize() {
    const m = this.maxScores;
    return {
      jianCha: Math.round(Math.min((this.rawScores.jianCha / m.jianCha) * 100, 100)),
      chengXing: Math.round(Math.min((this.rawScores.chengXing / m.chengXing) * 100, 100)),
      mingDing: Math.round(Math.min((this.rawScores.mingDing / m.mingDing) * 100, 100))
    };
  }

  // 3. 效度修正（SE两档惩罚）
  _validityCheck(normalized) {
    let jianCha = normalized.jianCha;
    let chengXing = normalized.chengXing;
    let mingDing = normalized.mingDing;
    let seWarning = false;

    if (this.rawScores.se >= 5) {
      jianCha = Math.round(jianCha * 0.8);
      chengXing = Math.round(chengXing * 0.8);
      mingDing = Math.round(mingDing * 0.8);
      seWarning = true;
    } else if (this.rawScores.se >= 4) {
      jianCha = Math.round(jianCha * 0.9);
      chengXing = Math.round(chengXing * 0.9);
      mingDing = Math.round(mingDing * 0.9);
    }

    return { jianCha, chengXing, mingDing, seWarning };
  }

  // 4. 画像查表（70分阈值二分法）
  _getPortrait(j, c, m) {
    return (j >= 70 ? 'A' : 'B') + (c >= 70 ? 'A' : 'B') + (m >= 70 ? 'A' : 'B');
  }

  // 5. 遮蔽判定
  _analyzeShadow() {
    const counts = this.shadowCounts;
    let mainShadow = null;
    let maxCount = 0;
    let totalShadows = 0;

    for (const [type, count] of Object.entries(counts)) {
      totalShadows += count;
      if (count > maxCount) { maxCount = count; mainShadow = type; }
    }

    if (maxCount <= 1) mainShadow = 'null';

    const sigTypes = Object.values(counts).filter(c => c >= 2).length;
    const shadowMode = sigTypes >= 2 ? 'compound'
      : (maxCount >= 2 ? 'single' : 'null');

    return {
      mainShadow,
      shadowMode,
      counts: { ...counts },
      totalShadows
    };
  }

  // 6. 五指数计算
  _calculateFiveIndices(axes, portrait) {
    const m = this.maxScores;

    const aiUseScore = Math.min(Math.round(
      (this.rawScores.aiUse / (m.aiUse || 1)) * 70 + (axes.jianCha / 100) * 30
    ), 100);

    const aiRiskScore = Math.min(Math.round(
      (this.rawScores.aiRisk / (m.aiRisk || 1)) * 70 + ((100 - axes.chengXing) / 100) * 30
    ), 100);

    const socialUseScore = Math.min(Math.round(
      (this.rawScores.socialUse / (m.socialUse || 1)) * 70 + (axes.mingDing / 100) * 30
    ), 100);

    const socialRiskScore = Math.min(Math.round(
      (this.rawScores.socialVulnerability / (m.socialVulnerability || 1)) * 70 + ((100 - axes.jianCha) / 100) * 30
    ), 100);

    const survival = Math.round(
      aiUseScore * 0.30 +
      (100 - aiRiskScore) * 0.25 +
      socialUseScore * 0.25 +
      (100 - socialRiskScore) * 0.20
    );

    return {
      aiUse: aiUseScore,
      aiRisk: aiRiskScore,
      socialUse: socialUseScore,
      socialRisk: socialRiskScore,
      survival: survival
    };
  }

  // 7. 深度诊断（四交叉判定）
  _deepDiagnosis(shadow) {
    const results = [];

    if (this.crossFlags.feedingRisk) {
      results.push({ type: 'feedingRisk', ...DEEP_DIAG_DATA.feedingRisk });
    }

    if (this.crossFlags.driveShadowAlignment && shadow.mainShadow !== 'null' && shadow.shadowMode !== 'null') {
      results.push({ type: 'driveShadowAlignment', ...DEEP_DIAG_DATA.driveShadowAlignment });
    }

    if (this.crossFlags.overlapDetection) {
      const axes = [this.rawScores.jianCha, this.rawScores.chengXing, this.rawScores.mingDing];
      const maxAxis = Math.max(...axes);
      const minAxis = Math.min(...axes);
      const normalizedDiff = maxAxis > 0 ? ((maxAxis - minAxis) / maxAxis) : 1;
      if (normalizedDiff < 0.15 || shadow.shadowMode === 'compound') {
        results.push({ type: 'overlapDetection', ...DEEP_DIAG_DATA.overlapDetection });
      }
    }

    if (this.crossFlags.calibrationCheck) {
      results.push({ type: 'calibrationCheck', ...DEEP_DIAG_DATA.calibrationCheck });
    }

    return results;
  }

  // 8. 一致性校验（增强版：动态识别基线题）
  _checkConsistency() {
    if (!this.firstQuestionSignal || !this.consistencySignal) {
      return { stable: true, offset: 0, checked: false };
    }

    const firstQ = this.questions.find(q => q.type === 'situational' || q.type === 'whatIf');
    let firstSignal = 'unknown';
    if (firstQ) {
      const opt = firstQ.options.find(o => o.id === this.firstQuestionSignal);
      if (opt) {
        if (opt.id === 'A') firstSignal = 'observe';
        else if (opt.id === 'B') firstSignal = 'reflect';
        else if (opt.id === 'C') firstSignal = 'act';
        else firstSignal = 'avoid';
      }
    }

    let offset = 0;
    const cs = this.consistencySignal;
    if (cs === 'change') offset = 3;
    else if (cs === 'adjust' && firstSignal !== 'act') offset = 1;
    else if (cs === 'same') offset = 0;
    else if (cs !== firstSignal) offset = 2;

    return { stable: offset < 2, offset, checked: true };
  }

  // 9. TOO_FAST校验
  _checkTooFast() {
    if (!this.elapsedMs || this.elapsedMs <= 0) return { flagged: false };
    const threshold = this.mode === 'fast' ? 60000 : 180000;
    const flagged = this.elapsedMs < threshold;
    return {
      flagged,
      elapsedSec: Math.round(this.elapsedMs / 1000),
      thresholdSec: threshold / 1000
    };
  }
}

/**
 * 便捷函数：直接计算得分
 * @param {Object} answers
 * @param {Array} questions
 * @param {string} mode
 * @param {number} elapsedMs
 * @returns {Object} 完整结果对象
 */
export function calculateScore(answers, questions, mode = 'fast', elapsedMs = 0) {
  const scorer = new CJIScorer(answers, questions, mode, elapsedMs);
  return scorer.calculate();
}
