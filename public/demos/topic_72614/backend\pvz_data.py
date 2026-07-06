# -*- coding: utf-8 -*-
"""
PVZ游戏数据配置模块
包含所有植物、僵尸、Boss、遗物、场景、杂交能量、变异等数据
"""


# ============================================================
# 基因池定义
# ============================================================
GENE_POOLS = {
    'pea': '豌豆系',
    'photosynthesis': '光合系',
    'ice': '冰系',
    'spike': '尖刺系',
    'fire': '火焰系',
    'catapult': '投掷系',
    'explosive': '爆炸系',
    'charm': '魅惑系',
    'devour': '吞噬系',
    'magnetic': '磁力系',
    'defense': '防御系',
    'poison': '毒系',
    'flight': '飞行系',
    'support': '辅助系',
    'aquatic': '水生系',
    'special': '特殊系',
}


# ============================================================
# 全部49种植物数据
# ============================================================
PLANTS = [
    # --- 豌豆系 ---
    {
        'id': 'peashooter', 'name_cn': '豌豆射手', 'name_en': 'Peashooter',
        'gene_pool': 'pea', 'cost': 100, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 1.4, 'range': '远',
        'special': '每次发射1颗豌豆', 'unlock_cost': 0
    },
    {
        'id': 'snow_pea', 'name_cn': '寒冰射手', 'name_en': 'Snow Pea',
        'gene_pool': 'ice', 'cost': 175, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 1.4, 'range': '远',
        'special': '发射冰豌豆，减速僵尸50%', 'unlock_cost': 0
    },
    {
        'id': 'repeater', 'name_cn': '双发射手', 'name_en': 'Repeater',
        'gene_pool': 'pea', 'cost': 200, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 1.4, 'range': '远',
        'special': '每次发射2颗豌豆', 'unlock_cost': 0
    },
    {
        'id': 'threepeater', 'name_cn': '三线射手', 'name_en': 'Threepeater',
        'gene_pool': 'pea', 'cost': 325, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 1.4, 'range': '远',
        'special': '向三条线路发射豌豆', 'unlock_cost': 0
    },
    {
        'id': 'gatling_pea', 'name_cn': '机枪射手', 'name_en': 'Gatling Pea',
        'gene_pool': 'pea', 'cost': 250, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 1.4, 'range': '远',
        'special': '每次发射4颗豌豆（需种在双发上）', 'unlock_cost': 0
    },
    {
        'id': 'split_pea', 'name_cn': '分裂豆', 'name_en': 'Split Pea',
        'gene_pool': 'pea', 'cost': 125, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 1.4, 'range': '远',
        'special': '前后各发射豌豆，后方2颗前方1颗', 'unlock_cost': 0
    },
    # --- 向日葵系(光合) ---
    {
        'id': 'sunflower', 'name_cn': '向日葵', 'name_en': 'Sunflower',
        'gene_pool': 'photosynthesis', 'cost': 50, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '无',
        'special': '每24秒产出50阳光', 'unlock_cost': 0
    },
    {
        'id': 'twin_sunflower', 'name_cn': '双胞向日葵', 'name_en': 'Twin Sunflower',
        'gene_pool': 'photosynthesis', 'cost': 150, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '无',
        'special': '每24秒产出100阳光（需种在向日葵上）', 'unlock_cost': 0
    },
    # --- 坚果系(防御) ---
    {
        'id': 'wall_nut', 'name_cn': '坚果墙', 'name_en': 'Wall-nut',
        'gene_pool': 'defense', 'cost': 50, 'hp': 4000, 'cooldown': 30,
        'damage': 0, 'attack_speed': 0, 'range': '无',
        'special': '高生命值阻挡僵尸', 'unlock_cost': 0
    },
    {
        'id': 'tall_nut', 'name_cn': '高坚果', 'name_en': 'Tall-nut',
        'gene_pool': 'defense', 'cost': 125, 'hp': 8000, 'cooldown': 30,
        'damage': 0, 'attack_speed': 0, 'range': '无',
        'special': '超高生命值，可阻挡跳跃僵尸', 'unlock_cost': 0
    },
    {
        'id': 'pumpkin', 'name_cn': '南瓜头', 'name_en': 'Pumpkin',
        'gene_pool': 'defense', 'cost': 125, 'hp': 4000, 'cooldown': 30,
        'damage': 0, 'attack_speed': 0, 'range': '无',
        'special': '套在植物外层提供额外护甲', 'unlock_cost': 0
    },
    # --- 樱桃炸弹(爆炸) ---
    {
        'id': 'cherry_bomb', 'name_cn': '樱桃炸弹', 'name_en': 'Cherry Bomb',
        'gene_pool': 'explosive', 'cost': 150, 'hp': 300, 'cooldown': 50,
        'damage': 1800, 'attack_speed': 0, 'range': '3x3',
        'special': '爆炸消灭3x3范围内所有僵尸', 'unlock_cost': 0
    },
    {
        'id': 'jalapeno', 'name_cn': '火爆辣椒', 'name_en': 'Jalapeno',
        'gene_pool': 'fire', 'cost': 125, 'hp': 300, 'cooldown': 50,
        'damage': 1800, 'attack_speed': 0, 'range': '整行',
        'special': '烧毁整行所有僵尸', 'unlock_cost': 0
    },
    {
        'id': 'doom_shroom', 'name_cn': '毁灭菇', 'name_en': 'Doom-shroom',
        'gene_pool': 'explosive', 'cost': 125, 'hp': 300, 'cooldown': 50,
        'damage': 1800, 'attack_speed': 0, 'range': '7x7',
        'special': '巨大爆炸范围，留下弹坑无法种植', 'unlock_cost': 0
    },
    {
        'id': 'potato_mine', 'name_cn': '土豆雷', 'name_en': 'Potato Mine',
        'gene_pool': 'explosive', 'cost': 25, 'hp': 300, 'cooldown': 30,
        'damage': 1800, 'attack_speed': 0, 'range': '1x1',
        'special': '需要准备时间，踩中即炸', 'unlock_cost': 0
    },
    {
        'id': 'squash', 'name_cn': '窝瓜', 'name_en': 'Squash',
        'gene_pool': 'special', 'cost': 50, 'hp': 300, 'cooldown': 30,
        'damage': 1800, 'attack_speed': 0, 'range': '近',
        'special': '跳起砸向僵尸，一次性使用', 'unlock_cost': 0
    },
    # --- 尖刺系 ---
    {
        'id': 'cactus', 'name_cn': '仙人掌', 'name_en': 'Cactus',
        'gene_pool': 'spike', 'cost': 125, 'hp': 300, 'cooldown': 7.5,
        'damage': 30, 'attack_speed': 1.4, 'range': '远',
        'special': '可伸长攻击气球僵尸', 'unlock_cost': 0
    },
    {
        'id': 'cattail', 'name_cn': '香蒲', 'name_en': 'Cattail',
        'gene_pool': 'spike', 'cost': 225, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 1.4, 'range': '全屏',
        'special': '追踪攻击气球僵尸（需种在睡莲上）', 'unlock_cost': 0
    },
    {
        'id': 'spike_weed', 'name_cn': '地刺', 'name_en': 'Spikeweed',
        'gene_pool': 'spike', 'cost': 100, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 0.7, 'range': '自身',
        'special': '地面刺伤经过的僵尸，可破坏滚筒', 'unlock_cost': 0
    },
    {
        'id': 'spike_rock', 'name_cn': '地刺王', 'name_en': 'Spikerock',
        'gene_pool': 'spike', 'cost': 125, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 0.7, 'range': '自身',
        'special': '强化地刺，耐久更高（需种在地刺上）', 'unlock_cost': 0
    },
    # --- 火焰系 ---
    {
        'id': 'torchwood', 'name_cn': '火炬树桩', 'name_en': 'Torchwood',
        'gene_pool': 'fire', 'cost': 175, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '无',
        'special': '点燃经过的豌豆，伤害翻倍', 'unlock_cost': 0
    },
    # --- 投掷系 ---
    {
        'id': 'cabbage_pult', 'name_cn': '卷心菜投手', 'name_en': 'Cabbage-pult',
        'gene_pool': 'catapult', 'cost': 100, 'hp': 300, 'cooldown': 7.5,
        'damage': 40, 'attack_speed': 1.4, 'range': '远',
        'special': '抛物线投掷，可越过路障', 'unlock_cost': 0
    },
    {
        'id': 'kernel_pult', 'name_cn': '玉米投手', 'name_en': 'Kernel-pult',
        'gene_pool': 'catapult', 'cost': 100, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 1.4, 'range': '远',
        'special': '投掷玉米粒，有概率投黄油眩晕', 'unlock_cost': 0
    },
    {
        'id': 'melon_pult', 'name_cn': '西瓜投手', 'name_en': 'Melon-pult',
        'gene_pool': 'catapult', 'cost': 300, 'hp': 300, 'cooldown': 7.5,
        'damage': 80, 'attack_speed': 1.4, 'range': '远',
        'special': '高伤害投掷，溅射伤害', 'unlock_cost': 0
    },
    {
        'id': 'winter_melon', 'name_cn': '冰瓜投手', 'name_en': 'Winter Melon',
        'gene_pool': 'ice', 'cost': 200, 'hp': 300, 'cooldown': 7.5,
        'damage': 80, 'attack_speed': 1.4, 'range': '远',
        'special': '冰冻西瓜，溅射减速（需种在西瓜上）', 'unlock_cost': 0
    },
    {
        'id': 'cob_cannon', 'name_cn': '玉米加农炮', 'name_en': 'Cob Cannon',
        'gene_pool': 'catapult', 'cost': 500, 'hp': 300, 'cooldown': 7.5,
        'damage': 1800, 'attack_speed': 0, 'range': '全屏',
        'special': '手动瞄准发射玉米炮弹（需2个玉米投手）', 'unlock_cost': 0
    },
    # --- 魅惑系 ---
    {
        'id': 'hypno_shroom', 'name_cn': '魅惑菇', 'name_en': 'Hypno-shroom',
        'gene_pool': 'charm', 'cost': 75, 'hp': 300, 'cooldown': 30,
        'damage': 0, 'attack_speed': 0, 'range': '近',
        'special': '被吃后魅惑僵尸反戈', 'unlock_cost': 0
    },
    # --- 吞噬系 ---
    {
        'id': 'chomper', 'name_cn': '大嘴花', 'name_en': 'Chomper',
        'gene_pool': 'devour', 'cost': 150, 'hp': 300, 'cooldown': 7.5,
        'damage': 1800, 'attack_speed': 0, 'range': '近',
        'special': '吞噬僵尸，消化需要42秒', 'unlock_cost': 0
    },
    # --- 磁力系 ---
    {
        'id': 'magnet_shroom', 'name_cn': '磁力菇', 'name_en': 'Magnet-shroom',
        'gene_pool': 'magnetic', 'cost': 100, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '远',
        'special': '吸走僵尸金属防具', 'unlock_cost': 0
    },
    # --- 毒系 ---
    {
        'id': 'fume_shroom', 'name_cn': '大喷菇', 'name_en': 'Fume-shroom',
        'gene_pool': 'poison', 'cost': 75, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 1.4, 'range': '中',
        'special': '喷射毒雾，无视防具', 'unlock_cost': 0
    },
    {
        'id': 'scaredy_shroom', 'name_cn': '胆小菇', 'name_en': 'Scaredy-shroom',
        'gene_pool': 'poison', 'cost': 25, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 1.4, 'range': '远',
        'special': '远距离吐孢子，僵尸靠近时缩起', 'unlock_cost': 0
    },
    # --- 飞行系 ---
    {
        'id': 'blover', 'name_cn': '三叶草', 'name_en': 'Blover',
        'gene_pool': 'flight', 'cost': 100, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '全行',
        'special': '吹走空中僵尸和雾气', 'unlock_cost': 0
    },
    {
        'id': 'starfruit', 'name_cn': '杨桃', 'name_en': 'Starfruit',
        'gene_pool': 'flight', 'cost': 125, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 1.4, 'range': '五方向',
        'special': '向五个方向发射星形子弹', 'unlock_cost': 0
    },
    # --- 辅助系 ---
    {
        'id': 'lily_pad', 'name_cn': '睡莲', 'name_en': 'Lily Pad',
        'gene_pool': 'support', 'cost': 25, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '无',
        'special': '水面平台，允许在水上种植', 'unlock_cost': 0
    },
    {
        'id': 'flower_pot', 'name_cn': '花盆', 'name_en': 'Flower Pot',
        'gene_pool': 'support', 'cost': 25, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '无',
        'special': '屋顶平台，允许在屋顶种植', 'unlock_cost': 0
    },
    {
        'id': 'coffee_bean', 'name_cn': '咖啡豆', 'name_en': 'Coffee Bean',
        'gene_pool': 'support', 'cost': 75, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '无',
        'special': '唤醒蘑菇类植物', 'unlock_cost': 0
    },
    {
        'id': 'plantern', 'name_cn': '路灯花', 'name_en': 'Plantern',
        'gene_pool': 'support', 'cost': 25, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '无',
        'special': '照亮迷雾区域', 'unlock_cost': 0
    },
    {
        'id': 'grave_buster', 'name_cn': '墓碑吞噬者', 'name_en': 'Grave Buster',
        'gene_pool': 'devour', 'cost': 75, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '近',
        'special': '吞噬墓碑', 'unlock_cost': 0
    },
    # --- 水生系 ---
    {
        'id': 'sea_shroom', 'name_cn': '海蘑菇', 'name_en': 'Sea-shroom',
        'gene_pool': 'aquatic', 'cost': 0, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 1.4, 'range': '中',
        'special': '水中短程孢子攻击', 'unlock_cost': 0
    },
    {
        'id': 'tangle_kelp', 'name_cn': '缠绕海草', 'name_en': 'Tangle Kelp',
        'gene_pool': 'aquatic', 'cost': 25, 'hp': 300, 'cooldown': 30,
        'damage': 1800, 'attack_speed': 0, 'range': '近',
        'special': '拖入水中消灭一个水中僵尸', 'unlock_cost': 0
    },
    # --- 蘑菇系(特殊) ---
    {
        'id': 'sun_shroom', 'name_cn': '阳光菇', 'name_en': 'Sun-shroom',
        'gene_pool': 'photosynthesis', 'cost': 25, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '无',
        'special': '初始产出15阳光，成长后产出25再产出50', 'unlock_cost': 0
    },
    {
        'id': 'puff_shroom', 'name_cn': '小喷菇', 'name_en': 'Puff-shroom',
        'gene_pool': 'poison', 'cost': 0, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 1.4, 'range': '近',
        'special': '免费短程攻击，白天需咖啡豆唤醒', 'unlock_cost': 0
    },
    {
        'id': 'ice_shroom', 'name_cn': '寒冰菇', 'name_en': 'Ice-shroom',
        'gene_pool': 'ice', 'cost': 75, 'hp': 300, 'cooldown': 50,
        'damage': 20, 'attack_speed': 0, 'range': '全屏',
        'special': '冻结全屏僵尸一段时间', 'unlock_cost': 0
    },
    {
        'id': 'gloom_shroom', 'name_cn': '忧郁菇', 'name_en': 'Gloom-shroom',
        'gene_pool': 'poison', 'cost': 150, 'hp': 300, 'cooldown': 7.5,
        'damage': 20, 'attack_speed': 1.4, 'range': '周围3x3',
        'special': '向周围8格喷射毒雾（需种在大喷菇上）', 'unlock_cost': 0
    },
    {
        'id': 'gold_magnet', 'name_cn': '吸金磁', 'name_en': 'Gold Magnet',
        'gene_pool': 'magnetic', 'cost': 50, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '远',
        'special': '自动收集硬币（需种在磁力菇上）', 'unlock_cost': 0
    },
    # --- 特殊系 ---
    {
        'id': 'umbrella_leaf', 'name_cn': '叶子保护伞', 'name_en': 'Umbrella Leaf',
        'gene_pool': 'defense', 'cost': 100, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '3x3',
        'special': '保护3x3范围免受投掷和冰车攻击', 'unlock_cost': 0
    },
    {
        'id': 'marigold', 'name_cn': '金盏花', 'name_en': 'Marigold',
        'gene_pool': 'support', 'cost': 50, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '无',
        'special': '定期产出金币', 'unlock_cost': 0
    },
    {
        'id': 'garlic', 'name_cn': '大蒜', 'name_en': 'Garlic',
        'gene_pool': 'special', 'cost': 50, 'hp': 400, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '无',
        'special': '将僵尸引导至相邻线路', 'unlock_cost': 0
    },
    {
        'id': 'imitater', 'name_cn': '模仿者', 'name_en': 'Imitater',
        'gene_pool': 'special', 'cost': 0, 'hp': 300, 'cooldown': 7.5,
        'damage': 0, 'attack_speed': 0, 'range': '无',
        'special': '模仿任意一种植物', 'unlock_cost': 0
    },
]


