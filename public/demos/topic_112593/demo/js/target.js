/* ==================== 靶纸渲染 ==================== */
const Target = {
    // 标准靶纸环数配置（从外到内）
    rings: [
        { num: 1, radius: 1.0,  color: '#ffffff', textColor: '#333333' },
        { num: 2, radius: 0.9,  color: '#ffffff', textColor: '#333333' },
        { num: 3, radius: 0.8,  color: '#ffffff', textColor: '#333333' },
        { num: 4, radius: 0.7,  color: '#333333', textColor: '#ffffff' },
        { num: 5, radius: 0.6,  color: '#333333', textColor: '#ffffff' },
        { num: 6, radius: 0.5,  color: '#333333', textColor: '#ffffff' },
        { num: 7, radius: 0.4,  color: '#00aaff', textColor: '#ffffff' },
        { num: 8, radius: 0.3,  color: '#00aaff', textColor: '#ffffff' },
        { num: 9, radius: 0.2,  color: '#ffcc00', textColor: '#333333' },
        { num: 10, radius: 0.1, color: '#ffcc00', textColor: '#333333' },
        { num: 'X', radius: 0.05, color: '#ffcc00', textColor: '#333333' }
    ],

    // 绘制靶纸
    // ctx: Canvas 2D 上下文
    // cx, cy: 靶心坐标
    // maxRadius: 靶纸最大半径
    draw(ctx, cx, cy, maxRadius) {
        // 靶纸底色（外圈白/黑背景）
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius + 4, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a22';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 绘制各环
        for (let i = 0; i < this.rings.length; i++) {
            const ring = this.rings[i];
            const r = Math.max(1, maxRadius * ring.radius);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = ring.color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // 绘制环数标记
        for (let i = 0; i < this.rings.length; i++) {
            const ring = this.rings[i];
            const r = Math.max(1, maxRadius * ring.radius);
            const labelR = i < this.rings.length - 1
                ? maxRadius * (ring.radius + this.rings[i + 1].radius) / 2
                : r / 2;

            if (ring.num === 'X') {
                // X 环中心十字
                ctx.strokeStyle = ring.textColor;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(cx - 4, cy);
                ctx.lineTo(cx + 4, cy);
                ctx.moveTo(cx, cy - 4);
                ctx.lineTo(cx, cy + 4);
                ctx.stroke();
            } else {
                ctx.fillStyle = ring.textColor;
                ctx.font = '9px Consolas, monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(ring.num), cx + labelR, cy);
            }
        }

        // 十字线
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - maxRadius - 4, cy);
        ctx.lineTo(cx + maxRadius + 4, cy);
        ctx.moveTo(cx, cy - maxRadius - 4);
        ctx.lineTo(cx, cy + maxRadius + 4);
        ctx.stroke();

        ctx.restore();
    },

    // 根据弹着点位置计算环数
    // x, y: 弹着点坐标
    // cx, cy: 靶心坐标
    // maxRadius: 靶纸最大半径
    getScore(x, y, cx, cy, maxRadius) {
        const dist = Utils.distance(x, y, cx, cy);
        const ratio = dist / maxRadius;

        if (ratio <= 0.05) return { ring: 'X', score: 10.9 };
        for (let i = 0; i < this.rings.length - 1; i++) {
            const outerR = this.rings[i].radius;
            const innerR = this.rings[i + 1].radius;
            if (ratio <= outerR && ratio > innerR) {
                return { ring: this.rings[i].num, score: this.rings[i].num };
            }
        }
        return { ring: 0, score: 0 };
    },

    // 绘制弹着点标记
    drawImpact(ctx, x, y, score) {
        ctx.save();
        const grade = Utils.getGrade(score);

        // 外圈光晕
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 42, 109, 0.15)';
        ctx.fill();

        // 十字标记
        ctx.strokeStyle = '#ff2a6d';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ff2a6d';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x - 4, y);
        ctx.lineTo(x + 4, y);
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x, y + 4);
        ctx.stroke();

        // 中心点
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff2a6d';
        ctx.fill();

        // 环数标签
        ctx.shadowBlur = 0;
        ctx.font = 'bold 10px Consolas, monospace';
        ctx.fillStyle = grade.color;
        ctx.textAlign = 'left';
        ctx.fillText(String(score), x + 8, y - 4);

        ctx.restore();
    },

    // 绘制散布圆
    drawSpreadCircle(ctx, impacts, cx, cy) {
        if (impacts.length < 2) return;
        let maxDist = 0;
        for (const imp of impacts) {
            const d = Utils.distance(imp.x, imp.y, cx, cy);
            if (d > maxDist) maxDist = d;
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, maxDist, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(188, 19, 254, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 散布半径标注
        ctx.font = '9px Consolas, monospace';
        ctx.fillStyle = '#bc13fe';
        ctx.textAlign = 'center';
        ctx.fillText('R=' + Utils.formatNum(maxDist, 0) + 'px', cx, cy - maxDist - 6);
        ctx.restore();
    }
};
