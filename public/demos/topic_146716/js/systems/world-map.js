// ============================================================
// 世界地图（节点地图）系统
// ============================================================

// 世界地图数据
const WORLD_MAP_DATA = {
  nodes: [
    { id: 'city', name: '废弃城市', desc: '丧尸横行的废墟都市，高楼林立但危机四伏。波次防御模式，每5波出现Boss。', x: 50, y: 50, unlocked: true, currentWave: 0, icon: '🏙️', color: '#4a90d9', mapSize: 200 },
    { id: 'snow', name: '霜寒禁区', desc: '常年暴雪的雪山公路，信号塔损坏后丧尸变异加剧。需要修复电源、启动信号塔才能撤离。', x: 20, y: 25, unlocked: false, currentWave: 0, icon: '❄️', color: '#88ccee', mapSize: 300, requireWave: 20 },
    { id: 'desert', name: '灼热荒漠', desc: '废弃基地 surrounded by 城墙，有军火商、赏金猎人、营地管理者等NPC。沙尘暴天气干扰视线，蝎子/沙虫/秃鹫等怪物出没。', x: 80, y: 25, unlocked: false, currentWave: 0, icon: '🏜️', color: '#e8a838', requireWave: 0, requireNode: 'snow' },
    { id: 'swamp', name: '毒雾沼泽', desc: '瘴气弥漫的死寂之地，巨型植物横行', x: 20, y: 75, unlocked: false, currentWave: 0, icon: '🌿', color: '#4a8a4a', requireWave: 0, requireNode: 'city' },
    { id: 'island', name: '孤岛基地', desc: '四面环海的神秘岛屿，潮汐涨落无常', x: 50, y: 85, unlocked: false, currentWave: 0, icon: '🏝️', color: '#38b8a8', requireWave: 0, requireNode: 'desert' },
    { id: 'volcano', name: '熔岩地狱', desc: '火山喷发的焦土，岩浆吞噬一切', x: 80, y: 75, unlocked: false, currentWave: 0, icon: '🌋', color: '#d44a2a', requireWave: 0, requireNode: 'swamp' }
  ],
  connections: [
    ['city', 'snow'], ['city', 'swamp'], ['snow', 'desert'], ['swamp', 'island'], ['desert', 'volcano'], ['swamp', 'volcano']
  ]
};

// 敌人类型映射
const NODE_ENEMY_TYPES = {
  city: '普通僵尸 / 快速僵尸 / 胖子僵尸 / 精英僵尸 / 暴君',
  snow: '冻尸行者 / 霜狼丧尸 / 冰甲巨尸 / 极地暴君 / 雪崩巨兽',
  desert: '毒蝎 / 沙虫 / 秃鹫 / 干尸行者 / 荒漠暴君 / 沙虫巨兽',
  swamp: '毒沼巨蛙 / 腐化藤蔓',
  island: '深海怪物 / 潮汐守卫',
  volcano: '熔岩元素 / 火焰恶魔'
};

// 当前所在节点
let currentNodeId = 'city';

// 地图覆盖层DOM引用
let mapOverlay = null;

// ============================================================
// 初始化：加载存档中的解锁状态
// ============================================================
function init() {
  try {
    const saved = localStorage.getItem('worldMapData');
    if (saved) {
      const data = JSON.parse(saved);
      // 恢复解锁状态、波次进度和完成状态
      WORLD_MAP_DATA.nodes.forEach(node => {
        if (data[node.id]) {
          node.unlocked = data[node.id].unlocked || false;
          node.currentWave = data[node.id].currentWave || 0;
          node.completed = data[node.id].completed || false;
        }
      });
      // 优先根据 currentMap 设置当前节点（更可靠）
      if (data.currentMap === 'snow') {
        currentNodeId = 'snow';
      } else if (data.currentMap === 'desert') {
        currentNodeId = 'desert';
      } else if (data.currentMap === 'island') {
        currentNodeId = 'island';
      } else if (data.currentMap === 'swamp') {
        currentNodeId = 'swamp';
      } else if (data.currentNodeId) {
        currentNodeId = data.currentNodeId;
      }
    }
  } catch (e) {
    console.warn('[WorldMap] 加载存档失败:', e);
  }
}

