// ==================== 装备系统配置文件 ====================
// 独立的装备配置文件，不写在index.html中
// 包含所有装备定义、属性配置、装备生成逻辑

// ==================== 装备品质配置 ====================
// ⭐ 副属性词条数固定：普通0、绿色1、蓝色2、紫色3、金色4
const EQUIPMENT_QUALITY_CONFIG = {
    '普通': { color: '#aaaaaa', multiplier: 1.0, minSubAttrs: 0, maxSubAttrs: 0 },
    '稀有': { color: '#51cf66', multiplier: 1.15, minSubAttrs: 1, maxSubAttrs: 1 },
    '优秀': { color: '#4dabf7', multiplier: 1.3, minSubAttrs: 2, maxSubAttrs: 2 },
    '精良': { color: '#da77f2', multiplier: 1.6, minSubAttrs: 3, maxSubAttrs: 3 },
    '史诗': { color: '#ffd700', multiplier: 2.0, minSubAttrs: 4, maxSubAttrs: 4 }
};

// ==================== 各职业副属性池 ====================
// 每个属性定义：type(属性名), baseValue(基础值), isPercent(是否百分比), perTier(每阶成长值)
const JOB_SUBATTR_POOL = {
    titan: [
        { type: '生命值', baseValue: 20, perTier: 15, isPercent: false },
        { type: '物理攻击', baseValue: 3, perTier: 2, isPercent: false },
        { type: '物理防御', baseValue: 2, perTier: 1.5, isPercent: false },
        { type: '暴击率', baseValue: 2, perTier: 1, isPercent: true },
        { type: '反伤', baseValue: 2, perTier: 1, isPercent: true },
        { type: '每5秒生命恢复', baseValue: 2, perTier: 1.5, isPercent: false },
        { type: '击退抗性', baseValue: 5, perTier: 3, isPercent: true },
        { type: '斩杀', baseValue: 10, perTier: 2, isPercent: true, isHighQuality: true }
    ],
    archer: [
        { type: '物理攻击', baseValue: 3, perTier: 2, isPercent: false },
        { type: '命中率', baseValue: 3, perTier: 2, isPercent: true },
        { type: '闪避率', baseValue: 2, perTier: 1.5, isPercent: true },
        { type: '暴击率', baseValue: 2, perTier: 1, isPercent: true },
        { type: '暴击伤害', baseValue: 5, perTier: 3, isPercent: true },
        { type: '攻击速度', baseValue: 2, perTier: 1.5, isPercent: true },
        { type: '子弹穿透', baseValue: 1, perTier: 0.5, isPercent: false },
        { type: '斩杀', baseValue: 10, perTier: 2, isPercent: true, isHighQuality: true }
    ],
    fireMage: [
        { type: '技能伤害', baseValue: 5, perTier: 3, isPercent: true },
        { type: '暴击率', baseValue: 2, perTier: 1, isPercent: true },
        { type: '暴击伤害', baseValue: 5, perTier: 3, isPercent: true },
        { type: '灼烧伤害', baseValue: 3, perTier: 2, isPercent: true },
        { type: '技能冷却缩减', baseValue: 2, perTier: 1, isPercent: true },
        { type: '生命值', baseValue: 15, perTier: 10, isPercent: false },
        { type: '法术防御', baseValue: 2, perTier: 1.5, isPercent: false },
        { type: '斩杀', baseValue: 10, perTier: 2, isPercent: true, isHighQuality: true }
    ],
    iceMage: [
        { type: '技能伤害', baseValue: 5, perTier: 3, isPercent: true },
        { type: '暴击率', baseValue: 2, perTier: 1, isPercent: true },
        { type: '减速效果', baseValue: 3, perTier: 2, isPercent: true },
        { type: '冻结几率', baseValue: 2, perTier: 1.5, isPercent: true },
        { type: '技能冷却缩减', baseValue: 2, perTier: 1, isPercent: true },
        { type: '生命值', baseValue: 15, perTier: 10, isPercent: false },
        { type: '法术防御', baseValue: 2, perTier: 1.5, isPercent: false },
        { type: '斩杀', baseValue: 10, perTier: 2, isPercent: true, isHighQuality: true }
    ]
};

