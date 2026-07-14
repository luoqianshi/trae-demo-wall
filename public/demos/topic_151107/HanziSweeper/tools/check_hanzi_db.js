// 检查 HANZI_DB 拆字与 chaizi-jt 数据库的一致性
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// 1. 读取 chaizi-jt.txt 并构建查找表
const chaiziPath = join(projectRoot, 'data', 'chaizi-jt.txt');
const chaiziRaw = readFileSync(chaiziPath, 'utf-8');
const chaiziMap = new Map(); // char -> Set of decompositions (each is array of components)

for (const line of chaiziRaw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split('\t');
    if (parts.length < 2) continue;
    const char = parts[0];
    const decompositions = parts.slice(1).map(d => d.split(/\s+/).filter(Boolean));
    if (!chaiziMap.has(char)) {
        chaiziMap.set(char, []);
    }
    chaiziMap.get(char).push(...decompositions);
}

// 2. 读取 HANZI_DB：使用 eval 最简单（因为文件是 ES module 导出）
const dataPath = join(projectRoot, 'js', 'data.js');
const dataRaw = readFileSync(dataPath, 'utf-8');

// 提取 HANZI_DB 数组内容
const dbMatch = dataRaw.match(/export const HANZI_DB = (\[[\s\S]*?\]);/);
if (!dbMatch) {
    console.error('无法解析 HANZI_DB');
    process.exit(1);
}

// 用 Function 代替 eval 来执行（沙箱环境）
const HANZI_DB = new Function(`return ${dbMatch[1]}`)();

// 3. 检查每个 HANZI_DB 条目
const mismatches = [];
const matched = [];

for (const entry of HANZI_DB) {
    const { char, left, right } = entry;
    const chaiziDecompositions = chaiziMap.get(char);

    if (!chaiziDecompositions) {
        // chaizi 中没有这个字符
        mismatches.push({
            char,
            left,
            right,
            reason: 'chaizi 数据库中无此字符',
            chaiziDecompositions: null,
        });
        continue;
    }

    // 检查是否有匹配的分解（仅考虑恰好 2 个组件的分解）
    let found = false;
    for (const decomp of chaiziDecompositions) {
        if (decomp.length !== 2) continue;
        if ((decomp[0] === left && decomp[1] === right) ||
            (decomp[0] === right && decomp[1] === left)) {
            found = true;
            break;
        }
    }

    if (found) {
        matched.push(char);
    } else {
        mismatches.push({
            char,
            left,
            right,
            reason: '无匹配的拆法',
            chaiziDecompositions: chaiziDecompositions,
        });
    }
}

// 4. 输出结果到文件（避免控制台编码问题）
const outPath = join(__dirname, 'check_result.txt');
const lines = [];

lines.push('='.repeat(70));
lines.push('HANZI_DB 与 chaizi-jt 拆字一致性检查');
lines.push('='.repeat(70));
lines.push(`HANZI_DB 总条目数: ${HANZI_DB.length}`);
lines.push(`匹配成功: ${matched.length}`);
lines.push(`不匹配: ${mismatches.length}`);
lines.push('='.repeat(70));

if (mismatches.length > 0) {
    lines.push('');
    lines.push('不匹配的条目：');
    lines.push('');
    for (const m of mismatches) {
        lines.push(`  字: ${m.char}   HANZI_DB: ${m.left} + ${m.right}`);
        if (m.chaiziDecompositions === null) {
            lines.push(`    → chaizi 数据库中无此字符`);
        } else {
            lines.push(`    → chaizi 中的拆法:`);
            for (const d of m.chaiziDecompositions) {
                lines.push(`      ${d.join(' ')}`);
            }
        }
        lines.push('');
    }
} else {
    lines.push('');
    lines.push('所有条目均匹配！');
}

writeFileSync(outPath, lines.join('\n'), 'utf-8');
console.log(`结果已写入: ${outPath}`);