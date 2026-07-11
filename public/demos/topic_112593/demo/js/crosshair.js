/* ==================== 准星渲染 ==================== */
const Crosshair = {
    // 绘制准星
    // ctx: Canvas 2D 上下文
    // x, y: 准星位置
    // size: 准星大小
    // isStable: 是否处于稳定状态
    draw(ctx, x, y, size, isStable) {
        size = size || 20;
        ctx.save();

        const color = isStable ? '#05ffa1' : '#00f0ff';
        const glowSize = isStable ? 15 : 10;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = glowSize;

        // 外圈
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();

        // 十字线（带缺口）
        const gap = 6;
        const len = size + 8;

        ctx.beginPath();
        // 上
        ctx.moveTo(x, y - gap);
        ctx.lineTo(x, y - len);
        // 下
        ctx.moveTo(x, y + gap);
        ctx.lineTo(x, y + len);
        // 左
        ctx.moveTo(x - gap, y);
        ctx.lineTo(x - len, y);
        // 右
        ctx.moveTo(x + gap, y);
        ctx.lineTo(x + len, y);
        ctx.stroke();

        // 中心点
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // 刻度线（每 45 度）
        ctx.lineWidth = 0.5;
        ctx.shadowBlur = 0;
        for (let angle = 45; angle < 360; angle += 90) {
            const rad = Utils.degToRad(angle);
            const innerR = size - 3;
            const outerR = size + 2;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(rad) * innerR, y + Math.sin(rad) * innerR);
            ctx.lineTo(x + Math.cos(rad) * outerR, y + Math.sin(rad) * outerR);
            ctx.stroke();
        }

        ctx.restore();
    },

    // 绘制激光脉冲动画
    // ctx: Canvas 2D 上下文
    // x, y: 击发位置
    // progress: 动画进度 0~1
    drawLaserPulse(ctx, x, y, progress) {
        ctx.save();

        // 中心亮点
        const coreAlpha = 1 - progress;
        const coreRadius = Math.max(1, 3 - progress * 2);
        ctx.beginPath();
        ctx.arc(x, y, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 42, 109, ' + coreAlpha + ')';
        ctx.shadowColor = '#ff2a6d';
        ctx.shadowBlur = 20 * coreAlpha;
        ctx.fill();

        // 径向扩散环
        const ringRadius = 5 + progress * 40;
        const ringAlpha = (1 - progress) * 0.6;
        ctx.beginPath();
        ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 42, 109, ' + ringAlpha + ')';
        ctx.lineWidth = 2 * (1 - progress);
        ctx.shadowBlur = 10 * (1 - progress);
        ctx.stroke();

        // 第二扩散环（延迟）
        if (progress > 0.2) {
            const p2 = (progress - 0.2) / 0.8;
            const r2 = 5 + p2 * 30;
            ctx.beginPath();
            ctx.arc(x, y, r2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 240, 255, ' + ((1 - p2) * 0.3) + ')';
            ctx.lineWidth = 1;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 6 * (1 - p2);
            ctx.stroke();
        }

        ctx.restore();
    },

    // 绘制准星轨迹线
    // ctx: Canvas 2D 上下文
    // trail: 轨迹点数组 [{x, y, t}]
    // maxLength: 最大显示长度
    drawTrail(ctx, trail, maxLength) {
        if (trail.length < 2) return;
        maxLength = maxLength || 60;
        const start = Math.max(0, trail.length - maxLength);

        ctx.save();
        for (let i = start + 1; i < trail.length; i++) {
            const alpha = (i - start) / (trail.length - start) * 0.4;
            ctx.beginPath();
            ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
            ctx.lineTo(trail[i].x, trail[i].y);
            ctx.strokeStyle = 'rgba(0, 240, 255, ' + alpha + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }
        ctx.restore();
    }
};