# ============================================================
# 僵尸模块数据
# ============================================================
ZOMBIE_TORSOS = [
    {'id': 'normal_torso', 'name_cn': '普通躯干', 'hp': 200, 'speed': 1.0, 'armor': 0},
    {'id': 'cone_torso', 'name_cn': '路障躯干', 'hp': 370, 'speed': 1.0, 'armor': 0},
    {'id': 'bucket_torso', 'name_cn': '铁桶躯干', 'hp': 650, 'speed': 1.0, 'armor': 0},
    {'id': 'football_torso', 'name_cn': '橄榄球躯干', 'hp': 800, 'speed': 1.6, 'armor': 50},
]

ZOMBIE_HEADS = [
    {'id': 'normal_head', 'name_cn': '普通头', 'hp': 100, 'special': '无'},
    {'id': 'newspaper_head', 'name_cn': '读报头', 'hp': 150, 'special': '报纸破碎后加速'},
    {'id': 'door_head', 'name_cn': '铁门头', 'hp': 200, 'special': '持铁门盾牌'},
    {'id': 'dancing_head', 'name_cn': '舞王头', 'hp': 100, 'special': '召唤伴舞僵尸'},
]

ZOMBIE_EFFECTS = [
    {'id': 'none_effect', 'name_cn': '无效果', 'description': '普通僵尸无特殊效果'},
    {'id': 'pole_effect', 'name_cn': '撑杆效果', 'description': '首次跳跃越过一株植物'},
    {'id': 'snorkel_effect', 'name_cn': '潜水效果', 'description': '水中潜行，接近时浮出'},
    {'id': 'balloon_effect', 'name_cn': '气球效果', 'description': '飞行越过植物，需三叶草吹走'},
]

