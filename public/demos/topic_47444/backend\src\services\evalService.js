/****************************
 * 见澄明后端 - 评测提交与报告服务
 * 完整流程：接收答卷 → TOO_FAST校验 → 计分 → 生成报告 → 入库
 ****************************/

import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database.js';
import { calculateScore } from './scoringService.js';
import {
  PORTRAIT_DATA,
  INDEX_DATA,
  SHADOW_DATA,
  DEEP_DIAG_DATA,
  PORTRAIT_ONE_LINER,
  getIndexText,
  getBarClass
} from './reportService.js';

/**
 * 从数据库加载题库
 * @param {string} evalType - 'fast' | 'standard'
 * @returns {Promise<Array>} 题目数组
 */
export async function loadQuestions(evalType) {
  const result = await query(
    `SELECT question_id AS id, type, layout, title, subtitle, question,
            options, cross_note, design_note
     FROM questions
     WHERE eval_type = $1
     ORDER BY question_index ASC`,
    [evalType]
  );
  return result.rows.map(row => ({
    id: row.id,
    type: row.type,
    layout: row.layout,
    title: row.title,
    subtitle: row.subtitle,
    question: row.question,
    options: row.options || [],
    crossNote: row.cross_note,
    designNote: row.design_note
  }));
}

/**
 * 生成完整报告JSON
 * @param {Object} scoreResult - 计分引擎输出
 * @returns {Object} 报告JSON
 */
export function buildReportJson(scoreResult) {
  const { threeAxes, portrait, shadow, fiveIndices, deepDiag, consistency, tooFast, raw } = scoreResult;

  const portraitData = PORTRAIT_DATA[portrait] || PORTRAIT_DATA['BBB'];
  const shadowData = SHADOW_DATA[shadow.mainShadow] || SHADOW_DATA['null'];

  return {
    summary: {
      portraitCode: portrait,
      portraitName: portraitData.name,
      oneLiner: PORTRAIT_ONE_LINER[portrait] || '',
      seWarning: threeAxes.seWarning || false,
      tooFast: tooFast.flagged || false
    },
    threeAxes: {
      jianCha: {
        score: threeAxes.jianCha,
        raw: raw.jianCha,
        label: '见察力',
        desc: '穿透世界噪音的能力'
      },
      chengXing: {
        score: threeAxes.chengXing,
        raw: raw.chengXing,
        label: '澄形力',
        desc: '看清自己模式的能力'
      },
      mingDing: {
        score: threeAxes.mingDing,
        raw: raw.mingDing,
        label: '明定力',
        desc: '把洞察变成行动的能力'
      }
    },
    portrait: {
      code: portrait,
      ...portraitData
    },
    fiveIndices: {
      aiUse: {
        score: fiveIndices.aiUse,
        ...getIndexText('aiUse', fiveIndices.aiUse),
        barClass: getBarClass(fiveIndices.aiUse, false)
      },
      aiRisk: {
        score: fiveIndices.aiRisk,
        ...getIndexText('aiRisk', fiveIndices.aiRisk),
        barClass: getBarClass(fiveIndices.aiRisk, true),
        feedingText: INDEX_DATA.aiRisk.feedingText
      },
      socialUse: {
        score: fiveIndices.socialUse,
        ...getIndexText('socialUse', fiveIndices.socialUse),
        barClass: getBarClass(fiveIndices.socialUse, false)
      },
      socialRisk: {
        score: fiveIndices.socialRisk,
        ...getIndexText('socialRisk', fiveIndices.socialRisk),
        barClass: getBarClass(fiveIndices.socialRisk, true)
      },
      survival: {
        score: fiveIndices.survival,
        ...getIndexText('survival', fiveIndices.survival),
        barClass: getBarClass(fiveIndices.survival, false)
      }
    },
    shadow: {
      mainShadow: shadow.mainShadow,
      shadowMode: shadow.shadowMode,
      ...shadowData,
      counts: shadow.counts
    },
    deepDiag: deepDiag.map(d => ({
      type: d.type,
      title: d.title,
      text: d.text
    })),
    consistency: {
      ...consistency,
      checked: consistency.checked
    },
    raw
  };
}