const EQUIPMENT_CONFIG = {
    // ==================== 泰坦战士装备 ====================
    titan: {
        weapon: [
            { id: 'titan_weapon_1', name: '生锈铁锤', tier: 1, levelRange: [1, 5], mainAttr: { type: '物理攻击', min: 5, max: 8 }, subAttr: null, description: '短柄铁锤，锤头方形，布满红褐色锈迹和坑洞。木柄缠黑麻绳，尾端磨损。' },
            { id: 'titan_weapon_2', name: '钢制指虎', tier: 2, levelRange: [11, 15], mainAttr: { type: '物理攻击', min: 10, max: 15 }, subAttr: null, description: '黄铜色四孔指虎，手指处有尖刺。表面划痕和血迹，腕部皮质绑带生锈。' },
            { id: 'titan_weapon_3', name: '碎骨斧', tier: 3, levelRange: [21, 25], mainAttr: { type: '物理攻击', min: 18, max: 25 }, subAttr: null, description: '单刃手斧，弹簧钢打造，刃口崩裂成锯齿。斧背有砸痕，木柄黑胶带防滑。' },
            { id: 'titan_weapon_4', name: '重型链锯', tier: 4, levelRange: [31, 35], mainAttr: { type: '物理攻击', min: 28, max: 38 }, subAttr: null, description: '改造油锯，拆除外壳，链条齿轮外露。导板弯曲，链条缺齿，油箱外挂。' },
            { id: 'titan_weapon_5', name: '合金战锤', tier: 5, levelRange: [41, 45], mainAttr: { type: '物理攻击', min: 40, max: 52 }, subAttr: null, description: '六边形锤头，激光切割纹路，灰银色。碳纤维锤柄，防滑滚花，刻有编号。' },
            { id: 'titan_weapon_6', name: '动力拳套', tier: 6, levelRange: [51, 55], mainAttr: { type: '物理攻击', min: 55, max: 70 }, subAttr: null, description: '覆盖前臂机械手套，指关节液压活塞。哑光黑金属，蓝色LED灯带，手掌有排气孔。' },
            { id: 'titan_weapon_7', name: '等离子砍刀', tier: 7, levelRange: [61, 65], mainAttr: { type: '物理攻击', min: 72, max: 90 }, subAttr: null, description: '暗红色刀刃，内部等离子流纹路。刀背散热鳍片，陶瓷护手，橡胶握把带电量灯。' },
            { id: 'titan_weapon_8', name: '震动巨剑', tier: 8, levelRange: [71, 75], mainAttr: { type: '物理攻击', min: 92, max: 110 }, subAttr: null, description: '宽刃大剑，剑身两侧震动发生器（圆柱）。剑脊蓝色能量线，X形剑格，末端调节旋钮。' },
            { id: 'titan_weapon_9', name: '纳米战斧', tier: 9, levelRange: [81, 85], mainAttr: { type: '物理攻击', min: 105, max: 120 }, subAttr: null, description: '银灰色斧刃，表面液态光泽（纳米颗粒）。斧背方形控制模块，斧柄合金蜂窝镂空。' },
            { id: 'titan_weapon_10', name: '不朽者之拳', tier: 10, levelRange: [91, 95], mainAttr: { type: '物理攻击', min: 115, max: 125 }, subAttr: null, description: '前臂厚重铠甲包裹，巨大金属指节嵌红宝石。关节液压管外露，暗金色，散发微光。' }
        ],
        helmet: [
            { id: 'titan_helmet_1', name: '破皮帽', tier: 1, levelRange: [2, 6], mainAttr: { type: '物理防御', min: 1, max: 2 }, subAttr: { type: '生命值', min: 8, max: 12 }, description: '深棕色旧皮帽，帽檐塌陷，有裂纹和缝合痕迹。一侧烧焦破洞，内衬发黄棉絮。' },
            { id: 'titan_helmet_2', name: '铁皮桶盔', tier: 2, levelRange: [12, 16], mainAttr: { type: '物理防御', min: 2, max: 3 }, subAttr: { type: '生命值', min: 18, max: 28 }, description: '铁皮油桶上半部改造，铆钉拼接。蓝漆残留和锈迹，顶部焊接铁环把手，内衬旧报纸。' },
            { id: 'titan_helmet_3', name: '角斗士盔', tier: 3, levelRange: [22, 26], mainAttr: { type: '物理防御', min: 3, max: 5 }, subAttr: { type: '生命值', min: 35, max: 50 }, description: '半覆面铁盔，面罩T形视窗。盔顶磨损红色鬃毛（尼龙绳），脸颊划痕凹陷。' },
            { id: 'titan_helmet_4', name: '重型钢盔', tier: 4, levelRange: [32, 36], mainAttr: { type: '物理防御', min: 5, max: 7 }, subAttr: { type: '生命值', min: 55, max: 75 }, description: '二战M1钢盔，橄榄绿漆面斑驳。下颚带帆布，金属扣锈蚀，内衬网破损。' },
            { id: 'titan_helmet_5', name: '壁垒面甲', tier: 5, levelRange: [42, 46], mainAttr: { type: '物理防御', min: 7, max: 10 }, subAttr: { type: '生命值', min: 80, max: 105 }, description: '全覆盖头盔，眼部细长黑色玻璃镜。面部呼吸格栅，两侧圆形扬声孔，哑光黑，砂纸质感。' },
            { id: 'titan_helmet_6', name: '反击者冠', tier: 6, levelRange: [52, 56], mainAttr: { type: '物理防御', min: 10, max: 14 }, subAttr: { type: '生命值', min: 110, max: 140 }, description: '银灰色金属冠，前额圆形电容器，内蓝色电弧。两侧金属犄角，角尖电极。' },
            { id: 'titan_helmet_7', name: '合金颅甲', tier: 7, levelRange: [62, 66], mainAttr: { type: '物理防御', min: 14, max: 19 }, subAttr: { type: '生命值', min: 150, max: 190 }, description: '流线型钛合金头盔，光泽明亮。太阳穴感应模块，后脑勺散热鳍片，干净少磨损。' },
            { id: 'titan_helmet_8', name: '狂战士怒盔', tier: 8, levelRange: [72, 76], mainAttr: { type: '物理防御', min: 19, max: 25 }, subAttr: { type: '生命值', min: 200, max: 250 }, description: '红色涂装，面部愤怒鬼脸，眼眶红色LED。头顶尖刺，下颚金属獠牙。' },
            { id: 'titan_helmet_9', name: '纳米修复盔', tier: 9, levelRange: [82, 86], mainAttr: { type: '物理防御', min: 25, max: 32 }, subAttr: { type: '生命值', min: 260, max: 320 }, description: '银白色光滑头盔，表面流动纹理（纳米机器人）。太阳穴蓝色呼吸灯，无划痕。' },
            { id: 'titan_helmet_10', name: '战神圣冠', tier: 10, levelRange: [92, 96], mainAttr: { type: '物理防御', min: 32, max: 40 }, subAttr: { type: '生命值', min: 330, max: 400 }, description: '金色王冠状，顶部放射状尖刺。前额巨大红宝石，两侧金色护翼，华丽威严。' }
        ],
        clothes: [
            { id: 'titan_clothes_1', name: '破布衫', tier: 1, levelRange: [3, 7], mainAttr: { type: '物理防御', min: 1, max: 2 }, subAttr: null, description: '多层灰白碎布缝合，麻绳捆扎。油污血渍，下摆参差，肩部破洞。' },
            { id: 'titan_clothes_2', name: '硬皮甲', tier: 2, levelRange: [13, 17], mainAttr: { type: '物理防御', min: 2, max: 3 }, subAttr: null, description: '深褐色硬化皮革背心，表面鳞片压纹。边缘铜钉固定，胸部爪痕划伤。' },
            { id: 'titan_clothes_3', name: '锁子背心', tier: 3, levelRange: [23, 27], mainAttr: { type: '物理防御', min: 3, max: 5 }, subAttr: null, description: '铁环编织短袖背心，环径1cm。生锈，个别环脱落，内衬灰粗布，较重。' },
            { id: 'titan_clothes_4', name: '防暴护甲', tier: 4, levelRange: [33, 37], mainAttr: { type: '物理防御', min: 5, max: 7 }, subAttr: null, description: '黑色工程塑料护甲，覆盖躯干。肩胸加强筋，正面磨损"POLICE"字样。' },
            { id: 'titan_clothes_5', name: '陶瓷插板甲', tier: 5, levelRange: [43, 47], mainAttr: { type: '物理防御', min: 7, max: 10 }, subAttr: null, description: '卡其色战术背心，前后插白色陶瓷板。MOLLE织带，陶瓷板表面裂纹。' },
            { id: 'titan_clothes_6', name: '外骨骼胸甲', tier: 6, levelRange: [53, 57], mainAttr: { type: '物理防御', min: 10, max: 14 }, subAttr: null, description: '灰色金属胸甲，连接腰部液压支撑杆。背部微型气泵，胸甲中央圆形旋转接口。' },
            { id: 'titan_clothes_7', name: '合金动力铠', tier: 7, levelRange: [63, 67], mainAttr: { type: '物理防御', min: 14, max: 19 }, subAttr: null, description: '银灰色合金装甲，覆盖胸腹肩。关节橡胶密封圈，胸口蓝色能量指示灯。' },
            { id: 'titan_clothes_8', name: '能量偏转甲', tier: 8, levelRange: [73, 77], mainAttr: { type: '物理防御', min: 19, max: 25 }, subAttr: null, description: '白色陶瓷质感甲片，表面六边形蜂窝纹。肩部小型能量发生器（球形），整体轻。' },
            { id: 'titan_clothes_9', name: '纳米纤维内甲', tier: 9, levelRange: [83, 87], mainAttr: { type: '物理防御', min: 25, max: 32 }, subAttr: null, description: '黑色紧身衣，表面细腻鱼鳞纹理。高领，手臂银色线条，柔软反光。' },
            { id: 'titan_clothes_10', name: '不灭者战甲', tier: 10, levelRange: [93, 97], mainAttr: { type: '物理防御', min: 32, max: 40 }, subAttr: null, description: '古铜色全身甲，雕刻繁复花纹。关节金色环扣，胸口发光橙色核心。' }
        ],
        pants: [
            { id: 'titan_pants_1', name: '破洞工裤', tier: 1, levelRange: [4, 8], mainAttr: { type: '物理防御', min: 1, max: 2 }, subAttr: { type: '生命值', min: 6, max: 10 }, description: '深蓝帆布工装裤，膝盖磨破大洞。裤腿干泥，左口袋撕裂，仅剩一根背带。' },
            { id: 'titan_pants_2', name: '皮革护腿', tier: 2, levelRange: [14, 18], mainAttr: { type: '物理防御', min: 2, max: 3 }, subAttr: { type: '生命值', min: 15, max: 22 }, description: '棕色皮裤，大腿外侧加厚皮块。膝盖金属铆钉，铜色氧化拉链。' },
            { id: 'titan_pants_3', name: '钢制腿甲', tier: 3, levelRange: [24, 28], mainAttr: { type: '物理防御', min: 3, max: 5 }, subAttr: { type: '生命值', min: 25, max: 38 }, description: '黑色金属护腿，覆盖膝盖至小腿。内侧皮带捆绑，表面敲击凹痕。' },
            { id: 'titan_pants_4', name: '战术护膝裤', tier: 4, levelRange: [34, 38], mainAttr: { type: '物理防御', min: 5, max: 7 }, subAttr: { type: '生命值', min: 40, max: 58 }, description: '卡其色战术裤，膝盖内置硬质塑料护膝（圆形凸起）。多个魔术贴口袋。' },
            { id: 'titan_pants_5', name: '防爆腿铠', tier: 5, levelRange: [44, 48], mainAttr: { type: '物理防御', min: 7, max: 10 }, subAttr: { type: '生命值', min: 60, max: 82 }, description: '深灰复合纤维腿甲，大腿外侧加强条。小腿后方反光条，厚重。' },
            { id: 'titan_pants_6', name: '液压腿甲', tier: 6, levelRange: [54, 58], mainAttr: { type: '物理防御', min: 10, max: 14 }, subAttr: { type: '生命值', min: 85, max: 115 }, description: '银灰机械腿甲，大腿侧面液压缸。膝盖球形关节，脚踝减震弹簧。' },
            { id: 'titan_pants_7', name: '合金外骨骼腿', tier: 7, levelRange: [64, 68], mainAttr: { type: '物理防御', min: 14, max: 19 }, subAttr: { type: '生命值', min: 120, max: 160 }, description: '全金属腿部外骨骼，哑光黑，关节红色液压管。大腿前部散热格栅。' },
            { id: 'titan_pants_8', name: '电磁缓冲裤', tier: 8, levelRange: [74, 78], mainAttr: { type: '物理防御', min: 19, max: 25 }, subAttr: { type: '生命值', min: 170, max: 220 }, description: '灰白织物裤，大腿外侧扁平电磁线圈（银线刺绣）。裤脚磁吸扣。' },
            { id: 'titan_pants_9', name: '纳米修复腿甲', tier: 9, levelRange: [84, 88], mainAttr: { type: '物理防御', min: 25, max: 32 }, subAttr: { type: '生命值', min: 230, max: 300 }, description: '银白紧身腿甲，表面流动银色液体光泽。无接缝，一体成型。' },
            { id: 'titan_pants_10', name: '泰坦胫甲', tier: 10, levelRange: [94, 98], mainAttr: { type: '物理防御', min: 32, max: 40 }, subAttr: { type: '生命值', min: 310, max: 400 }, description: '巨型金色胫甲，表面刻符文。脚踝翼状装饰，厚重闪耀。' }
        ],
        shoes: [
            { id: 'titan_shoes_1', name: '草鞋', tier: 1, levelRange: [5, 9], mainAttr: { type: '物理防御', min: 1, max: 2 }, subAttr: { type: '击退抗性', min: 5, max: 8, isPercent: true }, description: '稻草编织，麻绳固定。鞋底磨薄露草茎，脚趾破洞。' },
            { id: 'titan_shoes_2', name: '硬底靴', tier: 2, levelRange: [15, 19], mainAttr: { type: '物理防御', min: 2, max: 3 }, subAttr: { type: '击退抗性', min: 9, max: 15, isPercent: true }, description: '黑色硬底皮鞋，厚橡胶底花纹磨平。鞋面划痕，棕色皮绳鞋带。' },
            { id: 'titan_shoes_3', name: '钢头军靴', tier: 3, levelRange: [25, 29], mainAttr: { type: '物理防御', min: 3, max: 5 }, subAttr: { type: '击退抗性', min: 16, max: 25, isPercent: true }, description: '绿色军靴，鞋头内置钢板（凸起）。靴帮高20cm，侧拉链，深纹底。' },
            { id: 'titan_shoes_4', name: '防滑履带鞋', tier: 4, levelRange: [35, 39], mainAttr: { type: '物理防御', min: 5, max: 7 }, subAttr: { type: '击退抗性', min: 26, max: 38, isPercent: true }, description: '鞋底小段橡胶履带，粗犷花纹。黑色帆布鞋面，金属鞋带环。' },
            { id: 'titan_shoes_5', name: '加重战靴', tier: 5, levelRange: [45, 49], mainAttr: { type: '物理防御', min: 7, max: 10 }, subAttr: { type: '击退抗性', min: 39, max: 55, isPercent: true }, description: '灰黑色靴子，鞋底夹层铅板（极重）。鞋跟铁块，鞋头圆润。' },
            { id: 'titan_shoes_6', name: '液压稳定靴', tier: 6, levelRange: [55, 59], mainAttr: { type: '物理防御', min: 10, max: 14 }, subAttr: { type: '击退抗性', min: 56, max: 75, isPercent: true }, description: '机械感靴子，小腿液压杆连接鞋跟。鞋底可调阻尼器，银色金属外观。' },
            { id: 'titan_shoes_7', name: '电磁吸附鞋', tier: 7, levelRange: [65, 69], mainAttr: { type: '物理防御', min: 14, max: 19 }, subAttr: { type: '击退抗性', min: 76, max: 100, isPercent: true }, description: '鞋底电磁铁结构，侧面开关。蓝色绝缘橡胶鞋面，钢丝鞋带。' },
            { id: 'titan_shoes_8', name: '反重力踝甲', tier: 8, levelRange: [75, 79], mainAttr: { type: '物理防御', min: 19, max: 25 }, subAttr: { type: '击退抗性', min: 101, max: 130, isPercent: true }, description: '环绕脚踝银白金属环，底部悬浮粒子。离地1cm，无鞋底。' },
            { id: 'titan_shoes_9', name: '时空锚定靴', tier: 9, levelRange: [85, 89], mainAttr: { type: '物理防御', min: 25, max: 32 }, subAttr: { type: '击退抗性', min: 131, max: 170, isPercent: true }, description: '造型奇特，鞋跟扭曲金属环。黑色哑光鞋面，钟表齿轮装饰。' },
            { id: 'titan_shoes_10', name: '不动明王履', tier: 10, levelRange: [95, 99], mainAttr: { type: '物理防御', min: 32, max: 40 }, subAttr: { type: '击退抗性', min: 171, max: 220, isPercent: true }, description: '金色金属靴，脚面愤怒明王面孔浮雕。鞋底金刚杵图案，沉重庄严。' }
        ],
        belt: [
            { id: 'titan_belt_1', name: '麻绳束腰', tier: 1, levelRange: [6, 10], mainAttr: null, subAttr: { type: '暴击率', min: 1, max: 1.5, isPercent: true }, description: '三股麻绳拧成，末端打结。绳体松散起毛，挂有生锈铁环。' },
            { id: 'titan_belt_2', name: '铁扣皮带', tier: 2, levelRange: [16, 20], mainAttr: null, subAttr: { type: '暴击率', min: 1.6, max: 2.5, isPercent: true }, description: '深棕色牛皮，方形铁扣（锈）。皮带表面裂纹，孔位拉长。' },
            { id: 'titan_belt_3', name: '厚牛皮带', tier: 3, levelRange: [26, 30], mainAttr: null, subAttr: { type: '暴击率', min: 2.6, max: 4, isPercent: true }, description: '双层厚牛皮，宽5cm。铜色带扣简单花纹，边缘磨损发白。' },
            { id: 'titan_belt_4', name: '力量腰带', tier: 4, levelRange: [36, 40], mainAttr: null, subAttr: { type: '暴击率', min: 4.1, max: 6, isPercent: true }, description: '黑色举重腰带，宽10cm，内侧记忆海绵。金属快拆扣带杠杆。' },
            { id: 'titan_belt_5', name: '爆发腰带', tier: 5, levelRange: [46, 50], mainAttr: null, subAttr: { type: '暴击率', min: 6.1, max: 9, isPercent: true }, description: '战术腰封，黑色尼龙，外挂小包。中间红色按钮（爆发模式）。' },
            { id: 'titan_belt_6', name: '冲击波腰链', tier: 6, levelRange: [56, 60], mainAttr: null, subAttr: { type: '暴击率', min: 9.1, max: 13, isPercent: true }, description: '银色金属链环，每节侧面微型冲击波发生器（圆形凸起）。' },
            { id: 'titan_belt_7', name: '怒意束腰', tier: 7, levelRange: [66, 70], mainAttr: null, subAttr: { type: '暴击率', min: 13.1, max: 18, isPercent: true }, description: '红色皮质，带扣咆哮狮头。狮眼镶嵌红色玻璃珠。' },
            { id: 'titan_belt_8', name: '狂暴腰封', tier: 8, levelRange: [76, 80], mainAttr: null, subAttr: { type: '暴击率', min: 18.1, max: 25, isPercent: true }, description: '带刺金属腰封，布满铆钉。中央骷髅头浮雕，暗红色。' },
            { id: 'titan_belt_9', name: '战神之怒', tier: 9, levelRange: [86, 90], mainAttr: null, subAttr: { type: '暴击率', min: 25.1, max: 35, isPercent: true }, description: '金色链甲腰带，挂迷你战斧战锤吊坠。带扣交叉双斧图案。' },
            { id: 'titan_belt_10', name: '毁灭者腰带', tier: 10, levelRange: [96, 100], mainAttr: null, subAttr: { type: '暴击率', min: 35.1, max: 50, isPercent: true }, description: '暗紫色皮质，带扣张开手掌，掌心黑宝石。腰带边缘符文刻印。' }
        ],
        necklace: [
            { id: 'titan_necklace_1', name: '骨牙项链', tier: 1, levelRange: [1, 5], mainAttr: null, subAttr: { type: '反伤', min: 1, max: 2, isPercent: true }, description: '细麻绳串三颗小型犬齿，泛黄有裂纹。打结处干涸血迹。' },
            { id: 'titan_necklace_2', name: '铁蒺藜挂坠', tier: 2, levelRange: [11, 15], mainAttr: null, subAttr: { type: '反伤', min: 3, max: 5, isPercent: true }, description: '四角铁蒺藜，中心穿孔铁丝悬挂。表面锈迹斑斑，可做暗器。' },
            { id: 'titan_necklace_3', name: '荆棘护符', tier: 3, levelRange: [21, 25], mainAttr: null, subAttr: { type: '反伤', min: 6, max: 9, isPercent: true }, description: '银白金属雕刻荆棘环，缠绕圆形。尖刺锋利，背面模糊铭文。' },
            { id: 'titan_necklace_4', name: '复仇印记', tier: 4, levelRange: [31, 35], mainAttr: null, subAttr: { type: '反伤', min: 10, max: 14, isPercent: true }, description: '黑色金属方块，表面刻"V"。边缘红色涂料，挂链铁链。' },
            { id: 'titan_necklace_5', name: '反击核心', tier: 5, levelRange: [41, 45], mainAttr: null, subAttr: { type: '反伤', min: 15, max: 20, isPercent: true }, description: '圆形装置，外壳透明，内红液体和金属片。液体晃动。' },
            { id: 'titan_necklace_6', name: '血誓项链', tier: 6, levelRange: [51, 55], mainAttr: null, subAttr: { type: '反伤', min: 21, max: 25, isPercent: true }, description: '红色玻璃珠，内部血丝纹路。挂坠底部尖刺，暗红色。' },
            { id: 'titan_necklace_7', name: '荆棘光环', tier: 7, levelRange: [61, 65], mainAttr: null, subAttr: { type: '反伤', min: 26, max: 30, isPercent: true }, description: '青色水晶石，多面体。内部淡绿光晕，周围微弱光粒子。' },
            { id: 'titan_necklace_8', name: '绝望之眼', tier: 8, levelRange: [71, 75], mainAttr: null, subAttr: { type: '反伤', min: 26, max: 30, isPercent: true }, description: '椭圆形黑宝石，中间竖直瞳孔图案。瞳孔泛紫光，触感冰冷。' },
            { id: 'titan_necklace_9', name: '不朽契约', tier: 9, levelRange: [81, 85], mainAttr: null, subAttr: { type: '反伤', min: 26, max: 30, isPercent: true }, description: '泛黄羊皮纸卷成筒，金线捆绑。挂坠盒可打开，内血字。' },
            { id: 'titan_necklace_10', name: '泰坦之心', tier: 10, levelRange: [91, 95], mainAttr: null, subAttr: { type: '反伤', min: 26, max: 30, isPercent: true }, description: '拳头大小心脏形金属，表面血管纹路。中心节奏闪烁红光。' }
        ],
        ring: [
            { id: 'titan_ring_1', name: '铁环', tier: 1, levelRange: [1, 5], mainAttr: null, subAttr: { type: '每5秒生命恢复', min: 0.5, max: 1 }, description: '灰黑色铁环，表面粗糙，铸造气孔。内壁锈蚀，极简。' },
            { id: 'titan_ring_2', name: '铜戒指', tier: 2, levelRange: [11, 15], mainAttr: null, subAttr: { type: '每5秒生命恢复', min: 2, max: 4 }, description: '黄铜圆环，宽3mm。抛光氧化变暗，无装饰。' },
            { id: 'titan_ring_3', name: '血石指环', tier: 3, levelRange: [21, 25], mainAttr: null, subAttr: { type: '每5秒生命恢复', min: 5, max: 8 }, description: '银色戒托，镶嵌暗红椭圆石。石头表面裂纹。' },
            { id: 'titan_ring_4', name: '生机之戒', tier: 4, levelRange: [31, 35], mainAttr: null, subAttr: { type: '每5秒生命恢复', min: 9, max: 13 }, description: '绿色玉髓圆环，半透明。内部丝状绿包裹体，光滑。' },
            { id: 'titan_ring_5', name: '强壮指环', tier: 5, levelRange: [41, 45], mainAttr: null, subAttr: { type: '每5秒生命恢复', min: 14, max: 18 }, description: '宽厚钨钢戒指，表面磨砂。刻盾牌图案，重。' },
            { id: 'titan_ring_6', name: '再生戒指', tier: 6, levelRange: [51, 55], mainAttr: null, subAttr: { type: '每5秒生命恢复', min: 19, max: 23 }, description: '银色戒指，表面蜗牛壳螺旋纹。中心嵌透明树脂。' },
            { id: 'titan_ring_7', name: '不朽之证', tier: 7, levelRange: [61, 65], mainAttr: null, subAttr: { type: '每5秒生命恢复', min: 24, max: 27 }, description: '骨白陶瓷戒指，雕刻骷髅头。骷髅眼睛小红宝石。' },
            { id: 'titan_ring_8', name: '生命源泉', tier: 8, levelRange: [71, 75], mainAttr: null, subAttr: { type: '每5秒生命恢复', min: 28, max: 30 }, description: '蓝色水晶环，内部液态流动。触感温润，会发光。' },
            { id: 'titan_ring_9', name: '凤凰之戒', tier: 9, levelRange: [81, 85], mainAttr: null, subAttr: { type: '每5秒生命恢复', min: 28, max: 30 }, description: '金色戒指，戒面展翅凤凰浮雕。凤凰眼睛红宝石。' },
            { id: 'titan_ring_10', name: '永恒指环', tier: 10, levelRange: [91, 95], mainAttr: null, subAttr: { type: '每5秒生命恢复', min: 28, max: 30 }, description: '纯白金戒指，无装饰，表面极细腻符文环刻。永恒光泽。' }
        ]
    },

    // ==================== 神射手装备 ====================
    archer: {
        weapon: [
            { id: 'archer_weapon_1', name: '自制弹弓', tier: 1, levelRange: [1, 5], mainAttr: { type: '物理攻击', min: 5, max: 8 }, subAttr: null, description: 'Y形树杈，去皮浅黄色。皮筋黑色橡皮管，连接皮革弹兜。缠细铁丝固定。' },
            { id: 'archer_weapon_2', name: '简陋弓', tier: 2, levelRange: [11, 15], mainAttr: { type: '物理攻击', min: 10, max: 15 }, subAttr: null, description: '单根弯木弓臂，尼龙绳弓弦。弓把缠布条，弦上有简易瞄准结。' },
            { id: 'archer_weapon_3', name: '猎弩', tier: 3, levelRange: [21, 25], mainAttr: { type: '物理攻击', min: 18, max: 25 }, subAttr: null, description: '钢片弩臂，黑色聚合物弩托。机械瞄具（两片铁），弩弦钢丝。' },
            { id: 'archer_weapon_4', name: '轻手枪', tier: 4, levelRange: [31, 35], mainAttr: { type: '物理攻击', min: 28, max: 38 }, subAttr: null, description: '左轮手枪，银灰枪身，木制握把。转轮6发弹巢，枪管短。' },
            { id: 'archer_weapon_5', name: '复合弓', tier: 5, levelRange: [41, 45], mainAttr: { type: '物理攻击', min: 40, max: 52 }, subAttr: null, description: '黑色滑轮弓，碳纤维弓臂。平衡杆和瞄准镜，彩色编织弓弦。' },
            { id: 'archer_weapon_6', name: '冲锋枪', tier: 6, levelRange: [51, 55], mainAttr: { type: '物理攻击', min: 55, max: 70 }, subAttr: null, description: '微型冲锋枪，哑光黑，折叠枪托。弹匣弯曲，枪口有消音器螺纹。' },
            { id: 'archer_weapon_7', name: '狙击步枪', tier: 7, levelRange: [61, 65], mainAttr: { type: '物理攻击', min: 72, max: 90 }, subAttr: null, description: '长枪管，迷彩涂装。高倍瞄准镜（大物镜），两脚架折叠。' },
            { id: 'archer_weapon_8', name: '霰弹枪', tier: 8, levelRange: [71, 75], mainAttr: { type: '物理攻击', min: 92, max: 110 }, subAttr: null, description: '泵动式，木质枪托。枪管下方管状弹仓，枪口散热孔。' },
            { id: 'archer_weapon_9', name: '电磁加速枪', tier: 9, levelRange: [81, 85], mainAttr: { type: '物理攻击', min: 105, max: 120 }, subAttr: null, description: '未来风格，白色塑料外壳，蓝色能量线圈外露。无枪管，加速轨道。' },
            { id: 'archer_weapon_10', name: '死亡标记', tier: 10, levelRange: [91, 95], mainAttr: { type: '物理攻击', min: 115, max: 125 }, subAttr: null, description: '全黑手枪，握把骷髅浮雕。枪身红色呼吸灯，瞄准时亮起。' }
        ],
        helmet: [
            { id: 'archer_helmet_1', name: '遮阳帽', tier: 1, levelRange: [2, 6], mainAttr: { type: '物理防御', min: 1, max: 2 }, subAttr: { type: '命中率', min: 1, max: 3, isPercent: true }, description: '草帽，宽檐。顶部有破洞，帽带松紧。' },
            { id: 'archer_helmet_2', name: '单筒望远镜盔', tier: 2, levelRange: [12, 16], mainAttr: { type: '物理防御', min: 2, max: 3 }, subAttr: { type: '命中率', min: 4, max: 8, isPercent: true }, description: '皮革头盔，右侧固定伸缩单筒镜。镜片有划痕。' },
            { id: 'archer_helmet_3', name: '狙击目镜', tier: 3, levelRange: [22, 26], mainAttr: { type: '物理防御', min: 3, max: 5 }, subAttr: { type: '命中率', min: 10, max: 16, isPercent: true }, description: '黑色战术头盔，眼部十字准星镜片。可调节焦距。' },
            { id: 'archer_helmet_4', name: '战术头盔', tier: 4, levelRange: [32, 36], mainAttr: { type: '物理防御', min: 5, max: 7 }, subAttr: { type: '命中率', min: 18, max: 25, isPercent: true }, description: '迷彩头盔，带激光测距模块。侧面导轨挂手电。' },
            { id: 'archer_helmet_5', name: '热成像面罩', tier: 5, levelRange: [42, 46], mainAttr: { type: '物理防御', min: 7, max: 10 }, subAttr: { type: '命中率', min: 28, max: 38, isPercent: true }, description: '全覆盖面罩，红色热成像屏。可透视烟雾。' },
            { id: 'archer_helmet_6', name: '智能瞄准盔', tier: 6, levelRange: [52, 56], mainAttr: { type: '物理防御', min: 10, max: 14 }, subAttr: { type: '命中率', min: 40, max: 55, isPercent: true }, description: '银灰色金属盔，内置弹道计算机。镜片显示锁定框。' },
            { id: 'archer_helmet_7', name: '鹰眼冠', tier: 7, levelRange: [62, 66], mainAttr: { type: '物理防御', min: 14, max: 19 }, subAttr: { type: '命中率', min: 60, max: 80, isPercent: true }, description: '金色头冠，眼位镶嵌鹰眼石。佩戴后视野放大。' },
            { id: 'archer_helmet_8', name: '预知头盔', tier: 8, levelRange: [72, 76], mainAttr: { type: '物理防御', min: 19, max: 25 }, subAttr: { type: '命中率', min: 85, max: 110, isPercent: true }, description: '白色光滑头盔，脑部感应器。可短暂预判敌人位置。' },
            { id: 'archer_helmet_9', name: '神射之瞳', tier: 9, levelRange: [82, 86], mainAttr: { type: '物理防御', min: 25, max: 32 }, subAttr: { type: '命中率', min: 120, max: 150, isPercent: true }, description: '水晶透明面罩，虹膜识别。瞄准线自动跟踪。' },
            { id: 'archer_helmet_10', name: '上帝视角', tier: 10, levelRange: [92, 96], mainAttr: { type: '物理防御', min: 32, max: 40 }, subAttr: { type: '命中率', min: 180, max: 250, isPercent: true }, description: '金色光环悬浮头顶，无实体。全图锁定目标。' }
        ],
        clothes: [
            { id: 'archer_clothes_1', name: '布衣', tier: 1, levelRange: [3, 7], mainAttr: { type: '物理防御', min: 1, max: 2 }, subAttr: { type: '闪避率', min: 1, max: 2, isPercent: true }, description: '灰色棉布衣，宽松。袖口磨损，纽扣缺失。' },
            { id: 'archer_clothes_2', name: '皮夹克', tier: 2, levelRange: [13, 17], mainAttr: { type: '物理防御', min: 2, max: 3 }, subAttr: { type: '闪避率', min: 2, max: 5, isPercent: true }, description: '黑色皮夹克，光滑。拉链生锈，肩部有划痕。' },
            { id: 'archer_clothes_3', name: '猎手外套', tier: 3, levelRange: [23, 27], mainAttr: { type: '物理防御', min: 3, max: 5 }, subAttr: { type: '闪避率', min: 6, max: 10, isPercent: true }, description: '卡其色帆布外套，多口袋。背后有箭袋挂环。' },
            { id: 'archer_clothes_4', name: '轻便防弹衣', tier: 4, levelRange: [33, 37], mainAttr: { type: '物理防御', min: 5, max: 7 }, subAttr: { type: '闪避率', min: 12, max: 18, isPercent: true }, description: '黑色凯夫拉背心，轻。表面有弹孔痕迹。' },
            { id: 'archer_clothes_5', name: '迷彩伪装服', tier: 5, levelRange: [43, 47], mainAttr: { type: '物理防御', min: 7, max: 10 }, subAttr: { type: '闪避率', min: 20, max: 28, isPercent: true }, description: '丛林迷彩，带树叶装饰。布料有网眼。' },
            { id: 'archer_clothes_6', name: '光学迷彩甲', tier: 6, levelRange: [53, 57], mainAttr: { type: '物理防御', min: 10, max: 14 }, subAttr: { type: '闪避率', min: 30, max: 42, isPercent: true }, description: '银白色鳞片甲，折射光线。移动时半透明。' },
            { id: 'archer_clothes_7', name: '疾风外套', tier: 7, levelRange: [63, 67], mainAttr: { type: '物理防御', min: 14, max: 19 }, subAttr: { type: '闪避率', min: 45, max: 60, isPercent: true }, description: '蓝色轻量化外套，后背有气流导管。高速移动。' },
            { id: 'archer_clothes_8', name: '幻影披风', tier: 8, levelRange: [73, 77], mainAttr: { type: '物理防御', min: 19, max: 25 }, subAttr: { type: '闪避率', min: 65, max: 85, isPercent: true }, description: '黑色丝绸披风，边缘有残影特效。留下多个幻象。' },
            { id: 'archer_clothes_9', name: '虚空衣', tier: 9, levelRange: [83, 87], mainAttr: { type: '物理防御', min: 25, max: 32 }, subAttr: { type: '闪避率', min: 90, max: 120, isPercent: true }, description: '深紫色半透明紧身衣，星空纹。可短暂遁入虚空。' },
            { id: 'archer_clothes_10', name: '无形者战甲', tier: 10, levelRange: [93, 97], mainAttr: { type: '物理防御', min: 32, max: 40 }, subAttr: { type: '闪避率', min: 150, max: 200, isPercent: true }, description: '完全透明，仅轮廓可见。攻击时显形半秒。' }
        ],
        pants: [
            { id: 'archer_pants_1', name: '短裤', tier: 1, levelRange: [4, 8], mainAttr: { type: '物理防御', min: 1, max: 2 }, subAttr: { type: '移动速度', min: 1, max: 2, isPercent: true }, description: '卡其色短裤，膝盖以上。抽绳腰围。' },
            { id: 'archer_pants_2', name: '运动裤', tier: 2, levelRange: [14, 18], mainAttr: { type: '物理防御', min: 2, max: 3 }, subAttr: { type: '移动速度', min: 2, max: 4, isPercent: true }, description: '黑色弹性针织裤，侧边白条纹。舒适。' },
            { id: 'archer_pants_3', name: '战术裤', tier: 3, levelRange: [24, 28], mainAttr: { type: '物理防御', min: 3, max: 5 }, subAttr: { type: '移动速度', min: 4, max: 7, isPercent: true }, description: '军绿色，膝盖加厚。多个贴袋，裤脚抽绳。' },
            { id: 'archer_pants_4', name: '轻量化腿甲', tier: 4, levelRange: [34, 38], mainAttr: { type: '物理防御', min: 5, max: 7 }, subAttr: { type: '移动速度', min: 8, max: 12, isPercent: true }, description: '碳纤维护腿，极轻。绑带固定。' },
            { id: 'archer_pants_5', name: '奔跑者护腿', tier: 5, levelRange: [44, 48], mainAttr: { type: '物理防御', min: 7, max: 10 }, subAttr: { type: '移动速度', min: 13, max: 18, isPercent: true }, description: '灰色弹性腿套，小腿有支撑条。反光条。' },
            { id: 'archer_pants_6', name: '气垫裤', tier: 6, levelRange: [54, 58], mainAttr: { type: '物理防御', min: 10, max: 14 }, subAttr: { type: '移动速度', min: 20, max: 28, isPercent: true }, description: '蓝色膨胀裤，内置气垫。走路有缓冲。' },
            { id: 'archer_pants_7', name: '喷射加速裤', tier: 7, levelRange: [64, 68], mainAttr: { type: '物理防御', min: 14, max: 19 }, subAttr: { type: '移动速度', min: 30, max: 40, isPercent: true }, description: '银色金属裤，小腿后侧喷嘴。可短距冲刺。' },
            { id: 'archer_pants_8', name: '时空加速腿甲', tier: 8, levelRange: [74, 78], mainAttr: { type: '物理防御', min: 19, max: 25 }, subAttr: { type: '移动速度', min: 45, max: 60, isPercent: true }, description: '黑色流线型腿甲，时间扭曲纹理。移动时残影。' },
            { id: 'archer_pants_9', name: '闪电腿', tier: 9, levelRange: [84, 88], mainAttr: { type: '物理防御', min: 25, max: 32 }, subAttr: { type: '移动速度', min: 70, max: 90, isPercent: true }, description: '黄色透明紧身裤，内部电弧。化作电光移动。' },
            { id: 'archer_pants_10', name: '瞬移束腿', tier: 10, levelRange: [94, 98], mainAttr: { type: '物理防御', min: 32, max: 40 }, subAttr: { type: '移动速度', min: 100, max: 150, isPercent: true }, description: '蓝色光环环绕大腿，可短距瞬移。无实体。' }
        ],
        shoes: [
            { id: 'archer_shoes_1', name: '草鞋', tier: 1, levelRange: [5, 9], mainAttr: { type: '物理防御', min: 1, max: 2 }, subAttr: { type: '射速', min: 2, max: 3, isPercent: true }, description: '稻草编织，麻绳固定。轻便但磨脚。' },
            { id: 'archer_shoes_2', name: '软底鞋', tier: 2, levelRange: [15, 19], mainAttr: { type: '物理防御', min: 2, max: 3 }, subAttr: { type: '射速', min: 4, max: 7, isPercent: true }, description: '黑色布鞋，橡胶软底。无声行走。' },
            { id: 'archer_shoes_3', name: '速射靴', tier: 3, levelRange: [25, 29], mainAttr: { type: '物理防御', min: 3, max: 5 }, subAttr: { type: '射速', min: 8, max: 13, isPercent: true }, description: '棕色皮靴，鞋底有弹簧。提升出手速度。' },
            { id: 'archer_shoes_4', name: '轻量跑鞋', tier: 4, levelRange: [35, 39], mainAttr: { type: '物理防御', min: 5, max: 7 }, subAttr: { type: '射速', min: 15, max: 22, isPercent: true }, description: '白色网面跑鞋，泡沫底。极轻。' },
            { id: 'archer_shoes_5', name: '冲锋靴', tier: 5, levelRange: [45, 49], mainAttr: { type: '物理防御', min: 7, max: 10 }, subAttr: { type: '射速', min: 25, max: 35, isPercent: true }, description: '黑色高帮靴，鞋跟发条装饰。连续射击加速。' },
            { id: 'archer_shoes_6', name: '神经反射鞋', tier: 6, levelRange: [55, 59], mainAttr: { type: '物理防御', min: 10, max: 14 }, subAttr: { type: '射速', min: 40, max: 55, isPercent: true }, description: '银色金属鞋，脚踝电极贴片。电信号加速。' },
            { id: 'archer_shoes_7', name: '风之子', tier: 7, levelRange: [65, 69], mainAttr: { type: '物理防御', min: 14, max: 19 }, subAttr: { type: '射速', min: 60, max: 80, isPercent: true }, description: '青色皮质靴，鞋底气孔。踏风，连射如雨。' },
            { id: 'archer_shoes_8', name: '子弹时间靴', tier: 8, levelRange: [75, 79], mainAttr: { type: '物理防御', min: 19, max: 25 }, subAttr: { type: '射速', min: 90, max: 120, isPercent: true }, description: '黑色金属靴，脚腕有钟表齿轮。释放技能时时间减速。' },
            { id: 'archer_shoes_9', name: '无限射击鞋', tier: 9, levelRange: [85, 89], mainAttr: { type: '物理防御', min: 25, max: 32 }, subAttr: { type: '射速', min: 130, max: 180, isPercent: true }, description: '白色透明靴，内部无限符号。攻击不耗弹药。' },
            { id: 'archer_shoes_10', name: '神速之足', tier: 10, levelRange: [95, 99], mainAttr: { type: '物理防御', min: 32, max: 40 }, subAttr: { type: '射速', min: 200, max: 300, isPercent: true }, description: '金色靴，脚底光轮。每秒射数十发。' }
        ],
        belt: [
            { id: 'archer_belt_1', name: '布袋腰带', tier: 1, levelRange: [6, 10], mainAttr: null, subAttr: { type: '弹药容量', min: 5, max: 10, isPercent: true }, description: '麻绳系腰，挂小布袋。装石子。' },
            { id: 'archer_belt_2', name: '弹匣包带', tier: 2, levelRange: [16, 20], mainAttr: null, subAttr: { type: '弹药容量', min: 12, max: 20, isPercent: true }, description: '黑色尼龙腰带，挂两个弹匣包。魔术贴封口。' },
            { id: 'archer_belt_3', name: '快速换弹腰带', tier: 3, levelRange: [26, 30], mainAttr: null, subAttr: { type: '弹药容量', min: 22, max: 35, isPercent: true }, description: '战术腰封，弹匣快拔套。换弹速度提升。' },
            { id: 'archer_belt_4', name: '弹药链', tier: 4, levelRange: [36, 40], mainAttr: null, subAttr: { type: '弹药容量', min: 40, max: 60, isPercent: true }, description: '金属链带，挂满子弹。环绕腰间，持续供弹。' },
            { id: 'archer_belt_5', name: '空间弹带', tier: 5, levelRange: [46, 50], mainAttr: null, subAttr: { type: '弹药容量', min: 70, max: 100, isPercent: true }, description: '灰色布带，压缩空间。可装大量弹药。' },
            { id: 'archer_belt_6', name: '补给腰带', tier: 6, levelRange: [56, 60], mainAttr: null, subAttr: { type: '弹药容量', min: 70, max: 100, isPercent: true }, description: '绿色腰带，自动生成低级弹药。缓慢恢复弹药。' },
            { id: 'archer_belt_7', name: '无限弹链', tier: 7, levelRange: [66, 70], mainAttr: null, subAttr: { type: '弹药容量', min: 70, max: 100, isPercent: true }, description: '金色链带，无穷符号。弹药永不耗尽。' },
            { id: 'archer_belt_8', name: '元素弹带', tier: 8, levelRange: [76, 80], mainAttr: null, subAttr: { type: '弹药容量', min: 70, max: 100, isPercent: true }, description: '彩色腰带，挂不同元素弹匣。附加元素伤害。' },
            { id: 'archer_belt_9', name: '穿甲腰带', tier: 9, levelRange: [86, 90], mainAttr: null, subAttr: { type: '弹药容量', min: 70, max: 100, isPercent: true }, description: '黑色钨钢腰带，子弹无视护甲。' },
            { id: 'archer_belt_10', name: '毁灭弹链', tier: 10, levelRange: [96, 100], mainAttr: null, subAttr: { type: '弹药容量', min: 70, max: 100, isPercent: true }, description: '红色链带，每颗子弹微型爆炸。每一发都是范围伤害。' }
        ],
        necklace: [
            { id: 'archer_necklace_1', name: '羽毛吊坠', tier: 1, levelRange: [1, 5], mainAttr: null, subAttr: { type: '暴击伤害', min: 5, max: 10, isPercent: true }, description: '白色羽毛，银链。轻柔。' },
            { id: 'archer_necklace_2', name: '瞄准镜坠', tier: 2, levelRange: [11, 15], mainAttr: null, subAttr: { type: '暴击伤害', min: 12, max: 20, isPercent: true }, description: '微型金属瞄准镜，可窥视。挂链铁。' },
            { id: 'archer_necklace_3', name: '精准护符', tier: 3, levelRange: [21, 25], mainAttr: null, subAttr: { type: '暴击伤害', min: 25, max: 40, isPercent: true }, description: '银质圆形护符，刻靶心。中心红点。' },
            { id: 'archer_necklace_4', name: '致命标记', tier: 4, levelRange: [31, 35], mainAttr: null, subAttr: { type: '暴击伤害', min: 45, max: 65, isPercent: true }, description: '黑色金属片，刻"X"。边缘锋利。' },
            { id: 'archer_necklace_5', name: '狙击之眼', tier: 5, levelRange: [41, 45], mainAttr: null, subAttr: { type: '暴击伤害', min: 70, max: 100, isPercent: true }, description: '玻璃球，内有鹰眼图案。泛黄光。' },
            { id: 'archer_necklace_6', name: '死神凝视', tier: 6, levelRange: [51, 55], mainAttr: null, subAttr: { type: '暴击伤害', min: 110, max: 150, isPercent: true }, description: '骷髅头银饰，眼眶红宝石。暴击斩杀低血量。' },
            { id: 'archer_necklace_7', name: '贯穿项链', tier: 7, levelRange: [61, 65], mainAttr: null, subAttr: { type: '暴击伤害', min: 160, max: 220, isPercent: true }, description: '银色箭头吊坠，尾部带血槽。暴击穿透所有敌人。' },
            { id: 'archer_necklace_8', name: '因果律', tier: 8, levelRange: [71, 75], mainAttr: null, subAttr: { type: '暴击伤害', min: 240, max: 320, isPercent: true }, description: '扭曲金属环，莫比乌斯形状。必定暴击但伤害浮动。' },
            { id: 'archer_necklace_9', name: '一箭穿心', tier: 9, levelRange: [81, 85], mainAttr: null, subAttr: { type: '暴击伤害', min: 300, max: 350, isPercent: true }, description: '心形金属，中间插箭。暴击无视防御。' },
            { id: 'archer_necklace_10', name: '末日预言', tier: 10, levelRange: [91, 95], mainAttr: null, subAttr: { type: '暴击伤害', min: 300, max: 350, isPercent: true }, description: '黑色水晶，内有裂缝。暴击即死（BOSS除外）。' }
        ],
        ring: [
            { id: 'archer_ring_1', name: '藤蔓戒指', tier: 1, levelRange: [1, 5], mainAttr: null, subAttr: { type: '子弹穿透', min: 0, max: 1 }, description: '绿藤编环，细叶。易断。' },
            { id: 'archer_ring_2', name: '尖刺指环', tier: 2, levelRange: [11, 15], mainAttr: null, subAttr: { type: '子弹穿透', min: 0, max: 1 }, description: '铜色指环，外圈尖刺。概率穿透。' },
            { id: 'archer_ring_3', name: '贯穿戒指', tier: 3, levelRange: [21, 25], mainAttr: null, subAttr: { type: '子弹穿透', min: 1, max: 1 }, description: '银戒指，刻箭头。必定穿透一个敌人。' },
            { id: 'archer_ring_4', name: '强化穿透戒', tier: 4, levelRange: [31, 35], mainAttr: null, subAttr: { type: '子弹穿透', min: 1, max: 2 }, description: '钨钢戒指，厚重。可穿透多个。' },
            { id: 'archer_ring_5', name: '裂甲指环', tier: 5, levelRange: [41, 45], mainAttr: null, subAttr: { type: '子弹穿透', min: 2, max: 2 }, description: '黑色戒指，表面锯齿。穿透后削弱护甲。' },
            { id: 'archer_ring_6', name: '无限贯穿', tier: 6, levelRange: [51, 55], mainAttr: null, subAttr: { type: '子弹穿透', min: 2, max: 3 }, description: '银色光环，内部∞符号。穿透不衰减。' },
            { id: 'archer_ring_7', name: '弹射戒指', tier: 7, levelRange: [61, 65], mainAttr: null, subAttr: { type: '子弹穿透', min: 3, max: 3 }, description: '金色戒指，棱面。穿透后弹射附近敌人。' },
            { id: 'archer_ring_8', name: '折射之戒', tier: 8, levelRange: [71, 75], mainAttr: null, subAttr: { type: '子弹穿透', min: 3, max: 4 }, description: '水晶环，多棱角。子弹可在敌人间折射。' },
            { id: 'archer_ring_9', name: '虚空穿透', tier: 9, levelRange: [81, 85], mainAttr: null, subAttr: { type: '子弹穿透', min: 4, max: 4 }, description: '黑色环，无光。无视一切障碍物。' },
            { id: 'archer_ring_10', name: '次元指环', tier: 10, levelRange: [91, 95], mainAttr: null, subAttr: { type: '子弹穿透', min: 5, max: 5 }, description: '透明环，内部有裂缝。子弹穿过所有敌人，无限距离。' }
        ]
    },

    // ==================== 火焰法师装备 ====================
    fireMage: {
        weapon: [
            { id: 'fireMage_weapon_1', name: '余烬短杖', tier: 1, levelRange: [1, 5], mainAttr: { type: '火攻击', min: 5, max: 8 }, subAttr: null, description: '短杖，深灰色，顶端有烧焦的痕迹。嵌入一小块红玛瑙，微微发热。' },
            { id: 'fireMage_weapon_2', name: '烈焰法杖', tier: 2, levelRange: [11, 15], mainAttr: { type: '火攻击', min: 10, max: 15 }, subAttr: null, description: '红色金属杖身，顶端火焰造型。火苗由铜片制成，涂有反光漆。' },
            { id: 'fireMage_weapon_3', name: '熔岩法杖', tier: 3, levelRange: [21, 25], mainAttr: { type: '火攻击', min: 18, max: 25 }, subAttr: null, description: '黑色杖身，表面有红色裂纹（仿熔岩）。顶端一颗圆形红宝石，透光。' },
            { id: 'fireMage_weapon_4', name: '凤凰法杖', tier: 4, levelRange: [31, 35], mainAttr: { type: '火攻击', min: 28, max: 38 }, subAttr: null, description: '金色杖身，顶端凤凰展翅造型。凤凰眼睛为红宝石，翅膀有羽毛纹路。' },
            { id: 'fireMage_weapon_5', name: '地狱火杖', tier: 5, levelRange: [41, 45], mainAttr: { type: '火攻击', min: 40, max: 52 }, subAttr: null, description: '暗红色杖身，刻有火焰符文。顶端悬浮一颗燃烧的黑色球体（特效）。' },
            { id: 'fireMage_weapon_6', name: '龙息法杖', tier: 6, levelRange: [51, 55], mainAttr: { type: '火攻击', min: 55, max: 70 }, subAttr: null, description: '青铜色杖身，顶端龙头造型。龙口张开，内有一颗红色珠子。' },
            { id: 'fireMage_weapon_7', name: '太阳权杖', tier: 7, levelRange: [61, 65], mainAttr: { type: '火攻击', min: 72, max: 90 }, subAttr: null, description: '金色权杖，顶端圆形太阳浮雕。边缘有放射状金光，中心嵌黄水晶。' },
            { id: 'fireMage_weapon_8', name: '末日审判杖', tier: 8, levelRange: [71, 75], mainAttr: { type: '火攻击', min: 92, max: 110 }, subAttr: null, description: '暗金色杖身，布满焦痕。顶端一颗菱形红宝石，内部有岩浆流动感。' },
            { id: 'fireMage_weapon_9', name: '焚天法杖', tier: 9, levelRange: [81, 85], mainAttr: { type: '火攻击', min: 105, max: 120 }, subAttr: null, description: '赤红色半透明水晶杖，内部有火焰翻滚。杖首有火凤凰浮雕。' },
            { id: 'fireMage_weapon_10', name: '创世之火', tier: 10, levelRange: [91, 95], mainAttr: { type: '火攻击', min: 115, max: 125 }, subAttr: null, description: '无实体，仅一团悬浮的金色火焰。火焰形状可变，中心白色。' }
        ],
        helmet: [
            { id: 'fireMage_helmet_1', name: '棉布帽', tier: 1, levelRange: [2, 6], mainAttr: { type: '火防御', min: 1, max: 2 }, subAttr: { type: '魔法值上限', min: 5, max: 8 }, description: '红色棉布帽，软顶。无檐，侧面绣有小火焰图案。' },
            { id: 'fireMage_helmet_2', name: '防火头巾', tier: 2, levelRange: [12, 16], mainAttr: { type: '火防御', min: 2, max: 3 }, subAttr: { type: '魔法值上限', min: 12, max: 18 }, description: '石棉纤维编织的头巾，灰白色。包裹头部，露出眼睛。' },
            { id: 'fireMage_helmet_3', name: '炎盔', tier: 3, levelRange: [22, 26], mainAttr: { type: '火防御', min: 3, max: 5 }, subAttr: { type: '魔法值上限', min: 20, max: 30 }, description: '红色金属半盔，额头有火焰纹。两侧有散热孔。' },
            { id: 'fireMage_helmet_4', name: '火冠', tier: 4, levelRange: [32, 36], mainAttr: { type: '火防御', min: 5, max: 7 }, subAttr: { type: '魔法值上限', min: 30, max: 45 }, description: '金色头冠，顶部有火焰形宝石（红）。佩戴时温热。' },
            { id: 'fireMage_helmet_5', name: '凤凰羽冠', tier: 5, levelRange: [42, 46], mainAttr: { type: '火防御', min: 7, max: 10 }, subAttr: { type: '魔法值上限', min: 45, max: 65 }, description: '红色羽毛编织，插入几根金色羽毛。正面有一颗红珠。' },
            { id: 'fireMage_helmet_6', name: '炼狱面甲', tier: 6, levelRange: [52, 56], mainAttr: { type: '火防御', min: 10, max: 14 }, subAttr: { type: '魔法值上限', min: 65, max: 90 }, description: '全覆盖黑色面甲，眼部红色镜片。额头有恶魔角装饰。' },
            { id: 'fireMage_helmet_7', name: '太阳王冠', tier: 7, levelRange: [62, 66], mainAttr: { type: '火防御', min: 14, max: 19 }, subAttr: { type: '魔法值上限', min: 90, max: 120 }, description: '黄金王冠，镶多颗红宝石。冠顶有放射状光芒雕刻。' },
            { id: 'fireMage_helmet_8', name: '不灭之火冠', tier: 8, levelRange: [72, 76], mainAttr: { type: '火防御', min: 19, max: 25 }, subAttr: { type: '魔法值上限', min: 120, max: 160 }, description: '半透明红色晶体头盔，内部有火焰永燃。佩戴时头发无风自动。' },
            { id: 'fireMage_helmet_9', name: '焚星之冠', tier: 9, levelRange: [82, 86], mainAttr: { type: '火防御', min: 25, max: 32 }, subAttr: { type: '魔法值上限', min: 160, max: 210 }, description: '紫黑色金属，镶嵌暗红宝石。宝石内有星云漩涡。' },
            { id: 'fireMage_helmet_10', name: '神火圣冠', tier: 10, levelRange: [92, 96], mainAttr: { type: '火防御', min: 32, max: 40 }, subAttr: { type: '魔法值上限', min: 210, max: 280 }, description: '纯白金冠，燃烧着白色火焰（不烫）。冠顶悬浮。' }
        ],
        clothes: [
            { id: 'fireMage_clothes_1', name: '麻布长袍', tier: 1, levelRange: [3, 7], mainAttr: { type: '火防御', min: 1, max: 2 }, subAttr: { type: '每5秒魔法恢复', min: 0.5, max: 1 }, description: '红色麻布长袍，宽大。袍边有黑色焦痕。' },
            { id: 'fireMage_clothes_2', name: '石棉法袍', tier: 2, levelRange: [13, 17], mainAttr: { type: '火防御', min: 2, max: 3 }, subAttr: { type: '每5秒魔法恢复', min: 2, max: 4 }, description: '灰白色石棉布长袍，厚重。不燃，表面粗糙。' },
            { id: 'fireMage_clothes_3', name: '火焰符文袍', tier: 3, levelRange: [23, 27], mainAttr: { type: '火防御', min: 3, max: 5 }, subAttr: { type: '每5秒魔法恢复', min: 5, max: 8 }, description: '红色长袍，绣有金色火焰符文。符文微微发光。' },
            { id: 'fireMage_clothes_4', name: '凤凰羽衣', tier: 4, levelRange: [33, 37], mainAttr: { type: '火防御', min: 5, max: 7 }, subAttr: { type: '每5秒魔法恢复', min: 9, max: 13 }, description: '火红色羽毛编织，轻盈。背后有尾羽装饰。' },
            { id: 'fireMage_clothes_5', name: '熔岩甲', tier: 5, levelRange: [43, 47], mainAttr: { type: '火防御', min: 7, max: 10 }, subAttr: { type: '每5秒魔法恢复', min: 14, max: 18 }, description: '黑色金属板甲，表面有红色裂纹（仿熔岩）。厚重。' },
            { id: 'fireMage_clothes_6', name: '龙鳞法袍', tier: 6, levelRange: [53, 57], mainAttr: { type: '火防御', min: 10, max: 14 }, subAttr: { type: '每5秒魔法恢复', min: 19, max: 23 }, description: '暗红色鳞片串成，反光。鳞片边缘有金色。' },
            { id: 'fireMage_clothes_7', name: '太阳披风', tier: 7, levelRange: [63, 67], mainAttr: { type: '火防御', min: 14, max: 19 }, subAttr: { type: '每5秒魔法恢复', min: 24, max: 27 }, description: '金色丝绸披风，镶红宝石。背后有太阳图案，光芒刺绣。' },
            { id: 'fireMage_clothes_8', name: '末日战袍', tier: 8, levelRange: [73, 77], mainAttr: { type: '火防御', min: 19, max: 25 }, subAttr: { type: '每5秒魔法恢复', min: 28, max: 30 }, description: '暗紫色长袍，下摆有火焰燃烧特效（幻影）。兜帽遮面。' },
            { id: 'fireMage_clothes_9', name: '焚天法衣', tier: 9, levelRange: [83, 87], mainAttr: { type: '火防御', min: 25, max: 32 }, subAttr: { type: '每5秒魔法恢复', min: 28, max: 30 }, description: '赤红色透明材质，包裹身体。移动时留下火星。' },
            { id: 'fireMage_clothes_10', name: '永恒之火袍', tier: 10, levelRange: [93, 97], mainAttr: { type: '火防御', min: 32, max: 40 }, subAttr: { type: '每5秒魔法恢复', min: 28, max: 30 }, description: '纯白长袍，表面跳跃着白色火焰（无害）。火焰形状变化。' }
        ],
        pants: [
            { id: 'fireMage_pants_1', name: '棉布裤', tier: 1, levelRange: [4, 8], mainAttr: { type: '火防御', min: 1, max: 2 }, subAttr: { type: '施法速度', min: 1, max: 2, isPercent: true }, description: '红色棉布裤，宽松。裤脚收紧。' },
            { id: 'fireMage_pants_2', name: '隔热腿套', tier: 2, levelRange: [14, 18], mainAttr: { type: '火防御', min: 2, max: 3 }, subAttr: { type: '施法速度', min: 2, max: 4, isPercent: true }, description: '灰色石棉腿套，覆盖大腿。绑带固定。' },
            { id: 'fireMage_pants_3', name: '火焰腿甲', tier: 3, levelRange: [24, 28], mainAttr: { type: '火防御', min: 3, max: 5 }, subAttr: { type: '施法速度', min: 4, max: 7, isPercent: true }, description: '红色金属护腿，刻火焰纹。膝盖有尖刺。' },
            { id: 'fireMage_pants_4', name: '凤凰护腿', tier: 4, levelRange: [34, 38], mainAttr: { type: '火防御', min: 5, max: 7 }, subAttr: { type: '施法速度', min: 8, max: 12, isPercent: true }, description: '金色腿甲，羽毛纹路。轻便，反光。' },
            { id: 'fireMage_pants_5', name: '熔岩腿甲', tier: 5, levelRange: [44, 48], mainAttr: { type: '火防御', min: 7, max: 10 }, subAttr: { type: '施法速度', min: 13, max: 18, isPercent: true }, description: '黑色腿甲，表面红色裂纹。厚重。' },
            { id: 'fireMage_pants_6', name: '龙鳞裤', tier: 6, levelRange: [54, 58], mainAttr: { type: '火防御', min: 10, max: 14 }, subAttr: { type: '施法速度', min: 20, max: 28, isPercent: true }, description: '暗红色鳞片裤，弹性内衬。鳞片可动。' },
            { id: 'fireMage_pants_7', name: '太阳护腿', tier: 7, levelRange: [64, 68], mainAttr: { type: '火防御', min: 14, max: 19 }, subAttr: { type: '施法速度', min: 30, max: 40, isPercent: true }, description: '金色金属腿甲，镶红宝石。光芒耀眼。' },
            { id: 'fireMage_pants_8', name: '末日腿铠', tier: 8, levelRange: [74, 78], mainAttr: { type: '火防御', min: 19, max: 25 }, subAttr: { type: '施法速度', min: 45, max: 50, isPercent: true }, description: '暗紫色腿甲，表面有火焰纹（动态）。走动拖尾焰。' },
            { id: 'fireMage_pants_9', name: '焚天腿甲', tier: 9, levelRange: [84, 88], mainAttr: { type: '火防御', min: 25, max: 32 }, subAttr: { type: '施法速度', min: 45, max: 50, isPercent: true }, description: '赤红色透明腿甲，内部有火旋涡。无重量。' },
            { id: 'fireMage_pants_10', name: '神火胫甲', tier: 10, levelRange: [94, 98], mainAttr: { type: '火防御', min: 32, max: 40 }, subAttr: { type: '施法速度', min: 45, max: 50, isPercent: true }, description: '金色胫甲，燃烧白色火焰。踏地生火。' }
        ],
        shoes: [
            { id: 'fireMage_shoes_1', name: '布鞋', tier: 1, levelRange: [5, 9], mainAttr: { type: '火防御', min: 1, max: 2 }, subAttr: { type: '火伤加成', min: 2, max: 3, isPercent: true }, description: '红色布鞋，橡胶底。鞋面绣小火苗。' },
            { id: 'fireMage_shoes_2', name: '防火靴', tier: 2, levelRange: [15, 19], mainAttr: { type: '火防御', min: 2, max: 3 }, subAttr: { type: '火伤加成', min: 4, max: 7, isPercent: true }, description: '石棉靴，灰色。厚底，系带。' },
            { id: 'fireMage_shoes_3', name: '火焰便鞋', tier: 3, levelRange: [25, 29], mainAttr: { type: '火防御', min: 3, max: 5 }, subAttr: { type: '火伤加成', min: 8, max: 13, isPercent: true }, description: '红色皮靴，鞋跟有火焰图案。轻便。' },
            { id: 'fireMage_shoes_4', name: '燃烧之靴', tier: 4, levelRange: [35, 39], mainAttr: { type: '火防御', min: 5, max: 7 }, subAttr: { type: '火伤加成', min: 15, max: 22, isPercent: true }, description: '红黑色靴，鞋底有火星特效。走过留下焦痕。' },
            { id: 'fireMage_shoes_5', name: '凤凰之靴', tier: 5, levelRange: [45, 49], mainAttr: { type: '火防御', min: 7, max: 10 }, subAttr: { type: '火伤加成', min: 25, max: 35, isPercent: true }, description: '金色靴，鞋面羽毛纹理。装饰红宝石。' },
            { id: 'fireMage_shoes_6', name: '龙息靴', tier: 6, levelRange: [55, 59], mainAttr: { type: '火防御', min: 10, max: 14 }, subAttr: { type: '火伤加成', min: 40, max: 50, isPercent: true }, description: '暗红色金属靴，脚踝有龙翼装饰。鞋跟喷火（特效）。' },
            { id: 'fireMage_shoes_7', name: '太阳靴', tier: 7, levelRange: [65, 69], mainAttr: { type: '火防御', min: 14, max: 19 }, subAttr: { type: '火伤加成', min: 40, max: 50, isPercent: true }, description: '金色高筒靴，鞋面太阳浮雕。发光。' },
            { id: 'fireMage_shoes_8', name: '末日行者', tier: 8, levelRange: [75, 79], mainAttr: { type: '火防御', min: 19, max: 25 }, subAttr: { type: '火伤加成', min: 40, max: 50, isPercent: true }, description: '黑色金属靴，鞋底有岩浆纹。走路留下火焰脚印。' },
            { id: 'fireMage_shoes_9', name: '焚天履', tier: 9, levelRange: [85, 89], mainAttr: { type: '火防御', min: 25, max: 32 }, subAttr: { type: '火伤加成', min: 40, max: 50, isPercent: true }, description: '赤红色透明靴，内部火焰翻滚。悬浮离地1cm。' },
            { id: 'fireMage_shoes_10', name: '神火之足', tier: 10, levelRange: [95, 99], mainAttr: { type: '火防御', min: 32, max: 40 }, subAttr: { type: '火伤加成', min: 40, max: 50, isPercent: true }, description: '金色靴，燃烧白色火焰。每步踏出火莲。' }
        ],
        belt: [
            { id: 'fireMage_belt_1', name: '绳带', tier: 1, levelRange: [6, 10], mainAttr: null, subAttr: { type: '技能冷却', min: 1, max: 1.5, isPercent: true }, description: '红色麻绳，系腰。末端打结。' },
            { id: 'fireMage_belt_2', name: '皮质束腰', tier: 2, levelRange: [16, 20], mainAttr: null, subAttr: { type: '技能冷却', min: 1.6, max: 2.5, isPercent: true }, description: '棕色皮带，铜扣。刻有火焰符号。' },
            { id: 'fireMage_belt_3', name: '火焰腰带', tier: 3, levelRange: [26, 30], mainAttr: null, subAttr: { type: '技能冷却', min: 2.6, max: 4, isPercent: true }, description: '红色腰带，带扣为火焰造型。金属质感。' },
            { id: 'fireMage_belt_4', name: '熔岩扣带', tier: 4, levelRange: [36, 40], mainAttr: null, subAttr: { type: '技能冷却', min: 4.1, max: 6, isPercent: true }, description: '黑色腰带，带扣为火山造型。火山口有红珠。' },
            { id: 'fireMage_belt_5', name: '凤凰腰带', tier: 5, levelRange: [46, 50], mainAttr: null, subAttr: { type: '技能冷却', min: 6.1, max: 9, isPercent: true }, description: '金色链带，带扣为凤凰展翅。翅膀可动。' },
            { id: 'fireMage_belt_6', name: '龙息腰封', tier: 6, levelRange: [56, 60], mainAttr: null, subAttr: { type: '技能冷却', min: 9.1, max: 13, isPercent: true }, description: '暗红色宽腰带，带扣为龙头。龙口张开。' },
            { id: 'fireMage_belt_7', name: '太阳腰带', tier: 7, levelRange: [66, 70], mainAttr: null, subAttr: { type: '技能冷却', min: 13.1, max: 18, isPercent: true }, description: '金色腰带，带扣为太阳圆盘。放射光芒。' },
            { id: 'fireMage_belt_8', name: '末日束腰', tier: 8, levelRange: [76, 80], mainAttr: null, subAttr: { type: '技能冷却', min: 18.1, max: 25, isPercent: true }, description: '黑色皮质，带扣为骷髅头。骷髅眼冒红光。' },
            { id: 'fireMage_belt_9', name: '焚天腰链', tier: 9, levelRange: [86, 90], mainAttr: null, subAttr: { type: '技能冷却', min: 25.1, max: 35, isPercent: true }, description: '赤红色链条，每节火焰形。燃烧特效。' },
            { id: 'fireMage_belt_10', name: '神火腰封', tier: 10, levelRange: [96, 100], mainAttr: null, subAttr: { type: '技能冷却', min: 35.1, max: 50, isPercent: true }, description: '金色腰带，带扣为白色火焰。火焰跳跃。' }
        ],
        necklace: [
            { id: 'fireMage_necklace_1', name: '火花吊坠', tier: 1, levelRange: [1, 5], mainAttr: null, subAttr: { type: '射击范围', min: 2, max: 4, isPercent: true }, description: '小颗粒红宝石，银链。反射光。' },
            { id: 'fireMage_necklace_2', name: '火焰护符', tier: 2, levelRange: [11, 15], mainAttr: null, subAttr: { type: '射击范围', min: 4, max: 7, isPercent: true }, description: '圆形铜片，刻火焰纹。边缘锯齿。' },
            { id: 'fireMage_necklace_3', name: '熔岩之心', tier: 3, levelRange: [21, 25], mainAttr: null, subAttr: { type: '射击范围', min: 7, max: 10, isPercent: true }, description: '黑色椭圆形石头，内有红色发光裂纹。温热。' },
            { id: 'fireMage_necklace_4', name: '凤凰羽毛', tier: 4, levelRange: [31, 35], mainAttr: null, subAttr: { type: '射击范围', min: 10, max: 14, isPercent: true }, description: '真火凤凰羽毛（橙色），长10cm。有光泽。' },
            { id: 'fireMage_necklace_5', name: '龙息吊坠', tier: 5, levelRange: [41, 45], mainAttr: null, subAttr: { type: '射击范围', min: 14, max: 18, isPercent: true }, description: '龙爪形银饰，爪中抓一颗红珠。可打开。' },
            { id: 'fireMage_necklace_6', name: '太阳碎片', tier: 6, levelRange: [51, 55], mainAttr: null, subAttr: { type: '射击范围', min: 18, max: 22, isPercent: true }, description: '不规则黄金片，边缘锋利。发光。' },
            { id: 'fireMage_necklace_7', name: '地狱火链', tier: 7, levelRange: [61, 65], mainAttr: null, subAttr: { type: '射击范围', min: 22, max: 26, isPercent: true }, description: '黑色链条，挂一颗黑钻石。内有火焰。' },
            { id: 'fireMage_necklace_8', name: '末日余烬', tier: 8, levelRange: [71, 75], mainAttr: null, subAttr: { type: '射击范围', min: 26, max: 30, isPercent: true }, description: '灰色石头，表面有红色灰烬。掉落火星。' },
            { id: 'fireMage_necklace_9', name: '焚天印记', tier: 9, levelRange: [81, 85], mainAttr: null, subAttr: { type: '射击范围', min: 30, max: 35, isPercent: true }, description: '红色菱形水晶，内有火焰风暴。烫手。' },
            { id: 'fireMage_necklace_10', name: '创世火花', tier: 10, levelRange: [91, 95], mainAttr: null, subAttr: { type: '射击范围', min: 35, max: 40, isPercent: true }, description: '白色光点，悬浮。触碰会扩散火环。' }
        ],
        ring: [
            { id: 'fireMage_ring_1', name: '铜环', tier: 1, levelRange: [1, 5], mainAttr: null, subAttr: { type: '技能伤害', min: 2, max: 3, isPercent: true }, description: '红铜戒指，无装饰。氧化变暗。' },
            { id: 'fireMage_ring_2', name: '火石戒指', tier: 2, levelRange: [11, 15], mainAttr: null, subAttr: { type: '技能伤害', min: 4, max: 7, isPercent: true }, description: '银戒托，嵌一块火石（灰色）。击打生火花。' },
            { id: 'fireMage_ring_3', name: '红玉髓戒', tier: 3, levelRange: [21, 25], mainAttr: null, subAttr: { type: '技能伤害', min: 8, max: 13, isPercent: true }, description: '金色戒托，镶嵌红玉髓（半透明）。打磨光滑。' },
            { id: 'fireMage_ring_4', name: '火焰之戒', tier: 4, levelRange: [31, 35], mainAttr: null, subAttr: { type: '技能伤害', min: 15, max: 22, isPercent: true }, description: '红色金属，戒面火焰浮雕。佩戴发热。' },
            { id: 'fireMage_ring_5', name: '凤凰之戒', tier: 5, levelRange: [41, 45], mainAttr: null, subAttr: { type: '技能伤害', min: 25, max: 35, isPercent: true }, description: '金色戒指，戒面凤凰浅浮雕。眼睛红宝石。' },
            { id: 'fireMage_ring_6', name: '龙魂指环', tier: 6, levelRange: [51, 55], mainAttr: null, subAttr: { type: '技能伤害', min: 40, max: 55, isPercent: true }, description: '暗红色金属，雕刻龙鳞。戒面龙眼凸起。' },
            { id: 'fireMage_ring_7', name: '太阳指环', tier: 7, levelRange: [61, 65], mainAttr: null, subAttr: { type: '技能伤害', min: 60, max: 80, isPercent: true }, description: '黄金戒指，戒面太阳光芒。中心黄水晶。' },
            { id: 'fireMage_ring_8', name: '末日指环', tier: 8, levelRange: [71, 75], mainAttr: null, subAttr: { type: '技能伤害', min: 90, max: 120, isPercent: true }, description: '黑色金属，戒面骷髅头。骷髅眼冒烟。' },
            { id: 'fireMage_ring_9', name: '焚天戒', tier: 9, levelRange: [81, 85], mainAttr: null, subAttr: { type: '技能伤害', min: 130, max: 180, isPercent: true }, description: '赤红色透明戒，内部火焰翻滚。无实体感。' },
            { id: 'fireMage_ring_10', name: '创世火环', tier: 10, levelRange: [91, 95], mainAttr: null, subAttr: { type: '技能伤害', min: 200, max: 300, isPercent: true }, description: '白色火焰环，悬浮指上。不烫。' }
        ]
    },

    // ==================== 冰冻法师装备 ====================
    iceMage: {
        weapon: [
            { id: 'iceMage_weapon_1', name: '寒霜短杖', tier: 1, levelRange: [1, 5], mainAttr: { type: '冰攻击', min: 5, max: 8 }, subAttr: null, description: '短杖，浅蓝色，顶端结有薄霜。嵌一颗蓝纹玛瑙，触感冰凉。' },
            { id: 'iceMage_weapon_2', name: '冰晶法杖', tier: 2, levelRange: [11, 15], mainAttr: { type: '冰攻击', min: 10, max: 15 }, subAttr: null, description: '透明水晶杖身，内部有冰裂纹。顶端雪花造型，六角形。' },
            { id: 'iceMage_weapon_3', name: '雪崩法杖', tier: 3, levelRange: [21, 25], mainAttr: { type: '冰攻击', min: 18, max: 25 }, subAttr: null, description: '白色金属杖，刻有风暴符文。顶端一颗冰蓝宝石，散发寒气。' },
            { id: 'iceMage_weapon_4', name: '永冻权杖', tier: 4, levelRange: [31, 35], mainAttr: { type: '冰攻击', min: 28, max: 38 }, subAttr: null, description: '银灰色杖身，缠绕冰藤蔓。顶端冰锥状，尖端锐利。' },
            { id: 'iceMage_weapon_5', name: '极光法杖', tier: 5, levelRange: [41, 45], mainAttr: { type: '冰攻击', min: 40, max: 52 }, subAttr: null, description: '淡蓝色半透明杖，内部有流动的彩色光带。杖首有北极星标志。' },
            { id: 'iceMage_weapon_6', name: '冰龙法杖', tier: 6, levelRange: [51, 55], mainAttr: { type: '冰攻击', min: 55, max: 70 }, subAttr: null, description: '银白色杖身，顶端龙首造型。龙口张开，喷出白色寒气。' },
            { id: 'iceMage_weapon_7', name: '绝对零度杖', tier: 7, levelRange: [61, 65], mainAttr: { type: '冰攻击', min: 72, max: 90 }, subAttr: null, description: '纯白色杖身，覆盖霜花。触碰会冻伤皮肤（特效）。' },
            { id: 'iceMage_weapon_8', name: '冰川权杖', tier: 8, levelRange: [71, 75], mainAttr: { type: '冰攻击', min: 92, max: 110 }, subAttr: null, description: '深蓝色水晶杖，表面有冰川擦痕。沉重，散发冷雾。' },
            { id: 'iceMage_weapon_9', name: '永恒寒冬杖', tier: 9, levelRange: [81, 85], mainAttr: { type: '冰攻击', min: 105, max: 120 }, subAttr: null, description: '银色杖身，顶部悬浮一朵冰晶雪花。雪花缓慢旋转。' },
            { id: 'iceMage_weapon_10', name: '霜之哀伤', tier: 10, levelRange: [91, 95], mainAttr: { type: '冰攻击', min: 115, max: 125 }, subAttr: null, description: '蓝色透明水晶，剑形杖。内部有冻结的灵魂虚影，散发哀伤气息。' }
        ],
        helmet: [
            { id: 'iceMage_helmet_1', name: '棉布帽', tier: 1, levelRange: [2, 6], mainAttr: { type: '冰防御', min: 1, max: 2 }, subAttr: { type: '魔法值上限', min: 5, max: 8 }, description: '浅蓝色棉布帽，软顶。帽檐有白色绒毛。' },
            { id: 'iceMage_helmet_2', name: '防寒头巾', tier: 2, levelRange: [12, 16], mainAttr: { type: '冰防御', min: 2, max: 3 }, subAttr: { type: '魔法值上限', min: 12, max: 18 }, description: '羊毛编织头巾，白色。包裹头部，露出眼睛。' },
            { id: 'iceMage_helmet_3', name: '冰盔', tier: 3, levelRange: [22, 26], mainAttr: { type: '冰防御', min: 3, max: 5 }, subAttr: { type: '魔法值上限', min: 20, max: 30 }, description: '银白色金属半盔，额头有雪花纹。两侧有护耳。' },
            { id: 'iceMage_helmet_4', name: '冰冠', tier: 4, levelRange: [32, 36], mainAttr: { type: '冰防御', min: 5, max: 7 }, subAttr: { type: '魔法值上限', min: 30, max: 45 }, description: '银色头冠，顶部冰晶造型。镶嵌蓝宝石，佩戴凉爽。' },
            { id: 'iceMage_helmet_5', name: '雪绒羽冠', tier: 5, levelRange: [42, 46], mainAttr: { type: '冰防御', min: 7, max: 10 }, subAttr: { type: '魔法值上限', min: 45, max: 65 }, description: '白色羽毛编织，插入冰蓝色羽毛。正面一颗冰珠。' },
            { id: 'iceMage_helmet_6', name: '极寒面甲', tier: 6, levelRange: [52, 56], mainAttr: { type: '冰防御', min: 10, max: 14 }, subAttr: { type: '魔法值上限', min: 65, max: 90 }, description: '全覆盖银色面甲，眼部蓝色镜片。面颊有霜花图案。' },
            { id: 'iceMage_helmet_7', name: '霜王冠', tier: 7, levelRange: [62, 66], mainAttr: { type: '冰防御', min: 14, max: 19 }, subAttr: { type: '魔法值上限', min: 90, max: 120 }, description: '白金王冠，镶多颗蓝宝石。冠顶有冰柱造型。' },
            { id: 'iceMage_helmet_8', name: '永冻冰冠', tier: 8, levelRange: [72, 76], mainAttr: { type: '冰防御', min: 19, max: 25 }, subAttr: { type: '魔法值上限', min: 120, max: 160 }, description: '半透明蓝色晶体头盔，内部有雪花飘浮。佩戴时呼出白气。' },
            { id: 'iceMage_helmet_9', name: '极夜之冠', tier: 9, levelRange: [82, 86], mainAttr: { type: '冰防御', min: 25, max: 32 }, subAttr: { type: '魔法值上限', min: 160, max: 210 }, description: '深蓝色金属，镶嵌暗蓝宝石。宝石内有星芒。' },
            { id: 'iceMage_helmet_10', name: '寒神圣冠', tier: 10, levelRange: [92, 96], mainAttr: { type: '冰防御', min: 32, max: 40 }, subAttr: { type: '魔法值上限', min: 210, max: 280 }, description: '纯银冠，悬浮冰晶。冠顶有蓝色火焰（冷焰）。' }
        ],
        clothes: [
            { id: 'iceMage_clothes_1', name: '麻布长袍', tier: 1, levelRange: [3, 7], mainAttr: { type: '冰防御', min: 1, max: 2 }, subAttr: { type: '每5秒魔法恢复', min: 0.5, max: 1 }, description: '浅蓝色麻布长袍，宽大。袍边有霜花刺绣。' },
            { id: 'iceMage_clothes_2', name: '羊毛法袍', tier: 2, levelRange: [13, 17], mainAttr: { type: '冰防御', min: 2, max: 3 }, subAttr: { type: '每5秒魔法恢复', min: 2, max: 4 }, description: '白色羊毛长袍，厚重。保暖，表面有雪绒球。' },
            { id: 'iceMage_clothes_3', name: '冰霜符文袍', tier: 3, levelRange: [23, 27], mainAttr: { type: '冰防御', min: 3, max: 5 }, subAttr: { type: '每5秒魔法恢复', min: 5, max: 8 }, description: '蓝色长袍，绣有银色冰霜符文。符文微微发光。' },
            { id: 'iceMage_clothes_4', name: '雪鸮羽衣', tier: 4, levelRange: [33, 37], mainAttr: { type: '冰防御', min: 5, max: 7 }, subAttr: { type: '每5秒魔法恢复', min: 9, max: 13 }, description: '白色羽毛编织，轻盈。背后有翅膀装饰。' },
            { id: 'iceMage_clothes_5', name: '冰封甲', tier: 5, levelRange: [43, 47], mainAttr: { type: '冰防御', min: 7, max: 10 }, subAttr: { type: '每5秒魔法恢复', min: 14, max: 18 }, description: '蓝色金属板甲，表面有冰晶凸起。厚重。' },
            { id: 'iceMage_clothes_6', name: '冰霜龙鳞袍', tier: 6, levelRange: [53, 57], mainAttr: { type: '冰防御', min: 10, max: 14 }, subAttr: { type: '每5秒魔法恢复', min: 19, max: 23 }, description: '淡蓝色鳞片串成，反光。鳞片边缘有银色。' },
            { id: 'iceMage_clothes_7', name: '极光披风', tier: 7, levelRange: [63, 67], mainAttr: { type: '冰防御', min: 14, max: 19 }, subAttr: { type: '每5秒魔法恢复', min: 24, max: 27 }, description: '半透明丝绸披风，表面流动彩色极光。轻若无物。' },
            { id: 'iceMage_clothes_8', name: '永夜战袍', tier: 8, levelRange: [73, 77], mainAttr: { type: '冰防御', min: 19, max: 25 }, subAttr: { type: '每5秒魔法恢复', min: 28, max: 30 }, description: '深蓝色长袍，下摆有冰雾特效（幻影）。兜帽边缘结霜。' },
            { id: 'iceMage_clothes_9', name: '绝对零度衣', tier: 9, levelRange: [83, 87], mainAttr: { type: '冰防御', min: 25, max: 32 }, subAttr: { type: '每5秒魔法恢复', min: 28, max: 30 }, description: '冰蓝色透明材质，包裹身体。移动时留下冰晶足迹。' },
            { id: 'iceMage_clothes_10', name: '寒神法袍', tier: 10, levelRange: [93, 97], mainAttr: { type: '冰防御', min: 32, max: 40 }, subAttr: { type: '每5秒魔法恢复', min: 28, max: 30 }, description: '纯白长袍，表面飘落雪花（幻影）。袍内可见星空。' }
        ],
        pants: [
            { id: 'iceMage_pants_1', name: '棉布裤', tier: 1, levelRange: [4, 8], mainAttr: { type: '冰防御', min: 1, max: 2 }, subAttr: { type: '施法速度', min: 1, max: 2, isPercent: true }, description: '浅蓝色棉布裤，宽松。裤脚有绒毛边。' },
            { id: 'iceMage_pants_2', name: '保暖腿套', tier: 2, levelRange: [14, 18], mainAttr: { type: '冰防御', min: 2, max: 3 }, subAttr: { type: '施法速度', min: 2, max: 4, isPercent: true }, description: '灰色羊毛腿套，覆盖大腿。绑带固定。' },
            { id: 'iceMage_pants_3', name: '冰霜腿甲', tier: 3, levelRange: [24, 28], mainAttr: { type: '冰防御', min: 3, max: 5 }, subAttr: { type: '施法速度', min: 4, max: 7, isPercent: true }, description: '银白色金属护腿，刻雪花纹。膝盖有冰锥装饰。' },
            { id: 'iceMage_pants_4', name: '雪鸮护腿', tier: 4, levelRange: [34, 38], mainAttr: { type: '冰防御', min: 5, max: 7 }, subAttr: { type: '施法速度', min: 8, max: 12, isPercent: true }, description: '白色羽毛腿甲，轻便。羽毛柔软。' },
            { id: 'iceMage_pants_5', name: '冰封腿甲', tier: 5, levelRange: [44, 48], mainAttr: { type: '冰防御', min: 7, max: 10 }, subAttr: { type: '施法速度', min: 13, max: 18, isPercent: true }, description: '蓝色腿甲，表面冰晶颗粒。厚重。' },
            { id: 'iceMage_pants_6', name: '冰龙鳞裤', tier: 6, levelRange: [54, 58], mainAttr: { type: '冰防御', min: 10, max: 14 }, subAttr: { type: '施法速度', min: 20, max: 28, isPercent: true }, description: '淡蓝色鳞片裤，弹性内衬。鳞片反冷光。' },
            { id: 'iceMage_pants_7', name: '极光护腿', tier: 7, levelRange: [64, 68], mainAttr: { type: '冰防御', min: 14, max: 19 }, subAttr: { type: '施法速度', min: 30, max: 40, isPercent: true }, description: '银色金属腿甲，镶彩色宝石。宝石散发极光色。' },
            { id: 'iceMage_pants_8', name: '永夜腿铠', tier: 8, levelRange: [74, 78], mainAttr: { type: '冰防御', min: 19, max: 25 }, subAttr: { type: '施法速度', min: 45, max: 50, isPercent: true }, description: '深蓝色腿甲，表面有冰雾动态纹。走动留下霜痕。' },
            { id: 'iceMage_pants_9', name: '绝对零度腿', tier: 9, levelRange: [84, 88], mainAttr: { type: '冰防御', min: 25, max: 32 }, subAttr: { type: '施法速度', min: 45, max: 50, isPercent: true }, description: '冰蓝色透明腿甲，内部雪花飘浮。无重量。' },
            { id: 'iceMage_pants_10', name: '寒神胫甲', tier: 10, levelRange: [94, 98], mainAttr: { type: '冰防御', min: 32, max: 40 }, subAttr: { type: '施法速度', min: 45, max: 50, isPercent: true }, description: '银色胫甲，飘浮冰晶。踏地结冰。' }
        ],
        shoes: [
            { id: 'iceMage_shoes_1', name: '布鞋', tier: 1, levelRange: [5, 9], mainAttr: { type: '冰防御', min: 1, max: 2 }, subAttr: { type: '冰伤加成', min: 2, max: 3, isPercent: true }, description: '浅蓝色布鞋，橡胶底。鞋面绣雪花。' },
            { id: 'iceMage_shoes_2', name: '防滑雪靴', tier: 2, levelRange: [15, 19], mainAttr: { type: '冰防御', min: 2, max: 3 }, subAttr: { type: '冰伤加成', min: 4, max: 7, isPercent: true }, description: '棕色雪地靴，内衬羊毛。厚底防滑。' },
            { id: 'iceMage_shoes_3', name: '冰晶便鞋', tier: 3, levelRange: [25, 29], mainAttr: { type: '冰防御', min: 3, max: 5 }, subAttr: { type: '冰伤加成', min: 8, max: 13, isPercent: true }, description: '淡蓝色皮靴，鞋跟有冰晶装饰。轻便。' },
            { id: 'iceMage_shoes_4', name: '寒霜之靴', tier: 4, levelRange: [35, 39], mainAttr: { type: '冰防御', min: 5, max: 7 }, subAttr: { type: '冰伤加成', min: 15, max: 22, isPercent: true }, description: '银白色靴，鞋底有霜花特效。走过留下冰痕。' },
            { id: 'iceMage_shoes_5', name: '雪鸮之靴', tier: 5, levelRange: [45, 49], mainAttr: { type: '冰防御', min: 7, max: 10 }, subAttr: { type: '冰伤加成', min: 25, max: 35, isPercent: true }, description: '白色羽毛靴，鞋面绒毛。轻软无声。' },
            { id: 'iceMage_shoes_6', name: '冰龙之足', tier: 6, levelRange: [55, 59], mainAttr: { type: '冰防御', min: 10, max: 14 }, subAttr: { type: '冰伤加成', min: 40, max: 50, isPercent: true }, description: '蓝色金属靴，脚踝有龙翼装饰。鞋跟喷寒气。' },
            { id: 'iceMage_shoes_7', name: '极光靴', tier: 7, levelRange: [65, 69], mainAttr: { type: '冰防御', min: 14, max: 19 }, subAttr: { type: '冰伤加成', min: 40, max: 50, isPercent: true }, description: '银色高筒靴，鞋面极光色带。发光。' },
            { id: 'iceMage_shoes_8', name: '永夜行者', tier: 8, levelRange: [75, 79], mainAttr: { type: '冰防御', min: 19, max: 25 }, subAttr: { type: '冰伤加成', min: 40, max: 50, isPercent: true }, description: '深蓝色金属靴，鞋底有冰裂纹。走路留下冰足迹。' },
            { id: 'iceMage_shoes_9', name: '绝对零度履', tier: 9, levelRange: [85, 89], mainAttr: { type: '冰防御', min: 25, max: 32 }, subAttr: { type: '冰伤加成', min: 40, max: 50, isPercent: true }, description: '冰蓝色透明靴，内部雪花旋。悬浮离地1cm。' },
            { id: 'iceMage_shoes_10', name: '寒神之足', tier: 10, levelRange: [95, 99], mainAttr: { type: '冰防御', min: 32, max: 40 }, subAttr: { type: '冰伤加成', min: 40, max: 50, isPercent: true }, description: '银色靴，飘浮冷焰。每步踏出冰莲。' }
        ],
        belt: [
            { id: 'iceMage_belt_1', name: '绳带', tier: 1, levelRange: [6, 10], mainAttr: null, subAttr: { type: '技能冷却', min: 1, max: 1.5, isPercent: true }, description: '浅蓝色麻绳，系腰。末端打结。' },
            { id: 'iceMage_belt_2', name: '皮质束腰', tier: 2, levelRange: [16, 20], mainAttr: null, subAttr: { type: '技能冷却', min: 1.6, max: 2.5, isPercent: true }, description: '白色皮带，银扣。刻有雪花符号。' },
            { id: 'iceMage_belt_3', name: '冰霜腰带', tier: 3, levelRange: [26, 30], mainAttr: null, subAttr: { type: '技能冷却', min: 2.6, max: 4, isPercent: true }, description: '浅蓝色腰带，带扣为雪花造型。金属质感。' },
            { id: 'iceMage_belt_4', name: '冰川扣带', tier: 4, levelRange: [36, 40], mainAttr: null, subAttr: { type: '技能冷却', min: 4.1, max: 6, isPercent: true }, description: '银白色腰带，带扣为冰山造型。镶嵌蓝宝石。' },
            { id: 'iceMage_belt_5', name: '雪鸮腰带', tier: 5, levelRange: [46, 50], mainAttr: null, subAttr: { type: '技能冷却', min: 6.1, max: 9, isPercent: true }, description: '白色羽毛腰带，带扣为猫头鹰头。眼睛蓝宝石。' },
            { id: 'iceMage_belt_6', name: '冰龙腰封', tier: 6, levelRange: [56, 60], mainAttr: null, subAttr: { type: '技能冷却', min: 9.1, max: 13, isPercent: true }, description: '淡蓝色宽腰带，带扣为龙头。龙眼蓝光。' },
            { id: 'iceMage_belt_7', name: '极光腰带', tier: 7, levelRange: [66, 70], mainAttr: null, subAttr: { type: '技能冷却', min: 13.1, max: 18, isPercent: true }, description: '银色腰带，带扣为极光曲线。镶嵌彩色晶石。' },
            { id: 'iceMage_belt_8', name: '永夜束腰', tier: 8, levelRange: [76, 80], mainAttr: null, subAttr: { type: '技能冷却', min: 18.1, max: 25, isPercent: true }, description: '深蓝色皮质，带扣为新月。新月镶钻。' },
            { id: 'iceMage_belt_9', name: '绝对零度链', tier: 9, levelRange: [86, 90], mainAttr: null, subAttr: { type: '技能冷却', min: 25.1, max: 35, isPercent: true }, description: '冰蓝色链条，每节冰晶形。霜冻特效。' },
            { id: 'iceMage_belt_10', name: '寒神腰封', tier: 10, levelRange: [96, 100], mainAttr: null, subAttr: { type: '技能冷却', min: 35.1, max: 50, isPercent: true }, description: '银白色腰带，带扣为冰晶雪花。雪花飘浮。' }
        ],
        necklace: [
            { id: 'iceMage_necklace_1', name: '冰晶吊坠', tier: 1, levelRange: [1, 5], mainAttr: null, subAttr: { type: '射击范围', min: 2, max: 4, isPercent: true }, description: '小冰晶颗粒，银链。反射白光。' },
            { id: 'iceMage_necklace_2', name: '霜冻护符', tier: 2, levelRange: [11, 15], mainAttr: null, subAttr: { type: '射击范围', min: 4, max: 7, isPercent: true }, description: '圆形银片，刻雪花纹。边缘磨损。' },
            { id: 'iceMage_necklace_3', name: '冰川之心', tier: 3, levelRange: [21, 25], mainAttr: null, subAttr: { type: '射击范围', min: 7, max: 10, isPercent: true }, description: '白色卵石，表面冰裂纹。触感冰冷。' },
            { id: 'iceMage_necklace_4', name: '雪鸮羽毛', tier: 4, levelRange: [31, 35], mainAttr: null, subAttr: { type: '射击范围', min: 10, max: 14, isPercent: true }, description: '真雪鸮羽毛（白色），长10cm。柔软。' },
            { id: 'iceMage_necklace_5', name: '冰龙鳞片', tier: 5, levelRange: [41, 45], mainAttr: null, subAttr: { type: '射击范围', min: 14, max: 18, isPercent: true }, description: '淡蓝色鳞片，银链。边缘锋利。' },
            { id: 'iceMage_necklace_6', name: '极光碎片', tier: 6, levelRange: [51, 55], mainAttr: null, subAttr: { type: '射击范围', min: 18, max: 22, isPercent: true }, description: '不规则彩色晶片，发光。旋转变色。' },
            { id: 'iceMage_necklace_7', name: '永冻水晶', tier: 7, levelRange: [61, 65], mainAttr: null, subAttr: { type: '射击范围', min: 22, max: 26, isPercent: true }, description: '透明水晶，内有冻结气泡。寒冷。' },
            { id: 'iceMage_necklace_8', name: '绝对零度符', tier: 8, levelRange: [71, 75], mainAttr: null, subAttr: { type: '射击范围', min: 26, max: 30, isPercent: true }, description: '黑色菱形石，表面白霜。掉落冰屑。' },
            { id: 'iceMage_necklace_9', name: '极夜印记', tier: 9, levelRange: [81, 85], mainAttr: null, subAttr: { type: '射击范围', min: 30, max: 35, isPercent: true }, description: '深蓝色水晶，内有星云。散发寒气。' },
            { id: 'iceMage_necklace_10', name: '寒神之泪', tier: 10, levelRange: [91, 95], mainAttr: null, subAttr: { type: '射击范围', min: 35, max: 40, isPercent: true }, description: '水滴形蓝色宝石，内部液态。触碰会冻结水滴。' }
        ],
        ring: [
            { id: 'iceMage_ring_1', name: '铜环', tier: 1, levelRange: [1, 5], mainAttr: null, subAttr: { type: '技能伤害', min: 2, max: 3, isPercent: true }, description: '白铜戒指，无装饰。氧化变暗。' },
            { id: 'iceMage_ring_2', name: '冰石戒指', tier: 2, levelRange: [11, 15], mainAttr: null, subAttr: { type: '技能伤害', min: 4, max: 7, isPercent: true }, description: '银戒托，嵌一块冰石（半透明）。冰凉。' },
            { id: 'iceMage_ring_3', name: '蓝纹玛瑙戒', tier: 3, levelRange: [21, 25], mainAttr: null, subAttr: { type: '技能伤害', min: 8, max: 13, isPercent: true }, description: '白金戒托，镶嵌蓝纹玛瑙。有带状纹理。' },
            { id: 'iceMage_ring_4', name: '冰霜之戒', tier: 4, levelRange: [31, 35], mainAttr: null, subAttr: { type: '技能伤害', min: 15, max: 22, isPercent: true }, description: '银白色金属，戒面雪花浮雕。佩戴冰凉。' },
            { id: 'iceMage_ring_5', name: '雪鸮之戒', tier: 5, levelRange: [41, 45], mainAttr: null, subAttr: { type: '技能伤害', min: 25, max: 35, isPercent: true }, description: '铂金戒指，戒面猫头鹰浮雕。眼睛蓝宝石。' },
            { id: 'iceMage_ring_6', name: '冰龙魂戒', tier: 6, levelRange: [51, 55], mainAttr: null, subAttr: { type: '技能伤害', min: 40, max: 55, isPercent: true }, description: '淡蓝色金属，雕刻龙鳞。戒面龙眼凸起。' },
            { id: 'iceMage_ring_7', name: '极光指环', tier: 7, levelRange: [61, 65], mainAttr: null, subAttr: { type: '技能伤害', min: 60, max: 80, isPercent: true }, description: '银戒指，戒面极光色带。中心透明。' },
            { id: 'iceMage_ring_8', name: '永夜指环', tier: 8, levelRange: [71, 75], mainAttr: null, subAttr: { type: '技能伤害', min: 90, max: 120, isPercent: true }, description: '深蓝色金属，戒面新月。新月镶钻。' },
            { id: 'iceMage_ring_9', name: '绝对零度戒', tier: 9, levelRange: [81, 85], mainAttr: null, subAttr: { type: '技能伤害', min: 130, max: 180, isPercent: true }, description: '冰蓝色透明戒，内部雪花飘。无实体感。' },
            { id: 'iceMage_ring_10', name: '寒神之环', tier: 10, levelRange: [91, 95], mainAttr: null, subAttr: { type: '技能伤害', min: 200, max: 300, isPercent: true }, description: '白色冷焰环，悬浮指上。不冻伤。' }
        ]
    }
};

