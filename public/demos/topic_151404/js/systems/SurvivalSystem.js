/**
 * Tom孤岛生存 - 生存系统
 * 负责管理饥饿、口渴、体力三大生存数值，以及食物消耗、休息等功能
 */

(function() {

const gameManager = window.gameManager;
const { SURVIVAL_CONFIG, FOOD_VALUES } = window.Constants;

class SurvivalSystem {
    constructor() {
        // 生存数值（通过 player 对象存储，这里仅提供逻辑方法）
        this._eventListeners = {
            statChange: [],    // 数值变化
            lowWarning: [],    // 低值警告
            gameOver: []       // 游戏结束（数值归零）
        };

        // 上一次的数值状态（用于检测警告阈值）
        this._lastWarningState = {
            hunger: false,
            thirst: false,
            energy: false
        };
    }

    /**
     * 更新生存系统
     * @param {number} dt - 帧间隔时间（秒）
     */
    update(dt) {
        if (!gameManager.isPlaying()) return;

        const player = gameManager.getPlayer();
        if (!player || !player.stats) return;

        const timeRatio = gameManager.getTimeRatio();
        const diffConfig = gameManager.getDifficultyConfig();

        // 计算本帧对应的游戏小时数
        const gameHours = dt * timeRatio;

        // 获取基础下降速率并应用难度倍率
        const hungerDecay = SURVIVAL_CONFIG.HUNGER_DECAY_RATE * diffConfig.hungerRateMultiplier;
        const thirstDecay = SURVIVAL_CONFIG.THIRST_DECAY_RATE * diffConfig.thirstRateMultiplier;
        const energyDecay = SURVIVAL_CONFIG.ENERGY_DECAY_RATE * diffConfig.energyRateMultiplier;

        // 记录变化前的数值
        const oldStats = { ...player.stats };

        // 应用衰减
        player.stats.hunger = Math.max(SURVIVAL_CONFIG.MIN_VALUE, player.stats.hunger - hungerDecay * gameHours);
        player.stats.thirst = Math.max(SURVIVAL_CONFIG.MIN_VALUE, player.stats.thirst - thirstDecay * gameHours);
        player.stats.energy = Math.max(SURVIVAL_CONFIG.MIN_VALUE, player.stats.energy - energyDecay * gameHours);

        // 触发数值变化事件
        if (this._statsChanged(oldStats, player.stats)) {
            this._emit('statChange', { oldStats, newStats: { ...player.stats } });
        }

        // 检查警告状态
        this._checkWarnings(player.stats);

        // 检查游戏结束
        this._checkGameOver(player.stats);
    }

    /**
     * 检查数值是否有变化
     * @param {Object} oldStats
     * @param {Object} newStats
     * @returns {boolean}
     * @private
     */
    _statsChanged(oldStats, newStats) {
        return (
            Math.abs(oldStats.hunger - newStats.hunger) > 0.01 ||
            Math.abs(oldStats.thirst - newStats.thirst) > 0.01 ||
            Math.abs(oldStats.energy - newStats.energy) > 0.01
        );
    }

    /**
     * 检查警告阈值
     * @param {Object} stats
     * @private
     */
    _checkWarnings(stats) {
        const warningThreshold = SURVIVAL_CONFIG.WARNING_THRESHOLD;

        const checkStat = (statName, statValue) => {
            const isLow = statValue <= warningThreshold;
            const wasLow = this._lastWarningState[statName];

            if (isLow && !wasLow) {
                this._emit('lowWarning', { stat: statName, value: statValue });
            }

            this._lastWarningState[statName] = isLow;
        };

        checkStat('hunger', stats.hunger);
        checkStat('thirst', stats.thirst);
        checkStat('energy', stats.energy);
    }

    /**
     * 检查游戏结束条件
     * @param {Object} stats
     * @private
     */
    _checkGameOver(stats) {
        let reason = null;

        if (stats.hunger <= SURVIVAL_CONFIG.MIN_VALUE) {
            reason = 'hunger';
        } else if (stats.thirst <= SURVIVAL_CONFIG.MIN_VALUE) {
            reason = 'thirst';
        }

        if (reason) {
            this._emit('gameOver', { reason });
            const reasonText = reason === 'hunger' ? '饥饿' : '口渴';
            gameManager.triggerDefeat(reasonText);
        }
    }

    // ==================== 消耗食物 ====================

    /**
     * 消耗食物/资源，恢复生存数值
     * @param {string} resourceType - 资源类型
     * @returns {boolean} 是否成功消耗
     */
    consume(resourceType) {
        const player = gameManager.getPlayer();
        if (!player) return false;

        // 检查玩家是否有该物品
        if (!player.hasItem(resourceType)) return false;

        // 获取食物数值
        const values = FOOD_VALUES[resourceType];
        if (!values) return false;

        // 消耗物品
        player.removeItem(resourceType, 1);

        // 记录变化前的数值
        const oldStats = { ...player.stats };

        // 增加数值
        player.stats.hunger = Math.min(SURVIVAL_CONFIG.MAX_VALUE, player.stats.hunger + values.hunger);
        player.stats.thirst = Math.min(SURVIVAL_CONFIG.MAX_VALUE, player.stats.thirst + values.thirst);
        player.stats.energy = Math.min(SURVIVAL_CONFIG.MAX_VALUE, player.stats.energy + values.energy);

        // 触发事件
        this._emit('statChange', { oldStats, newStats: { ...player.stats } });
        this._emit('consume', { resourceType, values });

        return true;
    }

    /**
     * 检查某物品是否可食用
     * @param {string} resourceType
     * @returns {boolean}
     */
    isEdible(resourceType) {
        return !!FOOD_VALUES[resourceType];
    }

    // ==================== 休息恢复 ====================

    /**
     * 休息恢复体力
     * @param {number} amount - 恢复量
     * @returns {boolean} 是否成功休息
     */
    rest(amount = 20) {
        const player = gameManager.getPlayer();
        if (!player || !player.stats) return false;

        const oldStats = { ...player.stats };
        player.stats.energy = Math.min(SURVIVAL_CONFIG.MAX_VALUE, player.stats.energy + amount);

        this._emit('statChange', { oldStats, newStats: { ...player.stats } });
        this._emit('rest', { amount });

        return true;
    }

    /**
     * 睡眠（长时间休息，恢复更多体力，但消耗饥饿和口渴）
     * @param {number} energyGain - 体力恢复量
     * @param {number} hungerCost - 饥饿消耗量
     * @param {number} thirstCost - 口渴消耗量
     * @returns {boolean}
     */
    sleep(energyGain = 50, hungerCost = 10, thirstCost = 15) {
        const player = gameManager.getPlayer();
        if (!player || !player.stats) return false;

        const oldStats = { ...player.stats };

        player.stats.energy = Math.min(SURVIVAL_CONFIG.MAX_VALUE, player.stats.energy + energyGain);
        player.stats.hunger = Math.max(SURVIVAL_CONFIG.MIN_VALUE, player.stats.hunger - hungerCost);
        player.stats.thirst = Math.max(SURVIVAL_CONFIG.MIN_VALUE, player.stats.thirst - thirstCost);

        this._emit('statChange', { oldStats, newStats: { ...player.stats } });
        this._emit('sleep', { energyGain, hungerCost, thirstCost });

        // 检查游戏结束
        this._checkGameOver(player.stats);

        return true;
    }

    // ==================== 体力消耗（行动时调用） ====================

    /**
     * 消耗体力（用于采集、建造等行动）
     * @param {number} amount - 消耗量
     * @returns {boolean} 是否有足够体力
     */
    consumeEnergy(amount = 5) {
        const player = gameManager.getPlayer();
        if (!player || !player.stats) return false;

        if (player.stats.energy < amount) return false;

        const oldStats = { ...player.stats };
        player.stats.energy -= amount;

        this._emit('statChange', { oldStats, newStats: { ...player.stats } });
        this._checkWarnings(player.stats);

        return true;
    }

    /**
     * 获取速度倍率（受体力影响）
     * @returns {number} 速度倍率（0.5 - 1.0）
     */
    getSpeedModifier() {
        const player = gameManager.getPlayer();
        if (!player || !player.stats) return 1;

        const energy = player.stats.energy;
        const threshold = SURVIVAL_CONFIG.ENERGY_SPEED_PENALTY_THRESHOLD;
        const minMultiplier = SURVIVAL_CONFIG.MIN_SPEED_MULTIPLIER;

        if (energy >= threshold) {
            return 1;
        }

        // 线性插值：在阈值以下速度逐渐降低
        const t = energy / threshold;
        return minMultiplier + (1 - minMultiplier) * t;
    }

    // ==================== 数值查询 ====================

    /**
     * 获取当前生存数值
     * @returns {{hunger: number, thirst: number, energy: number}}
     */
    getStats() {
        const player = gameManager.getPlayer();
        if (!player || !player.stats) {
            return { hunger: 100, thirst: 100, energy: 100 };
        }
        return { ...player.stats };
    }

    /**
     * 检查是否处于危险状态
     * @returns {boolean}
     */
    isInDanger() {
        const stats = this.getStats();
        return (
            stats.hunger <= SURVIVAL_CONFIG.DANGER_THRESHOLD ||
            stats.thirst <= SURVIVAL_CONFIG.DANGER_THRESHOLD
        );
    }

    /**
     * 检查指定数值是否低于警告阈值
     * @param {string} statName - hunger / thirst / energy
     * @returns {boolean}
     */
    isLow(statName) {
        const stats = this.getStats();
        return stats[statName] <= SURVIVAL_CONFIG.WARNING_THRESHOLD;
    }

    /**
     * 初始化玩家生存数值
     * @param {Object} player - 玩家对象
     */
    initPlayerStats(player) {
        if (!player.stats) {
            player.stats = {};
        }
        player.stats.hunger = SURVIVAL_CONFIG.MAX_VALUE;
        player.stats.thirst = SURVIVAL_CONFIG.MAX_VALUE;
        player.stats.energy = SURVIVAL_CONFIG.MAX_VALUE;
    }

    // ==================== 事件系统 ====================

    /**
     * 注册事件监听
     * @param {string} eventName - 事件名：statChange, lowWarning, gameOver, consume, rest, sleep
     * @param {Function} callback - 回调函数
     */
    on(eventName, callback) {
        if (this._eventListeners[eventName]) {
            this._eventListeners[eventName].push(callback);
        }
    }

    /**
     * 移除事件监听
     * @param {string} eventName
     * @param {Function} callback
     */
    off(eventName, callback) {
        const listeners = this._eventListeners[eventName];
        if (!listeners) return;
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * 触发事件
     * @param {string} eventName
     * @param {*} data
     * @private
     */
    _emit(eventName, data) {
        const listeners = this._eventListeners[eventName];
        if (!listeners) return;
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error(`SurvivalSystem 事件回调错误 [${eventName}]:`, e);
            }
        });
    }
}

// 全局单例
window.survivalSystem = new SurvivalSystem();

})();
