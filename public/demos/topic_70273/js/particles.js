// 粒子效果模块

const ParticleSystem = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,
    colors: ['#c8553d', '#2d5f5d', '#e8b84a'], // 朱砂红、黛青、鹅黄
    
    // 初始化
    init() {
        this.canvas = document.getElementById('particles-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布尺寸
        this.resize();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.resize());
        
        // 创建粒子
        this.createParticles();
        
        // 开始动画循环
        this.animate();
    },
    
    // 调整画布尺寸
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    
    // 创建粒子
    createParticles() {
        const particleCount = 25; // 20-30个粒子
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 2, // 2-5px
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.3, // 0.3-0.8
                opacitySpeed: (Math.random() - 0.5) * 0.01
            });
        }
    },
    
    // 更新粒子位置
    updateParticles() {
        this.particles.forEach(particle => {
            // 更新位置
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // 更新透明度（浮动效果）
            particle.opacity += particle.opacitySpeed;
            if (particle.opacity <= 0.3 || particle.opacity >= 0.8) {
                particle.opacitySpeed *= -1;
            }
            
            // 边界处理（循环）
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
        });
    },
    
    // 绘制粒子
    drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fill();
        });
        
        this.ctx.globalAlpha = 1;
    },
    
    // 动画循环
    animate() {
        this.updateParticles();
        this.drawParticles();
        this.animationId = requestAnimationFrame(() => this.animate());
    },
    
    // 停止动画
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
};

// 导出粒子系统
window.ParticleSystem = ParticleSystem;
