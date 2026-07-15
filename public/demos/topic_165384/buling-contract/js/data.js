// ==================== 步灵契约 - 游戏数据 ====================

const CREATURE_TYPES = {
  GRASS: { id: 'grass', name: '草木类', color: '#5eead4', icon: '🌿' },
  WATER: { id: 'water', name: '水雾类', color: '#60a5fa', icon: '💧' },
  WIND: { id: 'wind', name: '风羽类', color: '#a78bfa', icon: '🪶' },
  NIGHT: { id: 'night', name: '夜影类', color: '#818cf8', icon: '🌙' },
  RARE: { id: 'rare', name: '稀有类', color: '#f59e0b', icon: '✨' }
};

const RARITY = {
  COMMON: { id: 'common', name: '常见', chance: 0.6, stars: 1 },
  RARE: { id: 'rare', name: '稀有', chance: 0.3, stars: 2 },
  EPIC: { id: 'epic', name: '史诗', chance: 0.1, stars: 3 }
};

const TIME_PERIODS = {
  DAWN: { id: 'dawn', name: '清晨', hours: [5, 6, 7, 8] },
  MORNING: { id: 'morning', name: '上午', hours: [9, 10, 11] },
  NOON: { id: 'noon', name: '正午', hours: [12, 13] },
  AFTERNOON: { id: 'afternoon', name: '午后', hours: [14, 15, 16] },
  DUSK: { id: 'dusk', name: '黄昏', hours: [17, 18, 19] },
  NIGHT: { id: 'night', name: '夜晚', hours: [20, 21, 22, 23, 0, 1, 2, 3, 4] }
};

const WEATHER_TYPES = {
  SUNNY: { id: 'sunny', name: '晴朗', icon: '☀️' },
  CLOUDY: { id: 'cloudy', name: '多云', icon: '☁️' },
  RAINY: { id: 'rainy', name: '雨天', icon: '🌧️' },
  FOGGY: { id: 'foggy', name: '雾天', icon: '🌫️' },
  STORMY: { id: 'stormy', name: '雷暴', icon: '⛈️' }
};

const LOCATIONS = {
  PARK: { id: 'park', name: '公园', icon: '🌳' },
  RIVER: { id: 'river', name: '河边', icon: '🏞️' },
  STREET: { id: 'street', name: '街巷', icon: '🏘️' },
  HILL: { id: 'hill', name: '山丘', icon: '⛰️' },
  HOME: { id: 'home', name: '住宅区', icon: '🏠' },
  WILDERNESS: { id: 'wilderness', name: '荒野', icon: '🌾' }
};