/**
 * 评测提交完整流程
 * @param {string} userId - 用户ID
 * @param {string} evalType - 'fast' | 'standard'
 * @param {Object} answers - {questionId: optionId}
 * @param {number} duration - 答题耗时（毫秒）
 * @returns {Promise<Object>} 提交结果
 */
export async function submitEvaluation(userId, evalType, answers, duration) {
  // 1. 基础校验
  if (!userId || !evalType || !answers || typeof answers !== 'object') {
    throw new Error('INVALID_PARAMS');
  }

  const validTypes = ['fast', 'standard'];
  if (!validTypes.includes(evalType)) {
    throw new Error('INVALID_EVAL_TYPE');
  }

  // 2. TOO_FAST 校验（前置拦截）
  const minDuration = evalType === 'standard' ? 180000 : 60000;
  if (duration < minDuration) {
    const err = new Error('TOO_FAST');
    err.code = 'TOO_FAST';
    err.elapsedSec = Math.round(duration / 1000);
    err.thresholdSec = minDuration / 1000;
    throw err;
  }

  // 3. 加载题库
  const questions = await loadQuestions(evalType);
  if (questions.length === 0) {
    throw new Error('QUESTIONS_NOT_FOUND');
  }

  // 4. 计分
  const scoreResult = calculateScore(answers, questions, evalType, duration);

  // 5. 生成报告JSON
  const reportJson = buildReportJson(scoreResult);

  // 6. 生成评测ID
  const evalId = 'eval_' + uuidv4().replace(/-/g, '').substring(0, 16);

  // 7. 入库（evaluations + report_cache）
  await transaction(async (client) => {
    const { threeAxes, portrait, shadow, fiveIndices, deepDiag, consistency, raw } = scoreResult;

    await client.query(
      `INSERT INTO evaluations (
        eval_id, user_id, eval_type, total_duration_ms,
        answers,
        norm_scores,
        jiancha_raw, jiancha_final,
        chengxing_raw, chengxing_final,
        mingding_raw, mingding_final,
        se_score, se_flagged,
        cc_offset_level, cc_flagged,
        five_indices,
        shadow,
        cross_judgments,
        portrait,
        consistency,
        deep_diagnosis,
        training_recommendation,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW())`,
      [
        evalId,
        userId,
        evalType,
        duration,
        JSON.stringify(answers),
        JSON.stringify({
          jianCha: threeAxes.jianCha,
          chengXing: threeAxes.chengXing,
          mingDing: threeAxes.mingDing
        }),
        raw.jianCha,
        threeAxes.jianCha,
        raw.chengXing,
        threeAxes.chengXing,
        raw.mingDing,
        threeAxes.mingDing,
        raw.se,
        threeAxes.seWarning || false,
        consistency.offset || 0,
        !(consistency.stable ?? true),
        JSON.stringify(fiveIndices),
        JSON.stringify({
          mainShadow: shadow.mainShadow,
          shadowMode: shadow.shadowMode,
          counts: shadow.counts
        }),
        JSON.stringify({
          feedingRisk: scoreResult.crossFlags?.feedingRisk || false,
          calibrationCheck: scoreResult.crossFlags?.calibrationCheck || false,
          driveShadowAlignment: scoreResult.crossFlags?.driveShadowAlignment || false,
          overlapDetection: scoreResult.crossFlags?.overlapDetection || false
        }),
        JSON.stringify({
          code: portrait,
          name: (PORTRAIT_DATA[portrait] || PORTRAIT_DATA['BBB']).name
        }),
        JSON.stringify(consistency),
        JSON.stringify(deepDiag),
        JSON.stringify({ portrait })
      ]
    );

    await client.query(
      `INSERT INTO report_cache (report_id, eval_id, report_json, expires_at, created_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '30 days', NOW())`,
      [
        'rpt_' + uuidv4().replace(/-/g, '').substring(0, 16),
        evalId,
        JSON.stringify(reportJson)
      ]
    );
  });

  return {
    success: true,
    evalId,
    report: reportJson,
    message: '评测提交成功'
  };
}
