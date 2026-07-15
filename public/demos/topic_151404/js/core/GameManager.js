/**
 * Tom孤岛生存 - 游戏管理器
 * 负责管理游戏全局状态、难度、统计数据，以及各个系统之间的协调
 */

(function() {

const { DIFFICULTY, DIFFICULTY_CONFIG, GAME_STATE, TIME_CONFIG } = window.Constants;

class GameManager {
    constructor() {
        // 游戏当前状态
        this.gameState = GAME_STATE.MENU;

        // 当前难度
        this.difficulty = DIFFICULTY.NORMAL;

        // 玩家引用（由游戏场景设置）
        this.player = null;

        // 游戏地图引用（由游戏场景设置）
        this.gameMap = null;

        // 统计数据
        this.stats = {
            totalResourcesCollected: 0,      // 采集资源总数
            totalItemsCrafted: 0,            // 合成物品总数
            survivalTime: 0,                 // 生存时间（游戏小时）
            eventsTriggered: 0,              // 触发事件次数
            driftItemsCollected: 0,          // 收集漂流物资数
            buildingsBuilt: 0                // 建造建筑数
        };

        // 事件回调列表
        this._eventListeners = {};
    }

    /**
     * 初始化游戏管理器
     * @param {string} difficulty - 难度等级
     */
    init(difficulty = DIFFICULTY.NORMAL) {
        this.difficulty = difficulty;
        this.gameState = GAME_STATE.PLAYING;
        this.resetStats();
    }

    /**
     * 重置统计数据
     */
    resetStats() {
        this.stats = {
            totalResourcesCollected: 0,
            totalItemsCrafted: 0,
            survivalTime: 0,
            eventsTriggered: 0,
            driftItemsCollected: 0,
            buildingsBuilt: 0
        };
    }

    /**
     * 获取当前难度配置
     * @returns {Object} 难度配置对象
     */
    getDifficultyConfig() {
        return DIFFICULTY_CONFIG[this.difficulty] || DIFFICULTY_CONFIG[DIFFICULTY.NORMAL];
    }

    /**
     * 获取时间比例（现实秒转游戏小时的转换率）
     * @returns {number} 时间比例
     */
    getTimeRatio() {
        const config = this.getDifficultyConfig();
        // 现实时长（秒） / 游戏时长（小时） = 每游戏小时对应多少现实秒
        const realSeconds = config.realTimeHours * 3600;
        const gameHours = config.gameTimeHours;
        // 返回每秒对应多少游戏小时
        return gameHours / realSeconds;
    }

    /**
     * 设置游戏状态
     * @param {string} state - 新的游戏状态
     */
    setGameState(state) {
        const oldState = this.gameState;
        this.gameState = state;
        this._emit('stateChange', { oldState, newState: state });
    }

    /**
     * 获取游戏状态
     * @returns {string} 当前游戏状态
     */
    getGameState() {
        return this.gameState;
    }

    /**
     * 检查游戏是否正在进行中
     * @returns {boolean}
     */
    isPlaying() {
        return this.gameState === GAME_STATE.PLAYING;
    }

    /**
     * 检查游戏是否已结束（胜利或失败）
     * @returns {boolean}
     */
    isGameOver() {
        return this.gameState === GAME_STATE.VICTORY || this.gameState === GAME_STATE.DEFEAT;
    }

    /**
     * 触发胜利
     */
    triggerVictory() {
        if (this.gameState === GAME_STATE.PLAYING) {
            this.setGameState(GAME_STATE.VICTORY);
            this._emit('victory', { stats: { ...this.stats } });
        }
    }

    /**
     * 触发失败
     * @param {string} reason - 失败原因
     */
    triggerDefeat(reason = 'unknown') {
        if (this.gameState === GAME_STATE.PLAYING) {
            this.setGameState(GAME_STATE.DEFEAT);
            this._emit('defeat', { reason, stats: { ...this.stats } });
        }
    }

    /**
     * 暂停游戏
     */
    pause() {
        if (this.gameState === GAME_STATE.PLAYING) {
            this.setGameState(GAME_STATE.PAUSED);
        }
    }

    /**
     * 继续游戏
     */
    resume() {
        if (this.gameState === GAME_STATE.PAUSED) {
            this.setGameState(GAME_STATE.PLAYING);
        }
    }

    /**
     * 增加采集资源统计
     * @param {number} amount - 数量
     */
    addResourceCollected(amount = 1) {
        this.stats.totalResourcesCollected += amount;
    }

    /**
     * 增加合成物品统计
     * @param {number} amount - 数量
     */
    addItemCrafted(amount = 1) {
        this.stats.totalItemsCrafted += amount;
    }

    /**
     * 增加触发事件统计
     * @param {number} amount - 数量
     */
    addEventTriggered(amount = 1) {
        this.stats.eventsTriggered += amount;
    }

    /**
     * 增加漂流物资收集统计
     * @param {number} amount - 数量
     */
    addDriftItemCollected(amount = 1) {
        this.stats.driftItemsCollected += amount;
    }

    /**
     * 增加建造建筑统计
     * @param {number} amount - 数量
     */
    addBuildingBuilt(amount = 1) {
        this.stats.buildingsBuilt += amount;
    }

    /**
     * 更新生存时间统计
     * @param {number} gameHours - 当前游戏小时数
     */
    updateSurvivalTime(gameHours) {
        this.stats.survivalTime = Math.max(this.stats.survivalTime, gameHours);
    }

    /**
     * 获取统计数据
     * @returns {Object} 统计数据副本
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * 设置玩家引用
     * @param {Object} player - 玩家对象
     */
    setPlayer(player) {
        this.player = player;
    }

    /**
     * 获取玩家引用
     * @returns {Object} 玩家对象
     */
    getPlayer() {
        return this.player;
    }

    /**
     * 设置地图引用
     * @param {Object} gameMap - 地图对象
     */
    setGameMap(gameMap) {
        this.gameMap = gameMap;
    }

    /**
     * 获取地图引用
     * @returns {Object} 地图对象
     */
    getGameMap() {
        return this.gameMap;
    }

    // ==================== 事件系统 ====================

    /**
     * 注册事件监听
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(eventName, callback) {
        if (!this._eventListeners[eventName]) {
            this._eventListeners[eventName] = [];
        }
        this._eventListeners[eventName].push(callback);
    }

    /**
     * 移除事件监听
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(eventName, callback) {
        if (!this._eventListeners[eventName]) return;
        const index = this._eventListeners[eventName].indexOf(callback);
        if (index > -1) {
            this._eventListeners[eventName].splice(index, 1);
        }
    }

    /**
     * 触发事件
     * @param {string} eventName - 事件名称
     * @param {*} data - 事件数据
     * @private
     */
    _emit(eventName, data) {
        if (!this._eventListeners[eventName]) return;
        this._eventListeners[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error(`GameManager 事件回调错误 [${eventName}]:`, e);
            }
        });
    }
}

// 全局单例
window.gameManager = new GameManager();

})();
