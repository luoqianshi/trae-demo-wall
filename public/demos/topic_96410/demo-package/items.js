// ==================== 道具系统配置文件 ====================
// 独立的道具配置文件，不写在index.html中
// 包含所有道具定义、使用逻辑、产出配置

const ITEM_CONFIG = {
    // ==================== 职业养成道具 ====================
    jobSkillPotion: {
        id: 'jobSkillPotion',
        name: '职业技能药剂',
        type: '职业养成',
        description: '用于觉醒职业被动技能，每次消耗1个，成功率30%后递减',
        icon: '🧪',
        maxStack: 99,
        duration: '永久',
        usage: '觉醒消耗1个',
        note: '每觉醒一个被动技能后下一个成功率-10%',
        dropSources: ['任意关卡击杀(低概率)', '主线首通', '无限模式', '每日任务', '悬赏', '中级/高级宝箱', '钻石商店'],
        effect: (player) => {
            // 觉醒职业被动技能逻辑
            return { success: true, message: '使用职业技能药剂觉醒技能' };
        }
    },

    jobAwakenPotion: {
        id: 'jobAwakenPotion',
        name: '职业觉醒药剂',
        type: '职业养成',
        description: '使用后随机觉醒新职业，首个100%，第2个50%，第3个10%，第4个5%',
        icon: '✨',
        maxStack: 1,
        duration: '永久',
        usage: '使用消耗1个',
        note: '所有职业觉醒后无法使用',
        dropSources: ['任意关卡击杀(极低概率)', '章节首通', '成就奖励', '高级宝箱', '钻石商店'],
        effect: (player) => {
            // 觉醒新职业逻辑
            return { success: true, message: '使用职业觉醒药剂' };
        }
    },

    // ==================== 装备养成道具 ====================
    weaponEnhanceCard: {
        id: 'weaponEnhanceCard',
        name: '武器强化卡',
        type: '装备养成',
        description: '强化武器部位，强化等级最高+12，成功率随等级递减',
        icon: '⚔️',
        maxStack: 99,
        duration: '永久',
        usage: '强化消耗1张',
        note: '不同类型的强化卡对应不同部位',
        dropSources: ['任意关卡击杀', '无限模式', '初级/中级/高级宝箱', '金币商店', '魔晶商店'],
        effect: (player) => {
            return { success: true, message: '使用武器强化卡' };
        }
    },

    armorEnhanceCard: {
        id: 'armorEnhanceCard',
        name: '防具强化卡',
        type: '装备养成',
        description: '强化头盔/衣服/裤子/鞋子/腰带部位，强化等级最高+12',
        icon: '🛡️',
        maxStack: 99,
        duration: '永久',
        usage: '强化消耗1张',
        note: '防具包含5个部位',
        dropSources: ['任意关卡击杀', '无限模式', '初级/中级/高级宝箱', '金币商店', '魔晶商店'],
        effect: (player) => {
            return { success: true, message: '使用防具强化卡' };
        }
    },

    accessoryEnhanceCard: {
        id: 'accessoryEnhanceCard',
        name: '首饰强化卡',
        type: '装备养成',
        description: '强化项链/戒指部位，强化等级最高+12',
        icon: '💍',
        maxStack: 99,
        duration: '永久',
        usage: '强化消耗1张',
        note: '首饰包含2个部位',
        dropSources: ['任意关卡击杀', '无限模式', '初级/中级/高级宝箱', '金币商店', '魔晶商店'],
        effect: (player) => {
            return { success: true, message: '使用首饰强化卡' };
        }
    },

    blessCard: {
        id: 'blessCard',
        name: '祝福卡',
        type: '材料',
        description: '强化时使用避免失败惩罚（等级不变/等级-1/装备损坏），无论成败均消耗',
        icon: '🍀',
        maxStack: 99,
        duration: '永久',
        usage: '强化时勾选消耗1张',
        note: '使用后失败只保持等级不变',
        dropSources: ['任意关卡击杀(极低概率)', '活动', '魔晶商店', '高级宝箱', '合成(3祝福卡碎片)'],
        quality: '史诗',
        sellPrice: 200
    },

    // ==================== 强化碎片道具 ====================
    weaponEnhanceFragment: {
        id: 'weaponEnhanceFragment',
        name: '武器强化碎片',
        type: '材料',
        description: '收集3个可合成1张武器强化卡',
        icon: '🔧',
        maxStack: 99,
        duration: '永久',
        usage: '合成消耗3个',
        note: '合成获得武器强化卡',
        quality: '普通',
        sellPrice: 5,
        dropSources: ['任意关卡击杀(低概率)', '无限模式', '悬赏'],
        effect: (player) => {
            return { success: true, message: '武器强化碎片' };
        }
    },

    armorEnhanceFragment: {
        id: 'armorEnhanceFragment',
        name: '防具强化碎片',
        type: '材料',
        description: '收集3个可合成1张防具强化卡',
        icon: '🔩',
        maxStack: 99,
        duration: '永久',
        usage: '合成消耗3个',
        note: '合成获得防具强化卡',
        quality: '普通',
        sellPrice: 5,
        dropSources: ['任意关卡击杀(低概率)', '无限模式', '悬赏'],
        effect: (player) => {
            return { success: true, message: '防具强化碎片' };
        }
    },

    accessoryEnhanceFragment: {
        id: 'accessoryEnhanceFragment',
        name: '首饰强化碎片',
        type: '材料',
        description: '收集3个可合成1张首饰强化卡',
        icon: '💎',
        maxStack: 99,
        duration: '永久',
        usage: '合成消耗3个',
        note: '合成获得首饰强化卡',
        quality: '普通',
        sellPrice: 5,
        dropSources: ['任意关卡击杀(低概率)', '无限模式', '悬赏'],
        effect: (player) => {
            return { success: true, message: '首饰强化碎片' };
        }
    },

    blessCardFragment: {
        id: 'blessCardFragment',
        name: '祝福卡碎片',
        type: '材料',
        description: '收集3个可合成1个祝福卡',
        icon: '🧩',
        maxStack: 99,
        duration: '永久',
        usage: '合成消耗3个',
        note: '合成获得祝福卡',
        dropSources: ['任意关卡击杀(低概率)', '无限模式(每20波)', '悬赏'],
        effect: (player) => {
            return { success: true, message: '祝福卡碎片' };
        }
    },

    // ==================== 角色成长道具 ====================
    expScrollLow: {
        id: 'expScrollLow',
        name: '低级经验卷轴',
        type: '角色成长',
        description: '使用后10分钟内获得1.5倍玩家等级经验加成',
        icon: '📜',
        maxStack: 99,
        duration: '10分钟',
        usage: '使用消耗1个',
        note: '不可叠加，新卷轴覆盖旧效果',
        dropSources: ['任意关卡击杀', '初级宝箱', '每日任务', '金币商店'],
        effect: (player) => {
            // 激活1.5倍经验加成
            // 使用 battleStats 存储加成状态（游戏循环中实际读取的是 battleStats）
            if (typeof battleStats !== 'undefined') {
                battleStats.expBonusRate = 0.5;
                battleStats.expBonusTimer = 10 * 60 * 60; // 10分钟 = 600秒 @ 60fps
            }
            return { success: true, message: '获得1.5倍经验加成（10分钟）' };
        }
    },

    expScrollMid: {
        id: 'expScrollMid',
        name: '中级经验卷轴',
        type: '角色成长',
        description: '使用后10分钟内获得2倍玩家等级经验加成',
        icon: '📜',
        maxStack: 99,
        duration: '10分钟',
        usage: '使用消耗1个',
        note: '不可叠加，新卷轴覆盖旧效果',
        dropSources: ['任意关卡击杀', '中级宝箱', '悬赏', '无限模式', '魔晶商店'],
        effect: (player) => {
            if (typeof battleStats !== 'undefined') {
                battleStats.expBonusRate = 1.0;
                battleStats.expBonusTimer = 10 * 60 * 60;
            }
            return { success: true, message: '获得2倍经验加成（10分钟）' };
        }
    },

    expScrollHigh: {
        id: 'expScrollHigh',
        name: '高级经验卷轴',
        type: '角色成长',
        description: '使用后10分钟内获得2.5倍玩家等级经验加成',
        icon: '📜',
        maxStack: 99,
        duration: '10分钟',
        usage: '使用消耗1个',
        note: '不可叠加，新卷轴覆盖旧效果',
        dropSources: ['任意关卡击杀(低概率)', '高级宝箱', '活动', '成就奖励'],
        effect: (player) => {
            if (typeof battleStats !== 'undefined') {
                battleStats.expBonusRate = 1.5;
                battleStats.expBonusTimer = 10 * 60 * 60;
            }
            return { success: true, message: '获得2.5倍经验加成（10分钟）' };
        }
    },

    jobExpBookLow: {
        id: 'jobExpBookLow',
        name: '低级职业经验书',
        type: '角色成长',
        description: '使用后获得10点当前职业经验',
        icon: '📗',
        maxStack: 99,
        duration: '永久',
        usage: '使用消耗1个',
        note: '提升当前选中职业的等级',
        dropSources: ['任意关卡击杀', '初级宝箱', '每日任务', '金币商店'],
        effect: (player) => {
            if (player.activeJob && player.jobs && player.jobs[player.activeJob]) {
                const job = player.jobs[player.activeJob];
                if (job.unlocked) {
                    job.exp += 10;
                    // 检查升级
                    while (job.exp >= job.expToLevel && job.level < 200) {
                        job.exp -= job.expToLevel;
                        job.level++;
                        job.expToLevel = Math.floor(job.expToLevel * 1.2);
                    }
                    return { success: true, message: `获得10点职业经验（当前${job.exp}/${job.expToLevel}）` };
                }
            }
            return { success: false, message: '请先激活一个职业' };
        }
    },

    jobExpBookMid: {
        id: 'jobExpBookMid',
        name: '中级职业经验书',
        type: '角色成长',
        description: '使用后获得20点当前职业经验',
        icon: '📘',
        maxStack: 99,
        duration: '永久',
        usage: '使用消耗1个',
        note: '提升当前选中职业的等级',
        dropSources: ['任意关卡击杀', '中级宝箱', '悬赏', '无限模式', '魔晶商店'],
        effect: (player) => {
            if (player.activeJob && player.jobs && player.jobs[player.activeJob]) {
                const job = player.jobs[player.activeJob];
                if (job.unlocked) {
                    job.exp += 20;
                    while (job.exp >= job.expToLevel && job.level < 200) {
                        job.exp -= job.expToLevel;
                        job.level++;
                        job.expToLevel = Math.floor(job.expToLevel * 1.2);
                    }
                    return { success: true, message: `获得20点职业经验（当前${job.exp}/${job.expToLevel}）` };
                }
            }
            return { success: false, message: '请先激活一个职业' };
        }
    },

    jobExpBookHigh: {
        id: 'jobExpBookHigh',
        name: '高级职业经验书',
        type: '角色成长',
        description: '使用后获得30点当前职业经验',
        icon: '📕',
        maxStack: 99,
        duration: '永久',
        usage: '使用消耗1个',
        note: '提升当前选中职业的等级',
        dropSources: ['任意关卡击杀(低概率)', '高级宝箱', '活动', '成就奖励'],
        effect: (player) => {
            if (player.activeJob && player.jobs && player.jobs[player.activeJob]) {
                const job = player.jobs[player.activeJob];
                if (job.unlocked) {
                    job.exp += 30;
                    while (job.exp >= job.expToLevel && job.level < 200) {
                        job.exp -= job.expToLevel;
                        job.level++;
                        job.expToLevel = Math.floor(job.expToLevel * 1.2);
                    }
                    return { success: true, message: `获得30点职业经验（当前${job.exp}/${job.expToLevel}）` };
                }
            }
            return { success: false, message: '请先激活一个职业' };
        }
    },

    // ==================== 宝箱道具 ====================
    chestLow: {
        id: 'chestLow',
        name: '初级宝箱',
        type: '宝箱',
        description: '开启后随机获得金币、经验卷轴、职业经验书、强化卡、白色/绿色装备',
        icon: '📦',
        maxStack: 99,
        duration: '永久',
        usage: '开启消耗0，直接打开',
        note: '3个可合成1个中级宝箱',
        dropSources: ['任意关卡击杀', '每日任务', '情报速递', '金币商店'],
        quality: '普通',
        sellPrice: 20,
        effect: (player) => {
            // 使用全局变量获取当前关卡数，确保装备阶段与关卡匹配
            const stage = (typeof CURRENT_GAME_STAGE !== 'undefined') ? CURRENT_GAME_STAGE : 1;
            const rewards = generateChestRewards('low', stage);
            const rewardMessages = distributeChestRewards(rewards, player);
            return { success: true, message: `开启初级宝箱：${rewardMessages.join('，')}`, rewards };
        }
    },

    chestMid: {
        id: 'chestMid',
        name: '中级宝箱',
        type: '宝箱',
        description: '开启后随机获得金币、钻石、经验卷轴、职业经验书、强化卡、蓝色装备、职业技能药剂',
        icon: '🎁',
        maxStack: 99,
        duration: '永久',
        usage: '开启消耗0，直接打开',
        note: '3个可合成1个高级宝箱',
        dropSources: ['任意关卡击杀(低概率)', '悬赏', '无限模式', '活动'],
        quality: '稀有',
        sellPrice: 100,
        effect: (player) => {
            const stage = (typeof CURRENT_GAME_STAGE !== 'undefined') ? CURRENT_GAME_STAGE : 1;
            const rewards = generateChestRewards('mid', stage);
            const rewardMessages = distributeChestRewards(rewards, player);
            return { success: true, message: `开启中级宝箱：${rewardMessages.join('，')}`, rewards };
        }
    },

    chestHigh: {
        id: 'chestHigh',
        name: '高级宝箱',
        type: '宝箱',
        description: '开启后随机获得金币、钻石、经验卷轴、职业经验书、强化卡、紫色/橙色装备、职业技能药剂、职业觉醒药剂、祝福卡',
        icon: '🎀',
        maxStack: 99,
        duration: '永久',
        usage: '开启消耗0，直接打开',
        note: '最高级宝箱',
        dropSources: ['任意关卡击杀(极低概率)', '活动', '成就奖励', '魔晶商店'],
        quality: '史诗',
        sellPrice: 500,
        effect: (player) => {
            const stage = (typeof CURRENT_GAME_STAGE !== 'undefined') ? CURRENT_GAME_STAGE : 1;
            const rewards = generateChestRewards('high', stage);
            const rewardMessages = distributeChestRewards(rewards, player);
            return { success: true, message: `开启高级宝箱：${rewardMessages.join('，')}`, rewards };
        }
    },

    // ==================== 货币道具 ====================
    gold: {
        id: 'gold',
        name: '金币',
        type: '货币',
        description: '用于装备强化、商店购买、宝箱开启等',
        icon: '🪙',
        maxStack: 999999999,
        duration: '永久',
        usage: '消耗根据使用场景',
        note: '基础货币',
        dropSources: ['任意关卡击杀', '任务', '出售装备', '宝箱'],
        effect: (player) => {
            return { success: false, message: '金币不能直接使用' };
        }
    },

    diamond: {
        id: 'diamond',
        name: '钻石',
        type: '货币',
        description: '用于购买稀有道具、强化卡、魔晶、扩容背包等',
        icon: '💎',
        maxStack: 999999999,
        duration: '永久',
        usage: '消耗根据使用场景',
        note: '充值货币',
        dropSources: ['充值', '成就', '活动', '悬赏', '高级宝箱'],
        effect: (player) => {
            return { success: false, message: '钻石不能直接使用' };
        }
    },

    magicCrystal: {
        id: 'magicCrystal',
        name: '魔晶',
        type: '货币',
        description: '用于魔晶商店兑换祝福卡、高级卷轴、职业经验书、强化卡等',
        icon: '🔮',
        maxStack: 999999999,
        duration: '永久',
        usage: '消耗根据使用场景',
        note: '不可充值',
        dropSources: ['无限模式波次结算', '悬赏', '活动'],
        effect: (player) => {
            return { success: false, message: '魔晶不能直接使用' };
        }
    },

    // ==================== 材料道具 ====================
    chestFragmentLow: {
        id: 'chestFragmentLow',
        name: '初级宝箱碎片',
        type: '材料',
        description: '收集3个可合成1个初级宝箱',
        icon: '🧩',
        maxStack: 99,
        duration: '永久',
        usage: '合成消耗3个',
        note: '合成获得初级宝箱',
        dropSources: ['任意关卡击杀', '每日任务', '情报速递', '金币商店'],
        effect: (player) => {
            return { success: true, message: '初级宝箱碎片' };
        }
    },

    chestFragmentMid: {
        id: 'chestFragmentMid',
        name: '中级宝箱碎片',
        type: '材料',
        description: '收集3个可合成1个中级宝箱',
        icon: '🧩',
        maxStack: 99,
        duration: '永久',
        usage: '合成消耗3个',
        note: '合成获得中级宝箱',
        dropSources: ['任意关卡击杀(低概率)', '悬赏', '无限模式', '活动'],
        effect: (player) => {
            return { success: true, message: '中级宝箱碎片' };
        }
    },

    chestFragmentHigh: {
        id: 'chestFragmentHigh',
        name: '高级宝箱碎片',
        type: '材料',
        description: '收集3个可合成1个高级宝箱',
        icon: '🧩',
        maxStack: 99,
        duration: '永久',
        usage: '合成消耗3个',
        note: '合成获得高级宝箱',
        dropSources: ['任意关卡击杀(极低概率)', '活动', '成就奖励', '魔晶商店'],
        effect: (player) => {
            return { success: true, message: '高级宝箱碎片' };
        }
    },

    expScrollFragmentLow: {
        id: 'expScrollFragmentLow',
        name: '低级经验卷轴碎片',
        type: '材料',
        description: '收集3个可合成1个低级经验卷轴',
        icon: '📃',
        maxStack: 99,
        duration: '永久',
        usage: '合成消耗3个',
        note: '合成获得低级经验卷轴',
        dropSources: ['任意关卡击杀', '初级宝箱', '每日任务', '金币商店'],
        effect: (player) => {
            return { success: true, message: '低级经验卷轴碎片' };
        }
    },

    expScrollFragmentMid: {
        id: 'expScrollFragmentMid',
        name: '中级经验卷轴碎片',
        type: '材料',
        description: '收集3个可合成1个中级经验卷轴',
        icon: '📃',
        maxStack: 99,
        duration: '永久',
        usage: '合成消耗3个',
        note: '合成获得中级经验卷轴',
        dropSources: ['任意关卡击杀', '中级宝箱', '悬赏', '无限模式', '魔晶商店'],
        effect: (player) => {
            return { success: true, message: '中级经验卷轴碎片' };
        }
    },

    expScrollFragmentHigh: {
        id: 'expScrollFragmentHigh',
        name: '高级经验卷轴碎片',
        type: '材料',
        description: '收集3个可合成1个高级经验卷轴',
        icon: '📃',
        maxStack: 99,
        duration: '永久',
        usage: '合成消耗3个',
        note: '合成获得高级经验卷轴',
        dropSources: ['任意关卡击杀(低概率)', '高级宝箱', '活动', '成就奖励'],
        effect: (player) => {
            return { success: true, message: '高级经验卷轴碎片' };
        }
    }
};

