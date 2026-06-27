#!/usr/bin/env node
/**
 * merge-cards.mjs · 把 data/cards.generated.json 合并进 data/cards.js
 *
 *  - 按 rarity 分组，插到 CARD_POOL 末尾的 "];" 之前；
 *  - 单引号转义；保留原文件其他内容（RARITY_WEIGHT / TAG_LABEL / getCardById 等）；
 *  - 写入前再做一次"已存在 id 去重"防御。
 *
 * 用法：node tools/merge-cards.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CARDS_FILE = path.join(ROOT, 'data', 'cards.js');
const GEN_FILE = path.join(ROOT, 'data', 'cards.generated.json');

const RARITY_LABEL = { n: 'N · 普通', r: 'R · 稀有', sr: 'SR · 史诗', ssr: 'SSR · 传说' };

async function main() {
  const src = await readFile(CARDS_FILE, 'utf8');
  const newCards = JSON.parse(await readFile(GEN_FILE, 'utf8'));

  // 已存在 id 防御
  const existing = new Set();
  for (const m of src.matchAll(/id:\s*'([a-zA-Z0-9_]+)'/g)) existing.add(m[1]);
  const filtered = newCards.filter(c => !existing.has(c.id));
  console.log(`草稿 ${newCards.length} 张，去重后剩 ${filtered.length} 张`);

  const insertBefore = '];';
  const idx = src.lastIndexOf(insertBefore);
  if (idx < 0) throw new Error('找不到 CARD_POOL 收尾的 "];"');

  const groups = { n: [], r: [], sr: [], ssr: [] };
  for (const c of filtered) groups[c.rarity].push(c);

  const fmtCard = (c) => {
    const tags = '[' + c.tags.map(t => `'${t}'`).join(', ') + ']';
    const desc = c.desc.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `  { id: '${c.id}', name: '${c.name}', emoji: '${c.emoji}', rarity: '${c.rarity}', hp: ${c.hp}, dur: ${c.dur}, tags: ${tags}, desc: '${desc}' },`;
  };

  const lines = [''];
  for (const r of ['n', 'r', 'sr', 'ssr']) {
    if (!groups[r].length) continue;
    lines.push(`  /* ---- 扩充 · ${RARITY_LABEL[r]}（${groups[r].length} 张 · DeepSeek 生成）---- */`);
    for (const c of groups[r]) lines.push(fmtCard(c));
    lines.push('');
  }
  const block = lines.join('\n');

  const next = src.slice(0, idx) + block + src.slice(idx);
  await writeFile(CARDS_FILE, next, 'utf8');

  // 同步把 app.html / app-liquid.html 写死的 "0/28" 改成动态长度
  const total = existing.size + filtered.length;
  console.log(`新 CARD_POOL 总数 = ${total}`);
  for (const f of ['app.html', 'app-liquid.html']) {
    const p = path.join(ROOT, f);
    let html = await readFile(p, 'utf8');
    const before = html;
    html = html.replace(/0\/28/g, `0/${total}`);
    if (html !== before) {
      await writeFile(p, html, 'utf8');
      console.log(`  已更新 ${f} 中 0/28 → 0/${total}`);
    }
  }
  console.log('✅ 合并完成');
}

main().catch(e => { console.error(e); process.exit(1); });
