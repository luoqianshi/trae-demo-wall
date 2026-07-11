/* ==================== 射击系统 ==================== */
const Shooting = {
    maxAmmo: 10,
    ammo: 10,
    shots: [],           // 所有射击记录 [{x, y, impactX, impactY, score, ring, time, stability, speed}]
    impacts: [],         // 弹着点 [{x, y, score}]
    isFiring: false,
    fireProgress: 0,
    firePos: null,

    // 击发
    fire(aimX, aimY, stability, speed, spread) {
        if (this.ammo <= 0 || this.isFiring) return null;

        this.ammo--;
        this.isFiring = true;
        this.fireProgress = 0;
        this.firePos = { x: aimX, y: aimY };

        // 生成弹着点（激光射击：弹着点紧贴激光位置，散布极小）
        const baseSpread = (100 - stability) * (spread || 0.02);
        const impactX = aimX + Utils.gaussianRandom(0, baseSpread);
        const impactY = aimY + Utils.gaussianRandom(0, baseSpread);

        // 计算环数（由外部根据靶纸参数计算）
        const shot = {
            aimX: aimX,
            aimY: aimY,
            impactX: impactX,
            impactY: impactY,
            score: 0,  // 由外部设置
            ring: 0,
            time: performance.now(),
            stability: stability,
            speed: speed
        };

        this.shots.push(shot);
        this.impacts.push({ x: impactX, y: impactY, score: 0 });

        return shot;
    },

    // 更新击发动画
    update(dt) {
        if (!this.isFiring) return;
        this.fireProgress += dt * 4; // 0.25 秒动画
        if (this.fireProgress >= 1) {
            this.fireProgress = 1;
            this.isFiring = false;
        }
    },

    // 重置
    reset() {
        this.ammo = this.maxAmmo;
        this.shots = [];
        this.impacts = [];
        this.isFiring = false;
        this.fireProgress = 0;
        this.firePos = null;
    },

    // 是否弹匣打空
    isEmpty() {
        return this.ammo <= 0;
    },

    // 获取最近 N 发的总分
    getRecentScore(n) {
        const recent = this.shots.slice(-n);
        return recent.reduce((sum, s) => sum + s.score, 0);
    },

    // 获取平均分
    getAverageScore() {
        if (this.shots.length === 0) return 0;
        return this.shots.reduce((sum, s) => sum + s.score, 0) / this.shots.length;
    }
};