// ==================== 30只原创魔法生物 ====================
const CREATURES = [
  // 草木类 (6)
  { id: 'c001', name: '枝灯鹿', type: 'grass', rarity: 'common',
    desc: '鹿角上生长着发光的苔藓，在清晨的树林中像一盏盏小灯笼。性格温顺，喜欢安静的环境。',
    conditions: { time: ['dawn'], weather: ['sunny', 'cloudy'], location: ['park'] },
    favorite: '晨露', interaction: '安抚' },
  { id: 'c002', name: '苔耳兔', type: 'grass', rarity: 'common',
    desc: '耳朵上覆盖着柔软的青苔，雨后会在草地上蹦蹦跳跳地寻找水珠。',
    conditions: { time: ['morning', 'afternoon'], weather: ['rainy'], location: ['park', 'wilderness'] },
    favorite: '青草', interaction: '喂食' },
  { id: 'c003', name: '花冠蜥', type: 'grass', rarity: 'rare',
    desc: '头顶绽放着季节之花的小型蜥蜴，春季时花朵最为绚烂。能在花丛中完美隐身。',
    conditions: { time: ['morning', 'noon'], weather: ['sunny'], location: ['park'] },
    favorite: '花蜜', interaction: '画符' },
  { id: 'c004', name: '木心虫', type: 'grass', rarity: 'common',
    desc: '居住在老树心中的甲壳虫，外壳有着树木年轮的纹理。敲击树干时它会探头张望。',
    conditions: { time: ['afternoon'], weather: ['sunny', 'cloudy'], location: ['park', 'hill'] },
    favorite: '树液', interaction: '安抚' },
  { id: 'c005', name: '藤语蛇', type: 'grass', rarity: 'rare',
    desc: '身体如藤蔓般缠绕在树枝间，据说能听懂植物的低语。黄昏时最为活跃。',
    conditions: { time: ['dusk'], weather: ['cloudy', 'foggy'], location: ['park', 'wilderness'] },
    favorite: '月光', interaction: '画符' },
  { id: 'c006', name: '叶隐狐', type: 'grass', rarity: 'epic',
    desc: '传说中只在秋叶纷飞时现身的灵狐，尾巴上的叶片会随季节变换颜色。极为罕见。',
    conditions: { time: ['dusk'], weather: ['sunny', 'cloudy'], location: ['park', 'hill'] },
    favorite: '秋叶', interaction: '画符' },

  // 水雾类 (6)
  { id: 'c007', name: '雾鳍鱼', type: 'water', rarity: 'common',
    desc: '鳍如薄雾般半透明，在湖面上游动时仿佛一团漂浮的水汽。',
    conditions: { time: ['dawn', 'morning'], weather: ['foggy'], location: ['river'] },
    favorite: '水珠', interaction: '喂食' },
  { id: 'c008', name: '雨壳龟', type: 'water', rarity: 'common',
    desc: '背壳上有着雨滴状的纹路，雨天时纹路会发出淡蓝色的微光。',
    conditions: { time: ['morning', 'afternoon'], weather: ['rainy'], location: ['river', 'park'] },
    favorite: '雨滴', interaction: '安抚' },
  { id: 'c009', name: '溪语蛙', type: 'water', rarity: 'common',
    desc: '坐在溪边的石头上，鸣叫声如同流水般悦耳。傍晚时分最为活跃。',
    conditions: { time: ['dusk'], weather: ['sunny', 'cloudy'], location: ['river'] },
    favorite: '飞虫', interaction: '喂食' },
  { id: 'c010', name: '露凝蝶', type: 'water', rarity: 'rare',
    desc: '翅膀上凝结着露珠的蝴蝶，清晨阳光下会折射出彩虹般的光芒。',
    conditions: { time: ['dawn'], weather: ['foggy', 'cloudy'], location: ['park', 'river'] },
    favorite: '晨露', interaction: '画符' },
  { id: 'c011', name: '潮音螺', type: 'water', rarity: 'rare',
    desc: '海螺中封印着海浪的声音，夜晚放在耳边能听到远方海洋的呼唤。',
    conditions: { time: ['night'], weather: ['cloudy', 'rainy'], location: ['river'] },
    favorite: '海沙', interaction: '安抚' },
  { id: 'c012', name: '渊瞳鲸', type: 'water', rarity: 'epic',
    desc: '只在暴雨深水中出现的神秘巨兽，眼中仿佛蕴含着深海的无尽秘密。',
    conditions: { time: ['night'], weather: ['stormy'], location: ['river'] },
    favorite: '深海珍珠', interaction: '画符' },

  // 风羽类 (6)
  { id: 'c013', name: '云羽雀', type: 'wind', rarity: 'common',
    desc: '羽毛如同云朵般蓬松的小鸟，飞行时会在身后留下淡淡的云迹。',
    conditions: { time: ['morning', 'noon'], weather: ['sunny'], location: ['park', 'hill'] },
    favorite: '云朵', interaction: '喂食' },
  { id: 'c014', name: '风铃狐', type: 'wind', rarity: 'common',
    desc: '尾巴上挂着微型风铃的狐狸，奔跑时会发出清脆的铃声。喜欢微风拂面的山丘。',
    conditions: { time: ['afternoon'], weather: ['sunny', 'cloudy'], location: ['hill', 'wilderness'] },
    favorite: '风信子', interaction: '安抚' },
  { id: 'c015', name: '旋羽猫头鹰', type: 'wind', rarity: 'rare',
    desc: '飞行时会旋转羽毛产生气流漩涡的夜行猛禽，在月光下格外威严。',
    conditions: { time: ['night'], weather: ['clear', 'cloudy'], location: ['park', 'hill'] },
    favorite: '月光', interaction: '画符' },
  { id: 'c016', name: '霞光燕', type: 'wind', rarity: 'rare',
    desc: '只在黄昏天际出现的燕子，羽毛染着晚霞的颜色，飞行轨迹如同画笔。',
    conditions: { time: ['dusk'], weather: ['sunny', 'cloudy'], location: ['hill', 'wilderness'] },
    favorite: '晚霞', interaction: '画符' },
  { id: 'c017', name: '雷音隼', type: 'wind', rarity: 'epic',
    desc: '雷暴中穿梭的猛禽，羽翼带着电光，鸣叫声如同雷鸣。只有勇者才能接近。',
    conditions: { time: ['night'], weather: ['stormy'], location: ['hill', 'wilderness'] },
    favorite: '雷电', interaction: '画符' },
  { id: 'c018', name: '星巡鸽', type: 'wind', rarity: 'epic',
    desc: '午夜在城市上空巡逻的白鸽，眼中映着星光。据说它会为迷路的灵魂指引方向。',
    conditions: { time: ['night'], weather: ['clear'], location: ['street', 'home'] },
    favorite: '星光', interaction: '安抚' },

  // 夜影类 (6)
  { id: 'c019', name: '月影猿', type: 'night', rarity: 'rare',
    desc: '月光下身体变得半透明的灵猿，善于在树林间无声穿行。',
    conditions: { time: ['night'], weather: ['clear', 'cloudy'], location: ['park', 'hill'] },
    favorite: '月光', interaction: '画符' },
  { id: 'c020', name: '星斑猫', type: 'night', rarity: 'common',
    desc: '皮毛上有着星斑花纹的猫咪，夜晚在街上漫步时如同拖着一条星河。',
    conditions: { time: ['night'], weather: ['clear', 'cloudy'], location: ['street', 'home'] },
    favorite: '牛奶', interaction: '喂食' },
  { id: 'c021', name: '暗萤兽', type: 'night', rarity: 'common',
    desc: '身体散发着微弱萤光的小型兽类，夏夜在草丛间如同漂浮的灯笼。',
    conditions: { time: ['night'], weather: ['clear'], location: ['park', 'wilderness'] },
    favorite: '花蜜', interaction: '安抚' },
  { id: 'c022', name: '幽瞳蝠', type: 'night', rarity: 'rare',
    desc: '眼睛如同幽蓝宝石的蝙蝠，能在最黑暗的洞穴中视物。凌晨时分出没。',
    conditions: { time: ['night'], weather: ['cloudy', 'foggy'], location: ['wilderness', 'hill'] },
    favorite: '夜露', interaction: '画符' },
  { id: 'c023', name: '眠梦貘', type: 'night', rarity: 'rare',
    desc: '以梦境为食的神秘生物，深夜会在卧室附近徘徊。看到它的人可能会做美梦。',
    conditions: { time: ['night'], weather: ['clear'], location: ['home'] },
    favorite: '梦沙', interaction: '安抚' },
  { id: 'c024', name: '蚀光狼', type: 'night', rarity: 'epic',
    desc: '月食之夜才会现身的狼王，皮毛吸收一切光线，只有眼睛发出血红光芒。',
    conditions: { time: ['night'], weather: ['clear'], location: ['wilderness'] },
    favorite: '暗影', interaction: '画符' },

  // 稀有类 (6)
  { id: 'c025', name: '银鼻鼹', type: 'rare', rarity: 'rare',
    desc: '鼻子如同银色金属般闪亮的鼹鼠，喜欢收集各种反光物品，居住在地底深处。',
    conditions: { time: ['night'], weather: ['rainy'], location: ['park', 'wilderness'] },
    favorite: '亮石', interaction: '喂食' },
  { id: 'c026', name: '焰羽灵鸟', type: 'rare', rarity: 'epic',
    desc: '传说中从火焰中诞生的灵鸟，羽毛燃烧着不灭的火焰，只在火山附近出没。',
    conditions: { time: ['dawn'], weather: ['sunny'], location: ['hill', 'wilderness'] },
    favorite: '火焰', interaction: '画符' },
  { id: 'c027', name: '镜翼鹿', type: 'rare', rarity: 'epic',
    desc: '翅膀如同镜子般反射一切光芒的神鹿，极光下会展现真正的美丽。',
    conditions: { time: ['night'], weather: ['clear'], location: ['hill', 'wilderness'] },
    favorite: '极光', interaction: '画符' },
  { id: 'c028', name: '时砂蝎', type: 'rare', rarity: 'rare',
    desc: '身体由时间之砂构成的蝎子，正午时分在沙漠中游走，触碰它可能感受到时间流逝。',
    conditions: { time: ['noon'], weather: ['sunny'], location: ['wilderness'] },
    favorite: '时砂', interaction: '画符' },
  { id: 'c029', name: '晶角羊', type: 'rare', rarity: 'rare',
    desc: '角如水晶般透明的山羊，黄昏时分在矿洞附近吃草，角会折射出彩虹。',
    conditions: { time: ['dusk'], weather: ['sunny', 'cloudy'], location: ['hill', 'wilderness'] },
    favorite: '水晶', interaction: '喂食' },
  { id: 'c030', name: '虚界龙', type: 'rare', rarity: 'epic',
    desc: '传说生物，只在连续七天达成万步目标的守护者面前现身。是步灵契约的终极见证。',
    conditions: { time: ['dawn', 'night'], weather: ['clear'], location: ['park', 'hill', 'wilderness'] },
    favorite: '契约', interaction: '画符', special: true }
];