// ==================== 道具使用函数 ====================

/**
 * 使用道具
 * @param {string} itemId - 道具ID
 * @param {object} player - 玩家对象
 * @returns {object} - 使用结果 {success, message, rewards}
 */
function useItem(itemId, player) {
    const item = ITEM_CONFIG[itemId];
    if (!item) {
        return { success: false, message: '道具不存在' };
    }

    // 材料类道具不可直接使用
    if (item.type === '材料' || !item.effect) {
        return { success: false, message: '该道具无法直接使用' };
    }

    // 检查道具数量
    if (!player.inventory || !player.inventory[itemId] || player.inventory[itemId] <= 0) {
        return { success: false, message: '道具数量不足' };
    }

    // 执行道具效果
    const result = item.effect(player);

    // 扣除道具数量
    if (result.success) {
        player.inventory[itemId]--;
        if (player.inventory[itemId] <= 0) {
            delete player.inventory[itemId];
        }
    }

    return result;
}

/**
 * 添加道具到背包
 * @param {string} itemId - 道具ID
 * @param {number} count - 数量
 * @param {object} player - 玩家对象
 * @returns {boolean} - 是否添加成功
 */
function addItem(itemId, count, player) {
    const item = ITEM_CONFIG[itemId];
    if (!item) return false;

    if (!player.inventory) player.inventory = {};

    const currentCount = player.inventory[itemId] || 0;
    const newCount = currentCount + count;

    // 检查最大堆叠
    if (newCount > item.maxStack) {
        player.inventory[itemId] = item.maxStack;
        return false; // 超出最大堆叠
    }

    player.inventory[itemId] = newCount;
    return true;
}