// ============================================================
// 保存地图数据到 localStorage
// ============================================================
function saveData() {
  try {
    const data = {};
    WORLD_MAP_DATA.nodes.forEach(node => {
      data[node.id] = {
        unlocked: node.unlocked,
        currentWave: node.currentWave,
        completed: node.completed || false
      };
    });
    data.currentNodeId = currentNodeId;
    data.currentMap = window.currentMap || 'city';

    // 保存雪山任务阶段
    if (window.SnowMap) {
      data.snowPhase = SnowMap.phase;
      data.snowWave = SnowMap.defenseWave;
      data.snowCompleted = SnowMap.phase === 'complete';
    }

    // 保存沙漠任务阶段
    if (window.DesertMap) {
      data.desertPhase = DesertMap.phase;
      data.desertWave = DesertMap.defenseWave;
      data.desertCompleted = DesertMap.phase === 'complete';
    }

    // 保存沼泽任务阶段
    if (window.SwampMap) {
      data.swampPhase = SwampMap.phase;
      data.swampWave = SwampMap.defenseWave;
      data.swampCompleted = SwampMap.defenseWave >= SwampMap.maxWaves;
    }

    // 保存孤岛基地任务状态
    if (window.IslandBase) {
      data.islandFishingQuest = IslandBase.fishingQuestState;
      data.islandMutationQuest = IslandBase.mutationQuestState;
      data.islandBaseUpgrades = IslandBase.baseUpgrades;
    }

    // 保存城市波次
    data.cityWave = typeof wave !== 'undefined' ? wave : 0;

    // 保存玩家数据
    if (window.player) {
      data.playerSkills = window.player.skills;
      data.playerPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    }

    // 保存武器数据
    if (window.weapons) {
      data.weapons = weapons.map(w => ({
        id: w.id,
        ammo: w.ammo,
        reserve: w.reserve,
        level: w.level || 1
      }));
    }

    // 保存队友数据
    if (window.allies && allies.length > 0) {
      data.allies = allies.map(a => ({
        type: a.type,
        hp: a.hp,
        maxHp: a.maxHp,
        level: a.level || 1
      }));
    }

    // 保存工事/炮塔数据
    if (window.deployedFortifications && deployedFortifications.length > 0) {
      data.fortifications = deployedFortifications.map(f => ({
        type: f.type,
        x: f.mesh ? f.mesh.position.x : 0,
        z: f.mesh ? f.mesh.position.z : 0,
        health: f.health,
        maxHealth: f.maxHealth
      }));
    }

    localStorage.setItem('worldMapData', JSON.stringify(data));
    console.log('[WorldMap] 存档已保存');
  } catch (e) {
    console.warn('[WorldMap] 保存存档失败:', e);
  }
}

// ============================================================
// 获取地图数据
// ============================================================
function getData() {
  return {
    nodes: WORLD_MAP_DATA.nodes,
    connections: WORLD_MAP_DATA.connections,
    currentNodeId: currentNodeId
  };
}

// ============================================================
// 判断节点是否可达（前置节点已解锁）
// ============================================================
function isNodeReachable(node) {
  if (node.unlocked) return true;
  // 如果没有前置节点要求，检查波次要求
  if (!node.requireNode) {
    if (node.requireWave !== undefined && node.requireWave > 0) {
      const currentWave = window.wave || 0;
      return currentWave >= node.requireWave;
    }
    return true;
  }
  // 有前置节点要求，检查前置节点是否已解锁
  const requiredNode = WORLD_MAP_DATA.nodes.find(n => n.id === node.requireNode);
  return requiredNode && requiredNode.unlocked;
}

// ============================================================
// 解锁节点
// ============================================================
function unlockNode(nodeId) {
  const node = WORLD_MAP_DATA.nodes.find(n => n.id === nodeId);
  if (!node) return;
  if (node.unlocked) return;
  node.unlocked = true;
  saveData();
  console.log('[WorldMap] 节点已解锁:', node.name);
}

// ============================================================
// 选择节点并传送
// ============================================================
function selectNode(nodeId) {
  const node = WORLD_MAP_DATA.nodes.find(n => n.id === nodeId);
  if (!node || !node.unlocked) return;

  if (nodeId === currentNodeId) {
    if (typeof showToast === 'function') showToast('你已在该地图中', 'info');
    return;
  }

  // 显示确认弹窗（不使用confirm，避免指针锁定问题）
  showConfirmDialog(node.name, function() {
    currentNodeId = nodeId;
    saveData();
    hideWorldMap();

    // 执行实际传送
    if (nodeId === 'snow' && typeof window.travelToSnowMap === 'function') {
      window.travelToSnowMap();
    } else if (nodeId === 'city' && typeof window.travelToCityMap === 'function') {
      window.travelToCityMap();
    } else if (nodeId === 'desert' && typeof window.travelToDesertMap === 'function') {
      window.travelToDesertMap();
    } else if (nodeId === 'island' && typeof window.travelToIslandMap === 'function') {
      window.travelToIslandMap();
    } else if (nodeId === 'swamp' && typeof window.travelToSwampMap === 'function') {
      window.travelToSwampMap();
    } else if (typeof showToast === 'function') {
      showToast('已传送至 ' + node.name, 'success');
    }
  });
}

