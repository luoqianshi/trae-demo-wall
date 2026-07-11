/* ==================== 射击距离系统 ==================== */
const DistanceSystem = {
    // 预设距离配置
    // sizeFactor: 靶纸大小因子（10m为基准1.0）
    // positionY: 靶纸Y位置（Canvas坐标，越小越靠上）
    // scoreFactor: 计分缩放因子（远距离同样散布得分更低）
    presets: {
        5:   { sizeFactor: 1.45, positionY: 0.44, scoreFactor: 0.6 },
        10:  { sizeFactor: 1.00, positionY: 0.44, scoreFactor: 1.0 },
        15:  { sizeFactor: 0.72, positionY: 0.44, scoreFactor: 1.4 },
        25:  { sizeFactor: 0.48, positionY: 0.44, scoreFactor: 2.2 }
    },

    // 当前距离（米）
    currentDistance: 10,

    init() {
        this.currentDistance = 10;
    },

    // 切换到指定距离
    switchTo(distance) {
        const d = parseFloat(distance);
        if (isNaN(d) || d <= 0) return;
        this.currentDistance = d;
        // 通知外部更新
        if (window.onDistanceChange) {
            window.onDistanceChange(d);
        }
    },

    // 获取靶纸大小因子
    getSizeFactor() {
        return this.presets[this.currentDistance]?.sizeFactor ?? 1.0;
    },

    // 获取靶纸Y位置因子
    getPositionY() {
        return this.presets[this.currentDistance]?.positionY ?? 0.46;
    },

    // 获取计分缩放因子（远距离同样散布得分更低）
    getScoreFactor() {
        return this.presets[this.currentDistance]?.scoreFactor ?? 1.0;
    },

    // 获取当前距离字符串
    getDistanceLabel() {
        return this.currentDistance + 'm';
    },

    reset() {
        this.currentDistance = 10;
        if (window.onDistanceChange) {
            window.onDistanceChange(10);
        }
    }
};