/**
 * 获取道具信息
 * @param {string} itemId - 道具ID
 * @returns {object|null} - 道具信息
 */
function getItemInfo(itemId) {
    return ITEM_CONFIG[itemId] || null;
}

/**
 * 生成宝箱奖励
 * @param {string} chestType - 宝箱类型 low/mid/high
 * @returns {array} - 奖励列表
 */
/**
 * 生成宝箱奖励配置
 * @param {string} chestType - 宝箱类型 low/mid/high
 * @param {number} stage - 当前关卡数（决定装备阶段）
 * @returns {array} - 奖励列表
 */
function generateChestRewards(chestType, stage) {
    const rewards = [];

    // ⭐ 根据关卡数计算基础阶段：每两关一个阶段
    // 1~2关→1阶, 3~4关→2阶, 5~6关→3阶, ...
    const baseTier = Math.min(10, Math.max(1, Math.ceil((stage || 1) / 2)));

    switch (chestType) {
        case 'low':
            // 初级宝箱奖励：金币、经验卷轴、职业经验书、强化卡、白色/绿色装备
            // 金币（必得）
            rewards.push({ type: 'gold', count: Math.floor(Math.random() * 100) + 50 });
            // 经验卷轴（30%概率）
            if (Math.random() < 0.3) rewards.push({ type: 'item', itemId: 'expScrollLow', count: 1 });
            // 职业经验书（25%概率）
            if (Math.random() < 0.25) rewards.push({ type: 'item', itemId: 'jobExpBookLow', count: 1 });
            // 强化卡（20%概率，随机类型）
            if (Math.random() < 0.2) {
                const cardTypes = ['weaponEnhanceCard', 'armorEnhanceCard', 'accessoryEnhanceCard'];
                const randomCard = cardTypes[Math.floor(Math.random() * cardTypes.length)];
                rewards.push({ type: 'item', itemId: randomCard, count: 1 });
            }
            // 白色/绿色装备（30%概率，普通/优秀品质，阶数严格跟随关卡阶段）
            if (Math.random() < 0.3) {
                const equipQuality = Math.random() < 0.6 ? '普通' : '优秀';
                rewards.push({ type: 'equipment', quality: equipQuality, tier: baseTier });
            }
            break;

        case 'mid':
            // 中级宝箱奖励：金币、钻石、经验卷轴、职业经验书、强化卡、蓝色装备、职业技能药剂
            // 金币（必得）
            rewards.push({ type: 'gold', count: Math.floor(Math.random() * 300) + 150 });
            // 钻石（必得）
            rewards.push({ type: 'diamond', count: Math.floor(Math.random() * 20) + 10 });
            // 经验卷轴（40%概率）
            if (Math.random() < 0.4) rewards.push({ type: 'item', itemId: 'expScrollMid', count: 1 });
            // 职业经验书（35%概率）
            if (Math.random() < 0.35) rewards.push({ type: 'item', itemId: 'jobExpBookMid', count: 1 });
            // 强化卡（30%概率，随机类型）
            if (Math.random() < 0.3) {
                const cardTypes = ['weaponEnhanceCard', 'armorEnhanceCard', 'accessoryEnhanceCard'];
                const randomCard = cardTypes[Math.floor(Math.random() * cardTypes.length)];
                rewards.push({ type: 'item', itemId: randomCard, count: 1 });
            }
            // 蓝色装备（40%概率，精良品质，阶数严格跟随关卡阶段）
            if (Math.random() < 0.4) {
                rewards.push({ type: 'equipment', quality: '精良', tier: baseTier });
            }
            // 职业技能药剂（15%概率）
            if (Math.random() < 0.15) rewards.push({ type: 'item', itemId: 'jobSkillPotion', count: 1 });
            break;

        case 'high':
            // 高级宝箱奖励：金币、钻石、经验卷轴、职业经验书、强化卡、紫色/橙色装备、职业技能药剂、职业觉醒药剂、祝福卡
            // 金币（必得）
            rewards.push({ type: 'gold', count: Math.floor(Math.random() * 1000) + 500 });
            // 钻石（必得）
            rewards.push({ type: 'diamond', count: Math.floor(Math.random() * 100) + 50 });
            // 经验卷轴（50%概率）
            if (Math.random() < 0.5) rewards.push({ type: 'item', itemId: 'expScrollHigh', count: 1 });
            // 职业经验书（45%概率）
            if (Math.random() < 0.45) rewards.push({ type: 'item', itemId: 'jobExpBookHigh', count: 1 });
            // 强化卡（40%概率，随机类型）
            if (Math.random() < 0.4) {
                const cardTypes = ['weaponEnhanceCard', 'armorEnhanceCard', 'accessoryEnhanceCard'];
                const randomCard = cardTypes[Math.floor(Math.random() * cardTypes.length)];
                rewards.push({ type: 'item', itemId: randomCard, count: 2 });
            }
            // 紫色/橙色装备（50%概率，史诗品质，阶数严格跟随关卡阶段）
            if (Math.random() < 0.5) {
                rewards.push({ type: 'equipment', quality: '史诗', tier: baseTier });
            }
            // 职业技能药剂（30%概率）
            if (Math.random() < 0.3) rewards.push({ type: 'item', itemId: 'jobSkillPotion', count: 1 });
            // 职业觉醒药剂（15%概率）
            if (Math.random() < 0.15) rewards.push({ type: 'item', itemId: 'jobAwakenPotion', count: 1 });
            // 祝福卡（20%概率）
            if (Math.random() < 0.2) rewards.push({ type: 'item', itemId: 'blessCard', count: 1 });
            break;
    }

    return rewards;
}