ZOMBIES = {
    'torsos': ZOMBIE_TORSOS,
    'heads': ZOMBIE_HEADS,
    'effects': ZOMBIE_EFFECTS,
}


# ============================================================
# Boss数据
# ============================================================
BOSSES = [
    {
        'id': 'gargantuar', 'name_cn': '巨人僵尸', 'name_en': 'Gargantuar',
        'hp': 3000, 'damage': 1800, 'speed': 0.5, 'attack_speed': 1.0,
        'special': '砸毁植物，血量低时投掷小鬼', 'phase2_hp': 1500,
        'phase2_special': '投掷小鬼僵尸至后方'
    },
    {
        'id': 'frost_giant', 'name_cn': '冰霜巨人', 'name_en': 'Frost Giant',
        'hp': 4500, 'damage': 1800, 'speed': 0.4, 'attack_speed': 1.0,
        'special': '冰冻攻击，减速周围植物', 'phase2_hp': 2000,
        'phase2_special': '冰霜冲击波冻结全行植物'
    },
    {
        'id': 'edgar_ii', 'name_cn': '埃德加二世', 'name_en': 'Edgar II',
        'hp': 6000, 'damage': 2400, 'speed': 0.3, 'attack_speed': 0.8,
        'special': '机械Boss，多阶段攻击模式', 'phase2_hp': 3000,
        'phase2_special': '召唤冰球和火球攻击'
    },
]


