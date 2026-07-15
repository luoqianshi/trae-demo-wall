/**
 * Tom孤岛生存 - 游戏常量定义
 * 集中管理所有游戏中的常量配置，便于统一调整和维护
 */

window.Constants = (function() {
    // ==================== 地形类型 ====================
    const TERRAIN_TYPES = {
        SAND: 0,       // 沙滩
        GRASS: 1,      // 草地
        FOREST: 2,     // 森林
        ROCK: 3,       // 岩石区
        WATER: 4,      // 浅海
        DEEP_WATER: 5  // 深海（不可通行）
    };

    // 地形对应的中文名称
    const TERRAIN_NAMES = {
        [TERRAIN_TYPES.SAND]: '沙滩',
        [TERRAIN_TYPES.GRASS]: '草地',
        [TERRAIN_TYPES.FOREST]: '森林',
        [TERRAIN_TYPES.ROCK]: '岩石区',
        [TERRAIN_TYPES.WATER]: '浅海',
        [TERRAIN_TYPES.DEEP_WATER]: '深海'
    };

    // ==================== 资源类型 ====================
    const RESOURCE_TYPES = {
        // 基础资源（可直接采集）
        BRANCH: 'branch',       // 树枝
        WOOD: 'wood',           // 木块
        STONE: 'stone',         // 石头
        FRUIT: 'fruit',         // 野果
        BERRY: 'berry',         // 浆果
        MUSHROOM: 'mushroom',   // 蘑菇
        COCONUT: 'coconut',     // 椰子
        FLINT: 'flint',         // 燧石
        SHELL: 'shell',         // 贝壳

        // 漂流物资（随机事件获得）
        PLASTIC_BOTTLE: 'plastic_bottle',  // 塑料瓶
        ROPE: 'rope',                      // 绳子
        TIRE: 'tire',                      // 轮胎
        CLOTH: 'cloth',                    // 布料

        // 合成工具
        AXE: 'axe',             // 石斧
        KNIFE: 'knife',         // 石刀
        HAMMER: 'hammer',       // 石锤
        FIRE_STARTER: 'fire_starter',  // 打火石套件

        // 建造物
        CAMPFIRE: 'campfire',   // 火堆
        BED: 'bed',             // 木床
        SHELTER: 'shelter',     // 庇护所
        STORAGE: 'storage',     // 储物箱

        // 隐藏通关物品
        SOS_DEVICE: 'sos_device',      // SOS信号装置
        RADIO: 'radio',                // 无线电
        RAFT: 'raft'                   // 竹筏
    };

    // 资源中文名称映射
    const RESOURCE_NAMES = {
        [RESOURCE_TYPES.BRANCH]: '树枝',
        [RESOURCE_TYPES.WOOD]: '木块',
        [RESOURCE_TYPES.STONE]: '石头',
        [RESOURCE_TYPES.FRUIT]: '野果',
        [RESOURCE_TYPES.BERRY]: '浆果',
        [RESOURCE_TYPES.MUSHROOM]: '蘑菇',
        [RESOURCE_TYPES.COCONUT]: '椰子',
        [RESOURCE_TYPES.FLINT]: '燧石',
        [RESOURCE_TYPES.SHELL]: '贝壳',
        [RESOURCE_TYPES.PLASTIC_BOTTLE]: '塑料瓶',
        [RESOURCE_TYPES.ROPE]: '绳子',
        [RESOURCE_TYPES.TIRE]: '轮胎',
        [RESOURCE_TYPES.CLOTH]: '布料',
        [RESOURCE_TYPES.AXE]: '石斧',
        [RESOURCE_TYPES.KNIFE]: '石刀',
        [RESOURCE_TYPES.HAMMER]: '石锤',
        [RESOURCE_TYPES.FIRE_STARTER]: '打火石',
        [RESOURCE_TYPES.CAMPFIRE]: '火堆',
        [RESOURCE_TYPES.BED]: '木床',
        [RESOURCE_TYPES.SHELTER]: '庇护所',
        [RESOURCE_TYPES.STORAGE]: '储物箱',
        [RESOURCE_TYPES.SOS_DEVICE]: 'SOS信号装置',
        [RESOURCE_TYPES.RADIO]: '无线电',
        [RESOURCE_TYPES.RAFT]: '竹筏'
    };

    // ==================== 颜色配置 ====================
    const COLORS = {
        // 主色调
        PRIMARY: 0xF4D35E,       // 沙滩色（主色）
        SECONDARY: 0x0A8754,     // 森林绿（辅色）
        ACCENT: 0xFF6B35,        // 火焰橙（强调色）

        // 地形颜色
        TERRAIN: {
            [TERRAIN_TYPES.SAND]: 0xF4D35E,       // 沙滩
            [TERRAIN_TYPES.GRASS]: 0x7CB342,      // 草地
            [TERRAIN_TYPES.FOREST]: 0x2E7D32,     // 森林
            [TERRAIN_TYPES.ROCK]: 0x9E9E9E,       // 岩石区
            [TERRAIN_TYPES.WATER]: 0x4FC3F7,      // 浅海
            [TERRAIN_TYPES.DEEP_WATER]: 0x0288D1  // 深海
        },

        // 天空颜色（昼夜循环用）
        SKY: {
            DAY: 0x87CEEB,           // 白天天空蓝
            NIGHT: 0x2C3E50,         // 夜晚夜幕黑
            DAWN: 0xFF9966,          // 黎明橙红色
            DUSK: 0xFF6B6B           // 黄昏粉紫色
        },

        // UI颜色
        UI: {
            BACKGROUND: 0x2C3E50,    // UI背景色
            TEXT: 0xFFFFFF,          // 文字颜色
            TEXT_DARK: 0x333333,     // 深色文字
            SUCCESS: 0x4CAF50,       // 成功绿色
            WARNING: 0xFF9800,       // 警告橙色
            DANGER: 0xF44336         // 危险红色
        },

        // 生存数值颜色
        STATS: {
            HUNGER: 0xFF9800,        // 饥饿值橙色
            THIRST: 0x2196F3,        // 口渴值蓝色
            ENERGY: 0x9C27B0         // 体力值紫色
        }
    };

    // ==================== 难度配置 ====================
    const DIFFICULTY = {
        EASY: 'easy',       // 简单
        NORMAL: 'normal',   // 普通
        HARD: 'hard'        // 困难
    };

    // 难度中文名称
    const DIFFICULTY_NAMES = {
        [DIFFICULTY.EASY]: '简单',
        [DIFFICULTY.NORMAL]: '普通',
        [DIFFICULTY.HARD]: '困难'
    };

    // 难度配置详情
    const DIFFICULTY_CONFIG = {
        [DIFFICULTY.EASY]: {
            realTimeHours: 2,           // 现实时长2小时
            gameTimeHours: 100,         // 游戏时长100小时
            description: '时间充裕，节奏舒缓',
            hungerRateMultiplier: 0.8,  // 饥饿下降倍率
            thirstRateMultiplier: 0.8,  // 口渴下降倍率
            energyRateMultiplier: 0.8   // 体力下降倍率
        },
        [DIFFICULTY.NORMAL]: {
            realTimeHours: 1.5,
            gameTimeHours: 100,
            description: '标准体验',
            hungerRateMultiplier: 1.0,
            thirstRateMultiplier: 1.0,
            energyRateMultiplier: 1.0
        },
        [DIFFICULTY.HARD]: {
            realTimeHours: 1,
            gameTimeHours: 100,
            description: '节奏紧凑，需要高效规划',
            hungerRateMultiplier: 1.3,
            thirstRateMultiplier: 1.3,
            energyRateMultiplier: 1.2
        }
    };

    // ==================== 时间配置 ====================
    const TIME_CONFIG = {
        HOURS_PER_DAY: 24,           // 每天24小时
        DAY_START_HOUR: 6,           // 白天开始时间（6点）
        DAY_END_HOUR: 18,            // 白天结束时间（18点）
        TARGET_SURVIVAL_HOURS: 100,  // 目标生存时长（小时）
        FIRST_DAY_START_HOUR: 6      // 第一天开始时间
    };

    // ==================== 生存数值配置 ====================
    const SURVIVAL_CONFIG = {
        MAX_VALUE: 100,              // 数值上限
        MIN_VALUE: 0,                // 数值下限
        WARNING_THRESHOLD: 30,       // 警告阈值（低于此值显示警告）
        DANGER_THRESHOLD: 15,        // 危险阈值

        // 基础下降速率（每游戏小时）
        HUNGER_DECAY_RATE: 0.5,      // 饥饿值下降速率
        THIRST_DECAY_RATE: 0.8,      // 口渴值下降速率
        ENERGY_DECAY_RATE: 0.3,      // 体力值下降速率

        // 体力影响速度的阈值
        ENERGY_SPEED_PENALTY_THRESHOLD: 30,  // 体力低于此值开始减速
        MIN_SPEED_MULTIPLIER: 0.5            // 最低速度倍率
    };

    // 食物恢复数值配置
    const FOOD_VALUES = {
        [RESOURCE_TYPES.FRUIT]: { hunger: 15, thirst: 10, energy: 5 },
        [RESOURCE_TYPES.BERRY]: { hunger: 8, thirst: 12, energy: 3 },
        [RESOURCE_TYPES.MUSHROOM]: { hunger: 12, thirst: 5, energy: 2 },
        [RESOURCE_TYPES.COCONUT]: { hunger: 10, thirst: 30, energy: 5 }
    };

    // ==================== 地图配置 ====================
    const MAP_CONFIG = {
        WIDTH: 60,               // 地图宽度（格子数）
        HEIGHT: 50,              // 地图高度（格子数）
        TILE_SIZE: 32,           // 每格像素大小
        TOTAL_TILES: 3000        // 约3000格
    };

    // ==================== 玩家配置 ====================
    const PLAYER_CONFIG = {
        SPEED: 7,                // 移动速度（格子/秒）
        START_X: 30,             // 初始X坐标
        START_Y: 25,             // 初始Y坐标
        INTERACTION_RANGE: 1.5   // 交互范围（格子数）
    };

    // ==================== 游戏状态 ====================
    const GAME_STATE = {
        MENU: 'menu',            // 菜单界面
        PLAYING: 'playing',      // 游戏中
        PAUSED: 'paused',        // 暂停
        VICTORY: 'victory',      // 胜利
        DEFEAT: 'defeat'         // 失败
    };

    // ==================== 事件类型 ====================
    const EVENT_TYPES = {
        DRIFT_ITEM: 'drift_item'  // 漂流物资事件
    };

    // 漂流物资物品列表
    const DRIFT_ITEMS = [
        RESOURCE_TYPES.PLASTIC_BOTTLE,
        RESOURCE_TYPES.ROPE,
        RESOURCE_TYPES.TIRE,
        RESOURCE_TYPES.CLOTH,
        RESOURCE_TYPES.WOOD,
        RESOURCE_TYPES.BRANCH
    ];

    // ==================== 合成配方 ====================
    const RECIPES = {
        stone_axe: {
            id: 'stone_axe',
            name: '石斧',
            ingredients: { stone: 1, wood: 1, branch: 2 },
            result: RESOURCE_TYPES.AXE,
            resultCount: 1,
            description: '砍树效率提升，可砍伐更粗的树木',
            category: 'tool'
        },
        stone_knife: {
            id: 'stone_knife',
            name: '石刀',
            ingredients: { stone: 1, branch: 1 },
            result: RESOURCE_TYPES.KNIFE,
            resultCount: 1,
            description: '加工食物、切割材料',
            category: 'tool'
        },
        stone_hammer: {
            id: 'stone_hammer',
            name: '石锤',
            ingredients: { stone: 2, branch: 1 },
            result: RESOURCE_TYPES.HAMMER,
            resultCount: 1,
            description: '建造必需品，提升建造效率',
            category: 'tool'
        },
        fire_starter: {
            id: 'fire_starter',
            name: '打火石',
            ingredients: { flint: 1, stone: 1, branch: 1 },
            result: RESOURCE_TYPES.FIRE_STARTER,
            resultCount: 1,
            description: '快速生火，提高生火成功率',
            category: 'tool'
        },
        campfire: {
            id: 'campfire',
            name: '火堆',
            ingredients: { branch: 5, wood: 2 },
            result: RESOURCE_TYPES.CAMPFIRE,
            resultCount: 1,
            description: '夜间照明、取暖、烹饪食物',
            category: 'building'
        },
        wooden_bed: {
            id: 'wooden_bed',
            name: '木床',
            ingredients: { wood: 5, branch: 3 },
            result: RESOURCE_TYPES.BED,
            resultCount: 1,
            description: '睡觉恢复体力',
            category: 'building'
        },
        shelter: {
            id: 'shelter',
            name: '简易庇护所',
            ingredients: { wood: 10, branch: 5, cloth: 2 },
            result: RESOURCE_TYPES.SHELTER,
            resultCount: 1,
            description: '夜间休息、躲避风雨',
            category: 'building'
        },
        storage_box: {
            id: 'storage_box',
            name: '储物箱',
            ingredients: { wood: 8, branch: 2 },
            result: RESOURCE_TYPES.STORAGE,
            resultCount: 1,
            description: '存放物资',
            category: 'building'
        }
    };

    return {
        TERRAIN_TYPES,
        TERRAIN_NAMES,
        RESOURCE_TYPES,
        RESOURCE_NAMES,
        COLORS,
        DIFFICULTY,
        DIFFICULTY_NAMES,
        DIFFICULTY_CONFIG,
        TIME_CONFIG,
        SURVIVAL_CONFIG,
        FOOD_VALUES,
        MAP_CONFIG,
        PLAYER_CONFIG,
        GAME_STATE,
        EVENT_TYPES,
        DRIFT_ITEMS,
        RECIPES
    };
})();
