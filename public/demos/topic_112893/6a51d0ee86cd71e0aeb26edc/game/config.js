// ===================================================================
// config.js - 游戏配置中心：难度、武器、Boss、关卡数据
// ===================================================================

// 画布尺寸常量
export const WIDTH = 480;
export const HEIGHT = 720;

// 难度配置：影响敌机血量、生成间隔、击杀目标、玩家血量
export const DIFFICULTY = {
    easy: {
        name: '简单',
        enemyHpMul: 1.0,
        enemySpawnMs: 1200,
        killTarget: 15,
        playerHp: 50,
        enemySpeedMul: 1.0,
    },
    normal: {
        name: '普通',
        enemyHpMul: 1.5,
        enemySpawnMs: 900,
        killTarget: 20,
        playerHp: 30,
        enemySpeedMul: 1.15,
    },
    hard: {
        name: '困难',
        enemyHpMul: 2.0,
        enemySpawnMs: 600,
        killTarget: 25,
        playerHp: 20,
        enemySpeedMul: 1.3,
    },
};

// 武器配置：标识、名称、颜色、射速、子弹工厂键
// N 普通 / S 散射 / M 机枪 / L 激光 / F 火焰 / R 螺旋（参考魂斗罗）
export const WEAPONS = {
    N: { name: '普通弹', color: '#aaaaff', fireInterval: 200, glow: '#6666ff' },
    S: { name: '散射弹', color: '#00f0ff', fireInterval: 260, glow: '#00f0ff' },
    M: { name: '机枪弹', color: '#fff200', fireInterval: 90,  glow: '#fff200' },
    L: { name: '激光弹', color: '#ff2e88', fireInterval: 320, glow: '#ff2e88' },
    F: { name: '火焰弹', color: '#ff6a00', fireInterval: 380, glow: '#ff6a00' },
    R: { name: '螺旋弹', color: '#39ff14', fireInterval: 140, glow: '#39ff14' },
};

// 可掉落的武器字母（不含初始 N）
export const DROP_WEAPONS = ['S', 'M', 'L', 'F', 'R'];

// 三个 Boss 配置，每个 Boss 拥有不同技能组合
// 技能键：scatter 扇形弹幕 / laser 横向激光 / missile 跟踪导弹
//         summon 召唤小怪 / homing 追踪弹 / bulletstorm 全屏弹幕 / dash 定向冲刺
export const BOSSES = [
    {
        name: '钢铁哨兵',
        maxHp: 180,
        width: 120,
        height: 90,
        color: '#ff2e88',
        skills: ['scatter', 'dash', 'missile'],
        skillIntervalMs: 1100,
        enterY: 110,
    },
    {
        name: '激光母舰',
        maxHp: 280,
        width: 160,
        height: 80,
        color: '#00f0ff',
        skills: ['laser', 'missile', 'homing'],
        skillIntervalMs: 1000,
        enterY: 100,
    },
    {
        name: '深渊主宰',
        maxHp: 420,
        width: 180,
        height: 110,
        color: '#b026ff',
        skills: ['summon', 'homing', 'bulletstorm', 'laser'],
        skillIntervalMs: 850,
        enterY: 120,
    },
    {
        name: '虚空领主',
        maxHp: 580,
        width: 200,
        height: 120,
        color: '#ff6a00',
        skills: ['bulletstorm', 'laser', 'missile', 'summon', 'homing'],
        skillIntervalMs: 750,
        enterY: 130,
    },
];

// 敌机种类：不同造型与行为
// type: basic 直线 / zigzag 之字形 / dive 俯冲
export const ENEMY_TYPES = [
    { type: 'basic',  hp: 1, w: 32, h: 32, speed: 1.6, color: '#ff5577', score: 1 },
    { type: 'zigzag', hp: 2, w: 34, h: 34, speed: 1.5, color: '#ffaa00', score: 1 },
    { type: 'dive',   hp: 3, w: 40, h: 36, speed: 1.9, color: '#b026ff', score: 1 },
];

export const LEVELS = {
    total: 10,
    bossScore: 50,
};

// 评分常量
export const SCORE = {
    enemy: 100,
    reward: 300,
    boss: 5000,
    clearBonus: 10000,
};

// 玩家配置
export const PLAYER = {
    width: 40,
    height: 44,
    speed: 5,           // 每帧像素，60fps 下灵敏适中
    fireOffsetY: 4,     // 子弹生成相对机头位置
    invincibleFrames: 90, // 受伤后无敌帧数
    maxWeaponLevel: 3,
};

// 奖励飞机配置
export const REWARD = {
    spawnMinMs: 8000,
    spawnMaxMs: 15000,
    width: 38,
    height: 38,
    hp: 2,
    speed: 1.6,
    color: '#fff200',
    dropChance: 1.0,
};

// 道具配置
export const POWERUP = {
    width: 26,
    height: 26,
    speed: 2.2,
};

// 星空背景层数据
export const STARS_LAYERS = [
    { count: 40, speed: 0.4, size: 1, color: 'rgba(180, 160, 220, 0.5)' },
    { count: 25, speed: 0.9, size: 1.5, color: 'rgba(220, 200, 255, 0.75)' },
    { count: 12, speed: 1.6, size: 2, color: 'rgba(255, 255, 255, 1)' },
];
