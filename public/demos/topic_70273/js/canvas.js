// Canvas 渲染模块

const CanvasRenderer = {
    canvas: null,
    ctx: null,
    
    // 初始化成品展示画布
    initFinishedFlower() {
        const container = document.getElementById('finishedFlower');
        if (!container) return;
        
        // 创建 canvas
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    },
    
    // 绘制成品绒花
    drawFinishedFlower() {
        if (!this.ctx) return;
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        
        ctx.clearRect(0, 0, w, h);
        
        const state = AppState.getSnapshot();
        const color = state.silkColor || '#c8553d';
        const shape = state.furShape || 'round';
        
        // 绘制花枝
        this.drawBranch(ctx, cx, cy + 60);
        
        // 绘制叶子
        this.drawLeaves(ctx, cx, cy + 80, state.leaves.length);
        
        // 绘制花瓣
        this.drawPetals(ctx, cx, cy, color, shape);
        
        // 绘制花蕊
        this.drawPistil(ctx, cx, cy);
        
        // 添加庆祝动画
        const finishedEl = document.getElementById('finishedFlower');
        if (finishedEl) {
            finishedEl.classList.add('celebrating');
        }
    },
    
    // 绘制花枝
    drawBranch(ctx, x, y) {
        ctx.save();
        ctx.strokeStyle = '#6b4a2b';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 100);
        ctx.stroke();
        
        // 花枝纹理
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 2, y + 20);
        ctx.lineTo(x - 2, y + 80);
        ctx.stroke();
        
        ctx.restore();
    },
    
    // 绘制叶子（直接使用🍃 emoji，与组合页面完全一致）
    drawLeaves(ctx, x, y, count) {
        ctx.save();

        const leafPositions = [
            { x: x - 35, y: y + 20, angle: -30, flipX: false },
            { x: x + 35, y: y + 40, angle: 30, flipX: true }
        ];

        leafPositions.slice(0, count).forEach(pos => {
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(pos.angle * Math.PI / 180);
            if (pos.flipX) {
                ctx.scale(-1, 1);
            }

            ctx.font = '48px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🍃', 0, 0);

            ctx.restore();
        });

        ctx.restore();
    },
    
    // 绘制花瓣
    drawPetals(ctx, cx, cy, color, shape) {
        ctx.save();
        
        const petalCount = 8;
        const radius = 50;
        
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle + Math.PI / 2);
            
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.9;
            
            if (shape === 'round') {
                // 圆形花瓣
                ctx.beginPath();
                ctx.ellipse(0, 0, 18, 28, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (shape === 'pointed') {
                // 尖形花瓣 - 水滴状
                ctx.beginPath();
                ctx.moveTo(0, -30);
                ctx.bezierCurveTo(15, -15, 15, 15, 0, 30);
                ctx.bezierCurveTo(-15, 15, -15, -15, 0, -30);
                ctx.fill();
            } else if (shape === 'wavy') {
                // 波浪形花瓣 - 星形
                ctx.beginPath();
                for (let j = 0; j < 5; j++) {
                    const petalAngle = (j / 5) * Math.PI * 2 - Math.PI / 2;
                    const outerX = Math.cos(petalAngle) * 28;
                    const outerY = Math.sin(petalAngle) * 28;
                    const innerAngle = ((j + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
                    const innerX = Math.cos(innerAngle) * 15;
                    const innerY = Math.sin(innerAngle) * 15;
                    
                    if (j === 0) {
                        ctx.moveTo(outerX, outerY);
                    } else {
                        ctx.lineTo(outerX, outerY);
                    }
                    ctx.lineTo(innerX, innerY);
                }
                ctx.closePath();
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        ctx.restore();
    },
    
    // 绘制花蕊
    drawPistil(ctx, cx, cy) {
        ctx.save();
        
        // 外圈
        ctx.fillStyle = '#e8b84a';
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // 内圈
        ctx.fillStyle = '#d4a43a';
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 花蕊点
        ctx.fillStyle = '#c89030';
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = cx + Math.cos(angle) * 6;
            const y = cy + Math.sin(angle) * 6;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    },
    
    // 导出为图片
    exportAsImage() {
        if (!this.canvas) return null;
        
        const link = document.createElement('a');
        link.download = 'my-ronghua.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
};

// 导出 Canvas 渲染器
window.CanvasRenderer = CanvasRenderer;
