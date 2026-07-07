// Tower map system - 杀戮之塔模式
// 完全参考杀戮之塔(Slay the Spire)的地图设计：
// - 分支路径：每层有多个节点，玩家只能选择一个
// - 路径连接：节点之间通过路径连接，只能前往连接的下一层节点
// - 不可回头：选择一个节点后，同层其他节点变为不可达
// - 分叉与合并：路径可以分叉和合并，增加策略性
// - 特殊层：第1层是休息处，Boss前一层有休息+商店

export const NODE_TYPES = {
  BATTLE: 'battle',      // 普通战斗
  ELITE: 'elite',        // 精英战斗（更强，奖励更好）
  EVENT: 'event',        // 随机事件
  SHOP: 'shop',          // 商店
  REST: 'rest',          // 休息处（自动休息，可锻造）
  BOSS: 'boss'           // Boss战斗
};

export const EVENT_TYPES = {
  TREASURE: 'treasure',      // 宝箱（获得金币/植物）
  TRAP: 'trap',              // 陷阱（损失生命值/植物）
  CHOICE: 'choice',          // 选择事件（二选一）
  MYSTERY: 'mystery'         // 神秘事件（随机效果）
};

// 塔层配置（参考杀戮之塔的15层结构，调整为11层）
export const TOWER_CONFIG = {
  floorsPerRun: 11,          // 每次轮回11层（用户要求总长度增加一格）
  bossFloor: 11,             // 第11层是Boss
  // 每层节点数量范围
  minNodesPerFloor: 3,
  maxNodesPerFloor: 4,
  // 节点类型概率（普通层）
  eliteChance: 0.12,         // 12%概率出现精英
  eventChance: 0.22,         // 22%概率出现事件
  shopChance: 0.06,          // 6%概率出现商店
  restChance: 0.06,          // 6%概率出现休息
  // 特殊层配置（参考杀戮之塔）
  // 第1层：休息处（玩家在此准备）
  // 第10层（Boss前）：必有休息处和商店
  restFloors: [1, 10],       // 第1层和第10层必有休息处
  shopFloors: [10],          // 第10层必有商店
  eliteFloors: [4, 7],       // 第4层和第7层必有精英
  eventFloors: [2, 6],       // 第2层和第6层必有事件
};