// 自定义确认弹窗
function showConfirmDialog(mapName, onConfirm) {
  // 移除旧弹窗
  const old = document.getElementById('world-map-confirm');
  if (old) old.remove();

  const dialog = document.createElement('div');
  dialog.id = 'world-map-confirm';
  dialog.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10001;display:flex;justify-content:center;align-items:center;background:rgba(0,0,0,0.6);';
  dialog.innerHTML = `
    <div style="background:linear-gradient(135deg,#1a2a3a,#0d1b2a);border:2px solid #4488aa;border-radius:12px;padding:30px 40px;text-align:center;max-width:400px;">
      <div style="font-size:18px;color:#88ccee;margin-bottom:15px;">是否前往</div>
      <div style="font-size:22px;font-weight:bold;color:#ffffff;margin-bottom:25px;">${mapName}</div>
      <div style="display:flex;gap:15px;justify-content:center;">
        <button id="wm-confirm-yes" style="padding:10px 30px;background:linear-gradient(90deg,#2a5a7a,#3a7a9a);border:1px solid #4488aa;border-radius:8px;color:#fff;font-size:15px;cursor:pointer;">确认前往</button>
        <button id="wm-confirm-no" style="padding:10px 30px;background:rgba(255,255,255,0.1);border:1px solid #555;border-radius:8px;color:#aaa;font-size:15px;cursor:pointer;">取消</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);

  document.getElementById('wm-confirm-yes').onclick = function() {
    dialog.remove();
    onConfirm();
  };
  document.getElementById('wm-confirm-no').onclick = function() {
    dialog.remove();
  };
}

// ============================================================
// 显示世界地图UI
// ============================================================
function showWorldMap() {
  // 如果已显示则隐藏（toggle逻辑）
  if (mapOverlay && mapOverlay.style.display !== 'none') {
    hideWorldMap();
    return;
  }

  // 同步当前节点ID与实际地图（避免显示位置和实际位置不一致）
  if (window.currentMap) {
    currentNodeId = window.currentMap;
  }

  // 创建覆盖层
  if (!mapOverlay) {
    mapOverlay = document.createElement('div');
    mapOverlay.id = 'world-map-overlay';
    document.body.appendChild(mapOverlay);
  }

  mapOverlay.style.display = 'flex';
  renderMap();

  // 标记地图为打开状态
  window.WorldMap.isOpen = true;

  // 暂停游戏（通过全局函数，因为gameState是game.js的局部变量）
  if (window.pauseGameState) window.pauseGameState();
  document.exitPointerLock();
  document.body.style.cursor = 'default';
}

// ============================================================
// 隐藏世界地图
// ============================================================
function hideWorldMap() {
  if (mapOverlay) {
    mapOverlay.style.display = 'none';
  }
  // 标记地图为关闭状态
  window.WorldMap.isOpen = false;
  // 恢复游戏（通过全局函数）
  if (window.resumeGameState) window.resumeGameState();
  document.body.style.cursor = 'none';
  const canvas = window.renderer ? renderer.domElement : null;
  if (canvas) {
    // 直接请求指针锁定，不需要先exit再request
    if (window.gameState === 'playing' && !window.shelterPauseState) {
      canvas.requestPointerLock().catch(() => {});
    }
  }
}

// ============================================================
// 渲染地图到HTML
// ============================================================
function renderMap() {
  if (!mapOverlay) return;

  const mapWidth = 700;
  const mapHeight = 580;

  // 构建 SVG 连接线
  let connectionsSVG = '';
  WORLD_MAP_DATA.connections.forEach(([fromId, toId]) => {
    const fromNode = WORLD_MAP_DATA.nodes.find(n => n.id === fromId);
    const toNode = WORLD_MAP_DATA.nodes.find(n => n.id === toId);
    if (!fromNode || !toNode) return;

    const x1 = fromNode.x / 100 * mapWidth;
    const y1 = fromNode.y / 100 * mapHeight;
    const x2 = toNode.x / 100 * mapWidth;
    const y2 = toNode.y / 100 * mapHeight;

    const bothUnlocked = fromNode.unlocked && toNode.unlocked;
    const strokeColor = bothUnlocked ? fromNode.color : '#333';
    const strokeOpacity = bothUnlocked ? 0.8 : 0.3;

    connectionsSVG += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" ' +
      'stroke="' + strokeColor + '" stroke-width="2" stroke-dasharray="8,4" opacity="' + strokeOpacity + '"/>';
  });

  // 构建节点HTML
  let nodesHTML = '';
  WORLD_MAP_DATA.nodes.forEach(node => {
    const px = node.x / 100 * mapWidth;
    const py = node.y / 100 * mapHeight;
    const isCurrent = node.id === currentNodeId;
    const isReachable = isNodeReachable(node);

    let nodeClass = 'wm-node';
    let nodeStyle = '';
    let innerHTML = '';

    if (node.unlocked) {
      nodeClass += ' unlocked';
      if (isCurrent) {
        nodeClass += ' current';
        nodeStyle = 'border-color: #ffd700; box-shadow: 0 0 15px rgba(255,215,0,0.6), 0 0 30px rgba(255,215,0,0.3);';
      } else {
        nodeStyle = 'border-color: ' + node.color + '; box-shadow: 0 0 10px ' + node.color + '40;';
      }
      innerHTML = '<span class="wm-node-icon">' + node.icon + '</span>';
      innerHTML += '<span class="wm-node-name">' + node.name + '</span>';
    } else if (isReachable) {
      nodeClass += ' reachable';
      nodeStyle = 'border-color: #666; opacity: 0.5;';
      innerHTML = '<span class="wm-node-icon" style="font-size:20px;">📡</span>';
      innerHTML += '<span class="wm-node-name" style="font-size:11px;">无信号地区</span>';
    } else {
      nodeClass += ' locked';
      nodeStyle = 'border-color: #333; opacity: 0.3;';
      innerHTML = '<span class="wm-node-icon" style="font-size:20px;">🔒</span>';
      innerHTML += '<span class="wm-node-name" style="font-size:11px; color:#666;">???</span>';
    }

    // Tooltip内容
    let tooltipContent = '<strong>' + node.name + '</strong>';
    if (node.unlocked) {
      tooltipContent += '<br>' + node.desc;
      // 显示实际波次（城市用wave，雪山用SnowMap.defenseWave）
      let displayWave = node.currentWave;
      if (isCurrent && window.SnowMap && SnowMap.active) {
        displayWave = SnowMap.defenseWave || 0;
      } else if (isCurrent && typeof window.wave !== 'undefined') {
        displayWave = window.wave;
      }
      tooltipContent += '<br>当前波次: ' + displayWave;
      tooltipContent += '<br>敌人: ' + (NODE_ENEMY_TYPES[node.id] || '未知');
      if (isCurrent) tooltipContent += '<br><span style="color:#ffd700;">★ 当前所在</span>';
    } else if (isReachable) {
      tooltipContent += '<br><span style="color:#888;">信号微弱，无法获取信息</span>';
      if (node.requireWave > 0) {
        tooltipContent += '<br>需要波次: ' + node.requireWave;
      }
    } else {
      tooltipContent += '<br><span style="color:#555;">未探索区域</span>';
    }

    nodesHTML += '<div class="' + nodeClass + '" ' +
      'style="left:' + px + 'px; top:' + py + 'px; ' + nodeStyle + '" ' +
      'data-node-id="' + node.id + '" ' +
      'onclick="window.WorldMap.selectNode(\'' + node.id + '\')">' +
      innerHTML +
      '<div class="wm-tooltip">' + tooltipContent + '</div>' +
      '</div>';
  });

  // 组装完整HTML
  mapOverlay.innerHTML = '' +
    '<style>' +
    '#world-map-overlay {' +
    '  position: fixed; top: 0; left: 0; right: 0; bottom: 0;' +
    '  background: rgba(0,0,0,0.9);' +
    '  display: flex; flex-direction: column; align-items: center; justify-content: center;' +
    '  z-index: 10000; font-family: "Microsoft YaHei", sans-serif;' +
    '}' +
    '.wm-title {' +
    '  color: #fff; font-size: 28px; font-weight: bold;' +
    '  margin-bottom: 20px; text-shadow: 0 0 20px rgba(255,255,255,0.3);' +
    '  letter-spacing: 8px;' +
    '}' +
    '.wm-close-btn {' +
    '  position: absolute; top: 20px; right: 25px;' +
    '  color: #aaa; font-size: 28px; cursor: pointer;' +
    '  width: 40px; height: 40px; line-height: 40px; text-align: center;' +
    '  border: 1px solid #555; border-radius: 6px; background: rgba(255,255,255,0.05);' +
    '  transition: all 0.2s;' +
    '}' +
    '.wm-close-btn:hover { color: #fff; border-color: #999; background: rgba(255,255,255,0.1); }' +
    '.wm-map-container {' +
    '  position: relative; width: ' + mapWidth + 'px; height: ' + mapHeight + 'px;' +
    '  background: #111; border: 2px solid #333; border-radius: 12px;' +
    '  overflow: hidden;' +
    '}' +
    '.wm-map-container::before {' +
    '  content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0;' +
    '  background-image: ' +
    '    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),' +
    '    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);' +
    '  background-size: 30px 30px; pointer-events: none;' +
    '}' +
    '.wm-map-svg {' +
    '  position: absolute; top: 0; left: 0; width: 100%; height: 100%;' +
    '  pointer-events: none;' +
    '}' +
    '.wm-node {' +
    '  position: absolute; transform: translate(-50%, -50%);' +
    '  width: 60px; height: 60px; border-radius: 50%;' +
    '  border: 3px solid #555; background: rgba(20,20,20,0.9);' +
    '  display: flex; flex-direction: column; align-items: center; justify-content: center;' +
    '  cursor: default; transition: all 0.3s; z-index: 2;' +
    '}' +
    '.wm-node.unlocked { cursor: pointer; }' +
    '.wm-node.unlocked:hover { transform: translate(-50%, -50%) scale(1.15); }' +
    '.wm-node.current {' +
    '  animation: wm-pulse 2s ease-in-out infinite;' +
    '}' +
    '.wm-node-icon { font-size: 32px; line-height: 1; }' +
    '.wm-node-name {' +
    '  font-size: 11px; color: #ccc; margin-top: 2px;' +
    '  white-space: nowrap; text-shadow: 0 1px 3px #000;' +
    '}' +
    '.wm-node.reachable .wm-node-name { color: #888; }' +
    '.wm-node.locked .wm-node-name { color: #555; }' +
    '.wm-tooltip {' +
    '  position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%);' +
    '  background: rgba(10,10,10,0.95); border: 1px solid #555; border-radius: 8px;' +
    '  padding: 10px 14px; font-size: 12px; color: #ccc;' +
    '  pointer-events: none; opacity: 0; transition: opacity 0.2s;' +
    '  z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.5);' +
    '  max-width: 220px; min-width: 160px; width: max-content;' +
    '  white-space: normal; word-wrap: break-word; line-height: 1.6;' +
    '  text-align: left;' +
    '}' +
    '.wm-node:hover .wm-tooltip { opacity: 1; }' +
    '.wm-node.reachable:hover .wm-tooltip { opacity: 0.7; }' +
    '.wm-hint {' +
    '  color: #666; font-size: 13px; margin-top: 16px;' +
    '  text-shadow: 0 1px 3px #000;' +
    '}' +
    '@keyframes wm-pulse {' +
    '  0%, 100% { box-shadow: 0 0 15px rgba(255,215,0,0.6), 0 0 30px rgba(255,215,0,0.3); }' +
    '  50% { box-shadow: 0 0 25px rgba(255,215,0,0.8), 0 0 50px rgba(255,215,0,0.5); }' +
    '}' +
    '</style>' +
    '<div class="wm-close-btn" onclick="window.WorldMap.hideWorldMap()">✕</div>' +
    '<div class="wm-title">世界地图</div>' +
    '<div class="wm-map-container">' +
    '<svg class="wm-map-svg" viewBox="0 0 ' + mapWidth + ' ' + mapHeight + '">' +
    connectionsSVG +
    '</svg>' +
    nodesHTML +
    '</div>' +
    '<div class="wm-hint">点击已解锁节点前往该地图</div>';
}

// ============================================================
// 导出
// ============================================================
window.WorldMap = {
  init: init,
  showWorldMap: showWorldMap,
  hideWorldMap: hideWorldMap,
  unlockNode: unlockNode,
  selectNode: selectNode,
  renderMap: renderMap,
  getData: getData,
  saveData: saveData,
  WORLD_MAP_DATA: WORLD_MAP_DATA
};
