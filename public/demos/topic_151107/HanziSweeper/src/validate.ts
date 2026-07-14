/**
 * 算法验证脚本
 *
 * 验证内容：
 * 1. 汉字数据库完整性
 * 2. 棋盘生成是否正确
 * 3. 求解器能否验证可解性
 * 4. 批量生成 100 个棋盘，统计可解率
 * 5. 配对阶段验证
 */

import { generateBoard, printBoard, printBoardWithComponents } from './core/board-generator';
import { solveBoard } from './core/solver';
import { matchComponents, getComponents, HANZI_DB } from './data/hanzi-db';
import { CellType, CellState } from './core/types';

console.log('=== 汉字扫雷 — 算法验证 ===\n');

// ---- 1. 数据库验证 ----
console.log('--- 1. 数据库验证 ---');
console.log(`数据库共 ${HANZI_DB.length} 个汉字拆解`);

// 检查所有配对是否有效
let validPairs = 0;
for (const entry of HANZI_DB) {
  const result = matchComponents(entry.left, entry.right);
  if (result) validPairs++;
  else console.log(`  警告：${entry.left} + ${entry.right} 无法匹配！`);
}
console.log(`有效配对：${validPairs}/${HANZI_DB.length}`);

// ---- 2. 单个棋盘生成测试 ----
console.log('\n--- 2. 单个棋盘生成测试 (8x8, 5个汉字) ---');
const board = generateBoard(8, 8, 5);
console.log(`使用汉字：${board.characters.map((c: any) => c.char).join(', ')}`);
console.log(`组件列表：${getComponents(board.characters).join(', ')}`);
console.log(`Radical 总数：${board.totalRadicals}`);

// 统计格子类型
let radicalCount = 0;
let numberCount = 0;
for (let y = 0; y < board.height; y++) {
  for (let x = 0; x < board.width; x++) {
    if (board.grid[y]![x]!.type === CellType.Radical) radicalCount++;
    else numberCount++;
  }
}
console.log(`Radical 格：${radicalCount}，Number 格：${numberCount}`);

console.log('\n棋盘（隐藏状态，R=Radical）：');
printBoard(board, false);

console.log('\n棋盘（全部揭示）：');
printBoard(board, true);

// ---- 3. 求解器测试 ----
console.log('\n--- 3. 求解器测试 ---');
const result = solveBoard(board);
console.log(`可解：${result.solvable}`);
console.log(`迭代次数：${result.iterations}`);
console.log(`找到 Radical：${result.foundRadicals}/${result.totalRadicals}`);
console.log(`确认安全：${result.foundSafe}`);

// ---- 4. 批量验证 ----
console.log('\n--- 4. 批量验证（100 个棋盘）---');

interface BatchResult {
  size: string;
  charCount: number;
  total: number;
  solvable: number;
  rate: string;
  avgIterations: string;
}

const configs = [
  { width: 6, height: 6, charCount: 3, label: '6x6/3字' },
  { width: 8, height: 8, charCount: 5, label: '8x8/5字' },
  { width: 10, height: 10, charCount: 8, label: '10x10/8字' },
  { width: 12, height: 12, charCount: 12, label: '12x12/12字' },
];

const batchResults: BatchResult[] = [];

for (const config of configs) {
  let solvableCount = 0;
  let totalIterations = 0;
  const N = 100;

  for (let i = 0; i < N; i++) {
    const b = generateBoard(config.width, config.height, config.charCount);
    const r = solveBoard(b);
    if (r.solvable) {
      solvableCount++;
      totalIterations += r.iterations;
    }
  }

  batchResults.push({
    size: config.label,
    charCount: config.charCount,
    total: N,
    solvable: solvableCount,
    rate: `${(solvableCount / N * 100).toFixed(1)}%`,
    avgIterations: solvableCount > 0
      ? (totalIterations / solvableCount).toFixed(1)
      : 'N/A',
  });
}

console.table(batchResults);

// ---- 5. 配对验证 ----
console.log('\n--- 5. 配对阶段验证 ---');
const testBoard = generateBoard(8, 8, 5);
const components = getComponents(testBoard.characters);
console.log(`组件：${components.join(', ')}`);
console.log(`汉字：${testBoard.characters.map((c: any) => c.char).join(', ')}`);

// 尝试所有配对
let matchedPairs = 0;
let totalPairs = 0;
for (let i = 0; i < components.length; i++) {
  for (let j = i + 1; j < components.length; j++) {
    totalPairs++;
    const result = matchComponents(components[i]!, components[j]!);
    if (result) {
      matchedPairs++;
      console.log(`  ${components[i]} + ${components[j]} = ${result}`);
    }
  }
}
console.log(`可配对数：${matchedPairs}（预期：${testBoard.characters.length}）`);
console.log(`总组合数：${totalPairs}`);

// ---- 6. 不可解棋盘分析 ----
console.log('\n--- 6. 不可解棋盘分析 ---');
let unsolvableExample = null;
for (let i = 0; i < 500; i++) {
  const b = generateBoard(8, 8, 5);
  const r = solveBoard(b);
  if (!r.solvable) {
    unsolvableExample = { board: b, result: r };
    break;
  }
}

if (unsolvableExample) {
  const { board: b, result: r } = unsolvableExample;
  console.log(`找到不可解棋盘（生成第 ? 次尝试）`);
  console.log(`找到 Radical：${r.foundRadicals}/${r.totalRadicals}`);
  console.log('棋盘布局：');
  printBoard(b, true);
  console.log('使用汉字：', b.characters.map((c: any) => c.char).join(', '));
} else {
  console.log('500 次尝试内未找到不可解棋盘');
}

console.log('\n=== 验证完成 ===');