// ==================== 装备生成函数 ====================

/**
 * 生成装备
 * @param {string} jobId - 职业ID (titan/archer/fireMage/iceMage)
 * @param {string} slot - 装备部位 (weapon/helmet/clothes/pants/shoes/belt/necklace/ring)
 * @param {number} tier - 装备阶数 (1-10)
 * @returns {object|null} - 生成的装备对象
 */
function generateEquipment(jobId, slot, tier, quality) {
    const jobEquip = EQUIPMENT_CONFIG[jobId];
    if (!jobEquip) return null;

    const slotEquip = jobEquip[slot];
    if (!slotEquip || !Array.isArray(slotEquip)) return null;

    // 查找对应阶数的装备
    const equipTemplate = slotEquip.find(e => e.tier === tier);
    if (!equipTemplate) return null;

    // 确定品质
    const equipQuality = quality || getRandomQuality();
    const qualityConfig = EQUIPMENT_QUALITY_CONFIG[equipQuality] || EQUIPMENT_QUALITY_CONFIG['普通'];

    // 生成随机属性值
    const equipment = {
        id: equipTemplate.id,
        name: equipTemplate.name,
        job: jobId,
        slot: slot,
        tier: tier,
        level: Math.floor(Math.random() * (equipTemplate.levelRange[1] - equipTemplate.levelRange[0] + 1)) + equipTemplate.levelRange[0],
        description: equipTemplate.description,
        mainAttr: null,
        subAttr: null,        // 兼容旧代码：第一个副属性
        subAttrs: [],         // 新结构：所有副属性数组
        enhanceLevel: 0,      // 强化等级
        quality: equipQuality // 品质
    };

    // 生成主属性（应用品质倍率）
    if (equipTemplate.mainAttr) {
        let mainValue = Math.floor(Math.random() * (equipTemplate.mainAttr.max - equipTemplate.mainAttr.min + 1)) + equipTemplate.mainAttr.min;
        mainValue = Math.floor(mainValue * qualityConfig.multiplier);
        mainValue = Math.max(1, mainValue); // ⭐ 确保主属性至少为1，避免+0属性
        equipment.mainAttr = {
            type: equipTemplate.mainAttr.type,
            value: mainValue
        };
    }

    // 生成副属性词条
    const subAttrPool = JOB_SUBATTR_POOL[jobId] || [];
    const minCount = qualityConfig.minSubAttrs;
    const maxCount = qualityConfig.maxSubAttrs;
    const subAttrCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;

    // 如果模板有默认副属性，优先使用它作为第一个词条
    const usedTypes = new Set();
    if (equipTemplate.subAttr && subAttrCount > 0) {
        let subValue;
        if (equipTemplate.subAttr.isPercent) {
            subValue = Math.floor(Math.random() * (equipTemplate.subAttr.max - equipTemplate.subAttr.min + 1)) + equipTemplate.subAttr.min;
        } else {
            subValue = Math.floor(Math.random() * (equipTemplate.subAttr.max - equipTemplate.subAttr.min + 1)) + equipTemplate.subAttr.min;
        }
        subValue = Math.floor(subValue * qualityConfig.multiplier * 10) / 10;
        if (equipTemplate.subAttr.isPercent) {
            subValue = Math.floor(subValue * 10) / 10;
        } else {
            subValue = Math.floor(subValue);
        }
        subValue = Math.max(0.1, subValue); // ⭐ 百分比至少0.1%，数值至少1（在副属性池逻辑中已有Math.max(1,finalValue)保护）
        const firstSubAttr = {
            type: equipTemplate.subAttr.type,
            value: subValue,
            isPercent: equipTemplate.subAttr.isPercent || false
        };
        equipment.subAttrs.push(firstSubAttr);
        equipment.subAttr = firstSubAttr; // 兼容旧代码
        usedTypes.add(equipTemplate.subAttr.type);
    }

    // 从副属性池中随机抽取剩余词条
    const remainingCount = subAttrCount - equipment.subAttrs.length;
    if (remainingCount > 0 && subAttrPool.length > 0) {
        // 过滤可用属性：高品质属性只有精良及以上品质才能出现
        let availableAttrs = subAttrPool.filter(a => !usedTypes.has(a.type));
        if (equipQuality === '普通' || equipQuality === '稀有' || equipQuality === '优秀') {
            // 普通、稀有、优秀品质不出高品质属性
            availableAttrs = availableAttrs.filter(a => !a.isHighQuality);
        } else if (equipQuality === '精良') {
            // 精良品质有30%概率出现高品质属性
            if (Math.random() > 0.3) {
                availableAttrs = availableAttrs.filter(a => !a.isHighQuality);
            }
        }
        // 史诗品质可以正常出现高品质属性
        
        // 如果过滤后没有可用属性了，回退到全部可用
        if (availableAttrs.length === 0) {
            availableAttrs = subAttrPool.filter(a => !usedTypes.has(a.type));
        }
        
        // 打乱顺序
        for (let i = availableAttrs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableAttrs[i], availableAttrs[j]] = [availableAttrs[j], availableAttrs[i]];
        }
        // 取前N个
        const selectedAttrs = availableAttrs.slice(0, Math.min(remainingCount, availableAttrs.length));
        selectedAttrs.forEach(attrDef => {
            // 计算属性值：基础值 + 每阶成长值 * (阶数-1)，再随机浮动±20%，最后应用品质倍率
            const baseValue = attrDef.baseValue + attrDef.perTier * (tier - 1);
            const floatRange = baseValue * 0.2;
            let finalValue = baseValue + (Math.random() * floatRange * 2 - floatRange);
            finalValue = finalValue * qualityConfig.multiplier;
            if (attrDef.isPercent) {
                finalValue = Math.floor(finalValue * 10) / 10; // 百分比保留1位小数
            } else {
                finalValue = Math.floor(finalValue); // 数值取整
            }
            const subAttr = {
                type: attrDef.type,
                value: Math.max(1, finalValue),
                isPercent: attrDef.isPercent,
                isHighQuality: attrDef.isHighQuality || false
            };
            equipment.subAttrs.push(subAttr);
            usedTypes.add(attrDef.type);
            // 如果第一个副属性还没设置，设置一下兼容字段
            if (!equipment.subAttr) {
                equipment.subAttr = subAttr;
            }
        });
    }

    return equipment;
}

