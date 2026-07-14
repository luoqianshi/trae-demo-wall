/**
 * 扫雷求解器 - 模拟真实游戏过程
 *
 * 真实游戏流程：
 * 1. 玩家点击一个格子
 * 2. 如果是 Number 格，显示数字
 * 3. 如果是 0，自动翻开周围所有格子
 * 4. 根据数字推理，标记 Radical 或点击安全格
 * 5. 重复直到找出所有 Radical
 */

import { Board, CellState, CellType } from './types';

export interface SolveResult {
  solvable: boolean;       // 是否可解
  iterations: number;      // 迭代次数
  foundRadicals: number;   // 找到的 Radical 数
  totalRadicals: number;   // 总 Radical 数
  foundSafe: number;       // 确认安全的格子数
}

/**
 * 尝试求解棋盘（模拟真实游戏）
 */
export function solveBoard(board: Board): SolveResult {
  const { grid, width, height, totalRadicals } = board;

  // 求解器内部状态
  const isRadical: boolean[][] = Array.from({ length: height }, () =>
    Array(width).fill(false)
  );
  const isSafe: boolean[][] = Array.from({ length: height }, () =>
    Array(width).fill(false)
  );
  const isRevealed: boolean[][] = Array.from({ length: height }, () =>
    Array(width).fill(false)
  );

  let foundRadicals = 0;
  let foundSafe = 0;
  let iterations = 0;
  const MAX_ITERATIONS = 500;

  // 第一步：找到一个 0 格作为起点
  let startFound = false;
  for (let y = 0; y < height && !startFound; y++) {
    for (let x = 0; x < width && !startFound; x++) {
      if (grid[y][x].type === CellType.Number && grid[y][x].number === 0) {
        revealCell(x, y);
        startFound = true;
      }
    }
  }

  // 如果没有 0 格，随便点一个 Number 格
  if (!startFound) {
    for (let y = 0; y < height && !startFound; y++) {
      for (let x = 0; x < width && !startFound; x++) {
        if (grid[y][x].type === CellType.Number) {
          revealCell(x, y);
          startFound = true;
        }
      }
    }
  }

  // 迭代推理
  while (iterations < MAX_ITERATIONS) {
    iterations++;
    let progress = false;

    // 规则 1 & 2：基于已翻开的 Number 格推理
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!isRevealed[y][x]) continue;
        if (grid[y][x].type !== CellType.Number) continue;
        if (grid[y][x].number === 0) continue;

        const neighbors = getNeighbors(x, y, width, height);
        let flaggedCount = 0;
        const unknownNeighbors: { x: number; y: number }[] = [];

        for (const n of neighbors) {
          if (isRadical[n.y][n.x]) {
            flaggedCount++;
          } else if (!isSafe[n.y][n.x] && !isRevealed[n.y][n.x]) {
            unknownNeighbors.push(n);
          }
        }

        const remaining = grid[y][x].number - flaggedCount;

        if (unknownNeighbors.length === 0) continue;

        // 规则 1：剩余未知数 = 剩余需要找的 Radical 数 → 全是 Radical
        if (remaining === unknownNeighbors.length && remaining > 0) {
          for (const n of unknownNeighbors) {
            if (!isRadical[n.y][n.x]) {
              isRadical[n.y][n.x] = true;
              foundRadicals++;
              progress = true;
            }
          }
        }

        // 规则 2：不需要更多 Radical → 全是安全的
        if (remaining === 0) {
          for (const n of unknownNeighbors) {
            if (!isSafe[n.y][n.x] && !isRadical[n.y][n.x]) {
              isSafe[n.y][n.x] = true;
              foundSafe++;
              progress = true;
              // 点击安全格，翻开它
              revealCell(n.x, n.y);
            }
          }
        }
      }
    }

    // 规则 3：子集约束（高级推理）
    if (!progress) {
      progress = applySubsetConstraint(
        grid, isRadical, isSafe, isRevealed, width, height
      );
    }

    if (!progress) break;

    // 提前终止：所有 Radical 都找到了
    if (foundRadicals === totalRadicals) break;
  }

  return {
    solvable: foundRadicals === totalRadicals,
    iterations,
    foundRadicals,
    totalRadicals,
    foundSafe,
  };

  /** 翻开一个格子，如果是 0 则自动翻开周围 */
  function revealCell(x: number, y: number): void {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    if (isRevealed[y][x]) return;
    if (grid[y][x].type === CellType.Radical) return;

    isRevealed[y][x] = true;

    // 如果是 0，自动翻开周围所有格子
    if (grid[y][x].number === 0) {
      const neighbors = getNeighbors(x, y, width, height);
      for (const n of neighbors) {
        if (grid[n.y][n.x].type === CellType.Number) {
          revealCell(n.x, n.y);
        }
      }
    }
  }
}

/** 获取有效邻居 */
function getNeighbors(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number }[] {
  const neighbors: { x: number; y: number }[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        neighbors.push({ x: nx, y: ny });
      }
    }
  }
  return neighbors;
}

/**
 * 子集约束推理
 */
function applySubsetConstraint(
  grid: any[][],
  isRadical: boolean[][],
  isSafe: boolean[][],
  isRevealed: boolean[][],
  width: number,
  height: number
): boolean {
  let progress = false;

  interface Constraint {
    x: number;
    y: number;
    unknowns: Set<string>;
    remaining: number;
  }

  const constraints: Constraint[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isRevealed[y][x]) continue;
      if (grid[y][x].type !== CellType.Number || grid[y][x].number === 0) continue;

      const neighbors = getNeighbors(x, y, width, height);
      let flaggedCount = 0;
      const unknownSet = new Set<string>();

      for (const n of neighbors) {
        if (isRadical[n.y][n.x]) {
          flaggedCount++;
        } else if (!isSafe[n.y][n.x] && !isRevealed[n.y][n.x]) {
          unknownSet.add(`${n.x},${n.y}`);
        }
      }

      const remaining = grid[y][x].number - flaggedCount;
      if (unknownSet.size > 0 && remaining >= 0) {
        constraints.push({ x, y, unknowns: unknownSet, remaining });
      }
    }
  }

  // 两两比较，检查子集关系
  for (let i = 0; i < constraints.length; i++) {
    for (let j = 0; j < constraints.length; j++) {
      if (i === j) continue;

      const a = constraints[i];
      const b = constraints[j];

      // 检查 A 是否是 B 的子集
      if (a.unknowns.size >= b.unknowns.size) continue;

      let isSubset = true;
      for (const key of a.unknowns) {
        if (!b.unknowns.has(key)) {
          isSubset = false;
          break;
        }
      }

      if (isSubset && a.remaining === b.remaining) {
        // B 中不在 A 里的未知邻居都是安全的
        for (const key of b.unknowns) {
          if (!a.unknowns.has(key)) {
            const [nx, ny] = key.split(',').map(Number);
            if (!isSafe[ny][nx] && !isRadical[ny][nx]) {
              isSafe[ny][nx] = true;
              progress = true;
            }
          }
        }
      }
    }
  }

  return progress;
}