// ==================== 场景描述模板 ====================
const SCENE_TEMPLATES = {
  grass: [
    '你穿过一片茂密的草地，脚下的苔藓柔软得像地毯……',
    '清晨的阳光透过树叶洒落，空气中弥漫着青草的气息……',
    '一阵微风吹过，花丛轻轻摇曳，你注意到有什么在叶片间移动……',
    '你停在一棵古老的大树旁，树皮上的纹路似乎在微微发光……',
    '藤蔓从枝头垂下，在黄昏的光线中如同绿色的帘幕……'
  ],
  water: [
    '湖面上升起薄雾，水波荡漾间仿佛有什么在深处游动……',
    '雨后的水洼倒映着天空，突然一圈涟漪打破了平静……',
    '溪流潺潺，石头上的青苔湿滑，你听到水声中夹杂着奇异的声响……',
    '清晨的露珠在草叶上闪烁，湿地中传来轻微的溅水声……',
    '海边传来潮声，沙滩上有什么东西在月光下闪闪发光……'
  ],
  wind: [
    '山丘上的风铃草随风摇曳，天空中掠过一道优雅的身影……',
    '云朵在头顶缓缓流动，你感觉有什么正从高处注视着你……',
    '微风中带来一阵清脆的铃声，你循声望去……',
    '黄昏的天际染着霞光，一只飞鸟划过绚烂的天空……',
    '山顶的风呼啸而过，电光中一个威严的身影展翅盘旋……'
  ],
  night: [
    '月光洒在林间小路上，树影婆娑中有什么在悄悄跟随……',
    '夜深人静，街灯下拉长的影子似乎多了一道……',
    '草丛中亮起微弱的萤光，如同地上的星星在眨眼睛……',
    '洞穴深处传来细微的振翅声，幽蓝的光芒若隐若现……',
    '卧室的窗外，一个朦胧的身影静静地望着你……'
  ],
  rare: [
    '雨夜的泥土中有什么在翻动，银色的光芒一闪而过……',
    '火山口的热浪扭曲了空气，火焰中诞生出一个身影……',
    '极光下的雪地静谧无声，镜面的光芒在远处闪烁……',
    '正午的沙漠热浪滚滚，时间仿佛在这里变得缓慢……',
    '矿洞的深处，水晶丛中传来轻微的蹄声……',
    '你完成了七天的契约，虚空中缓缓睁开了一双古老的眼眸……'
  ]
};

