/**
 * draw.js · 抽卡核心算法
 *   weightedSample / inHourWindow / notDisabled / drawCards
 *   保底：state.pity 记录自上次 SSR 后累计已抽张数，达到 PITY_THRESHOLD 时强制出 SSR
 */
import { CARD_POOL, RARITY_WEIGHT } from '../data/cards.js';
import { state } from './state.js';

/** 保底阈值：连续 PITY_THRESHOLD 张未出 SSR，则本次必出一张 SSR */
export const PITY_THRESHOLD = 28;

/** 加权不放回抽样 · 二段式
 *  step1: 按 RARITY_WEIGHT 在"还有卡的稀有度桶"里选一档（保持 65/25/8/2 的稀有度命中率）
 *  step2: 该桶内等权抽一张 —— 同稀有度的每张卡概率相等，不会因为某稀有度卡多而被稀释
 */
export function weightedSample(candidates, n) {
  const buckets = { n: [], r: [], sr: [], ssr: [] };
  for (const c of candidates) (buckets[c.rarity] || (buckets[c.rarity] = [])).push(c);
  const picked = [];
  for (let i = 0; i < n; i++) {
    const aliveRarities = Object.keys(buckets).filter(k => buckets[k].length > 0);
    if (aliveRarities.length === 0) break;
    const weights = aliveRarities.map(k => RARITY_WEIGHT[k] || 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let rarity = aliveRarities[0];
    for (let j = 0; j < weights.length; j++) {
      r -= weights[j];
      if (r <= 0) { rarity = aliveRarities[j]; break; }
    }
    const bucket = buckets[rarity];
    const idx = Math.floor(Math.random() * bucket.length);
    picked.push(bucket[idx]);
    bucket.splice(idx, 1);
  }
  return picked;
}

/** 判断卡牌是否在饭点窗口（无 hourRange 则永远可用） */
export function inHourWindow(card, now = new Date()) {
  if (!card.hourRange || !card.hourRange.length) return true;
  if (state.settings && state.settings.hourLimit === false) return true;
  const h = now.getHours() + now.getMinutes() / 60;
  return card.hourRange.some(([s, e]) => h >= s && h < e);
}

/** 用户禁用的标签：卡牌全部 tag 都被禁用 → 排除 */
export function notDisabled(card) {
  const off = (state.settings && state.settings.disabledTags) || [];
  if (off.length === 0) return true;
  return !card.tags.every(t => off.includes(t));
}

/** 抽卡主流程：过滤 → 加权抽 3 张 → 保底校正 */
export function drawCards(moods) {
  const availablePool = CARD_POOL.filter(c => inHourWindow(c) && notDisabled(c));
  let candidates = availablePool.filter(c => c.tags.some(t => moods.includes(t)));
  if (candidates.length < 3) candidates = availablePool.slice();
  if (candidates.length < 3) candidates = CARD_POOL.slice(); // 兜底

  const picked = weightedSample(candidates, 3);

  if (typeof state.pity !== 'number') state.pity = 0;
  const hasSSR = picked.some(c => c.rarity === 'ssr');

  if (!hasSSR && state.pity + picked.length >= PITY_THRESHOLD) {
    // 触发保底：优先用候选池里的 SSR，没有再回退到全局可用池
    let ssrPool = candidates.filter(c => c.rarity === 'ssr' && !picked.includes(c));
    if (ssrPool.length === 0) {
      ssrPool = availablePool.filter(c => c.rarity === 'ssr' && !picked.includes(c));
    }
    if (ssrPool.length === 0) {
      ssrPool = CARD_POOL.filter(c => c.rarity === 'ssr' && !picked.includes(c));
    }
    if (ssrPool.length > 0) {
      const forced = ssrPool[Math.floor(Math.random() * ssrPool.length)];
      // 替换稀有度最低的那张，保持视觉上"三连"完整
      const order = { n: 0, r: 1, sr: 2, ssr: 3 };
      let replaceIdx = 0;
      for (let i = 1; i < picked.length; i++) {
        if ((order[picked[i].rarity] ?? 0) < (order[picked[replaceIdx].rarity] ?? 0)) replaceIdx = i;
      }
      picked[replaceIdx] = forced;
      state.pity = 0;
      return picked;
    }
  }

  if (picked.some(c => c.rarity === 'ssr')) {
    state.pity = 0;
  } else {
    state.pity += picked.length;
  }
  return picked;
}