/**
 * 获取随机装备品质
 * @returns {string} - 品质名称
 */
function getRandomQuality() {
    const rand = Math.random();
    if (rand < 0.68) return '普通';
    if (rand < 0.83) return '稀有';
    if (rand < 0.93) return '优秀';
    if (rand < 0.98) return '精良';
    return '史诗';
}

/**
 * 获取品质颜色
 * @param {string} quality - 品质名称
 * @returns {string} - 颜色代码
 */
function getQualityColor(quality) {
    const config = EQUIPMENT_QUALITY_CONFIG[quality];
    return config ? config.color : '#aaaaaa';
}

/**
 * 强化装备
 * @param {object} equipment - 装备对象
 * @returns {object} - 强化结果
 */
function enhanceEquipment(equipment) {
    if (!equipment) return { success: false, message: '装备不存在' };
    if (equipment.enhanceLevel >= 12) return { success: false, message: '装备已达到最高强化等级' };

    // 计算成功率（随等级递减）
    const baseSuccessRate = 100 - (equipment.enhanceLevel * 5);
    const successRate = Math.max(baseSuccessRate, 10); // 最低10%成功率

    if (Math.random() * 100 < successRate) {
        equipment.enhanceLevel++;

        // 强化主属性
        if (equipment.mainAttr) {
            const enhanceBonus = 1 + (equipment.enhanceLevel * 0.1); // 每级+10%
            equipment.mainAttr.value = Math.floor(equipment.mainAttr.value * enhanceBonus);
        }

        return { success: true, message: `强化成功！${equipment.name} +${equipment.enhanceLevel}` };
    } else {
        return { success: false, message: '强化失败', levelKept: true };
    }
}