// ==================== 互动配置 ====================
const INTERACTIONS = {
 安抚: {
    name: '安抚',
    desc: '轻轻靠近，用温柔的声音和动作让它放松警惕',
    icon: '🤲',
    minigame: 'rhythm',
    baseSuccess: 0.7
  },
 喂食: {
    name: '喂食',
    desc: '拿出它喜欢的食物，慢慢引诱它靠近',
    icon: '🍃',
    minigame: 'timing',
    baseSuccess: 0.75
  },
 画符: {
    name: '画符',
    desc: '在空中画出契约之符，与它建立精神连接',
    icon: '✨',
    minigame: 'draw',
    baseSuccess: 0.6
  }
};

// ==================== 步数阈值配置 ====================
const STEP_THRESHOLDS = [
  { steps: 1000, exploreType: 'normal', name: '普通探索', count: 1 },
  { steps: 3000, exploreType: 'scene', name: '场景探索', count: 1 },
  { steps: 6000, exploreType: 'rare', name: '稀有探索', count: 1 },
  { steps: 10000, exploreType: 'special', name: '特殊遭遇', count: 1 }
];

// ==================== 游戏状态管理 ====================
const GameState = {
  load() {
    const saved = localStorage.getItem('buling_contract_state');
    if (saved) {
      return JSON.parse(saved);
    }
    return this.getDefault();
  },

  save(state) {
    localStorage.setItem('buling_contract_state', JSON.stringify(state));
  },

  getDefault() {
    return {
      steps: 0,
      todaySteps: 0,
      lastDate: new Date().toDateString(),
      collected: [],
      companion: null,
      exploreUsed: { normal: 0, scene: 0, rare: 0, special: 0 },
      dailyTasks: {
        walk1000: false,
        walk3000: false,
        exploreOnce: false,
        collectOne: false
      },
      streak: 0,
      lastActive: Date.now(),
      seenCreatures: [],
      creatureTrust: {} // 记录与每只生物的信任值
    };
  },

  reset() {
    localStorage.removeItem('buling_contract_state');
    return this.getDefault();
  }
};