// 生成单层地图节点
function generateFloorNodes(floor, config = TOWER_CONFIG) {
  const isBossFloor = floor === config.bossFloor;

  if (isBossFloor) {
    // Boss层只有一个Boss节点
    return [{
      type: NODE_TYPES.BOSS,
      id: `floor_${floor}_boss`,
      completed: false,
      accessible: false,
      nextNodes: []
    }];
  }

  // 第1层：休息处（玩家在此准备，选择路径）
  if (floor === 1) {
    return [{
      type: NODE_TYPES.REST,
      id: `floor_${floor}_rest`,
      completed: false,
      accessible: true, // 起点默认可访问
      nextNodes: []
    }];
  }

  // 确定节点数量（3-4个）
  const nodeCount = 3 + Math.floor(Math.random() * 2); // 3或4个

  const nodes = [];
  const forcedTypes = [];

  // 强制节点类型（特殊层）
  if (config.restFloors.includes(floor)) {
    forcedTypes.push(NODE_TYPES.REST);
  }
  if (config.shopFloors.includes(floor)) {
    forcedTypes.push(NODE_TYPES.SHOP);
  }
  if (config.eliteFloors.includes(floor)) {
    forcedTypes.push(NODE_TYPES.ELITE);
  }
  if (config.eventFloors.includes(floor)) {
    forcedTypes.push(NODE_TYPES.EVENT);
  }

  // 生成节点
  for (let i = 0; i < nodeCount; i++) {
    let nodeType;

    // 优先使用强制类型
    if (i < forcedTypes.length) {
      nodeType = forcedTypes[i];
    } else {
      // 随机生成节点类型（战斗为主）
      const rand = Math.random();
      if (rand < config.eliteChance) {
        nodeType = NODE_TYPES.ELITE;
      } else if (rand < config.eliteChance + config.eventChance) {
        nodeType = NODE_TYPES.EVENT;
      } else if (rand < config.eliteChance + config.eventChance + config.shopChance) {
        nodeType = NODE_TYPES.SHOP;
      } else if (rand < config.eliteChance + config.eventChance + config.shopChance + config.restChance) {
        nodeType = NODE_TYPES.REST;
      } else {
        nodeType = NODE_TYPES.BATTLE;
      }
    }

    nodes.push({
      type: nodeType,
      id: `floor_${floor}_node_${i}`,
      completed: false,
      accessible: false,
      nextNodes: [],
      eventType: nodeType === NODE_TYPES.EVENT ? generateEventType() : null
    });
  }

  // 打乱节点顺序（除了强制类型已在前面）
  for (let i = forcedTypes.length; i < nodes.length; i++) {
    const j = i + Math.floor(Math.random() * (nodes.length - i));
    [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
  }

  return nodes;
}

// 生成节点之间的连接路径（杀戮之塔风格：分叉与合并）
// 参考杀戮之塔的路径生成算法：
// - 每个节点连接到下一层的1-2个节点
// - 确保下一层每个节点至少被一个上层节点连接
// - 路径可以分叉和合并，形成网状结构
function connectFloorNodes(floors, config = TOWER_CONFIG) {
  for (let f = 0; f < floors.length - 1; f++) {
    const currentFloor = floors[f];
    const nextFloor = floors[f + 1];
    const currentNodes = currentFloor.nodes;
    const nextNodes = nextFloor.nodes;

    // Boss层：所有上层节点都连接到Boss
    if (nextFloor.isBossFloor) {
      currentNodes.forEach(node => {
        node.nextNodes = nextNodes.map(n => n.id);
      });
      continue;
    }

    // 杀戮之塔风格路径生成
    // 1. 为每个当前层节点分配1-2个下一层节点连接
    // 2. 确保下一层每个节点至少被一个上层节点连接
    // 3. 路径可以分叉和合并

    const nextNodeAssignments = new Array(nextNodes.length).fill(0);
    const connectionsByNode = new Map();

    currentNodes.forEach((node, idx) => {
      const connections = [];

      // 每个节点至少连接1个下一层节点
      // 优先连接到尚未被连接的下一层节点
      const unassigned = nextNodes
        .map((n, i) => ({ node: n, index: i }))
        .filter(item => nextNodeAssignments[item.index] === 0);

      // 按位置就近连接（模拟地理路径）
      const currentNodePos = currentNodes.length === 1 ? 0.5 : idx / (currentNodes.length - 1);

      if (unassigned.length > 0) {
        // 找到位置最接近的未分配节点
        unassigned.sort((a, b) => {
          const posA = nextNodes.length === 1 ? 0.5 : a.index / (nextNodes.length - 1);
          const posB = nextNodes.length === 1 ? 0.5 : b.index / (nextNodes.length - 1);
          return Math.abs(posA - currentNodePos) - Math.abs(posB - currentNodePos);
        });

        connections.push(unassigned[0].node.id);
        nextNodeAssignments[unassigned[0].index]++;

        // 40%概率再连接一个相邻节点（分叉）
        if (Math.random() < 0.4 && unassigned.length > 1) {
          connections.push(unassigned[1].node.id);
          nextNodeAssignments[unassigned[1].index]++;
        }
      }

      // 如果没有未分配的节点，随机连接最近的节点
      if (connections.length === 0) {
        const sorted = nextNodes
          .map((n, i) => ({ node: n, index: i }))
          .sort((a, b) => {
            const posA = nextNodes.length === 1 ? 0.5 : a.index / (nextNodes.length - 1);
            const posB = nextNodes.length === 1 ? 0.5 : b.index / (nextNodes.length - 1);
            return Math.abs(posA - currentNodePos) - Math.abs(posB - currentNodePos);
          });
        connections.push(sorted[0].node.id);
        nextNodeAssignments[sorted[0].index]++;
      }

      // 额外30%概率添加一个随机连接（增加路径多样性）
      if (connections.length === 1 && Math.random() < 0.3) {
        const available = nextNodes
          .filter(n => !connections.includes(n.id))
          .map(n => n.id);
        if (available.length > 0) {
          connections.push(available[Math.floor(Math.random() * available.length)]);
        }
      }

      connectionsByNode.set(node.id, connections);
      node.nextNodes = connections;
    });

    // 确保下一层每个节点至少有一个连接（修复孤立节点）
    nextNodes.forEach((nextNode, idx) => {
      if (nextNodeAssignments[idx] === 0) {
        // 找到位置最接近的当前层节点并连接
        const nextNodePos = nextNodes.length === 1 ? 0.5 : idx / (nextNodes.length - 1);
        let closestNode = currentNodes[0];
        let closestDist = Infinity;
        currentNodes.forEach((node, nodeIdx) => {
          const nodePos = currentNodes.length === 1 ? 0.5 : nodeIdx / (currentNodes.length - 1);
          const dist = Math.abs(nodePos - nextNodePos);
          if (dist < closestDist) {
            closestDist = dist;
            closestNode = node;
          }
        });
        if (!closestNode.nextNodes.includes(nextNode.id)) {
          closestNode.nextNodes.push(nextNode.id);
        }
        nextNodeAssignments[idx]++;
      }
    });
  }
}

// 生成随机事件类型
function generateEventType() {
  const types = Object.values(EVENT_TYPES);
  return types[Math.floor(Math.random() * types.length)];
}

// 生成单层地图（兼容旧接口）
export function generateTowerMap(floor, config = TOWER_CONFIG) {
  const nodes = generateFloorNodes(floor, config);
  const isBossFloor = floor === config.bossFloor;
  return {
    floor,
    nodes,
    isBossFloor,
    isRestFloor: config.restFloors.includes(floor),
    isShopFloor: config.shopFloors.includes(floor)
  };
}

// 生成完整轮回地图（杀戮之塔风格分支路径）
export function generateFullTowerMap(startFloor = 1, config = TOWER_CONFIG) {
  const floors = [];
  for (let i = 0; i < config.floorsPerRun; i++) {
    const floorNum = startFloor + i;
    const floorData = generateTowerMap(floorNum, config);
    floors.push(floorData);
  }

  // 连接各层节点（生成分支路径）
  connectFloorNodes(floors, config);

  return floors;
}

// 节点图标和名称
export const NODE_INFO = {
  [NODE_TYPES.BATTLE]: {
    icon: '⚔️',
    name: '战斗',
    color: '#E53935'
  },
  [NODE_TYPES.ELITE]: {
    icon: '💀',
    name: '精英',
    color: '#7B1FA2'
  },
  [NODE_TYPES.EVENT]: {
    icon: '❓',
    name: '事件',
    color: '#FFA000'
  },
  [NODE_TYPES.SHOP]: {
    icon: '🛒',
    name: '商店',
    color: '#4CAF50'
  },
  [NODE_TYPES.REST]: {
    icon: '🏕️',
    name: '休息',
    color: '#2196F3'
  },
  [NODE_TYPES.BOSS]: {
    icon: '👹',
    name: 'Boss',
    color: '#D32F2F'
  }
};

// 事件描述
export const EVENT_DESCRIPTIONS = {
  [EVENT_TYPES.TREASURE]: {
    title: '发现宝箱！',
    description: '你发现了一个闪闪发光的宝箱...',
    choices: [
      { text: '打开宝箱', effect: 'gain_coins', value: 100 },
      { text: '小心离开', effect: 'nothing' }
    ]
  },
  [EVENT_TYPES.TRAP]: {
    title: '触发陷阱！',
    description: '糟糕，你踩到了一个隐藏陷阱...',
    choices: [
      { text: '尝试解除', effect: 'lose_hp', value: 10 },
      { text: '快速逃离', effect: 'lose_coins', value: 50 }
    ]
  },
  [EVENT_TYPES.CHOICE]: {
    title: '神秘旅人',
    description: '一个神秘的旅人出现在你面前...',
    choices: [
      { text: '赠送礼物（-50金币）', effect: 'gain_plant', value: 1 },
      { text: '请求帮助（+5生命值）', effect: 'gain_hp', value: 5 },
      { text: '无视他', effect: 'nothing' }
    ]
  },
  [EVENT_TYPES.MYSTERY]: {
    title: '神秘光芒',
    description: '一道神秘的光芒包围了你...',
    choices: [
      { text: '接受祝福', effect: 'random_buff' },
      { text: '谨慎离开', effect: 'nothing' }
    ]
  }
};