# ============================================================
# 遗物数据
# ============================================================
RELICS = {
    'basic': [
        {'id': 'r_old_boot', 'name_cn': '旧靴子', 'tier': 'basic', 'effect': '僵尸移动速度-5%', 'rarity': 0.4},
        {'id': 'r_rusty_coin', 'name_cn': '生锈硬币', 'tier': 'basic', 'effect': '阳光产出+5%', 'rarity': 0.35},
        {'id': 'r_cracked_pot', 'name_cn': '裂纹花盆', 'tier': 'basic', 'effect': '植物生命+5%', 'rarity': 0.35},
        {'id': 'r_wilted_leaf', 'name_cn': '枯萎叶子', 'tier': 'basic', 'effect': '植物冷却-5%', 'rarity': 0.3},
    ],
    'elite': [
        {'id': 'r_war_horn', 'name_cn': '战争号角', 'tier': 'elite', 'effect': '植物攻击+15%', 'rarity': 0.2},
        {'id': 'r_iron_shield', 'name_cn': '铁盾', 'tier': 'elite', 'effect': '坚果类生命+25%', 'rarity': 0.18},
        {'id': 'r_frost_gem', 'name_cn': '冰霜宝石', 'tier': 'elite', 'effect': '冰系伤害+20%', 'rarity': 0.15},
        {'id': 'r_fire_crystal', 'name_cn': '火焰水晶', 'tier': 'elite', 'effect': '火系伤害+20%', 'rarity': 0.15},
    ],
    'leader': [
        {'id': 'r_crown_thorns', 'name_cn': '荆棘王冠', 'tier': 'leader', 'effect': '尖刺系伤害+40%', 'rarity': 0.08},
        {'id': 'r_ancient_seed', 'name_cn': '远古种子', 'tier': 'leader', 'effect': '光合系产出+50%', 'rarity': 0.06},
        {'id': 'r_void_orb', 'name_cn': '虚空宝珠', 'tier': 'leader', 'effect': '爆炸系范围+30%', 'rarity': 0.05},
        {'id': 'r_dragon_heart', 'name_cn': '龙心', 'tier': 'leader', 'effect': '投掷系伤害+35%', 'rarity': 0.05},
    ],
    'special': [
        {'id': 'r_zombie_dna', 'name_cn': '僵尸DNA', 'tier': 'special', 'effect': '魅惑系持续时间+100%', 'rarity': 0.02},
        {'id': 'r_world_tree', 'name_cn': '世界树枝', 'tier': 'special', 'effect': '全植物生命+20%', 'rarity': 0.015},
        {'id': 'r_chaos_stone', 'name_cn': '混沌之石', 'tier': 'special', 'effect': '变异概率+50%', 'rarity': 0.01},
        {'id': 'r_eternal_sun', 'name_cn': '永恒之阳', 'tier': 'special', 'effect': '阳光消耗-25%', 'rarity': 0.01},
    ],
}


