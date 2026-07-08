/**
 * 政策通匹配引擎 - 移植自 apps/api/src/services/matchEngine.ts
 *
 * 浏览器端纯 JavaScript 实现，不依赖任何后端 API。
 * 通过 window.PolicyMateMatcher 暴露 API，不使用 ES modules。
 *
 * 移植说明：
 * - 移除 Prisma 依赖，政策数据由调用方传入（通常从 data/policies.json 加载）
 * - 保留 F-18 弱势群体/中央政策加权逻辑
 * - 保留 F-42 渐进式匹配（缺字段不参与扣分，仅降低 confidence）
 * - 保留原 calculateScore / generateReason / getRecommendations 的全部评分细节
 */
(function (global) {
  'use strict';

  // ============ 常量定义 ============

  /**
   * 弱势群体身份集合（F-18：覆盖 PRD 全部六类弱势群体）
   * 命中任意一类时，最终分数 ×1.1（上限 100）
   */
  const VULNERABLE_IDENTITIES = [
    '低收入家庭',
    '残疾人',
    '农民工',
    '老年人',
    '退役军人',
    '零就业家庭'
  ];

  // ============ 通用工具 ============

  /**
   * 安全读取字符串数组：过滤掉非字符串元素
   * @param {*} value 任意输入
   * @returns {string[]} 字符串数组
   */
  function toStringArray(value) {
    if (Array.isArray(value)) {
      return value.filter(function (v) { return typeof v === 'string'; });
    }
    return [];
  }

  // ============ 条件解析 ============

  /**
   * 解析 policy.conditions，提取 ageRange/identity/incomeRange/needType 四个数组
   * 与原 matchEngine.ts parseConditions 一致（浏览器端不需要 howToGet 字段透传，由调用方直接读取 policy.conditions）
   *
   * @param {Object} policy 政策对象
   * @returns {{ ageRange?: string[], identity?: string[], incomeRange?: string[], needType?: string[] }}
   */
  function parseConditions(policy) {
    const conditions = policy && policy.conditions;
    if (!conditions || typeof conditions !== 'object') return {};
    return {
      ageRange: Array.isArray(conditions.ageRange) ? conditions.ageRange : undefined,
      identity: Array.isArray(conditions.identity) ? conditions.identity : undefined,
      incomeRange: Array.isArray(conditions.incomeRange) ? conditions.incomeRange : undefined,
      needType: Array.isArray(conditions.needType) ? conditions.needType : undefined
    };
  }

  // ============ 分数计算 ============

  /**
   * 计算用户画像与某条政策的匹配分数
   * 完全移植自 matchEngine.ts 第 138-243 行
   *
   * 评分规则：
   * 1. 城市匹配（硬过滤）
   *    - profile.city 为空：所有政策视为「城市维度潜在匹配」（F-42 渐进式输入）
   *    - policy.city === '全国' 或 === profile.city：命中
   *    - 其他：硬过滤，返回 score=0
   * 2. 年龄段/身份/收入/需求：仅当用户填了对应字段且政策有对应条件时才参与计分
   *    用户未填的字段不参与扣分（避免空字段拖累整体分数）
   * 3. 基础分：totalTags<=1 时给 60，totalTags===0 时给 50，否则 (matchedTags/totalTags)*100
   * 4. 中央政策加权 ×1.05（上限 100）
   * 5. 弱势群体加权 ×1.1（上限 100）
   *
   * @param {Object} profile 用户画像
   * @param {Object} policy 政策对象
   * @returns {{ score: number, hitConditions: string[] }}
   */
  function calculateScore(profile, policy) {
    const hitConditions = [];
    let matchedTags = 0;
    let totalTags = 0;

    // ----- 城市匹配（中央政策 city="全国" 自动匹配）-----
    // F-42：profile.city 为空时（渐进式输入），不按城市硬过滤，全国政策+任意地方政策均参与排序
    if (!profile.city) {
      totalTags++;
      matchedTags++;
      hitConditions.push('city');
    } else if (policy.city === '全国' || policy.city === profile.city) {
      totalTags++;
      matchedTags++;
      hitConditions.push('city');
    } else {
      // 地方政策城市不匹配，硬过滤
      return { score: 0, hitConditions: [] };
    }

    const conditions = parseConditions(policy);

    // ----- 年龄段匹配 -----
    // F-42：profile.ageRange 为空时跳过，不参与扣分
    if (conditions.ageRange && conditions.ageRange.length > 0) {
      totalTags++;
      if (profile.ageRange && conditions.ageRange.indexOf(profile.ageRange) !== -1) {
        matchedTags++;
        hitConditions.push('ageRange');
      } else if (profile.ageRange) {
        // 用户填了但未命中：参与扣分（matchedTags 不动）
      }
      // 用户未填则不参与扣分：totalTags 回退
      if (!profile.ageRange) totalTags--;
    }

    // ----- 身份匹配 -----
    // 仅当用户填了 identity 数组时才参与计分
    if (conditions.identity && conditions.identity.length > 0) {
      if (profile.identity && profile.identity.length > 0) {
        totalTags++;
        const profileIdentities = toStringArray(profile.identity);
        const hasIdentityIntersection = conditions.identity.some(function (i) {
          return profileIdentities.indexOf(i) !== -1;
        });
        if (hasIdentityIntersection) {
          matchedTags++;
          hitConditions.push('identity');
        }
      }
      // profile.identity 为空：不参与扣分
    }

    // ----- 收入区间匹配 -----
    // 仅当用户填了 incomeRange 非空字符串时才参与计分
    if (conditions.incomeRange && conditions.incomeRange.length > 0) {
      if (profile.incomeRange && profile.incomeRange.trim() !== '') {
        totalTags++;
        if (conditions.incomeRange.indexOf(profile.incomeRange) !== -1) {
          matchedTags++;
          hitConditions.push('incomeRange');
        }
      }
      // profile.incomeRange 为空：不参与扣分
    }

    // ----- 需求类型匹配 -----
    // 仅当用户填了 needTypes 数组时才参与计分
    if (conditions.needType && conditions.needType.length > 0) {
      if (profile.needTypes && profile.needTypes.length > 0) {
        totalTags++;
        const profileNeedTypes = toStringArray(profile.needTypes);
        const hasNeedIntersection = conditions.needType.some(function (n) {
          return profileNeedTypes.indexOf(n) !== -1;
        });
        if (hasNeedIntersection) {
          matchedTags++;
          hitConditions.push('needType');
        }
      }
      // profile.needTypes 为空：不参与扣分
    }

    // ----- 计算最终分数 -----
    let score;
    if (totalTags === 1) {
      // 政策除城市外无其他条件，或所有条件都因用户未填而跳过：基础匹配分 60
      score = 60;
    } else if (totalTags === 0) {
      // 极端情况：所有维度都未填，仅给基础分
      score = 50;
    } else {
      score = (matchedTags / totalTags) * 100;
    }

    // ----- 中央政策加权（F-18：×1.05，上限 100）-----
    if (policy.level === '中央') {
      score = Math.min(100, score * 1.05);
    }

    // ----- 弱势群体加权（F-18：×1.1，上限 100）-----
    const vulnIdentities = toStringArray(profile.identity);
    const isVulnerable = vulnIdentities.some(function (i) {
      return VULNERABLE_IDENTITIES.indexOf(i) !== -1;
    });
    if (isVulnerable) {
      score = Math.min(100, score * 1.1);
    }

    return { score: Math.round(score), hitConditions: hitConditions };
  }

  // ============ 匹配理由生成 ============

  /**
   * 生成一句话匹配理由
   * 完全移植自 matchEngine.ts 第 246-302 行
   *
   * @param {Object} profile 用户画像
   * @param {Object} policy 政策对象
   * @returns {string} 人类可读的匹配理由
   */
  function generateReason(profile, policy) {
    const scoreResult = calculateScore(profile, policy);
    const score = scoreResult.score;
    const hitConditions = scoreResult.hitConditions;
    const parts = [];

    // 城市
    if (hitConditions.indexOf('city') !== -1) {
      if (policy.city === '全国') {
        parts.push('全国适用');
      } else {
        parts.push('适用于' + policy.city + '地区');
      }
    }

    // 年龄段
    if (hitConditions.indexOf('ageRange') !== -1) {
      parts.push(profile.ageRange + '年龄段');
    }

    // 身份
    if (hitConditions.indexOf('identity') !== -1) {
      const conditions1 = parseConditions(policy);
      const profileIdentities = toStringArray(profile.identity);
      const matchedIdentities = (conditions1.identity || []).filter(function (i) {
        return profileIdentities.indexOf(i) !== -1;
      });
      if (matchedIdentities.length > 0) {
        parts.push('符合' + matchedIdentities.join('、') + '身份');
      }
    }

    // 收入区间
    if (hitConditions.indexOf('incomeRange') !== -1) {
      parts.push(profile.incomeRange + '收入区间');
    }

    // 需求类型
    if (hitConditions.indexOf('needType') !== -1) {
      const conditions2 = parseConditions(policy);
      const profileNeedTypes = toStringArray(profile.needTypes);
      const matchedNeeds = (conditions2.needType || []).filter(function (n) {
        return profileNeedTypes.indexOf(n) !== -1;
      });
      if (matchedNeeds.length > 0) {
        parts.push('满足' + matchedNeeds.join('、') + '需求');
      }
    }

    // 兜底文案
    if (parts.length === 0) {
      if (policy.level === '中央') {
        return '该政策可能对您有帮助，中央政策，全国适用';
      }
      return '该政策可能对您有帮助';
    }

    // 中央政策在理由末尾追加「中央政策，全国适用」
    const centralSuffix = policy.level === '中央' ? '，中央政策，全国适用' : '';
    return '该政策' + parts.join('、') + '，与您的画像匹配度为' + score + '%' + centralSuffix;
  }

  // ============ 推荐政策 ============

  /**
   * 获取推荐政策：与已匹配政策同类别、且未出现在已匹配结果中的政策
   *
   * @param {Array} matchedItems 已匹配结果数组（元素为 { policy, score, reason } 或直接为 policy 对象）
   * @param {Array} allPolicies 全量政策数组
   * @returns {Array<{ policy: Object, reason: string }>} 推荐政策数组
   */
  function getRecommendations(matchedItems, allPolicies) {
    const existingIds = {};
    const matchedCategories = {};
    let i, item, policy;

    for (i = 0; i < matchedItems.length; i++) {
      item = matchedItems[i];
      policy = item.policy || item;
      existingIds[policy.id] = true;
      matchedCategories[policy.category] = true;
    }

    const recommendations = [];
    for (i = 0; i < allPolicies.length; i++) {
      policy = allPolicies[i];
      if (existingIds[policy.id]) continue;
      if (!matchedCategories[policy.category]) continue;
      recommendations.push({
        policy: policy,
        reason: '与您匹配的政策同属「' + policy.category + '」类别，您可能也感兴趣'
      });
    }
    return recommendations;
  }

  // ============ 画像完整度 ============

  /**
   * 计算画像已填写字段数（用于 confidence 评级）
   * 5 个核心字段：city / ageRange / incomeRange / identity / needTypes
   *
   * @param {Object} profile 用户画像
   * @returns {number} 已填写字段数（0-5）
   */
  function countFilledFields(profile) {
    let count = 0;
    if (profile.city && profile.city.trim() !== '') count++;
    if (profile.ageRange && profile.ageRange.trim() !== '') count++;
    if (profile.incomeRange && profile.incomeRange.trim() !== '') count++;
    if (profile.identity && profile.identity.length > 0) count++;
    if (profile.needTypes && profile.needTypes.length > 0) count++;
    return count;
  }

  /**
   * 根据已填写字段数计算置信度
   * F-42：high(5) / medium(3-4) / low(1-2)
   *
   * @param {number} filledFields 已填写字段数
   * @returns {'high'|'medium'|'low'} 置信度等级
   */
  function calcConfidence(filledFields) {
    if (filledFields >= 5) return 'high';
    if (filledFields >= 3) return 'medium';
    return 'low';
  }

  // ============ 主入口 ============

  /**
   * 主匹配函数：对全量政策计算分数，排序并生成推荐
   *
   * @param {Object} profile 用户画像
   * @param {Array} allPolicies 全量政策数组
   * @returns {{ total: number, results: Array, recommendations: Array, confidence: string, filledFields: number, totalFields: number }}
   */
  function matchPolicies(profile, allPolicies) {
    const matched = [];
    let i, policy, scoreResult;

    for (i = 0; i < allPolicies.length; i++) {
      policy = allPolicies[i];
      scoreResult = calculateScore(profile, policy);
      if (scoreResult.score > 0 && scoreResult.hitConditions.length > 0) {
        matched.push({
          policy: policy,
          score: scoreResult.score,
          reason: generateReason(profile, policy)
        });
      }
    }

    // 按分数降序，分数相同按 updatedAt 降序
    matched.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return (b.policy.updatedAt || '').localeCompare(a.policy.updatedAt || '');
    });

    const recommendations = getRecommendations(matched, allPolicies);
    const filledFields = countFilledFields(profile);
    const confidence = calcConfidence(filledFields);

    return {
      total: matched.length,
      results: matched,
      recommendations: recommendations,
      confidence: confidence,
      filledFields: filledFields,
      totalFields: 5
    };
  }

  // ============ 导出 ============

  global.PolicyMateMatcher = {
    matchPolicies: matchPolicies,
    calculateScore: calculateScore,
    generateReason: generateReason,
    getRecommendations: getRecommendations,
    countFilledFields: countFilledFields,
    calcConfidence: calcConfidence,
    parseConditions: parseConditions,
    VULNERABLE_IDENTITIES: VULNERABLE_IDENTITIES
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
