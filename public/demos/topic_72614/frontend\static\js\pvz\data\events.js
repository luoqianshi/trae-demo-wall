// 事件对话系统 - 杀戮尖塔风格多样化事件
// 每个事件包含多段对话和多个选项，选项有不同效果
// 事件类型：获取植物、杂交能源、免费杂交、花钱提升、特殊植物等

// 事件效果类型:
// gain_plants - 获得基础植物(随机)
// gain_special_plant - 获得特殊植物(不可杂交)
// gain_energy - 获得杂交能源
// gain_coins - 获得金币
// lose_coins - 失去金币
// gain_hp - 恢复生命
// lose_hp - 失去生命
// free_hybrid - 免费杂交一次
// gain_mutation - 给已有植物添加变异
// nothing - 无效果
// random - 随机效果

export const EVENTS = [
  // === 初始对话事件 ===
  {
    id: 'intro',
    title: '冒险开始',
    dialogues: [
      { speaker: '疯狂戴夫', text: '嘿！你终于来了！僵尸大军正在逼近，我们需要你的帮助！' },
      { speaker: '疯狂戴夫', text: '我这里有一些植物种子，你可以从中选择10株作为你的初始阵容。' },
      { speaker: '疯狂戴夫', text: '对了，还有这些蓝色杂交能源，送你2个，以后杂交植物时用得上！' },
      { speaker: '疯狂戴夫', text: '记住，多余的植物可以用来杂交，创造出更强大的植物！' }
    ],
    choices: [
      { text: '选择10株植物开始冒险', effect: 'initial_plant_select' }
    ]
  },

  // === 获取基础植物事件 ===
  {
    id: 'wandering_merchant',
    title: '流浪商人',
    dialogues: [
      { speaker: '流浪商人', text: '你好啊，旅行者！我这里有一些植物种子出售。' },
      { speaker: '流浪商人', text: '虽然不是什么稀有品种，但在战斗中也能派上用场。' },
      { speaker: '流浪商人', text: '50金币换2株随机植物，怎么样？' }
    ],
    choices: [
      { text: '购买（-50金币，+2植物）', effect: 'gain_plants', value: 2, cost: { coins: 50 } },
      { text: '讨价还价（-30金币，+1植物）', effect: 'gain_plants', value: 1, cost: { coins: 30 } },
      { text: '婉拒离开', effect: 'nothing' }
    ]
  },
  {
    id: 'abandoned_garden',
    title: '废弃花园',
    dialogues: [
      { speaker: '旁白', text: '你发现了一个被遗弃的花园，里面还长着一些植物。' },
      { speaker: '旁白', text: '虽然有些杂草丛生，但有些植物看起来还活着。' },
      { speaker: '疯狂戴夫', text: '这些植物虽然普通，但聊胜于无！' }
    ],
    choices: [
      { text: '采集植物（+1随机植物）', effect: 'gain_plants', value: 1 },
      { text: '仔细搜索（+2随机植物，-5HP）', effect: 'gain_plants', value: 2, cost: { hp: 5 } },
      { text: '不感兴趣', effect: 'nothing' }
    ]
  },
  {
    id: 'plant_auction',
    title: '植物拍卖会',
    dialogues: [
      { speaker: '拍卖师', text: '欢迎来到地下植物拍卖会！' },
      { speaker: '拍卖师', text: '今天我们有3株优质植物拍卖，一口价100金币！' },
      { speaker: '拍卖师', text: '当然，你也可以只买1株，50金币。' }
    ],
    choices: [
      { text: '买3株（-100金币）', effect: 'gain_plants', value: 3, cost: { coins: 100 } },
      { text: '买1株（-50金币）', effect: 'gain_plants', value: 1, cost: { coins: 50 } },
      { text: '离开', effect: 'nothing' }
    ]
  },

  // === 获取杂交能源事件 ===
  {
    id: 'energy_crystal',
    title: '能源水晶',
    dialogues: [
      { speaker: '旁白', text: '你发现了一块闪闪发光的水晶，里面蕴含着杂交能源。' },
      { speaker: '疯狂戴夫', text: '这是杂交能源！有了它就能杂交植物了！' },
      { speaker: '旁白', text: '水晶散发着不同颜色的光芒，你只能选择一个。' }
    ],
    choices: [
      { text: '蓝色水晶（+2蓝色能源）', effect: 'gain_energy', value: { grade: 'blue', amount: 2 } },
      { text: '紫色水晶（+1紫色能源）', effect: 'gain_energy', value: { grade: 'purple', amount: 1 } },
      { text: '全部拿走（+1蓝色，-10HP）', effect: 'gain_energy', value: { grade: 'blue', amount: 1 }, cost: { hp: 10 } }
    ]
  },
  {
    id: 'alchemy_lab',
    title: '炼金实验室',
    dialogues: [
      { speaker: '炼金术士', text: '欢迎来到我的实验室！' },
      { speaker: '炼金术士', text: '我可以为你提炼杂交能源，但需要一些金币作为材料费。' },
      { speaker: '炼金术士', text: '蓝色能源80金币，紫色能源200金币，金色能源500金币。' }
    ],
    choices: [
      { text: '提炼蓝色能源（-80金币，+2蓝色）', effect: 'gain_energy', value: { grade: 'blue', amount: 2 }, cost: { coins: 80 } },
      { text: '提炼紫色能源（-200金币，+1紫色）', effect: 'gain_energy', value: { grade: 'purple', amount: 1 }, cost: { coins: 200 } },
      { text: '提炼金色能源（-500金币，+1金色）', effect: 'gain_energy', value: { grade: 'gold', amount: 1 }, cost: { coins: 500 } },
      { text: '离开', effect: 'nothing' }
    ]
  },
  {
    id: 'energy_spring',
    title: '能源之泉',
    dialogues: [
      { speaker: '旁白', text: '你发现了一口神秘的泉水，水中散发着能源的光芒。' },
      { speaker: '旁白', text: '饮用泉水可以获得能源，但可能会有些副作用。' },
      { speaker: '疯狂戴夫', text: '免费的能源！但天下没有白吃的午餐...' }
    ],
    choices: [
      { text: '大口饮用（+3蓝色能源，-15HP）', effect: 'gain_energy', value: { grade: 'blue', amount: 3 }, cost: { hp: 15 } },
      { text: '小口品尝（+1蓝色能源）', effect: 'gain_energy', value: { grade: 'blue', amount: 1 } },
      { text: '装满水壶离开（+1蓝色，+1紫色，-20HP）', effect: 'multi', value: [
        { type: 'gain_energy', grade: 'blue', amount: 1 },
        { type: 'gain_energy', grade: 'purple', amount: 1 }
      ], cost: { hp: 20 } }
    ]
  },

  // === 免费杂交事件 ===
  {
    id: 'mysterious_greenhouse',
    title: '神秘温室',
    dialogues: [
      { speaker: '旁白', text: '你发现了一座神秘的温室，里面有一位老园丁。' },
      { speaker: '老园丁', text: '年轻人，我可以免费帮你杂交一次植物。' },
      { speaker: '老园丁', text: '不需要能源，只需要你提供两株植物就行。' },
      { speaker: '疯狂戴夫', text: '这可是千载难逢的好机会！' }
    ],
    choices: [
      { text: '接受免费杂交', effect: 'free_hybrid' },
      { text: '婉拒（获得50金币）', effect: 'gain_coins', value: 50 }
    ]
  },

  // === 花钱提升事件 ===
  {
    id: 'plant_trainer',
    title: '植物训练师',
    dialogues: [
      { speaker: '训练师', text: '我可以帮你训练植物，让它变得更强！' },
      { speaker: '训练师', text: '100金币可以给一株植物随机添加一个变异词条。' },
      { speaker: '训练师', text: '200金币则可以添加两个变异词条！' }
    ],
    choices: [
      { text: '训练1个变异（-100金币）', effect: 'gain_mutation', value: 1, cost: { coins: 100 } },
      { text: '训练2个变异（-200金币）', effect: 'gain_mutation', value: 2, cost: { coins: 200 } },
      { text: '离开', effect: 'nothing' }
    ]
  },
  {
    id: 'black_market',
    title: '黑市',
    dialogues: [
      { speaker: '黑市商人', text: '嘿嘿，想买点好东西吗？' },
      { speaker: '黑市商人', text: '我这里有特殊植物种子，别的地方买不到！' },
      { speaker: '黑市商人', text: '300金币一株，不二价！' }
    ],
    choices: [
      { text: '购买特殊植物（-300金币）', effect: 'gain_special_plant', value: 1, cost: { coins: 300 } },
      { text: '购买并额外加购（-500金币，+2特殊植物）', effect: 'gain_special_plant', value: 2, cost: { coins: 500 } },
      { text: '离开', effect: 'nothing' }
    ]
  },

  // === 特殊植物事件 ===
  {
    id: 'ancient_ruins',
    title: '古代遗迹',
    dialogues: [
      { speaker: '旁白', text: '你来到了一处古代遗迹，石壁上刻着神秘的植物图案。' },
      { speaker: '旁白', text: '遗迹深处似乎有什么东西在发光...' },
      { speaker: '疯狂戴夫', text: '那是一种古老的特殊植物！快去看看！' }
    ],
    choices: [
      { text: '探索遗迹深处（+1特殊植物，-10HP）', effect: 'gain_special_plant', value: 1, cost: { hp: 10 } },
      { text: '搜索外围（+50金币）', effect: 'gain_coins', value: 50 },
      { text: '离开', effect: 'nothing' }
    ]
  },
  {
    id: 'plant_shrine',
    title: '植物神殿',
    dialogues: [
      { speaker: '旁白', text: '你发现了一座古老的植物神殿。' },
      { speaker: '旁白', text: '神殿中央有一株散发着奇异光芒的植物。' },
      { speaker: '神殿守护者', text: '这株植物蕴含着特殊的力量，它选择了你。' }
    ],
    choices: [
      { text: '接受特殊植物（+1特殊植物）', effect: 'gain_special_plant', value: 1 },
      { text: '献祭获得2株（-30HP，+2特殊植物）', effect: 'gain_special_plant', value: 2, cost: { hp: 30 } },
      { text: '拒绝并搜索神殿（+100金币，-5HP）', effect: 'gain_coins', value: 100, cost: { hp: 5 } }
    ]
  },
  {
    id: 'meteor_crash',
    title: '陨石坠落',
    dialogues: [
      { speaker: '旁白', text: '一颗陨石坠落在附近，砸出了一个大坑。' },
      { speaker: '旁白', text: '坑中似乎有什么东西在发光...' },
      { speaker: '疯狂戴夫', text: '是太空带来的特殊植物种子！' }
    ],
    choices: [
      { text: '挖掘陨石坑（+1特殊植物，-10HP）', effect: 'gain_special_plant', value: 1, cost: { hp: 10 } },
      { text: '收集陨石碎片（+80金币）', effect: 'gain_coins', value: 80 },
      { text: '离开', effect: 'nothing' }
    ]
  },

  // === 恢复/损失事件 ===
  {
    id: 'healing_spring',
    title: '治愈之泉',
    dialogues: [
      { speaker: '旁白', text: '你发现了一口清澈的泉水，散发着治愈的光芒。' },
      { speaker: '旁白', text: '饮用泉水可以恢复生命值。' }
    ],
    choices: [
      { text: '大口饮用（+30HP）', effect: 'gain_hp', value: 30 },
      { text: '装满水壶（+15HP，+1蓝色能源）', effect: 'multi', value: [
        { type: 'gain_hp', amount: 15 },
        { type: 'gain_energy', grade: 'blue', amount: 1 }
      ] },
      { text: '离开', effect: 'nothing' }
    ]
  },
  {
    id: 'zombie_ambush',
    title: '僵尸伏击',
    dialogues: [
      { speaker: '旁白', text: '一群僵尸突然从暗处冲出！' },
      { speaker: '旁白', text: '你勉强逃脱，但受了些伤。' },
      { speaker: '疯狂戴夫', text: '好险！下次要小心点！' }
    ],
    choices: [
      { text: '检查伤势（-15HP）', effect: 'lose_hp', value: 15 },
      { text: '丢下物资逃跑（-30金币）', effect: 'lose_coins', value: 30 }
    ]
  },

  // === 随机/赌博事件 ===
  {
    id: 'mysterious_dice',
    title: '神秘骰子',
    dialogues: [
      { speaker: '神秘声音', text: '想试试运气吗？' },
      { speaker: '神秘声音', text: '掷骰子，赢了大赚，输了大亏！' },
      { speaker: '疯狂戴夫', text: '赌博有风险，入局需谨慎！' }
    ],
    choices: [
      { text: '掷骰子（-50金币，随机结果）', effect: 'random', cost: { coins: 50 } },
      { text: '离开', effect: 'nothing' }
    ]
  },
  {
    id: 'lucky_clover',
    title: '幸运四叶草',
    dialogues: [
      { speaker: '旁白', text: '你发现了一片四叶草，据说能带来好运。' },
      { speaker: '旁白', text: '摘下它可能会带来好运，也可能会招致厄运...' }
    ],
    choices: [
      { text: '摘下四叶草（随机奖励）', effect: 'random' },
      { text: '不碰它', effect: 'nothing' }
    ]
  },

  // === 综合事件 ===
  {
    id: 'traveling_caravan',
    title: '旅行商队',
    dialogues: [
      { speaker: '商队长', text: '我们的商队有各种商品，看看吧！' },
      { speaker: '商队长', text: '植物种子、杂交能源、特殊植物，应有尽有！' }
    ],
    choices: [
      { text: '买植物（-40金币，+2植物）', effect: 'gain_plants', value: 2, cost: { coins: 40 } },
      { text: '买能源（-60金币，+2蓝色能源）', effect: 'gain_energy', value: { grade: 'blue', amount: 2 }, cost: { coins: 60 } },
      { text: '买特殊植物（-250金币）', effect: 'gain_special_plant', value: 1, cost: { coins: 250 } },
      { text: '离开', effect: 'nothing' }
    ]
  },
  {
    id: 'plant_exchange',
    title: '植物交换',
    dialogues: [
      { speaker: '交换者', text: '我可以用特殊植物和你交换！' },
      { speaker: '交换者', text: '给我3株基础植物，我给你1株特殊植物。' },
      { speaker: '交换者', text: '或者给我100金币也行。' }
    ],
    choices: [
      { text: '用3株植物交换（-3植物，+1特殊植物）', effect: 'exchange_plants_for_special', value: 1, cost: { plants: 3 } },
      { text: '用金币购买（-150金币，+1特殊植物）', effect: 'gain_special_plant', value: 1, cost: { coins: 150 } },
      { text: '离开', effect: 'nothing' }
    ]
  },
  {
    id: 'mad_scientist',
    title: '疯狂科学家',
    dialogues: [
      { speaker: '科学家', text: '哈哈！我的实验终于成功了！' },
      { speaker: '科学家', text: '我培育出了一种特殊的植物，你要试试吗？' },
      { speaker: '科学家', text: '不过实验有风险，植物可能有变异...' }
    ],
    choices: [
      { text: '接受实验植物（+1特殊植物，随机变异）', effect: 'gain_special_plant', value: 1 },
      { text: '帮忙实验（-20HP，+2蓝色能源）', effect: 'gain_energy', value: { grade: 'blue', amount: 2 }, cost: { hp: 20 } },
      { text: '拒绝', effect: 'nothing' }
    ]
  },
  {
    id: 'lost_seed_vault',
    title: '失落种子库',
    dialogues: [
      { speaker: '旁白', text: '你发现了一个古老的种子库，里面保存着各种植物种子。' },
      { speaker: '旁白', text: '种子库的门锁着，需要想办法打开。' },
      { speaker: '疯狂戴夫', text: '里面有好多植物种子！' }
    ],
    choices: [
      { text: '撬锁（-50金币，+3植物）', effect: 'gain_plants', value: 3, cost: { coins: 50 } },
      { text: '砸开（-10HP，+3植物）', effect: 'gain_plants', value: 3, cost: { hp: 10 } },
      { text: '寻找钥匙（+1特殊植物，耗时）', effect: 'gain_special_plant', value: 1 }
    ]
  },

  // === Phase 5: 遗物奖励事件（新增 4 个） ===
  {
    id: 'ancient_altar',
    title: '古老祭坛',
    dialogues: [
      { speaker: '???', text: '你在密林深处发现一座古老祭坛，祭坛上漂浮着一件神秘物品。' },
      { speaker: '???', text: '祭坛上的符文显示：献祭鲜血或金币，可获得遗物。' }
    ],
    choices: [
      { text: '献祭10HP获得遗物', effect: 'gain_relic', cost: { hp: 10 } },
      { text: '献祭200金币获得遗物', effect: 'gain_relic', cost: { coins: 200 } },
      { text: '离开（+30金币）', effect: 'gain_coins', value: 30 }
    ]
  },
  {
    id: 'fallen_hero',
    title: '陨落英雄',
    dialogues: [
      { speaker: '???', text: '你发现一具冒险者遗骸，他手中紧握着一件遗物。' },
      { speaker: '???', text: '你可以拿走遗物，但会激怒附近游荡的僵尸。' }
    ],
    choices: [
      { text: '拿走遗物（+1遗物，-15HP）', effect: 'gain_relic', cost: { hp: 15 } },
      { text: '安葬英雄（+1遗物，+10HP）', effect: 'gain_relic_blessed' }
    ]
  },
  {
    id: 'mystic_fountain',
    title: '神秘喷泉',
    dialogues: [
      { speaker: '???', text: '一座散发幽光的喷泉在你面前涌现。' },
      { speaker: '???', text: '饮用泉水可获得遗物，但可能伴有副作用。' }
    ],
    choices: [
      { text: '大口饮用（+1遗物，-10HP）', effect: 'gain_relic', cost: { hp: 10 } },
      { text: '小口品尝（50%获得遗物）', effect: 'gain_relic_chance', value: 0.5 },
      { text: '装满水壶（+50金币）', effect: 'gain_coins', value: 50 }
    ]
  },
  {
    id: 'wandering_sage',
    title: '云游贤者',
    dialogues: [
      { speaker: '云游贤者', text: '年轻人，我观察你很久了。你具有冒险者的潜质。' },
      { speaker: '云游贤者', text: '这件遗物送给你，希望它能助你一臂之力。' }
    ],
    choices: [
      { text: '感谢并接受（+1遗物）', effect: 'gain_relic' },
      { text: '婉拒并请教（+50金币，+10HP）', effect: 'gain_coins', value: 50, cost: {} }
    ]
  }
];

