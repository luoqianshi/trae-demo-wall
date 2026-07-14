/**
 * 棋盘生成算法
 *
 * 流程：
 * 1. 从数据库选取 N 个汉字（组件全局唯一）
 * 2. 将 2N 个组件随机放置在棋盘上 → 这些是 Radical 格
 * 3. 其余格子为 Number 格，数字 = 周围 8 格中 Radical 格的数量
 * 4. 类似扫雷：Radical ≈ 地雷，Number ≈ 数字提示
 *
 * 保证：
 * - 至少有一个 0 格（周围没有 Radical）作为起点
 * - 棋盘可解（用求解器验证）
 */

import { Board, Cell, CellType, CellState, CharDecomp } from './types';
import { selectCharacters, getComponents } from '../data/hanzi-db';
import { solveBoard } from './solver';

const MAX_GENERATION_ATTEMPTS = 50;

/**
 * 生成棋盘（保证可解）
 * @param width  棋盘宽度
 * @param height 棋盘高度
 * @param charCount 汉字数量（= Radical 对数）
 */
export function generateBoard(
  width: number,
  height: number,
  charCount: number
): Board {
  const totalCells = width * height;

  // 确保 Radical 数量不超过格子数的 30%（留足推理空间）
  const maxRadicals = Math.floor(totalCells * 0.3);
  const actualCharCount = Math.min(charCount, Math.floor(maxRadicals / 2));

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const board = tryGenerateBoard(width, height, actualCharCount);
    if (board) return board;
  }

  // 如果多次尝试都失败，降低 Radical 数量再试
  const reducedCharCount = Math.max(2, actualCharCount - 1);
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const board = tryGenerateBoard(width, height, reducedCharCount);
    if (board) return board;
  }

  // 最终保底：生成一个最简单的棋盘
  return generateFallbackBoard(width, height);
}

/**
 * 尝试生成一次棋盘
 */
function tryGenerateBoard(
  width: number,
  height: number,
  charCount: number
): Board | null {
  // 1. 选取汉字
  const { selected } = selectCharacters(charCount);
  const components = getComponents(selected);
  const totalRadicals = components.length;

  // 2. 初始化棋盘
  const grid: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = {
        type: CellType.Number,
        state: CellState.Hidden,
        number: 0,
        radicalIndex: -1,
      };
    }
  }

  // 3. 随机放置组件
  const positions = getAllPositions(width, height);
  shuffle(positions);

  const radicalPositions = positions.slice(0, totalRadicals);

  for (let i = 0; i < totalRadicals; i++) {
    const { x, y } = radicalPositions[i];
    grid[y][x].type = CellType.Radical;
    grid[y][x].radicalIndex = i;
  }

  // 4. 计算数字（周围 Radical 格数量）
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].type === CellType.Radical) continue;
      grid[y][x].number = countAdjacentRadicals(grid, x, y, width, height);
    }
  }

  // 5. 检查是否有至少一个 0 格
  let hasZero = false;
  for (let y = 0; y < height && !hasZero; y++) {
    for (let x = 0; x < width && !hasZero; x++) {
      if (grid[y][x].type === CellType.Number && grid[y][x].number === 0) {
        hasZero = true;
      }
    }
  }
  if (!hasZero) return null;

  const board: Board = { width, height, grid, totalRadicals, characters: selected };

  // 6. 用求解器验证可解性
  const result = solveBoard(board);
  if (!result.solvable) return null;

  return board;
}

/**
 * 保底棋盘：只在角落放少量 Radical
 */
function generateFallbackBoard(width: number, height: number): Board {
  const { selected } = selectCharacters(2);
  const components = getComponents(selected);
  const totalRadicals = components.length;

  const grid: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = {
        type: CellType.Number,
        state: CellState.Hidden,
        number: 0,
        radicalIndex: -1,
      };
    }
  }

  // 只在右下角放 Radical
  const radicalPositions = [
    { x: width - 1, y: height - 1 },
    { x: width - 2, y: height - 1 },
    { x: width - 1, y: height - 2 },
    { x: width - 2, y: height - 2 },
  ];

  for (let i = 0; i < totalRadicals && i < radicalPositions.length; i++) {
    const { x, y } = radicalPositions[i];
    grid[y][x].type = CellType.Radical;
    grid[y][x].radicalIndex = i;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].type === CellType.Radical) continue;
      grid[y][x].number = countAdjacentRadicals(grid, x, y, width, height);
    }
  }

  return { width, height, grid, totalRadicals, characters: selected };
}

/** 获取所有坐标 */
function getAllPositions(
  width: number,
  height: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      positions.push({ x, y });
    }
  }
  return positions;
}

/** Fisher-Yates 洗牌 */
function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/** 计算 (x,y) 周围 8 格中有多少个 Radical */
function countAdjacentRadicals(
  grid: Cell[][],
  x: number,
  y: number,
  width: number,
  height: number
): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (grid[ny][nx].type === CellType.Radical) count++;
      }
    }
  }
  return count;
}

/**
 * 打印棋盘（调试用）
 */
export function printBoard(board: Board, revealAll = false): void {
  const { grid, width, height } = board;

  let header = '    ';
  for (let x = 0; x < width; x++) {
    header += x.toString().padStart(3);
  }
  console.log(header);
  console.log('    ' + '---'.repeat(width));

  for (let y = 0; y < height; y++) {
    let row = y.toString().padStart(2) + ' | ';
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      if (cell.state === CellState.Revealed || revealAll) {
        if (cell.type === CellType.Radical) {
          row += ' R ';
        } else {
          row += cell.number === 0 ? ' . ' : ` ${cell.number} `;
        }
      } else if (cell.state === CellState.Flagged) {
        row += ' F ';
      } else {
        row += ' # ';
      }
    }
    console.log(row);
  }
}

/**
 * 打印棋盘（显示具体部首，调试用）
 */
export function printBoardWithComponents(board: Board): void {
  const { grid, width, height } = board;
  const components = getComponents(board.characters);

  let header = '    ';
  for (let x = 0; x < width; x++) {
    header += x.toString().padStart(4);
  }
  console.log(header);
  console.log('    ' + '----'.repeat(width));

  for (let y = 0; y < height; y++) {
    let row = y.toString().padStart(2) + ' | ';
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      if (cell.state === CellState.Revealed || cell.type === CellType.Radical) {
        if (cell.type === CellType.Radical) {
          row += `[${components[cell.radicalIndex]}]`.padEnd(4);
        } else {
          row += cell.number === 0 ? ' .  ' : ` ${cell.number}  `;
        }
      } else if (cell.state === CellState.Flagged) {
        row += '[F] ';
      } else {
        row += ' ## ';
      }
    }
    console.log(row);
  }
}