/**
 * 发放宝箱奖励给玩家
 * @param {array} rewards - 奖励列表
 * @param {object} player - 玩家对象
 * @returns {array} - 奖励消息列表
 */
function distributeChestRewards(rewards, player) {
    const messages = [];

    rewards.forEach(reward => {
        switch (reward.type) {
            case 'gold':
                player.gold = (player.gold || 0) + reward.count;
                messages.push(`🪙 +${reward.count} 金币`);
                break;
            case 'diamond':
                player.diamond = (player.diamond || 0) + reward.count;
                messages.push(`💎 +${reward.count} 钻石`);
                break;
            case 'item':
                if (typeof addItem === 'function' && addItem(reward.itemId, reward.count, player)) {
                    const itemConfig = ITEM_CONFIG[reward.itemId];
                    if (itemConfig) {
                        messages.push(`${itemConfig.icon} ${itemConfig.name} x${reward.count}`);
                    }
                }
                break;
            case 'equipment':
                // 生成装备
                if (typeof generateEquipment === 'function' && typeof addEquipmentToBag === 'function') {
                    // 随机职业（优先当前职业）
                    const jobs = ['titan', 'archer', 'fireMage', 'iceMage'];
                    const activeJob = player.activeJob || 'titan';
                    const jobRand = Math.random();
                    let jobId;
                    if (jobRand < 0.4) {
                        jobId = activeJob;
                    } else {
                        const otherJobs = jobs.filter(j => j !== activeJob);
                        jobId = otherJobs[Math.floor(Math.random() * otherJobs.length)];
                    }
                    
                    // 随机部位
                    const slots = ['weapon', 'helmet', 'clothes', 'pants', 'shoes', 'belt', 'necklace', 'ring'];
                    const slot = slots[Math.floor(Math.random() * slots.length)];
                    
                    // 阶数根据宝箱等级
                    const tier = reward.tier || 1;
                    
                    // 品质从奖励中获取，直接传入生成函数
                    const quality = reward.quality || '普通';
                    const equipment = generateEquipment(jobId, slot, tier, quality);
                    if (equipment) {
                        addEquipmentToBag(equipment);
                        const color = getQualityColor(equipment.quality);
                        messages.push(`${getEquipSlotIcon(slot)} <span style="color:${color}">${equipment.name}</span>`);
                    }
                }
                break;
        }
    });

    return messages;
}