# ============================================================
# 场景配置
# ============================================================
SCENES = {
    'lawn': {
        'id': 'lawn', 'name_cn': '草坪', 'name_en': 'Lawn',
        'rows': 5, 'cols': 9, 'has_water': False, 'has_roof': False,
        'has_fog': False, 'description': '经典5x9草坪场景'
    },
    'pool': {
        'id': 'pool', 'name_cn': '泳池', 'name_en': 'Pool',
        'rows': 6, 'cols': 9, 'has_water': True, 'has_roof': False,
        'has_fog': False, 'description': '含2行水道的6x9泳池场景',
        'water_rows': [2, 3]
    },
    'roof': {
        'id': 'roof', 'name_cn': '屋顶', 'name_en': 'Roof',
        'rows': 5, 'cols': 9, 'has_water': False, 'has_roof': True,
        'has_fog': False, 'description': '斜面屋顶场景，需花盆种植',
        'slope': 'left_high'
    },
    'fog_forest': {
        'id': 'fog_forest', 'name_cn': '迷雾森林', 'name_en': 'Fog Forest',
        'rows': 5, 'cols': 9, 'has_water': False, 'has_roof': False,
        'has_fog': True, 'description': '迷雾覆盖场景，需路灯花照明',
        'fog_density': 0.7
    },
}


