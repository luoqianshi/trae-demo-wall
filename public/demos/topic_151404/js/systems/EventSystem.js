/**
 * Tom孤岛生存 - 事件系统
 * 负责管理游戏中的随机事件，如漂流物资刷新等
 */

(function() {

const gameManager = window.gameManager;
const { DRIFT_ITEMS, EVENT_TYPES, TERRAIN_TYPES } = window.Constants;

class EventSystem {
    constructor() {
        // 上一次检查事件的游戏时间（游戏分钟）
        this._lastEventCheckTime = 0;

        // 事件检查间隔（游戏分钟）
        this._eventCheckInterval = 10;

        // 漂流物资事件触发概率（每次检查）
        this._driftEventChance = 0.3;

        // 事件开始的游戏时间（游戏小时，第二天开始）
        this._eventStartHour = 24;

        // 已触发的事件计数
        this._eventCount = 0;

        // 事件回调
        this._eventListeners = {
            driftItem: [],    // 漂流物资事件
            eventTriggered: [] // 任意事件触发
        };

        // 资源生成回调（由游戏场景设置）
        this._spawnResourceCallback = null;
    }

    /**
     * 重置事件系统
     */
    reset() {
        this._lastEventCheckTime = 0;
        this._eventCount = 0;
    }

    /**
     * 更新事件系统
     * @param {number} gameTime - 当前游戏时间（游戏小时）
     */
    update(gameTime) {
        if (!gameManager.isPlaying()) return;

        // 事件在第二天才开始触发
        if (gameTime < this._eventStartHour) return;

        // 转换为游戏分钟
        const gameMinutes = gameTime * 60;

        // 检查是否到了下一个检查点
        if (gameMinutes - this._lastEventCheckTime >= this._eventCheckInterval) {
            this._lastEventCheckTime = gameMinutes;
            this._checkRandomEvents();
        }
    }

    /**
     * 检查随机事件
     * @private
     */
    _checkRandomEvents() {
        // 漂流物资事件
        if (Math.random() < this._driftEventChance) {
            this._triggerDriftItemEvent();
        }
    }

    /**
     * 触发漂流物资事件
     * @private
     */
    _triggerDriftItemEvent() {
        const gameMap = gameManager.getGameMap();
        if (!gameMap) return;

        // 获取沙滩位置列表
        const beachPositions = this._getBeachPositions(gameMap);
        if (beachPositions.length === 0) return;

        // 随机选择一个沙滩位置
        const pos = beachPositions[Math.floor(Math.random() * beachPositions.length)];

        // 随机选择一个漂流物品
        const itemType = DRIFT_ITEMS[Math.floor(Math.random() * DRIFT_ITEMS.length)];

        // 如果有资源生成回调，调用它
        if (this._spawnResourceCallback) {
            this._spawnResourceCallback(itemType, pos.x, pos.y, true);
        }

        // 更新统计
        this._eventCount++;
        gameManager.addEventTriggered();

        // 触发事件回调
        const eventData = {
            type: EVENT_TYPES.DRIFT_ITEM,
            itemType,
            position: pos,
            eventId: `drift_${Date.now()}`
        };

        this._emit('driftItem', eventData);
        this._emit('eventTriggered', eventData);

        console.log(`[事件系统] 漂流物资刷新: ${itemType} 位置: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`);
    }

    /**
     * 获取地图上所有沙滩位置
     * @param {Object} gameMap - 地图对象
     * @returns {Array<{x: number, y: number}>}
     * @private
     */
    _getBeachPositions(gameMap) {
        const positions = [];

        // 优先使用地图自带的方法
        if (typeof gameMap.getBeachPositions === 'function') {
            return gameMap.getBeachPositions();
        }

        // 备用方案：遍历地图格子
        if (gameMap.tiles && gameMap.width && gameMap.height) {
            for (let y = 0; y < gameMap.height; y++) {
                for (let x = 0; x < gameMap.width; x++) {
                    if (gameMap.tiles[y] && gameMap.tiles[y][x] === TERRAIN_TYPES.SAND) {
                        positions.push({ x: x + 0.5, y: y + 0.5 });
                    }
                }
            }
        }

        return positions;
    }

    // ==================== 配置方法 ====================

    /**
     * 设置资源生成回调
     * @param {Function} callback - 回调函数 (itemType, x, y, isDrift)
     */
    setSpawnResourceCallback(callback) {
        this._spawnResourceCallback = callback;
    }

    /**
     * 设置漂流物资事件触发概率
     * @param {number} chance - 概率值（0-1）
     */
    setDriftEventChance(chance) {
        this._driftEventChance = Math.max(0, Math.min(1, chance));
    }

    /**
     * 设置事件检查间隔
     * @param {number} minutes - 间隔（游戏分钟）
     */
    setEventCheckInterval(minutes) {
        this._eventCheckInterval = Math.max(1, minutes);
    }

    /**
     * 设置事件开始时间
     * @param {number} hours - 游戏小时
     */
    setEventStartHour(hours) {
        this._eventStartHour = Math.max(0, hours);
    }

    /**
     * 手动触发漂流物资事件（用于测试）
     * @returns {boolean} 是否成功触发
     */
    triggerDriftItemManually() {
        const gameMap = gameManager.getGameMap();
        if (!gameMap) return false;

        this._triggerDriftItemEvent();
        return true;
    }

    /**
     * 获取已触发事件数量
     * @returns {number}
     */
    getEventCount() {
        return this._eventCount;
    }

    /**
     * 获取漂流物资物品列表
     * @returns {string[]}
     */
    getDriftItemTypes() {
        return [...DRIFT_ITEMS];
    }

    // ==================== 事件系统 ====================

    /**
     * 注册事件监听
     * @param {string} eventName - 事件名：driftItem, eventTriggered
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
                console.error(`EventSystem 事件回调错误 [${eventName}]:`, e);
            }
        });
    }
}

// 全局单例
window.eventSystem = new EventSystem();

})();
