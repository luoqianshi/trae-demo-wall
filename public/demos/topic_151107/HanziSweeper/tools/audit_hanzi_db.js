// 审计 HANZI_DB 拆解的正确性
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 读取 HANZI_DB
const dataContent = readFileSync(resolve(__dirname, '../js/data.js'), 'utf-8');
const hanziMatch = dataContent.match(/export const HANZI_DB = \[([\s\S]*?)\];/);
if (!hanziMatch) { console.error('Cannot find HANZI_DB'); process.exit(1); }
const entries = [];
const entryRegex = /\{\s*char:\s*'([^']+)',\s*left:\s*'([^']+)',\s*right:\s*'([^']+)'/g;
let m;
while ((m = entryRegex.exec(hanziMatch[1]))) {
    entries.push({ char: m[1], left: m[2], right: m[3] });
}

// 读取 chaizi 拆字库
const chaiziContent = readFileSync(resolve(__dirname, '../data/chaizi-jt.txt'), 'utf-8');
const chaiziMap = new Map();
for (const line of chaiziContent.split('\n')) {
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    const char = parts[0].trim();
    if (!char || char === '□') continue;
    const decomps = [];
    for (let i = 1; i < parts.length; i++) {
        const comps = parts[i].trim().split(/\s+/).filter(c => c && c !== '□');
        decomps.push(comps);
    }
    chaiziMap.set(char, decomps);
}

console.log(`HANZI_DB: ${entries.length} 条`);
console.log(`chaizi-jt: ${chaiziMap.size} 条\n`);

// 检查重复
const charCount = new Map();
for (const e of entries) {
    charCount.set(e.char, (charCount.get(e.char) || 0) + 1);
}
const duplicates = [...charCount.entries()].filter(([_, c]) => c > 1);
if (duplicates.length > 0) {
    console.log('=== 重复条目 ===');
    for (const [char, count] of duplicates) {
        console.log(`  ${char}: 出现 ${count} 次`);
    }
    console.log();
}

// 检查明显错误
const problems = [];

for (const e of entries) {
    const { char, left, right } = e;
    
    // 1. 左右部件相同但不是叠字
    if (left === right && char !== left + left && char !== left) {
        // 叠字如 林=木+木 是合理的
        if (!['林', '从'].includes(char) && char !== left + left) {
            // 检查是否真的是叠字结构
            problems.push({ char, issue: 'left===right但非叠字', left, right });
        }
    }
    
    // 2. 递归分解（部件包含自身）
    if (left === char || right === char) {
        problems.push({ char, issue: '递归分解（部件=自身）', left, right });
    }
    
    // 3. 检查 chaizi 对照
    if (chaiziMap.has(char)) {
        const decomps = chaiziMap.get(char);
        let matched = false;
        for (const comps of decomps) {
            if (comps.length === 2) {
                if ((comps[0] === left && comps[1] === right) ||
                    (comps[0] === right && comps[1] === left)) {
                    matched = true;
                    break;
                }
            }
        }
        if (!matched) {
            problems.push({ 
                char, 
                issue: 'chaizi不匹配',
                left, right,
                chaizi: decomps.map(c => c.join('+')).join(' | ')
            });
        }
    }
    
    // 4. 人 vs 入 混用
    // 全 = 入+王, not 人+王
    // 金 = 人+王+丷, not 人+王
}

// 手动标注已知错误（仅保留仍存在的问题）
const knownErrors = {
    // 以下条目已修复，仅作记录：
    // '桌': { correct: '木+卓', note: '卜 is wrong, should be 卓' },  // 已修复
    // '全': { correct: '入+王', note: '人+王 is wrong, should be 入+王' },  // 已修复
    // '谣': { correct: '讠+䍃', note: '讠+瑶 is wrong, 瑶 already contains 王' },  // 已修复
    // '辨': { correct: '辡+刂', note: '辛+刂 is wrong, missing one 辛' },  // 已修复
};

for (const [char, info] of Object.entries(knownErrors)) {
    const entry = entries.find(e => e.char === char);
    if (entry) {
        problems.push({
            char,
            issue: '已知错误: ' + info.note,
            left: entry.left,
            right: entry.right,
            correct: info.correct
        });
    }
}

// 去重
const seen = new Set();
const unique = problems.filter(p => {
    const key = `${p.char}|${p.issue}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
});

console.log('=== 问题条目 ===');
for (const p of unique) {
    console.log(`  ${p.char}: ${p.issue}`);
    console.log(`    HANZI_DB: ${p.left} + ${p.right}`);
    if (p.chaizi) console.log(`    chaizi:   ${p.chaizi}`);
    if (p.correct) console.log(`    正确:     ${p.correct}`);
    console.log();
}

console.log(`共 ${unique.length} 个问题条目`);