# ============================================================
# 杂交能量等级
# ============================================================
HYBRID_ENERGY = {
    'blue': {
        'grade': 'blue', 'name_cn': '蓝色能量', 'name_en': 'Blue Energy',
        'color': '#4A90D9', 'multiplier': 1.0, 'fusion_cost': 0,
        'description': '基础杂交能量，无额外加成'
    },
    'purple': {
        'grade': 'purple', 'name_cn': '紫色能量', 'name_en': 'Purple Energy',
        'color': '#9B59B6', 'multiplier': 1.5, 'fusion_cost': 200,
        'description': '中级杂交能量，属性+50%'
    },
    'gold': {
        'grade': 'gold', 'name_cn': '金色能量', 'name_en': 'Gold Energy',
        'color': '#F1C40F', 'multiplier': 2.0, 'fusion_cost': 500,
        'description': '高级杂交能量，属性+100%'
    },
    'red': {
        'grade': 'red', 'name_cn': '红色能量', 'name_en': 'Red Energy',
        'color': '#E74C3C', 'multiplier': 3.0, 'fusion_cost': 1000,
        'description': '顶级杂交能量，属性+200%'
    },
}


# ============================================================
# 变异类型
# ============================================================
MUTATION_TYPES = [
    {'id': 'giant', 'name_cn': '巨型化', 'probability': 0.15,
     'effect': '体型增大50%，生命+100%，伤害+50%'},
    {'id': 'swift', 'name_cn': '疾速化', 'probability': 0.15,
     'effect': '攻击速度+80%，伤害-20%'},
    {'id': 'iron_skin', 'name_cn': '铁皮化', 'probability': 0.12,
     'effect': '生命+200%，移动/攻击速度-30%'},
    {'id': 'berserk', 'name_cn': '狂暴化', 'probability': 0.10,
     'effect': '伤害+150%，生命-30%'},
    {'id': 'regeneration', 'name_cn': '再生化', 'probability': 0.10,
     'effect': '每秒恢复2%最大生命值'},
    {'id': 'toxic', 'name_cn': '剧毒化', 'probability': 0.08,
     'effect': '攻击附带中毒效果，持续掉血'},
    {'id': 'frost', 'name_cn': '冰霜化', 'probability': 0.08,
     'effect': '攻击附带减速效果'},
    {'id': 'explosive', 'name_cn': '爆裂化', 'probability': 0.06,
     'effect': '死亡时爆炸，对周围造成伤害'},
    {'id': 'invisible', 'name_cn': '隐身化', 'probability': 0.05,
     'effect': '半透明状态，被攻击概率降低'},
    {'id': 'vampire', 'name_cn': '吸血化', 'probability': 0.04,
     'effect': '攻击回复造成伤害20%的生命值'},
    {'id': 'phoenix', 'name_cn': '不死化', 'probability': 0.04,
     'effect': '首次死亡后复活，恢复50%生命'},
    {'id': 'chaos', 'name_cn': '混沌化', 'probability': 0.03,
     'effect': '随机获得2种其他变异效果'},
]


# ============================================================
# 便捷获取函数
# ============================================================
def get_all_plants():
    """获取全部植物数据"""
    return PLANTS


def get_plant_by_id(plant_id):
    """根据ID获取植物数据"""
    for plant in PLANTS:
        if plant['id'] == plant_id:
            return plant
    return None


def get_plants_by_gene_pool(gene_pool):
    """根据基因池获取植物列表"""
    return [p for p in PLANTS if p['gene_pool'] == gene_pool]


def get_zombie_data():
    """获取僵尸数据"""
    return ZOMBIES


def get_boss_data():
    """获取Boss数据"""
    return BOSSES


def get_relic_data():
    """获取遗物数据"""
    return RELICS


def get_scene_data():
    """获取场景数据"""
    return SCENES


def get_hybrid_energy_data():
    """获取杂交能量数据"""
    return HYBRID_ENERGY


def get_mutation_data():
    """获取变异类型数据"""
    return MUTATION_TYPES
