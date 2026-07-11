/* ==================== 工具函数 ==================== */
const Utils = {
    // 高斯随机数（Box-Muller 变换）
    gaussianRandom(mean, stddev) {
        mean = mean || 0;
        stddev = stddev || 1;
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z * stddev + mean;
    },

    // 限制范围
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    // 线性插值
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    // 两点距离
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    // 角度转弧度
    degToRad(deg) {
        return deg * Math.PI / 180;
    },

    // 格式化数字（保留小数）
    formatNum(val, digits) {
        digits = digits !== undefined ? digits : 1;
        return Number(val).toFixed(digits);
    },

    // 颜色插值（hex）
    lerpColor(c1, c2, t) {
        const r1 = parseInt(c1.slice(1, 3), 16);
        const g1 = parseInt(c1.slice(3, 5), 16);
        const b1 = parseInt(c1.slice(5, 7), 16);
        const r2 = parseInt(c2.slice(1, 3), 16);
        const g2 = parseInt(c2.slice(3, 5), 16);
        const b2 = parseInt(c2.slice(5, 7), 16);
        const r = Math.round(Utils.lerp(r1, r2, t));
        const g = Math.round(Utils.lerp(g1, g2, t));
        const b = Math.round(Utils.lerp(b1, b2, t));
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    },

    // 简单 Perlin-like noise（基于正弦叠加）
    noise(x, y, t) {
        return (
            Math.sin(x * 0.8 + t * 0.5) * 0.5 +
            Math.sin(y * 1.2 + t * 0.3) * 0.3 +
            Math.sin((x + y) * 0.6 + t * 0.7) * 0.2
        );
    },

    // 评分等级
    getGrade(score) {
        if (score >= 95) return { text: 'S', color: '#ffe66d' };
        if (score >= 85) return { text: 'A', color: '#05ffa1' };
        if (score >= 70) return { text: 'B', color: '#00f0ff' };
        if (score >= 50) return { text: 'C', color: '#bc13fe' };
        return { text: 'D', color: '#ff2a6d' };
    },

    // 评分条颜色等级
    getBarClass(score) {
        if (score >= 80) return 'good';
        if (score >= 50) return 'warn';
        return 'bad';
    }
};
