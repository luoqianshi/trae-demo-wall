// match.js — 匹配打分（纯函数，无副作用，不依赖 AI / DOM）
//
// 经典脚本版（非 ES Module），双击 index.html 直接可用，不需要本地服务器。
// 公共 API 挂到 window.CosLens 命名空间。
//
// 匹配维度（AI 输出 与 商品库 用同一套档位，否则匹配失真）:
//   瞳色主色: 颜色名                 (分类，非有序，带近似色组)
//   显色度  : 低 / 中 / 高           (有序)
//   直径    : 小 / 中 / 大           (有序)
//   风格    : 自然 / 混血 / 二次元    (有序)
(function () {
  'use strict';

  const ORDERED_SCALES = {
    显色度: ['低', '中', '高'],
    直径: ['小', '中', '大'],
    风格: ['自然', '混血', '二次元'],
  };

  // 字段基础权重（瞳色主色最高；总和为 1）
  const FIELD_WEIGHTS = {
    瞳色主色: 0.40,
    显色度: 0.25,
    直径: 0.20,
    风格: 0.15,
  };

  // 低置信降权：confidence < 阈值 的字段，权重 ×0.3，避免 AI 瞎猜拖垮推荐
  const CONFIDENCE_THRESHOLD = 0.5;
  const LOW_CONF_FACTOR = 0.3;

  // 近似色组：组内不同色给半分（视觉相邻/常见跨色）。
  const COLOR_GROUPS = [
    ['蓝', '青', '紫', '灰'],
    ['绿', '青', '蓝'],
    ['紫', '蓝', '粉'],
    ['棕', '金', '黄', '橙'],
    ['红', '粉', '橙'],
    ['灰', '蓝', '棕'],
    ['金', '黄', '棕'],
  ];

  function colorScore(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    for (const group of COLOR_GROUPS) {
      if (group.includes(a) && group.includes(b)) return 0.5;
    }
    return 0;
  }

  // 有序档位：相同=1，相邻=0.5，差两档=0
  function orderedScore(field, a, b) {
    const scale = ORDERED_SCALES[field];
    const ia = scale.indexOf(a);
    const ib = scale.indexOf(b);
    if (ia === -1 || ib === -1) return 0;
    const dist = Math.abs(ia - ib);
    const s = 1 - dist / (scale.length - 1);
    return s < 0 ? 0 : s;
  }

  function fieldScore(field, featureValue, productValue) {
    if (field === '瞳色主色') return colorScore(featureValue, productValue);
    return orderedScore(field, featureValue, productValue);
  }

  // features: { 直径:{value,confidence}, ... }  或  { 直径:"大", ... }（兼容纯值）
  function readFeature(features, field) {
    const raw = features[field];
    if (raw == null) return { value: null, confidence: 1 };
    if (typeof raw === 'object') {
      return { value: raw.value ?? null, confidence: raw.confidence ?? 1 };
    }
    return { value: raw, confidence: 1 };
  }

  // 对单个商品打分，返回 0~100 及各字段明细
  function scoreProduct(features, product) {
    let weightedSum = 0;
    let totalWeight = 0;
    const breakdown = [];

    for (const field of Object.keys(FIELD_WEIGHTS)) {
      const { value, confidence } = readFeature(features, field);
      let weight = FIELD_WEIGHTS[field];
      const lowConf = confidence < CONFIDENCE_THRESHOLD;
      if (lowConf) weight *= LOW_CONF_FACTOR;

      const s = fieldScore(field, value, product[field]);
      weightedSum += s * weight;
      totalWeight += weight;

      breakdown.push({
        field,
        featureValue: value,
        productValue: product[field] ?? null,
        score: s,
        weight,
        lowConf,
      });
    }

    const score = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
    return { score: Math.round(score), breakdown };
  }

  // 主入口：对商品库全量打分，降序取 topN
  function matchProducts(features, products, topN = 3) {
    return products
      .map((p) => ({ product: p, ...scoreProduct(features, p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }

  // 生成一句推荐理由（规则拼句，稳定不翻车）
  function buildReason(features, matched) {
    const hits = matched.breakdown
      .filter((b) => b.score >= 0.5 && b.featureValue)
      .sort((a, b) => b.score * b.weight - a.score * a.weight)
      .slice(0, 3)
      .map((b) => {
        if (b.field === '瞳色主色') return `瞳色偏${b.featureValue}`;
        if (b.field === '风格') return `${b.featureValue}风格`;
        return `${b.field}为${b.featureValue}`;
      });
    const desc = hits.length ? hits.join('、') : '整体风格接近';
    return `该角色${desc}，【${matched.product.name}】与之最匹配，可用于还原其眼神。`;
  }

  window.CosLens = window.CosLens || {};
  window.CosLens.scoreProduct = scoreProduct;
  window.CosLens.matchProducts = matchProducts;
  window.CosLens.buildReason = buildReason;
})();