// ==================== 工具函数 ====================
function getCurrentTimePeriod() {
  const hour = new Date().getHours();
  for (const [key, period] of Object.entries(TIME_PERIODS)) {
    if (period.hours.includes(hour)) return period.id;
  }
  return 'night';
}

function getTimePeriodName() {
  return TIME_PERIODS[getCurrentTimePeriod().toUpperCase()]?.name || '夜晚';
}

function getRandomWeather() {
  const weathers = Object.keys(WEATHER_TYPES);
  return weathers[Math.floor(Math.random() * weathers.length)];
}

function getRandomLocation() {
  const locations = Object.keys(LOCATIONS);
  return locations[Math.floor(Math.random() * locations.length)];
}

function getExploreCountBySteps(steps) {
  let count = 0;
  for (const t of STEP_THRESHOLDS) {
    if (steps >= t.steps) count += t.count;
  }
  return count;
}

function getAvailableExplores(steps, used) {
  const available = {};
  for (const t of STEP_THRESHOLDS) {
    if (steps >= t.steps) {
      available[t.exploreType] = t.count - (used[t.exploreType] || 0);
    } else {
      available[t.exploreType] = 0;
    }
  }
  return available;
}

function getTotalAvailableExplores(steps, used) {
  const avail = getAvailableExplores(steps, used);
  return Object.values(avail).reduce((a, b) => a + b, 0);
}

function filterCreaturesByConditions(time, weather, location) {
  return CREATURES.filter(c => {
    const cond = c.conditions;
    const timeMatch = !cond.time || cond.time.includes(time);
    const weatherMatch = !cond.weather || cond.weather.includes(weather);
    const locationMatch = !cond.location || cond.location.includes(location);
    return timeMatch && weatherMatch && locationMatch;
  });
}

function getRandomCreature(creatures, rarityBias = null) {
  if (creatures.length === 0) return null;

  let pool = creatures;
  if (rarityBias === 'rare') {
    // 稀有探索提升稀有概率
    const rare = creatures.filter(c => c.rarity !== 'common');
    if (rare.length > 0) pool = [...rare, ...creatures];
  } else if (rarityBias === 'special') {
    // 特殊遭遇大幅提升稀有概率
    const rare = creatures.filter(c => c.rarity === 'rare' || c.rarity === 'epic');
    if (rare.length > 0) pool = [...rare, ...rare, ...creatures];
  }

  const weights = pool.map(c => {
    if (c.rarity === 'epic') return 1;
    if (c.rarity === 'rare') return 3;
    return 6;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < pool.length; i++) {
    random -= weights[i];
    if (random <= 0) return pool[i];
  }

  return pool[pool.length - 1];
}

function getSceneDescription(creatureType) {
  const templates = SCENE_TEMPLATES[creatureType] || SCENE_TEMPLATES.grass;
  return templates[Math.floor(Math.random() * templates.length)];
}

function calculateSuccessRate(creature, interactionType, trust = 0) {
  const interaction = INTERACTIONS[interactionType];
  if (!interaction) return 0.5;

  let rate = interaction.baseSuccess;

  // 稀有度修正
  if (creature.rarity === 'rare') rate -= 0.1;
  if (creature.rarity === 'epic') rate -= 0.2;

  // 信任值加成
  rate += trust * 0.05;

  // 随机波动
  rate += (Math.random() - 0.5) * 0.1;

  return Math.max(0.15, Math.min(0.95, rate));
}

function getRarityStars(rarity) {
  return RARITY[rarity.toUpperCase()]?.stars || 1;
}

function getRarityName(rarity) {
  return RARITY[rarity.toUpperCase()]?.name || '常见';
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CREATURES, CREATURE_TYPES, RARITY, TIME_PERIODS, WEATHER_TYPES, LOCATIONS,
    SCENE_TEMPLATES, INTERACTIONS, STEP_THRESHOLDS, GameState,
    getCurrentTimePeriod, getTimePeriodName, getRandomWeather, getRandomLocation,
    getExploreCountBySteps, getAvailableExplores, getTotalAvailableExplores,
    filterCreaturesByConditions, getRandomCreature, getSceneDescription,
    calculateSuccessRate, getRarityStars, getRarityName
  };
}