/**
 * 获取装备图标
 * @param {string} slot - 装备部位
 * @returns {string} - 图标字符
 */
function getEquipSlotIcon(slot) {
    const icons = {
        weapon: '⚔️',
        helmet: '🪖',
        clothes: '👕',
        pants: '👖',
        shoes: '👢',
        belt: '🎗️',
        necklace: '📿',
        ring: '💍'
    };
    return icons[slot] || '❓';
}

/**
 * 获取职业名称
 * @param {string} jobId - 职业ID
 * @returns {string} - 职业名称
 */
function getJobName(jobId) {
    const names = {
        titan: '泰坦战士',
        archer: '神射手',
        fireMage: '火焰法师',
        iceMage: '冰冻法师'
    };
    return names[jobId] || '未知职业';
}

/**
 * 获取部位名称
 * @param {string} slot - 部位ID
 * @returns {string} - 部位名称
 */
function getSlotName(slot) {
    const names = {
        weapon: '武器',
        helmet: '头盔',
        clothes: '衣服',
        pants: '裤子',
        shoes: '鞋子',
        belt: '腰带',
        necklace: '项链',
        ring: '戒指'
    };
    return names[slot] || '未知部位';
}

// 导出模块（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EQUIPMENT_CONFIG,
        generateEquipment,
        enhanceEquipment,
        getRandomQuality,
        getQualityColor,
        getEquipSlotIcon,
        getJobName,
        getSlotName
    };
}
