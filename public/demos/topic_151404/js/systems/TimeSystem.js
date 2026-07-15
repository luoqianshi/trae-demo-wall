/**
 * Tom孤岛生存 - 时间系统
 * 负责管理游戏时间流逝、昼夜循环，以及胜利条件判定
 */

(function() {

const gameManager = window.gameManager;
const { TIME_CONFIG } = window.Constants;

class TimeSystem {
    constructor() {
        // 当前游戏时间（游戏小时数）
        this.gameTime = TIME_CONFIG.FIRST_DAY_START_HOUR;

        // 目标生存时间（游戏小时数）
        this.targetTime = TIME_CONFIG.TARGET_SURVIVAL_HOURS;

        // 事件回调
        this._eventListeners = {
            dayChange: [],       // 天数变化
            hourChange: [],      // 小时变化
            dayNightChange: [],  // 昼夜切换
            victory: []          // 胜利
        };

        // 上一次的天和小时（用于检测变化）
        this._lastDay = 1;
        this._lastHour = TIME_CONFIG.FIRST_DAY_START_HOUR;
        this._lastIsDaytime = true;
    }

    /**
     * 重置时间系统
     * @param {number} startHour - 起始小时
     */
    reset(startHour = TIME_CONFIG.FIRST_DAY_START_HOUR) {
        this.gameTime = startHour;
        this._lastDay = this.getDayNumber();
        this._lastHour = this.getHourOfDay();
        this._lastIsDaytime = this.isDaytime();
    }

    /**
     * 更新时间系统
     * @param {number} dt - 帧间隔时间（秒）
     */
    update(dt) {
        if (!gameManager.isPlaying()) return;

        // 获取时间比例（每秒对应多少游戏小时）
        const timeRatio = gameManager.getTimeRatio();

        // 计算本帧增加的游戏小时数
        const hoursDelta = dt * timeRatio;

        // 更新游戏时间
        this.gameTime += hoursDelta;

        // 更新统计数据
        gameManager.updateSurvivalTime(this.gameTime);

        // 检测各种时间事件
        this._checkTimeEvents();

        // 检查胜利条件
        this._checkVictory();
    }

    /**
     * 检测时间相关事件
     * @private
     */
    _checkTimeEvents() {
        const currentDay = this.getDayNumber();
        const currentHour = Math.floor(this.getHourOfDay());
        const currentIsDaytime = this.isDaytime();

        // 检测天数变化
        if (currentDay !== this._lastDay) {
            this._lastDay = currentDay;
            this._emit('dayChange', { day: currentDay });
        }

        // 检测小时变化
        if (currentHour !== this._lastHour) {
            this._lastHour = currentHour;
            this._emit('hourChange', { hour: currentHour, day: currentDay });
        }

        // 检测昼夜变化
        if (currentIsDaytime !== this._lastIsDaytime) {
            this._lastIsDaytime = currentIsDaytime;
            this._emit('dayNightChange', {
                isDaytime: currentIsDaytime,
                day: currentDay,
                hour: currentHour
            });
        }
    }

    /**
     * 检查胜利条件
     * @private
     */
    _checkVictory() {
        if (this.gameTime >= this.targetTime) {
            gameManager.triggerVictory();
            this._emit('victory', { gameTime: this.gameTime });
        }
    }

    // ==================== 时间查询方法 ====================

    /**
     * 获取当前游戏时间（总小时数）
     * @returns {number}
     */
    getGameTime() {
        return this.gameTime;
    }

    /**
     * 获取当前是第几天
     * @returns {number}
     */
    getDayNumber() {
        return Math.floor(this.gameTime / TIME_CONFIG.HOURS_PER_DAY) + 1;
    }

    /**
     * 获取当天的小时数（0-23）
     * @returns {number}
     */
    getHourOfDay() {
        return this.gameTime % TIME_CONFIG.HOURS_PER_DAY;
    }

    /**
     * 获取当天的分钟数（0-59）
     * @returns {number}
     */
    getMinuteOfHour() {
        const hourFraction = this.getHourOfDay() - Math.floor(this.getHourOfDay());
        return Math.floor(hourFraction * 60);
    }

    /**
     * 检查是否是白天
     * @returns {boolean}
     */
    isDaytime() {
        const hour = this.getHourOfDay();
        return hour >= TIME_CONFIG.DAY_START_HOUR && hour < TIME_CONFIG.DAY_END_HOUR;
    }

    /**
     * 检查是否是夜晚
     * @returns {boolean}
     */
    isNighttime() {
        return !this.isDaytime();
    }

    /**
     * 获取昼夜进度（0=夜晚最暗，1=白天最亮）
     * 用于平滑过渡的昼夜效果
     * @returns {number} 0 到 1 之间的值
     */
    getDaylightProgress() {
        const hour = this.getHourOfDay();
        const dayStart = TIME_CONFIG.DAY_START_HOUR;
        const dayEnd = TIME_CONFIG.DAY_END_HOUR;

        // 日出过渡时间（2小时）
        const dawnDuration = 2;
        // 日落过渡时间（2小时）
        const duskDuration = 2;

        if (hour < dayStart - dawnDuration / 2) {
            // 深夜
            return 0;
        } else if (hour < dayStart + dawnDuration / 2) {
            // 日出
            return (hour - (dayStart - dawnDuration / 2)) / dawnDuration;
        } else if (hour < dayEnd - duskDuration / 2) {
            // 白天
            return 1;
        } else if (hour < dayEnd + duskDuration / 2) {
            // 日落
            return 1 - (hour - (dayEnd - duskDuration / 2)) / duskDuration;
        } else {
            // 夜晚
            return 0;
        }
    }

    /**
     * 检查是否胜利
     * @returns {boolean}
     */
    isVictory() {
        return this.gameTime >= this.targetTime;
    }

    /**
     * 获取剩余时间（游戏小时）
     * @returns {number}
     */
    getRemainingHours() {
        return Math.max(0, this.targetTime - this.gameTime);
    }

    /**
     * 获取格式化的时间字符串
     * @param {boolean} includeDay - 是否包含天数
     * @returns {string} 如 "第 1 天 06:30" 或 "06:30"
     */
    getTimeString(includeDay = true) {
        const day = this.getDayNumber();
        const hour = Math.floor(this.getHourOfDay());
        const minute = this.getMinuteOfHour();
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');

        if (includeDay) {
            return `第 ${day} 天 ${hourStr}:${minuteStr}`;
        }
        return `${hourStr}:${minuteStr}`;
    }

    /**
     * 获取进度百分比（0-100）
     * @returns {number}
     */
    getProgressPercent() {
        return Math.min(100, (this.gameTime / this.targetTime) * 100);
    }

    /**
     * 获取当前时间段描述
     * @returns {string} 凌晨/早晨/上午/中午/下午/傍晚/晚上/深夜
     */
    getTimeOfDayDescription() {
        const hour = Math.floor(this.getHourOfDay());
        if (hour >= 0 && hour < 5) return '深夜';
        if (hour >= 5 && hour < 7) return '黎明';
        if (hour >= 7 && hour < 11) return '上午';
        if (hour >= 11 && hour < 13) return '中午';
        if (hour >= 13 && hour < 17) return '下午';
        if (hour >= 17 && hour < 19) return '傍晚';
        if (hour >= 19 && hour < 22) return '晚上';
        return '深夜';
    }

    // ==================== 事件系统 ====================

    /**
     * 注册事件监听
     * @param {string} eventName - 事件名：dayChange, hourChange, dayNightChange, victory
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
                console.error(`TimeSystem 事件回调错误 [${eventName}]:`, e);
            }
        });
    }
}

// 全局单例
window.timeSystem = new TimeSystem();

})();