/**
 * 合成道具
 * @param {string} targetItemId - 目标道具ID
 * @param {string} fragmentItemId - 碎片道具ID
 * @param {number} fragmentCount - 需要碎片数量
 * @param {object} player - 玩家对象
 * @returns {object} - 合成结果
 */
function craftItem(targetItemId, fragmentItemId, fragmentCount, player) {
    const currentFragments = player.inventory?.[fragmentItemId] || 0;

    if (currentFragments < fragmentCount) {
        return { success: false, message: `碎片不足，需要${fragmentCount}个` };
    }

    // 扣除碎片
    player.inventory[fragmentItemId] -= fragmentCount;
    if (player.inventory[fragmentItemId] <= 0) {
        delete player.inventory[fragmentItemId];
    }

    // 添加目标道具
    addItem(targetItemId, 1, player);

    return { success: true, message: `合成成功：${ITEM_CONFIG[targetItemId]?.name || targetItemId}` };
}

// ==================== 道具掉落配置（已迁移到 index.html）====================
// 注意：掉落系统已迁移到 index.html 中的 EQUIP_DROP_CONFIG 和 processFullMonsterDrop
// 新版掉落系统功能更完整，包含：金币、道具、装备掉落，以及品质加成、等级分段等
// 以下旧版代码已弃用，保留注释供参考

