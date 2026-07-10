/**
 * 末日防守游戏 - 怪物配置表
 * 包含200只怪物的详细属性配置
 * 基础属性模板：1级普通怪物基础值（生命值20、攻击力2、防御力2）
 * 品质倍率：普通1.0x、精良1.5x、优秀1.8x、极品精英2.0x、BOSS2.5x
 */

const MONSTER_CONFIG = {
    // 怪物品质枚举
    QUALITY: {
        NORMAL: '普通',      // 普通品质
        GOOD: '精良',       // 精良品质
        EXCELLENT: '优秀',  // 优秀品质
        ELITE: '极品精英',  // 极品精英
        BOSS: 'BOSS'        // BOSS品质
    },

    // 品质颜色配置（用于UI显示）
    QUALITY_COLORS: {
        '普通': '#a0a0a0',      // 灰色
        '精良': '#4a9eff',     // 蓝色
        '优秀': '#00ff88',     // 绿色
        '极品精英': '#ff00ff', // 紫色
        'BOSS': '#ff6600'      // 橙色
    },

    // 品质倍率配置
    QUALITY_MULTIPLIERS: {
        '普通': 1.0,
        '精良': 1.5,
        '优秀': 1.8,
        '极品精英': 2.0,
        'BOSS': 2.5
    },

    // 默认美术资源路径（没有资源时使用红色圆形代替）
    DEFAULT_ASSET: null,  // null表示使用代码绘制的红色圆形

    // 怪物美术资源映射表
    ASSETS: {},  // 预留：key为怪物名称，value为资源路径

    // ==================== 怪物外观系统 ====================
    // 形状类型：circle(圆), square(方), triangle(三角), diamond(菱形),
    //          hexagon(六边), star(星形), oval(椭圆), cross(十字)
    SHAPE_TEMPLATES: {
        // 丧尸系 - 圆形，暗红色系
        zombie_red:    { shape: 'circle',   bodyColor: '#8b0000', eyeColor: '#ff3333', detailColor: '#5c0000' },
        zombie_brown:  { shape: 'circle',   bodyColor: '#a52a2a', eyeColor: '#ff4444', detailColor: '#6b1a1a' },
        zombie_dark:   { shape: 'circle',   bodyColor: '#6b1a1a', eyeColor: '#ff2222', detailColor: '#4a0e0e' },

        // 感染者系 - 方形，暗绿色系
        infect_green:  { shape: 'square',   bodyColor: '#2d5a27', eyeColor: '#88ff88', detailColor: '#1e4d2b' },
        infect_toxic:  { shape: 'square',   bodyColor: '#3a7a3a', eyeColor: '#aaffaa', detailColor: '#2d5a27' },
        infect_dark:   { shape: 'square',   bodyColor: '#1e4d2b', eyeColor: '#66ff66', detailColor: '#0e3d1b' },

        // 畸变体系 - 三角形，紫色系
        mutant_purple: { shape: 'triangle', bodyColor: '#6b1a6b', eyeColor: '#ff88ff', detailColor: '#4a0e4a' },
        mutant_magenta:{ shape: 'triangle', bodyColor: '#8b008b', eyeColor: '#ffaaff', detailColor: '#6b1a6b' },
        mutant_dark:   { shape: 'triangle', bodyColor: '#4a0e4a', eyeColor: '#ff66ff', detailColor: '#2d0a2d' },

        // 腐尸系 - 椭圆形，棕褐色系
        rot_brown:     { shape: 'oval',     bodyColor: '#5c4033', eyeColor: '#ffcc88', detailColor: '#4a3728' },
        rot_ochre:     { shape: 'oval',     bodyColor: '#6b4423', eyeColor: '#ffdd99', detailColor: '#5c4033' },
        rot_dark:      { shape: 'oval',     bodyColor: '#4a3728', eyeColor: '#ffbb77', detailColor: '#3a2a1e' },

        // 行尸/守卫系 - 六边形，青灰色系
        walk_cyan:     { shape: 'hexagon',  bodyColor: '#1a5c5c', eyeColor: '#88ffff', detailColor: '#0e4a4a' },
        walk_teal:     { shape: 'hexagon',  bodyColor: '#2d7a7a', eyeColor: '#aaffff', detailColor: '#1a5c5c' },
        walk_dark:     { shape: 'hexagon',  bodyColor: '#0e4a4a', eyeColor: '#66ffff', detailColor: '#0a3d3d' },

        // 掠袭/疾跑系 - 菱形，橙红色系
        rush_orange:   { shape: 'diamond',  bodyColor: '#8b4513', eyeColor: '#ffaa44', detailColor: '#6b3503' },
        rush_red:      { shape: 'diamond',  bodyColor: '#a0522d', eyeColor: '#ffbb66', detailColor: '#8b4513' },
        rush_dark:     { shape: 'diamond',  bodyColor: '#6b3503', eyeColor: '#ff9944', detailColor: '#5c2a02' },

        // 精英系 - 星形，暗金色系
        elite_gold:    { shape: 'star',     bodyColor: '#8b6914', eyeColor: '#ffdd44', detailColor: '#6b5504' },
        elite_amber:   { shape: 'star',     bodyColor: '#a67c00', eyeColor: '#ffee66', detailColor: '#8b6914' },

        // BOSS系 - 大型复合形状
        boss_inferno:  { shape: 'boss_flame', bodyColor: '#cd6600', eyeColor: '#ffff00', detailColor: '#8b4500' },
        boss_dark:     { shape: 'boss_spike', bodyColor: '#4a0080', eyeColor: '#ff00ff', detailColor: '#2d0050' },
        boss_undead:   { shape: 'boss_crown', bodyColor: '#660000', eyeColor: '#ff0000', detailColor: '#440000' },
    },

    // 根据怪物名称关键词分配外观模板
    SHAPE_RULES: [
        { keywords: ['丧尸', '病尸'], shapes: ['zombie_red', 'zombie_brown', 'zombie_dark'] },
        { keywords: ['感染者'], shapes: ['infect_green', 'infect_toxic', 'infect_dark'] },
        { keywords: ['畸变体', '畸变者', '畸变尸'], shapes: ['mutant_purple', 'mutant_magenta', 'mutant_dark'] },
        { keywords: ['腐尸', '腐臭', '腐坏'], shapes: ['rot_brown', 'rot_ochre', 'rot_dark'] },
        { keywords: ['行尸', '守卫尸', '守卫者', '游荡者'], shapes: ['walk_cyan', 'walk_teal', 'walk_dark'] },
        { keywords: ['掠袭', '疾跑', '极速', '迅猛', '追击', '追踪'], shapes: ['rush_orange', 'rush_red', 'rush_dark'] },
        { keywords: ['精英', '首领', '霸主'], shapes: ['elite_gold', 'elite_amber'] },
        { keywords: ['BOSS', '天帝', '魔王', '主宰'], shapes: ['boss_inferno', 'boss_dark', 'boss_undead'] },
    ],

    /**
     * 根据怪物名称获取外观模板
     * @param {string} name - 怪物名称
     * @param {string} quality - 怪物品质
     * @returns {object} 外观模板对象
     */
    getMonsterShape(name, quality) {
        // BOSS品质优先使用BOSS外观
        if (quality === 'BOSS') {
            const bossShapes = this.SHAPE_RULES.find(r => r.keywords.includes('BOSS'))?.shapes || ['boss_inferno'];
            const key = bossShapes[name.length % bossShapes.length];
            return this.SHAPE_TEMPLATES[key] || this.SHAPE_TEMPLATES.zombie_red;
        }

        // 根据名称关键词匹配
        for (const rule of this.SHAPE_RULES) {
            for (const kw of rule.keywords) {
                if (name.includes(kw)) {
                    const key = rule.shapes[name.length % rule.shapes.length];
                    return this.SHAPE_TEMPLATES[key] || this.SHAPE_TEMPLATES.zombie_red;
                }
            }
        }

        // 默认使用丧尸外观（按名称长度轮换）
        const defaultShapes = ['zombie_red', 'zombie_brown', 'zombie_dark'];
        const key = defaultShapes[name.length % defaultShapes.length];
        return this.SHAPE_TEMPLATES[key] || this.SHAPE_TEMPLATES.zombie_red;
    },

    // 完整怪物配置表（200只）
    MONSTERS: [
        // ==================== 1-10级怪物 ====================
        { id: 1, name: '孱弱丧尸', level: 1, quality: '普通', health: 20, attack: 2, defense: 2, speed: 0.55 },
        { id: 2, name: '流浪感染者', level: 1, quality: '普通', health: 21, attack: 3, defense: 2, speed: 0.575 },
        { id: 3, name: '残腐丧尸', level: 2, quality: '普通', health: 24, attack: 4, defense: 3, speed: 0.55 },
        { id: 4, name: '低速畸变体', level: 2, quality: '普通', health: 26, attack: 5, defense: 4, speed: 0.5 },
        { id: 5, name: '街头病尸', level: 3, quality: '普通', health: 30, attack: 6, defense: 4, speed: 0.6 },
        { id: 6, name: '游荡腐尸', level: 3, quality: '普通', health: 32, attack: 7, defense: 5, speed: 0.575 },
        { id: 7, name: '迅捷小丧尸', level: 4, quality: '普通', health: 33, attack: 5, defense: 3, speed: 0.7 },
        { id: 8, name: '破损感染者', level: 4, quality: '普通', health: 36, attack: 8, defense: 5, speed: 0.55 },
        { id: 9, name: '城郊残尸', level: 5, quality: '普通', health: 40, attack: 9, defense: 6, speed: 0.6 },
        { id: 10, name: '初级畸变丧尸', level: 5, quality: '精良', health: 48, attack: 12, defense: 7, speed: 0.625 },

        // ==================== 6-10级怪物 ====================
        { id: 11, name: '快速感染者', level: 6, quality: '普通', health: 42, attack: 10, defense: 5, speed: 0.725 },
        { id: 12, name: '硬化腐尸', level: 6, quality: '精良', health: 52, attack: 13, defense: 9, speed: 0.525 },
        { id: 13, name: '街区游荡者', level: 7, quality: '普通', health: 46, attack: 12, defense: 6, speed: 0.625 },
        { id: 14, name: '剧毒小丧尸', level: 7, quality: '精良', health: 56, attack: 15, defense: 7, speed: 0.65 },
        { id: 15, name: '重装残尸', level: 8, quality: '精良', health: 62, attack: 17, defense: 11, speed: 0.5 },
        { id: 16, name: '追击感染者', level: 8, quality: '普通', health: 50, attack: 14, defense: 7, speed: 0.675 },
        { id: 17, name: '腐臭畸变体', level: 9, quality: '精良', health: 68, attack: 19, defense: 10, speed: 0.575 },
        { id: 18, name: '高速掠袭尸', level: 9, quality: '普通', health: 54, attack: 16, defense: 6, speed: 0.75 },
        { id: 19, name: '废弃守卫尸', level: 10, quality: '精良', health: 75, attack: 22, defense: 12, speed: 0.55 },
        { id: 20, name: '街区小首领', level: 10, quality: 'BOSS', health: 120, attack: 35, defense: 20, speed: 0.6 },

        // ==================== 11-15级怪物 ====================
        { id: 21, name: '荒野散尸', level: 11, quality: '普通', health: 60, attack: 18, defense: 8, speed: 0.65 },
        { id: 22, name: '狂暴感染者', level: 11, quality: '精良', health: 82, attack: 24, defense: 11, speed: 0.7 },
        { id: 23, name: '硬化畸变尸', level: 12, quality: '精良', health: 88, attack: 26, defense: 15, speed: 0.525 },
        { id: 24, name: '追踪腐尸', level: 12, quality: '普通', health: 66, attack: 20, defense: 9, speed: 0.675 },
        { id: 25, name: '毒雾感染者', level: 13, quality: '优秀', health: 95, attack: 28, defense: 13, speed: 0.625 },
        { id: 26, name: '重甲行尸', level: 13, quality: '精良', health: 92, attack: 29, defense: 17, speed: 0.5 },
        { id: 27, name: '疾跑畸变体', level: 14, quality: '普通', health: 72, attack: 22, defense: 10, speed: 0.775 },
        { id: 28, name: '撕裂感染者', level: 14, quality: '优秀', health: 102, attack: 31, defense: 14, speed: 0.65 },
        { id: 29, name: '壁垒腐尸', level: 15, quality: '精良', health: 100, attack: 32, defense: 19, speed: 0.525 },
        { id: 30, name: '迅猛猎杀尸', level: 15, quality: '优秀', health: 108, attack: 34, defense: 12, speed: 0.75 },

        // ==================== 16-20级怪物 ====================
        { id: 31, name: '腐坏守卫者', level: 16, quality: '优秀', health: 115, attack: 36, defense: 16, speed: 0.575 },
        { id: 32, name: '狂躁畸变体', level: 16, quality: '精良', health: 106, attack: 33, defense: 13, speed: 0.725 },
        { id: 33, name: '穿刺感染者', level: 17, quality: '优秀', health: 122, attack: 38, defense: 15, speed: 0.675 },
        { id: 34, name: '厚皮腐尸', level: 17, quality: '精良', health: 112, attack: 35, defense: 21, speed: 0.5 },
        { id: 35, name: '暗影潜行尸', level: 18, quality: '优秀', health: 128, attack: 40, defense: 14, speed: 0.8 },
        { id: 36, name: '重装畸变体', level: 18, quality: '优秀', health: 132, attack: 42, defense: 23, speed: 0.525 },
        { id: 37, name: '剧毒腐蚀尸', level: 19, quality: '优秀', health: 138, attack: 44, defense: 16, speed: 0.625 },
        { id: 38, name: '极速掠杀者', level: 19, quality: '精良', health: 124, attack: 41, defense: 13, speed: 0.825 },
        { id: 39, name: '废墟重甲尸', level: 20, quality: '优秀', health: 145, attack: 46, defense: 25, speed: 0.55 },
        { id: 40, name: '城区霸主', level: 20, quality: 'BOSS', health: 220, attack: 65, defense: 32, speed: 0.625 },

        // ==================== 21-25级怪物 ====================
        { id: 41, name: '残血游荡者', level: 21, quality: '普通', health: 110, attack: 32, defense: 12, speed: 0.7 },
        { id: 42, name: '骨刺畸变体', level: 21, quality: '精良', health: 152, attack: 48, defense: 18, speed: 0.65 },
        { id: 43, name: '锈蚀守卫尸', level: 22, quality: '精良', health: 160, attack: 50, defense: 22, speed: 0.55 },
        { id: 44, name: '潜伏毒尸', level: 22, quality: '普通', health: 118, attack: 35, defense: 13, speed: 0.75 },
        { id: 45, name: '爆裂感染者', level: 23, quality: '优秀', health: 168, attack: 53, defense: 19, speed: 0.675 },
        { id: 46, name: '岩皮腐尸', level: 23, quality: '精良', health: 165, attack: 52, defense: 26, speed: 0.525 },
        { id: 47, name: '夜袭疾尸', level: 24, quality: '普通', health: 125, attack: 38, defense: 14, speed: 0.85 },
        { id: 48, name: '破甲畸变者', level: 24, quality: '优秀', health: 175, attack: 55, defense: 21, speed: 0.6 },
        { id: 49, name: '高地壁垒尸', level: 25, quality: '精良', health: 182, attack: 57, defense: 29, speed: 0.55 },
        { id: 50, name: '荒野猎杀首领', level: 25, quality: 'BOSS', health: 280, attack: 78, defense: 38, speed: 0.65 },

        // ==================== 26-30级怪物 ====================
        { id: 51, name: '荒原腐尸', level: 26, quality: '普通', health: 135, attack: 42, defense: 16, speed: 0.725 },
        { id: 52, name: '狂怒骨刺尸', level: 26, quality: '精良', health: 190, attack: 60, defense: 23, speed: 0.675 },
        { id: 53, name: '深林潜伏者', level: 27, quality: '优秀', health: 198, attack: 62, defense: 20, speed: 0.775 },
        { id: 54, name: '铁甲守御尸', level: 27, quality: '精良', health: 195, attack: 61, defense: 32, speed: 0.525 },
        { id: 55, name: '速冲感染者', level: 28, quality: '普通', health: 142, attack: 45, defense: 17, speed: 0.875 },
        { id: 56, name: '强酸腐蚀体', level: 28, quality: '优秀', health: 205, attack: 64, defense: 22, speed: 0.625 },
        { id: 57, name: '山岳厚皮尸', level: 29, quality: '精良', health: 212, attack: 66, defense: 35, speed: 0.55 },
        { id: 58, name: '暗影掠杀者', level: 29, quality: '优秀', health: 210, attack: 68, defense: 24, speed: 0.825 },
        { id: 59, name: '战地狂暴尸', level: 30, quality: '精良', health: 220, attack: 70, defense: 28, speed: 0.7 },
        { id: 60, name: '区域镇压者', level: 30, quality: 'BOSS', health: 350, attack: 90, defense: 45, speed: 0.675 },

        // ==================== 31-35级怪物 ====================
        { id: 61, name: '荒漠散腐尸', level: 31, quality: '普通', health: 160, attack: 50, defense: 19, speed: 0.725 },
        { id: 62, name: '锯齿畸变体', level: 31, quality: '精良', health: 230, attack: 72, defense: 30, speed: 0.65 },
        { id: 63, name: '迷雾毒行尸', level: 32, quality: '优秀', health: 238, attack: 75, defense: 26, speed: 0.75 },
        { id: 64, name: '重装壁垒者', level: 32, quality: '精良', health: 235, attack: 74, defense: 38, speed: 0.55 },
        { id: 65, name: '疾风突袭尸', level: 33, quality: '普通', health: 168, attack: 53, defense: 20, speed: 0.9 },
        { id: 66, name: '破防猎杀者', level: 33, quality: '优秀', health: 245, attack: 77, defense: 28, speed: 0.625 },
        { id: 67, name: '熔岩腐尸', level: 34, quality: '精良', health: 252, attack: 80, defense: 33, speed: 0.6 },
        { id: 68, name: '幽影潜行猎杀', level: 34, quality: '优秀', health: 250, attack: 82, defense: 29, speed: 0.85 },
        { id: 69, name: '战场重装畸变', level: 35, quality: '精良', health: 260, attack: 84, defense: 42, speed: 0.575 },
        { id: 70, name: '荒原霸主', level: 35, quality: 'BOSS', health: 420, attack: 105, defense: 52, speed: 0.7 },

        // ==================== 36-40级怪物 ====================
        { id: 71, name: '戈壁残腐尸', level: 36, quality: '普通', health: 185, attack: 58, defense: 22, speed: 0.75 },
        { id: 72, name: '狂血感染者', level: 36, quality: '精良', health: 270, attack: 86, defense: 31, speed: 0.725 },
        { id: 73, name: '剧毒畸变领主', level: 37, quality: '优秀', health: 278, attack: 89, defense: 30, speed: 0.65 },
        { id: 74, name: '坚岩守卫尸', level: 37, quality: '精良', health: 275, attack: 88, defense: 44, speed: 0.55 },
        { id: 75, name: '极速穿甲尸', level: 38, quality: '普通', health: 192, attack: 61, defense: 23, speed: 0.925 },
        { id: 76, name: '爆裂畸变体', level: 38, quality: '优秀', health: 285, attack: 91, defense: 32, speed: 0.675 },
        { id: 77, name: '厚甲战地尸', level: 39, quality: '精良', health: 292, attack: 94, defense: 46, speed: 0.575 },
        { id: 78, name: '暗夜追猎者', level: 39, quality: '优秀', health: 290, attack: 96, defense: 33, speed: 0.875 },
        { id: 79, name: '荒漠狂战士', level: 40, quality: '精良', health: 300, attack: 98, defense: 36, speed: 0.7 },
        { id: 80, name: '要塞守卫首领', level: 40, quality: 'BOSS', health: 500, attack: 120, defense: 60, speed: 0.725 },

        // ==================== 41-45级怪物 ====================
        { id: 81, name: '风沙腐尸', level: 41, quality: '普通', health: 210, attack: 65, defense: 25, speed: 0.775 },
        { id: 82, name: '血爪畸变体', level: 41, quality: '精良', health: 310, attack: 102, defense: 38, speed: 0.675 },
        { id: 83, name: '瘴气毒雾尸', level: 42, quality: '优秀', health: 318, attack: 105, defense: 35, speed: 0.7 },
        { id: 84, name: '金刚重甲尸', level: 42, quality: '精良', health: 315, attack: 104, defense: 50, speed: 0.55 },
        { id: 85, name: '流星速袭尸', level: 43, quality: '普通', health: 218, attack: 68, defense: 26, speed: 0.95 },
        { id: 86, name: '碎甲猎杀者', level: 43, quality: '优秀', health: 325, attack: 108, defense: 37, speed: 0.65 },
        { id: 87, name: '磐石壁垒畸变', level: 44, quality: '精良', health: 332, attack: 111, defense: 53, speed: 0.6 },
        { id: 88, name: '幽夜绝杀尸', level: 44, quality: '优秀', health: 330, attack: 113, defense: 39, speed: 0.9 },
        { id: 89, name: '焚血狂怒尸', level: 45, quality: '精良', health: 340, attack: 116, defense: 42, speed: 0.725 },
        { id: 90, name: '荒漠巨擘', level: 45, quality: 'BOSS', health: 580, attack: 138, defense: 68, speed: 0.75 },

        // ==================== 46-50级怪物 ====================
        { id: 91, name: '枯土散尸', level: 46, quality: '普通', health: 235, attack: 73, defense: 28, speed: 0.8 },
        { id: 92, name: '裂骨畸变体', level: 46, quality: '精良', health: 350, attack: 119, defense: 44, speed: 0.7 },
        { id: 93, name: '蚀骨毒感染者', level: 47, quality: '优秀', health: 358, attack: 122, defense: 40, speed: 0.725 },
        { id: 94, name: '玄铁守御尸', level: 47, quality: '精良', health: 355, attack: 121, defense: 56, speed: 0.575 },
        { id: 95, name: '破空疾行尸', level: 48, quality: '普通', health: 242, attack: 76, defense: 29, speed: 0.975 },
        { id: 96, name: '屠戮猎杀者', level: 48, quality: '优秀', health: 365, attack: 125, defense: 42, speed: 0.675 },
        { id: 97, name: '万钧重甲尸', level: 49, quality: '精良', health: 372, attack: 128, defense: 59, speed: 0.6 },
        { id: 98, name: '月影潜行绝杀', level: 49, quality: '优秀', health: 370, attack: 130, defense: 44, speed: 0.925 },
        { id: 99, name: '炼狱狂躁尸', level: 50, quality: '精良', health: 380, attack: 133, defense: 48, speed: 0.75 },
        { id: 100, name: '百里灾厄领主', level: 50, quality: 'BOSS', health: 680, attack: 155, defense: 78, speed: 0.775 },

        // ==================== 51-55级怪物 ====================
        { id: 101, name: '荒原枯骨尸', level: 51, quality: '普通', health: 260, attack: 80, defense: 31, speed: 0.8 },
        { id: 102, name: '血鳞畸变体', level: 51, quality: '精良', health: 390, attack: 136, defense: 50, speed: 0.725 },
        { id: 103, name: '幽冥毒瘴尸', level: 52, quality: '优秀', health: 398, attack: 139, defense: 46, speed: 0.75 },
        { id: 104, name: '龙鳞守卫尸', level: 52, quality: '精良', health: 395, attack: 138, defense: 62, speed: 0.575 },
        { id: 105, name: '瞬影突袭尸', level: 53, quality: '普通', health: 268, attack: 83, defense: 32, speed: 1.0 },
        { id: 106, name: '破界猎杀者', level: 53, quality: '优秀', health: 405, attack: 142, defense: 48, speed: 0.7 },
        { id: 107, name: '太古厚甲尸', level: 54, quality: '精良', health: 412, attack: 145, defense: 65, speed: 0.625 },
        { id: 108, name: '暗夜裁决者', level: 54, quality: '优秀', health: 410, attack: 147, defense: 50, speed: 0.95 },
        { id: 109, name: '焚天狂怒尸', level: 55, quality: '精良', health: 420, attack: 150, defense: 53, speed: 0.775 },
        { id: 110, name: '荒野灾厄主将', level: 55, quality: 'BOSS', health: 780, attack: 175, defense: 88, speed: 0.8 },

        // ==================== 56-60级怪物 ====================
        { id: 111, name: '绝域残腐尸', level: 56, quality: '普通', health: 285, attack: 88, defense: 34, speed: 0.825 },
        { id: 112, name: '魔骨刺畸变体', level: 56, quality: '精良', health: 430, attack: 153, defense: 55, speed: 0.75 },
        { id: 113, name: '噬魂毒尸', level: 57, quality: '优秀', health: 438, attack: 156, defense: 52, speed: 0.775 },
        { id: 114, name: '壁垒镇狱尸', level: 57, quality: '精良', health: 435, attack: 155, defense: 68, speed: 0.6 },
        { id: 115, name: '掠影极速尸', level: 58, quality: '普通', health: 292, attack: 91, defense: 35, speed: 1.025 },
        { id: 116, name: '碎魂猎杀者', level: 58, quality: '优秀', health: 445, attack: 159, defense: 54, speed: 0.725 },
        { id: 117, name: '玄甲镇山尸', level: 59, quality: '精良', health: 452, attack: 162, defense: 71, speed: 0.625 },
        { id: 118, name: '九幽潜行尸', level: 59, quality: '优秀', health: 450, attack: 164, defense: 56, speed: 0.975 },
        { id: 119, name: '灭世狂躁尸', level: 60, quality: '精良', health: 460, attack: 167, defense: 59, speed: 0.8 },
        { id: 120, name: '全域灾厄统领', level: 60, quality: 'BOSS', health: 900, attack: 198, defense: 100, speed: 0.825 },

        // ==================== 61-65级怪物 ====================
        { id: 121, name: '烬土枯尸', level: 61, quality: '普通', health: 310, attack: 96, defense: 38, speed: 0.85 },
        { id: 122, name: '炼狱畸变体', level: 61, quality: '精良', health: 470, attack: 170, defense: 61, speed: 0.775 },
        { id: 123, name: '蚀世毒雾尸', level: 62, quality: '优秀', health: 478, attack: 173, defense: 58, speed: 0.8 },
        { id: 124, name: '镇岳重甲尸', level: 62, quality: '精良', health: 475, attack: 172, defense: 74, speed: 0.625 },
        { id: 125, name: '流星瞬杀尸', level: 63, quality: '普通', health: 318, attack: 99, defense: 39, speed: 1.05 },
        { id: 126, name: '绝命猎杀者', level: 63, quality: '优秀', health: 485, attack: 176, defense: 60, speed: 0.75 },
        { id: 127, name: '千钧壁垒尸', level: 64, quality: '精良', health: 492, attack: 179, defense: 77, speed: 0.65 },
        { id: 128, name: '永夜绝杀者', level: 64, quality: '优秀', health: 490, attack: 181, defense: 62, speed: 1.0 },
        { id: 129, name: '血狱狂怒尸', level: 65, quality: '精良', health: 500, attack: 184, defense: 65, speed: 0.825 },
        { id: 130, name: '绝境霸主', level: 65, quality: 'BOSS', health: 1020, attack: 220, defense: 112, speed: 0.85 },

        // ==================== 66-70级怪物 ====================
        { id: 131, name: '荒古残腐尸', level: 66, quality: '普通', health: 335, attack: 104, defense: 42, speed: 0.875 },
        { id: 132, name: '万骨畸变体', level: 66, quality: '精良', health: 510, attack: 187, defense: 67, speed: 0.8 },
        { id: 133, name: '吞灵毒瘴尸', level: 67, quality: '优秀', health: 518, attack: 190, defense: 64, speed: 0.825 },
        { id: 134, name: '御天守卫尸', level: 67, quality: '精良', health: 515, attack: 189, defense: 80, speed: 0.65 },
        { id: 135, name: '追风瞬袭尸', level: 68, quality: '普通', health: 342, attack: 107, defense: 43, speed: 1.075 },
        { id: 136, name: '虚空猎杀者', level: 68, quality: '优秀', health: 525, attack: 193, defense: 66, speed: 0.775 },
        { id: 137, name: '霸岳重甲尸', level: 69, quality: '精良', health: 532, attack: 196, defense: 83, speed: 0.675 },
        { id: 138, name: '暗影轮回尸', level: 69, quality: '优秀', health: 530, attack: 198, defense: 68, speed: 1.025 },
        { id: 139, name: '焚世狂躁尸', level: 70, quality: '精良', health: 540, attack: 201, defense: 71, speed: 0.85 },
        { id: 140, name: '末世区域主宰', level: 70, quality: 'BOSS', health: 1150, attack: 245, defense: 125, speed: 0.875 },

        // ==================== 71-75级怪物 ====================
        { id: 141, name: '尘寰枯骨尸', level: 71, quality: '普通', health: 360, attack: 112, defense: 46, speed: 0.9 },
        { id: 142, name: '天裂畸变体', level: 71, quality: '精良', health: 550, attack: 204, defense: 73, speed: 0.825 },
        { id: 143, name: '湮灭毒尸', level: 72, quality: '优秀', health: 558, attack: 207, defense: 70, speed: 0.85 },
        { id: 144, name: '亘古壁垒尸', level: 72, quality: '精良', health: 555, attack: 206, defense: 86, speed: 0.675 },
        { id: 145, name: '雷霆速袭尸', level: 73, quality: '普通', health: 368, attack: 115, defense: 47, speed: 1.1 },
        { id: 146, name: '终结猎杀者', level: 73, quality: '优秀', health: 565, attack: 210, defense: 72, speed: 0.8 },
        { id: 147, name: '镇世重甲尸', level: 74, quality: '精良', health: 572, attack: 213, defense: 89, speed: 0.7 },
        { id: 148, name: '幽冥轮回杀', level: 74, quality: '优秀', health: 570, attack: 215, defense: 74, speed: 1.05 },
        { id: 149, name: '诸天狂怒尸', level: 75, quality: '精良', health: 580, attack: 218, defense: 77, speed: 0.875 },
        { id: 150, name: '荒野终焉领主', level: 75, quality: 'BOSS', health: 1300, attack: 270, defense: 140, speed: 0.9 },

        // ==================== 76-80级怪物 ====================
        { id: 151, name: '残天腐尸', level: 76, quality: '普通', health: 385, attack: 120, defense: 50, speed: 0.925 },
        { id: 152, name: '破穹畸变体', level: 76, quality: '精良', health: 590, attack: 221, defense: 79, speed: 0.85 },
        { id: 153, name: '寂灭毒瘴尸', level: 77, quality: '优秀', health: 598, attack: 224, defense: 76, speed: 0.875 },
        { id: 154, name: '撼岳守御尸', level: 77, quality: '精良', health: 595, attack: 223, defense: 92, speed: 0.7 },
        { id: 155, name: '极光瞬杀尸', level: 78, quality: '普通', health: 392, attack: 123, defense: 51, speed: 1.125 },
        { id: 156, name: '鸿蒙猎杀者', level: 78, quality: '优秀', health: 605, attack: 227, defense: 78, speed: 0.825 },
        { id: 157, name: '万狱壁垒尸', level: 79, quality: '精良', health: 612, attack: 230, defense: 95, speed: 0.725 },
        { id: 158, name: '白夜幽冥尸', level: 79, quality: '优秀', health: 610, attack: 232, defense: 80, speed: 1.075 },
        { id: 159, name: '弑神狂躁尸', level: 80, quality: '精良', health: 620, attack: 235, defense: 83, speed: 0.9 },
        { id: 160, name: '全域终焉主宰', level: 80, quality: 'BOSS', health: 1450, attack: 300, defense: 155, speed: 0.925 },

        // ==================== 81-85级怪物 ====================
        { id: 161, name: '碎界残腐尸', level: 81, quality: '普通', health: 410, attack: 128, defense: 54, speed: 0.95 },
        { id: 162, name: '星辰畸变体', level: 81, quality: '精良', health: 630, attack: 238, defense: 85, speed: 0.875 },
        { id: 163, name: '诸天毒蚀尸', level: 82, quality: '优秀', health: 638, attack: 241, defense: 82, speed: 0.9 },
        { id: 164, name: '苍玄重甲尸', level: 82, quality: '精良', health: 635, attack: 240, defense: 98, speed: 0.725 },
        { id: 165, name: '破空极光尸', level: 83, quality: '普通', health: 418, attack: 131, defense: 55, speed: 1.15 },
        { id: 166, name: '星陨猎杀者', level: 83, quality: '优秀', health: 645, attack: 244, defense: 84, speed: 0.85 },
        { id: 167, name: '穹顶壁垒尸', level: 84, quality: '精良', health: 652, attack: 247, defense: 101, speed: 0.75 },
        { id: 168, name: '虚实潜行尸', level: 84, quality: '优秀', health: 650, attack: 249, defense: 86, speed: 1.1 },
        { id: 169, name: '星河狂怒尸', level: 85, quality: '精良', health: 660, attack: 252, defense: 89, speed: 0.925 },
        { id: 170, name: '荒原寂灭君主', level: 85, quality: 'BOSS', health: 1600, attack: 330, defense: 170, speed: 0.95 },

        // ==================== 86-90级怪物 ====================
        { id: 171, name: '陨星枯骨尸', level: 86, quality: '普通', health: 435, attack: 136, defense: 58, speed: 0.975 },
        { id: 172, name: '混沌畸变体', level: 86, quality: '精良', health: 670, attack: 255, defense: 91, speed: 0.9 },
        { id: 173, name: '鸿蒙毒湮尸', level: 87, quality: '优秀', health: 678, attack: 258, defense: 88, speed: 0.925 },
        { id: 174, name: '镇界守卫尸', level: 87, quality: '精良', health: 675, attack: 257, defense: 104, speed: 0.75 },
        { id: 175, name: '超光速瞬袭尸', level: 88, quality: '普通', health: 442, attack: 139, defense: 59, speed: 1.175 },
        { id: 176, name: '寂灭裁决者', level: 88, quality: '优秀', health: 685, attack: 261, defense: 90, speed: 0.875 },
        { id: 177, name: '山海重甲尸', level: 89, quality: '精良', health: 692, attack: 264, defense: 107, speed: 0.775 },
        { id: 178, name: '轮回幽影尸', level: 89, quality: '优秀', health: 690, attack: 266, defense: 92, speed: 1.125 },
        { id: 179, name: '洪荒狂躁尸', level: 90, quality: '精良', health: 700, attack: 269, defense: 95, speed: 0.95 },
        { id: 180, name: '末世寂灭至尊', level: 90, quality: 'BOSS', health: 1800, attack: 360, defense: 190, speed: 0.975 },

        // ==================== 91-95级怪物 ====================
        { id: 181, name: '洪荒残腐尸', level: 91, quality: '普通', health: 460, attack: 144, defense: 62, speed: 1.0 },
        { id: 182, name: '太古混沌畸变', level: 91, quality: '精良', health: 710, attack: 272, defense: 97, speed: 0.925 },
        { id: 183, name: '万界毒噬尸', level: 92, quality: '优秀', health: 718, attack: 275, defense: 94, speed: 0.95 },
        { id: 184, name: '诸天镇岳尸', level: 92, quality: '精良', health: 715, attack: 274, defense: 110, speed: 0.775 },
        { id: 185, name: '九霄瞬杀尸', level: 93, quality: '普通', health: 468, attack: 147, defense: 63, speed: 1.2 },
        { id: 186, name: '万界终结猎杀', level: 93, quality: '优秀', health: 725, attack: 278, defense: 96, speed: 0.9 },
        { id: 187, name: '乾坤壁垒尸', level: 94, quality: '精良', health: 732, attack: 281, defense: 113, speed: 0.8 },
        { id: 188, name: '虚无幽影尸', level: 94, quality: '优秀', health: 730, attack: 283, defense: 98, speed: 1.15 },
        { id: 189, name: '苍穹狂怒尸', level: 95, quality: '精良', health: 740, attack: 286, defense: 101, speed: 0.975 },
        { id: 190, name: '全域寂灭帝尊', level: 95, quality: 'BOSS', health: 2000, attack: 400, defense: 210, speed: 1.0 },

        // ==================== 96-100级怪物 ====================
        { id: 191, name: '太虚枯骨尸', level: 96, quality: '普通', health: 485, attack: 152, defense: 66, speed: 1.025 },
        { id: 192, name: '虚无本源畸变', level: 96, quality: '精良', health: 750, attack: 289, defense: 103, speed: 0.95 },
        { id: 193, name: '本源毒湮尸', level: 97, quality: '优秀', health: 758, attack: 292, defense: 100, speed: 0.975 },
        { id: 194, name: '鸿蒙镇界尸', level: 97, quality: '精良', health: 755, attack: 291, defense: 116, speed: 0.8 },
        { id: 195, name: '本源极速瞬杀', level: 98, quality: '普通', health: 492, attack: 155, defense: 67, speed: 1.225 },
        { id: 196, name: '天道裁决猎杀', level: 98, quality: '优秀', health: 765, attack: 295, defense: 102, speed: 0.925 },
        { id: 197, name: '万劫壁垒尸', level: 99, quality: '精良', health: 772, attack: 298, defense: 119, speed: 0.825 },
        { id: 198, name: '天道幽影尸', level: 99, quality: '优秀', health: 770, attack: 300, defense: 104, speed: 1.175 },
        { id: 199, name: '纪元狂怒尸', level: 100, quality: '精良', health: 780, attack: 303, defense: 107, speed: 1.0 },
        { id: 200, name: '末世终焉天帝', level: 100, quality: 'BOSS', health: 2500, attack: 450, defense: 240, speed: 1.05 }
    ],

    // 获取怪物配置
    getMonster: function(id) {
        return this.MONSTERS.find(m => m.id === id);
    },

    // 根据等级范围获取怪物
    getMonstersByLevelRange: function(minLevel, maxLevel) {
        return this.MONSTERS.filter(m => m.level >= minLevel && m.level <= maxLevel);
    },

    // 根据品质获取怪物
    getMonstersByQuality: function(quality) {
        return this.MONSTERS.filter(m => m.quality === quality);
    },

    // 根据名称获取怪物
    getMonsterByName: function(name) {
        return this.MONSTERS.find(m => m.name === name);
    },

    // 获取所有BOSS
    getAllBosses: function() {
        return this.getMonstersByQuality(this.QUALITY.BOSS);
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MONSTER_CONFIG;
}