// 初始对话事件
export const INTRO_EVENT = EVENTS.find(e => e.id === 'intro');

// 根据楼层获取合适的事件
export function getEventForFloor(floor) {
  // 过滤掉初始对话事件
  const pool = EVENTS.filter(e => e.id !== 'intro');
  // 根据楼层调整事件池
  if (floor <= 3) {
    // 前期：更多植物和能源事件
    return pool.filter(e => ['wandering_merchant', 'abandoned_garden', 'energy_crystal',
      'energy_spring', 'healing_spring', 'plant_auction', 'lost_seed_vault', 'lucky_clover'].includes(e.id));
  } else if (floor <= 7) {
    // 中期：加入特殊植物和杂交事件
    return pool.filter(e => ['wandering_merchant', 'abandoned_garden', 'energy_crystal',
      'alchemy_lab', 'mysterious_greenhouse', 'plant_trainer', 'ancient_ruins',
      'plant_shrine', 'traveling_caravan', 'plant_exchange', 'mad_scientist',
      'zombie_ambush', 'mysterious_dice'].includes(e.id));
  } else {
    // 后期：更多特殊植物和高阶事件
    return pool.filter(e => ['alchemy_lab', 'mysterious_greenhouse', 'plant_trainer',
      'black_market', 'ancient_ruins', 'plant_shrine', 'meteor_crash',
      'traveling_caravan', 'plant_exchange', 'mad_scientist', 'mysterious_dice',
      'lost_seed_vault'].includes(e.id));
  }
}

// 随机获取一个事件
export function getRandomEvent(floor) {
  const pool = getEventForFloor(floor);
  if (pool.length === 0) return EVENTS[1]; // 回退到流浪商人
  return pool[Math.floor(Math.random() * pool.length)];
}

// 根据ID获取事件
export function getEventById(id) {
  return EVENTS.find(e => e.id === id);
}

export default EVENTS;
