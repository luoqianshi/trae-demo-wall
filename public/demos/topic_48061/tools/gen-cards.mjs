#!/usr/bin/env node
/**
 * gen-cards.mjs · 一次性卡池扩充脚本
 *
 * 用法：
 *   node tools/gen-cards.mjs          # 生成草稿到 data/cards.generated.json
 *   node tools/gen-cards.mjs --merge  # 同时把草稿合并写回 data/cards.js
 *
 * 设计要点：
 *  1) 不依赖任何第三方包；只读 .env.local 拿 DEEPSEEK_API_KEY / AI_MODEL；
 *  2) 把 100 张需求拆 4 批（每批 25 张），降低 LLM 一次性出错率；
 *  3) 用强约束 system prompt 锁定字段、ID 命名、HP/dur 区间；
 *  4) 解析时做 schema + 去重校验，不合格自动重抽，最多 retry 3 次；
 *  5) 全程把已有 28 张卡的 id 当 ban list 送进上下文，避免撞名。
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CARDS_FILE = path.join(ROOT, 'data', 'cards.js');
const OUT_FILE = path.join(ROOT, 'data', 'cards.generated.json');
const ENV_FILE = path.join(ROOT, '.env.local');

/* =========================================================
 *  环境变量解析
 * ========================================================= */
