/**
 * 末日防守游戏 - 关卡配置表
 * 动态随机关卡系统配置
 */

const LEVEL_CONFIG = {
    // 结算系数配置
    REWARD_CONFIG: {
        EXP_CONVERSION_RATE: 0.1,      // 经验换算系数
        GOLD_CONVERSION_RATE: 0.05,     // 金币换算系数
        DROP_RATE_BASE: 0.1,            // 基础道具掉落概率
        POWER_FLUCTUATION: 0.2,         // 战力浮动区间 ±20%
    },

    // 怪物品质战力权重
    QUALITY_POWER_WEIGHT: {
        '普通': 1.0,
        '精良': 1.5,
        '优秀': 2.0,
        '极品精英': 3.0,
        'BOSS': 5.0
    },

    // 刷新权重（数值越高刷新概率越大）
    SPAWN_WEIGHT: {
        '普通': 100,
        '精良': 60,
        '优秀': 30,
        '极品精英': 10,
        'BOSS': 2
    },

    // 关卡配置（20个关卡）
    LEVELS: [
        // ==================== 第1-5关：新手区域 ====================
        {
            id: 1,
            name: '城郊废墟',
            basePower: 5000,
            waveCount: 20,
            monsterPool: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            allowedQualities: ['普通', '精良'],
            description: '废弃的城市边缘，充满了低级感染者'
        },
        {
            id: 2,
            name: '街区沦陷',
            basePower: 20000,
            waveCount: 20,
            monsterPool: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            allowedQualities: ['普通', '精良'],
            description: '曾经繁华的街区，现在被感染者占据'
        },
        {
            id: 3,
            name: '工业区废墟',
            basePower: 40000,
            waveCount: 20,
            monsterPool: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
            allowedQualities: ['普通', '精良', '优秀'],
            description: '废弃的工业区，出现了更强的变异体'
        },
        {
            id: 4,
            name: '商业中心',
            basePower: 60000,
            waveCount: 20,
            monsterPool: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
            allowedQualities: ['普通', '精良', '优秀'],
            description: '大型商业中心，精英感染者的聚集地'
        },
        {
            id: 5,
            name: '军事禁区',
            basePower: 80000,
            waveCount: 20,
            monsterPool: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
            allowedQualities: ['普通', '精良', '优秀'],
            description: '被遗弃的军事设施，守卫者异常强大'
        },

        // ==================== 第6-10关：进阶区域 ====================
        {
            id: 6,
            name: '荒野废土',
            basePower: 120000,
            waveCount: 20,
            monsterPool: [51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
            allowedQualities: ['普通', '精良', '优秀', '极品精英'],
            description: '广阔的荒野，生存着各种变异生物'
        },
        {
            id: 7,
            name: '沙漠禁区',
            basePower: 150000,
            waveCount: 20,
            monsterPool: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
            allowedQualities: ['普通', '精良', '优秀', '极品精英'],
            description: '酷热的沙漠，隐藏着强大的变异体'
        },
        {
            id: 8,
            name: '雪山绝境',
            basePower: 200000,
            waveCount: 20,
            monsterPool: [71, 72, 73, 74, 75, 76, 77, 78, 79, 80],
            allowedQualities: ['普通', '精良', '优秀', '极品精英'],
            description: '寒冷的雪山，感染者进化出了适应能力'
        },
        {
            id: 9,
            name: '地下巢穴',
            basePower: 250000,
            waveCount: 20,
            monsterPool: [81, 82, 83, 84, 85, 86, 87, 88, 89, 90],
            allowedQualities: ['普通', '精良', '优秀', '极品精英'],
            description: '地下深处的巢穴，危险重重'
        },
        {
            id: 10,
            name: '废墟之都',
            basePower: 300000,
            waveCount: 20,
            monsterPool: [91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
            allowedQualities: ['精良', '优秀', '极品精英', 'BOSS'],
            description: '曾经的大都市，现在是感染者的乐园'
        },

        // ==================== 第11-15关：高级区域 ====================
        {
            id: 11,
            name: '幽冥深渊',
            basePower: 400000,
            waveCount: 20,
            monsterPool: [101, 102, 103, 104, 105, 106, 107, 108, 109, 110],
            allowedQualities: ['精良', '优秀', '极品精英', 'BOSS'],
            description: '深渊入口，充满了未知的恐惧'
        },
        {
            id: 12,
            name: '炼狱战场',
            basePower: 500000,
            waveCount: 20,
            monsterPool: [111, 112, 113, 114, 115, 116, 117, 118, 119, 120],
            allowedQualities: ['精良', '优秀', '极品精英', 'BOSS'],
            description: '战火纷飞的战场，变异体更加狂暴'
        },
        {
            id: 13,
            name: '虚空裂隙',
            basePower: 650000,
            waveCount: 20,
            monsterPool: [121, 122, 123, 124, 125, 126, 127, 128, 129, 130],
            allowedQualities: ['优秀', '极品精英', 'BOSS'],
            description: '虚空裂隙的影响下，怪物变得更加强大'
        },
        {
            id: 14,
            name: '末日要塞',
            basePower: 800000,
            waveCount: 20,
            monsterPool: [131, 132, 133, 134, 135, 136, 137, 138, 139, 140],
            allowedQualities: ['优秀', '极品精英', 'BOSS'],
            description: '曾经的末日要塞，现在成为了怪物的巢穴'
        },
        {
            id: 15,
            name: '万骨枯地',
            basePower: 1050000,
            waveCount: 20,
            monsterPool: [141, 142, 143, 144, 145, 146, 147, 148, 149, 150],
            allowedQualities: ['优秀', '极品精英', 'BOSS'],
            description: '堆积如山的白骨，见证了无数战斗'
        },

        // ==================== 第16-20关：终极区域 ====================
        {
            id: 16,
            name: '破碎虚空',
            basePower: 1300000,
            waveCount: 20,
            monsterPool: [151, 152, 153, 154, 155, 156, 157, 158, 159, 160],
            allowedQualities: ['极品精英', 'BOSS'],
            description: '虚空破碎的边缘，最强的变异体在此诞生'
        },
        {
            id: 17,
            name: '星河战场',
            basePower: 1500000,
            waveCount: 20,
            monsterPool: [161, 162, 163, 164, 165, 166, 167, 168, 169, 170],
            allowedQualities: ['极品精英', 'BOSS'],
            description: '星空之下的战场，超越想象的敌人'
        },
        {
            id: 18,
            name: '混沌领域',
            basePower: 1800000,
            waveCount: 20,
            monsterPool: [171, 172, 173, 174, 175, 176, 177, 178, 179, 180],
            allowedQualities: ['极品精英', 'BOSS'],
            description: '混沌的领域，法则在此扭曲'
        },
        {
            id: 19,
            name: '洪荒遗迹',
            basePower: 2200000,
            waveCount: 20,
            monsterPool: [181, 182, 183, 184, 185, 186, 187, 188, 189, 190],
            allowedQualities: ['极品精英', 'BOSS'],
            description: '远古的遗迹，沉睡的怪物被唤醒'
        },
        {
            id: 20,
            name: '终焉之地',
            basePower: 2500000,
            waveCount: 20,
            monsterPool: [191, 192, 193, 194, 195, 196, 197, 198, 199, 200],
            allowedQualities: ['极品精英', 'BOSS'],
            description: '末日的终点，最强的敌人等待着挑战者'
        }
    ],

    // 获取关卡配置
    getLevel: function(id) {
        return this.LEVELS.find(l => l.id === id);
    },

    // 获取当前解锁的最高关卡
    getUnlockedLevels: function(currentLevel) {
        return this.LEVELS.filter(l => l.id <= currentLevel);
    },

    // 生成本局随机战力
    generateRandomPower: function(basePower) {
        const fluctuation = this.REWARD_CONFIG.POWER_FLUCTUATION;
        const minPower = basePower * (1 - fluctuation);
        const maxPower = basePower * (1 + fluctuation);
        return Math.floor(Math.random() * (maxPower - minPower + 1)) + minPower;
    },

    // 根据品质获取战力权重
    getQualityWeight: function(quality) {
        return this.QUALITY_POWER_WEIGHT[quality] || 1.0;
    },

    // 分配波次战力（模式1：匀速递增）
    distributePowerEvenly: function(totalPower, waveCount) {
        const powers = [];
        const basePower = totalPower / waveCount;
        
        for (let i = 0; i < waveCount; i++) {
            const progress = i / (waveCount - 1);
            const multiplier = 0.5 + progress * 1.0;
            powers.push(Math.floor(basePower * multiplier));
        }
        
        // 调整最后一波战力以确保总和正确
        const sum = powers.reduce((a, b) => a + b, 0);
        powers[waveCount - 1] += totalPower - sum;
        
        return powers;
    },

    // 分配波次战力（模式2：随机分配）
    distributePowerRandomly: function(totalPower, waveCount) {
        const powers = [];
        let remainingPower = totalPower;
        
        for (let i = 0; i < waveCount - 1; i++) {
            const maxPower = remainingPower - (waveCount - i - 1) * 10;
            const power = Math.floor(Math.random() * maxPower) + 10;
            powers.push(power);
            remainingPower -= power;
        }
        
        powers.push(remainingPower);
        return powers;
    },

    // 计算单个怪物战力
    calcMonsterPower: function(monster) {
        return monster.health + monster.attack + monster.defense;
    },

    // 根据品质权重随机选择怪物
    pickMonsterByWeight: function(monsterPoolArray) {
        let totalWeight = 0;
        const weights = monsterPoolArray.map(m => {
            const w = this.SPAWN_WEIGHT[m.quality] || 1;
            totalWeight += w;
            return w;
        });

        let random = Math.random() * totalWeight;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) return monsterPoolArray[i];
        }
        return monsterPoolArray[monsterPoolArray.length - 1];
    },

    // 根据战力生成怪物组合（带数量上限，同类怪物合并）
    generateMonstersForWave: function(wavePower, levelConfig, monsterConfig) {
        const { monsterPool, allowedQualities } = levelConfig;

        // 获取允许的怪物列表
        const availableMonsters = monsterPool
            .map(id => monsterConfig.getMonster(id))
            .filter(m => m && allowedQualities.includes(m.quality));

        if (availableMonsters.length === 0) return [];

        // 计算平均单个怪物战力
        const avgMonsterPower = availableMonsters.reduce((sum, m) =>
            sum + this.calcMonsterPower(m), 0) / availableMonsters.length;

        // ⭐ 关键修复：计算每波合理的怪物总数量上限
        // 基于战力/平均怪物战力得出理论数量，再施加硬上限防止怪物过多
        const theoreticalMax = Math.floor(wavePower / avgMonsterPower);
        // 硬上限：最少8只，最多不超过30只（防止出现220+怪物的异常情况）
        const TOTAL_MONSTER_LIMIT = Math.max(8, Math.min(30, theoreticalMax + 5));

        // 根据预算自动计算合理的怪物条目数量
        let targetMonsterEntries = Math.max(5, Math.min(15, Math.floor(wavePower / avgMonsterPower / 2)));
        targetMonsterEntries = Math.max(5, Math.min(12, targetMonsterEntries));

        // 每个怪物条目的预算战力
        const budgetPerEntry = Math.floor(wavePower / targetMonsterEntries);

        // 用于存储合并后的怪物 {id: { monster, spawnCount }}
        const mergedMap = new Map();
        let usedPower = 0;
        let totalSpawned = 0;  // 累计已分配的怪物数量

        for (let i = 0; i < targetMonsterEntries; i++) {
            // ⭐ 检查总数量上限
            if (totalSpawned >= TOTAL_MONSTER_LIMIT) break;

            // 剩余预算
            const remainingBudget = wavePower - usedPower;
            if (remainingBudget <= 0) break;

            // 本条预算：平均预算与剩余预算的较小值，最后一条直接用剩余
            let entryBudget = (i === targetMonsterEntries - 1)
                ? remainingBudget
                : Math.min(budgetPerEntry, remainingBudget);

            // 根据权重随机选一种怪物
            const selectedMonster = this.pickMonsterByWeight(availableMonsters);
            const monsterPower = this.calcMonsterPower(selectedMonster);

            // 计算该条最多能放多少只同类怪物（至少1只）
            let maxCount = Math.max(1, Math.floor(entryBudget / monsterPower));
            // ⭐ 单种怪物单次不超过8只，且总数量不超过上限
            maxCount = Math.min(maxCount, 8, TOTAL_MONSTER_LIMIT - totalSpawned);
            if (maxCount <= 0) break;

            // 记录
            const id = selectedMonster.id;
            if (mergedMap.has(id)) {
                const entry = mergedMap.get(id);
                entry.spawnCount += maxCount;
            } else {
                mergedMap.set(id, {
                    ...selectedMonster,
                    spawnCount: maxCount
                });
            }
            usedPower += monsterPower * maxCount;
            totalSpawned += maxCount;
        }

        // 将剩余战力尽量用掉（加入一些小怪）
        let leftover = wavePower - usedPower;
        let safetyCounter = 0;
        while (leftover > 0 && safetyCounter < 20 && totalSpawned < TOTAL_MONSTER_LIMIT) {
            safetyCounter++;
            const affordable = availableMonsters.filter(m => this.calcMonsterPower(m) <= leftover);
            if (affordable.length === 0) break;

            const pick = this.pickMonsterByWeight(affordable);
            const power = this.calcMonsterPower(pick);
            let addCount = Math.floor(leftover / power);
            if (addCount <= 0) break;
            // ⭐ 补充小怪每次最多3只，且不超过总上限
            addCount = Math.min(addCount, 3, TOTAL_MONSTER_LIMIT - totalSpawned);
            if (addCount <= 0) break;

            if (mergedMap.has(pick.id)) {
                mergedMap.get(pick.id).spawnCount += addCount;
            } else {
                mergedMap.set(pick.id, { ...pick, spawnCount: addCount });
            }
            leftover -= power * addCount;
            totalSpawned += addCount;
        }

        // 转为数组
        return Array.from(mergedMap.values());
    },

    // 计算结算奖励
    calculateRewards: function(actualPower, basePower, goldBonusRate = 1, expBonusRate = 1) {
        const { EXP_CONVERSION_RATE, GOLD_CONVERSION_RATE, DROP_RATE_BASE } = this.REWARD_CONFIG;
        
        const dropMultiplier = actualPower / basePower;
        
        return {
            baseExp: Math.floor(actualPower * EXP_CONVERSION_RATE * expBonusRate),
            baseGold: Math.floor(actualPower * GOLD_CONVERSION_RATE * goldBonusRate),
            dropRate: Math.min(1, DROP_RATE_BASE * dropMultiplier)
        };
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LEVEL_CONFIG;
}
