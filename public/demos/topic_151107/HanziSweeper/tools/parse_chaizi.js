// 解析 chaizi-jt.txt 并生成拆字查找模块
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, '../data/chaizi-jt.txt');
const outPath = resolve(__dirname, '../js/decomposition.js');

const raw = readFileSync(dataPath, 'utf-8');
const lines = raw.split('\n').filter(l => l.trim());

// 反向查找表：component1+component2 -> [char1, char2, ...]
const reverseMap = new Map();

for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    const char = parts[0].trim();
    if (!char || char === '□') continue; // 跳过无法显示的字符
    
    // 遍历每种拆法
    for (let i = 1; i < parts.length; i++) {
        const components = parts[i].trim().split(/\s+/).filter(c => c && c !== '□');
        
        // 只处理2-3个部件的拆法（游戏中只组合两个部首）
        if (components.length === 2) {
            const [a, b] = components;
            addPair(a, b, char);
        } else if (components.length === 3) {
            // 三部件：尝试将前两个合并、后两个合并、首尾合并
            const [a, b, c] = components;
            addPair(a, b + c, char);
            addPair(a + b, c, char);
        }
    }
}

function addPair(a, b, char) {
    // 双向存储
    const key1 = `${a}|${b}`;
    const key2 = `${b}|${a}`;
    if (!reverseMap.has(key1)) reverseMap.set(key1, new Set());
    if (!reverseMap.has(key2)) reverseMap.set(key2, new Set());
    reverseMap.get(key1).add(char);
    reverseMap.get(key2).add(char);
}

// 生成 JS 模块代码
let code = `// 拆字反向查找表 - 自动生成自 kfcd/chaizi (CC BY 3.0)\n`;
code += `// 格式: "部件1|部件2" -> ["字1", "字2", ...]\n`;
code += `export const DECOMPOSITION_MAP = new Map([\n`;

for (const [key, chars] of reverseMap) {
    const arr = [...chars];
    code += `  ['${key}', ${JSON.stringify(arr)}],\n`;
}

code += `]);\n\n`;
code += `// 查询两个部件能组成的汉字\n`;
code += `export function findByComponents(a, b) {\n`;
code += `  return DECOMPOSITION_MAP.get(\`\${a}|\${b}\`) || [];\n`;
code += `}\n`;

writeFileSync(outPath, code, 'utf-8');
console.log(`生成完成: ${outPath}`);
console.log(`共 ${reverseMap.size} 个部件对，覆盖 ${new Set([...reverseMap.values()].flatMap(s => [...s])).size} 个汉字`);