async function loadEnv() {
  const txt = await readFile(ENV_FILE, 'utf8');
  const env = {};
  for (const line of txt.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

/* =========================================================
 *  读取已有 cards.js，拿到 ban list
 * ========================================================= */
async function loadExistingIds() {
  const txt = await readFile(CARDS_FILE, 'utf8');
  const ids = [];
  const re = /id:\s*'([a-zA-Z0-9_]+)'/g;
  let m;
  while ((m = re.exec(txt))) ids.push(m[1]);
  return ids;
}

/* =========================================================
 *  生成参数：每批 25 张 × 4 批 = 100
 * ========================================================= */
const BATCHES = [
  { batch: 1, n: 25, rarity: { n: 18, r: 5, sr: 2, ssr: 0 }, theme: 'body + eye + nourish 为主' },
  { batch: 2, n: 25, rarity: { n: 16, r: 7, sr: 2, ssr: 0 }, theme: 'mind + social + ritual 为主' },
  { batch: 3, n: 25, rarity: { n: 14, r: 8, sr: 3, ssr: 0 }, theme: 'reset + body + nourish 为主' },
  { batch: 4, n: 25, rarity: { n: 8, r: 7, sr: 4, ssr: 6 }, theme: 'mind + reset + 高级仪式（更多 SR/SSR）' },
];

/* =========================================================
 *  Prompt 构造
 * ========================================================= */
function buildPrompt(batch, banIds) {
  const distroLine = Object.entries(batch.rarity)
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => `${k.toUpperCase()} × ${v}`)
    .join(' / ');

  return `# 任务
你正在为一款"工位回血抽卡"应用扩充卡池。这是一个让打工人在工位上做 30 秒~3 分钟微小恢复动作的小游戏。

# 本批要求
- 本批生成 **${batch.n}** 张全新卡牌。
- 稀有度分布严格按：**${distroLine}**。
- 主题倾向：${batch.theme}。
- 不要生成任何"限时卡"（不要 hourRange 字段）。

# 字段 schema（严格遵守）
- id        : 英文小写下划线，3~16 字符，全局唯一，不能与下方"已用 ID"重复。
- name      : 中文 4~7 字，以"卡"字结尾。
- emoji     : 单个系统 emoji。
- rarity    : 'n' | 'r' | 'sr' | 'ssr'
- hp        : 数字。N:6~10 / R:12~18 / SR:20~26 / SSR:28~40。
- dur       : 秒。N:20~60 / R:45~120 / SR:60~120 / SSR:120~300。
- tags      : 数组，至少 1 个，最多 4 个，只能从下面 10 个里选：
              ["sit","eye","neck","meeting","mood","sleepy","back","brain","hungry","stress"]
- desc      : 20~40 字。第二人称、可立即执行、不要鸡汤、不要emoji。

# 风格
- 动作必须真的在工位上能完成（站起来 / 喝水 / 看远处 / 写小纸条 / 转动手腕等）。
- 文字幽默温暖，但克制；像一位懂打工人的朋友在递卡。
- 不要重复已有卡的核心动作（比如再写一张"喝一杯水"就废了）。

# 已用 ID（禁止复用）
${banIds.join(', ')}

# 输出
只输出一个 **JSON 数组**，不要 markdown 代码块、不要解释。结构示例：
[
  {"id":"deep_breath","name":"深呼吸卡","emoji":"🌬️","rarity":"n","hp":8,"dur":30,"tags":["stress","mood"],"desc":"用鼻子吸气 4 秒，屏住 4 秒，再缓慢呼出 6 秒，重复 3 次"}
]`;
}

/* =========================================================
 *  调 DeepSeek（OpenAI 兼容协议）
 * ========================================================= */
async function callDeepSeek({ apiKey, model, prompt }) {
  const url = 'https://api.deepseek.com/v1/chat/completions';
  const body = {
    model,
    temperature: 0.85,
    messages: [
      { role: 'system', content: '你是一个为打工人设计微休息卡牌的资深游戏策划。严格按用户的 schema 输出，只输出 JSON 数组。' },
      { role: 'user', content: prompt },
    ],
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`DeepSeek HTTP ${res.status}: ${t.slice(0, 400)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? '';
  return content;
}

/* =========================================================
 *  JSON 解析（容错：剥离 markdown / 文本前后噪音）
 * ========================================================= */
function extractJsonArray(text) {
  const first = text.indexOf('[');
  const last = text.lastIndexOf(']');
  if (first < 0 || last < 0) throw new Error('未找到 JSON 数组');
  const slice = text.slice(first, last + 1);
  return JSON.parse(slice);
}

/* =========================================================
 *  校验单张卡
 * ========================================================= */
const VALID_TAGS = new Set(['sit', 'eye', 'neck', 'meeting', 'mood', 'sleepy', 'back', 'brain', 'hungry', 'stress']);
const HP_RANGE = { n: [6, 10], r: [12, 18], sr: [20, 26], ssr: [28, 40] };
const DUR_RANGE = { n: [20, 60], r: [45, 120], sr: [60, 120], ssr: [120, 300] };

function validateCard(c, takenIds) {
  if (!c || typeof c !== 'object') return 'not-object';
  if (!/^[a-z][a-z0-9_]{2,19}$/.test(c.id || '')) return 'bad-id';
  if (takenIds.has(c.id)) return 'duplicate-id';
  if (typeof c.name !== 'string' || c.name.length < 3 || c.name.length > 10) return 'bad-name';
  if (!c.name.endsWith('卡')) return 'name-not-end-with-卡';
  if (typeof c.emoji !== 'string' || c.emoji.length < 1 || c.emoji.length > 6) return 'bad-emoji';
  if (!HP_RANGE[c.rarity]) return 'bad-rarity';
  const [hpMin, hpMax] = HP_RANGE[c.rarity];
  if (typeof c.hp !== 'number' || c.hp < hpMin || c.hp > hpMax) return 'hp-out-of-range';
  const [durMin, durMax] = DUR_RANGE[c.rarity];
  if (typeof c.dur !== 'number' || c.dur < durMin || c.dur > durMax) return 'dur-out-of-range';
  if (!Array.isArray(c.tags) || c.tags.length < 1 || c.tags.length > 4) return 'bad-tags';
  for (const t of c.tags) if (!VALID_TAGS.has(t)) return `unknown-tag:${t}`;
  if (typeof c.desc !== 'string' || c.desc.length < 10 || c.desc.length > 60) return 'bad-desc';
  return null;
}

/* =========================================================
 *  生成一批，带 retry（每轮累加，凑齐为止；attempt 用尽就返回手头的）
 * ========================================================= */
async function generateBatch({ env, batch, banIds }) {
  let lastErr = null;
  let accumulated = [];
  let currentBan = [...banIds];
  for (let attempt = 1; attempt <= 4; attempt++) {
    const need = batch.n - accumulated.length;
    if (need <= 0) break;
    const subBatch = { ...batch, n: need };
    const prompt = buildPrompt(subBatch, currentBan);
    try {
      console.log(`  [batch${batch.batch}] attempt ${attempt}, need ${need} …`);
      const raw = await callDeepSeek({
        apiKey: env.DEEPSEEK_API_KEY,
        model: env.AI_MODEL || 'deepseek-v4-flash',
        prompt,
      });
      const arr = extractJsonArray(raw);
      if (!Array.isArray(arr)) throw new Error('not array');

      const taken = new Set(currentBan);
      const good = [];
      const bad = [];
      for (const c of arr) {
        const err = validateCard(c, taken);
        if (err) { bad.push({ id: c?.id, err }); continue; }
        taken.add(c.id);
        good.push(c);
      }
      const counts = good.reduce((m, c) => (m[c.rarity] = (m[c.rarity] || 0) + 1, m), {});
      console.log(`    got ${good.length}/${need}, bad=${bad.length}, counts=`, counts);
      if (bad.length) console.log('    bad sample:', JSON.stringify(bad.slice(0, 3)));

      accumulated.push(...good);
      currentBan = Array.from(taken);
    } catch (e) {
      lastErr = e;
      console.warn(`    attempt ${attempt} failed:`, e.message);
    }
  }
  if (accumulated.length < batch.n) {
    console.warn(`  ⚠️ batch${batch.batch} 仅凑到 ${accumulated.length}/${batch.n}，进入下一批补齐`);
  }
  return accumulated.slice(0, batch.n);
}

/* =========================================================
 *  主流程
 * ========================================================= */
async function main() {
  const env = await loadEnv();
  if (!env.DEEPSEEK_API_KEY) throw new Error('.env.local 缺 DEEPSEEK_API_KEY');

  const existingIds = await loadExistingIds();
  console.log(`已有卡牌 id: ${existingIds.length} 个`);
  console.log(`模型: ${env.AI_MODEL || 'deepseek-v4-flash'}`);

  const ban = [...existingIds];
  const all = [];
  for (const batch of BATCHES) {
    const cards = await generateBatch({ env, batch, banIds: ban });
    all.push(...cards);
    for (const c of cards) ban.push(c.id);
    console.log(`批次 ${batch.batch} 完成，累计 ${all.length} 张`);
  }

  // 兜底补齐：若没到 100 就用一轮自由分布再补
  let safety = 0;
  while (all.length < 100 && safety < 3) {
    safety++;
    const need = 100 - all.length;
    console.log(`\n兜底补抽第 ${safety} 轮，仍差 ${need} 张`);
    const fillBatch = { batch: 90 + safety, n: need, rarity: { n: Math.ceil(need * 0.5), r: Math.ceil(need * 0.3), sr: Math.ceil(need * 0.15), ssr: Math.max(0, need - Math.ceil(need * 0.5) - Math.ceil(need * 0.3) - Math.ceil(need * 0.15)) }, theme: '任意主题，与已有卡明显区分' };
    const cards = await generateBatch({ env, batch: fillBatch, banIds: ban });
    all.push(...cards);
    for (const c of cards) ban.push(c.id);
  }

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(all, null, 2), 'utf8');
  console.log(`\n草稿已写入: ${OUT_FILE}`);
  console.log(`共 ${all.length} 张。稀有度统计：`,
    all.reduce((m, c) => (m[c.rarity] = (m[c.rarity] || 0) + 1, m), {}));

  if (process.argv.includes('--merge')) {
    await mergeIntoCardsJs(all);
  } else {
    console.log('提示：先 review 草稿，确认无问题后再 `node tools/gen-cards.mjs --merge` 合并到 cards.js');
  }
}

/* =========================================================
 *  合并到 cards.js（保留原文件结构）
 * ========================================================= */
async function mergeIntoCardsJs(newCards) {
  const src = await readFile(CARDS_FILE, 'utf8');
  const insertBefore = '];';
  const idx = src.lastIndexOf(insertBefore);
  if (idx < 0) throw new Error('找不到 CARD_POOL 收尾的 "];"');

  const groups = { n: [], r: [], sr: [], ssr: [] };
  for (const c of newCards) groups[c.rarity].push(c);

  const fmt = (c) => {
    const tags = JSON.stringify(c.tags).replace(/"/g, "'");
    return `  { id: '${c.id}', name: '${c.name}', emoji: '${c.emoji}', rarity: '${c.rarity}', hp: ${c.hp}, dur: ${c.dur}, tags: ${tags}, desc: '${c.desc.replace(/'/g, "\\'")}' },`;
  };

  const block = [
    '',
    '  /* ---- 扩充批次（DeepSeek 生成 · 待人工 review）---- */',
    ...Object.keys(groups).flatMap(r => groups[r].map(fmt)),
  ].join('\n');

  const next = src.slice(0, idx) + block + '\n' + src.slice(idx);
  await writeFile(CARDS_FILE, next, 'utf8');
  console.log(`已合并 ${newCards.length} 张到 ${CARDS_FILE}`);
}

main().catch(e => { console.error('失败:', e); process.exit(1); });
