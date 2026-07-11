/* ==================== 弹道轨迹渲染 ==================== */
const Trajectory = {
    // 绘制预计弹道轨迹
    // ctx: Canvas 2D 上下文
    // startX, startY: 准星位置（起点）
    // endX, endY: 预测弹着点
    // progress: 绘制进度 0~1（动画用）
    draw(ctx, startX, startY, endX, endY, progress) {
        progress = progress !== undefined ? progress : 1;
        ctx.save();

        // 控制点（模拟弹道弧线）
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2 - 15; // 弧度

        // 绘制虚线轨迹
        ctx.beginPath();
        ctx.moveTo(startX, startY);

        // 分段绘制以实现动画进度
        const steps = 30;
        const drawSteps = Math.floor(steps * progress);
        for (let i = 1; i <= drawSteps; i++) {
            const t = i / steps;
            const px = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
            const py = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;
            ctx.lineTo(px, py);
        }

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.setLineDash([]);

        // 沿轨迹的粒子效果
        if (progress > 0.1) {
            for (let i = 0; i < 5; i++) {
                const t = Math.min(1, progress - i * 0.05);
                if (t <= 0) continue;
                const px = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
                const py = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;
                const alpha = (1 - i / 5) * 0.6;
                ctx.beginPath();
                ctx.arc(px, py, 2 - i * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 240, 255, ' + alpha + ')';
                ctx.shadowBlur = 4;
                ctx.fill();
            }
        }

        // 预测弹着点标记
        if (progress >= 1) {
            ctx.beginPath();
            ctx.arc(endX, endY, 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.stroke();
            ctx.setLineDash([]);

            // 十字
            ctx.beginPath();
            ctx.moveTo(endX - 3, endY);
            ctx.lineTo(endX + 3, endY);
            ctx.moveTo(endX, endY - 3);
            ctx.lineTo(endX, endY + 3);
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 0.8;
            ctx.shadowBlur = 4;
            ctx.stroke();
        }

        ctx.restore();
    },

    // 绘制实际弹着点与预测点的对比
    // ctx: Canvas 2D 上下文
    // predictedX, predictedY: 预测位置
    // actualX, actualY: 实际位置
    drawComparison(ctx, predictedX, predictedY, actualX, actualY) {
        ctx.save();

        // 偏差连线
        ctx.beginPath();
        ctx.moveTo(predictedX, predictedY);
        ctx.lineTo(actualX, actualY);
        ctx.strokeStyle = 'rgba(188, 19, 254, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 偏差距离标注
        const dist = Utils.distance(predictedX, predictedY, actualX, actualY);
        const midX = (predictedX + actualX) / 2;
        const midY = (predictedY + actualY) / 2;
        ctx.font = '9px Consolas, monospace';
        ctx.fillStyle = '#bc13fe';
        ctx.textAlign = 'center';
        ctx.fillText('d=' + Utils.formatNum(dist, 1), midX, midY - 6);

        ctx.restore();
    }
};
