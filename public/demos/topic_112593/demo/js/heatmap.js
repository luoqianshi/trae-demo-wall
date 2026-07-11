/* ==================== 热力图渲染 ==================== */
const Heatmap = {
    grid: null,       // 二维数组，记录准星停留时间
    gridSize: 4,      // 每个格子像素大小
    gridW: 0,
    gridH: 0,
    maxVal: 1,

    // 初始化
    init(width, height) {
        this.gridW = Math.ceil(width / this.gridSize);
        this.gridH = Math.ceil(height / this.gridSize);
        this.grid = [];
        for (let y = 0; y < this.gridH; y++) {
            this.grid[y] = new Float32Array(this.gridW);
        }
        this.maxVal = 1;
    },

    // 重置
    reset(width, height) {
        this.init(width, height);
    },

    // 记录准星位置
    record(x, y) {
        const gx = Math.floor(x / this.gridSize);
        const gy = Math.floor(y / this.gridSize);
        if (gx >= 0 && gx < this.gridW && gy >= 0 && gy < this.gridH) {
            this.grid[gy][gx] += 1;
            if (this.grid[gy][gx] > this.maxVal) {
                this.maxVal = this.grid[gy][gx];
            }
        }
    },

    // 绘制热力图
    // ctx: Canvas 2D 上下文
    // width, height: 画布尺寸
    draw(ctx, width, height) {
        if (!this.grid) return;
        ctx.save();

        for (let gy = 0; gy < this.gridH; gy++) {
            for (let gx = 0; gx < this.gridW; gx++) {
                const val = this.grid[gy][gx];
                if (val <= 0) continue;

                const ratio = val / this.maxVal;
                const color = this.getColor(ratio);
                const px = gx * this.gridSize;
                const py = gy * this.gridSize;

                ctx.fillStyle = color;
                ctx.globalAlpha = Math.min(1, ratio * 1.5);
                ctx.fillRect(px, py, this.gridSize, this.gridSize);
            }
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    },

    // 根据值获取颜色（青→紫→粉）
    getColor(ratio) {
        if (ratio < 0.33) {
            return Utils.lerpColor('#00f0ff', '#bc13fe', ratio / 0.33);
        } else if (ratio < 0.66) {
            return Utils.lerpColor('#bc13fe', '#ff2a6d', (ratio - 0.33) / 0.33);
        } else {
            return Utils.lerpColor('#ff2a6d', '#ffe66d', (ratio - 0.66) / 0.34);
        }
    }
};