/*
const DROP_CONFIG = {
    // 普通怪物掉落
    normal: {
        gold: { chance: 0.8, min: 5, max: 20 },
        items: [
            { itemId: 'expScrollLow', chance: 0.05 },
            { itemId: 'jobExpBookLow', chance: 0.03 },
            { itemId: 'weaponEnhanceCard', chance: 0.02 },
            { itemId: 'armorEnhanceCard', chance: 0.02 }
        ]
    },

    // 精英怪物掉落
    elite: {
        gold: { chance: 0.8, min: 20, max: 50 },
        items: [
            { itemId: 'expScrollLow', chance: 0.15 },
            { itemId: 'expScrollMid', chance: 0.08 },
            { itemId: 'jobExpBookLow', chance: 0.1 },
            { itemId: 'jobExpBookMid', chance: 0.05 },
            { itemId: 'weaponEnhanceCard', chance: 0.08 },
            { itemId: 'armorEnhanceCard', chance: 0.08 },
            { itemId: 'accessoryEnhanceCard', chance: 0.05 },
            { itemId: 'blessCardFragment', chance: 0.03 },
            { itemId: 'chestLow', chance: 0.1 }
        ]
    },

    // BOSS掉落
    boss: {
        gold: { chance: 1.0, min: 100, max: 300 },
        items: [
            { itemId: 'expScrollMid', chance: 0.3 },
            { itemId: 'expScrollHigh', chance: 0.15 },
            { itemId: 'jobExpBookMid', chance: 0.2 },
            { itemId: 'jobExpBookHigh', chance: 0.1 },
            { itemId: 'weaponEnhanceCard', chance: 0.2 },
            { itemId: 'armorEnhanceCard', chance: 0.2 },
            { itemId: 'accessoryEnhanceCard', chance: 0.15 },
            { itemId: 'blessCard', chance: 0.08 },
            { itemId: 'jobSkillPotion', chance: 0.1 },
            { itemId: 'chestMid', chance: 0.15 },
            { itemId: 'chestHigh', chance: 0.05 }
        ]
    }
};

function processMonsterDrop(monsterType, player) {
    const config = DROP_CONFIG[monsterType] || DROP_CONFIG.normal;
    const drops = [];
    if (Math.random() < config.gold.chance) {
        const goldAmount = Math.floor(Math.random() * (config.gold.max - config.gold.min + 1)) + config.gold.min;
        player.gold = (player.gold || 0) + goldAmount;
        drops.push({ type: 'gold', count: goldAmount });
    }
    config.items.forEach(item => {
        if (Math.random() < item.chance) {
            addItem(item.itemId, 1, player);
            drops.push({ type: 'item', itemId: item.itemId, count: 1 });
        }
    });
    return drops;
}
*/

// 导出模块（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ITEM_CONFIG,
        useItem,
        addItem,
        getItemInfo,
        generateChestRewards,
        craftItem
    };
}
