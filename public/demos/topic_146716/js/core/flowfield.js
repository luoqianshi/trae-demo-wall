// ============================================================
// 流场寻路系统 (Flow Field Pathfinding)
// 适合海量僵尸同时追击玩家，一次计算所有怪物共用
// ============================================================

const FlowField = (function() {
  // 网格参数
  const CELL_SIZE = 2;        // 每个格子2x2米
  const MAP_HALF = 200;       // 地图半径（与 CONFIG.MAP_SIZE 一致）
  const GRID_SIZE = Math.ceil(MAP_HALF * 2 / CELL_SIZE); // 200格
  const UPDATE_INTERVAL = 0.3; // 流场更新间隔（秒）
  const DIRS = [
    { dx: 0, dz: -1 },  // 北
    { dx: 1, dz: 0 },   // 东
    { dx: 0, dz: 1 },   // 南
    { dx: -1, dz: 0 },  // 西
    { dx: 1, dz: -1 },  // 东北
    { dx: 1, dz: 1 },   // 东南
    { dx: -1, dz: 1 },  // 西南
    { dx: -1, dz: -1 }, // 西北
  ];

  // 流场数据
  let costMap = null;      // 代价地图：0=可通行, Infinity=障碍
  let distMap = null;      // 距离地图：每个格子到目标的最短距离
  let flowMap = null;      // 流场地图：每个格子的移动方向 {dx, dz}
  let targetCellX = -1;    // 目标格子坐标
  let targetCellZ = -1;
  let lastTargetX = Infinity;
  let lastTargetZ = Infinity;
  let lastUpdateTime = 0;
  let needsRebuild = true;  // 是否需要重建代价地图
  let isComputing = false;

  // 初始化
  function init() {
    costMap = new Float32Array(GRID_SIZE * GRID_SIZE);
    distMap = new Float32Array(GRID_SIZE * GRID_SIZE);
    flowMap = new Array(GRID_SIZE * GRID_SIZE);
    // 默认全部可通行
    costMap.fill(0);
    distMap.fill(Infinity);
    needsRebuild = true;
    console.log('[流场] 初始化完成，网格大小:', GRID_SIZE, 'x', GRID_SIZE, '格子尺寸:', CELL_SIZE, 'm');
  }

  // 世界坐标转格子坐标
  function worldToCell(wx, wz) {
    return {
      cx: Math.floor((wx + MAP_HALF) / CELL_SIZE),
      cz: Math.floor((wz + MAP_HALF) / CELL_SIZE)
    };
  }

  // 格子坐标转世界坐标（格子中心）
  function cellToWorld(cx, cz) {
    return {
      wx: cx * CELL_SIZE + CELL_SIZE / 2 - MAP_HALF,
      wz: cz * CELL_SIZE + CELL_SIZE / 2 - MAP_HALF
    };
  }

  // 索引
  function idx(cx, cz) {
    return cz * GRID_SIZE + cx;
  }

  // 检查格子是否在范围内
  function inBounds(cx, cz) {
    return cx >= 0 && cx < GRID_SIZE && cz >= 0 && cz < GRID_SIZE;
  }

  // 重建代价地图（从碰撞器构建）
  function rebuildCostMap() {
    if (!costMap) return;

    // 清空代价地图
    costMap.fill(0);

    // 获取所有碰撞器，标记障碍格子
    const allColliders = window.colliders || [];
    for (const c of allColliders) {
      if (!c.solid) continue; // 只标记不可穿越的物体
      if (c.type === 'stair_shell') continue;

      // 碰撞盒范围转换为格子范围
      const minCX = Math.floor((c.x - c.hw - MAP_HALF) / CELL_SIZE);
      const maxCX = Math.floor((c.x + c.hw - MAP_HALF) / CELL_SIZE);
      const minCZ = Math.floor((c.z - c.hd - MAP_HALF) / CELL_SIZE);
      const maxCZ = Math.floor((c.z + c.hd - MAP_HALF) / CELL_SIZE);

      // 扩展半格作为缓冲区，避免僵尸贴墙
      const buffer = 1;
      for (let cz = minCZ - buffer; cz <= maxCZ + buffer; cz++) {
        for (let cx = minCX - buffer; cx <= maxCX + buffer; cx++) {
          if (inBounds(cx, cz)) {
            costMap[idx(cx, cz)] = Infinity;
          }
        }
      }
    }

    // 标记工事（路障等）为障碍
    if (window.deployedFortifications) {
      for (const fort of window.deployedFortifications) {
        if (!fort.def || fort.health <= 0) continue;
        if (fort.def.type === 'robo_dog') continue; // 机器狗不阻挡
        if (fort.def.type !== 'barricade') continue; // 目前只有路障阻挡

        const fx = fort.mesh.position.x;
        const fz = fort.mesh.position.z;
        const fSize = fort.def.size || 2;
        const minCX = Math.floor((fx - fSize / 2 - MAP_HALF) / CELL_SIZE);
        const maxCX = Math.floor((fx + fSize / 2 - MAP_HALF) / CELL_SIZE);
        const minCZ = Math.floor((fz - 0.5 - MAP_HALF) / CELL_SIZE);
        const maxCZ = Math.floor((fz + 0.5 - MAP_HALF) / CELL_SIZE);

        for (let cz = minCZ; cz <= maxCZ; cz++) {
          for (let cx = minCX; cx <= maxCX; cx++) {
            if (inBounds(cx, cz)) {
              costMap[idx(cx, cz)] = Infinity;
            }
          }
        }
      }
    }

    needsRebuild = false;
  }

  // BFS 计算流场
  function computeFlowField(targetWX, targetWZ) {
    const target = worldToCell(targetWX, targetWZ);
    targetCellX = target.cx;
    targetCellZ = target.cz;

    // 如果目标不在范围内，使用最近的边界格子
    if (!inBounds(targetCellX, targetCellZ)) {
      targetCellX = Math.max(0, Math.min(GRID_SIZE - 1, targetCellX));
      targetCellZ = Math.max(0, Math.min(GRID_SIZE - 1, targetCellZ));
    }

    // 如果目标在障碍物上，找最近的可通行格子
    if (costMap[idx(targetCellX, targetCellZ)] === Infinity) {
      let found = false;
      for (let r = 1; r < 20 && !found; r++) {
        for (let dz = -r; dz <= r && !found; dz++) {
          for (let dx = -r; dx <= r && !found; dx++) {
            const nx = targetCellX + dx;
            const nz = targetCellZ + dz;
            if (inBounds(nx, nz) && costMap[idx(nx, nz)] === 0) {
              targetCellX = nx;
              targetCellZ = nz;
              found = true;
            }
          }
        }
      }
    }

    // 初始化距离地图
    distMap.fill(Infinity);
    distMap[idx(targetCellX, targetCellZ)] = 0;

    // BFS 队列
    const queue = [targetCellX, targetCellZ]; // 扁平化数组，每两个元素一组
    let head = 0;

    while (head < queue.length) {
      const cx = queue[head++];
      const cz = queue[head++];
      const currentDist = distMap[idx(cx, cz)];

      for (let i = 0; i < 8; i++) {
        const nx = cx + DIRS[i].dx;
        const nz = cz + DIRS[i].dz;

        if (!inBounds(nx, nz)) continue;
        if (costMap[idx(nx, nz)] === Infinity) continue; // 障碍物

        // 对角线移动代价更高（√2 ≈ 1.414）
        const moveCost = (DIRS[i].dx !== 0 && DIRS[i].dz !== 0) ? 1.414 : 1.0;
        const newDist = currentDist + moveCost;

        if (newDist < distMap[idx(nx, nz)]) {
          distMap[idx(nx, nz)] = newDist;
          queue.push(nx, nz);
        }
      }
    }

    // 计算流场方向
    for (let cz = 0; cz < GRID_SIZE; cz++) {
      for (let cx = 0; cx < GRID_SIZE; cx++) {
        const i = idx(cx, cz);
        if (costMap[i] === Infinity || distMap[i] === Infinity) {
          flowMap[i] = null;
          continue;
        }
        if (cx === targetCellX && cz === targetCellZ) {
          flowMap[i] = { dx: 0, dz: 0 }; // 目标位置
          continue;
        }

        // 找到距离最小的邻居
        let bestDist = distMap[i];
        let bestDX = 0;
        let bestDZ = 0;

        for (let d = 0; d < 8; d++) {
          const nx = cx + DIRS[d].dx;
          const nz = cz + DIRS[d].dz;
          if (!inBounds(nx, nz)) continue;
          const ni = idx(nx, nz);
          if (distMap[ni] < bestDist) {
            bestDist = distMap[ni];
            bestDX = DIRS[d].dx;
            bestDZ = DIRS[d].dz;
          }
        }

        flowMap[i] = { dx: bestDX, dz: bestDZ };
      }
    }
  }

  // 获取某个世界坐标处的流场方向
  function getFlowDirection(wx, wz) {
    const cell = worldToCell(wx, wz);
    if (!inBounds(cell.cx, cell.cz)) {
      // 不在网格范围内，直接朝目标移动
      const dx = lastTargetX - wx;
      const dz = lastTargetZ - wz;
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len > 0.1) return { x: dx / len, z: dz / len };
      return { x: 0, z: 0 };
    }

    const i = idx(cell.cx, cell.cz);
    const flow = flowMap[i];

    if (!flow) {
      // 在障碍物上或不可达区域，直接朝目标移动
      const dx = lastTargetX - wx;
      const dz = lastTargetZ - wz;
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len > 0.1) return { x: dx / len, z: dz / len };
      return { x: 0, z: 0 };
    }

    // 流场方向归一化
    const len = Math.sqrt(flow.dx * flow.dx + flow.dz * flow.dz);
    if (len > 0.01) {
      return { x: flow.dx / len, z: flow.dz / len };
    }
    return { x: 0, z: 0 };
  }

  // 检查是否需要更新
  function needsUpdate(targetWX, targetWZ, currentTime) {
    // 目标移动超过2格才更新
    const dx = Math.abs(targetWX - lastTargetX);
    const dz = Math.abs(targetWZ - lastTargetZ);
    const cellDist = Math.sqrt(dx * dx + dz * dz);
    return cellDist > CELL_SIZE * 2 || needsRebuild || (currentTime - lastUpdateTime > UPDATE_INTERVAL * 3);
  }

  // 主更新函数（每帧调用）
  function update(targetWX, targetWZ, currentTime, dt) {
    if (!costMap) init();

    // 检查是否需要重建代价地图（碰撞器变化时）
    if (needsRebuild) {
      rebuildCostMap();
    }

    // 检查是否需要更新流场
    if (needsUpdate(targetWX, targetWZ, currentTime)) {
      if (!isComputing) {
        isComputing = true;
        computeFlowField(targetWX, targetWZ);
        lastTargetX = targetWX;
        lastTargetZ = targetWZ;
        lastUpdateTime = currentTime;
        isComputing = false;
      }
    }
  }

  // 标记需要重建代价地图
  function markDirty() {
    needsRebuild = true;
  }

  // 获取统计信息（调试用）
  function getStats() {
    let walkable = 0;
    let blocked = 0;
    let reachable = 0;
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      if (costMap[i] === Infinity) blocked++;
      else {
        walkable++;
        if (distMap[i] < Infinity) reachable++;
      }
    }
    return {
      gridSize: GRID_SIZE,
      cellSize: CELL_SIZE,
      total: GRID_SIZE * GRID_SIZE,
      walkable,
      blocked,
      reachable,
      targetCell: `${targetCellX}, ${targetCellZ}`
    };
  }

  return {
    init,
    update,
    getFlowDirection,
    markDirty,
    getStats,
    rebuildCostMap
  };
})();

// 暴露到全局
window.FlowField = FlowField;
